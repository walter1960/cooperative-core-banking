/**
 * Tier 1 — F09: ESC/POS Thermal Receipt Engine (80mm & 58mm)
 */

import { describe, test } from '../common/harness.js';
import { CustomAssert } from '../common/assertions.js';
import { MockEscPosPrinter } from '../common/mocks.js';
import assert from 'node:assert/strict';

describe('Tier 1 - F09: ESC/POS Thermal Receipt Engine', () => {
  test('T1_F09_01: Generate 80mm Cash Deposit Thermal Receipt Stream', () => {
    const rawBytes = MockEscPosPrinter.format80mmReceipt({
      receiptNumber: 'REC-20260820-0042',
      memberName: 'MILDZINA Tomrom',
      memberCode: 'A0200225',
      type: 'VERSEMENT',
      amount: 50000,
      balance: 330424
    });

    assert.ok(rawBytes instanceof Buffer || rawBytes instanceof Uint8Array);
    CustomAssert.assertEscPosReceipt(rawBytes, [
      'COOPEC BANOLIA',
      'REC-20260820-0042',
      'MILDZINA Tomrom',
      '50 000',
      '330 424',
      'QR:'
    ]);
  });

  test('T1_F09_02: Generate 80mm Cash Withdrawal Thermal Receipt Stream', () => {
    const rawBytes = MockEscPosPrinter.format80mmReceipt({
      receiptNumber: 'REC-20260820-0043',
      memberName: 'ADANLETE Mensah',
      memberCode: 'A0200226',
      type: 'RETRAIT',
      amount: 20000,
      balance: 130000
    });

    CustomAssert.assertEscPosReceipt(rawBytes, [
      'REÇU DE RETRAIT',
      'REC-20260820-0043',
      'ADANLETE Mensah',
      '20 000'
    ]);
  });

  test('T1_F09_03: Generate 58mm Field Collector Portable Bluetooth Mini-Receipt', () => {
    const rawBytes = MockEscPosPrinter.format58mmCollectorReceipt({
      carnetNumber: 'TK-0883',
      memberName: 'KODJO Afiwa',
      amount: 1000,
      paidDays: '14/31',
      collector: 'COL01'
    });

    CustomAssert.assertEscPosReceipt(rawBytes, [
      'BANOLIA TONTINE',
      'TK-0883',
      'KODJO Afiwa',
      '1 000 F',
      '14/31'
    ]);
  });

  test('T1_F09_04: Verification QR Code Payload Formatting in ESC/POS Stream', () => {
    const rawBytes = MockEscPosPrinter.format80mmReceipt({
      receiptNumber: 'REC-20260820-0099',
      memberName: 'LAWSON Boevi',
      memberCode: 'A0200228',
      type: 'SOUSCRIPTION',
      amount: 50000,
      balance: 50000
    });

    const str = rawBytes.toString('utf-8');
    assert.ok(str.includes('QR:[v1:REC-20260820-0099:50000:A0200228]'));
  });

  test('T1_F09_05: ESC/POS Cash Drawer Kick Byte Sequence (0x1B, 0x70)', () => {
    const rawBytes = MockEscPosPrinter.format80mmReceipt({
      receiptNumber: 'REC-20260820-0001',
      memberName: 'MILDZINA Tomrom',
      memberCode: 'A0200225',
      type: 'VERSEMENT',
      amount: 10000,
      balance: 10000
    });

    // Check for drawer kick bytes: 0x1B 0x70 0x00 0x19 0xFA
    let foundKick = false;
    for (let i = 0; i < rawBytes.length - 4; i++) {
      if (
        rawBytes[i] === 0x1B &&
        rawBytes[i + 1] === 0x70 &&
        rawBytes[i + 2] === 0x00 &&
        rawBytes[i + 3] === 0x19 &&
        rawBytes[i + 4] === 0xFA
      ) {
        foundKick = true;
        break;
      }
    }
    assert.strictEqual(foundKick, true, 'Drawer kick command bytes must be present');
  });
});
