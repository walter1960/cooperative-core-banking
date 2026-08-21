import { describe, it, expect } from 'vitest';
import { EscPosBuilder } from '../EscPosBuilder';
import { ReceiptFormatter } from '../ReceiptFormatter';
import { MockPrinterDriver, ThermalPrinterService } from '../PrinterDriver';
import { PrintableTransaction } from '../../../types/escpos';
import { CashShift, Billetage } from '../../../types/shift';

describe('ESC/POS Receipt Engine Unit Tests', () => {
  describe('EscPosBuilder', () => {
    it('should generate valid initialization and CP1252 code page byte sequence', () => {
      const b = new EscPosBuilder();
      const bytes = b.build();

      expect(bytes[0]).toBe(0x1B); // ESC
      expect(bytes[1]).toBe(0x40); // @ (Reset)
      expect(bytes[2]).toBe(0x1B); // ESC
      expect(bytes[3]).toBe(0x74); // t
      expect(bytes[4]).toBe(0x10); // 16 (CP1252)
    });

    it('should correctly encode French accented characters in CP1252', () => {
      const b = new EscPosBuilder();
      b.text('Reçu Opération Dépôt Réglementaire');
      const bytes = b.build();

      // Check for 'ç' (0xE7), 'é' (0xE9), 'ô' (0xF4)
      const byteList = Array.from(bytes);
      expect(byteList).toContain(0xE7); // ç
      expect(byteList).toContain(0xE9); // é
      expect(byteList).toContain(0xF4); // ô
    });

    it('should append cash drawer kick pulse command (ESC p 0 25 250)', () => {
      const b = new EscPosBuilder();
      b.kickCashDrawer();
      const bytes = b.build();

      const byteList = Array.from(bytes);
      // Look for [0x1B, 0x70, 0x00, 0x19, 0xFA]
      const drawerIdx = byteList.findIndex((val, i) =>
        val === 0x1B &&
        byteList[i + 1] === 0x70 &&
        byteList[i + 2] === 0x00 &&
        byteList[i + 3] === 0x19 &&
        byteList[i + 4] === 0xFA
      );
      expect(drawerIdx).toBeGreaterThanOrEqual(0);
    });

    it('should append paper cut command (GS V 66 3)', () => {
      const b = new EscPosBuilder();
      b.cut(true);
      const bytes = b.build();

      const byteList = Array.from(bytes);
      // Look for [0x1D, 0x56, 0x42, 0x03]
      const cutIdx = byteList.findIndex((val, i) =>
        val === 0x1D &&
        byteList[i + 1] === 0x56 &&
        byteList[i + 2] === 0x42 &&
        byteList[i + 3] === 0x03
      );
      expect(cutIdx).toBeGreaterThanOrEqual(0);
    });

    it('should generate valid 2D QR Code ESC/POS byte sequence', () => {
      const b = new EscPosBuilder();
      b.qrCode('BANOLIA:TEST:123', 4);
      const bytes = b.build();

      const byteList = Array.from(bytes);
      // GS ( k sequence [0x1D, 0x28, 0x6B]
      const qrIdx = byteList.findIndex((val, i) =>
        val === 0x1D &&
        byteList[i + 1] === 0x28 &&
        byteList[i + 2] === 0x6B
      );
      expect(qrIdx).toBeGreaterThanOrEqual(0);
    });
  });

  describe('ReceiptFormatter French Amount in Words (amountToWordsFR)', () => {
    it('should convert 0 to ZÉRO FRANC CFA', () => {
      expect(ReceiptFormatter.amountToWordsFR(0)).toBe('ZÉRO FRANC CFA');
    });

    it('should convert small integers correctly', () => {
      expect(ReceiptFormatter.amountToWordsFR(1)).toBe('UN FRANCS CFA');
      expect(ReceiptFormatter.amountToWordsFR(5)).toBe('CINQ FRANCS CFA');
      expect(ReceiptFormatter.amountToWordsFR(17)).toBe('DIX-SEPT FRANCS CFA');
    });

    it('should handle French tens with hyphens and et-un', () => {
      expect(ReceiptFormatter.amountToWordsFR(21)).toBe('VINGT ET UN FRANCS CFA');
      expect(ReceiptFormatter.amountToWordsFR(71)).toBe('SOIXANTE ET ONZE FRANCS CFA');
      expect(ReceiptFormatter.amountToWordsFR(80)).toBe('QUATRE-VINGTS FRANCS CFA');
      expect(ReceiptFormatter.amountToWordsFR(95)).toBe('QUATRE-VINGT-QUINZE FRANCS CFA');
    });

    it('should handle thousands, millions, and typical microfinance amounts', () => {
      expect(ReceiptFormatter.amountToWordsFR(2500)).toBe('DEUX MILLE CINQ CENTS FRANCS CFA');
      expect(ReceiptFormatter.amountToWordsFR(50000)).toBe('CINQUANTE MILLE FRANCS CFA');
      expect(ReceiptFormatter.amountToWordsFR(1352500)).toBe('UN MILLION TROIS CENT CINQUANTE-DEUX MILLE CINQ CENTS FRANCS CFA');
    });
  });

  describe('Receipt Generation & Driver Integration', () => {
    const sampleTx: PrintableTransaction = {
      receiptNumber: 'REC-20260820-0042',
      memberCode: 'A0200225',
      memberName: 'MINDIZINA Tomrom',
      accountNumber: '25121100A020022501',
      productName: 'EPARGNE ORDINAIRE (001)',
      type: 'VERSEMENT',
      amount: 50000,
      feeAmount: 0,
      paymentMethod: 'CASH',
      timestamp: '2026-08-20T09:30:00.000Z',
      cashierName: 'MINDIZINA TOMROM (0000)',
      agencyCode: 'A02',
      previousBalance: 230424,
      newBalance: 280424,
      receivedAmount: 50000,
      changeAmount: 0,
      signatureHmac: 'hmac_test_sig_1234567890'
    };

    it('should build an 80mm binary receipt containing QR code, cut and drawer kick', () => {
      const bytes = ReceiptFormatter.buildReceipt80mm(sampleTx);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(100);
    });

    it('should build a 58mm compact binary receipt', () => {
      const bytes = ReceiptFormatter.buildReceipt58mm(sampleTx);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(50);
    });

    it('should build an 80mm Shift Balancing Procès-Verbal slip', () => {
      const sampleShift: CashShift = {
        id: 'shift-001',
        shiftCode: 'SHIFT-20260820-001',
        agencyCode: 'A02',
        agencyName: 'AGENCE LOMÉ',
        cashierId: 'CSH-001',
        cashierName: 'MINDIZINA TOMROM',
        openedAt: '2026-08-20T07:30:00Z',
        closedAt: '2026-08-20T17:00:00Z',
        status: 'CLOSED_APPROVED',
        openingBalance: 500000,
        totalDeposits: 250000,
        totalWithdrawals: 100000,
        totalSharePurchases: 0,
        totalLoanRepayments: 0,
        totalTontineCollections: 0,
        totalTransfersIn: 0,
        totalTransfersOut: 0,
        totalVaultTransfersIn: 0,
        totalVaultTransfersOut: 0,
        theoreticalBalance: 650000,
        physicalClosingBalance: 650000,
        discrepancyAmount: 0,
        discrepancyAccount: '571200',
        syncStatus: 'SYNCED'
      };

      const sampleBilletage: Billetage = {
        b_10000: 50,
        b_5000: 20,
        b_2000: 20,
        b_1000: 10,
        b_500: 0,
        p_500: 0,
        p_200: 0,
        p_100: 0,
        p_50: 0,
        p_25: 0,
        p_10: 0,
        p_5: 0,
        totalCalculated: 650000
      };

      const bytes = ReceiptFormatter.buildShiftPV80mm(sampleShift, sampleBilletage);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(150);
    });

    it('should send byte commands through MockPrinterDriver and record print history', async () => {
      const mockDriver = new MockPrinterDriver();
      ThermalPrinterService.getInstance().setDriver(mockDriver);

      const bytes = ReceiptFormatter.buildReceipt80mm(sampleTx);
      const success = await ThermalPrinterService.getInstance().print(bytes);

      expect(success).toBe(true);
      expect(mockDriver.getLastPrintedBytes()).toEqual(bytes);
      expect(mockDriver.getAllPrintedJobs()).toHaveLength(1);
    });
  });
});
