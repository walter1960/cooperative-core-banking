# DISPATCH — Worker M1

## 2026-08-20T01:04:40Z
Task: Implement the complete, production-grade backend inside `banolia-server/` using TypeScript, Node.js, Express, and SQLite.
Scope:
1. Accounting Engine (SYSCOA-SFD, Double-entry general ledger, Trial balance, Balance sheet, Income statement, 5 BCEAO Prudential Ratios).
2. Domain Modules (Members & Share Capital, DAV/DAT Savings & 15-day interest rule, 31-day Tontines & commission, Loan Amortization 4 formulas & usury cap & repayment waterfall & PAR classification/provisioning).
3. Relational Schema & SQLite Database Layer (14 tables, ACID transactions).
4. REST API & Batch Sync Layer (Idempotency SHA-256, JWT & RBAC, Batch Sync, Transactions, Loans, Reports, Members, Accounts, Tontines).
5. Comprehensive Test Suites with 100% pass rate.
6. Verification & Handoff Report.
