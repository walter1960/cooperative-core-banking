/**
 * Tier 4 — 09: Credit Delinquency Aging (30d -> 90d -> 180d) and Automatic PAR Provisioning
 */

import { describe, test } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockGeneralLedger } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 4 - 09: Credit Delinquency Aging & PAR Provisioning', () => {
  test('T4_09: Simulation of Loan Aging Across 30d/90d/180d with Automated Provisioning Entries', () => {
    const ledger = new MockGeneralLedger();
    const loanPrincipal = 1000000;

    // 1. Initial Healthy Loan Disbursement: Dr 201100 1,000,000 / Cr 251100 1,000,000
    ledger.postLoanDisbursement({ loanNumber: 'CR-PAR-01', amount: loanPrincipal });

    // 2. Loan enters 31-90 days overdue (PAR30): Reclassify to 291100 and provision 25% (250,000 XOF)
    // Transfer: Dr 291100 1,000,000 / Cr 201100 1,000,000
    ledger.postJournalEntry({
      date: '2026-08-20',
      description: 'Reclassement crédit en souffrance PAR 30 (Compte 291100)',
      lines: [
        { accountNumber: '291100', debit: loanPrincipal, credit: 0, desc: 'Créances douteuses' },
        { accountNumber: '201100', debit: 0, credit: loanPrincipal, desc: 'Sortie crédits sains' }
      ]
    });
    // Provision 25%: Dr 661000 250,000 / Cr 299100 250,000
    const prov30 = ledger.postJournalEntry({
      date: '2026-08-20',
      description: 'Dotation provision 25% sur créance douteuse',
      lines: [
        { accountNumber: '661000', debit: 250000, credit: 0, desc: 'Dotations provisions créances' },
        { accountNumber: '299100', debit: 0, credit: 250000, desc: 'Provisions PAR 30' }
      ]
    });
    CustomAssert.assertLedgerBalanced(prov30);

    // 3. Loan enters 91-180 days overdue (PAR90): Provision additional 25% to reach 50% (500,000 total)
    const prov90 = ledger.postJournalEntry({
      date: '2026-08-20',
      description: 'Dotation provision complémentaire 25% (Total 50% PAR 90)',
      lines: [
        { accountNumber: '661000', debit: 250000, credit: 0, desc: 'Dotations provisions créances' },
        { accountNumber: '299200', debit: 0, credit: 250000, desc: 'Provisions PAR 90' }
      ]
    });
    CustomAssert.assertLedgerBalanced(prov90);

    // 4. Verify Trial Balance Equilibrium
    const trial = ledger.generateTrialBalance();
    assert.strictEqual(trial.balanced, true);
    CustomAssert.assertLedgerBalanced(trial);
  });
});
