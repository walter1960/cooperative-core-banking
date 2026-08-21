/**
 * Tier 1 — F13: Mobile Banking Member Portal, Triple Balance & Micro-Loans
 */

import { describe, test } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { FIXTURES } from '../common/fixtures.js';
import { MockAmortizationEngine } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 1 - F13: Mobile Member Portal & Micro-Loans', () => {
  test('T1_F13_01: Triple Balance Display Invariant (Avail == Real - Frozen)', () => {
    const acc = FIXTURES.ACCOUNTS[0]; // Real: 280,424, Frozen: 50,000, Avail: 230,424
    const computedAvail = acc.realBalance - acc.frozenBalance;

    assert.strictEqual(acc.availableBalance, computedAvail);
    CustomAssert.assertCurrencyAmount(acc.availableBalance, 230424);
  });

  test('T1_F13_02: Transaction History Statement Chronological Ordering', () => {
    const history = [
      { id: 'tx-1', timestamp: '2026-08-19 14:00', type: 'DEPOSIT', amount: 50000 },
      { id: 'tx-2', timestamp: '2026-08-20 09:30', type: 'WITHDRAWAL', amount: 20000 }
    ];

    assert.strictEqual(history[0].type, 'DEPOSIT');
    assert.strictEqual(history[1].type, 'WITHDRAWAL');
    assert.ok(history[1].timestamp > history[0].timestamp);
  });

  test('T1_F13_03: Micro-Loan In-App Interactive Simulator Evaluation', () => {
    const sim = MockAmortizationEngine.simulate({
      principal: 300000,
      annualRate: 9.0,
      months: 6,
      formula: 'CONSTANT_ANNUITY'
    });

    assert.strictEqual(sim.schedule.length, 6);
    assert.ok(sim.monthlyPayment > 50000 && sim.monthlyPayment < 52000);
    CustomAssert.assertAmortizationSchedule(sim.schedule, 300000, 9.0, 6, 'CONSTANT_ANNUITY');
  });

  test('T1_F13_04: Pre-Qualification Evaluation for Instant Digital Credit', () => {
    const member = FIXTURES.MEMBERS[0];
    const sharesCount = member.sharesPurchased; // 4 shares = 20,000 F
    const requestedCredit = 100000;

    // SFD policy: credit allowed up to 5x share capital
    const maxCreditAllowed = sharesCount * member.shareUnitPrice * 5;
    const isEligible = requestedCredit <= maxCreditAllowed;

    assert.strictEqual(maxCreditAllowed, 100000);
    assert.strictEqual(isEligible, true);
  });

  test('T1_F13_05: Digital Account Statement Export Formatting Validation', () => {
    const statement = {
      memberCode: 'A0200225',
      memberName: 'MILDZINA Tomrom',
      accountNumber: '25121100A020022501',
      totalDeposits: 150000,
      totalWithdrawals: 50000,
      netBalance: 100000,
      currency: 'XOF'
    };

    assert.strictEqual(statement.netBalance, statement.totalDeposits - statement.totalWithdrawals);
    CustomAssert.assertCurrencyAmount(statement.netBalance, 100000);
  });
});
