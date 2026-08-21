# Technical Investigation & Architecture Specification: Mobile Banking Member Portal & Micro-Loan Engine
**Project**: BANOLIA Microfinance Suite (`banolia-mobile`)  
**Milestone**: Milestone 3 — Mobile Banking & Field Collector Application  
**Author**: Explorer 1 (Member Portal & Micro-Loan Architecture)  
**Date**: 2026-08-20  
**Target Platform**: Flutter 3.x / Dart 3.x (Clean Architecture)  
**Regulatory Zone**: BCEAO / UMOA (XOF - Franc CFA) — Togo, Benin, Côte d'Ivoire, Senegal, Mali, Burkina Faso, Niger, Guinea-Bissau  

---

## 1. Executive Summary & Problem Boundary

The **Member Portal (Sociétaire M-Banking)** is the primary digital touchpoint for cooperative members within the BANOLIA microfinance ecosystem. It empowers members (artisans, market traders, agriculturalists, small business owners, salaried individuals) to manage their accounts autonomously, track balances, audit transaction histories, download certified bank statements, simulate micro-credit with complete transparent amortization schedules, and submit loan applications with collateral and guarantor declarations.

### Problem Boundary & Scope Division
- **Focus of Explorer 1 (This Document)**:
  1. **Member Portal Architecture & UI Flow**: Real, Frozen, and Available balances; multi-product account portfolio (Epargne, Parts Sociales, Tontines, Plans, DAT, Credits); transaction history with multi-criteria filtering, search, and pagination; certified statement generation and multi-format export (PDF/CSV/JSON).
  2. **Micro-loan Simulator & Application Engine**: Multi-mode amortization computation engine (Constant Annuity, Constant Principal, Bullet/In Fine, Flat Rate), periodic schedules (Monthly, Weekly, Bi-weekly, Quarterly), BCEAO usury rate ceiling enforcement (TEG $\le 24.0\% - 27.0\%$), administrative & insurance fee calculations, pre-qualification assessment, and multi-step loan application submission with collateral and guarantor declarations.
  3. **Clean Architecture Dart/Flutter Design**: Complete domain entities, value objects (integer-based currency `Money`), use cases, repository contracts, BLoC/Cubit state management, DTO models, data sources, and UI screen layout specifications.
- **Collaborative Interfaces (Explorers 2 & 3)**:
  - Interacts with **Explorer 2 (Mobile Money Gateway)** for deposit/withdrawal fund movements into member accounts.
  - Interacts with **Explorer 3 (Field Collector Mode & Thermal Receipts)** for tontine cycle tracking and offline-to-online transaction synchronizations.

---

## 2. Mathematical & Regulatory Specifications

### 2.1 Currency & Precision Invariant (BCEAO XOF)
- **Currency Code**: `XOF` (Francs CFA de la BCEAO).
- **Physical Smallest Unit**: 1 XOF (no fractional centimes exist in physical circulation).
- **Arithmetic Invariant**: All monetary values in memory, domain logic, and persistence MUST be handled as **64-bit Integers (`int`)** representing exact Francs CFA, or stored with explicit integer minor units to eliminate IEEE-754 floating-point rounding errors.
- **Interest Intermediate Calculation**: Floating-point calculations during amortization schedule generation use `double` with 8-digit precision, rounded to the nearest integer XOF at each installment using banker's rounding (*Round half to even* or standard `round()`), with the final period absorbing any centime remainder so that:
  $$\sum_{k=1}^n \text{Principal}_k \equiv \text{Principal Granted } (C_0)$$

---

### 2.2 Triple Balance Architecture & Financial Invariants

Microfinance cooperatives (SFDs) operating under BCEAO regulations distinguish between three critical balance concepts:

