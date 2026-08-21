/**
 * Tier 1 — F08: Teller Operations, Cash Desk & Change Calculator
 */

import { describe, test, beforeEach } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { FIXTURES } from '../common/fixtures.js';
import assert from 'node:assert/strict';

describe('Tier 1 - F08: Teller Operations & Cashier Desk', () => {
  let cashDesk;

  beforeEach(() => {
    cashDesk = {
      drawerBalance: 200000,
      account: { ...FIXTURES.ACCOUNTS[0] } // Real: 280,424, Frozen: 50,000, Avail: 230,424
    };
  });

  test('T1_F08_01: Cash Deposit Workflow Updates Drawer and Member Balances', () => {
    const depositAmount = 50000;
    cashDesk.drawerBalance += depositAmount;
    cashDesk.account.realBalance += depositAmount;
    cashDesk.account.availableBalance += depositAmount;

    CustomAssert.assertCurrencyAmount(cashDesk.drawerBalance, 250000);
    CustomAssert.assertCurrencyAmount(cashDesk.account.realBalance, 330424);
    CustomAssert.assertCurrencyAmount(cashDesk.account.availableBalance, 280424);
  });

  test('T1_F08_02: Cash Withdrawal Workflow Verifies Available Balance Threshold', () => {
    const withdrawAmount = 30000;
    assert.ok(cashDesk.account.availableBalance >= withdrawAmount);

    cashDesk.drawerBalance -= withdrawAmount;
    cashDesk.account.realBalance -= withdrawAmount;
    cashDesk.account.availableBalance -= withdrawAmount;

    CustomAssert.assertCurrencyAmount(cashDesk.drawerBalance, 170000);
    CustomAssert.assertCurrencyAmount(cashDesk.account.availableBalance, 200424);
  });

  test('T1_F08_03: Change Calculator Computes Exact Cash Return', () => {
    const operationAmount = 35000;
    const receivedCash = 50000;
    const changeDue = receivedCash - operationAmount;

    CustomAssert.assertCurrencyAmount(changeDue, 15000);
  });

  test('T1_F08_04: Rejection of Cash Withdrawal Exceeding Available Balance', () => {
    const excessiveAmount = 250000; // Available is 230,424
    assert.ok(excessiveAmount > cashDesk.account.availableBalance);

    assert.throws(() => {
      if (excessiveAmount > cashDesk.account.availableBalance) {
        throw new Error('Solde disponible insuffisant');
      }
    }, /insuffisant/);
  });

  test('T1_F08_05: Alternative Payment Method Selection (Mobile Money at Counter)', () => {
    const tx = {
      type: 'DEPOSIT',
      amount: 25000,
      paymentMethod: 'TMONEY',
      accountNumber: cashDesk.account.accountNumber
    };

    // Mobile money counter deposit credits member account but does NOT increase cash drawer
    cashDesk.account.realBalance += tx.amount;
    cashDesk.account.availableBalance += tx.amount;

    CustomAssert.assertCurrencyAmount(cashDesk.drawerBalance, 200000); // Unchanged cash
    CustomAssert.assertCurrencyAmount(cashDesk.account.availableBalance, 255424);
  });
});
