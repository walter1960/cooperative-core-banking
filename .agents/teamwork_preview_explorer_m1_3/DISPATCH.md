## 2026-08-20T01:02:44Z
<USER_REQUEST>
You are Explorer M1-3 for BANOLIA Core Banking & Accounting Engine (Milestone 1).
Working Directory: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/teamwork_preview_explorer_m1_3
Scope Document: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/sub_orch_m1_core/SCOPE.md
Original Requirements: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/ORIGINAL_REQUEST.md
Survey Input: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/explorer_survey_1/survey_core_banking.md

Your mission:
1. Investigate and design the Server Architecture, Database, and API Layer in banolia-server/:
   - Relational / SQLite schema (agencies, users, members, accounts, tontine_subscriptions, loan_files, loan_schedules, cash_registers, cash_shifts, gl_accounts, gl_journal_entries, gl_journal_lines, transactions).
   - Express TypeScript API routing and controllers:
     * POST /api/v1/sync/batch (Idempotent bidirectional batch sync with SHA-256 idempotency key, status mapping: COMMITTED/DUPLICATE/REJECTED, delta updates).
     * POST /api/v1/transactions/process (Atomic double-entry financial transaction processing).
     * POST /api/v1/loans/simulate (Credit amortization simulator).
     * Member, Account, Tontine, Loan, and Reporting REST endpoints.
   - Comprehensive test architecture for banolia-server/ (Jest/Mocha/Node test runner, unit tests, integration tests, invariant checks).
2. Write your complete analysis and technical design to /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/teamwork_preview_explorer_m1_3/handoff.md.
3. When complete, use send_message to report back to your parent with the handoff report path.
</USER_REQUEST>
