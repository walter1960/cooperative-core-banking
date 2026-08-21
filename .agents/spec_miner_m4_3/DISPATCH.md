## 2026-08-20T01:01:59Z

You are a Spec Miner for Milestone 4 (Executive Financial Ratio & Risk Analyzer).
Your Working Directory: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/spec_miner_m4_3
Project Root: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE

Authoritative Documents (You MUST read these before starting):
1. /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/ORIGINAL_REQUEST.md
2. /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/PROJECT.md
3. /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/sub_orch_m4_voice_ai/SCOPE.md
4. /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/spec_miner_survey_3/survey_ai_compliance.md

Your Mission:
Mine and specify the mathematical, natural language, and prudential microfinance requirements for the Executive Financial Ratio & Risk Analyzer:
1. Mathematical formulas and BCEAO/prudential benchmarks:
   - Liquidity Ratio: $R_{LIQ} = \frac{\text{Liquid Assets}}{\text{Short-Term Liabilities}}$ (Benchmark: $\ge 100\%$ or $\ge 1.0$)
   - Portfolio at Risk 30: $PAR_{30} = \frac{\text{Remaining principal on loans }>30\text{ days past due}}{\text{Gross Loan Portfolio}}$ (Benchmark: $< 5\%$)
   - Portfolio at Risk 90: $PAR_{90} = \frac{\text{Remaining principal on loans }>90\text{ days past due}}{\text{Gross Loan Portfolio}}$ (Benchmark: $< 2\%$)
   - Operational Self-Sufficiency: $OSS = \frac{\text{Financial Revenue}}{\text{Financial Expenses} + \text{Impairment Losses} + \text{Operating Expenses}}$ (Benchmark: $> 110\%$ or $> 1.10$)
   - Capital Adequacy Ratio: $CAR = \frac{\text{Net Capital (Fonds Propres)}}{\text{Risk-Weighted Assets}}$ (Benchmark: $\ge 10\%$)
2. Natural Language Query intent mapping:
   - Voice/text queries in French, Éwé, Mina requesting risk summaries or specific ratio values.
   - Context aggregation from portfolio and accounting data structures.
   - Generating structured responses with formatted values, status (`COMPLIANT`, `WARNING`, `CRITICAL`), formulas, and plain-language executive explanations.
3. Response latency requirements (< 2000ms) and test validation scenarios.

Write your specification to `/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/spec_miner_m4_3/handoff.md`.
Communicate completion via `send_message` to recipient `97bc64be-435f-4790-b857-54309f35214e`.
