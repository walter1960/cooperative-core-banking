/**
 * Tier 4 — 05: Quarterly Regulatory Audit & BCEAO Inspection Bundle
 */

import { describe, test } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockGeneralLedger } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 4 - 05: Regulatory Audit & Prudential Inspection Bundle', () => {
  test('T4_05: Generation of Comprehensive BCEAO Audit Bundle with 5 Ratios and Bilan', () => {
    const ledger = new MockGeneralLedger();

    // Populate realistic agency portfolio
    ledger.postSharePurchase({ memberCode: 'A0200225', sharesCount: 200, unitPrice: 5000, fee: 10000 }); // 1M capital
    ledger.postDeposit({ memberCode: 'A0200225', amount: 5000000 }); // 5M deposits
    ledger.postLoanDisbursement({ loanNumber: 'CR-AUDIT-01', amount: 4000000, fee: 80000 }); // 4M loan

    // 1. Balance Sheet Generation
    const bilan = ledger.generateBilan();
    assert.strictEqual(bilan.balanced, true);

    // 2. Prudential Ratios Computation
    const ratios = ledger.calculatePrudentialRatios({
      liquidAssets: 130000000,
      shortTermLiabilities: 100000000,
      grossPortfolio: 250000000,
      overdue30: 5000000, // 2.0%
      overdue90: 2500000, // 1.0%
      netEquity: 45000000,
      riskWeightedAssets: 250000000, // 18% CAR
      totalIncome: 30000000,
      totalExpenses: 22000000 // 136% OSS
    });

    // 3. Assert All 5 BCEAO Regulatory Ratios Pass
    CustomAssert.assertBceaoRatio('R_LIQ', ratios.rLiq.value, 100.0, 'gte');
    CustomAssert.assertBceaoRatio('PAR30', ratios.par30.value, 5.0, 'lte');
    CustomAssert.assertBceaoRatio('PAR90', ratios.par90.value, 3.0, 'lte');
    CustomAssert.assertBceaoRatio('CAR', ratios.car.value, 15.0, 'gte');
    CustomAssert.assertBceaoRatio('OSS', ratios.oss.value, 100.0, 'gte');

    assert.strictEqual(ratios.rLiq.compliant, true);
    assert.strictEqual(ratios.par30.compliant, true);
    assert.strictEqual(ratios.par90.compliant, true);
    assert.strictEqual(ratios.car.compliant, true);
    assert.strictEqual(ratios.oss.compliant, true);
  });
});
