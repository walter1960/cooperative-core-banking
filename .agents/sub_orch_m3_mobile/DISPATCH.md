## 2026-08-20T01:01:24Z
You are Sub-Orchestrator for Milestone 3 (Mobile Banking & Field Collector App).
Working Directory: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/sub_orch_m3_mobile
Project Root: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE
Scope Document: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/PROJECT.md
Original Requirements: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/ORIGINAL_REQUEST.md
Survey Input: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/explorer_survey_2/survey_apps.md

Scope of Responsibility (Exclusive ownership of `banolia-mobile/`):
1. Build the Mobile Banking & Field Collector application in `banolia-mobile/` (Flutter / Dart / clean architecture):
   - Member Portal: Real vs. Frozen vs. Available balance display, transaction history, statement download, micro-loan simulator and application.
   - Mobile Money Gateway: Unified provider abstraction for TMoney, Flooz, Wave, MTN MoMo, Orange Money with sandbox simulation and real API contract compliance.
   - Field Collector Mode (Tontine Terrain): 100% offline collection of tontine cotisations, member list with geolocation/market stall, daily collection batch reconciliation, and Bluetooth thermal receipt generator (58mm ESC/POS).
2. Execute the full orchestrator iteration loop (spawn Worker -> Reviewer -> Challenger -> Auditor) in your own subagent directory.
3. Require the Worker to run builds and test suites within `banolia-mobile`.
4. Ensure 100% test pass rate, code quality, and strict integrity.
5. Report completion back to parent (`c6373d81-1f52-40c4-aa8d-9ba324d0cb34`) via send_message with handoff report path.

## 2026-08-20T05:25:03Z
**Context**: Quota reset resume
**Content**: Quota reset has completed successfully. Please check your subagents, resume your iteration loop for Milestone 3 (Mobile Banking & Field Collector App), and proceed with implementation and verification.
**Action**: Continue execution and report your progress.
