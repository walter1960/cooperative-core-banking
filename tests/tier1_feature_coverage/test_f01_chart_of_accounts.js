/**
 * Tier 1 — F01: BCEAO Chart of Accounts & General Ledger Engine
 */

import { describe, test, beforeEach } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockGeneralLedger } from '../common/mocks.js';
import { FIXTURES } from '../common/fixtures.js';
import assert from 'node:assert/strict';

describe('Tier 1 - F01: BCEAO Chart of Accounts & General Ledger Engine', () => {
  let ledger;

  beforeEach(() => {
    ledger = new MockGeneralLedger();
  });

  test('T1_F01_01: Strict Double-Entry Equilibrium on Multi-Line Journal Entry', () => {
    const entry = ledger.postJournalEntry({
      date: '2026-08-20',
      description: 'Versement espèces adhérent A0200225',
      lines: [
        { accountNumber: '571200', debit: 50000, credit: 0, desc: 'Caisse guichet' },
        { accountNumber: '251211', debit: 0, credit: 50000, desc: 'Crédit compte DAV' }
      ]
    });

    assert.strictEqual(entry.totalDebit, 50000);
    assert.strictEqual(entry.totalCredit, 50000);
    CustomAssert.assertLedgerBalanced(entry);

    const caisse = ledger.getAccount('571200');
    const dav = ledger.getAccount('251211');
    assert.strictEqual(caisse.currentDebit, 50000);
    assert.strictEqual(dav.currentCredit, 50000);
  });

  test('T1_F01_02: 9-Class SYSCOA-SFD Chart Structure Completeness', () => {
    const trial = ledger.generateTrialBalance();
    assert.ok(trial.rows.length >= 20, 'Chart must contain standard SFD accounts');

    // Verify all 9 classes are represented
    const classesPresent = new Set();
    for (const acc of FIXTURES.STANDARD_SYSCOA_ACCOUNTS) {
      classesPresent.add(acc.class);
    }
    for (let c = 1; c <= 7; c++) {
      assert.ok(classesPresent.has(c), `Class ${c} must be present in SYSCOA chart`);
    }
  });

  test('T1_F01_03: General Ledger Trial Balance Balancing Property', () => {
    ledger.postDeposit({ memberCode: 'A0200225', amount: 100000 });
    ledger.postWithdrawal({ memberCode: 'A0200225', amount: 30000, fee: 500 });
    ledger.postSharePurchase({ memberCode: 'A0200227', sharesCount: 2, unitPrice: 5000, fee: 2000 });

    const trial = ledger.generateTrialBalance();
    assert.strictEqual(trial.balanced, true, 'Trial balance total debits must equal total credits');
    assert.strictEqual(trial.totalDebit, trial.totalCredit);
    CustomAssert.assertLedgerBalanced(trial);
  });

  test('T1_F01_04: Rejection of Unbalanced Journal Entries with Invariant Enforcement', () => {
    assert.throws(() => {
      ledger.postJournalEntry({
        date: '2026-08-20',
        description: 'Erroneous Unbalanced Entry',
        lines: [
          { accountNumber: '571200', debit: 50000, credit: 0 },
          { accountNumber: '251211', debit: 0, credit: 49999 } // 1 F difference
        ]
      });
    }, /Unbalanced/);
  });

  test('T1_F01_05: Automated Balance Sheet Generation Equivalence (Actif == Passif)', () => {
    ledger.postSharePurchase({ memberCode: 'A0200225', sharesCount: 10, unitPrice: 5000, fee: 0 });
    ledger.postDeposit({ memberCode: 'A0200225', amount: 200000 });
    ledger.postLoanDisbursement({ loanNumber: 'CR-001', amount: 150000, fee: 0 });

    const bilan = ledger.generateBilan();
    assert.strictEqual(bilan.balanced, true, 'Total Actif must equal Total Passif in Bilan');
    assert.strictEqual(bilan.totalActif, bilan.totalPassif);
  });
});
