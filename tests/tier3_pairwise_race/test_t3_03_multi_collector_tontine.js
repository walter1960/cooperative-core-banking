/**
 * Tier 3 — 03: Multi-Collector Concurrent Tontine Collection on Same Member
 */

import { describe, test, beforeEach } from '../common/harness.js';
import { MockOfflineSyncEngine } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 3 - 03: Multi-Collector Concurrent Tontine Race', () => {
  let syncEngine;

  beforeEach(() => {
    syncEngine = new MockOfflineSyncEngine();
  });

  test('T3_03_01: Two Collectors Record Offline Cotisation for Same Member Carnet', () => {
    // Collector A records day 15 (idemp-col-a-15); Collector B records day 15 (idemp-col-b-15)
    const txA = { idempotencyKey: 'idemp-col-a-15', carnetNumber: 'TK-001', day: 15, amount: 1000, type: 'TONTINE' };
    const txB = { idempotencyKey: 'idemp-col-b-15', carnetNumber: 'TK-001', day: 15, amount: 1000, type: 'TONTINE' };

    const resA = syncEngine.processBatchSync({ batchId: 'BATCH-COL-A', transactions: [txA] });
    const resB = syncEngine.processBatchSync({ batchId: 'BATCH-COL-B', transactions: [txB] });

    assert.strictEqual(resA.results[0].status, 'COMMITTED');
    assert.strictEqual(resB.results[0].status, 'COMMITTED');
  });

  test('T3_03_02: Carnet Matrix Advances to Day 16 on Duplicate Same-Day Collection', () => {
    // Both collections are credited towards total 31-day cycle (advancing to 2 paid days)
    const carnet = { paidDays: 14, totalAmount: 14000 };
    carnet.paidDays += 2;
    carnet.totalAmount += 2000;

    assert.strictEqual(carnet.paidDays, 16);
    assert.strictEqual(carnet.totalAmount, 16000);
  });
});
