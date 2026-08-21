# Scope: Milestone 1 — Core Banking & BCEAO/UMOA Accounting Engine

## Architecture
Milestone 1 builds the entire server-side core banking and regulatory accounting engine for BANOLIA inside `banolia-server/`.
- Language & Runtime: TypeScript / Node.js (Express / SQLite / Relational engine)
- Domain Model:
  1. SYSCOA-SFD BCEAO 9-Class Chart of Accounts (Classes 1 to 9).
  2. Double-Entry General Ledger Engine with atomic journal entries & strict debit=credit zero-sum invariant check.
  3. Member & KYC Management, Share Capital (*parts sociales*) subscriptions, transfers, and dividend records.
  4. Savings Products: Ordinary Savings (Dépôt à vue - DAV), Term Deposits (DAT), BCEAO 15-day interest rule (*règle des quinzaines*), and collateral freezing.
  5. 31-Day Cyclical Tontines (*Cotisations journalières de marché*) with daily collection, 1-day SFD commission deduction, and settlement routines.
  6. Credit / Loan Amortization Engine: 4 mathematical formulas (`CONSTANT_ANNUITY`, `CONSTANT_PRINCIPAL`, `IN_FINE`, `FLAT`), BCEAO usury cap enforcement (24%-27% max TEG), penalty calculations, and PAR30 / PAR90 portfolio provisioning.
  7. Automated Financial Statements & Prudential Reports: Balance Sheet (*Bilan* Actif/Passif), Income Statement (*Compte de Résultat*), General Ledger & Trial Balance (*Balance générale*), and BCEAO Prudential Ratios ($R_{LIQ}$, $R_{SOLV}$, $PAR_{30}$, $PAR_{90}$, $R_{DIV}$).
  8. Idempotent Bidirectional Sync & Transaction API: `POST /api/v1/sync/batch`, `POST /api/v1/transactions/process`, `POST /api/v1/loans/simulate`, and query endpoints with SHA-256 deduplication and transaction status mapping.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | BCEAO Chart of Accounts | 9-class PC-SFD ledger with double-entry equilibrium | M1 | Survey 1 |
| F02 | Member Management & KYC | Member registration, identification, parts sociales | M1 | Survey 1 |
| F03 | Savings Accounts & Tontines | Ordinary savings (15-day interest rule) and 31-day cyclical tontines | M1 | Survey 1 |
| F04 | Loan Amortization Engine | 4 amortization types, usury ceiling, PAR30/90 provisioning | M1 | Survey 1 |
| F05 | Automatic Financial Statements | Bilan, Compte de Résultat, BCEAO Prudential Ratios | M1 | Survey 1 / 3 |
| F06 | Core REST / Batch Sync API | Idempotent sync endpoints with X-Idempotency-Key | M1 | Survey 1 |

## Sub-Milestone Iteration Execution
Milestone 1 is executed in a comprehensive single-milestone iteration loop (2B):
- Step a: 3 Explorers (Architecture & Accounting specs, Banking Domain & Calculations, Sync & API Design)
- Step b: 1 Worker (Full implementation in `banolia-server/` with automated build & unit/integration test suites)
- Step c: 2 Reviewers (Financial accuracy, API compatibility, code robustness)
- Step d: 2 Challengers (Adversarial stress testing, double-entry invariant verification, concurrency & replay testing)
- Step e: 1 Forensic Auditor (Integrity verification against cheating/mock facades)
- Step f: Gate evaluation

## Interface Contracts
Exclusive ownership: `banolia-server/`
- API Base: `http://localhost:3000/api/v1`
- Batch Sync: `POST /api/v1/sync/batch` (idempotent, batch transaction processing)
- Transactions: `POST /api/v1/transactions/process` (single atomic transactions)
- Loans Simulator: `POST /api/v1/loans/simulate` (amortization schedule generation)
- Prudential Ratios: `GET /api/v1/reports/bceao-ratios` (liquidity, PAR30, PAR90, CAR)
- Financial Statements: `GET /api/v1/reports/balance-sheet`, `GET /api/v1/reports/income-statement`, `GET /api/v1/reports/trial-balance`

## Code Layout
```
banolia-server/
├── src/
│   ├── accounting/
│   │   ├── chartOfAccounts.ts   # 9-class SYSCOA-SFD accounts
│   │   ├── ledger.ts            # Double-entry posting & journal entry engine
│   │   └── reports.ts           # Bilan, Compte de Résultat, Trial Balance, Prudential Ratios
│   ├── domain/
│   │   ├── members.ts           # Members KYC & Share Capital
│   │   ├── savings.ts           # DAV, DAT, 15-day interest accrual
│   │   ├── tontines.ts          # 31-day cyclical tontines & commissions
│   │   └── loans.ts             # 4 Amortization formulas, usury cap, PAR provisioning
│   ├── db/
│   │   ├── database.ts          # Relational/SQLite storage engine with migrations
│   │   └── schema.sql
│   ├── api/
│   │   ├── server.ts            # Express app setup
│   │   ├── routes/              # Auth, Members, Accounts, Loans, Tontines, Sync, Reports
│   │   └── middleware/          # Idempotency, JWT auth, validation
│   └── index.ts
├── tests/
│   ├── accounting.test.ts       # Double-entry invariants & 9-class tests
│   ├── savings_tontines.test.ts # 15-day rule & 31-day tontine tests
│   ├── loans_amortization.test.ts # 4 formulas, usury cap, PAR tests
│   ├── sync_idempotency.test.ts # Idempotency, replay, batch sync tests
│   └── reports_ratios.test.ts   # BCEAO ratios & financial statements tests
├── package.json
└── tsconfig.json
```
