/**
 * Executive Financial Ratio & Risk Analyzer
 * Implements deterministic calculation of 5 BCEAO / UMOA SFD Prudential Ratios:
 * 1. R_LIQ (Liquidity Ratio)
 * 2. PAR_30 (Portfolio at Risk 30 Days)
 * 3. PAR_90 (Portfolio at Risk 90 Days)
 * 4. OSS (Operational Self-Sufficiency)
 * 5. CAR (Capital Adequacy Ratio)
 * With 3-tier classification (COMPLIANT, WARNING, CRITICAL), zero-division safety,
 * and multilingual Natural Language Query parsing (French, Éwé, Mina).
 */
import { FinancialQueryRequest, FinancialQueryResponse, FinancialSnapshotContext, RatioCode, RatioMetricResult, SupportedLocale } from './types';
export declare function createDefaultSnapshot(partial?: Partial<FinancialSnapshotContext>): FinancialSnapshotContext;
/**
 * 1. Liquidity Ratio: R_LIQ = (Liquid Assets / Short-Term Liabilities) * 100
 * Benchmark BCEAO: >= 100%
 */
export declare function calculateLiquidityRatio(ctx: FinancialSnapshotContext): RatioMetricResult;
/**
 * 2. PAR 30: Portfolio at Risk > 30 Days = (Arrears > 30d / Gross Loans) * 100
 * Benchmark BCEAO: <= 5.0%
 */
export declare function calculatePAR30(ctx: FinancialSnapshotContext): RatioMetricResult;
/**
 * 3. PAR 90: Portfolio at Risk > 90 Days = (Arrears > 90d / Gross Loans) * 100
 * Benchmark BCEAO: <= 2.0% - 3.0%
 */
export declare function calculatePAR90(ctx: FinancialSnapshotContext): RatioMetricResult;
/**
 * 4. OSS: Operational Self-Sufficiency = (Revenue / (Expenses + Provisions)) * 100
 * Benchmark: > 110%
 */
export declare function calculateOSS(ctx: FinancialSnapshotContext): RatioMetricResult;
/**
 * 5. CAR: Capital Adequacy Ratio = (Net Capital / Risk-Weighted Assets) * 100
 * Benchmark BCEAO: >= 10.0% to >= 15.0%
 */
export declare function calculateCAR(ctx: FinancialSnapshotContext): RatioMetricResult;
export declare function parseFinancialQueryIntent(query: string): {
    intent: string;
    requested_metrics: RatioCode[];
    detected_language: SupportedLocale;
};
export declare function processFinancialQuery(request: FinancialQueryRequest): FinancialQueryResponse;
