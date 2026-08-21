import { GeneralLedgerEngine } from '../accounting/ledger';
import { STANDARD_GL_ACCOUNTS, BCEAO_REGULATIONS } from '../config/constants';

export type MemberLegalType = 'INDIVIDUAL' | 'LEGAL_ENTITY' | 'INFORMAL_GROUP';
export type MemberStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'DORMANT' | 'SUSPENDED' | 'EXPELLED' | 'DECEASED';
export type IdDocumentType = 'CNI' | 'PASSPORT' | 'VOTER_CARD' | 'DRIVING_LICENSE' | 'CONSULAR_CARD';
export type Gender = 'M' | 'F' | 'OTHER';
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';

export interface MemberKYC {
  id: string;
  agencyId: string;
  code: string;                        // e.g. 'A01-2026-000142'
  manualNumber?: string;               // Legacy paper registry ID
  legalType: MemberLegalType;
  fullName: string;
  gender: Gender;
  birthDate: string;                   // 'YYYY-MM-DD'
  birthPlace?: string;
  nationality: string;                 // Default: 'Togolaise' / UMOA
  idType: IdDocumentType;
  idNumber: string;
  idIssueDate?: string;
  idExpiryDate?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address: string;
  city: string;
  district?: string;
  profession?: string;
  monthlyIncome?: number;
  maritalStatus?: MaritalStatus;
  spouseName?: string;
  spousePhone?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinRelationship?: string;
  sharesPurchased: number;             // Subscribed and paid shares
  sharesNonLiberated: number;          // Subscribed but unpaid shares
  shareUnitPrice: number;              // Default: 10 000 XOF
  status: MemberStatus;
  avatarUrl?: string;
  fingerprintTemplate?: string;
  registrationDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShareTransactionResult {
  memberId: string;
  sharesSubscribed: number;
  sharesLiberated: number;
  sharesNonLiberated: number;
  totalAmountPaid: number;
  admissionFeePaid: number;
  journalEntryId?: string;
}

export class MemberDomainService {
  /**
   * Generates deterministic, tamper-proof member code: [AGENCY-YYYY-SEQ6]
   */
  public static generateMemberCode(agencyCode: string, year: number | string, sequenceNumber: number): string {
    const seqPadded = String(sequenceNumber).padStart(6, '0');
    return `${agencyCode}-${year}-${seqPadded}`;
  }

  /**
   * Subscribes member share capital (parts sociales) with immediate full or partial liberation.
   */
  public static subscribeShares(params: {
    member: MemberKYC;
    shareCount: number;
    unitPrice?: number;
    admissionFee?: number;
    paidSharesCount?: number;
    ledger?: GeneralLedgerEngine;
    agencyId: string;
    date: string;
    createdBy: string;
  }): ShareTransactionResult {
    const unitPrice = params.unitPrice || params.member.shareUnitPrice || BCEAO_REGULATIONS.SAVINGS.DEFAULT_SHARE_PRICE;
    const admissionFee = params.admissionFee || 0;
    const paidShares = params.paidSharesCount !== undefined ? params.paidSharesCount : params.shareCount;
    const unpaidShares = params.shareCount - paidShares;

    if (paidShares < 0 || unpaidShares < 0) {
      throw new Error('Invalid paid shares count.');
    }

    const paidShareAmount = paidShares * unitPrice;
    const unpaidShareAmount = unpaidShares * unitPrice;
    const totalCashPaid = paidShareAmount + admissionFee;

    // Mutate member state
    params.member.sharesPurchased += paidShares;
    params.member.sharesNonLiberated += unpaidShares;
    if (params.member.status === 'PENDING_APPROVAL' && params.member.sharesPurchased >= 1) {
      params.member.status = 'ACTIVE';
    }
    params.member.updatedAt = new Date().toISOString();

    let journalEntryId: string | undefined;

    // Post to General Ledger if engine provided
    if (params.ledger) {
      const entry = params.ledger.postShareSubscription({
        agencyId: params.agencyId,
        shareAmount: paidShareAmount,
        feeAmount: admissionFee,
        unpaidShareAmount: unpaidShareAmount,
        memberCode: params.member.code,
        date: params.date,
        createdBy: params.createdBy
      });
      journalEntryId = entry.id;
    }

    return {
      memberId: params.member.id,
      sharesSubscribed: params.shareCount,
      sharesLiberated: paidShares,
      sharesNonLiberated: unpaidShares,
      totalAmountPaid: totalCashPaid,
      admissionFeePaid: admissionFee,
      journalEntryId
    };
  }

