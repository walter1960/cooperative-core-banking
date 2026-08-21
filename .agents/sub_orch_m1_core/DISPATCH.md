## 2026-08-20T01:01:24Z

You are Sub-Orchestrator for Milestone 1 (Core Banking & BCEAO/UMOA Accounting Engine).
Working Directory: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/sub_orch_m1_core
Project Root: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE
Scope Document: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/PROJECT.md
Original Requirements: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/ORIGINAL_REQUEST.md
Survey Input: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/explorer_survey_1/survey_core_banking.md

Scope of Responsibility (Exclusive ownership of `banolia-server/`):
1. Build the complete production-grade Core Banking backend in `banolia-server/` with TypeScript/Express/SQLite (or relational engine):
   - SFD BCEAO 9-Class Chart of Accounts (SYSCOA-SFD classes 1 to 9).
   - Double-entry general ledger with atomic posting and strict debit=credit balance validation.
   - Member management, KYC, and Share Capital (*parts sociales*).
   - Ordinary savings (Dépôt à vue), Term savings (DAT) with 15-day interest rule (*règle des quinzaines*), and balance freezing (solde gelé).
   - 31-day cyclical tontines with periodic cotisations, tour allocation, and 1-day collector commission deduction.
   - Loan management: 4 amortization formulas (Constant Annuity, Linear Principal, Bullet/In Fine, Flat Rate), interest calculation, penalties, and BCEAO usury cap enforcement (24-27%).
   - Automatic General Ledger, Trial Balance (*Balance générale*), Balance Sheet (*Bilan*), Income Statement (*Compte de Résultat*), and Prudential Ratios ($R_{LIQ}$, $PAR_{30}$, $PAR_{90}$, $OSS$, $CAR$).
   - Idempotent bidirectional sync API (`POST /api/v1/sync/batch`) with SHA-256 deduplication and transaction status mapping.
2. Execute the full orchestrator iteration loop (spawn Worker -> Reviewer -> Challenger -> Auditor) in your own subagent directory.
3. Require the Worker to run builds and test suites within `banolia-server`.
4. Ensure 100% test pass rate, code quality, and strict integrity.
5. Report completion back to parent (`c6373d81-1f52-40c4-aa8d-9ba324d0cb34`) via send_message with handoff report path.
