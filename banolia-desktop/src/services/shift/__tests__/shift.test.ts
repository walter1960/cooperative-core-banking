import { describe, it, expect, beforeEach } from 'vitest';
import { ShiftService } from '../ShiftService';
import { BanoliaDatabase } from '../../../db/database';
import { Billetage } from '../../../types/shift';
import { DbCashShift } from '../../../types/database';

describe('Cashier Shift Balancing Unit & Integration Tests', () => {
  let testDb: BanoliaDatabase;

  beforeEach(async () => {
    testDb = new BanoliaDatabase(`test_shift_db_${Date.now()}`);
    await testDb.open();
  });

  describe('calculateBilletageTotal (12 Denominations)', () => {
    it('should accurately compute monetary sum across all 12 legal tender denominations', () => {
      const sampleBilletage: Billetage = {
        b_10000: 10, // 100 000
        b_5000: 5,   // 25 000
        b_2000: 10,  // 20 000
        b_1000: 5,   // 5 000
        b_500: 4,    // 2 000
        p_500: 2,    // 1 000
        p_200: 5,    // 1 000
        p_100: 5,    // 500
        p_50: 4,     // 200
        p_25: 2,     // 50
        p_10: 4,     // 40
        p_5: 2,      // 10
        totalCalculated: 0
      };

      const total = ShiftService.calculateBilletageTotal(sampleBilletage);
      expect(total).toBe(154800);
    });

    it('should return 0 for zero or empty counts', () => {
      expect(ShiftService.calculateBilletageTotal({})).toBe(0);
    });

    it('should handle large physical cash sums (> 50 000 000 XOF)', () => {
      const largeBilletage: Partial<Billetage> = {
        b_10000: 5000, // 50 000 000
        b_5000: 1000   // 5 000 000
      };
      expect(ShiftService.calculateBilletageTotal(largeBilletage)).toBe(55000000);
    });
  });

  describe('reconcileShift SFD Regulatory Rules', () => {
    const mockShift: DbCashShift = {
      id: 'shift-100',
      shiftCode: 'SHIFT-20260820-100',
      cashierId: 'CSH-001',
      cashierName: 'MINDIZINA TOMROM',
      agencyCode: 'A02',
      agencyName: 'LOMÉ',
      openedAt: '2026-08-20T07:30:00Z',
      openingBalance: 500000,
      totalDeposits: 100000,
      totalWithdrawals: 50000,
      totalTransfersIn: 0,
      totalTransfersOut: 0,
      totalVaultIn: 0,
      totalVaultOut: 0,
      theoreticalClosingBalance: 550000,
      status: 'OPEN_ACTIVE',
      createdAt: '2026-08-20T07:30:00Z'
    };

    it('should classify zero difference as Balanced (571200)', () => {
      const balancedBilletage: Billetage = {
        b_10000: 55, // 550 000
        b_5000: 0,
        b_2000: 0,
        b_1000: 0,
        b_500: 0,
        p_500: 0,
        p_200: 0,
        p_100: 0,
        p_50: 0,
        p_25: 0,
        p_10: 0,
        p_5: 0,
        totalCalculated: 550000
      };

      const result = ShiftService.reconcileShift(mockShift, balancedBilletage);
      expect(result.discrepancy).toBe(0);
      expect(result.imputationAccount).toBe('571200');
      expect(result.validationError).toBeUndefined();
    });

    it('should require mandatory reason for Deficit (SFD 471200)', () => {
      const deficitBilletage: Billetage = {
        b_10000: 54, // 540 000 (-10 000 deficit)
        b_5000: 0,
        b_2000: 0,
        b_1000: 0,
        b_500: 0,
        p_500: 0,
        p_200: 0,
        p_100: 0,
        p_50: 0,
        p_25: 0,
        p_10: 0,
        p_5: 0,
        totalCalculated: 540000
      };

      // Missing reason -> Validation error
      const withoutReason = ShiftService.reconcileShift(mockShift, deficitBilletage, '');
      expect(withoutReason.discrepancy).toBe(-10000);
      expect(withoutReason.imputationAccount).toBe('471200');
      expect(withoutReason.validationError).toBeDefined();

      // With reason -> Valid
      const withReason = ShiftService.reconcileShift(mockShift, deficitBilletage, 'Erreur de caisse rendu');
      expect(withReason.validationError).toBeUndefined();
    });

    it('should require mandatory reason for Surplus (SFD 472200)', () => {
      const surplusBilletage: Billetage = {
        b_10000: 56, // 560 000 (+10 000 surplus)
        b_5000: 0,
        b_2000: 0,
        b_1000: 0,
        b_500: 0,
        p_500: 0,
        p_200: 0,
        p_100: 0,
        p_50: 0,
        p_25: 0,
        p_10: 0,
        p_5: 0,
        totalCalculated: 560000
      };

      const res = ShiftService.reconcileShift(mockShift, surplusBilletage, 'Billet supplémentaire retrouvé');
      expect(res.discrepancy).toBe(10000);
      expect(res.imputationAccount).toBe('472200');
      expect(res.validationError).toBeUndefined();
    });
  });

  describe('Shift Lifecycle FSM & Procès-Verbal Generation', () => {
    it('should open shift, validate opening billetage, close shift, and generate signed PV report', async () => {
      const openingBilletage: Billetage = {
        b_10000: 30, // 300 000
        b_5000: 20,  // 100 000
        b_2000: 30,  // 60 000
        b_1000: 25,  // 25 000
        b_500: 20,   // 10 000
        p_500: 6,    // 3 000
        p_200: 5,    // 1 000
        p_100: 8,    // 800
        p_50: 2,     // 100
        p_25: 2,     // 50
        p_10: 4,     // 40
        p_5: 2,      // 10
        totalCalculated: 500000
      };

      // 1. Open shift
      const openedShift = await ShiftService.openShift({
        cashierId: 'CSH-001',
        cashierName: 'MINDIZINA TOMROM',
        agencyCode: 'A02',
        agencyName: 'AGENCE LOMÉ',
        openingBalance: 500000,
        billetage: openingBilletage
      }, testDb);

      expect(openedShift.status).toBe('OPEN_ACTIVE');
      expect(openedShift.theoreticalClosingBalance).toBe(500000);

      // 2. Re-open attempt should fail
      await expect(ShiftService.openShift({
        cashierId: 'CSH-002',
        cashierName: 'OTHER',
        agencyCode: 'A02',
        agencyName: 'LOMÉ',
        openingBalance: 500000,
        billetage: openingBilletage
      }, testDb)).rejects.toThrow();

      // 3. Close shift with physical count
      const closingBilletage = { ...openingBilletage }; // Balanced
      const pvReport = await ShiftService.closeAndApproveShift({
        shiftId: openedShift.id,
        closingBilletage,
        supervisorId: 'SUP-001',
        supervisorName: 'ADANGBO Kodjo'
      }, testDb);

      expect(pvReport.shift.status).toBe('CLOSED_APPROVED');
      expect(pvReport.shift.discrepancyAmount).toBe(0);
      expect(pvReport.verificationHash).toBeDefined();
      expect(pvReport.verificationHash.length).toBe(64); // SHA-256
    });
  });
});
