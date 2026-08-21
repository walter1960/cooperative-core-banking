import { GLAccount, JournalEntryInput, JournalEntryRecord } from './types';
export declare class UnbalancedJournalEntryError extends Error {
    totalDebit: number;
    totalCredit: number;
    difference: number;
    constructor(totalDebit: number, totalCredit: number, difference: number);
}
export declare class InvalidAccountError extends Error {
    accountNumber: string;
    constructor(accountNumber: string);
}
export declare class GeneralLedgerEngine {
    private accounts;
    private journalEntries;
    private sequenceCounter;
    constructor(initialAccounts?: GLAccount[]);
    getAccount(accountNumber: string): GLAccount;
    getAllAccounts(): GLAccount[];
    getJournalEntries(): JournalEntryRecord[];
    /**
     * Posts an atomic, multi-line double-entry journal record.
     * Strictly enforces sum(debit) === sum(credit).
     */
    postJournalEntry(input: JournalEntryInput): JournalEntryRecord;
    /**
     * Helper: Deposit Cash into Member Ordinary Savings (DAV)
     */
    postDeposit(params: {
        agencyId: string;
        tellerAccount?: string;
        memberDAVAccount?: string;
        amount: number;
        memberCode: string;
        date: string;
        createdBy: string;
        transactionId?: string;
    }): JournalEntryRecord;
    /**
     * Helper: Cash Withdrawal from DAV with optional fee
     */
    postWithdrawal(params: {
        agencyId: string;
        tellerAccount?: string;
        memberDAVAccount?: string;
        amount: number;
        feeAmount?: number;
        memberCode: string;
        date: string;
        createdBy: string;
        transactionId?: string;
    }): JournalEntryRecord;
    /**
     * Helper: Share Capital Subscription + Admission Fee
     */
    postShareSubscription(params: {
        agencyId: string;
        tellerAccount?: string;
        shareAmount: number;
        feeAmount: number;
        unpaidShareAmount?: number;
        memberCode: string;
        date: string;
        createdBy: string;
        transactionId?: string;
    }): JournalEntryRecord;
    /**
     * Helper: Tontine Daily Collection on the field
     */
    postTontineCollection(params: {
        agencyId: string;
        collectorAccount?: string;
        dailyAmount: number;
        carnetNumber: string;
        memberCode: string;
        date: string;
        createdBy: string;
        transactionId?: string;
    }): JournalEntryRecord;
    /**
     * Helper: Tontine Cycle Maturity Settlement (30 days to DAV, 1 day to 704000)
     */
    postTontineSettlement(params: {
        agencyId: string;
        totalCollected: number;
        sfdCommission: number;
        memberDAVAccount?: string;
        carnetNumber: string;
        memberCode: string;
        date: string;
        createdBy: string;
        transactionId?: string;
    }): JournalEntryRecord;
    /**
     * Helper: Loan Disbursement
     */
    postLoanDisbursement(params: {
        agencyId: string;
        loanAmount: number;
        feeAmount: number;
        disbursementAccount?: string;
        loanGLAccount?: string;
        loanNumber: string;
        date: string;
        createdBy: string;
        transactionId?: string;
    }): JournalEntryRecord;
    /**
     * Helper: Loan Repayment Installment
     */
    postLoanRepayment(params: {
        agencyId: string;
        tellerAccount?: string;
        principalPaid: number;
        interestPaid: number;
        penaltyPaid?: number;
        loanGLAccount?: string;
        loanNumber: string;
        date: string;
        createdBy: string;
        transactionId?: string;
    }): JournalEntryRecord;
    /**
     * Helper: Cash Discrepancy Shift Settlement (Manquant / Excédent)
     */
    postCashDiscrepancy(params: {
        agencyId: string;
        tellerAccount?: string;
        discrepancyAmount: number;
        date: string;
        createdBy: string;
    }): JournalEntryRecord | null;
    /**
     * Helper: DAT Accrued Interest Monthly Accrual
     */
    postDATInterestAccrual(params: {
        agencyId: string;
        amount: number;
        date: string;
        createdBy: string;
    }): JournalEntryRecord;
    /**
     * Helper: PAR Provisioning
     */
    postPARProvision(params: {
        agencyId: string;
        provisionAmount: number;
        targetAccount: '299100' | '299200' | '299300';
        date: string;
        createdBy: string;
    }): JournalEntryRecord;
}
