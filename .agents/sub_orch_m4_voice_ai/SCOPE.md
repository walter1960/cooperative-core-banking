# Scope: Milestone 4 — Multimodal Voice AI Assistant

## Architecture
Milestone 4 delivers the multimodal voice AI subsystem for the BANO LIA microfinance & cooperative banking platform, supporting both offline field cashier workflows and executive portfolio risk inquiries.

### Sub-Modules
1. **Voice Cashier Order Parser** (`banolia-server/src/ai/cashier-parser.ts` / `.js`):
   - Audio buffer / transcript parsing into strict structured JSON.
   - Field extraction: `member_id` / `member_name`, `operation_type` (`DEPOSIT`, `WITHDRAWAL`, `LOAN_REPAYMENT`, `TRANSFER`), `amount` (XOF), `destination_account` / `source_account`.
   - Latency budget: strictly < 2000ms end-to-end.
2. **Multilingual NLP Engine** (`banolia-server/src/ai/multilingual-nlp.ts`):
   - Multi-dialect support: French (`fr-FR`), Éwé (`ee-TG`), and Mina (`gej-TG`).
   - Indigenous lexicon extraction & number resolution:
     - *kotoku* (bag/100,000 XOF or denomination context)
     - *akpe blaeve* (20,000 XOF)
     - *ga dodo* (deposit / putting money)
     - *ga ɖeɖe* (withdrawal / taking money)
     - *asusu* (tontine / cooperative thrift savings)
   - Fallback phonetic & fuzzy matching for low-connectivity / offline cashier operations.
3. **Executive Financial Ratio & Risk Analyzer** (`banolia-server/src/ai/financial-analyzer.ts`):
   - Natural language voice/text query processing for executive insights.
   - Core prudential microfinance ratio calculations & explanations:
     - Liquidity Ratio: $R_{LIQ} = \frac{\text{Liquid Assets}}{\text{Short-Term Liabilities}}$
     - Portfolio at Risk: $PAR_{30} = \frac{\text{Outstanding Balance on Loans with Arrears } > 30\text{ days}}{\text{Gross Loan Portfolio}}$
     - $PAR_{90} = \frac{\text{Outstanding Balance on Loans with Arrears } > 90\text{ days}}{\text{Gross Loan Portfolio}}$
     - Operational Self-Sufficiency: $OSS = \frac{\text{Financial Revenue}}{\text{Financial Expense} + \text{Impairment Losses} + \text{Operating Expenses}}$
     - Capital Adequacy Ratio: $CAR = \frac{\text{Tier 1 + Tier 2 Capital}}{\text{Risk-Weighted Assets}}$
4. **Google Gemini Multimodal AI Provider & Fallback Pipeline** (`banolia-server/src/ai/gemini-provider.ts`):
   - Structured JSON prompt engineering with schema validation.
   - Offline / local fallback parser for zero-network conditions in remote rural counters.
   - Client voice integration utilities (`banolia-client/src/ai/` or `banolia-client/src/services/voice/`).

## Feature Inventory (Milestone 4 Scope — COMPLETED)
| # | Feature | Description | Milestone | Status | Source |
|---|---------|-------------|-----------|--------|--------|
| F4.1 | Voice Cashier Order Parser | Audio/text transcript -> structured transaction JSON under 2000ms | M4 | DONE | ORIGINAL_REQUEST §3.1 & PROJECT.md |
| F4.2 | Éwé (`ee-TG`) Dialect NLP | Parsing Éwé financial terms (*akpe blaeve*, *ga dodo*, *ga ɖeɖe*, *kotoku*) | M4 | DONE | ORIGINAL_REQUEST §3.2 & PROJECT.md |
| F4.3 | Mina (`gej-TG`) Dialect NLP | Parsing Mina financial terms (*asusu*, local counting, variations) | M4 | DONE | ORIGINAL_REQUEST §3.2 & PROJECT.md |
| F4.4 | French (`fr-FR`) NLP & Number Engine | Parsing French voice orders with regional West African Francophone idioms | M4 | DONE | ORIGINAL_REQUEST §3.2 & PROJECT.md |
| F4.5 | Phonetic & Fuzzy Fallback Matcher | Double Metaphone / Levenshtein / soundex for noise resilience | M4 | DONE | ORIGINAL_REQUEST §3.2 & survey_ai_compliance.md |
| F4.6 | Executive Financial Ratio Engine | Calculation & NL querying of $R_{LIQ}$, $PAR_{30}$, $PAR_{90}$, $OSS$, $CAR$ | M4 | DONE | ORIGINAL_REQUEST §3.3 & PROJECT.md |
| F4.7 | Gemini API Multimodal Integration | Integration with Google Gemini SDK with mock/offline fallback simulation | M4 | DONE | ORIGINAL_REQUEST §3.1 & survey_ai_compliance.md |
| F4.8 | Voice AI HTTP API Endpoints | `/api/ai/parse-order`, `/api/ai/financial-query`, `/api/ai/health` | M4 | DONE | PROJECT.md § Architecture |
| F4.9 | Client Voice UI Helper & Audio Streaming | Web Audio / MediaRecorder client-side processing helper | M4 | DONE | PROJECT.md § Client Architecture |

## Interface Contracts
### API Endpoints (`/api/ai/*`)
- `POST /api/ai/parse-order`:
  - Request: `{ audio_base64?: string, transcript?: string, dialect?: 'fr-FR' | 'ee-TG' | 'gej-TG' | 'auto', cashier_id?: string }`
  - Response: `{ success: boolean, data: { operation_type: 'DEPOSIT' | 'WITHDRAWAL' | 'LOAN_REPAYMENT' | 'TRANSFER' | 'ASUSU_COLLECTION', member_id?: string, member_name?: string, amount: number, currency: 'XOF', destination_account?: string, source_account?: string, dialect_detected: string, confidence: number, raw_intent: string }, latency_ms: number }`
- `POST /api/ai/financial-query`:
  - Request: `{ query: string, portfolio_context?: object }`
  - Response: `{ success: boolean, metric_type: 'R_LIQ' | 'PAR_30' | 'PAR_90' | 'OSS' | 'CAR' | 'GENERAL_SUMMARY', value?: number, formatted_value: string, explanation: string, formula: string, status: 'COMPLIANT' | 'WARNING' | 'CRITICAL', benchmarks: object }`

## Code Layout Ownership
- `banolia-server/src/ai/**` (Exclusive write ownership for Milestone 4)
- `banolia-client/src/ai/**` or `banolia-client/src/services/voice.ts`
- Tests: `banolia-server/test/ai/**` or `banolia-server/src/ai/__tests__/**`
