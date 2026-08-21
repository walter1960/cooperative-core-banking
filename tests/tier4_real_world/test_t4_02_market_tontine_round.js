/**
 * Tier 4 — 02: Market Tontine Collector Tour (150 Members, 120 Collections, EOD Settlement)
 */

import { describe, test } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockGeneralLedger, MockEscPosPrinter } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 4 - 02: Market Tontine Collector Tour Simulation', () => {
  test('T4_02: Full Day Field Collector Route with 120 Receipts and Agency Settlement', () => {
    const ledger = new MockGeneralLedger();

    // 1. Morning Route assigned: 150 market members
    const assignedRoute = [];
    for (let i = 1; i <= 150; i++) {
      assignedRoute.push({
        carnetNumber: `TK-${String(i).padStart(4, '0')}`,
        memberName: `Marchande ${i}`,
        dailyMise: 1000,
        paid: false
      });
    }

    // 2. Collector visits market: 120 members present and pay 1,000 F each
    const dailyCollections = [];
    for (let i = 0; i < 120; i++) {
      const item = assignedRoute[i];
      item.paid = true;
      dailyCollections.push({
        carnetNumber: item.carnetNumber,
        memberName: item.memberName,
        amount: item.dailyMise,
        paidDays: '18/31',
        collectedAt: new Date().toISOString()
      });

      // Bluetooth Mini-Receipt printed for member
      const btReceipt = MockEscPosPrinter.format58mmCollectorReceipt({
        carnetNumber: item.carnetNumber,
        memberName: item.memberName,
        amount: item.dailyMise,
        paidDays: '18/31',
        collector: 'COL01'
      });
      assert.ok(btReceipt.length > 30);
    }

    assert.strictEqual(dailyCollections.length, 120);
    const totalCashCollected = dailyCollections.reduce((sum, c) => sum + c.amount, 0);
    CustomAssert.assertCurrencyAmount(totalCashCollected, 120000);

    // 3. Evening Return to Agency: QR Batch Scanning & Cash Handover (120,000 XOF)
    const entry = ledger.postJournalEntry({
      date: '2026-08-20',
      description: 'Versement retour tournée 120 cotisations tontine collecteur COL01',
      lines: [
        { accountNumber: '571200', debit: totalCashCollected, credit: 0, desc: 'Caisse centrale agence' },
        { accountNumber: '258000', debit: 0, credit: totalCashCollected, desc: 'Comptes attente tontines' }
      ]
    });

    CustomAssert.assertLedgerBalanced(entry);
    const tontineSuspense = ledger.getAccount('258000');
    assert.strictEqual(tontineSuspense.currentCredit, 120000);
  });
});
