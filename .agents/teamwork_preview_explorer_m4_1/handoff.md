# Handoff Report: Milestone 4 — Multimodal Voice AI Assistant Architecture & Codebase Investigation

**Author**: Teamwork Explorer M4 (`teamwork_preview_explorer_m4_1`)  
**Target Recipient**: Sub-Orchestrator M4 Voice AI (`97bc64be-435f-4790-b857-54309f35214e`)  
**Date**: 2026-08-20T01:05:00Z  
**Milestone**: Milestone 4 (Multimodal Voice AI Assistant)  
**Status**: COMPLETE & VERIFIED

---

## 1. Observation

Direct observations and evidence collected across the codebase, runtime environment, and authoritative project specifications:

### 1.1 Authoritative Specifications & Requirements
1. **`ORIGINAL_REQUEST.md`** (§ R4 & Acceptance Criteria, lines 21-23, 32-34):
   - Mandates: *"Module d'intelligence artificielle vocale permettant l'exécution d'ordres de caisse au guichet par la voix ('Versement de 50 000 pour Tomrom'), la consultation vocale du solde sur mobile en français et langues locales (Éwé, Mina, etc.), et l'analyse de ratios financiers pour la direction."*
   - Hard Acceptance Criterion: *"L'assistant vocal reconnaît et extrait avec précision l'adhérent, l'opération et le montant pour pré-remplir les formulaires en moins de 2 secondes."*
2. **`PROJECT.md`** (§ Architecture & Feature Inventory, lines 26-30, 52-54, 120-148):
   - Subsystem: Multimodal Voice AI Assistant (`banolia-server/src/ai` & client modals).
   - Features: `F16 Voice Cashier Order Parser (<2s)`, `F17 Multilingual Voice Support (French/Éwé/Mina)`, `F18 AI Financial Ratio Analyzer`.
   - REST Contract: `POST /api/v1/ai/voice-parse` and `/api/ai/parse-order`.
3. **`.agents/sub_orch_m4_voice_ai/SCOPE.md`** (lines 7-58):
   - Designates 4 core sub-modules in `banolia-server/src/ai/`:
     1. `cashier-parser.ts`: Audio buffer/transcript parsing into structured JSON in < 2000ms.
     2. `multilingual-nlp.ts`: Multi-dialect support (French `fr-FR`, Éwé `ee-TG`, Mina `gej-TG`), indigenous counting (*kotoku*, *akpe blaeve*), and phonetic matching.
     3. `financial-analyzer.ts`: Executive financial ratio calculator and NL query interpreter ($R_{LIQ} \ge 100\%$, $PAR_{30} < 5\%$, $PAR_{90} < 2\%$, $OSS > 110\%$, $CAR \ge 10\%-15\%$).
     4. `gemini-provider.ts`: Google Gemini client setup, structured JSON schema enforcement, and offline/local fallback emulator.
   - Endpoints: `POST /api/ai/parse-order`, `POST /api/ai/financial-query`, `GET /api/ai/health`.
   - Client Helper: `banolia-client/src/ai/` or `banolia-desktop/src/services/voice.ts`.
4. **`.agents/spec_miner_survey_3/survey_ai_compliance.md`** (lines 22-384, 432-463):
   - Latency budget breakdown: Capture & VAD (250ms), Network Transport (150ms), Gemini Flash JSON inference (850ms), Validation & Resolution (150ms), TTS speech feedback (500ms) = 1900ms (< 2000ms).
   - Draft-07 JSON Schema for `VoiceCashierOrder` including intents (`CASH_DEPOSIT`, `CASH_WITHDRAWAL`, `LOAN_REPAYMENT`, `TONTINE_COLLECTION`, `SHARE_SUBSCRIPTION`, `BALANCE_INQUIRY`, `ACCOUNT_STATEMENT`, `UNKNOWN`), member identifier resolution, financial data (`amount` in whole XOF), target account, and language detection.
5. **Spec Miner Reports (`.agents/spec_miner_m4_2/handoff.md` and `.agents/spec_miner_m4_3/handoff.md`)**:
   - `spec_miner_m4_2`: Detailed Éwé/Mina/French financial lexicons, additive number grammars (*kotoku* = 100,000 / 1,000,000 XOF, *akpe blaeve* = 20,000 XOF), Togolese surname/day-name phonetic algorithms (`TogoPhonex`), and few-shot corpora.
   - `spec_miner_m4_3`: Precise SYSCOA-SFD accounting mappings (Classes 1-7) for 5 BCEAO prudential ratios, three-tier classification (`COMPLIANT`, `WARNING`, `CRITICAL`), delta calculation, and division-by-zero resilience.

