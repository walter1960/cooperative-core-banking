# Scope: Milestone 2 — Desktop Offline-First Agency App (`banolia-desktop`)

## Architecture
- Framework: Tauri / React 19 / TypeScript / Vite / Tailwind CSS.
- Local Storage: Offline-First SQLite / IndexedDB / RxDB schema for members, accounts, loan files, cash shifts, and transactions.
- Teller Operations: Deposits, withdrawals, transfers, account opening, quick cash buttons, change calculator.
- ESC/POS Thermal Printing: 80mm and 58mm thermal receipts with auto-print, sequential ticket numbering, formatted layout.
- USB Biometrics: ISO 19794-2 template support with hardware abstraction and fallback mock driver.
- Cashier Shift Balancing (*Arrêté de caisse*): Opening balance, physical cash breakdown (*billetage* 10000..5 FCFA), real-time theoretical balance, discrepancy tracking (SFD 471200 / 472200), signed PV generation.
- Sync Engine: Bidirectional batch sync engine with SHA-256 HMAC-signed idempotency keys, offline queue replay, and conflict handling.

## Milestones & Tasks
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 2.1 | Local Storage & Schema | SQLite/Dexie IndexedDB schema, migrations, stores | none | DONE |
| 2.2 | Teller Desk & Financial Ops | Deposit, withdrawal, transfer, account creation, quick cash | 2.1 | DONE |
| 2.3 | ESC/POS Receipt Engine | 80mm/58mm generation, raw printer driver, formatting | 2.2 | DONE |
| 2.4 | Biometrics ISO 19794-2 | Template parsing/matching, USB abstraction | 2.1 | DONE |
| 2.5 | Cashier Shift Balancing | Billetage, real-time theoretical check, 471200/472200, signed PV | 2.2 | DONE |
| 2.6 | Sync Engine | HMAC idempotency, replay queue, conflict resolution | 2.1, 2.2 | DONE |

## Interface Contracts & Constraints
- Working directory boundary: strictly `banolia-desktop/`
- Build & tests command: Worker must verify npm/cargo build & test passes.
