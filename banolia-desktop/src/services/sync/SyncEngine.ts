import { db, BanoliaDatabase } from '../../db/database';
import { DbOfflineSyncQueue, DbTransaction, DbAccount, DbMember } from '../../types/database';
import { SyncBatchRequest, SyncBatchResponse, OutboxEntityType } from '../../types/sync';
import { CryptoService } from '../crypto/CryptoService';

export class SyncEngine {
  private static readonly BASE_BACKOFF_SEC = 2;
  private static readonly MAX_BACKOFF_SEC = 120;
  private static readonly MAX_RETRIES = 10;
  private static readonly JITTER_MS = 1000;

  /**
   * Calculates exponential backoff with randomized jitter
   * T_wait = min(120s, 2s * 2^retries) + rand(0, 1000ms)
   */
  public static calculateBackoffMs(retryCount: number): number {
    const exponent = Math.min(retryCount, 6); // Cap 2^6 = 64
    const exponential = this.BASE_BACKOFF_SEC * Math.pow(2, exponent) * 1000;
    const capped = Math.min(this.MAX_BACKOFF_SEC * 1000, exponential);
    const jitter = Math.floor(Math.random() * this.JITTER_MS);
    return capped + jitter;
  }

  /**
   * Enqueues an item into the persistent offline sync outbox
   */
  public static async enqueue(params: {
    entityType: OutboxEntityType;
    entityId: string;
    payload: any;
    priority?: number;
    agencyCode?: string;
    cashierId?: string;
  }, customDb?: BanoliaDatabase): Promise<DbOfflineSyncQueue> {
    const targetDb = customDb || db;
    const now = new Date().toISOString();
    const agencyCode = params.agencyCode || 'A02';
    const cashierId = params.cashierId || 'CSH-001';

    const rawSignaturePayload = `${agencyCode}|${cashierId}|${params.entityId}|${JSON.stringify(params.payload)}|${now}`;
    const signatureHmac = await CryptoService.hashSha256(rawSignaturePayload);
    const idempotencyKey = `idemp_${agencyCode}_${Date.now()}_${signatureHmac.substring(0, 16)}`;

    const item: DbOfflineSyncQueue = {
      id: `queue_${params.entityId}_${Date.now()}`,
      entityType: params.entityType,
      entityId: params.entityId,
      payloadJson: JSON.stringify(params.payload),
      idempotencyKey,
      priority: params.priority || 1,
      status: 'PENDING',
      retryCount: 0,
      createdAt: now
    };

    await targetDb.syncQueue.add(item);
    return item;
  }

  /**
   * Fetches pending items ready for batch synchronization
   */
  public static async getPendingQueue(
    limit: number = 25,
    customDb?: BanoliaDatabase
  ): Promise<DbOfflineSyncQueue[]> {
    const targetDb = customDb || db;
    return await targetDb.syncQueue
      .filter(item => item.status === 'PENDING' || item.status === 'FAILED_RETRY')
      .limit(limit)
      .toArray();
  }

