/**
 * Tier 1 — F03: Savings Accounts, 15-Day Interest Rule & 31-Day Cyclical Tontines
 */

import { describe, test, beforeEach } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockGeneralLedger, MockAmortizationEngine } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 1 - F03: Savings Accounts & Tontines', () => {
  let ledger;

  beforeEach(() => {
    ledger = new MockGeneralLedger();
  });

  test('T1_F03_01: Ordinary Savings Cash Deposit Credited to Account 251211', () => {
    const entry = ledger.postDeposit({
      memberCode: 'A0200225',
      amount: 50000
    });

    CustomAssert.assertLedgerBalanced(entry);
    const dav = ledger.getAccount('251211');
    assert.strictEqual(dav.currentCredit, 50000);
  });

  test('T1_F03_02: Ordinary Savings Cash Withdrawal with Fee Debited to Account 251211', () => {
    const entry = ledger.postWithdrawal({
      memberCode: 'A0200225',
      amount: 20000,
      fee: 500
    });

    CustomAssert.assertLedgerBalanced(entry);
    assert.strictEqual(entry.totalDebit, 20500);
    assert.strictEqual(entry.totalCredit, 20500);
  });

  test('T1_F03_03: 15-Day Interest Rule (Règle des Quinzaines) Calculation Accuracy', () => {
    // 2 quinzaines with minimum balance 100,000 XOF at 3.5% per annum
    const history = [
      { fortnight: 1, minBalance: 100000 },
      { fortnight: 2, minBalance: 100000 }
    ];

    const interest = MockAmortizationEngine.calculate15DayInterest(history, 3.5);
    // (100,000 * 0.035 / 24) * 2 = 145.83 * 2 = 291.66 -> 292 XOF
    assert.strictEqual(interest, 292);
  });

  test('T1_F03_04: Daily Tontine Collection into Suspense Account 258000', () => {
    const entry = ledger.postTontineDailyCollection({
      collectorAccount: '571300',
      dailyAmount: 1000,
      carnetNumber: 'TK-2026-0042'
    });

    CustomAssert.assertLedgerBalanced(entry);
    const tontineSuspense = ledger.getAccount('258000');
    assert.strictEqual(tontineSuspense.currentCredit, 1000);
  });

  test('T1_F03_05: 31-Day Tontine Cycle Settlement with 1-Day SFD Commission Auto-Deduction', () => {
    // 31 days collected = 31,000 F
    // Payout: 30 days to Member DAV (30,000 F), 1 day to SFD Commission 704000 (1,000 F)
    const entry = ledger.postTontineSettlement({
      totalCollected: 31000,
      sfdCommission: 1000,
      memberDAVAccount: '251100',
      carnetNumber: 'TK-2026-0042'
    });

    CustomAssert.assertLedgerBalanced(entry);
    assert.strictEqual(entry.totalDebit, 31000);
    assert.strictEqual(entry.totalCredit, 31000);

    const commissionAcc = ledger.getAccount('704000');
    assert.strictEqual(commissionAcc.currentCredit, 1000);
  });
});
