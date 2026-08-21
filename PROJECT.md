# Project: BANOLIA Microfinance & Digital Finance Suite

## Architecture
BANOLIA is an enterprise-grade, multi-tier microfinance ecosystem designed for the West African Monetary Union (UMOA/BCEAO) regulatory zone (XOF currency).

### Component Architecture & Data Flow
1. **Core Banking & Accounting Engine (`banolia-server`)**:
   - Express/TypeScript backend with full SFD BCEAO 9-Class Chart of Accounts (SYSCOA-SFD).
   - Core financial ledger: double-entry posting, member KYC, share capital (*parts sociales*), savings accounts (ordinary, term deposits with 15-day interest rule), cyclical tontines (31-day cycle with collector commission), and credit management with 4 amortization formulas (constant annuity, linear, bullet, flat) subject to BCEAO usury caps (24-27%).
   - Automatic General Ledger, Trial Balance (*Balance générale*), Balance Sheet (*Bilan*), Income Statement (*Compte de Résultat*), and Prudential Ratios ($R_{LIQ}$, $PAR_{30}$, $PAR_{90}$, $OSS$, $CAR$).
   - Idempotent bidirectional batch synchronization endpoints with HMAC validation and deduplication.

2. **Desktop Offline-First Cashier & Agency App (`banolia-desktop`)**:
   - Tauri / React 19 application providing 100% offline autonomy via local SQLite / IndexedDB.
   - Teller operations: deposits, withdrawals, transfers, account opening, loan repayments, tontine cotisations.
   - Hardware Drivers: ESC/POS 80mm/58mm thermal receipt formatting and printing; USB biometric fingerprint authentication with ISO 19794-2 template support (with mock driver fallback).
   - Cashier Shift Balancing (*Arrêté de caisse*): opening balance, physical cash breakdown (*billetage*), real-time theoretical balance, discrepancy tracking (SFD 471200 / 472200), and signed procès-verbal generation.
   - Queue-based bidirectional sync engine with SHA-256 idempotency keys.

3. **Mobile Banking & Field Collector App (`banolia-mobile`)**:
   - Flutter / Dart application for members and field collectors.
   - Member Portal: Real vs. Frozen vs. Available balance display, transaction history, loan requests.
   - Mobile Money Gateway: Unified provider abstraction for TMoney, Flooz, Wave, MTN MoMo, Orange Money with sandbox simulation.
   - Field Collector Mode: Offline-first collection of tontine contributions, daily batch summary, Bluetooth thermal receipt generation.

4. **Multimodal Voice AI Assistant (`banolia-server/src/ai` & client modals)**:
   - Google Gemini API integration (Flash model with streaming & structured JSON output).
   - Sub-2s voice cashier order parsing: audio/text -> structured transaction intent.
   - Multilingual NLP support for French (`fr-FR`), Éwé (`ee-TG`), and Mina (`gej-TG`).
   - Executive AI financial ratio & risk analyzer.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | BCEAO Chart of Accounts | 9-class PC-SFD ledger with double-entry equilibrium | M1 | Survey 1 |
| F02 | Member Management & KYC | Member registration, identification, parts sociales | M1 | Survey 1 |
| F03 | Savings Accounts & Tontines | Ordinary savings (15-day interest rule) and 31-day cyclical tontines | M1 | Survey 1 |
| F04 | Loan Amortization Engine | 4 amortization types, usury ceiling, PAR30/90 provisioning | M1 | Survey 1 |
| F05 | Automatic Financial Statements | Bilan, Compte de Résultat, BCEAO Prudential Ratios | M1 | Survey 1 / 3 |
| F06 | Core REST / Batch Sync API | Idempotent sync endpoints with X-Idempotency-Key | M1 | Survey 1 |
| F07 | Desktop Offline Database & Queue | Local SQLite / Storage schema, transaction queue | M2 | Survey 2 |
| F08 | Teller Operations & Cashier Desk | Deposits, withdrawals, transfers, change calculation | M2 | Survey 2 |
| F09 | ESC/POS 80mm Thermal Receipts | ESC/POS formatting, ticket numbering, auto-cut | M2 | Survey 2 |
| F10 | USB Biometric Authentication | ISO 19794-2 template support with hardware/mock HAL | M2 | Survey 2 |
| F11 | Cashier Shift Balancing | Opening, physical billetage, theoretical check, procès-verbal | M2 | Survey 2 |
| F12 | Desktop Bidirectional Sync Engine | Batch sync, idempotency validation, conflict resolution | M2 | Survey 2 |
| F13 | Mobile Banking Member Portal | Triple balance (real/frozen/available), history, micro-loans | M3 | Survey 2 |
| F14 | Mobile Money Gateway Aggregator | TMoney, Flooz, Wave, MTN MoMo, Orange Money + Sandbox | M3 | Survey 2 |
| F15 | Field Collector Mode | Offline tontine collection, daily batch, Bluetooth printing | M3 | Survey 2 |
| F16 | Voice Cashier Order Parser | Gemini API structured extraction in <2s | M4 | Survey 3 |
| F17 | Multilingual Voice Support | French, Éwé, Mina dialect lexicons & intent recognition | M4 | Survey 3 |
| F18 | AI Financial Ratio Analyzer | Management ratio computations & voice insights | M4 | Survey 3 |
| F19 | E2E Automated Test Suite | Tiers 1-4 comprehensive automated testing + Tier 5 adversarial | M5 | Survey 3 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Banking & BCEAO Accounting | Backend server (`banolia-server`), 9-class PC-SFD ledger, accounts, members, tontines, loans, financial statements, sync API | none | IN_PROGRESS |
| M2 | Desktop Offline-First Agency App | Desktop application (`banolia-desktop`), local storage, cashier desk, ESC/POS receipts, biometrics, shift balancing, sync engine | M1 | DONE |
| M3 | Mobile Banking & Field Collector | Mobile application (`banolia-mobile`), member portal, Mobile Money gateways, tontine collector, Bluetooth receipts | M1 | IN_PROGRESS |
| M4 | Multimodal Voice AI Assistant | Voice cashier extraction (<2s), French/Éwé/Mina support, financial ratio analyzer | M1 | IN_PROGRESS |
| M5 | E2E Integration & Verification | E2E test runner, Tiers 1-4 test suites, Tier 5 adversarial tests, forensic audit | M1, M2, M3, M4 | IN_PROGRESS |

