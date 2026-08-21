/**
 * Tier 1 — F11: Cashier Shift Balancing, Billetage & Discrepancy Management
 */

import { describe, test, beforeEach } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockGeneralLedger } from '../common/mocks.js';
import { FIXTURES } from '../common/fixtures.js';
import assert from 'node:assert/strict';

describe('Tier 1 - F11: Cashier Shift Balancing & Billetage', () => {
  let ledger;

  beforeEach(() => {
    ledger = new MockGeneralLedger();
  });

  test('T1_F11_01: Shift Opening with Initial Vault Transfer Record', () => {
    const shift = {
      id: 'SHIFT-001',
      cashierId: 'usr-01',
      openingBalance: 200000,
      status: 'OPEN_ACTIVE',
      openedAt: new Date().toISOString()
    };

    assert.strictEqual(shift.status, 'OPEN_ACTIVE');
    CustomAssert.assertCurrencyAmount(shift.openingBalance, 200000);
  });

  test('T1_F11_02: Physical Cash Billetage Total Breakdown Calculation', () => {
    const b = FIXTURES.BILLETAGE_SAMPLE;
    const total =
      b.b_10000 * 10000 +
      b.b_5000 * 5000 +
      b.b_2000 * 2000 +
      b.b_1000 * 1000 +
      b.b_500 * 500 +
      b.p_500 * 500 +
      b.p_100 * 100;

    assert.strictEqual(total, 288500);
    CustomAssert.assertCurrencyAmount(total, b.totalCalculated);
  });

  test('T1_F11_03: Perfect Shift Balancing Reconciliation (Difference == 0)', () => {
    const theoretical = 288500;
    const physical = 288500;
    const diff = physical - theoretical;

    assert.strictEqual(diff, 0);
    const entry = ledger.postShiftDiscrepancy({ discrepancyAmount: diff });
    assert.strictEqual(entry, null); // Zero discrepancy requires no GL balancing line
  });

  test('T1_F11_04: Cash Shortage (Manquant de Caisse) Booked to Account 471200', () => {
    const theoretical = 300000;
    const physical = 295000;
    const shortage = physical - theoretical; // -5,000 F

    const entry = ledger.postShiftDiscrepancy({ discrepancyAmount: shortage });
    assert.ok(entry, 'Shortage entry must be created');
    CustomAssert.assertLedgerBalanced(entry);

    const manquantAcc = ledger.getAccount('471200');
    assert.strictEqual(manquantAcc.currentDebit, 5000);
  });

  test('T1_F11_05: Cash Overage (Excédent de Caisse) Booked to Account 472200', () => {
    const theoretical = 250000;
    const physical = 252000;
    const surplus = physical - theoretical; // +2,000 F

    const entry = ledger.postShiftDiscrepancy({ discrepancyAmount: surplus });
    assert.ok(entry, 'Surplus entry must be created');
    CustomAssert.assertLedgerBalanced(entry);

    const excedentAcc = ledger.getAccount('472200');
    assert.strictEqual(excedentAcc.currentCredit, 2000);
  });
});
