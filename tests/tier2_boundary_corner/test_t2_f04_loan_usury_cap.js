/**
 * Tier 2 — F04: Loan Usury Cap Enforcement & Extreme Loan Tenors
 */

import { describe, test } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockAmortizationEngine } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 2 - F04: Loan Usury Cap & Boundary Amortization', () => {
  test('T2_F04_01: Rejection of Loan Rate Exceeding BCEAO Usury Limit (> 27.0% per annum)', () => {
    assert.throws(() => {
      MockAmortizationEngine.simulate({
        principal: 1000000,
        annualRate: 28.5, // Exceeds 27%
        months: 12,
        formula: 'CONSTANT_ANNUITY'
      });
    }, /Usury ceiling violation/);
  });

  test('T2_F04_02: Acceptance of Exact Boundary Usury Rate (27.0% Ceiling)', () => {
    const res = MockAmortizationEngine.simulate({
      principal: 1000000,
      annualRate: 27.0,
      months: 12,
      formula: 'CONSTANT_ANNUITY'
    });

    assert.strictEqual(res.annualRate, 27.0);
    CustomAssert.assertAmortizationSchedule(res.schedule, 1000000, 27.0, 12, 'CONSTANT_ANNUITY');
  });

  test('T2_F04_03: Micro-Loan Boundary (1 Month Duration, 50 000 XOF Principal)', () => {
    const res = MockAmortizationEngine.simulate({
      principal: 50000,
      annualRate: 12.0,
      months: 1,
      formula: 'CONSTANT_ANNUITY'
    });

    assert.strictEqual(res.schedule.length, 1);
    CustomAssert.assertAmortizationSchedule(res.schedule, 50000, 12.0, 1, 'CONSTANT_ANNUITY');
    assert.strictEqual(res.schedule[0].principal, 50000);
  });

  test('T2_F04_04: Zero-Interest Loan Product (0.0% Promotional Rate)', () => {
    const res = MockAmortizationEngine.simulate({
      principal: 60000,
      annualRate: 0.0,
      months: 6,
      formula: 'FLAT'
    });

    assert.strictEqual(res.totalInterest, 0);
    assert.strictEqual(res.monthlyPayment, 10000);
    for (const row of res.schedule) {
      assert.strictEqual(row.interest, 0);
      assert.strictEqual(row.principal, 10000);
    }
  });

  test('T2_F04_05: Extended Tenor Loan (60 Months / 5 Years Amortization Balance)', () => {
    const res = MockAmortizationEngine.simulate({
      principal: 5000000,
      annualRate: 15.0,
      months: 60,
      formula: 'CONSTANT_ANNUITY'
    });

    assert.strictEqual(res.schedule.length, 60);
    CustomAssert.assertAmortizationSchedule(res.schedule, 5000000, 15.0, 60, 'CONSTANT_ANNUITY');
  });
});
