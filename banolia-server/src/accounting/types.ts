export type AccountClass = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type AccountType = 
  | 'ASSET' 
  | 'LIABILITY' 
  | 'EQUITY' 
  | 'EXPENSE' 
  | 'INCOME' 
  | 'CONTRA_ASSET' 
  | 'SUMMARY' 
  | 'OFF_BALANCE';

export type NormalBalance = 'DEBIT' | 'CREDIT';

export interface GLAccount {
  accountNumber: string;       // e.g. '571100'
  name: string;                // e.g. 'Caisse Principale Siège'
  accountClass: AccountClass;  // 1 to 9
  parentAccount?: string;      // e.g. '571000'
  type: AccountType;
  normalBalance: NormalBalance;
  isLeaf: boolean;
  currentDebit: number;        // Running total debit in XOF
  currentCredit: number;       // Running total credit in XOF
}

export interface JournalLine {
  glAccount: string;           // Target GL account code
  debit: number;               // Amount in XOF (0 if credit)
  credit: number;              // Amount in XOF (0 if debit)
  lineDescription?: string;    // Line-level audit remark
}

export interface JournalEntryInput {
  entryNumber?: string;        // Auto-generated if omitted (e.g. 'JRN-20260820-0001')
  agencyId: string;
  transactionId?: string;      // Linked core banking transaction ID
  dateAccounting: string;      // ISO 'YYYY-MM-DD'
  description: string;
  createdBy: string;           // User ID or 'SYSTEM'
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
  value: number;             // Calculated percentage or ratio
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
