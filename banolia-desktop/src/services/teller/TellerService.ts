import { db, BanoliaDatabase } from '../../db/database';
import { TransactionManager, ProcessTransactionParams } from '../../db/transactionManager';
import { DbMember, DbAccount, DbTransaction } from '../../types/database';
import { CryptoService } from '../crypto/CryptoService';

export interface CreateMemberAccountParams {
  fullName: string;
  birthDate: string;
  address: string;
  city: string;
  phone: string;
  spouseName?: string;
  employeeId?: string;
  position?: string;
  hireDate?: string;
  monthlySavingsTarget?: number;
  isPayrollDeduction?: boolean;
  emergencyContact?: string;
  sharesCount: number; // e.g. 1 share = 5000 XOF
  initialDepositAmount: number; // e.g. 10000 XOF
  cashierId: string;
  cashierName: string;
  agencyCode: string;
  isOnline: boolean;
  fingerprintTemplate?: string;
}

export class TellerService {
  /**
   * Creates a new Member and their associated Ordinary Savings & Share Capital Accounts
   */
  public static async createMemberWithAccounts(
    params: CreateMemberAccountParams,
    customDb?: BanoliaDatabase
  ): Promise<{
    member: DbMember;
    savingsAccount: DbAccount;
    shareAccount: DbAccount;
    transactions: DbTransaction[];
  }> {
    const targetDb = customDb || db;
    const now = new Date().toISOString();

    const memberCount = await targetDb.members.count();
    const memberCode = `A02${String(memberCount + 225).padStart(5, '0')}`;
    const manualNumber = String(610 + memberCount);
    const memberId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const shareUnitPrice = 5000;
    const totalShareCapital = params.sharesCount * shareUnitPrice;

    const newMember: DbMember = {
      id: memberId,
      code: memberCode,
      manualNumber,
      fullName: params.fullName,
      birthDate: params.birthDate,
      registrationDate: now.slice(0, 10),
      address: params.address,
      city: params.city,
      phone: params.phone,
      spouseName: params.spouseName || '',
      employeeId: params.employeeId,
      position: params.position,
      hireDate: params.hireDate,
      monthlySavingsTarget: params.monthlySavingsTarget,
      isPayrollDeduction: params.isPayrollDeduction,
      emergencyContact: params.emergencyContact,
      sharesPurchased: totalShareCapital,
      sharesSold: 0,
      sharesAvailable: totalShareCapital,
      shareUnitPrice,
      status: 'ACTIF',
      fingerprintEnrolled: !!params.fingerprintTemplate,
      fingerprintTemplate: params.fingerprintTemplate,
      version: 1,
      createdAt: now,
      updatedAt: now
    };

    const savingsAccountNumber = `25121100${memberCode}01`;
    const shareAccountNumber = `10110000${memberCode}01`;

    const savingsAccount: DbAccount = {
      id: `acc_sav_${Date.now()}`,
      accountNumber: savingsAccountNumber,
      memberCode,
      productCode: '251211',
      productName: 'EPARGNE ORDINAIRE (001)',
      type: 'SAVINGS',
      realBalance: 0,
      frozenBalance: 0,
      availableBalance: 0,
      currency: 'XOF',
      status: 'ACTIF',
      version: 1,
      createdAt: now,
      updatedAt: now
    };

    const shareAccount: DbAccount = {
      id: `acc_shr_${Date.now()}`,
      accountNumber: shareAccountNumber,
      memberCode,
      productCode: '101100',
      productName: 'PARTS SOCIALES (005)',
      type: 'SHARES',
      realBalance: 0,
      frozenBalance: 0,
      availableBalance: 0,
      currency: 'XOF',
      status: 'ACTIF',
      version: 1,
      createdAt: now,
      updatedAt: now
    };

    await targetDb.transaction('rw', [targetDb.members, targetDb.accounts], async () => {
      await targetDb.members.add(newMember);
      await targetDb.accounts.add(savingsAccount);
      await targetDb.accounts.add(shareAccount);
    });

    const transactions: DbTransaction[] = [];

    // 1. Process Initial Share Purchase Deposit if > 0
    if (totalShareCapital > 0) {
      const shareTx = await TransactionManager.executeFinancialOperation({
        memberCode,
        memberName: params.fullName,
        accountNumber: shareAccountNumber,
        productName: 'PARTS SOCIALES (005)',
        type: 'SHARE_PURCHASE',
        amount: totalShareCapital,
        paymentMethod: 'CASH',
        cashierId: params.cashierId,
        cashierName: params.cashierName,
        agencyCode: params.agencyCode,
        isOnline: params.isOnline
      }, targetDb);
      transactions.push(shareTx.transaction);
    }

    // 2. Process Initial Savings Deposit if > 0
    if (params.initialDepositAmount > 0) {
      const depositTx = await TransactionManager.executeFinancialOperation({
        memberCode,
        memberName: params.fullName,
        accountNumber: savingsAccountNumber,
        productName: 'EPARGNE ORDINAIRE (001)',
        type: 'DEPOSIT',
        amount: params.initialDepositAmount,
        paymentMethod: 'CASH',
        cashierId: params.cashierId,
        cashierName: params.cashierName,
        agencyCode: params.agencyCode,
        isOnline: params.isOnline
      }, targetDb);
      transactions.push(depositTx.transaction);
    }

    return {
      member: newMember,
      savingsAccount,
      shareAccount,
      transactions
    };
  }

  /**
   * Calculates the exact bill/coin breakdown for cash change return
   */
  public static calculateChangeBreakdown(changeAmount: number): Array<{ denomination: number; count: number; label: string }> {
    if (changeAmount <= 0) return [];

    const denominations = [
      { val: 10000, label: '10 000 F' },
      { val: 5000, label: '5 000 F' },
      { val: 2000, label: '2 000 F' },
      { val: 1000, label: '1 000 F' },
      { val: 500, label: '500 F' },
      { val: 200, label: '200 F' },
      { val: 100, label: '100 F' },
      { val: 50, label: '50 F' },
      { val: 25, label: '25 F' },
      { val: 10, label: '10 F' },
      { val: 5, label: '5 F' }
    ];

    let remaining = changeAmount;
    const breakdown: Array<{ denomination: number; count: number; label: string }> = [];

    for (const d of denominations) {
      if (remaining >= d.val) {
        const count = Math.floor(remaining / d.val);
        remaining = remaining % d.val;
        breakdown.push({ denomination: d.val, count, label: d.label });
      }
    }

    return breakdown;
  }
}