---

## Interface Contracts

### 1. Client ↔ Core Banking Batch Sync
- **Endpoint**: `POST /api/v1/sync/batch`
- **Headers**: `X-Agency-Code`, `X-Cashier-Id`, `X-Idempotency-Key`
- **Request Body**:
  ```json
  {
    "batch_id": "string",
    "device_id": "string",
    "timestamp": "ISO-8601",
    "transactions": [
      {
        "idempotency_key": "string",
        "account_id": "string",
        "member_id": "string",
        "operation_type": "DEPOSIT | WITHDRAWAL | TONTINE_CONTRIBUTION | LOAN_REPAYMENT",
        "amount": 50000,
        "currency": "XOF",
        "reference": "string",
        "offline_created_at": "ISO-8601"
      }
    ]
  }
  ```
- **Response Body**:
  ```json
  {
    "status": "SUCCESS | PARTIAL_SUCCESS",
    "processed_count": 1,
    "results": [
      {
        "idempotency_key": "string",
        "status": "COMMITTED | DUPLICATE | REJECTED",
        "new_balance": 150000,
        "ledger_tx_id": "string",
        "error": null
      }
    ]
  }
  ```

### 2. Mobile Money Gateway Interface
- **Interface**: `MobileMoneyGateway`
- **Methods**:
  - `initiateDeposit(accountNumber, amount, provider, phone): Promise<PaymentResponse>`
  - `initiateWithdrawal(accountNumber, amount, provider, phone): Promise<PaymentResponse>`
  - `verifyTransaction(transactionRef): Promise<TransactionStatus>`

### 3. Voice AI Assistant Contract
- **Endpoint**: `POST /api/v1/ai/voice-parse`
- **Request Body**:
  ```json
  {
    "transcript": "string",
    "audio_base64": "optional string",
    "language": "fr | ee | gej",
    "cashier_context": {
      "agency_id": "string",
      "cashier_id": "string"
    }
  }
  ```
- **Response Body**:
  ```json
  {
    "latency_ms": 850,
    "intent": "CASHIER_ORDER | BALANCE_QUERY | RATIO_ANALYSIS",
    "extracted_data": {
      "member_id_or_name": "string",
      "operation_type": "DEPOSIT | WITHDRAWAL | LOAN_REPAYMENT | TONTINE",
      "amount": 50000,
      "currency": "XOF",
      "notes": "string"
    },
    "confidence": 0.98,
    "clarification_needed": false
  }
  ```

---

## Code Layout
```
/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/
├── banolia-server/               # Core Banking & Accounting backend
│   ├── src/
│   │   ├── accounting/           # SYSCOA-SFD BCEAO 9-Class General Ledger
│   │   ├── domain/               # Members, Accounts, Loans, Tontines
│   │   ├── api/                  # REST routes, Sync endpoints
│   │   ├── mobile_money/         # TMoney, Flooz, Wave, MTN, Orange gateways
│   │   ├── ai/                   # Gemini multimodal parser & ratio engine
│   │   └── utils/
│   ├── tests/                    # Core Banking & Unit test suites
│   ├── package.json
│   └── tsconfig.json
│
├── banolia-desktop/              # Desktop Offline-First Agency POS (Tauri / React)
│   ├── src/
│   │   ├── components/           # CashierDesk, ThermalReceipt, AccountingView, etc.
│   │   ├── services/             # Local SQLite/storage, SyncEngine, Hardware HAL
│   │   └── types/                # Domain models
│   ├── tests/                    # Desktop offline & UI tests
│   └── package.json
│
├── banolia-mobile/               # Mobile Banking & Field Collector (Flutter / Dart)
│   ├── lib/
│   │   ├── src/
│   │   │   ├── models/           # Member, Account, Tontine, MicroLoan
│   │   │   ├── services/         # MobileMoneyService, OfflineCollectorService
│   │   │   └── ui/               # MemberPortal, CollectorDesk, ReceiptView
│   │   └── main.dart
│   ├── test/                     # Mobile & collector test suite
│   └── pubspec.yaml
│
└── tests/                        # Top-Level E2E Multi-Tier Test Suite
    ├── tier1_feature_coverage/   # Tier 1 tests (>=5 per feature)
    ├── tier2_boundary_corner/    # Tier 2 tests (>=5 per feature)
    ├── tier3_pairwise_race/      # Tier 3 cross-feature & race tests
    ├── tier4_real_world/         # Tier 4 real-world banking day scenarios
    ├── tier5_adversarial/        # Tier 5 adversarial gap hardening
    └── runner.js                 # Global E2E test runner
```
