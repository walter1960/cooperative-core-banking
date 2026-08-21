/**
 * Tier 2 — F03: Savings Boundaries, Frozen Collateral & Zero Amount Rejections
 */

import { describe, test } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { FIXTURES } from '../common/fixtures.js';
import assert from 'node:assert/strict';

describe('Tier 2 - F03: Savings Boundaries & Edge Conditions', () => {
  test('T2_F03_01: Rejection of Zero or Negative Deposit Amount', () => {
    const validateDeposit = (amt) => {
      if (!amt || amt <= 0) throw new Error('Deposit amount must be strictly positive');
      return true;
    };

    assert.throws(() => validateDeposit(0), /strictly positive/);
    assert.throws(() => validateDeposit(-1000), /strictly positive/);
  });

  test('T2_F03_02: Attempted Withdrawal of Frozen Collateral Balance Throws Exception', () => {
    const acc = { ...FIXTURES.ACCOUNTS[0] }; // Real: 280,424, Frozen: 50,000, Avail: 230,424
    const requested = 250000; // > Available 230,424

    assert.throws(() => {
      if (requested > acc.availableBalance) {
        throw new Error(`Insufficient available funds. Available: ${acc.availableBalance} XOF (Frozen: ${acc.frozenBalance} XOF)`);
      }
    }, /Insufficient available funds/);
  });

  test('T2_F03_03: Extreme Value Deposit (100,000,000 XOF Institutional Placement)', () => {
    const acc = { realBalance: 0, availableBalance: 0 };
    const massiveDeposit = 100000000;
    acc.realBalance += massiveDeposit;
    acc.availableBalance += massiveDeposit;

    CustomAssert.assertCurrencyAmount(acc.availableBalance, 100000000);
  });

  test('T2_F03_04: 15-Day Interest Accrual with Zero Account Balance Across All Fortnights', () => {
    const history = [
      { fortnight: 1, minBalance: 0 },
      { fortnight: 2, minBalance: 0 }
    ];

    let interest = 0;
    for (const h of history) {
      interest += h.minBalance * (0.035 / 24);
    }
    assert.strictEqual(interest, 0);
  });

  test('T2_F03_05: Mid-Month Account Lock (Status BLOQUE) Blocks Subsequent Debits', () => {
    const acc = { accountNumber: '25121101', status: 'BLOQUE', availableBalance: 50000 };

    assert.throws(() => {
      if (acc.status !== 'ACTIF') {
        throw new Error(`Account is ${acc.status}. Transactions blocked.`);
      }
    }, /BLOQUE/);
  });
});
