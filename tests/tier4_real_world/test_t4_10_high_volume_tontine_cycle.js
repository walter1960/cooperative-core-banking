/**
 * Tier 4 — 10: High-Volume 31-Day Tontine Group Cycle (100 Members, Commission & Payout)
 */

import { describe, test } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockGeneralLedger } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 4 - 10: High-Volume 31-Day Tontine Cycle Simulation', () => {
  test('T4_10: Simulation of 100 Members Completing 31-Day Tontine Cycle with Payout and SFD Income', () => {
    const ledger = new MockGeneralLedger();
    const membersCount = 100;
    const dailyMise = 1000;
    const cycleDays = 31;

    // Total collected per member = 31,000 XOF
    // Total collected for 100 members = 3,100,000 XOF
    const totalCollected = membersCount * dailyMise * cycleDays; // 3,100,000 XOF
    const totalSfdCommission = membersCount * dailyMise * 1;    // 100,000 XOF (1 day per member)
    const totalMemberPayout = totalCollected - totalSfdCommission; // 3,000,000 XOF

    // 1. Record daily collections over 31 days into Suspense Account 258000
    const collectionEntry = ledger.postJournalEntry({
      date: '2026-08-31',
      description: 'Totalité collectes cycle 31 jours groupe 100 adhérentes',
      lines: [
        { accountNumber: '571300', debit: totalCollected, credit: 0, desc: 'Caisses auxiliaires collecteurs' },
        { accountNumber: '258000', debit: 0, credit: totalCollected, desc: 'Comptes attente épargne tontine' }
      ]
    });
    CustomAssert.assertLedgerBalanced(collectionEntry);

    // 2. Execute Month-End Tontine Settlement:
    // Dr 258000 3,100,000 / Cr 251100 3,000,000 / Cr 704000 100,000
    const settlementEntry = ledger.postJournalEntry({
      date: '2026-08-31',
      description: 'Clôture et reversement cycle tontine 100 membres',
      lines: [
        { accountNumber: '258000', debit: totalCollected, credit: 0, desc: 'Solde compte attente tontine' },
        { accountNumber: '251100', debit: 0, credit: totalMemberPayout, desc: 'Crédit comptes DAV 100 membres' },
        { accountNumber: '704000', debit: 0, credit: totalSfdCommission, desc: 'Commission de gestion tontines SFD' }
      ]
    });
    CustomAssert.assertLedgerBalanced(settlementEntry);

    // 3. Final Verification: Suspense Account 258000 is Cleared to Zero Net Balance
    const tontineSuspenseAcc = ledger.getAccount('258000');
    assert.strictEqual(tontineSuspenseAcc.currentDebit, totalCollected);
    assert.strictEqual(tontineSuspenseAcc.currentCredit, totalCollected);
    assert.strictEqual(tontineSuspenseAcc.currentDebit - tontineSuspenseAcc.currentCredit, 0);

    const commissionAcc = ledger.getAccount('704000');
    assert.strictEqual(commissionAcc.currentCredit, 100000);
    CustomAssert.assertCurrencyAmount(commissionAcc.currentCredit, 100000);

    const trial = ledger.generateTrialBalance();
    assert.strictEqual(trial.balanced, true);
    CustomAssert.assertLedgerBalanced(trial);
  });
});
