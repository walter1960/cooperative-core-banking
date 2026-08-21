import { GeneralLedgerEngine } from './ledger';
import { TrialBalanceReport, BalanceSheetReport, IncomeStatementReport, PrudentialRatiosReport } from './types';
export declare class FinancialReportsEngine {
    private ledger;
    constructor(ledger: GeneralLedgerEngine);
    /**
     * Generates 6-Column Trial Balance (Balance Générale)
     */
    generateTrialBalance(asOfDate?: string): TrialBalanceReport;
    /**
     * Generates Regulatory Income Statement (Compte de Résultat)
     */
    generateIncomeStatement(startDate?: string, endDate?: string): IncomeStatementReport;
    /**
     * Generates Regulatory Balance Sheet (Bilan Actif / Passif)
     */
    generateBalanceSheet(asOfDate?: string): BalanceSheetReport;
    /**
     * Calculates the 5 core BCEAO SFD Prudential Ratios
     */
    calculatePrudentialRatios(asOfDate?: string): PrudentialRatiosReport;
}
