## 2026-08-20T01:04:39Z

You are Worker 1 for Milestone 2: Desktop Offline-First Agency App (`banolia-desktop`).
Working Directory: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/worker_m2_desktop
Project Root: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE
Scope Document: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/sub_orch_m2_desktop/SCOPE.md
Parent Conversation ID: 81c1836d-6cdf-4446-bf1c-2b845b0ff1eb

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Required Reading:
- /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/ORIGINAL_REQUEST.md
- /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/PROJECT.md
- /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/sub_orch_m2_desktop/SCOPE.md
- /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/explorer_m2_storage/handoff.md
- /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/explorer_m2_teller_hardware/handoff.md
- /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/explorer_m2_shifts_sync/handoff.md

Your Exclusive Scope: `banolia-desktop/`
You must build, enhance, and test all Desktop Offline-First components in `banolia-desktop/`:

1. Local Offline-First Database & Storage (`src/db/` & `src/services/crypto/`):
   - High-performance, reactive Dexie / IndexedDB database (`BanoliaDatabase`) with full schema: `members`, `accounts`, `loanFiles`, `loanSchedules`, `cashShifts`, `cashBilletages`, `transactions`, `syncQueue`, `auditLogs`.
   - WebCrypto AES-GCM-256 for sensitive biometric minutiae and SHA-256 HMAC hash chaining for financial ledger entries.
   - Comprehensive seed utility with realistic West African cooperative data (members, savings/tontine/credit accounts, loans).
   - Atomic `TransactionManager.executeFinancialOperation()` ensuring ACID consistency across Account, Cash Shift, Journal, Sync Outbox, and Audit Log.

2. Teller / Cashier Desk Operations (`src/components/teller/`, `src/pages/TellerPage.tsx`):
   - Deposits, withdrawals, internal account-to-account transfers, new member / account creation wizard.
   - Quick cash denominations (1000, 5000, 10000, 25000, 50000, 100000, 250000 XOF), real-time change calculator.
   - Multi-tender payment breakdown (Cash, TMoney, Flooz, Wave, MTN Momo, Orange Money).
   - Overdraft protection and real-time available vs frozen balance verification.

3. Real-Time ESC/POS Receipt Engine (`src/services/escpos/`, `src/components/receipts/`):
   - Dual layout generation: 80mm full agency receipt & 58mm compact mobile receipt.
   - Raw binary `EscPosBuilder` with CP1252 French accents (`é`, `è`, `à`, `ç`), 2D QR codes, cash drawer pulse (`ESC p 0 25 250`), paper auto-cut.
   - Regulatory French number-to-words converter (`amountToWordsFR`).
   - Auto-print trigger and visual receipt modal preview.

4. USB Biometrics (ISO 19794-2) (`src/services/biometrics/`, `src/components/biometrics/`):
   - ISO/IEC 19794-2:2005 binary parser and serializer (`Iso19794Parser`).
   - Spatial and angular minutiae matching algorithm (`MinutiaeMatcher`) with rotation/translation tolerance.
   - Hardware abstraction layer + robust `MockBiometricDriver` generating deterministic ISO templates for seamless simulation and 100% automated CI tests.
   - Member biometric identification modal (fingerprint scan -> match -> KYC account lookup).

5. Cashier Shift Balancing (*Arrêté de caisse*) (`src/services/shift/`, `src/components/shift/`):
   - Complete 6-state Shift FSM (`UNINITIALIZED` -> `OPENING` -> `OPEN_ACTIVE` -> `CLOSING_COUNT` -> `RECONCILIATION` -> `CLOSED_APPROVED`).
   - 12-denomination physical cash breakdown (*billetage* for 10000, 5000, 2000, 1000, 500 banknotes and 500, 200, 100, 50, 25, 10, 5 coins).
   - Real-time comparison of Physical Cash vs Theoretical System Balance.
   - Discrepancy accounting according to SFD standards: Deficits to `471200` (Déficits de caisse) / `571200`, Surpluses to `571200` / `472200` (Excédents de caisse).
   - Signed Procès-Verbal (PV) generation with print and export formats.

6. Bidirectional Batch Sync Engine (`src/services/sync/`, `src/components/sync/`):
   - SHA-256 HMAC-signed idempotency keys per operation.
   - Outbox queue replay engine with exponential backoff and jitter.
   - Deterministic conflict resolution rules.
   - Network connectivity listener & UI sync status widget.

7. Test Verification:
   - Implement comprehensive Vitest test suites covering all modules:
     - `src/db/__tests__/db.test.ts`
     - `src/services/crypto/__tests__/crypto.test.ts`
     - `src/services/escpos/__tests__/escpos.test.ts`
     - `src/services/biometrics/__tests__/biometrics.test.ts`
     - `src/services/shift/__tests__/shift.test.ts`
     - `src/services/sync/__tests__/sync.test.ts`
     - `src/components/teller/__tests__/TellerDesk.test.tsx`
   - Run `npm run build` and `npm run test` (or `npx vitest run`) inside `banolia-desktop/` and verify that ALL tests pass with 0 errors.

Output Requirements:
- Write your complete handoff report to:
  `/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/worker_m2_desktop/handoff.md`
- Include: Observation, Files Changed, Commands Executed, Test Results (with full output/summary), and Verification Method.
- Send a completion message back to parent when done.
