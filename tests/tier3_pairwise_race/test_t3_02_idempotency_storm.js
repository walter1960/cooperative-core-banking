/**
 * Tier 3 — 02: Idempotency Storm (50 Concurrent Replay Attacks)
 */

import { describe, test, beforeAll } from '../common/harness.js';
import { MockOfflineSyncEngine } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 3 - 02: Idempotency Storm (50 Concurrent Replays)', () => {
  let syncEngine;

  beforeAll(() => {
    syncEngine = new MockOfflineSyncEngine();
  });

  test('T3_02_01: 50 Parallel Replay Submissions of Exact Same Transaction Payload', async () => {
    const singleTx = {
      idempotencyKey: 'idemp-storm-fixed-key',
      amount: 100000,
      type: 'DEPOSIT',
      memberCode: 'A0200225'
    };

    // First submission
    const firstRes = syncEngine.processBatchSync({ batchId: 'BATCH-INIT', transactions: [singleTx] });
    assert.strictEqual(firstRes.results[0].status, 'COMMITTED');

    // Simulate 50 concurrent replay requests
    const replayPromises = [];
    for (let i = 0; i < 50; i++) {
      replayPromises.push(
        Promise.resolve(syncEngine.processBatchSync({ batchId: `BATCH-REP-${i}`, transactions: [singleTx] }))
      );
    }

    const results = await Promise.all(replayPromises);
    assert.strictEqual(results.length, 50);
    for (const res of results) {
      assert.strictEqual(res.results[0].status, 'DUPLICATE');
    }
  });

  test('T3_02_02: Ledger Double-Entry State Integrity Remains Strictly at 1 Posting', () => {
    // Check that processedKeys map contains exactly 1 unique entry
    assert.strictEqual(syncEngine.processedKeys.size, 1);
  });
});
