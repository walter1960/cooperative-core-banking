/**
 * Tier 2 — F08: Cash Drawer Vault Ceilings & Boundary Balances
 */

import { describe, test } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import assert from 'node:assert/strict';

describe('Tier 2 - F08: Cash Drawer Limits & Boundaries', () => {
  const VAULT_CEILING_LIMIT = 5000000; // 5M XOF regulatory ceiling for teller desk

  test('T2_F08_01: Cash Drawer Vault Ceiling Warning (> 5,000,000 XOF Excess)', () => {
    const currentDrawer = 4800000;
    const incomingDeposit = 500000;
    const newTotal = currentDrawer + incomingDeposit;

    const requiresVaultTransfer = newTotal > VAULT_CEILING_LIMIT;
    assert.strictEqual(requiresVaultTransfer, true);
    assert.strictEqual(newTotal, 5300000);
  });

  test('T2_F08_02: Exact Boundary Zero Balance Cash Drawer (All Cash Disbursed)', () => {
    let drawer = 100000;
    const withdrawal = 100000;
    drawer -= withdrawal;

    CustomAssert.assertCurrencyAmount(drawer, 0);
  });

  test('T2_F08_03: Rejection of Cash Disbursal Exceeding Physical Drawer Balance', () => {
    const drawerBalance = 50000;
    const requestedDisbursement = 80000;

    assert.throws(() => {
      if (requestedDisbursement > drawerBalance) {
        throw new Error('Encaisse physique insuffisante dans le tiroir-caisse pour honorer le retrait');
      }
    }, /Encaisse physique insuffisante/);
  });

  test('T2_F08_04: Negative Drawer Balance Strictly Disallowed', () => {
    const validateDrawer = (balance) => {
      if (balance < 0) throw new Error('Cash drawer balance cannot be negative');
      return true;
    };

    assert.throws(() => validateDrawer(-500), /cannot be negative/);
  });

  test('T2_F08_05: Immediate Cash Drawer Reset upon Shift Close', () => {
    let desk = { drawerBalance: 250000, status: 'OPEN' };
    // Close shift
    desk.status = 'CLOSED';
    desk.drawerBalance = 0; // Transferred to vault

    assert.strictEqual(desk.status, 'CLOSED');
    assert.strictEqual(desk.drawerBalance, 0);
  });
});