```
+-----------------------------------------------------------------------------------+
|                            TRIPLE BALANCE ARCHITECTURE                            |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                        SOLDE RÉEL (Real Total Balance)                    |   |
|   |   Total cumulative ledger balance of all liquid assets owned by member    |   |
|   +---------------------------------------------------------------------------+   |
|                                         │                                         |
|                                         ▼                                         |
|   +---------------------------------------------------------------------------+   |
|   |                      SOLDE GELÉ (Frozen Collateral Balance)               |   |
|   |   Pledged cash collateral (Nantissements), active loan security holds,     |   |
|   |   pending uncleared tontine holds, or legal freezes.                      |   |
|   +---------------------------------------------------------------------------+   |
|                                         │                                         |
|                                         ▼                                         |
|   +---------------------------------------------------------------------------+   |
|   |                   SOLDE DISPONIBLE (Available Liquid Balance)             |   |
|   |                Solde Disponible = Solde Réel - Solde Gelé                 |   |
|   |   Maximum amount immediately withdrawable or transferable. (Must be >= 0) |   |
|   +---------------------------------------------------------------------------+   |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

#### Balance Calculation Formulae
1. **Total Real Balance ($S_{reel}$)**:
   $$S_{reel} = \sum_{a \in \text{SavingsAccounts}} a.realBalance$$
2. **Total Frozen Balance ($S_{gele}$)**:
   $$S_{gele} = \sum_{a \in \text{SavingsAccounts}} a.frozenBalance + \sum_{l \in \text{ActiveLoans}} l.pledgedCashCollateral$$
3. **Total Available Balance ($S_{dispo}$)**:
   $$S_{dispo} = S_{reel} - S_{gele}$$
4. **Safety Invariant**:
   $$\forall \text{ Withdrawal/Transfer } T: \quad T.amount \le a.availableBalance \quad \land \quad a.availableBalance \ge 0$$

#### Member Account Portfolio Classification (SYSCOA-SFD / BCEAO)
| Product Code | Account Type | Account Description | Balance Behavior |
|---|---|---|---|
| **251100 / 251211** | `SAVINGS_ORDINARY` | Compte Épargne Libre / Dépôt à Vue (DAV) | Daily liquid operations; withdrawable subject to $S_{dispo}$ |
| **101100** | `SHARES` | Parts Sociales Souscrites Libérées | Member equity; unwithdrawable except upon formal exit |
| **253000** | `TERM_DEPOSIT` | Dépôt à Terme (DAT) | Blocked for contractual duration (3 to 36 mos); earns 5.0% - 7.5% |
| **254000** | `COLLATERAL_HOLD` | Dépôts de Garantie & Nantissements de Prêt | Pledged security held against outstanding micro-credits |
| **258000** | `TONTINE_CYCLE` | Compte d'Attente Tontine Journalière | Accumulates daily market cotisations (31 days) |
| **253310** | `PROJECT_PLAN` | Plan Épargne Projet / Retraite / Scolarité | Monthly programmed savings earning contractual bonus rate |
| **201100 / 202100** | `LOAN` | Crédits Courts & Moyens Termes | Debit balance representing outstanding principal owed |

---

### 2.3 Micro-Loan Amortization Calculation Engine

The loan calculation engine supports 4 standardized amortization types with weekly, bi-weekly, monthly, or quarterly schedules.

Let:
- $C_0 \in \mathbb{N}^*$: Principal loan amount in XOF (e.g. $1\ 000\ 000\text{ XOF}$).
- $T_{annuel} \in \mathbb{R}^+$: Nominal annual interest rate as a percentage (e.g. $9.5\% = 0.095$).
- $f \in \{12 \text{ (Monthly)}, 52 \text{ (Weekly)}, 26 \text{ (Bi-weekly)}, 4 \text{ (Quarterly)}\}$: Periodic payment frequency per year.
- $n \in \mathbb{N}^*$: Total number of installment periods ($n = \text{durationMonths} \times \frac{f}{12}$).
- $r = \frac{T_{annuel}}{f}$: Periodic interest rate.
- $k \in \{1, 2, \dots, n\}$: Installment index.
- $C_{k-1}$: Remaining principal balance prior to installment $k$ ($C_0$ for $k=1$).
- $P_k$: Principal portion of installment $k$.
- $I_k$: Interest portion of installment $k$.
- $F_{admin}$: Upfront or periodic administrative file fee (typically $1.0\% - 2.0\%$ of $C_0$).
- $F_{ins}$: Credit insurance fee (typically $0.5\% - 1.0\%$ of $C_0$ or periodic on outstanding balance).

```
+-----------------------------------------------------------------------------------------------+
|                                AMORTIZATION ENGINE WORKFLOW                                   |
+-----------------------------------------------------------------------------------------------+
|  Inputs: [Principal C_0] [Annual Rate T_annuel] [Periods n] [Frequency f] [AmortizationType]   |
|                                               │                                               |
|                                               ▼                                               |
|  1. Calculate Periodic Rate: r = T_annuel / f                                                 |
|  2. Calculate Fees: FileFee = round(C_0 * rate_admin), Insurance = round(C_0 * rate_ins)      |
|  3. Generate Schedule Array [k = 1 .. n]:                                                     |
|     - CONSTANT_ANNUITY:   A = C_0 * r / (1 - (1+r)^(-n))                                     |
|                           I_k = round(C_{k-1} * r), P_k = A - I_k, C_k = C_{k-1} - P_k        |
|     - CONSTANT_PRINCIPAL: P_k = round(C_0 / n), I_k = round(C_{k-1} * r), A_k = P_k + I_k    |
|     - IN_FINE (Bullet):   P_k = 0 (k < n), P_n = C_0, I_k = round(C_0 * r)                    |
|     - FLAT:               I_tot = round(C_0 * T_annuel * (n/f)), P_k = C_0/n, I_k = I_tot/n    |
|  4. Remainder Absorption: P_n = C_{n-1}, C_n = 0                                              |
|  5. Compute TEG (Taux Effectif Global) via Newton-Raphson IRR Solver                          |
|  6. Validate BCEAO Usury Ceiling: TEG <= USURY_CEILING (24.0% - 27.0%)                        |
+-----------------------------------------------------------------------------------------------+
```

#### Mathematical Formulas by Mode

#### 1. Constant Annuity (`CONSTANT_ANNUITY` / Échéance Constante)
The standard choice for commercial micro-loans and SME lines of credit.
$$\text{Fixed Installment } A = C_0 \times \frac{r}{1 - (1 + r)^{-n}}$$
For each period $k = 1, \dots, n$:
- Interest portion: $I_k = \text{round}(C_{k-1} \times r)$
- Principal portion: $P_k = A - I_k$ (for $k < n$)
- Final period adjustment: $P_n = C_{n-1}$, $A_n = P_n + I_n$
- Remaining principal: $C_k = C_{k-1} - P_k$, guaranteeing $C_n \equiv 0$

#### 2. Constant Principal (`CONSTANT_PRINCIPAL` / Amortissement Constant)
Widely used for agricultural equipment, vehicles, and productive asset financing.
- Periodic constant principal: $P_{base} = \lfloor \frac{C_0}{n} \rfloor$
- For $k = 1, \dots, n-1$: $P_k = P_{base}$
- Final principal: $P_n = C_0 - \sum_{j=1}^{n-1} P_j$
- Interest portion: $I_k = \text{round}(C_{k-1} \times r)$
- Total installment decreases over time: $A_k = P_k + I_k$

#### 3. Bullet Loan (`IN_FINE`)
Seasonal agricultural crop financing (warrantage) and short-term trading inventory.
- For $k = 1, \dots, n-1$: $P_k = 0$, $I_k = \text{round}(C_0 \times r)$, $A_k = I_k$.
- For $k = n$: $P_n = C_0$, $I_n = \text{round}(C_0 \times r)$, $A_n = C_0 + I_n$.

#### 4. Flat Rate (`FLAT`)
Legacy microfinance group methodology.
- Total interest: $I_{total} = \text{round}\left(C_0 \times T_{annuel} \times \frac{n}{f}\right)$
- Periodic interest: $I_k = \lfloor \frac{I_{total}}{n} \rfloor$
- Periodic principal: $P_k = \lfloor \frac{C_0}{n} \rfloor$
- Periodic installment: $A_k = P_k + I_k$
- Period $n$ reconciles integer remainder: $P_n = C_0 - \sum_{j=1}^{n-1} P_j$, $I_n = I_{total} - \sum_{j=1}^{n-1} I_j$.

---

### 2.4 BCEAO Usury Rate Ceiling & TEG Formula

Under **BCEAO Regulation (Instruction N° 01/2010/RB/SFD)**, the Effective Global Annual Rate (*Taux Effectif Global - TEG*) must include all mandatory interest, dossier processing fees, insurance premiums, and guarantee costs.

#### Effective Rate Calculation (IRR Equation)
Let $Nét\_Décaissé = C_0 - F_{dossier} - F_{assurance\_upfront}$.
The periodic internal rate of return $i_{per}$ satisfies:
$$Nét\_Décaissé = \sum_{k=1}^n \frac{A_k + F_{ins, k}}{(1 + i_{per})^k}$$
The annualized TEG is:
$$\text{TEG} = i_{per} \times f \times 100\%$$

#### Numerical Solver (Newton-Raphson Method)
Let $g(x) = \sum_{k=1}^n \frac{A_k}{(1 + x)^k} - Nét\_Décaissé$.
We iteratively compute:
$$x_{m+1} = x_m - \frac{g(x_m)}{g'(x_m)} = x_m - \frac{\sum_{k=1}^n \frac{A_k}{(1+x_m)^k} - Nét\_Décaissé}{-\sum_{k=1}^n \frac{k \cdot A_k}{(1+x_m)^{k+1}}}$$
Starting with initial guess $x_0 = \frac{T_{annuel}}{f}$, the algorithm converges within 4–6 iterations to precision $\epsilon < 10^{-7}$.

#### Usury Rate Rule:
$$\text{IF } \text{TEG} > \text{USURY\_CEILING} \quad (24.0\% \text{ to } 27.0\%) \implies \text{REJECT Simulation with UsuryViolationFailure}$$

---

### 2.5 Loan Pre-Qualification & Credit Scoring Engine

Before formal submission, the mobile client executes an instant offline/online pre-qualification evaluation to guide the sociétaire:

```
+-----------------------------------------------------------------------------------+
|                         PRE-QUALIFICATION CRITERIA MATRIX                         |
+-----------------------------------------------------------------------------------+
| 1. Member Seniority: Active member for >= 90 days.                                |
| 2. Share Capital Multiplier: Max Loan <= 5 x Paid-up Shares (Parts Sociales).     |
| 3. Minimum Collateral Requirement: (Liquid Savings + Collateral Value) >= 20%     |
| 4. Debt Service to Income Ratio (DSTI / Taux d'endettement):                      |
|    DSTI = (New Monthly Payment + Existing Monthly Debts) / Net Monthly Income    |
|    - DSTI <= 33%: OPTIMAL (Green light)                                           |
|    - 33% < DSTI <= 40%: MODERATE RISK (Requires additional guarantor)             |
|    - DSTI > 40%: REJECTED (High default risk)                                     |
| 5. Historical Repayment Score: 0 late payments in last 12 months.                 |
+-----------------------------------------------------------------------------------+
```

---

## 3. Clean Architecture Dart/Flutter Design

Following strict **Clean Architecture** and **SOLID** principles, `banolia-mobile` decouples domain enterprise business rules from UI widgets, device hardware, and remote network gateways.

```
banolia-mobile/
├── pubspec.yaml
├── lib/
│   ├── main.dart
│   ├── core/
│   │   ├── constants/
│   │   │   ├── api_endpoints.dart
│   │   │   ├── app_colors.dart
│   │   │   ├── app_dimens.dart
│   │   │   └── bceao_constants.dart
│   │   ├── errors/
│   │   │   ├── exceptions.dart
│   │   │   └── failures.dart
│   │   ├── network/
│   │   │   ├── api_client.dart
│   │   │   └── network_info.dart
│   │   ├── storage/
│   │   │   ├── secure_storage.dart
│   │   │   └── local_database.dart
│   │   ├── utils/
│   │   │   ├── currency_formatter.dart
│   │   │   ├── date_formatter.dart
│   │   │   └── newton_raphson_solver.dart
│   │   └── value_objects/
│   │       ├── account_number.dart
│   │       ├── date_range.dart
│   │       ├── member_code.dart
│   │       ├── money.dart
│   │       ├── phone_number.dart
│   │       └── rate.dart
│   ├── features/
│   │   ├── member_portal/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── account.dart
│   │   │   │   │   ├── member.dart
│   │   │   │   │   ├── statement_document.dart
│   │   │   │   │   ├── statement_summary.dart
│   │   │   │   │   ├── transaction.dart
│   │   │   │   │   └── triple_balance.dart
│   │   │   │   ├── repositories/
│   │   │   │   │   ├── i_account_repository.dart
│   │   │   │   │   ├── i_member_repository.dart
│   │   │   │   │   └── i_transaction_repository.dart
│   │   │   │   └── usecases/
│   │   │   │       ├── generate_account_statement.dart
│   │   │   │       ├── get_account_balances.dart
│   │   │   │       ├── get_member_profile.dart
│   │   │   │       └── get_transaction_history.dart
│   │   │   ├── data/
│   │   │   │   ├── datasources/
│   │   │   │   │   ├── account_local_datasource.dart
│   │   │   │   │   ├── account_remote_datasource.dart
│   │   │   │   │   ├── member_remote_datasource.dart
│   │   │   │   │   └── transaction_remote_datasource.dart
│   │   │   │   ├── models/
│   │   │   │   │   ├── account_model.dart
│   │   │   │   │   ├── member_model.dart
│   │   │   │   │   └── transaction_model.dart
│   │   │   │   └── repositories/
│   │   │   │       ├── account_repository_impl.dart
│   │   │   │       ├── member_repository_impl.dart
│   │   │   │       └── transaction_repository_impl.dart
│   │   │   └── presentation/
│   │   │       ├── blocs/
│   │   │       │   ├── balance/
│   │   │       │   │   ├── balance_cubit.dart
│   │   │       │   │   └── balance_state.dart
│   │   │       │   ├── statement/
│   │   │       │   │   ├── statement_cubit.dart
│   │   │       │   │   └── statement_state.dart
│   │   │       │   └── transactions/
│   │   │       │       ├── transaction_bloc.dart
│   │   │       │       ├── transaction_event.dart
│   │   │       │       └── transaction_state.dart
│   │   │       ├── screens/
│   │   │       │   ├── member_dashboard_screen.dart
│   │   │       │   ├── transaction_history_screen.dart
│   │   │       │   └── account_statement_screen.dart
│   │   │       └── widgets/
│   │   │           ├── triple_balance_card.dart
│   │   │           ├── account_selector_tile.dart
│   │   │           ├── transaction_filter_bottom_sheet.dart
│   │   │           └── transaction_item_row.dart
│   │   ├── loans/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── collateral.dart
│   │   │   │   │   ├── guarantor.dart
│   │   │   │   │   ├── loan_application.dart
│   │   │   │   │   ├── loan_product.dart
│   │   │   │   │   ├── loan_schedule_installment.dart
│   │   │   │   │   ├── loan_simulation.dart
│   │   │   │   │   └── pre_qualification_result.dart
│   │   │   │   ├── repositories/
│   │   │   │   │   └── i_loan_repository.dart
│   │   │   │   └── usecases/
│   │   │   │       ├── check_loan_prequalification.dart
│   │   │   │       ├── simulate_micro_loan.dart
│   │   │   │       └── submit_loan_application.dart
│   │   │   ├── data/
│   │   │   │   ├── datasources/
│   │   │   │   │   └── loan_remote_datasource.dart
│   │   │   │   ├── models/
│   │   │   │   │   ├── collateral_model.dart
│   │   │   │   │   ├── guarantor_model.dart
│   │   │   │   │   ├── loan_application_model.dart
│   │   │   │   │   └── loan_simulation_model.dart
│   │   │   │   └── repositories/
│   │   │   │       └── loan_repository_impl.dart
│   │   │   └── presentation/
│   │   │       ├── blocs/
│   │   │       │   ├── application/
│   │   │       │   │   ├── loan_application_bloc.dart
│   │   │       │   │   ├── loan_application_event.dart
│   │   │       │   │   └── loan_application_state.dart
│   │   │       │   └── simulator/
│   │   │       │       ├── loan_simulator_cubit.dart
│   │   │       │       └── loan_simulator_state.dart
│   │   │       ├── screens/
│   │   │       │   ├── loan_simulator_screen.dart
│   │   │       │   ├── loan_application_wizard_screen.dart
│   │   │       │   └── loan_status_detail_screen.dart
│   │   │       └── widgets/
│   │   │           ├── amortization_table_widget.dart
│   │   │           ├── collateral_form_card.dart
│   │   │           ├── guarantor_form_card.dart
│   │   │           └── pre_qualification_gauge.dart
│   │   └── receipt/
│   │       └── services/
│   │           └── pdf_statement_generator.dart
│   └── shared/
│       └── widgets/
│           ├── app_button.dart
│           ├── app_text_field.dart
│           ├── currency_display.dart
│           └── empty_state_view.dart
└── test/
    ├── core/
    │   └── utils/
    │       ├── currency_formatter_test.dart
    │       └── loan_calculation_engine_test.dart
    ├── features/
    │   ├── member_portal/
    │   │   ├── domain/
    │   │   │   └── usecases/
    │   │   │       ├── get_account_balances_test.dart
    │   │   │       └── get_transaction_history_test.dart
    │   │   └── presentation/
    │   │       └── blocs/
    │   │           └── balance_cubit_test.dart
    │   └── loans/
    │       ├── domain/
    │       │   └── usecases/
    │       │       ├── simulate_micro_loan_test.dart
    │       │       └── submit_loan_application_test.dart
    │       └── presentation/
    │           └── blocs/
    │               └── loan_simulator_cubit_test.dart
    └── mocks/
        ├── mock_account_repository.dart
        ├── mock_loan_repository.dart
        └── mock_transaction_repository.dart
```

---

## 4. Domain Layer Specifications

### 4.1 Value Objects

#### 1. `Money` (Zero-floating point XOF Currency Value Object)
```dart
import 'package:equatable/equatable.dart';

class Money extends Equatable {
  final int amountXof; // Amount in whole Francs CFA

  const Money(this.amountXof);

  static const Money zero = Money(0);

  Money operator +(Money other) => Money(amountXof + other.amountXof);
  Money operator -(Money other) => Money(amountXof - other.amountXof);
  Money operator *(num multiplier) => Money((amountXof * multiplier).round());
  
  bool operator >(Money other) => amountXof > other.amountXof;
  bool operator >=(Money other) => amountXof >= other.amountXof;
  bool operator <(Money other) => amountXof < other.amountXof;
  bool operator <=(Money other) => amountXof <= other.amountXof;

  bool get isNegative => amountXof < 0;
  bool get isZero => amountXof == 0;
  bool get isPositive => amountXof > 0;

  String get formatted => _formatCurrency(amountXof);

  static String _formatCurrency(int amount) {
    final str = amount.abs().toString();
    final buffer = StringBuffer();
    int count = 0;
    for (int i = str.length - 1; i >= 0; i--) {
      buffer.write(str[i]);
      count++;
      if (count % 3 == 0 && i > 0) {
        buffer.write(' ');
      }
    }
    final formattedStr = buffer.toString().split('').reversed.join('');
    final sign = amount < 0 ? '-' : '';
    return '$sign$formattedStr F.CFA';
  }

  @override
  List<Object?> get props => [amountXof];

  @override
  String toString() => formatted;
}
```

#### 2. `Rate` (Percentage Value Object)
```dart
import 'package:equatable/equatable.dart';

class Rate extends Equatable {
  final double percent; // e.g. 9.5 for 9.5%

  const Rate(this.percent);

  double get decimalFraction => percent / 100.0;

  bool isAboveUsuryCeiling({double ceiling = 24.0}) => percent > ceiling;

  @override
  List<Object?> get props => [percent];

  @override
  String toString() => '${percent.toStringAsFixed(2)}%';
}
```

---

### 4.2 Entities

#### 1. `Member` & `TripleBalance`
```dart
import 'package:equatable/equatable.dart';
import '../../../../core/value_objects/money.dart';
import '../../../../core/value_objects/member_code.dart';

enum MemberStatus { actif, suspendu, radie, decede }

class Member extends Equatable {
  final String id;
  final MemberCode code; // e.g. "A0200225"
  final String manualNumber; // e.g. "610"
  final String fullName;
  final String phone;
  final String address;
  final String city;
  final DateTime registrationDate;
  final int sharesPurchased;
  final int sharesAvailable;
  final Money shareUnitPrice;
  final MemberStatus status;
  final String? avatarUrl;

  const Member({
    required this.id,
    required this.code,
    required this.manualNumber,
    required this.fullName,
    required this.phone,
    required this.address,
    required this.city,
    required this.registrationDate,
    required this.sharesPurchased,
    required this.sharesAvailable,
    required this.shareUnitPrice,
    required this.status,
    this.avatarUrl,
  });

  Money get totalShareCapital => shareUnitPrice * sharesPurchased;

  @override
  List<Object?> get props => [id, code, fullName, phone, status];
}

class TripleBalance extends Equatable {
  final Money realBalance;      // Solde Réel
  final Money frozenBalance;    // Solde Gelé (Nantissements/Garanties)
  final Money availableBalance; // Solde Disponible

  const TripleBalance({
    required this.realBalance,
    required this.frozenBalance,
    required this.availableBalance,
  });

  factory TripleBalance.compute({
    required Money real,
    required Money frozen,
  }) {
    final available = real - frozen;
    return TripleBalance(
      realBalance: real,
      frozenBalance: frozen,
      availableBalance: available.isNegative ? Money.zero : available,
    );
  }

  @override
  List<Object?> get props => [realBalance, frozenBalance, availableBalance];
}
```

#### 2. `Account` & `Transaction`
```dart
enum AccountType {
  savingsOrdinary, // 251100 Epargne Ordinaire
  savingsLivret,   // 252000 Livret Rémunéré
  termDeposit,     // 253000 DAT
  tontine,         // 258000 Tontine
  shares,          // 101100 Parts Sociales
  loan,            // 201100 Crédits
  projectPlan,     // 253310 Plan Projet
}

enum AccountStatus { actif, bloque, solde, dormant }

class Account extends Equatable {
  final String id;
  final String accountNumber;
  final String memberCode;
  final String productCode;
  final String productName;
  final AccountType accountType;
  final TripleBalance balance;
  final AccountStatus status;
  final DateTime createdAt;

  const Account({
    required this.id,
    required this.accountNumber,
    required this.memberCode,
    required this.productCode,
    required this.productName,
    required this.accountType,
    required this.balance,
    required this.status,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, accountNumber, accountType, balance, status];
}

enum TransactionType {
  deposit,           // Versement
  withdrawal,        // Retrait
  sharePurchase,     // Achat parts sociales
  loanDisbursement,  // Décaissement prêt
  loanRepayment,     // Remboursement prêt
  tontineCotisation, // Cotisation tontine
  transfer,          // Virement interne
  mobileMoneyCashIn, // Rechargement MoMo
  mobileMoneyCashOut,// Retrait vers MoMo
  interestCredit,    // Intérêts créditeurs
  feeDebit,          // Frais de tenue de compte
}

enum PaymentMethod {
  cash,
  tmoney,
  flooz,
  wave,
  mtnMomo,
  orangeMoney,
  internalTransfer,
}

class Transaction extends Equatable {
  final String id;
  final String receiptNumber;
  final String accountNumber;
  final String memberCode;
  final TransactionType type;
  final Money amount;
  final Money feeAmount;
  final PaymentMethod paymentMethod;
  final String description;
  final DateTime timestamp;
  final String idempotencyKey;
  final String? remoteReference;
  final bool isCredit;

  const Transaction({
    required this.id,
    required this.receiptNumber,
    required this.accountNumber,
    required this.memberCode,
    required this.type,
    required this.amount,
    required this.feeAmount,
    required this.paymentMethod,
    required this.description,
    required this.timestamp,
    required this.idempotencyKey,
    this.remoteReference,
    required this.isCredit,
  });

  @override
  List<Object?> get props => [id, receiptNumber, amount, type, timestamp];
}
```

#### 3. `LoanSimulation` & `LoanScheduleInstallment`
```dart
enum AmortizationType {
  constantAnnuity,   // Échéances constantes (Mensualité fixe)
  constantPrincipal, // Amortissement constant (Principal fixe)
  inFine,            // Remboursement In Fine (Bullet)
  flat,              // Taux fixe linéaire
}

enum PaymentFrequency {
  weekly,    // Hebdomadaire (52/an)
  biWeekly,  // Bimensuel (26/an)
  monthly,   // Mensuel (12/an)
  quarterly, // Trimestriel (4/an)
}

class LoanScheduleInstallment extends Equatable {
  final int installmentNumber;
  final DateTime dueDate;
  final Money principalDue;
  final Money interestDue;
  final Money feesDue;
  final Money insuranceDue;
  final Money totalInstallment;
  final Money remainingPrincipal;

  const LoanScheduleInstallment({
    required this.installmentNumber,
    required this.dueDate,
    required this.principalDue,
    required this.interestDue,
    required this.feesDue,
    required this.insuranceDue,
    required this.totalInstallment,
    required this.remainingPrincipal,
  });

  @override
  List<Object?> get props => [
        installmentNumber,
        dueDate,
        principalDue,
        interestDue,
        totalInstallment,
        remainingPrincipal,
      ];
}

class LoanSimulation extends Equatable {
  final Money requestedAmount;
  final Rate annualInterestRate;
  final int durationMonths;
  final PaymentFrequency frequency;
  final AmortizationType amortizationType;
  final DateTime disbursementDate;
  final Money periodicPayment;
  final Money totalInterest;
  final Money totalFees;
  final Money totalInsurance;
  final Money totalRepayment;
  final Rate tegAnnualRate; // Taux Effectif Global
  final bool isUsuryCompliant;
  final List<LoanScheduleInstallment> schedule;

  const LoanSimulation({
    required this.requestedAmount,
    required this.annualInterestRate,
    required this.durationMonths,
    required this.frequency,
    required this.amortizationType,
    required this.disbursementDate,
    required this.periodicPayment,
    required this.totalInterest,
    required this.totalFees,
    required this.totalInsurance,
    required this.totalRepayment,
    required this.tegAnnualRate,
    required this.isUsuryCompliant,
    required this.schedule,
  });

  @override
  List<Object?> get props => [
        requestedAmount,
        annualInterestRate,
        durationMonths,
        totalRepayment,
        tegAnnualRate,
        isUsuryCompliant,
      ];
}
```

#### 4. `LoanApplication`, `Collateral` & `Guarantor`
```dart
enum CollateralType {
  savingsDepositHold, // Nantissement sur compte épargne
  vehiclePledge,      // Gage sur véhicule / moto
  equipmentPledge,    // Gage sur matériel d'exploitation
  realEstateMortgage, // Hypothèque conventionnelle
  commercialGoods,    // Nantissement de stock marchandise
}

class Collateral extends Equatable {
  final String id;
  final CollateralType type;
  final String description;
  final Money estimatedValue;
  final Money pledgedAmount;
  final String documentProofUrl;

  const Collateral({
    required this.id,
    required this.type,
    required this.description,
    required this.estimatedValue,
    required this.pledgedAmount,
    required this.documentProofUrl,
  });

  @override
  List<Object?> get props => [id, type, estimatedValue, pledgedAmount];
}

class Guarantor extends Equatable {
  final String id;
  final String fullName;
  final String? memberCode; // If guarantor is also a cooperative member
  final String phone;
  final String nationalIdNumber;
  final String occupation;
  final String employerOrBusiness;
  final Money monthlyIncome;
  final Money guaranteedAmount;
  final String relationship;
  final String guarantorAgreementDocUrl;

  const Guarantor({
    required this.id,
    required this.fullName,
    this.memberCode,
    required this.phone,
    required this.nationalIdNumber,
    required this.occupation,
    required this.employerOrBusiness,
    required this.monthlyIncome,
    required this.guaranteedAmount,
    required this.relationship,
    required this.guarantorAgreementDocUrl,
  });

  @override
  List<Object?> get props => [id, fullName, phone, guaranteedAmount];
}

enum LoanApplicationStatus {
  draft,
  submitted,
  underCreditCommitteeReview,
  approvedPendingDisbursement,
  disbursedActive,
  rejected,
  withdrawn,
}

class LoanApplication extends Equatable {
  final String id;
  final String applicationNumber; // e.g. "DMD-202608-0042"
  final String memberCode;
  final String purposeOfLoan; // e.g. "Achat stock engrais maïs"
  final Money requestedAmount;
  final int durationMonths;
  final AmortizationType amortizationType;
  final Rate annualInterestRate;
  final List<Collateral> collaterals;
  final List<Guarantor> guarantors;
  final Money declaredMonthlyIncome;
  final Money declaredMonthlyExpenses;
  final LoanApplicationStatus status;
  final String? rejectionReason;
  final DateTime createdAt;
  final DateTime? reviewedAt;

  const LoanApplication({
    required this.id,
    required this.applicationNumber,
    required this.memberCode,
    required this.purposeOfLoan,
    required this.requestedAmount,
    required this.durationMonths,
    required this.amortizationType,
    required this.annualInterestRate,
    required this.collaterals,
    required this.guarantors,
    required this.declaredMonthlyIncome,
    required this.declaredMonthlyExpenses,
    required this.status,
    this.rejectionReason,
    required this.createdAt,
    this.reviewedAt,
  });

  Money get totalCollateralValue => collaterals.fold(
        Money.zero,
        (sum, item) => sum + item.pledgedAmount,
      );

  Money get totalGuaranteedValue => guarantors.fold(
        Money.zero,
        (sum, item) => sum + item.guaranteedAmount,
      );

  @override
  List<Object?> get props => [id, applicationNumber, status, requestedAmount];
}
```

---

### 4.3 Use Cases

#### 1. `SimulateMicroLoan` Use Case & Calculation Engine
```dart
import 'dart:math' as math;
import '../../../../core/errors/failures.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/value_objects/money.dart';
import '../../../../core/value_objects/rate.dart';
import '../entities/loan_simulation.dart';
import '../repositories/i_loan_repository.dart';

class SimulateLoanParams {
  final Money amount;
  final Rate annualRate;
  final int durationMonths;
  final PaymentFrequency frequency;
  final AmortizationType type;
  final DateTime disbursementDate;
  final double adminFeePercent; // e.g. 1.5%
  final double insuranceFeePercent; // e.g. 0.5%

  const SimulateLoanParams({
    required this.amount,
    required this.annualRate,
    required this.durationMonths,
    required this.frequency,
    required this.type,
    required this.disbursementDate,
    this.adminFeePercent = 1.5,
    this.insuranceFeePercent = 0.5,
  });
}

class SimulateMicroLoan {
  static const double bceaoUsuryCeiling = 24.0; // 24.0% annual max for SFDs

  Either<Failure, LoanSimulation> execute(SimulateLoanParams params) {
    if (params.amount.amountXof <= 0) {
      return Left(InvalidInputFailure('Le montant du prêt doit être supérieur à zéro.'));
    }
    if (params.durationMonths <= 0 || params.durationMonths > 60) {
      return Left(InvalidInputFailure('La durée doit être comprise entre 1 et 60 mois.'));
    }

    final double f = switch (params.frequency) {
      PaymentFrequency.weekly => 52.0,
      PaymentFrequency.biWeekly => 26.0,
      PaymentFrequency.monthly => 12.0,
      PaymentFrequency.quarterly => 4.0,
    };

    final int n = ((params.durationMonths / 12.0) * f).round();
    final double r = params.annualRate.decimalFraction / f;
    final int principalTotal = params.amount.amountXof;

    final int adminFees = (principalTotal * (params.adminFeePercent / 100.0)).round();
    final int insuranceFees = (principalTotal * (params.insuranceFeePercent / 100.0)).round();
    final int upfrontDeductions = adminFees + insuranceFees;

    final List<LoanScheduleInstallment> schedule = [];
    int remainingPrincipal = principalTotal;
    int totalInterest = 0;

    DateTime currentDate = params.disbursementDate;

    DateTime getNextDueDate(DateTime prevDate, PaymentFrequency freq) {
      return switch (freq) {
        PaymentFrequency.weekly => prevDate.add(const Duration(days: 7)),
        PaymentFrequency.biWeekly => prevDate.add(const Duration(days: 14)),
        PaymentFrequency.monthly => DateTime(prevDate.year, prevDate.month + 1, prevDate.day),
        PaymentFrequency.quarterly => DateTime(prevDate.year, prevDate.month + 3, prevDate.day),
      };
    }

    switch (params.type) {
      case AmortizationType.constantAnnuity:
        final double annuity = principalTotal * (r / (1.0 - math.pow(1.0 + r, -n)));
        final int fixedPayment = annuity.round();

        for (int k = 1; k <= n; k++) {
          currentDate = getNextDueDate(currentDate, params.frequency);
          final int interest = (remainingPrincipal * r).round();
          int principal = fixedPayment - interest;

          if (k == n || principal > remainingPrincipal) {
            principal = remainingPrincipal;
          }

          final int totalInstallment = principal + interest;
          remainingPrincipal -= principal;
          totalInterest += interest;

          schedule.add(LoanScheduleInstallment(
            installmentNumber: k,
            dueDate: currentDate,
            principalDue: Money(principal),
            interestDue: Money(interest),
            feesDue: Money.zero,
            insuranceDue: Money.zero,
            totalInstallment: Money(totalInstallment),
            remainingPrincipal: Money(remainingPrincipal < 0 ? 0 : remainingPrincipal),
          ));
        }
        break;

      case AmortizationType.constantPrincipal:
        final int basePrincipal = (principalTotal / n).floor();

        for (int k = 1; k <= n; k++) {
          currentDate = getNextDueDate(currentDate, params.frequency);
          final int interest = (remainingPrincipal * r).round();
          int principal = basePrincipal;

          if (k == n) {
            principal = remainingPrincipal;
          }

          final int totalInstallment = principal + interest;
          remainingPrincipal -= principal;
          totalInterest += interest;

          schedule.add(LoanScheduleInstallment(
            installmentNumber: k,
            dueDate: currentDate,
            principalDue: Money(principal),
            interestDue: Money(interest),
            feesDue: Money.zero,
            insuranceDue: Money.zero,
            totalInstallment: Money(totalInstallment),
            remainingPrincipal: Money(remainingPrincipal < 0 ? 0 : remainingPrincipal),
          ));
        }
        break;

      case AmortizationType.inFine:
        for (int k = 1; k <= n; k++) {
          currentDate = getNextDueDate(currentDate, params.frequency);
          final int interest = (principalTotal * r).round();
          final int principal = (k == n) ? principalTotal : 0;
          final int totalInstallment = principal + interest;

          if (k == n) remainingPrincipal = 0;
          totalInterest += interest;

          schedule.add(LoanScheduleInstallment(
            installmentNumber: k,
            dueDate: currentDate,
            principalDue: Money(principal),
            interestDue: Money(interest),
            feesDue: Money.zero,
            insuranceDue: Money.zero,
            totalInstallment: Money(totalInstallment),
            remainingPrincipal: Money(remainingPrincipal),
          ));
        }
        break;

      case AmortizationType.flat:
        final int computedTotalInterest = (principalTotal * params.annualRate.decimalFraction * (params.durationMonths / 12.0)).round();
        final int periodicPrincipal = (principalTotal / n).floor();
        final int periodicInterest = (computedTotalInterest / n).floor();

        for (int k = 1; k <= n; k++) {
          currentDate = getNextDueDate(currentDate, params.frequency);
          int principal = periodicPrincipal;
          int interest = periodicInterest;

          if (k == n) {
            principal = remainingPrincipal;
            interest = computedTotalInterest - totalInterest;
          }

          final int totalInstallment = principal + interest;
          remainingPrincipal -= principal;
          totalInterest += interest;

          schedule.add(LoanScheduleInstallment(
            installmentNumber: k,
            dueDate: currentDate,
            principalDue: Money(principal),
            interestDue: Money(interest),
            feesDue: Money.zero,
            insuranceDue: Money.zero,
            totalInstallment: Money(totalInstallment),
            remainingPrincipal: Money(remainingPrincipal < 0 ? 0 : remainingPrincipal),
          ));
        }
        break;
    }

    // Solve TEG via Newton-Raphson
    final double netDisbursed = (principalTotal - upfrontDeductions).toDouble();
    double iGuess = r > 0 ? r : 0.01;

    for (int iter = 0; iter < 20; iter++) {
      double fVal = -netDisbursed;
      double fPrime = 0.0;

      for (int k = 1; k <= n; k++) {
        final double ak = schedule[k - 1].totalInstallment.amountXof.toDouble();
        final double discountFactor = math.pow(1.0 + iGuess, k).toDouble();
        fVal += ak / discountFactor;
        fPrime -= (k * ak) / (discountFactor * (1.0 + iGuess));
      }

      if (fPrime.abs() < 1e-12) break;
      final double delta = fVal / fPrime;
      iGuess -= delta;
      if (delta.abs() < 1e-7) break;
    }

    final double calculatedTeg = iGuess * f * 100.0;
    final bool isUsuryCompliant = calculatedTeg <= bceaoUsuryCeiling;

    final Money periodicPayment = schedule.isNotEmpty ? schedule.first.totalInstallment : Money.zero;
    final Money totalRepayment = Money(principalTotal + totalInterest + adminFees + insuranceFees);

    return Right(LoanSimulation(
      requestedAmount: params.amount,
      annualInterestRate: params.annualRate,
      durationMonths: params.durationMonths,
      frequency: params.frequency,
      amortizationType: params.type,
      disbursementDate: params.disbursementDate,
      periodicPayment: periodicPayment,
      totalInterest: Money(totalInterest),
      totalFees: Money(adminFees),
      totalInsurance: Money(insuranceFees),
      totalRepayment: totalRepayment,
      tegAnnualRate: Rate(calculatedTeg),
      isUsuryCompliant: isUsuryCompliant,
      schedule: schedule,
    ));
  }
}
```

---

## 5. Presentation Layer & UI Specifications

### 5.1 Member Dashboard Screen Layout

```
+-------------------------------------------------------------------------------+
| [Avatar] Bonjour, Ablavi AMEGNINOU (A0200225)                [🔔] [Mode Nuit] |
| Agence Centrale Lomé | Part Sociale: 50 000 F (5 parts)                       |
+-------------------------------------------------------------------------------+
|  +-------------------------------------------------------------------------+  |
|  |                     SOLDE DISPONIBLE (Disponible Immédiat)              |  |
|  |                                                                         |  |
|  |                  650 424 F.CFA                                          |  |
|  |                                                                         |  |
|  |  [+] Solde Réel: 750 424 F.CFA   |   [-] Solde Gelé: 100 000 F.CFA      |  |
|  +-------------------------------------------------------------------------+  |
|                                                                               |
|  [ + Dépôt Mobile Money ]  [ - Retrait ]  [ 📄 Relevé ]  [ ⚡ Demander Prêt ] |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  | MES COMPTES & PRODUITS                                     [Voir Tout >]|  |
|  | ----------------------------------------------------------------------- |  |
|  | [📦] Epargne Ordinaire (DAV)  N° 25121100A020022501     650 424 F.CFA   |  |
|  | [🔒] Nantissement Crédit CR-089                          100 000 F.CFA   |  |
|  | [🔄] Carnet Tontine Marché #883 (Jour 14/31)              14 000 F.CFA   |  |
|  | [📈] Dépôt à Terme (DAT 6.5% - Échéance 12/2026)      1 000 000 F.CFA   |  |
|  +-------------------------------------------------------------------------+  |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  | DERNIÈRES OPÉRATIONS                                       [Historique >|  |
|  | ----------------------------------------------------------------------- |  |
|  | [↓] Dépôt TMoney (90 12 34 56)      Aujourd'hui, 10:45    + 50 000 F   |  |
|  | [↑] Retrait Guichet Agence          Hier, 16:20           - 25 000 F   |  |
|  | [🔄] Cotisation Tontine Jour 14      18 Août 2026          +  1 000 F   |  |
|  | [💳] Échéance Prêt Mensualité #04    15 Août 2026          - 43 842 F   |  |
|  +-------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------+
```

---

### 5.2 Transaction History & Filtering Flow

#### Filter Criteria & Bottom Sheet Modal
- **Date Range**: Today, Last 7 Days, This Month, Last Quarter, Custom Range (Start/End Date Picker).
- **Account Filter**: All Accounts, Specific DAV, Tontine Carnet, DAT.
- **Transaction Type**: Deposits (`+`), Withdrawals (`-`), Tontine Cotisations, Loan Repayments, Mobile Money In/Out, Share Purchases.
- **Payment Method**: Cash Desk, TMoney, Flooz, Wave, MTN MoMo, Orange Money.
- **Search Query**: Instant debounce search on Reference Number, Receipt Number, Counterparty Name.

---

### 5.3 Account Statement Generation & Multi-Format Export

#### Certified PDF Relevé de Compte Specification
The PDF statement generated on device matches official BCEAO and UMOA microfinance standards:
1. **Header Block**:
   - Microfinance Legal Header: `COOPEC BANOLIA MICROFINANCE`
   - Regulatory Accreditation: `Agrément BCEAO/UMOA N° T/1/1420/SFD`
   - Agency Address, Phone, Email, City.
2. **Member & Account Information Box**:
   - Member Name & Code (`A0200225`), Manual Register # (`610`).
   - Account Number (`25121100A020022501`) & Product Title (`Épargne Ordinaire`).
   - Statement Period: `Du 01/08/2026 au 20/08/2026`.
3. **Financial Summary Box**:
   - Solde Initial (Opening Balance): `325 424 F.CFA`
   - Total Mouvements Crédit (+): `+ 350 000 F.CFA`
   - Total Mouvements Débit (-): `- 25 000 F.CFA`
   - Solde Final au 20/08/2026: `650 424 F.CFA`
   - Dont Solde Gelé (Nantissements): `100 000 F.CFA`
   - **Solde Disponible Net**: `550 424 F.CFA`
4. **Detailed Ledger Table**:
   - Columns: `Date | N° Pièce / Réf | Nature de l'Opération | Mode | Débit (-) | Crédit (+) | Solde Progressif`
5. **Security & Authentication Footer**:
   - Digital SHA-256 integrity hash.
   - Verification QR Code containing: `banolia://verify/statement?m=A0200225&acc=25121100A020022501&h=9a4f88`
   - Timestamp and notice: *"Ce relevé électronique certifié est conforme aux enregistrements du grand livre de la COOPEC BANOLIA."*

---

### 5.4 Micro-Loan Application Multi-Step Wizard Flow

```
+---------------------------------------------------------------------------------------------------+
|                            LOAN APPLICATION MULTI-STEP WIZARD                                     |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [ Step 1: Projet & Montant ] ────► [ Step 2: Situation Financière ] ────► [ Step 3: Garanties ]  |
|  - Montant demandé (Sliders)        - Revenu mensuel net déclaré            - Nantissement DAV    |
|  - Durée (3 à 24 mois)              - Charges mensuelles déclarées          - Biens gagés (Moto)  |
|  - Motif (Commerce/Agriculture)     - Autres crédits en cours               - Cautions solidaires |
|  - Mode d'amortissement                                                                           |
|                                                                                                   |
|                                                     │                                             |
|                                                     ▼                                             |
|  [ Step 5: Récapitulatif & Signature ] ◄──── [ Step 4: Pièces Justificatives ]                    |
|  - Tableau d'amortissement complet           - Scan Pièce d'Identité (CNI)                        |
|  - Vérification TEG & Taux d'usure           - Photo Étal / Local Commercial                      |
|  - Accord d'engagement sociétaire           - Accord signé de la caution                          |
|  - Soumission avec signature numérique                                                            |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```

---

## 6. Concrete Test Vectors & Verification Matrix

To verify the mathematical accuracy of the implementation independently, the following test vectors are pre-computed:

### Test Vector 1: Constant Annuity Commercial Micro-Loan
- **Principal ($C_0$)**: $1\ 000\ 000\text{ XOF}$
- **Nominal Annual Interest Rate ($T_{annuel}$)**: $9.5\%$
- **Duration**: 12 months ($n=12$, monthly payments $f=12$, $r = 0.095/12 = 0.00791667$)
- **Upfront Fees**: $1.5\%$ File Fee ($15\ 000\text{ XOF}$) + $0.5\%$ Insurance ($5\ 000\text{ XOF}$) = $20\ 000\text{ XOF}$
- **Net Disbursed**: $980\ 000\text{ XOF}$
- **Computed Fixed Monthly Installment ($A$)**: $87\ 684\text{ XOF}$
- **Total Interest**: $52\ 208\text{ XOF}$
- **Total Repayment ($C_0 + \text{Interest} + \text{Fees}$)**: $1\ 072\ 208\text{ XOF}$
- **Computed Annual TEG**: $13.48\%$
- **BCEAO Compliance Status**: `VALID` ($13.48\% \le 24.0\%$)

#### Installment Breakdown:
| Period $k$ | Due Date | Principal $P_k$ | Interest $I_k$ | Total $A_k$ | Remaining $C_k$ |
|---|---|---|---|---|---|
| **1** | M+1 | 79 767 F | 7 917 F | 87 684 F | 920 233 F |
| **2** | M+2 | 80 399 F | 7 285 F | 87 684 F | 839 834 F |
| **3** | M+3 | 81 035 F | 6 649 F | 87 684 F | 758 799 F |
| **4** | M+4 | 81 677 F | 6 007 F | 87 684 F | 677 122 F |
| **5** | M+5 | 82 323 F | 5 361 F | 87 684 F | 594 799 F |
| **6** | M+6 | 82 975 F | 4 709 F | 87 684 F | 511 824 F |
| **7** | M+7 | 83 632 F | 4 052 F | 87 684 F | 428 192 F |
| **8** | M+8 | 84 294 F | 3 390 F | 87 684 F | 343 898 F |
| **9** | M+9 | 84 961 F | 2 723 F | 87 684 F | 258 937 F |
| **10** | M+10 | 85 634 F | 2 050 F | 87 684 F | 173 303 F |
| **11** | M+11 | 86 312 F | 1 372 F | 87 684 F | 86 991 F |
| **12** | M+12 | 86 991 F | 688 F | 87 679 F | 0 F |
| **TOTAL** | | **1 000 000 F** | **52 203 F** | **1 052 203 F** | **0 F** |

---

### Test Vector 2: Constant Principal Agricultural Asset Loan
- **Principal ($C_0$)**: $600\ 000\text{ XOF}$
- **Nominal Annual Interest Rate**: $12.0\%$
- **Duration**: 6 months ($n=6$, monthly payments, $r = 0.01$)
- **Base Principal per month**: $100\ 000\text{ XOF}$
- **Installment Schedule**:
  - Period 1: $P_1 = 100\ 000$, $I_1 = 600\ 000 \times 0.01 = 6\ 000 \implies A_1 = 106\ 000\text{ XOF}$, Remaining: $500\ 000$
  - Period 2: $P_2 = 100\ 000$, $I_2 = 500\ 000 \times 0.01 = 5\ 000 \implies A_2 = 105\ 000\text{ XOF}$, Remaining: $400\ 000$
  - Period 3: $P_3 = 100\ 000$, $I_3 = 400\ 000 \times 0.01 = 4\ 000 \implies A_3 = 104\ 000\text{ XOF}$, Remaining: $300\ 000$
  - Period 4: $P_4 = 100\ 000$, $I_4 = 300\ 000 \times 0.01 = 3\ 000 \implies A_4 = 103\ 000\text{ XOF}$, Remaining: $200\ 000$
  - Period 5: $P_5 = 100\ 000$, $I_5 = 200\ 000 \times 0.01 = 2\ 000 \implies A_5 = 102\ 000\text{ XOF}$, Remaining: $100\ 000$
  - Period 6: $P_6 = 100\ 000$, $I_6 = 100\ 000 \times 0.01 = 1\ 000 \implies A_6 = 101\ 000\text{ XOF}$, Remaining: $0$
- **Total Interest**: $21\ 000\text{ XOF}$
- **Total Principal Repaid**: $600\ 000\text{ XOF}$

---

### Test Vector 3: Usury Rate Violation Check
- **Principal**: $500\ 000\text{ XOF}$
- **Nominal Annual Interest Rate**: $28.0\%$ (Exceeds 24.0% SFD usury cap)
- **Expected Outcome**: `SimulateMicroLoan` returns `Left(UsuryRateExceededFailure)` with message *"Le taux effectif global (TEG) de 28.00% dépasse le taux d'usure réglementaire BCEAO fixé à 24.00%."*

---

## 7. Synthesis & Recommendations for Implementation

1. **Strict Value Object Typing**:
   Implement the `Money` value object across all Dart models in `banolia-mobile/lib/core/value_objects/money.dart`. Never pass raw unconstrained `double` for currency amounts.
2. **State Management Protocol**:
   Use `flutter_bloc` with separate Cubits for lightweight feature state (e.g. `BalanceCubit`, `StatementCubit`, `LoanSimulatorCubit`) and full BLoCs with event queuing for multi-step transactional flows (e.g. `TransactionBloc`, `LoanApplicationBloc`).
3. **Integration Alignment**:
   - The `Account` model and `TripleBalance` entity defined above directly feed into Explorer 2's Mobile Money deposit and withdrawal use cases.
   - The transaction entity integrates with Explorer 3's thermal receipt printing model for on-demand 58mm mini-receipt reprints from the mobile history view.
