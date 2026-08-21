/**
 * Tier 2 — F01: Accounting Boundaries & Negative Amount Rejections
 */

import { describe, test, beforeEach } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockGeneralLedger } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 2 - F01: Accounting Boundaries & Corner Cases', () => {
  let ledger;

  beforeEach(() => {
    ledger = new MockGeneralLedger();
  });

  test('T2_F01_01: Rejection of Journal Entry with Negative Debit or Credit Amount', () => {
    assert.throws(() => {
      ledger.postJournalEntry({
        date: '2026-08-20',
        description: 'Negative amount test',
        lines: [
          { accountNumber: '571200', debit: -50000, credit: 0 },
          { accountNumber: '251211', debit: 0, credit: -50000 }
        ]
      });
    }, /Negative amounts forbidden/);
  });

  test('T2_F01_02: Rejection of Journal Entry with Single Line (Minimum 2 Lines Required)', () => {
    assert.throws(() => {
      ledger.postJournalEntry({
        date: '2026-08-20',
        description: 'Single line test',
        lines: [
          { accountNumber: '571200', debit: 50000, credit: 0 }
        ]
      });
    }, /at least 2 lines/);
  });

  test('T2_F01_03: Rejection of Non-Existent Account Number', () => {
    assert.throws(() => {
      ledger.postJournalEntry({
        date: '2026-08-20',
        description: 'Non-existent account test',
        lines: [
          { accountNumber: '999999', debit: 50000, credit: 0 },
          { accountNumber: '571200', debit: 0, credit: 50000 }
        ]
      });
    }, /not recognized/);
  });

  test('T2_F01_04: Rejection of Line with Simultaneous Debit and Credit Values', () => {
    assert.throws(() => {
      ledger.postJournalEntry({
        date: '2026-08-20',
        description: 'Both debit and credit',
        lines: [
          { accountNumber: '571200', debit: 50000, credit: 50000 },
          { accountNumber: '251211', debit: 0, credit: 50000 }
        ]
      });
    }, /both debit and credit/);
  });

  test('T2_F01_05: Micro-Fractional Rounding Balance Tolerances (< 0.0001 XOF)', () => {
    const entry = ledger.postJournalEntry({
      date: '2026-08-20',
      description: 'Micro fraction test',
      lines: [
        { accountNumber: '571200', debit: 100.00001, credit: 0 },
        { accountNumber: '251211', debit: 0, credit: 100.00001 }
      ]
    });
    CustomAssert.assertLedgerBalanced(entry);
  });
});
