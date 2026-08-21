# BRIEFING — 2026-08-20T01:04:00Z

## Mission
Mine and specify the mathematical, natural language, and prudential microfinance requirements for the Executive Financial Ratio & Risk Analyzer for Milestone 4.

## 🔒 My Identity
- Archetype: Specification Miner
- Roles: Spec Miner, Microfinance & Risk Specialist
- Working directory: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/spec_miner_m4_3
- Original parent: 97bc64be-435f-4790-b857-54309f35214e
- Milestone: Milestone 4 (Executive Financial Ratio & Risk Analyzer)

## 🔒 Key Constraints
- Authoritative specification probe only: do not implement code changes in the main application codebase.
- Mathematical precision on BCEAO prudential standards (Liquidity >= 100%, PAR30 < 5%, PAR90 < 2%, OSS > 110%, CAR >= 10%).
- Multi-lingual intent mapping (French, Éwé, Mina).
- Response latency < 2000ms.
- Handoff report in 5-component protocol with Features Discovered and Edge Cases tables.

## Current Parent
- Conversation ID: 97bc64be-435f-4790-b857-54309f35214e
- Updated: 2026-08-20T01:04:00Z

## Task Summary
- **What to build/specify**: Formal specification for Executive Financial Ratio & Risk Analyzer engine and voice/NL interface.
- **Success criteria**: Comprehensive mathematical definitions, account mapping from SYSCOHADA / BCEAO chart of accounts, portfolio calculation formulas, multilingual prompt templates / query intent classifiers, structured response schema (status, values, warnings, executive summaries), edge cases, latency constraints, and verification test scenarios.
- **Interface contracts**: `/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/sub_orch_m4_voice_ai/SCOPE.md` & `/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/spec_miner_m4_3/handoff.md`
- **Code layout**: Backend AI modules in `banolia-server/src/ai/`.

## Key Decisions Made
- Fully specified mathematical formulas for $R_{LIQ}$, $PAR_{30}$, $PAR_{90}$, $OSS$, $CAR$ with exact SYSCOA-SFD accounting classes.
- Specified 3-tier status tagging (`COMPLIANT`, `WARNING`, `CRITICAL`) with regulatory benchmarks and warning buffers.
- Specified multilingual natural language query intent mapping across French, Éwé, and Mina.
- Specified structured response schemas with LaTeX formulas and executive summaries.
- Specified end-to-end latency budget breakdown (<2000ms target, ~1300ms projected, 45ms offline fallback).

## Artifact Index
- `/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/spec_miner_m4_3/DISPATCH.md` — Initial dispatch message
- `/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/spec_miner_m4_3/handoff.md` — Final specification handoff report
- `/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/spec_miner_m4_3/progress.md` — Progress tracker

## Loaded Skills
- None explicitly loaded