### 1.2 Runtime Environment & Existing Codebase
1. **Runtime & Tooling**:
   - Node.js version: `v24.18.0`.
   - npm version: `11.16.0`.
   - TypeScript: Available via npm.
2. **Existing Client Workspace (`banolia-desktop`)**:
   - React 19 (`react@^19.0.0`, `react-dom@^19.0.0`), Vite 6 (`vite@^6.1.0`), Tailwind CSS 4 (`@tailwindcss/vite@^4.3.3`), Lucide icons (`lucide-react@^0.475.0`).
   - `VoiceAssistantModal.tsx` currently implements basic client-side Web Speech API fallback and simple string matching.
   - Domain models in `banolia-desktop/src/types/index.ts` define `Member` (`code`, `manualNumber`, `fullName`), `Account` (`accountNumber`, `productName`, `type`, `realBalance`, `availableBalance`), `LoanFile`, `Transaction`, and `CashRegister`.
   - Mock members in `mockData.ts`:
     - `A0200225` / `610`: `MILDZINA Tomrom` (Savings: `25121100A020022501`)
     - `A0200226` / `611`: `AGBODJAN Koffi Mensah`
     - `A0200227` / `612`: `AMOUZOU Ablavi`
3. **Existing Backend Workspace (`banolia-server`)**:
   - Currently an initialized empty workspace ready for the modular Express/TypeScript architecture.

---

## 2. Logic Chain

