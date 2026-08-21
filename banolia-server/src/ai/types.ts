/**
 * BANOLIA Multimodal Voice AI Assistant Types
 * Regulatory Context: BCEAO / UMOA SFD Standards & Gbe Lingua Franca
 */

export type SupportedLocale = 'fr-FR' | 'ee-TG' | 'gej-TG' | 'mixed' | 'auto';

export type OperationIntent =
  | 'CASH_DEPOSIT'
  | 'CASH_WITHDRAWAL'
  | 'LOAN_REPAYMENT'
  | 'TONTINE_COLLECTION'
  | 'SHARE_SUBSCRIPTION'
  | 'BALANCE_INQUIRY'
  | 'UNKNOWN';

export type AccountType =
  | 'SAVINGS'
  | 'CURRENT'
  | 'LOAN'
  | 'TONTINE'
  | 'PROJECT_PLAN'
  | 'CAREER_PLAN'
  | 'SHARES'
  | 'DEFAULT';

export interface MemberMatch {
  code: string;
  fullName: string;
  manualNumber: string;
  score: number;
}

export interface MemberRecord {
  code: string;
  manualNumber: string;
  fullName: string;
  phone?: string;
  accounts?: Array<{
    accountNumber: string;
    productName: string;
    type: AccountType;
    balance: number;
  }>;
}

export interface VoiceCashierOrder {
  member_code: string | null;
  member_name: string | null;
  manual_number: string | null;
  amount: number | null;
  currency: 'XOF';
  account_type: AccountType;
  account_number: string | null;
  spoken_amount_words: string | null;
  member_resolution_confidence: number;
  candidate_matches?: MemberMatch[];
}

export interface VoiceParseRequest {
  transcript?: string;
  audio_base64?: string;
  audio_mime_type?: 'audio/webm' | 'audio/ogg' | 'audio/wav' | 'audio/pcm' | string;
  language?: SupportedLocale;
  dialect?: SupportedLocale;
  cashier_id?: string;
  cashier_context?: {
    agency_code?: string;
    cashier_id?: string;
    device_id?: string;
    offline_mode?: boolean;
  };
}

export interface SpokenFeedback {
  locale: 'fr-FR' | 'ee-TG' | 'gej-TG';
  text_to_speak: string;
}

export interface VoiceParseResponse {
  success: boolean;
  latency_ms: number;
  intent: OperationIntent;
  confidence: number;
  language_detected: 'fr-FR' | 'ee-TG' | 'gej-TG' | 'mixed';
  extracted_data: VoiceCashierOrder;
  clarification_needed: boolean;
  clarification_prompt: string;
  spoken_feedback: SpokenFeedback;
  data?: {
    operation_type: OperationIntent;
    member_id?: string | null;
    member_name?: string | null;
    amount: number | null;
    currency: 'XOF';
    destination_account?: string | null;
    source_account?: string | null;
    dialect_detected: string;
    confidence: number;
    raw_intent: string;
  };
}

export interface FinancialSnapshotContext {
  agency_id?: string;
  as_of_date?: string;
  currency: 'XOF';
  liquid_assets: number;
  short_term_liabilities: number;
  gross_loan_portfolio: number;
  loans_overdue_30_days: number;
  loans_overdue_90_days: number;
  financial_operating_revenue: number;
  financial_operating_expenses: number;
  loan_loss_provisions_expense: number;
  tier1_net_capital: number;
  total_risk_weighted_assets: number;
  total_active_borrowers?: number;
  top_borrower_outstanding?: number;
}

export type RatioCode = 'R_LIQ' | 'PAR_30' | 'PAR_90' | 'OSS' | 'CAR' | 'GENERAL_SUMMARY';
export type ComplianceStatus = 'COMPLIANT' | 'WARNING' | 'CRITICAL';

export interface RatioBenchmark {
  regulatory_min_pct?: number;
  regulatory_max_pct?: number;
  recommended_min_pct?: number;
  recommended_max_pct?: number;
}

export interface RatioMetricResult {
  metric_code: RatioCode;
  metric_name: string;
  value_pct: number | null;
  formatted_value: string;
  benchmark: RatioBenchmark;
  status: ComplianceStatus;
  delta_to_regulatory_min?: number;
  delta_to_regulatory_max?: number;
  formula: string;
  plain_explanation: string;
  notes?: string;
}

export interface FinancialQueryRequest {
  query: string;
  language?: SupportedLocale;
  agency_code?: string;
  portfolio_context?: Partial<FinancialSnapshotContext>;
}

export interface FinancialQueryResponse {
  success: boolean;
  latency_ms: number;
  query_metadata: {
    detected_intent: string;
    detected_language: SupportedLocale;
    requested_metrics: RatioCode[];
  };
  overall_health_status: ComplianceStatus;
  metric_type?: RatioCode;
  value?: number | null;
  formatted_value?: string;
  explanation?: string;
  formula?: string;
  status?: ComplianceStatus;
  benchmarks?: RatioBenchmark;
  metrics: Partial<Record<RatioCode, RatioMetricResult>>;
  executive_summary: string;
  vulnerabilities: string[];
  recommended_actions: string[];
}