  /**
   * Transfer shares between two members (Cession de parts sociales)
   */
  public static transferShares(params: {
    fromMember: MemberKYC;
    toMember: MemberKYC;
    shareCount: number;
    transferFee?: number;
    ledger?: GeneralLedgerEngine;
    agencyId: string;
    date: string;
    createdBy: string;
  }): { success: boolean; transferFee: number; journalEntryId?: string } {
    if (params.fromMember.sharesPurchased < params.shareCount) {
      throw new Error(`Insufficient shares to transfer: Member has ${params.fromMember.sharesPurchased}, requested ${params.shareCount}`);
    }

    params.fromMember.sharesPurchased -= params.shareCount;
    params.toMember.sharesPurchased += params.shareCount;
    params.fromMember.updatedAt = new Date().toISOString();
    params.toMember.updatedAt = new Date().toISOString();

    const fee = params.transferFee || 0;
    let journalEntryId: string | undefined;

    if (params.ledger && fee > 0) {
      const entry = params.ledger.postJournalEntry({
        agencyId: params.agencyId,
        dateAccounting: params.date,
        description: `Frais transfert de parts sociales de ${params.fromMember.code} vers ${params.toMember.code}`,
        createdBy: params.createdBy,
        lines: [
          { glAccount: STANDARD_GL_ACCOUNTS.TELLER_CASH, debit: fee, credit: 0, lineDescription: 'Frais de cession de parts sociales' },
          { glAccount: STANDARD_GL_ACCOUNTS.ACCOUNT_MAINTENANCE_FEES, debit: 0, credit: fee, lineDescription: 'Commissions SFD sur transfert de parts' }
        ]
      });
      journalEntryId = entry.id;
    }

    return {
      success: true,
      transferFee: fee,
      journalEntryId
    };
  }

  /**
   * Share Repurchase / Refund on resignation or expulsion (Rachat de parts sociales)
   * Offsets against any outstanding member debt.
   */
  public static repurchaseShares(params: {
    member: MemberKYC;
    shareCount: number;
    outstandingDebts: number;
    ledger?: GeneralLedgerEngine;
    agencyId: string;
    date: string;
    createdBy: string;
  }): { refundAmount: number; debtOffsetAmount: number; journalEntryId?: string } {
    if (params.member.sharesPurchased < params.shareCount) {
      throw new Error(`Cannot repurchase more shares than member owns: ${params.member.sharesPurchased}`);
    }

    const unitPrice = params.member.shareUnitPrice || BCEAO_REGULATIONS.SAVINGS.DEFAULT_SHARE_PRICE;
    const grossRefund = params.shareCount * unitPrice;
    const debtOffset = Math.min(grossRefund, params.outstandingDebts);
    const netPayout = grossRefund - debtOffset;

    params.member.sharesPurchased -= params.shareCount;
    if (params.member.sharesPurchased === 0) {
      params.member.status = 'SUSPENDED';
    }
    params.member.updatedAt = new Date().toISOString();

    let journalEntryId: string | undefined;

    if (params.ledger) {
      const lines = [
        { glAccount: STANDARD_GL_ACCOUNTS.SHARE_CAPITAL_INDIVIDUAL, debit: grossRefund, credit: 0, lineDescription: `Rachat parts ${params.member.code}` }
      ];
      if (debtOffset > 0) {
        lines.push({ glAccount: STANDARD_GL_ACCOUNTS.LOANS_SHORT_TERM, debit: 0, credit: debtOffset, lineDescription: 'Compensation créances impayées' });
      }
      if (netPayout > 0) {
        lines.push({ glAccount: STANDARD_GL_ACCOUNTS.TELLER_CASH, debit: 0, credit: netPayout, lineDescription: 'Remboursement net espèces au membre' });
      }

      const entry = params.ledger.postJournalEntry({
        agencyId: params.agencyId,
        dateAccounting: params.date,
        description: `Rachat de parts sociales adhérent ${params.member.code}`,
        createdBy: params.createdBy,
        lines
      });
      journalEntryId = entry.id;
    }

    return {
      refundAmount: netPayout,
      debtOffsetAmount: debtOffset,
      journalEntryId
    };
  }

  /**
   * Distribute Dividends on Shares (Rémunération des parts sociales)
   */
  public static distributeDividends(params: {
    members: MemberKYC[];
    dividendRatePercent: number; // e.g. 5.0 for 5%
    ledger?: GeneralLedgerEngine;
    agencyId: string;
    date: string;
    createdBy: string;
  }): { totalDividendsDistributed: number; allocations: Array<{ memberId: string; amount: number }>; journalEntryId?: string } {
    let totalDividends = 0;
    const allocations: Array<{ memberId: string; amount: number }> = [];

    for (const mem of params.members) {
      if (mem.sharesPurchased > 0 && mem.status === 'ACTIVE') {
        const capital = mem.sharesPurchased * (mem.shareUnitPrice || BCEAO_REGULATIONS.SAVINGS.DEFAULT_SHARE_PRICE);
        const dividend = Math.round((capital * params.dividendRatePercent) / 100);
        if (dividend > 0) {
          allocations.push({ memberId: mem.id, amount: dividend });
          totalDividends += dividend;
        }
      }
    }

    let journalEntryId: string | undefined;

    if (params.ledger && totalDividends > 0) {
      const entry = params.ledger.postJournalEntry({
        agencyId: params.agencyId,
        dateAccounting: params.date,
        description: `Distribution dividendes sur parts sociales (${params.dividendRatePercent}%)`,
        createdBy: params.createdBy,
        lines: [
          { glAccount: STANDARD_GL_ACCOUNTS.NET_INCOME_YEAR, debit: totalDividends, credit: 0, lineDescription: 'Affectation du résultat en dividendes' },
          { glAccount: STANDARD_GL_ACCOUNTS.DEMAND_DEPOSITS_INDIVIDUAL, debit: 0, credit: totalDividends, lineDescription: 'Crédit comptes épargne des membres' }
        ]
      });
      journalEntryId = entry.id;
    }

    return {
      totalDividendsDistributed: totalDividends,
      allocations,
      journalEntryId
    };
  }
}
