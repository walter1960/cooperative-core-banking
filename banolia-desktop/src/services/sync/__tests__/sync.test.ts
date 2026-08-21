import { describe, it, expect, beforeEach } from 'vitest';
import { SyncEngine } from '../SyncEngine';
import { BanoliaDatabase } from '../../../db/database';
import { seedDatabase } from '../../../db/seed';

describe('Bidirectional Sync Engine Unit & Integration Tests', () => {
  let testDb: BanoliaDatabase;

  beforeEach(async () => {
    testDb = new BanoliaDatabase(`test_sync_db_${Date.now()}`);
    await testDb.open();
    await seedDatabase(testDb);
  });

  describe('Exponential Backoff & Jitter Calculation', () => {
    it('should scale exponentially with retries and stay within maximum backoff boundary', () => {
      const backoff0 = SyncEngine.calculateBackoffMs(0); // ~2s + jitter
      const backoff1 = SyncEngine.calculateBackoffMs(1); // ~4s + jitter
      const backoff2 = SyncEngine.calculateBackoffMs(2); // ~8s + jitter
      const backoff10 = SyncEngine.calculateBackoffMs(10); // Capped at 120s + jitter

      expect(backoff0).toBeGreaterThanOrEqual(2000);
      expect(backoff0).toBeLessThan(3500);

      expect(backoff1).toBeGreaterThanOrEqual(4000);
      expect(backoff1).toBeLessThan(5500);

      expect(backoff2).toBeGreaterThanOrEqual(8000);
      expect(backoff2).toBeLessThan(9500);

      expect(backoff10).toBeGreaterThanOrEqual(120000);
      expect(backoff10).toBeLessThanOrEqual(121000);
    });
  });

  describe('Outbox Queue Management & Batch Replay', () => {
    it('should enqueue mutations into outbox and retrieve pending items', async () => {
      const enqueued = await SyncEngine.enqueue({
        entityType: 'TRANSACTION',
        entityId: 'tx-test-999',
        payload: { amount: 25000, type: 'DEPOSIT' },
        priority: 1
      }, testDb);

      expect(enqueued.status).toBe('PENDING');
      expect(enqueued.idempotencyKey).toMatch(/^idemp_A02_\d+_/);

      const pending = await SyncEngine.getPendingQueue(10, testDb);
      expect(pending.length).toBeGreaterThanOrEqual(1);
    });

    it('should successfully acknowledge and sync pending outbox items upon batch replay', async () => {
      await SyncEngine.enqueue({
        entityType: 'TRANSACTION',
        entityId: 'tx-001',
        payload: { amount: 50000, type: 'DEPOSIT' },
        priority: 1
      }, testDb);

      const result = await SyncEngine.replayBatch({ customDb: testDb, simulateFailures: false });

      expect(result.processedCount).toBeGreaterThanOrEqual(1);
      expect(result.succeededCount).toBeGreaterThanOrEqual(1);
      expect(result.failedCount).toBe(0);

      // Verify queue item is marked ACKNOWLEDGED
      const remainingPending = await SyncEngine.getPendingQueue(10, testDb);
      expect(remainingPending).toHaveLength(0);

      // Underlying transaction is marked SYNCED
      const tx = await testDb.transactions.get('tx-001');
      if (tx) {
        expect(tx.syncStatus).toBe('SYNCED');
      }
    });

    it('should mark items as FAILED_RETRY on connection failures', async () => {
      await SyncEngine.enqueue({
        entityType: 'TRANSACTION',
        entityId: 'tx-fail-001',
        payload: { amount: 10000, type: 'WITHDRAWAL' },
        priority: 1
      }, testDb);

      const result = await SyncEngine.replayBatch({ customDb: testDb, simulateFailures: true });

      expect(result.failedCount).toBeGreaterThanOrEqual(1);

      const queueItem = await testDb.syncQueue.where('entityId').equals('tx-fail-001').first();
      expect(queueItem?.status).toBe('FAILED_RETRY');
      expect(queueItem?.retryCount).toBe(1);
    });
  });

  describe('Delta Updates & Conflict Merges', () => {
    it('should apply server delta account balance updates', async () => {
      await SyncEngine.applyDeltaUpdates({
        accounts: [
          {
            accountNumber: '25121100A020022501',
            realBalance: 350000,
            availableBalance: 350000
          }
        ]
      }, testDb);

      const updatedAcc = await testDb.accounts.where('accountNumber').equals('25121100A020022501').first();
      expect(updatedAcc?.realBalance).toBe(350000);
      expect(updatedAcc?.availableBalance).toBe(350000);
    });

    it('should prioritize physical cash teller authority in conflict resolution', () => {
      const conflictRes = SyncEngine.resolveConflict({
        entityType: 'TRANSACTION',
        localPayload: { amount: 50000, type: 'WITHDRAWAL' },
        remoteState: { availableBalance: 20000 }
      });

      expect(conflictRes.resolution).toBe('LOCAL_WINS');
    });

    it('should merge member master metadata using field-level LWW', () => {
      const conflictRes = SyncEngine.resolveConflict({
        entityType: 'MEMBER_ENROLLMENT',
        localPayload: { phone: '90129999' },
        remoteState: { address: 'Nouveau Quartier Lomé' }
      });

      expect(conflictRes.resolution).toBe('MERGE');
      expect(conflictRes.mergedState.phone).toBe('90129999');
      expect(conflictRes.mergedState.address).toBe('Nouveau Quartier Lomé');
    });
  });
});
