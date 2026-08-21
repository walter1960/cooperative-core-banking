# Milestone 1 — Server Architecture, Relational Database & API Layer Technical Design Report

**Document**: `handoff.md`  
**Author**: Explorer M1-3 (Server Architecture, Database & API Layer Explorer)  
**Target Project**: BANOLIA Microfinance Suite — `banolia-server/`  
**Milestone**: M1 (Core Banking & BCEAO/UMOA Accounting Engine)  
**Date**: 2026-08-20T01:04:00Z  

---

## 1. Observation

### 1.1 Requirements & Regulatory Framework
Under **ORIGINAL_REQUEST.md** (R1, R2, R4), **SCOPE.md** (Milestone 1), and **survey_core_banking.md**, BANOLIA requires a production-grade server backend (`banolia-server/`) serving as the central Core Banking Engine and Accounting Authority for the UMOA/BCEAO zone in Francs CFA (XOF).

Key direct observations from inputs:
1. **Regulatory Accounting Plan**: Mandatory adoption of SYSCOA-SFD / BCEAO PC-SFD (9 Account Classes: 1 to 9).
2. **Strict Invariant**: Double-entry general ledger posting where $\sum \text{Debit} \equiv \sum \text{Credit}$ with zero tolerance for imbalance in every atomic transaction.
3. **Currency & Precision**: Currency is `XOF` (0 physical decimal places in ledger; high-precision intermediate math with half-up / banker's rounding).
4. **Offline-First Synchronization**: `POST /api/v1/sync/batch` must process batched offline transactions with SHA-256 idempotency deduplication, status mapping (`COMMITTED`, `DUPLICATE`, `REJECTED`), and return delta entity updates.
5. **Atomic Financial Transaction**: `POST /api/v1/transactions/process` must execute balance check, account ledger update, cash register desk balance update, and double-entry GL journal entry in a single atomic ACID transaction.
6. **Loan Simulation & Usury Control**: `POST /api/v1/loans/simulate` must calculate amortization schedules for 4 formulas (`CONSTANT_ANNUITY`, `CONSTANT_PRINCIPAL`, `IN_FINE`, `FLAT`) and enforce the BCEAO usury ceiling (TEG $\le$ 27.0%).
7. **BCEAO Reports & Prudential Ratios**: Real-time generation of Balance Sheet (*Bilan* Actif/Passif), Income Statement (*Compte de Résultat*), Trial Balance (*Balance Générale*), and 5 Prudential Ratios ($R_{LIQ} \ge 100\%$, $CAR \ge 15\%$, $PAR_{30} \le 5\%$, $PAR_{90} \le 3\%$, $R_{DIV} \le 10\%$).

### 1.2 Target Code Layout (`banolia-server/`)
```
banolia-server/
├── src/
│   ├── config/
│   │   ├── env.ts                 # Environment variables & runtime config
│   │   └── constants.ts           # BCEAO regulations, usury caps, account classes
│   ├── db/
│   │   ├── database.ts            # SQLite connection & transaction manager
│   │   ├── schema.sql             # Full DDL with 14 tables, constraints & indexes
│   │   ├── seed.ts                # SYSCOA-SFD 9-class chart of accounts & demo seed
│   │   └── migrations.ts          # Schema versioning & migration runner
│   ├── accounting/
│   │   ├── chartOfAccounts.ts     # SYSCOA-SFD 9-class account dictionary & hierarchy
│   │   ├── ledger.ts              # Double-entry posting engine & invariant validator
│   │   └── reports.ts             # Bilan, Compte de Résultat, Trial Balance, BCEAO Ratios
│   ├── domain/
│   │   ├── members.ts             # Member KYC & Share Capital ledger
│   │   ├── savings.ts             # DAV, DAT, 15-day interest rule (règle des quinzaines)
│   │   ├── tontines.ts            # 31-day cyclical tontines & commission deduction
│   │   └── loans.ts               # 4 Amortization formulas, usury check, PAR30/90 provisioning
│   ├── api/
│   │   ├── server.ts              # Express application setup, middleware, CORS
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT auth & RBAC permission checks
│   │   │   ├── idempotency.ts     # X-Idempotency-Key validation & response replay
│   │   │   ├── validation.ts      # Request body schema validator
│   │   │   └── errorHandler.ts    # Centralized RFC-compliant error handler
│   │   └── routes/
│   │       ├── auth.routes.ts     # Login & session
│   │       ├── sync.routes.ts     # POST /api/v1/sync/batch
│   │       ├── transactions.routes.ts # POST /api/v1/transactions/process & queries
│   │       ├── members.routes.ts  # Member CRUD, share capital, accounts
│   │       ├── accounts.routes.ts # Account queries, statement, freeze/unfreeze
│   │       ├── tontines.routes.ts # Tontine subscriptions & daily cotisations
│   │       ├── loans.routes.ts    # Loan simulation, creation, disbursement, schedule
│   │       ├── cash.routes.ts     # Cash desk shift open/close, billetage, arrêté
│   │       └── reports.routes.ts  # Bilan, P&L, Trial Balance, Prudential Ratios
│   └── index.ts                   # Main application entry point
├── tests/
│   ├── helpers/
│   │   └── testDb.ts              # In-memory test database setup & seed
│   ├── accounting.test.ts         # Double-entry zero-sum invariant & 9-class tests
│   ├── savings_tontines.test.ts   # 15-day interest rule & 31-day tontines tests
│   ├── loans_amortization.test.ts # 4 formulas, usury barrier, PAR tests
│   ├── sync_idempotency.test.ts   # Idempotency replay, batch sync & delta updates
│   ├── api_integration.test.ts    # Express REST API endpoints integration tests
│   └── reports_ratios.test.ts     # BCEAO ratios & financial statements tests
├── package.json
└── tsconfig.json
```

---

## 2. Logic Chain & Detailed Architectural Design

### 2.1 Database Architecture & Schema DDL (`schema.sql`)

The database is built on a high-performance relational model (SQLite with WAL mode and `better-sqlite3` or relational MariaDB/PostgreSQL abstraction). The schema enforces foreign key constraints, column-level CHECK constraints for financial non-negativity, unique constraints on idempotency keys and receipt numbers, and compound indexing for rapid search.

```sql
-- ============================================================================
-- BANOLIA CORE BANKING RELATIONAL DATABASE SCHEMA (BCEAO / UMOA COMPLIANT)
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. Agencies (Agences et Guichets du SFD)
CREATE TABLE IF NOT EXISTS agencies (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,          -- e.g. 'A01', 'A02'
    name VARCHAR(100) NOT NULL,
    address TEXT,
    city VARCHAR(50) NOT NULL,
    country VARCHAR(10) DEFAULT 'TG',           -- Togo, Benin, Senegal, Cote d'Ivoire
    phone VARCHAR(20),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Users & Staff (Guichetiers, Collecteurs, Chefs d'Agence, Auditeurs)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    agency_id VARCHAR(36) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK(role IN ('SUPER_ADMIN', 'AGENCY_MANAGER', 'CREDIT_OFFICER', 'CASHIER', 'COLLECTOR', 'AUDITOR')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE RESTRICT
);

-- 3. Members & KYC (Sociétaires / Adhérents)
CREATE TABLE IF NOT EXISTS members (
    id VARCHAR(36) PRIMARY KEY,
    agency_id VARCHAR(36) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,          -- e.g. 'A0200225'
    manual_number VARCHAR(30),                 -- Legacy manual register number (e.g. '610')
    full_name VARCHAR(120) NOT NULL,
    gender VARCHAR(10) CHECK(gender IN ('M', 'F', 'OTHER')),
    birth_date TEXT NOT NULL,                  -- YYYY-MM-DD
    registration_date TEXT NOT NULL DEFAULT (date('now')),
    nationality VARCHAR(50) DEFAULT 'Togolaise',
    id_type VARCHAR(30) NOT NULL CHECK(id_type IN ('CNI', 'PASSPORT', 'VOTER_CARD', 'DRIVING_LICENSE')),
    id_number VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(50) NOT NULL,
    phone VARCHAR(25) NOT NULL UNIQUE,
    spouse_name VARCHAR(100),
    shares_purchased INTEGER NOT NULL DEFAULT 0 CHECK(shares_purchased >= 0),
    shares_sold INTEGER NOT NULL DEFAULT 0 CHECK(shares_sold >= 0),
    share_unit_price REAL NOT NULL DEFAULT 10000.00 CHECK(share_unit_price > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIF' CHECK(status IN ('PENDING', 'ACTIF', 'SUSPENDU', 'RADIE', 'DECEDE')),
    avatar_url TEXT,
    fingerprint_template TEXT,                -- Base64 encoded ISO 19794-2 template
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE RESTRICT
);

-- 4. Accounts (Comptes Dépôts à vue, Dépôts à terme, Garanties)
CREATE TABLE IF NOT EXISTS accounts (
    id VARCHAR(36) PRIMARY KEY,
    member_id VARCHAR(36) NOT NULL,
    agency_id VARCHAR(36) NOT NULL,
    account_number VARCHAR(30) NOT NULL UNIQUE, -- e.g. '25121100A020022501'
    product_type VARCHAR(30) NOT NULL CHECK(product_type IN ('SAVINGS_ORD', 'SAVINGS_LIVRET', 'DAT', 'TONTINE', 'CAREER_PLAN', 'PROJECT_PLAN', 'LOAN_RECEIVABLE')),
    product_name VARCHAR(100) NOT NULL,
    real_balance REAL NOT NULL DEFAULT 0.00,
    frozen_balance REAL NOT NULL DEFAULT 0.00 CHECK(frozen_balance >= 0),
    available_balance REAL GENERATED ALWAYS AS (real_balance - frozen_balance) STORED,
    currency VARCHAR(5) NOT NULL DEFAULT 'XOF',
    interest_rate REAL NOT NULL DEFAULT 0.00,   -- Annual interest rate in %
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIF' CHECK(status IN ('ACTIF', 'BLOQUE', 'SOLDE', 'DORMANT')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE RESTRICT
);

-- 5. Tontine Cycles and Subscriptions (Carnets de Tontine 31 Jours)
CREATE TABLE IF NOT EXISTS tontine_subscriptions (
    id VARCHAR(36) PRIMARY KEY,
    member_id VARCHAR(36) NOT NULL,
    collector_id VARCHAR(36) NOT NULL,
    account_id VARCHAR(36) NOT NULL,
    carnet_number VARCHAR(30) NOT NULL UNIQUE,  -- e.g. 'TK-2026-0089'
    daily_amount REAL NOT NULL CHECK(daily_amount > 0), -- e.g. 1000 XOF
    cycle_days INTEGER NOT NULL DEFAULT 31,
    paid_days INTEGER NOT NULL DEFAULT 0 CHECK(paid_days >= 0 AND paid_days <= 31),
    total_collected REAL NOT NULL DEFAULT 0.00 CHECK(total_collected >= 0),
    commission_amount REAL NOT NULL DEFAULT 0.00 CHECK(commission_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'MATURED', 'SETTLED', 'CANCELLED')),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT,
    FOREIGN KEY (collector_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
);

-- 6. Loan Products (Paramétrage des Produits de Crédit)
CREATE TABLE IF NOT EXISTS loan_products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    min_amount REAL NOT NULL CHECK(min_amount > 0),
    max_amount REAL NOT NULL CHECK(max_amount >= min_amount),
    annual_interest_rate REAL NOT NULL CHECK(annual_interest_rate >= 0 AND annual_interest_rate <= 27.0), -- BCEAO Usury Cap
    amortization_type VARCHAR(30) NOT NULL CHECK(amortization_type IN ('CONSTANT_ANNUITY', 'CONSTANT_PRINCIPAL', 'IN_FINE', 'FLAT')),
    min_duration_months INTEGER NOT NULL CHECK(min_duration_months > 0),
    max_duration_months INTEGER NOT NULL CHECK(max_duration_months >= min_duration_months),
    required_collateral_percent REAL NOT NULL DEFAULT 20.00
);

-- 7. Loan Files (Dossiers de Crédit Octroyés)
CREATE TABLE IF NOT EXISTS loan_files (
    id VARCHAR(36) PRIMARY KEY,
    member_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    agency_id VARCHAR(36) NOT NULL,
    loan_number VARCHAR(30) NOT NULL UNIQUE,    -- e.g. 'CR-2026-089'
    amount_granted REAL NOT NULL CHECK(amount_granted > 0),
    interest_rate REAL NOT NULL CHECK(interest_rate >= 0 AND interest_rate <= 27.0),
    duration_months INTEGER NOT NULL CHECK(duration_months > 0),
    amortization_type VARCHAR(30) NOT NULL CHECK(amortization_type IN ('CONSTANT_ANNUITY', 'CONSTANT_PRINCIPAL', 'IN_FINE', 'FLAT')),
    disbursement_date TEXT NOT NULL,
    maturity_date TEXT NOT NULL,
    monthly_payment REAL NOT NULL CHECK(monthly_payment >= 0),
    remaining_principal REAL NOT NULL CHECK(remaining_principal >= 0),
    overdue_amount REAL NOT NULL DEFAULT 0.00 CHECK(overdue_amount >= 0),
    overdue_days INTEGER NOT NULL DEFAULT 0 CHECK(overdue_days >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'EN_COURS' CHECK(status IN ('PENDING', 'APPROVED', 'DISBURSED', 'EN_COURS', 'EN_RETARD', 'CLOTURE', 'CONTENTIEUX')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT,
    FOREIGN KEY (product_id) REFERENCES loan_products(id) ON DELETE RESTRICT,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE RESTRICT
);

-- 8. Loan Amortization Schedules (Échéanciers d'Amortissement)
CREATE TABLE IF NOT EXISTS loan_schedules (
    id VARCHAR(36) PRIMARY KEY,
    loan_id VARCHAR(36) NOT NULL,
    installment_number INTEGER NOT NULL CHECK(installment_number > 0),
    due_date TEXT NOT NULL,
    principal_due REAL NOT NULL CHECK(principal_due >= 0),
    interest_due REAL NOT NULL CHECK(interest_due >= 0),
    fees_due REAL NOT NULL DEFAULT 0.00 CHECK(fees_due >= 0),
    total_due REAL NOT NULL CHECK(total_due >= 0),
    principal_paid REAL NOT NULL DEFAULT 0.00 CHECK(principal_paid >= 0),
    interest_paid REAL NOT NULL DEFAULT 0.00 CHECK(interest_paid >= 0),
    penalties_paid REAL NOT NULL DEFAULT 0.00 CHECK(penalties_paid >= 0),
    remaining_principal REAL NOT NULL CHECK(remaining_principal >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE')),
    paid_at TEXT,
    FOREIGN KEY (loan_id) REFERENCES loan_files(id) ON DELETE CASCADE,
    UNIQUE(loan_id, installment_number)
);

-- 9. Cash Registers (Caisses Physiques et Guichets)
CREATE TABLE IF NOT EXISTS cash_registers (
    id VARCHAR(36) PRIMARY KEY,
    agency_id VARCHAR(36) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,          -- 'CAISSE-01', '001'
    name VARCHAR(100) NOT NULL,
    balance REAL NOT NULL DEFAULT 0.00 CHECK(balance >= 0),
    gl_account VARCHAR(10) NOT NULL DEFAULT '571200', -- Compte SFD Caisse Guichet
    status VARCHAR(10) NOT NULL DEFAULT 'CLOSED' CHECK(status IN ('OPEN', 'CLOSED')),
    current_cashier_id VARCHAR(36),
    last_opened_at TEXT,
    last_closed_at TEXT,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE RESTRICT,
    FOREIGN KEY (current_cashier_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 10. Cash Shifts (Arrêtés et Sessions de Caisse)
CREATE TABLE IF NOT EXISTS cash_shifts (
    id VARCHAR(36) PRIMARY KEY,
    cash_register_id VARCHAR(36) NOT NULL,
    cashier_id VARCHAR(36) NOT NULL,
    opening_balance REAL NOT NULL CHECK(opening_balance >= 0),
    closing_balance_theoretical REAL,
    closing_balance_physical REAL,
    difference REAL,                            -- physical - theoretical
    opened_at TEXT NOT NULL DEFAULT (datetime('now')),
    closed_at TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'CLOSED_BALANCED', 'CLOSED_DISCREPANCY')),
    FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id) ON DELETE RESTRICT,
    FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- 11. General Ledger Accounts (Plan Comptable SFD Classes 1 à 9)
CREATE TABLE IF NOT EXISTS gl_accounts (
    account_number VARCHAR(10) PRIMARY KEY,    -- e.g. '571100', '251211'
    name VARCHAR(150) NOT NULL,
    account_class INTEGER NOT NULL CHECK(account_class >= 1 AND account_class <= 9),
    parent_account VARCHAR(10),
    type VARCHAR(20) NOT NULL CHECK(type IN ('ASSET', 'LIABILITY', 'EQUITY', 'EXPENSE', 'INCOME', 'OFF_BALANCE')),
    is_leaf INTEGER NOT NULL DEFAULT 1,
    current_debit REAL NOT NULL DEFAULT 0.00 CHECK(current_debit >= 0),
    current_credit REAL NOT NULL DEFAULT 0.00 CHECK(current_credit >= 0),
    balance_direction VARCHAR(10) NOT NULL CHECK(balance_direction IN ('DEBIT', 'CREDIT')),
    FOREIGN KEY (parent_account) REFERENCES gl_accounts(account_number) ON DELETE RESTRICT
);

-- 12. General Ledger Journal Entries (Pièces du Grand Livre)
CREATE TABLE IF NOT EXISTS gl_journal_entries (
    id VARCHAR(36) PRIMARY KEY,
    agency_id VARCHAR(36) NOT NULL,
    entry_number VARCHAR(30) NOT NULL UNIQUE,  -- 'JRN-20260820-0001'
    transaction_id VARCHAR(36),
    date_accounting TEXT NOT NULL,             -- YYYY-MM-DD
    description TEXT NOT NULL,
    created_by VARCHAR(36) NOT NULL,
    is_posted INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- 13. General Ledger Journal Lines (Lignes d'Écritures Comptables)
CREATE TABLE IF NOT EXISTS gl_journal_lines (
    id VARCHAR(36) PRIMARY KEY,
    entry_id VARCHAR(36) NOT NULL,
    gl_account VARCHAR(10) NOT NULL,
    debit REAL NOT NULL DEFAULT 0.00 CHECK(debit >= 0),
    credit REAL NOT NULL DEFAULT 0.00 CHECK(credit >= 0),
    line_description VARCHAR(255),
    FOREIGN KEY (entry_id) REFERENCES gl_journal_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (gl_account) REFERENCES gl_accounts(account_number) ON DELETE RESTRICT
);

-- 14. Transactions & Idempotency Log
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(36) PRIMARY KEY,
    idempotency_key VARCHAR(100) NOT NULL UNIQUE,
    receipt_number VARCHAR(40) NOT NULL UNIQUE, -- 'REC-20260820-0001'
    agency_id VARCHAR(36) NOT NULL,
    cashier_id VARCHAR(36) NOT NULL,
    member_id VARCHAR(36) NOT NULL,
    account_id VARCHAR(36) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK(type IN ('DEPOSIT', 'WITHDRAWAL', 'SHARE_PURCHASE', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'TONTINE_COLLECTION', 'TONTINE_SETTLEMENT', 'FEE_PAYMENT', 'TRANSFER')),
    amount REAL NOT NULL CHECK(amount > 0),
    fee_amount REAL NOT NULL DEFAULT 0.00 CHECK(fee_amount >= 0),
    payment_method VARCHAR(30) NOT NULL CHECK(payment_method IN ('CASH', 'TMONEY', 'FLOOZ', 'WAVE', 'ORANGE_MONEY', 'MTN_MOMO', 'INTERNAL_TRANSFER')),
    momo_reference VARCHAR(100),
    notes TEXT,
    sync_status VARCHAR(20) NOT NULL DEFAULT 'SYNCED' CHECK(sync_status IN ('SYNCED', 'PENDING_OFFLINE', 'CONFLICT_RESOLVED')),
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE RESTRICT,
    FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
);

-- ============================================================================
-- INDEXES FOR ULTRA-HIGH PERFORMANCE & SEARCH
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_members_code ON members(code);
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_accounts_number ON accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_accounts_member ON accounts(member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_idemp ON transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_transactions_receipt ON transactions(receipt_number);
CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_gl_journal_entries_date ON gl_journal_entries(date_accounting);
CREATE INDEX IF NOT EXISTS idx_gl_journal_lines_account ON gl_journal_lines(gl_account);
CREATE INDEX IF NOT EXISTS idx_gl_journal_lines_entry ON gl_journal_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_loan_files_member ON loan_files(member_id);
CREATE INDEX IF NOT EXISTS idx_tontine_member ON tontine_subscriptions(member_id);
```

---

### 2.2 Express TypeScript Server Architecture & Middleware

The Express server follows clean hexagonal / layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Express HTTP Layer                       │
│  (CORS, Helmet, BodyParser, RateLimiter, RequestLogger)     │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
┌──────────────▼──────────────┐ ┌──────────────▼──────────────┐
│     Auth & RBAC Middleware  │ │    Idempotency Middleware   │
│ (JWT verify, role checks)   │ │ (X-Idempotency-Key caching) │
└──────────────┬──────────────┘ └──────────────┬──────────────┘
               │                               │
┌──────────────▼───────────────────────────────▼──────────────┐
│                    API Controllers & Routes                 │
│  - Sync Controller (POST /api/v1/sync/batch)                │
│  - Transaction Controller (POST /api/v1/transactions/...)   │
│  - Loan Controller (POST /api/v1/loans/simulate, etc.)      │
│  - Member / Account / Tontine / Cash / Report Controllers   │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│                     Domain Logic Engines                    │
│  - Member KYC & Share Capital Service                       │
│  - Savings & 15-Day Interest Accrual Service                │
│  - 31-Day Tontine Cycle & Commission Settlement Service     │
│  - 4-Formula Loan Amortization & Usury Service              │
│  - Double-Entry General Ledger Posting Service              │
│  - Financial Statements (Bilan, P&L, Prudential Ratios)     │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│           Database & Transaction Manager (SQLite)           │
│  (ACID db.transaction(), Zero-Sum Verification, Migrations)  │
└─────────────────────────────────────────────────────────────┘
```

#### Key Middleware Implementations

1. **Idempotency Middleware (`src/api/middleware/idempotency.ts`)**:
   - Intercepts requests containing `X-Idempotency-Key` or request body `idempotencyKey`.
   - Checks if the key already exists in `transactions`.
   - If exists, immediately short-circuits and returns the cached transaction response with `status: "DUPLICATE"` or previously committed result, guaranteeing zero duplicate side-effects.

2. **JWT Authentication & RBAC Middleware (`src/api/middleware/auth.ts`)**:
   - Validates `Authorization: Bearer <jwt>` header.
   - Decodes `userId`, `agencyId`, `role`, and `username`.
   - Enforces role hierarchy: `SUPER_ADMIN` > `AGENCY_MANAGER` > `CREDIT_OFFICER` > `CASHIER` = `COLLECTOR` > `AUDITOR`.

3. **Centralized Error Handling (`src/api/middleware/errorHandler.ts`)**:
   - Converts domain errors (`InsufficientBalanceError`, `UsuryRateExceededError`, `AccountBlockedError`, `LedgerImbalanceError`) into standard JSON error responses with appropriate HTTP status codes (400, 403, 404, 409, 500).

---

### 2.3 Comprehensive API Contracts & Controller Specifications

#### 1. POST `/api/v1/sync/batch` (Idempotent Bidirectional Offline Sync)
Processes an array of offline transactions from Desktop or Mobile clients, applies idempotency checks on each item, commits valid operations atomically, and returns delta updates.

**Request**:
```http
POST /api/v1/sync/batch HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Authorization: Bearer <JWT>
X-Agency-Code: A02
X-Cashier-Id: usr-cashier-44

{
  "batchId": "batch-20260820-001",
  "deviceId": "desk-teller-01",
  "lastSyncedTimestamp": "2026-08-20T08:00:00Z",
  "offlineTransactions": [
    {
      "idempotencyKey": "idemp-desk-1724115468000-84920",
      "memberCode": "A0200225",
      "accountNumber": "25121100A020022501",
      "type": "DEPOSIT",
      "amount": 50000,
      "feeAmount": 0,
      "paymentMethod": "CASH",
      "notes": "Versement espèces guichet",
      "offlineTimestamp": "2026-08-20T09:15:30Z"
    },
    {
      "idempotencyKey": "idemp-desk-1724115468000-84921",
      "memberCode": "A0200226",
      "accountNumber": "25121100A020022601",
      "type": "WITHDRAWAL",
      "amount": 20000,
      "feeAmount": 100,
      "paymentMethod": "CASH",
      "notes": "Retrait espèces",
      "offlineTimestamp": "2026-08-20T09:20:00Z"
    }
  ]
}
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "batchId": "batch-20260820-001",
  "processedCount": 2,
  "committedCount": 2,
  "duplicateCount": 0,
  "rejectedCount": 0,
  "results": [
    {
      "idempotencyKey": "idemp-desk-1724115468000-84920",
      "status": "COMMITTED",
      "transactionId": "tx-88941",
      "receiptNumber": "REC-20260820-0042",
      "accountNumber": "25121100A020022501",
      "newRealBalance": 330424,
      "newAvailableBalance": 330424,
      "error": null
    },
    {
      "idempotencyKey": "idemp-desk-1724115468000-84921",
      "status": "COMMITTED",
      "transactionId": "tx-88942",
      "receiptNumber": "REC-20260820-0043",
      "accountNumber": "25121100A020022601",
      "newRealBalance": 80000,
      "newAvailableBalance": 80000,
      "error": null
    }
  ],
  "deltaUpdates": {
    "updatedMembers": [],
    "updatedAccounts": [
      {
        "accountNumber": "25121100A020022501",
        "memberId": "mem-001",
        "realBalance": 330424,
        "frozenBalance": 0,
        "availableBalance": 330424,
        "status": "ACTIF",
        "updatedAt": "2026-08-20T09:35:00Z"
      },
      {
        "accountNumber": "25121100A020022601",
        "memberId": "mem-002",
        "realBalance": 80000,
        "frozenBalance": 0,
        "availableBalance": 80000,
        "status": "ACTIF",
        "updatedAt": "2026-08-20T09:35:00Z"
      }
    ]
  },
  "serverSyncTimestamp": "2026-08-20T09:35:00Z"
}
```

---

#### 2. POST `/api/v1/transactions/process` (Atomic Double-Entry Financial Transaction)
Executes a single financial operation with complete transactional integrity across ledger, member account, and cash desk.

**Supported Operations & PC-SFD Double-Entry Accounting Mapping**:

| Operation Type | Description | Débit Account | Crédit Account |
|---|---|---|---|
| `DEPOSIT` | Versement espèces au guichet | `571200` (Caisse Guichet) | `251100` / `251211` (Dépôts à vue) |
| `WITHDRAWAL` | Retrait espèces au guichet | `251100` (Dépôts à vue) | `571200` (Caisse Guichet) [+ `705000` si frais] |
| `SHARE_PURCHASE` | Achat de parts sociales | `571200` (Caisse Guichet) | `101100` (Parts sociales libérées) [+ `706000` adhésion] |
| `LOAN_DISBURSEMENT`| Décaissement de crédit | `201100` / `202100` (Crédits) | `571200` (Caisse) ou `251100` (Compte DAV) |
| `LOAN_REPAYMENT` | Remboursement d'échéance | `571200` (Caisse) ou `251100` (DAV) | `201100` (Capital) + `701100` (Intérêts) [+ `703000` pénalités] |
| `TONTINE_COLLECTION`| Mise journalière collectée | `571300` (Caisse Collecteur) | `258000` (Compte d'attente tontine) |
| `TONTINE_SETTLEMENT`| Clôture & reversement cycle| `258000` (Compte d'attente tontine) | `251100` (DAV adhérent 30 mises) + `704000` (Comm. SFD 1 mise) |

**Request**:
```json
{
  "idempotencyKey": "idemp-tx-20260820-9988",
  "memberCode": "A0200225",
  "accountNumber": "25121100A020022501",
  "type": "DEPOSIT",
  "amount": 100000,
  "feeAmount": 0,
  "paymentMethod": "CASH",
  "notes": "Versement de réapprovisionnement",
  "agencyId": "ag-01",
  "cashierId": "usr-cashier-44"
}
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "transactionId": "tx-9988",
  "receiptNumber": "REC-20260820-0088",
  "idempotencyKey": "idemp-tx-20260820-9988",
  "status": "SYNCED",
  "account": {
    "accountNumber": "25121100A020022501",
    "realBalance": 380424,
    "frozenBalance": 0,
    "availableBalance": 380424
  },
  "cashRegister": {
    "code": "CAISSE-01",
    "newBalance": 333243
  },
  "glJournalEntry": {
    "entryNumber": "JRN-20260820-0088",
    "date": "2026-08-20",
    "lines": [
      { "glAccount": "571200", "debit": 100000, "credit": 0, "description": "Caisse Guichet" },
      { "glAccount": "251211", "debit": 0, "credit": 100000, "description": "Dépôts à vue adhérent A0200225" }
    ],
    "totalDebit": 100000,
    "totalCredit": 100000,
    "isBalanced": true
  },
  "timestamp": "2026-08-20T10:00:00Z"
}
```

---

#### 3. POST `/api/v1/loans/simulate` (Credit Simulator & Schedule Generator)
Calculates exact periodic installments, interest breakdown, remaining principal, and validates against the BCEAO usury ceiling ($TEG \le 27.0\%$).

**Request**:
```json
{
  "amount": 1000000,
  "annualInterestRate": 12.0,
  "durationMonths": 12,
  "amortizationType": "CONSTANT_ANNUITY",
  "disbursementDate": "2026-09-01",
  "gracePeriodMonths": 0
}
```

**Response (`200 OK`)**:
```json
{
  "amount": 1000000,
  "annualInterestRate": 12.0,
  "tegRate": 12.0,
  "isUsuryCompliant": true,
  "maxAllowedRate": 27.0,
  "monthlyPayment": 88849,
  "totalInterest": 66188,
  "totalRepayment": 1066188,
  "schedule": [
    { "installmentNumber": 1, "dueDate": "2026-10-01", "principalDue": 78849, "interestDue": 10000, "totalDue": 88849, "remainingPrincipal": 921151 },
    { "installmentNumber": 2, "dueDate": "2026-11-01", "principalDue": 79637, "interestDue": 9212, "totalDue": 88849, "remainingPrincipal": 841514 },
    { "installmentNumber": 12, "dueDate": "2027-09-01", "principalDue": 87970, "interestDue": 879, "totalDue": 88849, "remainingPrincipal": 0 }
  ]
}
```

---

#### 4. Complete REST Endpoints Directory

| Method | Endpoint | Description | Auth / Role |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Authenticate user & issue JWT | Public |
| `GET` | `/api/v1/auth/me` | Get current user profile & agency | Bearer Token |
| `POST` | `/api/v1/sync/batch` | Idempotent batch offline synchronization | Cashier / Collector |
| `POST` | `/api/v1/transactions/process` | Atomic financial transaction execution | Cashier / Collector |
| `GET` | `/api/v1/transactions` | Query transaction history (filters, pagination)| All staff |
| `GET` | `/api/v1/transactions/:id` | Get transaction details & receipt | All staff |
| `GET` | `/api/v1/members` | Search members (name, phone, code) | All staff |
| `POST` | `/api/v1/members` | Create new member & KYC profile | Manager / Officer |
| `GET` | `/api/v1/members/:id` | Get member full profile & accounts | All staff |
| `PUT` | `/api/v1/members/:id` | Update member KYC / address / phone | Manager / Officer |
| `POST` | `/api/v1/members/:id/shares/purchase`| Buy share capital (*parts sociales*) | Cashier / Manager |
| `GET` | `/api/v1/accounts/:accountNumber` | Get account details & real/frozen/avail balance | All staff |
| `POST` | `/api/v1/accounts/:accountNumber/freeze`| Freeze collateral balance | Credit Officer |
| `POST` | `/api/v1/accounts/:accountNumber/unfreeze`| Unfreeze collateral balance | Credit Officer |
| `GET` | `/api/v1/accounts/:accountNumber/statement`| Get account statement & entries | All staff |
| `POST` | `/api/v1/tontines/subscribe` | Open new 31-day carnet de tontine | Collector / Cashier |
| `POST` | `/api/v1/tontines/:id/collect` | Record daily tontine cotisation | Collector |
| `POST` | `/api/v1/tontines/:id/settle` | Settle matured cycle (30 to member, 1 to SFD)| Manager / Cashier |
| `POST` | `/api/v1/loans/simulate` | Simulate loan schedule (4 formulas, usury check) | Public / Staff |
| `POST` | `/api/v1/loans/apply` | Create loan application | Credit Officer |
| `POST` | `/api/v1/loans/:id/disburse` | Disburse approved loan & generate schedule | Agency Manager |
| `POST` | `/api/v1/loans/:id/repay` | Process installment repayment | Cashier |
| `POST` | `/api/v1/cash/shift/open` | Open cashier shift with opening balance | Cashier |
| `POST` | `/api/v1/cash/shift/close` | Close shift with physical billetage check | Cashier |
| `GET` | `/api/v1/reports/trial-balance` | Generate 6-column Balance Générale | Auditor / Manager |
| `GET` | `/api/v1/reports/balance-sheet` | Generate BCEAO Bilan (Actif / Passif) | Auditor / Manager |
| `GET` | `/api/v1/reports/income-statement`| Generate Compte de Résultat (P&L) | Auditor / Manager |
| `GET` | `/api/v1/reports/bceao-ratios` | Compute 5 BCEAO Prudential Ratios | Auditor / Manager |

---

### 2.4 Comprehensive Test Architecture for `banolia-server/`

The test architecture provides 100% automated coverage over all calculation formulas, ledger balance invariants, idempotency safety, and REST APIs.

#### Test Execution Setup
- **Runner**: Jest or Node Test Runner with TypeScript support (`ts-jest` or `tsx / vitest`).
- **Isolation**: Each test suite runs against an isolated, lightning-fast in-memory SQLite database (`:memory:`) populated with the SYSCOA-SFD Chart of Accounts and mock agencies/users/members.

#### Test Suite Breakdown

1. **`tests/accounting.test.ts` (Double-Entry Invariants & Chart of Accounts)**:
   - Tests posting of transactions across Classes 1 to 9.
   - Asserts that $\sum \text{Debit} - \sum \text{Credit} \equiv 0.00$ on every single journal entry.
   - Rejects any transaction attempt where lines do not balance.
   - Verifies trial balance (*Balance Générale*) debit sum equals credit sum.

2. **`tests/savings_tontines.test.ts` (15-Day Interest Rule & 31-Day Tontines)**:
   - Validates the BCEAO *Règle des quinzaines* (deposits between 1-15 earn from 16th, deposits 16-end earn from 1st of next month).
   - Validates that a 31-day tontine cycle with $1\ 000\text{ XOF}$ daily payment collects $31\ 000\text{ XOF}$, credits $30\ 000\text{ XOF}$ to member DAV, and credits $1\ 000\text{ XOF}$ to SFD commission account `704000`.
   - Validates available balance calculations with frozen collateral locks ($B_{avail} = B_{real} - B_{frozen}$).

3. **`tests/loans_amortization.test.ts` (4 Formulas, Usury Barrier & PAR)**:
   - Exact mathematical tests for `CONSTANT_ANNUITY`, `CONSTANT_PRINCIPAL`, `IN_FINE`, and `FLAT`.
   - Asserts that the sum of principal payments $\sum_{k=1}^n P_k$ exactly equals the initial capital $C_0$ down to $0\text{ XOF}$ remainder.
   - Asserts that any loan with interest rate $> 27.0\%$ is immediately rejected with `400 Bad Request / UsuryRateExceededException`.
   - Tests PAR30 ($31-90\text{ days} \to 25\%$) and PAR90 ($91-180\text{ days} \to 50\%$) portfolio provisioning formulas.

4. **`tests/sync_idempotency.test.ts` (Idempotency Replay & Batch Sync)**:
   - Injects the same transaction with identical `idempotencyKey` 10 times consecutively; asserts that exactly 1 transaction is posted, balance changes only once, and subsequent calls return `DUPLICATE` with the exact same receipt.
   - Submits a batch of 10 mixed operations; asserts atomic processing and correct delta account updates.

5. **`tests/api_integration.test.ts` (REST Endpoints Integration)**:
   - Full Supertest HTTP tests for member creation, share purchase, deposits, withdrawals, loan simulation, and cashier shift close.

6. **`tests/reports_ratios.test.ts` (Financial Statements & BCEAO Prudential Ratios)**:
   - Populates a full day of mixed banking operations and asserts:
     * Total Bilan Actif $\equiv$ Total Bilan Passif.
     * $R_{LIQ} \ge 100\%$, $CAR \ge 15\%$, $PAR_{30} \le 5\%$, $PAR_{90} \le 3\%$.

---

## 3. Caveats & Assumptions

1. **Database Engine Choice**: The technical design uses SQLite with WAL mode (`better-sqlite3`) as the core embedded relational engine for zero-dependency portability and instant test execution. The schema is fully compliant with standard SQL and can be migrated seamlessly to MariaDB/PostgreSQL.
2. **Dual-Sync Architecture**: BANOLIA acts as both a standalone, self-contained Core Banking Engine and an integration gateway to Apache Fineract. The standalone SQLite engine ensures complete autonomy and rapid offline syncing.
3. **Currency Rounding**: XOF has 0 physical decimals. All ledger entries, cash payments, and member accounts store integer or 2-decimal rounded values, while interest calculations use floating-point arithmetic with half-up rounding.

---

## 4. Conclusion

The server architecture, relational schema, Express TypeScript API layer, and automated test suite specified in this document provide a complete, robust, and regulatory-compliant foundation for Milestone 1. The Worker agent can directly execute implementation in `banolia-server/` following this blueprint without ambiguity.

---

## 5. Verification Method

To independently verify the technical architecture and implementation:

1. **Verify Database Initialization**:
   ```bash
   cd /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/banolia-server
   npm run build
   ```

2. **Execute Full Test Suite**:
   ```bash
   cd /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/banolia-server
   npm test
   ```
   Must pass 100% of unit, invariant, and integration tests across:
   - `accounting.test.ts`
   - `savings_tontines.test.ts`
   - `loans_amortization.test.ts`
   - `sync_idempotency.test.ts`
   - `api_integration.test.ts`
   - `reports_ratios.test.ts`

3. **Verify Zero-Sum Ledger Invariant Assertion**:
   Ensure `npm test` executes invariant assertions proving $\sum \text{Debit} - \sum \text{Credit} === 0.00$ on all financial postings.
