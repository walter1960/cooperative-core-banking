export type AccountClass = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'EXPENSE' | 'INCOME' | 'CONTRA_ASSET' | 'SUMMARY' | 'OFF_BALANCE';
export type NormalBalance = 'DEBIT' | 'CREDIT';
export interface GLAccount {
    accountNumber: string;
    name: string;
    accountClass: AccountClass;
    parentAccount?: string;
    type: AccountType;
    normalBalance: NormalBalance;
    isLeaf: boolean;
    currentDebit: number;
    currentCredit: number;
}
export interface JournalLine {
    glAccount: string;
    debit: number;
    credit: number;
    lineDescription?: string;
}
export interface JournalEntryInput {
    entryNumber?: string;
    agencyId: string;
    transactionId?: string;
    dateAccounting: string;
    description: string;
    createdBy: string;
    lines: JournalLine[];
}
export interface JournalEntryRecord extends JournalEntryInput {
    id: string;
    entryNumber: string;
    isPosted: boolean;
    createdAt: string;
}
export interface TrialBalanceRow {
    accountNumber: string;
    accountName: string;
    accountClass: AccountClass;
    totalDebit: number;
    totalCredit: number;
    debitBalance: number;
    creditBalance: number;
}
export interface TrialBalanceReport {
    asOfDate: string;
    currency: string;
    rows: TrialBalanceRow[];
    totalDebit: number;
    totalCredit: number;
    totalDebitBalance: number;
    totalCreditBalance: number;
    isBalanced: boolean;
}
export interface BalanceSheetItem {
    code: string;
    label: string;
    amount: number;
}
export interface BalanceSheetReport {
    asOfDate: string;
    currency: string;
    assets: {
        liquidAssets: BalanceSheetItem[];
        loansGross: BalanceSheetItem[];
        loanProvisions: BalanceSheetItem[];
        loansNet: number;
        otherAssets: BalanceSheetItem[];
        fixedAssetsNet: BalanceSheetItem[];
        totalAssets: number;
    };
    liabilitiesAndEquity: {
        financialLiabilities: BalanceSheetItem[];
        memberDeposits: BalanceSheetItem[];
        otherLiabilities: BalanceSheetItem[];
        provisionsRisks: BalanceSheetItem[];
        equityAndReserves: BalanceSheetItem[];
        netIncomeCurrentYear: number;
        totalLiabilitiesAndEquity: number;
    };
    isBalanced: boolean;
    discrepancy: number;
}
export interface IncomeStatementReport {
    startDate: string;
    endDate: string;
    currency: string;
    interestIncome: number;
    interestExpense: number;
    netFinancialMargin: number;
    commissionIncome: number;
    bankingIncomePNB: number;
    generalOperatingExpenses: number;
    grossOperatingResult: number;
    netRiskCost: number;
    operatingResult: number;
    exceptionalNet: number;
    netIncome: number;
}
export interface PrudentialRatioResult {
    code: string;
    name: string;
    value: number;
    regulatoryThreshold: number;
    comparison: '>=' | '<=';
    isCompliant: boolean;
    unit: '%' | 'XOF' | 'ratio';
    details: Record<string, number>;
}
export interface PrudentialRatiosReport {
    asOfDate: string;
    currency: string;
    ratios: {
        liquidityRatio: PrudentialRatioResult;
        capitalAdequacyRatio: PrudentialRatioResult;
        par30: PrudentialRatioResult;
        par90: PrudentialRatioResult;
        operationalSelfSufficiency: PrudentialRatioResult;
        riskDivisionRatio: PrudentialRatioResult;
    };
    overallStatus: 'COMPLIANT' | 'WARNING' | 'BREACH';
}
