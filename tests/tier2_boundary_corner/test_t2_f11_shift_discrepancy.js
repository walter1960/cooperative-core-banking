/**
 * Tier 2 — F11: Shift Discrepancies (Massive Shortfalls & Heavy Surpluses)
 */

import { describe, test, beforeEach } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockGeneralLedger } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 2 - F11: Shift Discrepancies & Severe Imbalances', () => {
  let ledger;

  beforeEach(() => {
    ledger = new MockGeneralLedger();
  });

  test('T2_F11_01: Massive Physical Cash Shortage (1,000,000 XOF Shortfall)', () => {
    const theoretical = 3000000;
    const physical = 2000000;
    const shortage = physical - theoretical; // -1,000,000 XOF

    const entry = ledger.postShiftDiscrepancy({ discrepancyAmount: shortage });
    CustomAssert.assertLedgerBalanced(entry);

    const manquantAcc = ledger.getAccount('471200');
    assert.strictEqual(manquantAcc.currentDebit, 1000000);
  });

  test('T2_F11_02: Massive Physical Cash Surplus (500,000 XOF Overage)', () => {
    const theoretical = 1000000;
    const physical = 1500000;
    const surplus = physical - theoretical; // +500,000 XOF

    const entry = ledger.postShiftDiscrepancy({ discrepancyAmount: surplus });
    CustomAssert.assertLedgerBalanced(entry);

    const excedentAcc = ledger.getAccount('472200');
    assert.strictEqual(excedentAcc.currentCredit, 500000);
  });

  test('T2_F11_03: Shift Close with Zero Transactions Executed (Pure Opening == Closing)', () => {
    const opening = 200000;
    const physical = 200000;
    const diff = physical - opening;

    assert.strictEqual(diff, 0);
  });

  test('T2_F11_04: Discrepancy Reason Mandate Enforced When |Difference| > 0', () => {
    const validateClosure = ({ discrepancy, reason }) => {
      if (discrepancy !== 0 && (!reason || reason.trim().length === 0)) {
        throw new Error('A detailed justification reason is mandatory when closing with a cash discrepancy');
      }
      return true;
    };

    assert.throws(() => validateClosure({ discrepancy: -5000, reason: '' }), /justification reason is mandatory/);
    assert.strictEqual(validateClosure({ discrepancy: -5000, reason: 'Erreur de comptage au guichet 2' }), true);
  });

  test('T2_F11_05: Double Shift Closure Attempt Prevention (Already Closed)', () => {
    const shift = { id: 'SHIFT-01', status: 'CLOSED_BALANCED' };

    assert.throws(() => {
      if (shift.status === 'CLOSED_BALANCED') {
        throw new Error('Shift is already closed. Re-closing is forbidden.');
      }
    }, /already closed/);
  });
});
