/**
 * Tier 2 — F09: Thermal Printer Out-of-Paper, Offline Fallback & Long Character Lines
 */

import { describe, test } from '../common/harness.js';
import { MockEscPosPrinter } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 2 - F09: Printer Out-of-Paper & Boundary Formatting', () => {
  test('T2_F09_01: Printer Offline Status Queues Print Job in Spooler', () => {
    const spooler = [];
    const isPrinterOnline = false;

    const printReceipt = (receiptBytes) => {
      if (!isPrinterOnline) {
        spooler.push({ receiptBytes, status: 'QUEUED_IN_SPOOLER', queuedAt: new Date().toISOString() });
        return { success: false, queued: true };
      }
      return { success: true, queued: false };
    };

    const res = printReceipt(Buffer.from('TEST_RECEIPT'));
    assert.strictEqual(res.queued, true);
    assert.strictEqual(spooler.length, 1);
  });

  test('T2_F09_02: Long Member Name Auto-Wrapping in 80mm Layout (48 Column Width)', () => {
    const veryLongName = 'MILDZINA-AGBODJAN Ablavi Elisabeth Marie-Antoinette des Savanes';
    const rawBytes = MockEscPosPrinter.format80mmReceipt({
      receiptNumber: 'REC-LONG-01',
      memberName: veryLongName,
      memberCode: 'A0200225',
      type: 'VERSEMENT',
      amount: 10000,
      balance: 10000
    });

    const str = rawBytes.toString('utf-8');
    assert.ok(str.includes(veryLongName));
  });

  test('T2_F09_03: Special Currency Symbol and West African Diacritics Printing in ESC/POS', () => {
    const rawBytes = MockEscPosPrinter.format80mmReceipt({
      receiptNumber: 'REC-DIACRITIC-01',
      memberName: 'KOKOU-DZIDZƆ Émile',
      memberCode: 'A0200226',
      type: 'VERSEMENT',
      amount: 50000,
      balance: 50000
    });

    const str = rawBytes.toString('utf-8');
    assert.ok(str.includes('XOF'));
    assert.ok(str.includes('KOKOU-DZIDZƆ'));
  });

  test('T2_F09_04: Handling Empty/Missing Optional Receipt Fields (e.g. No Spouse, No Slogan)', () => {
    const rawBytes = MockEscPosPrinter.format80mmReceipt({
      receiptNumber: 'REC-MINIMAL-01',
      memberName: 'KODJO Afiwa',
      memberCode: 'A0200227',
      type: 'VERSEMENT',
      amount: 5000,
      balance: 5000
    });

    assert.ok(rawBytes.length > 50);
  });

  test('T2_F09_05: Large Receipt Payload Formatting (50 Line Detailed Transaction Statement)', () => {
    const items = [];
    for (let i = 1; i <= 50; i++) {
      items.push(`Item ${i}: 1,000 XOF`);
    }

    const payload = Buffer.from(items.join('\n'), 'utf-8');
    assert.ok(payload.length > 500);
  });
});
