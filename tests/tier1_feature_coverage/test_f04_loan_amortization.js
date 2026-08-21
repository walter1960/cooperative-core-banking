/**
 * Tier 1 — F04: Loan Amortization Formulas, Usury Cap & Credit Accounting
 */

import { describe, test, beforeEach } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockAmortizationEngine, MockGeneralLedger } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 1 - F04: Loan Amortization Engine & Provisioning', () => {
  let ledger;

  beforeEach(() => {
    ledger = new MockGeneralLedger();
  });

  test('T1_F04_01: Constant Annuity Schedule Amortization Integrity', () => {
    const res = MockAmortizationEngine.simulate({
      principal: 1000000,
      annualRate: 12.0,
      months: 12,
      formula: 'CONSTANT_ANNUITY'
    });

    CustomAssert.assertAmortizationSchedule(res.schedule, 1000000, 12.0, 12, 'CONSTANT_ANNUITY');
    assert.strictEqual(res.schedule.length, 12);
    assert.ok(res.monthlyPayment > 88000 && res.monthlyPayment < 89000);
  });

  test('T1_F04_02: Constant Principal (Linear) Schedule Mathematical Properties', () => {
    const res = MockAmortizationEngine.simulate({
      principal: 1200000,
      annualRate: 12.0,
      months: 12,
      formula: 'CONSTANT_PRINCIPAL'
    });

    CustomAssert.assertAmortizationSchedule(res.schedule, 1200000, 12.0, 12, 'CONSTANT_PRINCIPAL');
    // First installment should have higher payment than last installment
    assert.ok(res.schedule[0].payment > res.schedule[11].payment);
    assert.strictEqual(res.schedule[0].principal, 100000);
  });

  test('T1_F04_03: Bullet Loan (In Fine) Amortization (Principal on Final Installment Only)', () => {
    const res = MockAmortizationEngine.simulate({
      principal: 500000,
      annualRate: 10.0,
      months: 6,
      formula: 'IN_FINE'
    });

    CustomAssert.assertAmortizationSchedule(res.schedule, 500000, 10.0, 6, 'IN_FINE');
    for (let i = 0; i < 5; i++) {
      assert.strictEqual(res.schedule[i].principal, 0);
    }
    assert.strictEqual(res.schedule[5].principal, 500000);
  });

  test('T1_F04_04: Flat Rate Loan Schedule Distribution', () => {
    const res = MockAmortizationEngine.simulate({
      principal: 600000,
      annualRate: 10.0,
      months: 6,
      formula: 'FLAT'
    });

    CustomAssert.assertAmortizationSchedule(res.schedule, 600000, 10.0, 6, 'FLAT');
    assert.strictEqual(res.totalInterest, 30000);
    assert.strictEqual(res.monthlyPayment, 105000);
  });

  test('T1_F04_05: Loan Disbursement and Repayment Journal Postings', () => {
    // Disbursement: Dr 201100 1,000,000 / Cr 251100 980,000 / Cr 702000 20,000
    const disburseEntry = ledger.postLoanDisbursement({
      loanNumber: 'CR-2026-001',
      amount: 1000000,
      fee: 20000
    });
    CustomAssert.assertLedgerBalanced(disburseEntry);

    // Repayment: Dr 571200 88,849 / Cr 201100 78,849 / Cr 701100 10,000
    const repayEntry = ledger.postLoanRepayment({
      loanNumber: 'CR-2026-001',
      principal: 78849,
      interest: 10000
    });
    CustomAssert.assertLedgerBalanced(repayEntry);
  });
});