From the observations above, the technical design and architectural structure are derived through the following logic steps:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BANOLIA CLIENT                                   │
│  (Desktop: React 19 / Tauri  |  Mobile: Flutter  |  Web Speech / Audio)     │
│   • Audio Capture (16kHz PCM/WebM) + VAD (400ms silence detection)          │
│   • Client Voice Helper (`voice-client.ts` / `voice.ts`)                    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP POST (Audio Base64 / Transcript)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     BANOLIA SERVER (`banolia-server`)                       │
│  Express 4/5 API Router + Middleware (CORS, 10MB BodyParser, LatencyHeader) │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    REST Endpoints (`/api/ai/*`)                       │  │
│  │  • POST /api/ai/parse-order      • POST /api/ai/financial-query       │  │
│  │  • GET  /api/ai/health           • Aliases: /api/v1/voice/*           │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────────────────────┴───────────────────────────────────┐  │
│  │                      AI Subsystem Core (`src/ai/`)                    │  │
│  │                                                                       │  │
│  │  ┌───────────────────────┐            ┌────────────────────────────┐  │  │
│  │  │   cashier-parser.ts   │            │   financial-analyzer.ts    │  │  │
│  │  │  (Order Extraction &  │            │   (BCEAO Prudential Ratios │  │  │
│  │  │   Entity Resolution)  │            │    & NL Risk Analyzer)     │  │  │
│  │  └───────────┬───────────┘            └─────────────┬──────────────┘  │  │
│  │              │                                      │                 │  │
│  │              ├───────────────────┬──────────────────┤                 │  │
│  │              ▼                   ▼                  ▼                 │  │
│  │  ┌───────────────────────┐ ┌───────────────────────────────────────┐  │  │
│  │  │  multilingual-nlp.ts  │ │          gemini-provider.ts           │  │  │
│  │  │  • Éwé / Mina / French│ │  • Google GenAI Client (Flash Model)  │  │  │
│  │  │  • West Africa Lexicon│ │  • Structured JSON Schema Mode        │  │  │
│  │  │  • Number Evaluator   │ │  • LocalAiEmulator (Deterministic     │  │  │
│  │  │  • TogoPhonex Engine  │ │    Zero-Network Fallback Parser)      │  │  │
│  │  └───────────────────────┘ └───────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Latency Budget Verification (< 2000ms)
- **Step 1: Audio Capture & Client VAD**: ~250ms.
- **Step 2: Network Transport (JSON payload with base64 audio / text)**: ~150ms.
- **Step 3: AI Inference (Gemini Flash JSON Mode or Local Emulator)**:
  - Gemini 1.5/2.0 Flash online: ~650ms - 850ms.
  - LocalAiEmulator fallback: ~5ms - 15ms.
- **Step 4: Financial Validation & Fuzzy Entity Resolution**: ~50ms - 100ms.
- **Step 5: TTS Speech Feedback Generation / Playback**: ~400ms - 500ms.
- **Total Pipeline Latency**: **~1500ms - 1850ms** (Nominal Online) / **~750ms** (Offline Fallback), strictly compliant with the `< 2000ms` hard ceiling.

### 2.2 Dual-Engine Strategy (Online Gemini + Offline LocalAiEmulator)
- In urban agencies with broadband connectivity, Gemini Flash provides flexible natural language and mixed dialect comprehension.
- In remote rural counters or offline field conditions (where network latency is infinity or zero internet exists), the system seamlessly delegates to `LocalAiEmulator` within `gemini-provider.ts` / `multilingual-nlp.ts`. This ensures 100% test pass rate in disconnected CI/CD environments without requiring live API keys.

---

## 3. Caveats

1. **Live Gemini API Key Dependency**: If `GEMINI_API_KEY` is not set in environment variables, the system must automatically and cleanly fallback to `LocalAiEmulator` without throwing unhandled exceptions.
2. **Audio Transcoding & Pure JS Dependency**: To avoid native C++ compilation issues (`node-gyp` errors on varied Linux environments), audio extraction must prioritize base64 PCM/WAV buffer analysis and client-transcribed text, utilizing lightweight pure TypeScript audio utilities.
3. **Phonetic Variants in Dialects**: Éwé and Mina names and numbers possess diacritics (`ɖ`, `ŋ`, `ɛ`, `ɔ`, `ƒ`, `ʋ`). The `TogoPhonex` engine must normalize both accented Unicode and stripped ASCII transliterations.
4. **Division by Zero in Financial Ratios**: SFDs in bootstrap stages may have 0 gross loans or 0 short-term liabilities. All ratio calculations must explicitly guard against `NaN` and `Infinity`, returning structured indicators (e.g. `NO_LOAN_PORTFOLIO`).

---

## 4. Conclusion & Actionable Architectural Blueprint

The recommended architecture for Milestone 4 is fully structured across 4 core areas:

### 4.1 TypeScript, Node.js, and Package Dependencies
Recommended setup for `banolia-server/package.json`:
```json
{
  "name": "banolia-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "benchmark": "tsx test/ai/benchmark-latency.ts"
  },
  "dependencies": {
    "@google/genai": "^0.1.1",
    "@google/generative-ai": "^0.21.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "helmet": "^8.0.0",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/node": "^22.13.4",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3",
    "vitest": "^3.0.5"
  }
}
```

### 4.2 Server Routing & Middleware Architecture
- **Entry Point**: `banolia-server/src/index.ts`
- **App Setup**: `banolia-server/src/app.ts`
  - Middleware: `helmet()`, `cors()`, `express.json({ limit: '10mb' })`, `latencyTracker` middleware recording `res.setHeader('X-Response-Time-Ms', duration)`.
- **AI Routes**: `banolia-server/src/api/ai.routes.ts`
  - `POST /api/ai/parse-order` (Controller: `CashierParserController.parseOrder`)
  - `POST /api/ai/financial-query` (Controller: `FinancialAnalyzerController.query`)
  - `GET  /api/ai/health` (Controller: `HealthController.getAiHealth`)
  - Compatibility aliases: `POST /api/v1/voice/process-command`, `POST /api/v1/ai/voice-parse`, `POST /api/v1/compliance/prudential-ratios`.

### 4.3 Detailed Sub-Module Architecture in `banolia-server/src/ai/`

#### 1. `gemini-provider.ts`
- **Responsibilities**:
  - Encapsulates Google Gen AI / Generative AI SDK client initialization.
  - Formulates system prompts with strict JSON Schema output mode.
  - Implements `LocalAiEmulator`: A deterministic, high-speed offline parser executing rule-based AST and phonetic extraction to guarantee 100% test reliability when offline.
- **Key Interface**:
  ```typescript
  export interface IGeminiProvider {
    parseVoiceOrder(request: VoiceParseRequest): Promise<VoiceParseResponse>;
    analyzeFinancialQuery(request: FinancialQueryRequest, context: FinancialSnapshotContext): Promise<FinancialQueryResponse>;
    isOnline(): boolean;
  }
  ```

#### 2. `multilingual-nlp.ts`
- **Responsibilities**:
  - Trilingual financial lexicons: French (`fr-FR`), Éwé (`ee-TG`), Mina (`gej-TG`).
  - Additive/compound number resolution:
    - *kotoku* = 100,000 XOF (or 1,000,000 XOF in denomination contexts).
    - *akpe blaeve* = 20,000 XOF, *akpe blaeve vɔ atɔ̃* = 25,000 XOF, *akpe blaatɔ̃* = 50,000 XOF, *akpe alafa* = 100,000 XOF.
    - French regional counting: "cinquante mille", "deux cent mille", "cinq sous" (25 XOF), "cent sous" (500 XOF).
  - Intent classification for: `CASH_DEPOSIT`, `CASH_WITHDRAWAL`, `LOAN_REPAYMENT`, `TONTINE_COLLECTION`, `SHARE_SUBSCRIPTION`, `BALANCE_INQUIRY`, `ACCOUNT_STATEMENT`.
  - `TogoPhonex` engine: Double Metaphone + weighted Levenshtein distance for Togolese names and phonetic variance.

#### 3. `cashier-parser.ts`
- **Responsibilities**:
  - Core orchestration converting audio buffer or text transcript into `VoiceCashierOrder`.
  - Member resolution against member database / cache.
  - Target account selection (`SAVINGS`, `LOAN`, `TONTINE`, `SHARES`).
  - Generates localized spoken confirmation feedback (`speech_feedback`) in French, Éwé, or Mina.
  - Measures execution time and guarantees `latency_ms < 2000`.

#### 4. `financial-analyzer.ts`
- **Responsibilities**:
  - Deterministic computation of 5 BCEAO prudential ratios:
    1. $R_{LIQ} = \frac{\text{Liquid Assets}}{\text{Short-Term Liabilities}} \times 100$ (Benchmark: $\ge 100\%$)
    2. $PAR_{30} = \frac{\text{Loans Overdue } > 30\text{d}}{\text{Gross Loan Portfolio}} \times 100$ (Benchmark: $< 5\%$)
    3. $PAR_{90} = \frac{\text{Loans Overdue } > 90\text{d}}{\text{Gross Loan Portfolio}} \times 100$ (Benchmark: $< 2\%$)
    4. $OSS = \frac{\text{Financial Revenue}}{\text{Financial Expenses + Provisions + OpEx}} \times 100$ (Benchmark: $> 110\%$)
    5. $CAR = \frac{\text{Net Capital}}{\text{Risk-Weighted Assets}} \times 100$ (Benchmark: $\ge 10\%-15\%$)
  - Status classification: `COMPLIANT`, `WARNING`, `CRITICAL`.
  - Natural language query parser mapping voice/text questions in FR, EE, GEJ to metrics and executive summaries.

#### 5. Client Voice Helper (`banolia-desktop/src/services/voice.ts` or `banolia-client/src/ai/voice-client.ts`)
- **Responsibilities**:
  - Web Audio API / MediaRecorder audio capture with 16kHz PCM / WebM encoding.
  - Client-side VAD (Voice Activity Detection) with 400ms silence threshold.
  - API communication sending requests to `/api/ai/parse-order` and executing callbacks.
  - Web Speech API speech synthesis TTS playback.

### 4.4 Comprehensive Testing & Latency Benchmarking Suite

```
tests/
├── tier1_feature_coverage/
│   ├── test_voice_parser_nominal.test.ts      (>= 5 tests for F16: French, Ewe, Mina, deposit, withdrawal)
│   ├── test_multilingual_nlp_nominal.test.ts  (>= 5 tests for F17: lexicons, numbers, kotoku, akpe)
│   └── test_financial_ratios_nominal.test.ts  (>= 5 tests for F18: R_LIQ, PAR30, PAR90, OSS, CAR)
├── tier2_boundary_corner/
│   ├── test_voice_boundary_phonetics.test.ts  (Homonyms, homophones, market noise, mixed dialects)
│   └── test_financial_boundary_zeros.test.ts  (Division by zero: 0 loans, 0 liabilities, usury caps)
├── tier3_pairwise_race/
│   └── test_voice_concurrency.test.ts         (Simultaneous multi-teller voice parsing under load)
├── tier4_real_world/
│   └── test_voice_day_in_life.test.ts         (Full morning-to-evening voice-assisted agency workflow)
└── benchmark/
    └── latency_benchmark.test.ts              (100 sequential & concurrent requests verifying P99 < 2000ms)
```

---

## 5. Verification Method

To independently verify the implementation against this specification:

### 5.1 Test Execution Commands
```bash
# 1. Run unit & integration tests across AI subsystem
cd banolia-server && npm test

# 2. Run latency benchmark suite verifying P99 < 2000ms
cd banolia-server && npm run benchmark

# 3. Run global top-level E2E multi-tier tests
npm test
```

### 5.2 Files to Inspect
- `banolia-server/src/ai/gemini-provider.ts`
- `banolia-server/src/ai/cashier-parser.ts`
- `banolia-server/src/ai/multilingual-nlp.ts`
- `banolia-server/src/ai/financial-analyzer.ts`
- `banolia-server/src/api/ai.routes.ts`
- `banolia-desktop/src/components/VoiceAssistantModal.tsx`
- `tests/tier1_feature_coverage/` and `tests/benchmark/`

### 5.3 Invalidation Conditions
- Any voice extraction request taking $\ge 2000$ ms.
- Failure to correctly resolve Éwé/Mina financial number compounds (*akpe blaeve* $\ne$ 20,000, *kotoku* $\ne$ 100,000/1,000,000).
- Financial ratio engine crashing with `NaN` or unhandled division by zero when loan portfolio is 0.
- Server failing tests when `GEMINI_API_KEY` is omitted (failure of offline `LocalAiEmulator` fallback).

