/**
 * Tier 1 — F06: Core Banking REST API & Idempotent Batch Sync Engine
 */

import { describe, test, beforeEach } from '../common/harness.js';
import { MockOfflineSyncEngine } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 1 - F06: Core Sync & Idempotency Engine', () => {
  let syncEngine;

  beforeEach(() => {
    syncEngine = new MockOfflineSyncEngine();
  });

  test('T1_F06_01: Generation of SHA-256 HMAC Idempotency Keys', () => {
    const key1 = syncEngine.generateIdempotencyKey({
      agencyCode: 'A02',
      cashierId: 'usr-01',
      timestamp: '2026-08-20T10:00:00Z',
      amount: 50000,
      type: 'DEPOSIT'
    });

    assert.ok(key1.startsWith('idemp_A02_'));
    assert.ok(key1.length > 20);
  });

  test('T1_F06_02: Batch Sync of Offline Transactions Returns COMMITTED Status', () => {
    const txs = [
      { idempotencyKey: 'idemp-test-01', amount: 50000, type: 'DEPOSIT', memberCode: 'A0200225' },
      { idempotencyKey: 'idemp-test-02', amount: 20000, type: 'WITHDRAWAL', memberCode: 'A0200226' }
    ];

    const res = syncEngine.processBatchSync({
      batchId: 'BATCH-001',
      transactions: txs
    });

    assert.strictEqual(res.status, 'SUCCESS');
    assert.strictEqual(res.processedCount, 2);
    assert.strictEqual(res.results[0].status, 'COMMITTED');
    assert.strictEqual(res.results[1].status, 'COMMITTED');
  });

  test('T1_F06_03: Replaying Identical Idempotency Key Returns DUPLICATE without State Mutation', () => {
    const tx = { idempotencyKey: 'idemp-replay-01', amount: 10000, type: 'DEPOSIT', memberCode: 'A0200225' };

    // First push
    const res1 = syncEngine.processBatchSync({ batchId: 'BATCH-001', transactions: [tx] });
    assert.strictEqual(res1.results[0].status, 'COMMITTED');
    const originalLedgerId = res1.results[0].ledgerTxId;

    // Second push with same key
    const res2 = syncEngine.processBatchSync({ batchId: 'BATCH-002', transactions: [tx] });
    assert.strictEqual(res2.results[0].status, 'DUPLICATE');
    assert.strictEqual(res2.results[0].ledgerTxId, originalLedgerId);
  });

  test('T1_F06_04: Multi-Item Batch Handles Mixed New and Duplicate Transactions', () => {
    const tx1 = { idempotencyKey: 'idemp-mix-01', amount: 15000, type: 'DEPOSIT' };
    const tx2 = { idempotencyKey: 'idemp-mix-02', amount: 25000, type: 'DEPOSIT' };

    syncEngine.processBatchSync({ batchId: 'BATCH-01', transactions: [tx1] });

    const res = syncEngine.processBatchSync({
      batchId: 'BATCH-02',
      transactions: [tx1, tx2]
    });

    assert.strictEqual(res.results[0].status, 'DUPLICATE');
    assert.strictEqual(res.results[1].status, 'COMMITTED');
  });

  test('T1_F06_05: Idempotent Ledger Integrity Across 10 Repeated Synchronization Cycles', () => {
    const tx = { idempotencyKey: 'idemp-loop-01', amount: 50000, type: 'DEPOSIT' };

    for (let i = 0; i < 10; i++) {
      const res = syncEngine.processBatchSync({ batchId: `BATCH-${i}`, transactions: [tx] });
      if (i === 0) {
        assert.strictEqual(res.results[0].status, 'COMMITTED');
      } else {
        assert.strictEqual(res.results[0].status, 'DUPLICATE');
      }
    }
    assert.strictEqual(syncEngine.processedKeys.size, 1);
  });
});
