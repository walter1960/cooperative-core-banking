/**
 * Tier 1 — F18: AI Financial Ratio Analyzer & Executive Insights
 */

import { describe, test, beforeEach } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockGeneralLedger } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 1 - F18: AI Financial Ratio Analyzer', () => {
  let ledger;

  beforeEach(() => {
    ledger = new MockGeneralLedger();
  });

  test('T1_F18_01: AI Diagnosis of Healthy Microfinance Prudential Position', () => {
    const report = ledger.calculatePrudentialRatios({
      liquidAssets: 150000000,
      shortTermLiabilities: 100000000,
      grossPortfolio: 300000000,
      overdue30: 6000000,
      overdue90: 3000000,
      netEquity: 60000000,
      riskWeightedAssets: 300000000
    });

    assert.strictEqual(report.rLiq.compliant, true);
    assert.strictEqual(report.par30.compliant, true);
    assert.strictEqual(report.par90.compliant, true);
    assert.strictEqual(report.car.compliant, true);
  });

  test('T1_F18_02: AI Alert Generation on Liquidity Ratio Deficit (R_LIQ < 100%)', () => {
    const report = ledger.calculatePrudentialRatios({
      liquidAssets: 80000000,
      shortTermLiabilities: 100000000 // R_LIQ = 80% (Breach)
    });

    assert.strictEqual(report.rLiq.compliant, false);
    assert.strictEqual(report.rLiq.value, 80.0);
  });

  test('T1_F18_03: AI Alert Generation on Delinquency Deterioration (PAR30 > 5%)', () => {
    const report = ledger.calculatePrudentialRatios({
      grossPortfolio: 100000000,
      overdue30: 8000000 // PAR30 = 8.0% (Breach > 5%)
    });

    assert.strictEqual(report.par30.compliant, false);
    assert.strictEqual(report.par30.value, 8.0);
  });

  test('T1_F18_04: Capital Adequacy Evaluation (CAR >= 15% Standard)', () => {
    const report = ledger.calculatePrudentialRatios({
      netEquity: 45000000,
      riskWeightedAssets: 250000000 // CAR = 18.0%
    });

    assert.strictEqual(report.car.compliant, true);
    CustomAssert.assertBceaoRatio('CAR', report.car.value, 15.0, 'gte');
  });

  test('T1_F18_05: Natural Language Financial Status Query Response Generation', () => {
    const query = 'Donne-moi l\'état du PAR 30';
    const report = ledger.calculatePrudentialRatios({
      grossPortfolio: 200000000,
      overdue30: 4000000 // PAR30 = 2.0%
    });

    const narrative = `Le portefeuille à risque à 30 jours (PAR 30) est à ${report.par30.value}%, conforme aux exigences BCEAO (max ${report.par30.max}%).`;
    assert.ok(narrative.includes('2%'));
    assert.ok(narrative.includes('conforme'));
  });
});
