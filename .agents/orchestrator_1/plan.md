# Orchestration Plan — BANOLIA Microfinance Suite

## Objectives
Deliver a complete, production-grade microfinance & digital finance ecosystem:
1. **Core Banking Engine (UMOA/BCEAO XOF)**:
   - Account chart conforming to SFD BCEAO
   - Member management, share capital (parts sociales), ordinary savings, tontine savings
   - Loan management with amortizations & interest schedules
   - Double-entry automatic general ledger and financial statements
2. **Desktop Agency App (Tauri / React)**:
   - 100% Offline-First operation with local SQLite/IndexedDB
   - Bidirectional batch sync with idempotency keys and conflict resolution
   - ESC/POS 80mm thermal receipt generator
   - USB biometric authentication mock/drivers
   - Cashier shift balancing (arrêté de caisse / journaux de caisse)
3. **Mobile Banking & Field Collector App (Flutter)**:
   - Member portal: balances (real/frozen), transaction history, micro-loans
   - Mobile Money gateway integration: TMoney, Flooz, Wave, MTN MoMo, Orange Money
   - Agent/Collector offline tontine collection with Bluetooth thermal printer support
4. **Multimodal Voice AI Assistant (Gemini API)**:
   - Voice cashier order parser (<2s latency)
   - Multilingual voice queries in French, Éwé, Mina
   - Financial ratio & KPI voice/text analyzer for executive management
5. **E2E Testing & Assurance**:
   - Comprehensive test suite spanning Tiers 1-4
   - Tier 5 adversarial tests
   - Forensic integrity audit

## Execution Phases
- **Phase 0**: Survey (3 parallel explorers: Core/Accounting, Desktop/Mobile, Voice AI/Integration).
- **Phase 1**: Synthesis & Architecture (`PROJECT.md` & `TEST_INFRA.md`).
- **Phase 2**: Dual-track dispatch: Sub-orchestrators for Core, Desktop, Mobile, AI, and E2E Test Suite.
- **Phase 3**: Integration & Hardening: 100% passing E2E tests, Adversarial testing, Forensic Audit verification.
