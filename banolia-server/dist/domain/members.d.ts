import { GeneralLedgerEngine } from '../accounting/ledger';
export type MemberLegalType = 'INDIVIDUAL' | 'LEGAL_ENTITY' | 'INFORMAL_GROUP';
export type MemberStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'DORMANT' | 'SUSPENDED' | 'EXPELLED' | 'DECEASED';
export type IdDocumentType = 'CNI' | 'PASSPORT' | 'VOTER_CARD' | 'DRIVING_LICENSE' | 'CONSULAR_CARD';
export type Gender = 'M' | 'F' | 'OTHER';
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
export interface MemberKYC {
    id: string;
    agencyId: string;
    code: string;
    manualNumber?: string;
    legalType: MemberLegalType;
    fullName: string;
    gender: Gender;
    birthDate: string;
    birthPlace?: string;
    nationality: string;
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
    sharesPurchased: number;
    sharesNonLiberated: number;
    shareUnitPrice: number;
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
export declare class MemberDomainService {
    /**
     * Generates deterministic, tamper-proof member code: [AGENCY-YYYY-SEQ6]
     */
    static generateMemberCode(agencyCode: string, year: number | string, sequenceNumber: number): string;
    /**
     * Subscribes member share capital (parts sociales) with immediate full or partial liberation.
     */
    static subscribeShares(params: {
        member: MemberKYC;
        shareCount: number;
        unitPrice?: number;
        admissionFee?: number;
        paidSharesCount?: number;
        ledger?: GeneralLedgerEngine;
        agencyId: string;
        date: string;
        createdBy: string;
    }): ShareTransactionResult;
    /**
     * Transfer shares between two members (Cession de parts sociales)
     */
    static transferShares(params: {
        fromMember: MemberKYC;
        toMember: MemberKYC;
        shareCount: number;
        transferFee?: number;
        ledger?: GeneralLedgerEngine;
        agencyId: string;
        date: string;
        createdBy: string;
    }): {
        success: boolean;
        transferFee: number;
        journalEntryId?: string;
    };
    /**
     * Share Repurchase / Refund on resignation or expulsion (Rachat de parts sociales)
     * Offsets against any outstanding member debt.
     */
    static repurchaseShares(params: {
        member: MemberKYC;
        shareCount: number;
        outstandingDebts: number;
        ledger?: GeneralLedgerEngine;
        agencyId: string;
        date: string;
        createdBy: string;
    }): {
        refundAmount: number;
        debtOffsetAmount: number;
        journalEntryId?: string;
    };
    /**
     * Distribute Dividends on Shares (Rémunération des parts sociales)
     */
    static distributeDividends(params: {
        members: MemberKYC[];
        dividendRatePercent: number;
        ledger?: GeneralLedgerEngine;
        agencyId: string;
        date: string;
        createdBy: string;
    }): {
        totalDividendsDistributed: number;
        allocations: Array<{
            memberId: string;
            amount: number;
        }>;
        journalEntryId?: string;
    };
}
