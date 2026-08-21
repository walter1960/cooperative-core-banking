import { db, BanoliaDatabase } from '../../db/database';
import { CashShift, Billetage, ShiftStatus, ShiftPVReport } from '../../types/shift';
import { DbCashShift, DbCashBilletage, DbAuditLog, DbOfflineSyncQueue } from '../../types/database';
import { CryptoService } from '../crypto/CryptoService';

export class ShiftService {
  /**
   * Calculates the exact monetary sum across all 12 BCEAO denominations
   */
  public static calculateBilletageTotal(b: Partial<Billetage>): number {
    const b10000 = (b.b_10000 || 0) * 10000;
    const b5000 = (b.b_5000 || 0) * 5000;
    const b2000 = (b.b_2000 || 0) * 2000;
    const b1000 = (b.b_1000 || 0) * 1000;
    const b500 = (b.b_500 || 0) * 500;

    const p500 = (b.p_500 || 0) * 500;
    const p200 = (b.p_200 || 0) * 200;
    const p100 = (b.p_100 || 0) * 100;
    const p50 = (b.p_50 || 0) * 50;
    const p25 = (b.p_25 || 0) * 25;
    const p10 = (b.p_10 || 0) * 10;
    const p5 = (b.p_5 || 0) * 5;

    return (
      b10000 + b5000 + b2000 + b1000 + b500 +
      p500 + p200 + p100 + p50 + p25 + p10 + p5
    );
  }

  /**
   * Retrieves the currently active shift from local DB
   */
  public static async getActiveShift(customDb?: BanoliaDatabase): Promise<DbCashShift | undefined> {
    const targetDb = customDb || db;
    return await targetDb.cashShifts
      .filter(s => s.status === 'OPEN_ACTIVE' || (s.status as string) === 'OPEN')
      .first();
  }

