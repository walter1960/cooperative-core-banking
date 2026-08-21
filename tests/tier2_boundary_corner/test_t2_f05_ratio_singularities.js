/**
 * Tier 2 — F05: Ratio Singularities (Division by Zero & Edge Boundaries)
 */

import { describe, test, beforeEach } from '../common/harness.js';
import { MockGeneralLedger } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 2 - F05: Financial Ratio Singularities & Edge Math', () => {
  let ledger;

  beforeEach(() => {
    ledger = new MockGeneralLedger();
  });

  test('T2_F05_01: Zero Gross Loan Portfolio Prevents Division-by-Zero in PAR Calculation', () => {
    const report = ledger.calculatePrudentialRatios({
      grossPortfolio: 0,
      overdue30: 0,
      overdue90: 0
    });

    assert.strictEqual(report.par30.value, 0);
    assert.strictEqual(report.par90.value, 0);
    assert.strictEqual(isNaN(report.par30.value), false);
  });

  test('T2_F05_02: Zero Operating Expenses Yields Default 100% OSS without NaN Crash', () => {
    const report = ledger.calculatePrudentialRatios({
      totalIncome: 1000000,
      totalExpenses: 0
    });

    assert.strictEqual(report.oss.value, 100);
    assert.strictEqual(isNaN(report.oss.value), false);
  });

  test('T2_F05_03: Extreme 100% Default Scenario (Gross Portfolio == Overdue 90)', () => {
    const report = ledger.calculatePrudentialRatios({
      grossPortfolio: 10000000,
      overdue30: 10000000,
      overdue90: 10000000
    });

    assert.strictEqual(report.par30.value, 100.0);
    assert.strictEqual(report.par90.value, 100.0);
    assert.strictEqual(report.par30.compliant, false);
    assert.strictEqual(report.par90.compliant, false);
  });

  test('T2_F05_04: Negative Net Profit Impact on Capital Adequacy Ratio (CAR)', () => {
    // Large accumulated losses reduce net equity from 30M to 10M
    const report = ledger.calculatePrudentialRatios({
      netEquity: 10000000,
      riskWeightedAssets: 100000000 // CAR = 10% (Breach < 15%)
    });

    assert.strictEqual(report.car.value, 10.0);
    assert.strictEqual(report.car.compliant, false);
  });

  test('T2_F05_05: Exact Threshold Ratio Boundary Cases (R_LIQ == 100.0%, PAR30 == 5.0%)', () => {
    const report = ledger.calculatePrudentialRatios({
      liquidAssets: 100000000,
      shortTermLiabilities: 100000000, // R_LIQ = 100.0% exactly
      grossPortfolio: 100000000,
      overdue30: 5000000 // PAR30 = 5.0% exactly
    });

    assert.strictEqual(report.rLiq.compliant, true);
    assert.strictEqual(report.par30.compliant, true);
  });
});
