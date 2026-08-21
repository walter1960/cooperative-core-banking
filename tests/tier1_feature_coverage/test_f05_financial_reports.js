/**
 * Tier 1 — F05: Automated Financial Statements & BCEAO Prudential Ratios
 */

import { describe, test, beforeEach } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockGeneralLedger } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 1 - F05: Financial Statements & Prudential Ratios', () => {
  let ledger;

  beforeEach(() => {
    ledger = new MockGeneralLedger();
  });

  test('T1_F05_01: Balance Sheet Assets vs Liabilities Perfect Equilibrium', () => {
    ledger.postSharePurchase({ memberCode: 'A0200225', sharesCount: 20, unitPrice: 5000, fee: 0 });
    ledger.postDeposit({ memberCode: 'A0200225', amount: 500000 });
    ledger.postLoanDisbursement({ loanNumber: 'CR-001', amount: 300000, fee: 5000 });

    const bilan = ledger.generateBilan();
    assert.strictEqual(bilan.balanced, true);
    assert.strictEqual(bilan.totalActif, bilan.totalPassif);
  });

  test('T1_F05_02: General Ledger Trial Balance Full Account Extraction', () => {
    ledger.postDeposit({ memberCode: 'A0200226', amount: 80000 });
    const trial = ledger.generateTrialBalance();

    assert.ok(trial.rows.length >= 20);
    assert.strictEqual(trial.balanced, true);
  });

  test('T1_F05_03: Global Liquidity Ratio (R_LIQ >= 100%) Verification', () => {
    const ratios = ledger.calculatePrudentialRatios({
      liquidAssets: 120000000,
      shortTermLiabilities: 100000000
    });

    CustomAssert.assertBceaoRatio('R_LIQ', ratios.rLiq.value, 100.0, 'gte');
    assert.strictEqual(ratios.rLiq.compliant, true);
    assert.strictEqual(ratios.rLiq.value, 120.0);
  });

  test('T1_F05_04: Portfolio at Risk (PAR30 <= 5% and PAR90 <= 3%) Evaluation', () => {
    const ratios = ledger.calculatePrudentialRatios({
      grossPortfolio: 200000000,
      overdue30: 6000000, // 3.0%
      overdue90: 2000000  // 1.0%
    });

    CustomAssert.assertBceaoRatio('PAR30', ratios.par30.value, 5.0, 'lte');
    CustomAssert.assertBceaoRatio('PAR90', ratios.par90.value, 3.0, 'lte');
    assert.strictEqual(ratios.par30.compliant, true);
    assert.strictEqual(ratios.par90.compliant, true);
  });

  test('T1_F05_05: Capital Adequacy Ratio (CAR >= 15%) & Operational Self-Sufficiency (OSS >= 100%)', () => {
    const ratios = ledger.calculatePrudentialRatios({
      netEquity: 36000000,
      riskWeightedAssets: 200000000, // CAR = 18%
      totalIncome: 25000000,
      totalExpenses: 20000000 // OSS = 125%
    });

    CustomAssert.assertBceaoRatio('CAR', ratios.car.value, 15.0, 'gte');
    CustomAssert.assertBceaoRatio('OSS', ratios.oss.value, 100.0, 'gte');
    assert.strictEqual(ratios.car.compliant, true);
    assert.strictEqual(ratios.oss.compliant, true);
  });
});
