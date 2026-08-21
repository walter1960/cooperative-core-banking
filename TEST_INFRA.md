# E2E Test Infra: BANOLIA Microfinance Suite

## Test Philosophy
- **Requirement-Driven & Opaque-Box**: Tests verify user requirements directly through public APIs, CLI, sync engines, and realistic mock hardware interfaces without depending on internal implementation details.
- **Strict Determinism**: Zero flakiness, explicit timing bounds (<2s voice parser budget), and robust sandboxing for telecom Mobile Money and USB/Bluetooth hardware.
- **Mathematical & Regulatory Rigor**: Financial ledger equilibrium ($\sum Debit = \sum Credit$), exact amortization annuity formulas to 2 decimal places in XOF, 15-day interest rules, and BCEAO prudential ratios.

## Feature Inventory & Test Coverage Matrix
| # | Feature Area | Tier 1 (Nominal) | Tier 2 (Boundary) | Tier 3 (Cross/Race) | Tier 4 (Real-World) |
|---|--------------|:----------------:|:-----------------:|:-------------------:|:-------------------:|
| F01 | BCEAO Chart of Accounts & GL | 5 | 5 | ✓ | ✓ |
| F02 | Member Management & Parts Sociales | 5 | 5 | ✓ | ✓ |
| F03 | Savings & 31-Day Tontines | 5 | 5 | ✓ | ✓ |
| F04 | Loan Amortization (4 formulas) | 5 | 5 | ✓ | ✓ |
| F05 | Automatic Financial Statements & Ratios | 5 | 5 | ✓ | ✓ |
| F06 | Core Sync & Idempotency Engine | 5 | 5 | ✓ | ✓ |
| F07 | Desktop Local Offline DB & Queue | 5 | 5 | ✓ | ✓ |
| F08 | Teller Operations & Cash Counter | 5 | 5 | ✓ | ✓ |
| F09 | ESC/POS 80mm Receipt Formatting | 5 | 5 | ✓ | ✓ |
| F10 | Biometric ISO 19794-2 Authentication | 5 | 5 | ✓ | ✓ |
| F11 | Cashier Shift Balancing & Billetage | 5 | 5 | ✓ | ✓ |
| F12 | Desktop Bidirectional Batch Sync | 5 | 5 | ✓ | ✓ |
| F13 | Mobile Triple Balance & Micro-Loans | 5 | 5 | ✓ | ✓ |
| F14 | Mobile Money Gateway (TMoney/Flooz/Wave/MTN/Orange)| 5 | 5 | ✓ | ✓ |
| F15 | Field Collector Offline Tontine Mode | 5 | 5 | ✓ | ✓ |
| F16 | Voice Cashier Order Parser (<2s) | 5 | 5 | ✓ | ✓ |
| F17 | Multilingual NLP (French/Éwé/Mina) | 5 | 5 | ✓ | ✓ |
| F18 | AI Financial Ratio Analyzer | 5 | 5 | ✓ | ✓ |

## Test Architecture & Execution
- **Global E2E Test Runner**: `npm test` or `node tests/runner.js`
- **Sub-tier test suites**:
  - `tests/tier1_feature_coverage/` (>= 90 tests)
  - `tests/tier2_boundary_corner/` (>= 90 tests)
  - `tests/tier3_pairwise_race/` (>= 20 tests)
  - `tests/tier4_real_world/` (>= 10 multi-step day-in-the-life simulations)
  - `tests/tier5_adversarial/` (Adversarial edge injection & fuzzing)

## Acceptance Criteria
1. All Tier 1-4 tests must pass with 100% success rate and zero unhandled exceptions.
2. Voice AI parser latency must benchmark under 2000ms.
3. Accounting ledger must strictly balance on every transaction.
4. Bidirectional batch sync must never generate duplicate transactions when replaying the same idempotency keys.
