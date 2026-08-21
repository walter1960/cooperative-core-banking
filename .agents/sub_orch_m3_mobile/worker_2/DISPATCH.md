## 2026-08-20T05:25:36Z

You are Worker 2 for Milestone 3 (Mobile Banking & Field Collector App).
Working Directory: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/sub_orch_m3_mobile/worker_2
Project Root: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE
Scope Document: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/sub_orch_m3_mobile/SCOPE.md
Global Project Spec: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/PROJECT.md
Original Requirements: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/ORIGINAL_REQUEST.md

You have EXCLUSIVE write ownership of directory `/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/banolia-mobile/`.
Do not modify files outside of `banolia-mobile/` and your working directory.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Detailed Architecture & Implementation Inputs from Explorers:
- Explorer 1 (Member Portal & Loan Engine): `/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/sub_orch_m3_mobile/explorer_1/analysis.md`
- Explorer 2 (Mobile Money Gateway): `/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/sub_orch_m3_mobile/explorer_2/analysis.md`
- Explorer 3 (Field Collector & ESC/POS Receipts): `/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/sub_orch_m3_mobile/explorer_3/analysis.md`

Your Assignment:
1. Implement the complete `banolia-mobile` package in Flutter / Dart with Clean Architecture:
   - `core/`: Integer-based `Money` value object (Franc CFA / XOF), error & failure types, network client with offline queue, secure storage wrapper, ESC/POS byte utilities, French number-to-words converter.
   - `features/auth/`: PIN/biometric authentication, session management, secure storage.
   - `features/member_portal/`: Triple Balance Model (Real, Frozen, Available), account classification (Epargne 251100, Parts Sociales 101100, DAT 253000, Tontine 258000, Nantissements 254000), transaction ledger, statement generator.
   - `features/loans/`: Micro-loan simulation engine with 4 amortization methods (Constant Annuity, Constant Principal, Bullet/In Fine, Flat), dynamic monthly/weekly schedule generation with integer-cent remainder absorption, Newton-Raphson TEG solver, BCEAO usury ceiling enforcement (TEG <= 24.0%), and loan application with collateral & guarantors.
   - `features/mobile_money/`: Unified `MobileMoneyGateway` interface supporting TMoney (Togo), Moov Flooz (Togo/Benin), Wave (CI/Senegal), MTN MoMo, Orange Money. `SandboxSimulationEngine` (with 7 configurable failure modes and deterministic test vectors) and `RealHttpGatewayAdapter`. C2B deposit, 2-phase hold-and-settle B2C withdrawal, field collector dynamic QR collection, webhook validation.
   - `features/field_collector/`: Collector shift management, member roster with offline Haversine distance sorting, market stall indexing, end-of-day billetage reconciliation (12 BCEAO denominations) with SFD 471200 / 472200 accounting entries.
   - `features/tontine/`: 100% offline cotisation collection with append-only SQLite/local store and SHA-256 tamper-evident hash chaining ($SHA256(prev\_hash + payload\_hash + seq\_no)$), monotonic sequence numbers, 31-day tontine stamp allocation engine (bitmask, multi-day advance, credit buffer, 1-day commission), sync engine for `POST /api/v1/sync/batch`.
   - `features/receipt/`: 58mm ESC/POS thermal receipt binary generator (`ESC @`, `ESC t 16` CP1252, alignment, bold, cut `1D 56 42 n`), 32-column layout, French amount in words, 2D offline verification QR code generator, and `VirtualThermalPrinterMock`.
2. Build comprehensive test suites in `banolia-mobile/test/` covering all domains, use cases, models, gateway sandbox, hash chain tamper detection, 31-day stamp allocation, ESC/POS byte verification, and EOD balancing.
3. Run the test suite (`flutter test` or `dart test`) and ensure 100% of tests pass.
4. Document all implementation details, test commands, test outputs, and verified layout compliance in `/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/sub_orch_m3_mobile/worker_2/handoff.md`.
5. Send completion message back to parent when finished.
