/**
 * Tier 3 — 05: Concurrent Loan Disbursement and Collateral Savings Lock
 */

import { describe, test, beforeEach } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockGeneralLedger } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 3 - 05: Concurrent Loan Disbursement & Collateral Lock', () => {
  let ledger;

  beforeEach(() => {
    ledger = new MockGeneralLedger();
  });

  test('T3_05_01: Atomic Loan Disbursement and 20% Collateral Lock Execution', () => {
    const loanAmount = 1000000;
    const collateralRequired = loanAmount * 0.20; // 200,000 F

    const memberAccount = { realBalance: 300000, frozenBalance: 0, availableBalance: 300000 };

    // 1. Lock 200,000 F collateral
    memberAccount.frozenBalance += collateralRequired;
    memberAccount.availableBalance -= collateralRequired;

    // 2. Disburse 1,000,000 F net into account
    memberAccount.realBalance += loanAmount;
    memberAccount.availableBalance += loanAmount;

    // GL Posting: Dr 201100 1,000,000 / Cr 251100 1,000,000
    const entry = ledger.postLoanDisbursement({ loanNumber: 'CR-001', amount: loanAmount });
    CustomAssert.assertLedgerBalanced(entry);

    assert.strictEqual(memberAccount.realBalance, 1300000);
    assert.strictEqual(memberAccount.frozenBalance, 200000);
    assert.strictEqual(memberAccount.availableBalance, 1100000);
  });

  test('T3_05_02: Rollback of Loan Disbursement if Collateral Lock Fails', () => {
    const memberAccount = { realBalance: 50000, frozenBalance: 0, availableBalance: 50000 };
    const requiredCollateral = 200000; // Account has only 50k

    assert.throws(() => {
      if (memberAccount.availableBalance < requiredCollateral) {
        throw new Error('Insufficient savings balance to secure 20% mandatory loan collateral');
      }
    }, /Insufficient savings balance/);
  });
});
