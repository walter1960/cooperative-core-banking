/**
 * Tier 2 — F18: Financial Ratio Anomalies & Extreme Stress Scenarios
 */

import { describe, test, beforeEach } from '../common/harness.js';
import { MockGeneralLedger } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 2 - F18: Financial Ratio Anomalies & Stress Scenarios', () => {
  let ledger;

  beforeEach(() => {
    ledger = new MockGeneralLedger();
  });

  test('T2_F18_01: Severe Liquidity Crisis Scenario (Liquid Assets 20M vs Liabilities 100M -> R_LIQ = 20%)', () => {
    const report = ledger.calculatePrudentialRatios({
      liquidAssets: 20000000,
      shortTermLiabilities: 100000000
    });

    assert.strictEqual(report.rLiq.value, 20.0);
    assert.strictEqual(report.rLiq.compliant, false);
  });

  test('T2_F18_02: Catastrophic Credit Default Spike (PAR90 = 25.0% vs Allowed 3.0%)', () => {
    const report = ledger.calculatePrudentialRatios({
      grossPortfolio: 100000000,
      overdue30: 30000000,
      overdue90: 25000000 // 25% PAR90
    });

    assert.strictEqual(report.par90.value, 25.0);
    assert.strictEqual(report.par90.compliant, false);
  });

  test('T2_F18_03: Insolvent Capital Adequacy Ratio (Equity Deficit < 0 -> CAR < 0%)', () => {
    const report = ledger.calculatePrudentialRatios({
      netEquity: -5000000,
      riskWeightedAssets: 100000000
    });

    assert.ok(report.car.value < 0);
    assert.strictEqual(report.car.compliant, false);
  });

  test('T2_F18_04: Negative Operational Self-Sufficiency (Loss-Making Period OSS = 40%)', () => {
    const report = ledger.calculatePrudentialRatios({
      totalIncome: 4000000,
      totalExpenses: 10000000 // OSS = 40%
    });

    assert.strictEqual(report.oss.value, 40.0);
    assert.strictEqual(report.oss.compliant, false);
  });

  test('T2_F18_05: Multi-Factor Prudential Distress Index Synthesis', () => {
    const report = ledger.calculatePrudentialRatios({
      liquidAssets: 50000000,
      shortTermLiabilities: 100000000, // R_LIQ 50% (Fail)
      grossPortfolio: 100000000,
      overdue30: 15000000, // PAR30 15% (Fail)
      overdue90: 8000000,  // PAR90 8% (Fail)
      netEquity: 10000000,
      riskWeightedAssets: 100000000 // CAR 10% (Fail)
    });

    const failedRatiosCount = [report.rLiq, report.par30, report.par90, report.car].filter(r => !r.compliant).length;
    assert.strictEqual(failedRatiosCount, 4);
  });
});
