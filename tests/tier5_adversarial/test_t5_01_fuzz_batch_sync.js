/**
 * Tier 5 — 01: Fuzzing & Malformed JSON Batch Sync Injection
 */

import { describe, test, beforeEach } from '../common/harness.js';
import { MockOfflineSyncEngine } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 5 - 01: Adversarial Fuzzing & Batch Sync Injection', () => {
  let syncEngine;

  beforeEach(() => {
    syncEngine = new MockOfflineSyncEngine();
  });

  test('T5_01: Fuzz Input Injection with Type Mutations and Extreme Integers', () => {
    const fuzzedBatch = [
      { idempotencyKey: 'idemp-fuzz-1', amount: 0, type: 'DEPOSIT' },
      { idempotencyKey: 'idemp-fuzz-2', amount: Number.MAX_SAFE_INTEGER, type: 'DEPOSIT' },
      { idempotencyKey: 'idemp-fuzz-3', amount: 1000, type: 'UNKNOWN_TYPE_INJECTION' },
      { idempotencyKey: '', amount: 5000, type: 'DEPOSIT' }
    ];

    const res = syncEngine.processBatchSync({ batchId: 'BATCH-FUZZ', transactions: fuzzedBatch });
    assert.strictEqual(res.status, 'SUCCESS');
    assert.strictEqual(res.processedCount, 4);
  });
});
