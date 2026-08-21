/**
 * Tier 4 — 03: Complete Loan Lifecycle (KYC -> Shares -> Approval -> Disbursement -> 12 Repayments)
 */

import { describe, test } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockGeneralLedger, MockAmortizationEngine } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 4 - 03: Complete Loan Lifecycle Simulation', () => {
  test('T4_03: Full Loan Lifecycle from Member Onboarding to Complete Payoff', () => {
    const ledger = new MockGeneralLedger();

    // 1. Member Onboarding: Member buys 10 shares (50,000 F) + 2,000 F fee
    const member = { code: 'A0200299', fullName: 'AGBEKO Koffi', shares: 10, savingsBalance: 0 };
    const onboardingEntry = ledger.postSharePurchase({
      memberCode: member.code,
      sharesCount: 10,
      unitPrice: 5000,
      fee: 2000
    });
    CustomAssert.assertLedgerBalanced(onboardingEntry);

    // 2. Loan Application & Approval: 1,200,000 XOF at 12% over 12 months (Constant Principal)
    const principal = 1200000;
    const rate = 12.0;
    const months = 12;
    const sim = MockAmortizationEngine.simulate({
      principal,
      annualRate: rate,
      months,
      formula: 'CONSTANT_PRINCIPAL'
    });
    assert.strictEqual(sim.schedule.length, 12);

    // 3. Disbursement: Dr 201100 1,200,000 / Cr 251100 1,176,000 / Cr 702000 24,000 (2% fee)
    const disburseEntry = ledger.postLoanDisbursement({
      loanNumber: 'CR-AGBEKO-01',
      amount: principal,
      fee: 24000
    });
    CustomAssert.assertLedgerBalanced(disburseEntry);

    // 4. Repayment Lifecycle (12 Monthly Payments)
    let totalPrincipalPaid = 0;
    let totalInterestPaid = 0;

    for (let month = 1; month <= 12; month++) {
      const scheduleRow = sim.schedule[month - 1];
      const repayEntry = ledger.postLoanRepayment({
        loanNumber: 'CR-AGBEKO-01',
        principal: scheduleRow.principal,
        interest: scheduleRow.interest
      });
      CustomAssert.assertLedgerBalanced(repayEntry);
      totalPrincipalPaid += scheduleRow.principal;
      totalInterestPaid += scheduleRow.interest;
    }

    // 5. Final Invariant Validations
    assert.strictEqual(totalPrincipalPaid, principal);
    CustomAssert.assertCurrencyAmount(totalPrincipalPaid, 1200000);

    const trial = ledger.generateTrialBalance();
    assert.strictEqual(trial.balanced, true);
    CustomAssert.assertLedgerBalanced(trial);
  });
});
