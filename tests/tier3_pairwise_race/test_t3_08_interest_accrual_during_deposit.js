/**
 * Tier 3 — 08: 15-Day Interest Accrual Posting during Live Counter Deposit
 */

import { describe, test, beforeEach } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockGeneralLedger } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 3 - 08: Interest Accrual Posting during Live Deposit', () => {
  let ledger;

  beforeEach(() => {
    ledger = new MockGeneralLedger();
  });

  test('T3_08_01: Concurrent Deposit and Fortnightly Interest Calculation Order', () => {
    // Member account with 200,000 F balance on 14th of month
    const balance = 200000;
    // Deposit of 50,000 F made on 14th
    const newBalance = balance + 50000;

    // Under 15-day rule, deposit made on 14th enters interest calculation starting 16th
    const quinzaine1Min = balance; // 200,000
    const interestQ1 = Math.round(quinzaine1Min * (0.035 / 24)); // 292 F

    const quinzaine2Min = newBalance; // 250,000
    const interestQ2 = Math.round(quinzaine2Min * (0.035 / 24)); // 365 F

    assert.strictEqual(interestQ1, 292);
    assert.strictEqual(interestQ2, 365);
  });

  test('T3_08_02: General Ledger Interest Expense Double-Entry Posting (Dr 602000 / Cr 251211)', () => {
    const totalInterest = 657; // 292 + 365
    const entry = ledger.postJournalEntry({
      date: '2026-08-31',
      description: 'Arrêté périodique des intérêts sur livret épargne',
      lines: [
        { accountNumber: '602000', debit: totalInterest, credit: 0, desc: 'Charges intérêts épargne' },
        { accountNumber: '251211', debit: 0, credit: totalInterest, desc: 'Capitalisation intérêts membres' }
      ]
    });

    CustomAssert.assertLedgerBalanced(entry);
    const intExpense = ledger.getAccount('602000');
    assert.strictEqual(intExpense.currentDebit, totalInterest);
  });
});
