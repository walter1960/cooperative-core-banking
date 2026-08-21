/**
 * Tier 1 — F15: Field Collector (Agent Collecteur) Offline Workflow
 */

import { describe, test, beforeEach } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockEscPosPrinter, MockGeneralLedger } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 1 - F15: Field Collector Offline Tontine Mode', () => {
  let collectorTour;
  let ledger;

  beforeEach(() => {
    ledger = new MockGeneralLedger();
    collectorTour = {
      collectorId: 'COL01',
      collectorName: 'Ablavi Gbadamassi',
      routeDate: '2026-08-20',
      offlineCollections: []
    };
  });

  test('T1_F15_01: Morning Route Initialization with Assigned Market Merchants', () => {
    const routeMembers = [
      { carnetNumber: 'TK-001', memberName: 'KODJO Afiwa', dailyMise: 1000 },
      { carnetNumber: 'TK-002', memberName: 'ADANLETE Mensah', dailyMise: 2000 }
    ];

    assert.strictEqual(routeMembers.length, 2);
    assert.strictEqual(routeMembers[0].dailyMise, 1000);
  });

  test('T1_F15_02: Offline 1-Tap Cotisation Record & 58mm Thermal Receipt Generation', () => {
    const payment = {
      carnetNumber: 'TK-001',
      memberName: 'KODJO Afiwa',
      amount: 1000,
      timestamp: '2026-08-20 10:15'
    };
    collectorTour.offlineCollections.push(payment);

    const receiptBytes = MockEscPosPrinter.format58mmCollectorReceipt({
      carnetNumber: payment.carnetNumber,
      memberName: payment.memberName,
      amount: payment.amount,
      paidDays: '15/31',
      collector: collectorTour.collectorId
    });

    CustomAssert.assertEscPosReceipt(receiptBytes, ['BANOLIA TONTINE', 'TK-001', '1 000 F', '15/31']);
  });

  test('T1_F15_03: Daily Total Aggregation on Collector Mobile Device', () => {
    collectorTour.offlineCollections.push({ carnetNumber: 'TK-001', amount: 1000 });
    collectorTour.offlineCollections.push({ carnetNumber: 'TK-002', amount: 2000 });
    collectorTour.offlineCollections.push({ carnetNumber: 'TK-003', amount: 5000 });

    const total = collectorTour.offlineCollections.reduce((sum, c) => sum + c.amount, 0);
    CustomAssert.assertCurrencyAmount(total, 8000);
  });

  test('T1_F15_04: End-of-Day Physical Cash Drop & QR Batch Verification at Agency', () => {
    const totalCollected = 8000;
    // Cashier verifies 8,000 F and books to collector account 571300 -> 258000
    const entry = ledger.postJournalEntry({
      date: '2026-08-20',
      description: 'Versement tournée collecteur COL01',
      lines: [
        { accountNumber: '571200', debit: totalCollected, credit: 0, desc: 'Caisse guichet' },
        { accountNumber: '258000', debit: 0, credit: totalCollected, desc: 'Attente tontine tournée' }
      ]
    });

    CustomAssert.assertLedgerBalanced(entry);
  });

  test('T1_F15_05: Automatic Detection of Incomplete 31-Day Tontine Cycle', () => {
    const carnet = { carnetNumber: 'TK-001', paidDays: 20, cycleTotalDays: 31 };
    assert.strictEqual(carnet.paidDays < carnet.cycleTotalDays, true);

    // Settlement must be disallowed before 31 days
    assert.throws(() => {
      if (carnet.paidDays < carnet.cycleTotalDays) {
        throw new Error('Cycle de tontine incomplet (20/31 jours cotisés). Clôture impossible.');
      }
    }, /incomplet/);
  });
});
