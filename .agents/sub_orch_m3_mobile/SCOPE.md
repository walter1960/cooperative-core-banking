# Scope: Milestone 3 - Mobile Banking & Field Collector App (banolia-mobile)

## Architecture
- Framework: Flutter / Dart (Clean Architecture: Core, Data, Domain, Presentation).
- State Management: Provider / BLoC / Riverpod / ChangeNotifier architecture.
- Local Storage: Offline-first encrypted/persistent storage for local tontine transactions, pending sync queues, member caches.
- Networking & Gateways: REST client with retry/queue logic + Unified Mobile Money Gateway abstraction (TMoney, Flooz, Wave, MTN MoMo, Orange Money) + Sandbox simulator.
- Hardware Integration: Bluetooth ESC/POS 58mm thermal receipt generation with formatting, QR code, and French West Africa microfinance compliant receipts.

## Feature Inventory
| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 1 | Member Portal Balance & Ledger | Real vs. Frozen vs. Available balance display, transaction history, statement generation/download | PLANNED |
| 2 | Micro-loan Simulator & Application | Loan amortization calculator (fixed/declining balance), loan request submission with collateral & guarantor details | PLANNED |
| 3 | Unified Mobile Money Gateway | Provider abstraction supporting TMoney, Flooz, Wave, MTN MoMo, Orange Money, sandbox simulation & real API compliance | PLANNED |
| 4 | Field Collector Mode (Tontine Terrain) | 100% offline cotisation collection, market stall / geolocation routing, offline validation | PLANNED |
| 5 | Daily Collection Reconciliation | Collector batch submission, variance check, settlement sync with core backend | PLANNED |
| 6 | Thermal Receipt Generator | 58mm ESC/POS binary receipt generation with transaction reference, collector ID, member signature line, timestamp | PLANNED |
| 7 | Authentication & Security | Biometric/PIN login, secure token handling, offline session timeout | PLANNED |
| 8 | Comprehensive Test Suite | Unit tests, mock tests, receipt binary verification tests, mobile money gateway test vectors | PLANNED |

## Code Layout (Exclusive: `banolia-mobile/`)
```
banolia-mobile/
├── pubspec.yaml
├── lib/
│   ├── main.dart
│   ├── core/
│   │   ├── constants/
│   │   ├── errors/
│   │   ├── network/
│   │   ├── storage/
│   │   └── utils/
│   ├── features/
│   │   ├── auth/
│   │   ├── member_portal/
│   │   ├── loans/
│   │   ├── mobile_money/
│   │   ├── field_collector/
│   │   ├── tontine/
│   │   └── receipt/
│   └── shared/
└── test/
    ├── core/
    ├── features/
    └── mocks/
```