  /**
   * Replays pending outbox items against the central server or local mock processor
   */
  public static async replayBatch(params?: {
    customDb?: BanoliaDatabase;
    simulateFailures?: boolean;
    batchSize?: number;
  }): Promise<{
    processedCount: number;
    succeededCount: number;
    failedCount: number;
    response: SyncBatchResponse;
  }> {
    const targetDb = params?.customDb || db;
    const batchSize = params?.batchSize || 25;
    const pendingItems = await this.getPendingQueue(batchSize, targetDb);

    if (pendingItems.length === 0) {
      return {
        processedCount: 0,
        succeededCount: 0,
        failedCount: 0,
        response: {
          batchId: `batch_${Date.now()}`,
          serverTimestamp: new Date().toISOString(),
          status: 'SUCCESS',
          results: []
        }
      };
    }

    const now = new Date().toISOString();
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Mark items as IN_FLIGHT
    await targetDb.transaction('rw', targetDb.syncQueue, async () => {
      for (const item of pendingItems) {
        item.status = 'IN_FLIGHT';
        item.sentAt = now;
        await targetDb.syncQueue.put(item);
      }
    });

    // Simulate or execute sync
    const results: SyncBatchResponse['results'] = [];
    let succeeded = 0;
    let failed = 0;

    for (const item of pendingItems) {
      if (params?.simulateFailures) {
        // Mark as FAILED_RETRY
        item.retryCount += 1;
        item.status = item.retryCount >= this.MAX_RETRIES ? 'FAILED_FATAL' : 'FAILED_RETRY';
        item.lastError = 'Connection timeout to core banking server';
        failed++;
        results.push({
          idempotencyKey: item.idempotencyKey,
          status: 'REJECTED',
          error: item.lastError
        });
      } else {
        // Successful sync acknowledgement
        item.status = 'ACKNOWLEDGED';
        item.acknowledgedAt = new Date().toISOString();
        succeeded++;
        results.push({
          idempotencyKey: item.idempotencyKey,
          status: 'COMMITTED',
          ledgerTxId: `ledger_tx_${Date.now()}_${item.entityId}`
        });

        // Also update the underlying transaction if it's a financial transaction
        if (item.entityType === 'TRANSACTION') {
          const tx = await targetDb.transactions.get(item.entityId);
          if (tx) {
            tx.syncStatus = 'SYNCED';
            tx.serverTxId = `ledger_tx_${Date.now()}_${item.entityId}`;
            await targetDb.transactions.put(tx);
          }
        }
      }

      await targetDb.syncQueue.put(item);
    }

    const batchResponse: SyncBatchResponse = {
      batchId,
      serverTimestamp: new Date().toISOString(),
      status: failed === 0 ? 'SUCCESS' : succeeded > 0 ? 'PARTIAL' : 'ERROR',
      results
    };

    return {
      processedCount: pendingItems.length,
      succeededCount: succeeded,
      failedCount: failed,
      response: batchResponse
    };
  }

  /**
   * Merges server delta updates into local database with deterministic conflict rules
   */
  public static async applyDeltaUpdates(
    deltas: SyncBatchResponse['deltaUpdates'],
    customDb?: BanoliaDatabase
  ): Promise<void> {
    if (!deltas) return;
    const targetDb = customDb || db;

    await targetDb.transaction('rw', [targetDb.accounts, targetDb.members], async () => {
      if (deltas.accounts && deltas.accounts.length > 0) {
        for (const remoteAcc of deltas.accounts) {
          const localAcc = await targetDb.accounts
            .where('accountNumber')
            .equals(remoteAcc.accountNumber)
            .first();

          if (localAcc) {
            localAcc.realBalance = remoteAcc.realBalance;
            localAcc.availableBalance = remoteAcc.availableBalance;
            localAcc.updatedAt = new Date().toISOString();
            await targetDb.accounts.put(localAcc);
          }
        }
      }

      if (deltas.members && deltas.members.length > 0) {
        for (const remoteMem of deltas.members) {
          const localMem = await targetDb.members
            .where('code')
            .equals(remoteMem.code)
            .first();

          if (localMem) {
            // LWW field-level merge for non-financial master data
            if (remoteMem.phone) localMem.phone = remoteMem.phone;
            if (remoteMem.address) localMem.address = remoteMem.address;
            if (remoteMem.spouseName !== undefined) localMem.spouseName = remoteMem.spouseName;
            localMem.updatedAt = new Date().toISOString();
            await targetDb.members.put(localMem);
          }
        }
      }
    });
  }

  /**
   * Deterministic Conflict Resolution Evaluator
   */
  public static resolveConflict(params: {
    entityType: OutboxEntityType;
    localPayload: any;
    remoteState: any;
  }): {
    resolution: 'LOCAL_WINS' | 'REMOTE_WINS' | 'MERGE';
    mergedState?: any;
    auditNote: string;
  } {
    if (params.entityType === 'TRANSACTION') {
      // Physical Cash Teller Authority Wins
      return {
        resolution: 'LOCAL_WINS',
        auditNote: 'Physical cash movement executed at counter: Local operation is authoritative.'
      };
    }

    if (params.entityType === 'SHIFT_EVENT') {
      // Shift Procès-Verbal is local authoritative
      return {
        resolution: 'LOCAL_WINS',
        auditNote: 'Physical cashier shift balancing count and signed PV is authoritative.'
      };
    }

    // Member metadata: LWW field-level merge
    const local = params.localPayload || {};
    const remote = params.remoteState || {};
    const merged = { ...remote, ...local };

    return {
      resolution: 'MERGE',
      mergedState: merged,
      auditNote: 'Field-level Last-Write-Wins merge for non-financial member master data.'
    };
  }
}
