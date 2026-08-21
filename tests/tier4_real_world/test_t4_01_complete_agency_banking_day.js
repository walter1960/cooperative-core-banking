/**
 * Tier 4 — 01: Complete Agency Banking Day (07h30 Open -> 45 Operations -> 3h Offline -> Sync -> 16h30 Closure)
 */

import { describe, test } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockGeneralLedger, MockOfflineSyncEngine, MockEscPosPrinter } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 4 - 01: Complete Agency Banking Day Simulation', () => {
  test('T4_01: End-to-End Simulation of Full Agency Shift with Offline Period and Reconciliation', () => {
    const ledger = new MockGeneralLedger();
    const syncEngine = new MockOfflineSyncEngine();

    // 1. 07h30: Cashier Shift Opening (200,000 XOF in cash drawer)
    const shift = {
      id: 'SHIFT-20260820-001',
      cashier: 'Akouvi Mensah',
      openingBalance: 200000,
      totalDeposits: 0,
      totalWithdrawals: 0,
      status: 'OPEN_ACTIVE'
    };

    // 2. 08h00 - 11h00: Online Operations (15 deposits, 10 withdrawals)
    let drawer = shift.openingBalance;
    for (let i = 1; i <= 15; i++) {
      const dep = 20000;
      drawer += dep;
      shift.totalDeposits += dep;
      ledger.postDeposit({ memberCode: `A020022${(i % 3) + 5}`, amount: dep });
    }
    for (let i = 1; i <= 10; i++) {
      const wd = 10000;
      drawer -= wd;
      shift.totalWithdrawals += wd;
      ledger.postWithdrawal({ memberCode: `A020022${(i % 3) + 5}`, amount: wd, fee: 100 });
    }

    assert.strictEqual(shift.totalDeposits, 300000);
    assert.strictEqual(shift.totalWithdrawals, 100000);
    assert.strictEqual(drawer, 400000);

    // 3. 11h00 - 14h00: 3-Hour Offline Network Blackout (20 offline transactions queued locally)
    const offlineTxs = [];
    for (let i = 1; i <= 20; i++) {
      const amt = 5000;
      drawer += amt;
      shift.totalDeposits += amt;
      offlineTxs.push({
        idempotencyKey: `idemp-offline-day-${i}`,
        amount: amt,
        type: 'DEPOSIT',
        memberCode: 'A0200225'
      });
    }

    assert.strictEqual(offlineTxs.length, 20);
    assert.strictEqual(drawer, 500000); // 400k + 100k

    // 4. 14h30: Network Restored -> Bidirectional Batch Sync
    const syncRes = syncEngine.processBatchSync({ batchId: 'BATCH-EOD-01', transactions: offlineTxs });
    assert.strictEqual(syncRes.processedCount, 20);
    for (const r of syncRes.results) {
      assert.strictEqual(r.status, 'COMMITTED');
      ledger.postDeposit({ memberCode: 'A0200225', amount: 5000 });
    }

    // 5. 16h30: Cashier Shift Closure & Physical Billetage Reconciliation
    // Theoretical Balance = 200,000 (open) + 400,000 (deposits) - 100,000 (withdrawals) = 500,000 XOF
    const theoreticalClosing = shift.openingBalance + shift.totalDeposits - shift.totalWithdrawals;
    assert.strictEqual(theoreticalClosing, 500000);

    // Physical count: 50 bills of 10,000 XOF = 500,000 XOF
    const physicalCount = 50 * 10000;
    assert.strictEqual(physicalCount, 500000);

    const diff = physicalCount - theoreticalClosing;
    assert.strictEqual(diff, 0);
    shift.status = 'CLOSED_BALANCED';

    // 6. Generate Bilan and Trial Balance
    const trial = ledger.generateTrialBalance();
    assert.strictEqual(trial.balanced, true);
    CustomAssert.assertLedgerBalanced(trial);

    // 7. Print Final EOD Thermal Summary
    const receipt = MockEscPosPrinter.format80mmReceipt({
      receiptNumber: 'EOD-20260820',
      memberName: 'CLOTURE JOURNEE BANCAIRE',
      memberCode: 'AGENCE-A02',
      type: 'ARRETE_CAISSE',
      amount: physicalCount,
      balance: physicalCount
    });
    CustomAssert.assertEscPosReceipt(receipt, ['COOPEC BANOLIA', 'EOD-20260820', '500 000']);
  });
});
