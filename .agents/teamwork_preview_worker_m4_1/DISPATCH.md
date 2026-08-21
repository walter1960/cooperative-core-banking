## 2026-08-20T01:05:12Z
You are the Implementation Worker for Milestone 4 (Multimodal Voice AI Assistant).
Your Working Directory: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/teamwork_preview_worker_m4_1
Project Root: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE

Authoritative Documents (You MUST read these before starting):
1. /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/ORIGINAL_REQUEST.md
2. /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/PROJECT.md
3. /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/sub_orch_m4_voice_ai/SCOPE.md
4. /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/teamwork_preview_explorer_m4_1/handoff.md
5. /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/spec_miner_m4_2/handoff.md
6. /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/spec_miner_m4_3/handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write Ownership (You own these files exclusively):
- `banolia-server/package.json`, `banolia-server/tsconfig.json`, `banolia-server/vitest.config.ts` (if needed for build/test)
- `banolia-server/src/ai/**` (all AI modules: gemini-provider.ts, multilingual-nlp.ts, cashier-parser.ts, financial-analyzer.ts, types.ts, index.ts)
- `banolia-server/src/api/ai.routes.ts`, `banolia-server/src/app.ts`, `banolia-server/src/index.ts`
- `banolia-server/test/ai/**` or `tests/**` (comprehensive test suites and benchmark tests)
- `banolia-client/src/ai/**` or `banolia-desktop/src/services/voice.ts` (client voice helper)

Your Implementation Objectives:
1. Multilingual NLP Engine (`banolia-server/src/ai/multilingual-nlp.ts`)
2. Executive Financial Ratio & Risk Analyzer (`banolia-server/src/ai/financial-analyzer.ts`)
3. Google Gemini Multimodal Provider & Offline Fallback (`banolia-server/src/ai/gemini-provider.ts`)
4. Voice Cashier Order Parser (`banolia-server/src/ai/cashier-parser.ts`) & REST Endpoints (`banolia-server/src/api/ai.routes.ts`)
5. Testing & Latency Benchmarks (P99 < 2000ms, 100% pass rate).
