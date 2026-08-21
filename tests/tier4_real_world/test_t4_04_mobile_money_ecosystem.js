/**
 * Tier 4 — 04: Complete Mobile Money Ecosystem (Wave Deposit -> TMoney Transfer -> Flooz Repayment)
 */

import { describe, test } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockMobileMoneyGateway, MockGeneralLedger } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 4 - 04: Multi-Provider Telecom Ecosystem Simulation', () => {
  test('T4_04: Tripartite Telecom Flow Across Wave, TMoney and Flooz', async () => {
    const gateway = new MockMobileMoneyGateway();
    const ledger = new MockGeneralLedger();

    // 1. Wave Cash-In Deposit: 100,000 XOF into Member A0200225
    const waveRes = await gateway.initiateDeposit({
      provider: 'WAVE',
      phone: '+22890123456',
      amount: 100000,
      accountNumber: '25121100A020022501'
    });
    assert.strictEqual(waveRes.status, 'SUCCESS');

    ledger.postJournalEntry({
      date: '2026-08-20',
      description: `Encaissement Wave réf ${waveRes.txRef}`,
      lines: [
        { accountNumber: '578300', debit: 100000, credit: 0, desc: 'Compte Wave' },
        { accountNumber: '251211', debit: 0, credit: 100000, desc: 'DAV A0200225' }
      ]
    });

    // 2. TMoney Internal Member Transfer: 40,000 XOF from A0200225 to A0200226
    ledger.postJournalEntry({
      date: '2026-08-20',
      description: 'Virement interne TMoney A0200225 -> A0200226',
      lines: [
        { accountNumber: '251211', debit: 40000, credit: 0, desc: 'Débit DAV A0200225' },
        { accountNumber: '251211', debit: 0, credit: 40000, desc: 'Crédit DAV A0200226' }
      ]
    });

    // 3. Flooz Direct Loan Repayment: 20,000 XOF (18,000 principal + 2,000 interest)
    const floozRes = await gateway.initiateDeposit({
      provider: 'FLOOZ',
      phone: '+22899123456',
      amount: 20000,
      accountNumber: '25121100A020022601'
    });
    assert.strictEqual(floozRes.status, 'SUCCESS');

    const repayEntry = ledger.postJournalEntry({
      date: '2026-08-20',
      description: `Règlement échéance Flooz réf ${floozRes.txRef}`,
      lines: [
        { accountNumber: '578200', debit: 20000, credit: 0, desc: 'Compte Flooz Moov' },
        { accountNumber: '201100', debit: 0, credit: 18000, desc: 'Principal prêt' },
        { accountNumber: '701100', debit: 0, credit: 2000, desc: 'Intérêts crédit' }
      ]
    });
    CustomAssert.assertLedgerBalanced(repayEntry);

    // 4. Trial Balance Validation
    const trial = ledger.generateTrialBalance();
    assert.strictEqual(trial.balanced, true);
    CustomAssert.assertLedgerBalanced(trial);
  });
});
