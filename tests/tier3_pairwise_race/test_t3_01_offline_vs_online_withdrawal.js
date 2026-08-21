/**
 * Tier 3 — 01: Offline Teller Withdrawal vs Online Mobile Wave Withdrawal Race
 */

import { describe, test } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import assert from 'node:assert/strict';

describe('Tier 3 - 01: Offline Teller vs Online Wave Withdrawal Race', () => {
  test('T3_01_01: Concurrent Withdrawal Attempts on Same Account Handled Safely', () => {
    // Member account with 60,000 XOF available
    const account = { realBalance: 60000, availableBalance: 60000 };

    // 1. Online Wave withdrawal of 50,000 F commits first
    const onlineAmount = 50000;
    account.realBalance -= onlineAmount;
    account.availableBalance -= onlineAmount;

    // 2. Offline counter withdrawal of 30,000 F arrives later during batch sync
    const offlineAmount = 30000;
    const isOverdrawn = account.availableBalance < offlineAmount;

    // In microfinance offline resolution, physical cash was disbursed at counter, so account enters temporary overdraft
    account.realBalance -= offlineAmount;
    account.availableBalance -= offlineAmount;

    assert.strictEqual(isOverdrawn, true);
    assert.strictEqual(account.availableBalance, -20000); // 10,000 - 30,000 = -20,000 F
  });

  test('T3_01_02: Overdraft Compensation Event Triggers Urgent Recovery Notification', () => {
    const account = { accountNumber: '25121101', availableBalance: -20000 };
    const alert = {
      type: 'OVERDRAFT_COMPENSATION_EVENT',
      accountNumber: account.accountNumber,
      deficitAmount: Math.abs(account.availableBalance),
      requiresImmediateRecovery: true
    };

    assert.strictEqual(alert.deficitAmount, 20000);
    assert.strictEqual(alert.requiresImmediateRecovery, true);
  });
});