  /**
   * Opens a new Cashier Shift with validated Opening Billetage
   */
  public static async openShift(params: {
    cashierId: string;
    cashierName: string;
    agencyCode: string;
    agencyName: string;
    openingBalance: number;
    billetage: Billetage;
  }, customDb?: BanoliaDatabase): Promise<DbCashShift> {
    const targetDb = customDb || db;

    const existingOpen = await this.getActiveShift(targetDb);
    if (existingOpen) {
      throw new Error(`Une caisse est déjà ouverte (${existingOpen.shiftCode}). Clôturez-la avant d'en ouvrir une nouvelle.`);
    }

    const calculatedTotal = this.calculateBilletageTotal(params.billetage);
    if (calculatedTotal !== params.openingBalance) {
      throw new Error(
        `Le total du billetage (${calculatedTotal.toLocaleString('fr-FR')} F) ne correspond pas au solde d'ouverture déclaré (${params.openingBalance.toLocaleString('fr-FR')} F).`
      );
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const shiftCount = await targetDb.cashShifts.count();
    const shiftCode = `SHIFT-${dateStr}-${String(shiftCount + 1).padStart(3, '0')}`;
    const shiftId = `shift_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newShift: DbCashShift = {
      id: shiftId,
      shiftCode,
      cashierId: params.cashierId,
      cashierName: params.cashierName,
      agencyCode: params.agencyCode,
      agencyName: params.agencyName,
      openedAt: now.toISOString(),
      openingBalance: params.openingBalance,
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalTransfersIn: 0,
      totalTransfersOut: 0,
      totalVaultIn: 0,
      totalVaultOut: 0,
      theoreticalClosingBalance: params.openingBalance,
      status: 'OPEN_ACTIVE',
      createdAt: now.toISOString()
    };

    const billetageRecord: DbCashBilletage = {
      id: `bil_${Date.now()}_open`,
      shiftId,
      type: 'OPENING',
      b10000: params.billetage.b_10000,
      b5000: params.billetage.b_5000,
      b2000: params.billetage.b_2000,
      b1000: params.billetage.b_1000,
      b500: params.billetage.b_500,
      p500: params.billetage.p_500,
      p200: params.billetage.p_200,
      p100: params.billetage.p_100,
      p50: params.billetage.p_50,
      p25: params.billetage.p_25,
      p10: params.billetage.p_10,
      p5: params.billetage.p_5,
      totalCalculated: calculatedTotal,
      countedAt: now.toISOString(),
      countedBy: params.cashierName
    };

    const auditEntry: DbAuditLog = {
      id: `audit_${Date.now()}_shift_open`,
      userId: params.cashierId,
      action: 'SHIFT_OPENED',
      resourceType: 'CASH_SHIFT',
      resourceId: shiftId,
      afterStateJson: JSON.stringify(newShift),
      deviceFingerprint: CryptoService.getDeviceFingerprint(),
      timestamp: now.toISOString()
    };

    await targetDb.transaction('rw', [targetDb.cashShifts, targetDb.cashBilletages, targetDb.auditLogs], async () => {
      await targetDb.cashShifts.add(newShift);
      await targetDb.cashBilletages.add(billetageRecord);
      await targetDb.auditLogs.add(auditEntry);
    });

    return newShift;
  }

  /**
   * Reconciles Shift: compares Physical Closing Billetage with Theoretical Balance
   * Evaluates Deficit (SFD 471200) vs Surplus (SFD 472200) vs Balanced (571200)
   */
  public static reconcileShift(
    shift: DbCashShift,
    closingBilletage: Billetage,
    discrepancyReason?: string
  ): {
    physicalTotal: number;
    theoreticalBalance: number;
    discrepancy: number;
    imputationAccount: '471200' | '472200' | '571200';
    status: ShiftStatus;
    validationError?: string;
  } {
    const physicalTotal = this.calculateBilletageTotal(closingBilletage);
    const theoreticalBalance = shift.theoreticalClosingBalance;
    const discrepancy = physicalTotal - theoreticalBalance;

    let imputationAccount: '471200' | '472200' | '571200' = '571200';
    let status: ShiftStatus = 'RECONCILIATION';

    if (discrepancy < 0) {
      imputationAccount = '471200'; // Déficits de caisse à la charge du caissier
      if (!discrepancyReason || discrepancyReason.trim().length === 0) {
        return {
          physicalTotal,
          theoreticalBalance,
          discrepancy,
          imputationAccount,
          status,
          validationError: 'Un motif explicatif est obligatoire pour tout déficit de caisse (Compte SFD 471200).'
        };
      }
    } else if (discrepancy > 0) {
      imputationAccount = '472200'; // Excédents de caisse en attente d'imputation
      if (!discrepancyReason || discrepancyReason.trim().length === 0) {
        return {
          physicalTotal,
          theoreticalBalance,
          discrepancy,
          imputationAccount,
          status,
          validationError: 'Un motif explicatif est obligatoire pour tout excédent de caisse (Compte SFD 472200).'
        };
      }
    }

    return {
      physicalTotal,
      theoreticalBalance,
      discrepancy,
      imputationAccount,
      status
    };
  }

  /**
   * Approves and Closes Shift, produces immutable Procès-Verbal (PV) with cryptographic audit hash
   */
  public static async closeAndApproveShift(params: {
    shiftId: string;
    closingBilletage: Billetage;
    discrepancyReason?: string;
    supervisorId?: string;
    supervisorName?: string;
    supervisorNotes?: string;
  }, customDb?: BanoliaDatabase): Promise<ShiftPVReport> {
    const targetDb = customDb || db;

    const shift = await targetDb.cashShifts.get(params.shiftId);
    if (!shift) {
      throw new Error(`Caisse ${params.shiftId} introuvable.`);
    }

    const reconciliation = this.reconcileShift(shift, params.closingBilletage, params.discrepancyReason);
    if (reconciliation.validationError) {
      throw new Error(reconciliation.validationError);
    }

    const now = new Date().toISOString();
    const physicalTotal = reconciliation.physicalTotal;

    // Cryptographic PV Digital Signature Hash
    const rawSignaturePayload = `${shift.shiftCode}|${shift.cashierId}|${params.supervisorId || 'AUTO_SIGN'}|${physicalTotal}|${reconciliation.discrepancy}|${now}`;
    const pvHash = await CryptoService.hashSha256(rawSignaturePayload);

    shift.closedAt = now;
    shift.physicalClosingBalance = physicalTotal;
    shift.discrepancyAmount = reconciliation.discrepancy;
    shift.imputationAccount = reconciliation.imputationAccount;
    shift.discrepancyReason = params.discrepancyReason || '';
    shift.supervisorId = params.supervisorId || 'SUP-AUTO';
    shift.supervisorName = params.supervisorName || 'SUPERVISEUR D\'AGENCE';
    shift.supervisorNotes = params.supervisorNotes || '';
    shift.status = 'CLOSED_APPROVED';
    shift.pvSignatureHash = pvHash;

    const closingBilletageRecord: DbCashBilletage = {
      id: `bil_${Date.now()}_close`,
      shiftId: shift.id,
      type: 'CLOSING',
      b10000: params.closingBilletage.b_10000,
      b5000: params.closingBilletage.b_5000,
      b2000: params.closingBilletage.b_2000,
      b1000: params.closingBilletage.b_1000,
      b500: params.closingBilletage.b_500,
      p500: params.closingBilletage.p_500,
      p200: params.closingBilletage.p_200,
      p100: params.closingBilletage.p_100,
      p50: params.closingBilletage.p_50,
      p25: params.closingBilletage.p_25,
      p10: params.closingBilletage.p_10,
      p5: params.closingBilletage.p_5,
      totalCalculated: physicalTotal,
      countedAt: now,
      countedBy: shift.cashierName
    };

    const outboxItem: DbOfflineSyncQueue = {
      id: `queue_shift_close_${shift.id}`,
      entityType: 'SHIFT_EVENT',
      entityId: shift.id,
      payloadJson: JSON.stringify({ shift, closingBilletage: params.closingBilletage }),
      idempotencyKey: `idemp_shift_${shift.shiftCode}_${Date.now()}`,
      priority: 1, // Critical
      status: 'PENDING',
      retryCount: 0,
      createdAt: now
    };

    const auditEntry: DbAuditLog = {
      id: `audit_${Date.now()}_shift_close`,
      userId: shift.cashierId,
      action: 'SHIFT_CLOSED_APPROVED',
      resourceType: 'CASH_SHIFT',
      resourceId: shift.id,
      afterStateJson: JSON.stringify(shift),
      deviceFingerprint: CryptoService.getDeviceFingerprint(),
      timestamp: now
    };

    await targetDb.transaction('rw', [targetDb.cashShifts, targetDb.cashBilletages, targetDb.syncQueue, targetDb.auditLogs], async () => {
      await targetDb.cashShifts.put(shift);
      await targetDb.cashBilletages.add(closingBilletageRecord);
      await targetDb.syncQueue.add(outboxItem);
      await targetDb.auditLogs.add(auditEntry);
    });

    const shiftDomain: CashShift = {
      id: shift.id,
      shiftCode: shift.shiftCode,
      agencyCode: shift.agencyCode,
      agencyName: shift.agencyName,
      cashierId: shift.cashierId,
      cashierName: shift.cashierName,
      supervisorId: shift.supervisorId,
      supervisorName: shift.supervisorName,
      openedAt: shift.openedAt,
      closedAt: shift.closedAt,
      status: shift.status,
      openingBalance: shift.openingBalance,
      totalDeposits: shift.totalDeposits,
      totalWithdrawals: shift.totalWithdrawals,
      totalSharePurchases: 0,
      totalLoanRepayments: 0,
      totalTontineCollections: 0,
      totalTransfersIn: shift.totalTransfersIn,
      totalTransfersOut: shift.totalTransfersOut,
      totalVaultTransfersIn: shift.totalVaultIn,
      totalVaultTransfersOut: shift.totalVaultOut,
      theoreticalBalance: shift.theoreticalClosingBalance,
      physicalClosingBalance: shift.physicalClosingBalance,
      discrepancyAmount: shift.discrepancyAmount,
      discrepancyAccount: shift.imputationAccount as any,
      discrepancyReason: shift.discrepancyReason,
      closingBilletage: params.closingBilletage,
      pvHash: shift.pvSignatureHash,
      syncStatus: 'PENDING_OFFLINE'
    };

    return {
      shift: shiftDomain,
      closingBilletage: params.closingBilletage,
      generatedAt: now,
      verificationHash: pvHash
    };
  }
}
