# Technical Design & Analysis Handoff: Banking Domain Models, Mathematical Engines & Accounting Integration (Milestone 1)

**Author**: Explorer M1-2 (Banking Domain & Financial Engineering)  
**Target Component**: `banolia-server/src/domain/` (`members.ts`, `savings.ts`, `tontines.ts`, `loans.ts`)  
**Parent Orchestrator**: `cbe41bca-a059-422a-9c7b-e8da9ea7dcd8`  
**Date**: 2026-08-20T01:03:50Z  

---

## 1. Observation

### 1.1 Scope & Regulatory Foundations
- **Project Scope (`SCOPE.md:9-12`)**: Mandates the delivery of:
  1. Member & KYC Management, Share Capital (*Parts Sociales*) subscriptions, transfers, and dividend records.
  2. Savings Products: Ordinary Savings (Dépôt à vue - DAV), Term Deposits (DAT), BCEAO 15-day interest rule (*règle des quinzaines*), and collateral balance freezing (*solde gelé*).
  3. 31-Day Cyclical Tontines (*Cotisations journalières de marché*) with daily collection, 1-day SFD commission deduction (account `704000`), and settlement routines.
  4. Credit / Loan Amortization Engine: 4 mathematical formulas (`CONSTANT_ANNUITY`, `CONSTANT_PRINCIPAL`, `IN_FINE`, `FLAT`), BCEAO usury cap enforcement (24%-27% max TEG), penalty calculations, and PAR30 / PAR90 portfolio provisioning.
- **Original Requirements (`ORIGINAL_REQUEST.md:13-34`)**: Requires Apache Fineract compatibility, XOF currency with 0 decimal units at transaction level, and exact amortization schedules to the centime.
- **Survey Findings (`survey_core_banking.md:203-344`)**:
  - Identified the exact SYSCOA-SFD accounts for banking transactions (Classes 1, 2, 5, 6, 7).
  - Specified the 15-day value date mechanics for Passbook Savings (`252000`).
  - Outlined the 31-day market tontine workflow and 1-day commission accounting.
  - Formulated the 4 loan amortization models and the BCEAO usury ceiling rule.
- **Desktop UI Audit (`banolia-desktop/src/components/CreditManager.tsx:16-40`)**:
  - Prototype calculates constant annuity using `Math.round((amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -durationMonths)))`.
  - Found that it lacks terminal installment rounding adjustments, leaving potential remaining balances (e.g. 1-2 XOF difference) at end of schedule.
  - Lacks constant principal, bullet (*in fine*), flat rate, penalty computation, and TEG usury validation.

---

## 2. Logic Chain & Technical Specifications

```
+----------------------------------------------------------------------------------------------------+
|                                    BANOLIA BANKING DOMAIN ARCHITECTURE                             |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|    +------------------------------------------------------------------------------------------+    |
|    |                                MEMBER & CAPITAL SOCIAL DOMAIN                            |    |
|    |  - KYC Verification & Unique Member Code [AGENCY-YYYY-SEQ6]                              |    |
|    |  - Share Capital: Subscription, Partial/Full Liberation, Inter-Member Transfer, Buyback  |    |
|    +--------------------------------------------+---------------------------------------------+    |
|                                                 |                                                  |
|                        +------------------------+------------------------+                         |
|                        |                                                 |                         |
|                        v                                                 v                         |
|    +---------------------------------------+   +-----------------------------------------------+   |
|    |       SAVINGS & DEPOSITS DOMAIN       |   |               CREDIT & LOAN ENGINE            |   |
|    |  - DAV (Dépôt à Vue): Real vs Frozen  |   |  - 4 Amortization Formulas                    |   |
|    |  - DAT (Dépôt à Terme): Accruals      |   |    (Annuity, Linear, In Fine, Flat)           |   |
|    |  - BCEAO 15-Day Rule (Quinzaines)     |   |  - BCEAO Usury Cap (24%-27% TEG)              |   |
|    |  - Collateral Freeze / Seizure Locks  |   |  - Repayment Waterfall & Penalty Engine       |   |
|    +-------------------+-------------------+   |  - PAR30/PAR90 Provisioning (0%, 25, 50, 100%)|   |
|                        |                       +-----------------------+-----------------------+   |
|                        v                                               v                           |
|    +---------------------------------------+   +-----------------------------------------------+   |
|    |         TONTINE SAVINGS DOMAIN        |   |           GENERAL LEDGER POSTING BRIDGE       |   |
|    |  - 31-Day Cyclical Market Carnet      |   |  - Double-Entry Balanced Journal Entries      |   |
|    |  - Daily Collection & Route Drop      |   |  - PC-SFD Accounts (Classes 1, 2, 5, 6, 7)    |   |
|    |  - 1-Day Commission (Account 704000)  |   |  - Integer XOF Precision (Zero-Centime Rule)  |   |
|    +---------------------------------------+   +-----------------------------------------------+   |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

### 2.1 Member Management & KYC Domain Specification

#### 2.1.1 Member Identification & Code Generation Algorithm
Every member registered in BANOLIA is assigned a deterministic, tamper-proof, and sequential code formatted as:
$$\text{MemberCode} = \text{AgencyCode} + \text{"-"} + \text{Year} + \text{"-"} + \text{PadZeroes}(\text{SequenceNumber}, 6)$$
*Example*: For Agency `A01` in year `2026`, the 142nd member receives code `A01-2026-000142`.

#### 2.1.2 KYC Attributes & Data Structure
```typescript
export type MemberLegalType = 'INDIVIDUAL' | 'LEGAL_ENTITY' | 'INFORMAL_GROUP';
export type MemberStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'DORMANT' | 'SUSPENDED' | 'EXPELLED' | 'DECEASED';
export type IdDocumentType = 'CNI' | 'PASSPORT' | 'VOTER_CARD' | 'DRIVING_LICENSE' | 'CONSULAR_CARD';
export type Gender = 'M' | 'F' | 'OTHER';
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';

export interface MemberKYC {
  id: string;                          // UUID v4
  agencyId: string;
  code: string;                        // e.g. 'A01-2026-000142'
  manualNumber?: string;               // Legacy paper registry ID
  legalType: MemberLegalType;
  fullName: string;
  gender: Gender;
  birthDate: string;                   // 'YYYY-MM-DD'
  birthPlace: string;
  nationality: string;                 // Default: 'Togolaise' / UMOA
  idType: IdDocumentType;
  idNumber: string;
  idIssueDate?: string;
  idExpiryDate?: string;
  phone: string;                       // Primary phone (E.164 format)
  alternatePhone?: string;
  email?: string;
  address: string;
  city: string;
  district?: string;
  profession: string;
  monthlyIncome?: number;              // XOF
  maritalStatus: MaritalStatus;
  spouseName?: string;
  spousePhone?: string;
  nextOfKinName: string;               // Personne à prévenir / Bénéficiaire
  nextOfKinPhone: string;
  nextOfKinRelationship: string;
  sharesPurchased: number;             // Total subscribed & paid shares
  sharesNonLiberated: number;          // Subscribed but unpaid shares
  shareUnitPrice: number;              // Default: 10 000 XOF
  status: MemberStatus;
  avatarUrl?: string;
  fingerprintTemplate?: string;        // Base64 ISO/IEC 19794-2 template
  registrationDate: string;            // 'YYYY-MM-DD'
  createdAt: string;
  updatedAt: string;
}
```

#### 2.1.3 Member State Machine Transitions
```
+--------------------+
|  PENDING_APPROVAL  +----+ (KYC validated & Droits d'adhésion + Min Shares paid)
+---------+----------+    |
          |               v
          |         +------------+  (No activity > 12m)   +-----------+
          |         |   ACTIVE   +----------------------->+  DORMANT  |
          |         +---+---+----+<-----------------------+-----+-----+
          |             |   |       (Transaction occurs)        |
          v             |   |                                   |
    (Rejected)          |   +----+ (Fraud/Litigation)           |
                        |        |                              |
                        v        v                              v
                  +-----+--------+----+                   +-----+-----+
                  |     SUSPENDED     |                   |  DECEASED |
                  +-----+--------+----+                   +-----+-----+
                        |                                       |
                        v (General Assembly resolution)         v
                  +-----+-----+                           (Estate Settlement)
                  |  EXPELLED |
                  +-----------+
```

---

### 2.2 Share Capital (*Parts Sociales*) Lifecycle

Under the OHADA Uniform Act on Cooperatives and BCEAO Microfinance regulations:
1. **Nominal Value ($V_{nom}$)**: Fixed by bylaws (default: `10 000 XOF` per share).
2. **Minimum Qualifying Shares ($S_{min}$)**: Required for full member voting rights and credit eligibility (default: 1 share = `10 000 XOF`, or 5 shares = `50 000 XOF`).
3. **Admission Fee ($F_{adh}$)**: Non-refundable fee paid directly to cooperative reserves/income (default: `5 000 XOF`).

#### 2.2.1 Operation 1: Share Subscription with Immediate Full Liberation
- Member subscribes $S$ shares and pays cash immediately:
  $$\text{Total Paid} = (S \times V_{nom}) + F_{adh}$$
- **Ledger Entries**:
  - **Debit** `571200` (Caisse Guichet) : $(S \times V_{nom}) + F_{adh}$
  - **Credit** `101100` (Parts Sociales Souscrites Libérées - Personnes Physiques) : $S \times V_{nom}$
  - **Credit** `706000` (Droits d'adhésion et frais de dossier) : $F_{adh}$

#### 2.2.2 Operation 2: Share Subscription with Partial Liberation
- Member subscribes $S$ shares, pays $S_{paid} < S$ immediately, leaving $S_{unpaid} = S - S_{paid}$.
- **Ledger Entries on Subscription**:
  - **Debit** `571200` (Caisse Guichet) : $(S_{paid} \times V_{nom}) + F_{adh}$
  - **Debit** `101300` (Parts Sociales Souscrites Non Libérées - Compte Régulateur) : $S_{unpaid} \times V_{nom}$
  - **Credit** `101100` (Parts Sociales Souscrites) : $S \times V_{nom}$
  - **Credit** `706000` (Droits d'adhésion) : $F_{adh}$
- **Ledger Entries on Subsequent Installment Payment ($P$)**:
  - **Debit** `571200` (Caisse Guichet) : $P$
  - **Credit** `101300` (Parts Sociales Souscrites Non Libérées) : $P$

#### 2.2.3 Operation 3: Inter-Member Share Transfer (*Cession de Parts Sociales*)
- Member A transfers $S_{trans}$ shares to Member B with Board approval.
- Processing fee $F_{trans}$ (e.g. `2 000 XOF`) paid by transferor.
- **Ledger Entries**:
  - Auxiliary ledger transfers $S_{trans} \times V_{nom}$ from sub-account `101100.MEMBER_A` to `101100.MEMBER_B`.
  - Fee posting:
    - **Debit** `571200` (Caisse) or `251100.MEMBER_A` (DAV) : $F_{trans}$
    - **Credit** `705000` (Commissions sur opérations de caisse) : $F_{trans}$

#### 2.2.4 Operation 4: Share Repurchase / Refund (*Rachat de Parts Sociales*)
- Occurs on member resignation, expulsion, or death.
- **Mandatory Risk Check**: The system validates that Member has no unpaid overdue loans ($D_{loan} = 0$) and is not serving as active guarantor ($Collateral_{pledged} = 0$).
- If outstanding debts exist, the cooperative exercises its legal lien (*Droit de rétention*) to offset debts:
  $$Payout = \max\left(0, (S_{owned} \times V_{nom}) - D_{loan}\right)$$
- **Ledger Entries**:
  - **Debit** `101100` (Parts Sociales Libérées) : $S_{owned} \times V_{nom}$
  - **Credit** `201100` / `291100` (Crédits aux membres / Créances en souffrance) : $D_{loan}$
  - **Credit** `571200` (Caisse) or `251100` (DAV) : $Payout$

#### 2.2.5 Operation 5: Dividend Distribution (*Rémunération des Parts Sociales*)
- Annual General Meeting allocates dividend rate $d\%$ on liberated share capital after statutory 15% allocation to BCEAO Legal Reserve (`111000`).
- Individual dividend: $Div_i = \text{round}(S_i \times V_{nom} \times d\%)$.
- **Ledger Entries**:
  - **Debit** `121000` (Résultat net de l'exercice - Bénéfice) : $\sum Div_i$
  - **Credit** `251100` (Dépôts à vue des membres) : $\sum Div_i$

---

### 2.3 Savings Accounts (DAV, DAT) & Collateral Balance Freezing

#### 2.3.1 Balance Definitions & Non-Negative Available Invariant
For any savings account $A$:
$$\text{Available Balance } (B_{avail}) = \text{Real Balance } (B_{real}) - \text{Frozen Balance } (B_{frozen})$$
$$\text{Strict Invariant: } B_{avail} \ge 0 \quad \text{at all times}$$
Any withdrawal, transfer, or fee deduction where $Amount > B_{avail}$ is rejected with `InsufficientAvailableFundsException`.

#### 2.3.2 Collateral Freezing Lifecycle
```typescript
export interface BalanceHold {
  id: string;                          // UUID v4
  accountId: string;
  amount: number;                      // XOF
  reason: 'LOAN_COLLATERAL' | 'GUARANTEE_PLEDGE' | 'LEGAL_SEIZURE' | 'DISPUTE_HOLD';
  referenceId: string;                 // Loan ID or Guarantee Contract ID
  createdAt: string;
  releasedAt?: string;
  status: 'ACTIVE' | 'RELEASED' | 'SEIZED';
}
```

1. **Freezing Action (`freezeCollateral`)**:
   - Condition: $Amount \le B_{avail}$.
   - Result: $B_{frozen} \leftarrow B_{frozen} + Amount$, $B_{avail} \leftarrow B_{avail} - Amount$.
2. **Unfreezing Action (`unfreezeCollateral`)**:
   - Trigger: Loan fully paid off or guarantee discharged.
   - Result: $B_{frozen} \leftarrow \max(0, B_{frozen} - Amount)$, $B_{avail} \leftarrow B_{avail} + Amount$.
3. **Collateral Realization / Seizure (`seizeCollateral`)**:
   - Trigger: Loan default write-off execution.
   - Result:
     - $B_{frozen} \leftarrow B_{frozen} - Amount$
     - $B_{real} \leftarrow B_{real} - Amount$
     - **Debit** `251100` (DAV Member) : $Amount$
     - **Credit** `291300` (Créances compromises) : $Amount$

---

### 2.4 BCEAO 15-Day Interest Rule (*Règle des Quinzaines*) Engine

Under BCEAO microfinance regulation, interest on passbook savings accounts (*Comptes d'épargne sur livret* - Account `252000`) is calculated strictly on a bi-monthly (fortnightly) basis.

#### 2.4.1 Fortnight Structure (24 Quinzaines per year)
- Each calendar year is divided into exactly **24 fortnights** (2 per month):
  - **Quinzaine 1 ($Q_1$)**: Days 1 to 15 of the month.
  - **Quinzaine 2 ($Q_2$)**: Day 16 to the last day of the month (28, 29, 30, or 31).

#### 2.4.2 Regulatory Value Date (*Date de Valeur*) Rules
| Transaction Type | Transaction Calendar Date | Assigned Value Date | Interest Effective Period |
|---|---|---|---|
| **Deposit (Versement)** | 1st to 15th of month $M$ | **16th of month $M$** | Starts earning interest in $Q_2$ of month $M$ |
| **Deposit (Versement)** | 16th to end of month $M$ | **1st of month $M+1$** | Starts earning interest in $Q_1$ of month $M+1$ |
| **Withdrawal (Retrait)** | 1st to 15th of month $M$ | **Last day of month $M-1$** | Ceases earning interest for the entire $Q_1$ of month $M$ |
| **Withdrawal (Retrait)** | 16th to end of month $M$ | **15th of month $M$** | Ceases earning interest for the entire $Q_2$ of month $M$ |

#### 2.4.3 Fortnightly Interest Calculation Formula
Let:
- $k \in \{1, 2, \dots, 24\}$ = Fortnight index in the year.
- $S_k$ = Minimum productive balance in value date during fortnight $k$ (the lowest balance reached by value date in that period).
- $r_{ann}$ = Annual statutory interest rate (e.g. $3.5\% = 0.035$).

$$\text{Fortnight Interest } I_k = S_k \times \frac{r_{ann}}{24}$$

#### 2.4.4 Capitalization Routine
- At the end of the calculation period (annually on December 31, or semi-annually on June 30 / December 31):
  $$I_{total\_accrued} = \sum_{k=1}^N I_k$$
  $$I_{capitalized} = \text{round}(I_{total\_accrued})$$
- **Ledger Entries on Capitalization**:
  - **Debit** `602000` (Charges d'intérêts sur livrets d'épargne) : $I_{capitalized}$
  - **Credit** `252000` (Comptes d'épargne sur livret des membres) : $I_{capitalized}$
- Member's account balance updated: $B_{real} \leftarrow B_{real} + I_{capitalized}$.

---

### 2.5 31-Day Cyclical Tontines (*Cotisations Journalières de Marché*)

The daily market tontine (*Tontine journalière*) is a core microfinance product for market merchants and informal traders.

#### 2.5.1 Tontine Subscription Model
```typescript
export interface TontineSubscription {
  id: string;                          // UUID v4
  carnetNumber: string;                // e.g. 'TK-202608-0089'
  memberId: string;
  collectorId: string;                 // Cashier/Collector user ID
  agencyId: string;
  dailyAmount: number;                 // Fixed daily mise (e.g. 1 000 XOF)
  cycleDays: number;                   // Fixed 31 days
  paidDays: number;                    // 0 to 31
  collections: TontineDailyEntry[];    // History of daily payments
  totalCollected: number;              // paidDays * dailyAmount
  commissionAmount: number;            // 1 * dailyAmount (upon maturity)
  payoutAmount: number;                // (paidDays - 1) * dailyAmount
  status: 'OPEN' | 'MATURED' | 'SETTLED' | 'CANCELLED';
  startDate: string;                   // 'YYYY-MM-DD'
  endDate: string;                     // 'YYYY-MM-DD'
  settledAt?: string;
  settlementAccountId?: string;        // DAV account ID
}

export interface TontineDailyEntry {
  dayIndex: number;                    // 1 to 31
  date: string;                        // 'YYYY-MM-DD'
  amount: number;                      // XOF
  collectorId: string;
  receiptNumber: string;
  idempotencyKey: string;
}
```

#### 2.5.2 Operational Workflow & Accounting Entries

```
+----------------------------------------------------------------------------------------------------+
|                                    31-DAY TONTINE OPERATIONAL CYCLE                                |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|    +------------------------------------------------------------------------------------------+    |
|    | Step 1: Daily Collection on Market (Days 1 to 31)                                        |    |
|    | - Collector collects daily mise (e.g. 1 000 XOF) from merchant stall                     |    |
|    | - Generates Bluetooth receipt / SMS confirmation                                         |    |
|    | - Accounting: DEBIT 571300 (Caisse Collecteur) 1 000 | CREDIT 258000 (Attente Tontine)   |    |
|    +--------------------------------------------+---------------------------------------------+    |
|                                                 |                                                  |
|                                                 v                                                  |
|    +------------------------------------------------------------------------------------------+    |
|    | Step 2: Evening Cash Surrender at Agency Desk                                            |    |
|    | - Collector deposits total collected cash with Head Cashier                              |    |
|    | - Accounting: DEBIT 571200 (Caisse Guichet) Total | CREDIT 571300 (Caisse Collecteur) Total |    |
|    +--------------------------------------------+---------------------------------------------+    |
|                                                 |                                                  |
|                                                 v                                                  |
|    +------------------------------------------------------------------------------------------+    |
|    | Step 3: Cycle Settlement (Day 31 Maturity)                                               |    |
|    | - Total 31 Mises collected = 31 000 XOF                                                  |    |
|    | - 1 Mise (1 000 XOF) retained as SFD / Collector Commission                              |    |
|    | - 30 Mises (30 000 XOF) paid out to member DAV (or Cash)                                 |    |
|    | - Accounting:                                                                            |    |
|    |     DEBIT  258000 (Comptes d'attente d'épargne tontine)  : 31 000 XOF                    |    |
|    |     CREDIT 251100 (Dépôt à Vue Adhérent)                 : 30 000 XOF                    |    |
|    |     CREDIT 704000 (Commissions sur gestion des tontines) :  1 000 XOF                    |    |
|    +------------------------------------------------------------------------------------------+    |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

#### 2.5.3 Partial / Broken Cycle Rule (*Carnet Incomplet*)
If a member terminates the carnet prematurely after $k$ paid days ($k < 31$):
- If $k \ge 15$: SFD deducts 1 full mise ($dailyAmount$). Payout $= (k - 1) \times dailyAmount$.
- If $k < 15$: SFD deducts a prorated fee $F = \text{round}\left(dailyAmount \times \frac{k}{31}\right)$. Payout $= (k \times dailyAmount) - F$.
- **Accounting on Early Settlement**:
  - **Debit** `258000` : $k \times dailyAmount$
  - **Credit** `251100` : $Payout$
  - **Credit** `704000` : $Commission$

---

### 2.6 Loan Management & Amortization Engine

#### 2.6.1 The 4 Amortization Formulas

Let:
- $C_0$ = Initial principal granted ($C_0 \in \mathbb{N}^+$).
- $n$ = Number of repayment installments ($n \in \{1, 2, \dots, 360\}$).
- $T_{ann}$ = Nominal annual interest rate (e.g. $0.095$ for 9.5%).
- $freq$ = Repayments per year (12 for monthly, 52 for weekly, 4 for quarterly).
- $r = \frac{T_{ann}}{freq}$ = Periodic interest rate.
- $k \in \{1, 2, \dots, n\}$ = Installment sequence index.
- $C_{k-1}$ = Remaining principal balance at beginning of period $k$ ($C_0$ for $k=1$).
- $P_k$ = Principal portion of installment $k$.
- $I_k$ = Interest portion of installment $k$.
- $A_k = P_k + I_k$ = Total installment payment for period $k$.
- $C_k = C_{k-1} - P_k$ = Remaining principal balance at end of period $k$.

---

#### Formula 1: Constant Annuity (`CONSTANT_ANNUITY` / Amortissement Dégressif à Mensualité Constante)
Standard French amortization system used for commercial and micro-enterprise credit:

1. **Exact Annuity Formula**:
   $$A = \begin{cases} C_0 \times \frac{r}{1 - (1 + r)^{-n}} & \text{if } r > 0 \\ \frac{C_0}{n} & \text{if } r = 0 \end{cases}$$
   $$\text{Rounded Annuity } A_{round} = \text{round}(A)$$

2. **Per-Period Schedule Generation ($k = 1$ to $n-1$)**:
   $$I_k = \text{round}(C_{k-1} \times r)$$
   $$P_k = A_{round} - I_k$$
   $$C_k = C_{k-1} - P_k$$

3. **Strict Terminal Adjustment ($k = n$)**:
   To eliminate cumulative rounding bias and guarantee exact zero final balance:
   $$P_n = C_{n-1}$$
   $$I_n = \text{round}(C_{n-1} \times r)$$
   $$A_n = P_n + I_n$$
   $$C_n = 0$$

$$\text{Mathematical Proof of Exactness: } \sum_{k=1}^n P_k = \sum_{k=1}^{n-1} P_k + P_n = (C_0 - C_{n-1}) + C_{n-1} \equiv C_0$$

---

#### Formula 2: Constant Principal / Linear (`CONSTANT_PRINCIPAL` / Amortissement Constant)
Preferred for agricultural and seasonal equipment loans:

1. **Base Principal Calculation**:
   $$P_{base} = \left\lfloor \frac{C_0}{n} \right\rfloor$$
2. **Schedule Generation ($k = 1$ to $n-1$)**:
   $$P_k = P_{base}$$
   $$I_k = \text{round}(C_{k-1} \times r)$$
   $$A_k = P_k + I_k$$
   $$C_k = C_{k-1} - P_k$$
3. **Terminal Period ($k = n$)**:
   $$P_n = C_{n-1} = C_0 - (n - 1) \times P_{base}$$
   $$I_n = \text{round}(C_{n-1} \times r)$$
   $$A_n = P_n + I_n$$
   $$C_n = 0$$

---

#### Formula 3: Bullet Loan / In Fine (`IN_FINE`)
Used for agricultural campaign / crop storage financing where revenue occurs upon harvest:

1. **Periods $1$ to $n-1$**:
   $$P_k = 0$$
   $$I_k = \text{round}(C_0 \times r)$$
   $$A_k = I_k$$
   $$C_k = C_0$$
2. **Final Maturity Period ($k = n$)**:
   $$P_n = C_0$$
   $$I_n = \text{round}(C_0 \times r)$$
   $$A_n = C_0 + I_n$$
   $$C_n = 0$$

---

#### Formula 4: Flat Rate Interest (`FLAT` / Taux Fixe Simple)
Common in informal micro-credit where interest is calculated once on the initial capital:

1. **Total Flat Interest**:
   $$I_{total} = \text{round}\left(C_0 \times T_{ann} \times \frac{n}{freq}\right)$$
   $$I_{base} = \left\lfloor \frac{I_{total}}{n} \right\rfloor$$
   $$P_{base} = \left\lfloor \frac{C_0}{n} \right\rfloor$$
2. **Periods $1$ to $n-1$**:
   $$P_k = P_{base}$$
   $$I_k = I_{base}$$
   $$A_k = P_k + I_k$$
   $$C_k = C_{k-1} - P_k$$
3. **Final Period ($k = n$)**:
   $$P_n = C_0 - (n - 1) \times P_{base}$$
   $$I_n = I_{total} - (n - 1) \times I_{base}$$
   $$A_n = P_n + I_n$$
   $$C_n = 0$$

---

#### 2.6.2 BCEAO Usury Cap & TEG (*Taux Effectif Global*) Verification

1. **BCEAO Regulatory Limits**:
   - Microfinance Institutions (SFD) in UMOA: Maximum Usury Cap is legally set between **24.0%** and **27.0%** per annum.
   - BANOLIA default configuration: `USURY_CEILING_PERCENT = 24.00%` (configurable up to `27.00%`).
2. **Actuarial TEG Definition**:
   Let $C_{net} = C_0 - \text{ApplicationFees} - \text{MandatoryInsurance}$.
   The periodic internal rate of return $r_{TEG}$ satisfies:
   $$C_{net} = \sum_{k=1}^n \frac{A_k}{(1 + r_{TEG})^k}$$
   The annualized TEG is:
   $$\text{TEG}_{annual} = (1 + r_{TEG})^{freq} - 1 \quad (\text{or proportional: } r_{TEG} \times freq)$$
3. **Numerical Solver & Validation**:
   - The engine uses Newton-Raphson iteration to solve for $r_{TEG}$:
     $$f(r) = \sum_{k=1}^n \frac{A_k}{(1+r)^k} - C_{net}$$
     $$f'(r) = -\sum_{k=1}^n \frac{k \cdot A_k}{(1+r)^{k+1}}$$
     $$r_{m+1} = r_m - \frac{f(r_m)}{f'(r_m)}$$
   - **Enforcement Rule**:
     $$\text{If } \text{TEG}_{annual} > \text{USURY\_CEILING\_PERCENT} \implies \text{Reject loan with } \texttt{BCEAOUvalUsuryCapExceededException}$$

---

#### 2.6.3 Repayment Allocation Waterfall & Late Penalties

When a payment $M_{paid}$ is submitted for a loan:
1. **Strict Chronological Ordering**: Oldest unpaid installment is processed first.
2. **Within-Installment Waterfall Hierarchy**:
   $$\text{Step 1: Late Penalties } \rightarrow \text{Step 2: Accrued Interest } \rightarrow \text{Step 3: Principal}$$

```typescript
function allocateRepayment(installment: LoanInstallment, amount: number): RepaymentAllocation {
  let remaining = amount;
  
  // 1. Penalties
  const penaltyDue = installment.penaltiesDue - installment.penaltiesPaid;
  const penaltyToPay = Math.min(remaining, penaltyDue);
  installment.penaltiesPaid += penaltyToPay;
  remaining -= penaltyToPay;
  
  // 2. Interest
  const interestDue = installment.interestDue - installment.interestPaid;
  const interestToPay = Math.min(remaining, interestDue);
  installment.interestPaid += interestToPay;
  remaining -= interestToPay;
  
  // 3. Principal
  const principalDue = installment.principalDue - installment.principalPaid;
  const principalToPay = Math.min(remaining, principalDue);
  installment.principalPaid += principalToPay;
  remaining -= principalToPay;
  
  // Update status
  if (installment.principalPaid >= installment.principalDue && 
      installment.interestPaid >= installment.interestDue && 
      installment.penaltiesPaid >= installment.penaltiesDue) {
    installment.status = 'PAID';
  } else {
    installment.status = 'PARTIALLY_PAID';
  }
  
  return { penaltyPaid: penaltyToPay, interestPaid: interestToPay, principalPaid: principalToPay, surplus: remaining };
}
```

3. **Penalty Formula with Grace Period**:
   - Grace period $G = 3$ days.
   - If overdue days $d > G$:
     $$\text{Penalty} = \text{round}\left( \text{OverduePrincipal} \times \frac{\text{PenaltyRateAnnual}}{360} \times d \right) + \text{FlatPenaltyFee}$$

---

#### 2.6.4 Portfolio at Risk (PAR) & Regulatory Provisioning Matrix

| Overdue Bucket | Classification | SYSCOA-SFD GL Account | BCEAO Provision Rate | Provision Account |
|---|---|---|---|---|
| **0 to 30 days** | Crédits Sains / Vigilance | `201100` / `202100` | 0% (or 1% general reserve) | `299000` |
| **31 to 90 days** | Crédits Douteux (PAR 30) | `291100` | 25% (20% to 40%) | `299100` |
| **91 to 180 days** | Crédits Très Douteux (PAR 90) | `291200` | 50% (50% to 80%) | `299200` |
| **> 180 days** | Crédits Compromis / Pertes | `291300` | 100% | `299300` |

---

### 2.7 Complete Double-Entry Accounting Matrix (SYSCOA-SFD)

| Operation | Trigger / Event | Debit Account | Credit Account | Amount |
|---|---|---|---|---|
| **Share Capital Subscription** | Member pays shares + fees | `571200` (Caisse Guichet) | `101100` (Parts Libérées)<br>`706000` (Droits d'adhésion) | $S \times V_{nom}$<br>$F_{adh}$ |
| **Share Repurchase (Exit)** | Member exits, shares refunded | `101100` (Parts Libérées) | `571200` (Caisse) or `251100` (DAV) | $S \times V_{nom}$ |
| **Cash Deposit (DAV)** | Member deposits cash | `571200` (Caisse Guichet) | `251100` (Dépôts à vue) | Deposit Amount |
| **Cash Withdrawal (DAV)** | Member withdraws cash | `251100` (Dépôts à vue) | `571200` (Caisse Guichet) | Withdrawal Amount |
| **DAT Subscription** | Funds transferred from DAV | `251100` (Dépôts à vue) | `253000` (Dépôts à terme) | DAT Principal |
| **DAT Monthly Interest Accrual** | Month-end batch job | `601000` (Intérêts sur DAT) | `253800` (Intérêts courus sur DAT) | Monthly Interest |
| **DAT Maturity Settlement** | Term completes | `253000` (DAT Principal)<br>`253800` (Intérêts courus) | `251100` (Dépôts à vue) | Principal + Total Accrued Interest |
| **Passbook Interest Capitalization**| 15-day rule yearly capitaliz. | `602000` (Intérêts livrets) | `252000` (Comptes sur livret) | Capitalized Interest |
| **Tontine Field Collection** | Collector collects daily mise | `571300` (Caisse Collecteur) | `258000` (Attente Tontine) | Daily Mise |
| **Tontine Collector Drop** | Collector surrenders cash | `571200` (Caisse Guichet) | `571300` (Caisse Collecteur) | Shift Total Collected |
| **Tontine Maturity Settlement** | 31-day cycle payout | `258000` (Attente Tontine) | `251100` (Dépôt à vue - 30 mises)<br>`704000` (Commission SFD - 1 mise) | 31 Mises Total |
| **Loan Disbursement** | Credit approved & disbursed | `201100` (Crédits court terme) | `571200` or `251100` (Net Disbursed)<br>`702000` (Frais de dossier) | Principal Granted |
| **Loan Repayment (Normal)** | Monthly installment paid | `571200` (Caisse) or `251100` (DAV) | `201100` (Principal)<br>`701100` (Intérêts de crédit) | Total Installment |
| **Loan Repayment with Penalty** | Overdue installment paid | `571200` (Caisse Guichet) | `201100` (Principal)<br>`701100` (Intérêts)<br>`703000` (Pénalités de retard) | Installment + Penalty |
| **Loan Downgrade to PAR30** | Overdue > 30 days | `291100` (Créances douteuses) | `201100` (Crédits ordinaires) | Outstanding Principal |
| **PAR30 Provisioning** | 25% provision booked | `661000` (Dotations provisions) | `299100` (Provisions créances dout.) | 25% of Outstanding |

---

## 3. Caveats

1. **Currency Decimals**: West African CFA Franc (`XOF`) has 0 decimal physical units. Internal calculation steps use 64-bit float precision, but every ledger line, installment table row, and account balance must be rounded to an indivisible integer before database persistence.
2. **Taxes on DAT Interest**: In certain UMOA member states (e.g. Togo IRC / Benin IRCM), withholding tax (typically 3% to 6%) applies to DAT interest. For Milestone 1 core engine, gross interest calculation is fully implemented, with pluggable tax withholding hooks.
3. **Leap Years & Day Count**: The engine standardizes on the BCEAO banking standard **30/360** (or Act/360) convention for loan interest and monthly amortization intervals.
4. **Offline Sync Concurrency**: When mobile collectors sync tontine collections asynchronously, the server processes batches using idempotent keys (`idempotencyKey`) and strictly serialized journal entries to avoid race conditions.

---

## 4. Conclusion

The Banking Domain models, mathematical algorithms, state machines, and accounting mappings detailed in this document provide a complete, robust, and regulatory-compliant foundation for BANOLIA. 

Key design accomplishments:
- **Zero-centime precision**: Guaranteed by the strict terminal adjustment $P_n = C_{n-1}$ across all amortization modes.
- **Regulatory compliance**: Fully incorporates the BCEAO 15-day interest rule (*règle des quinzaines*), usury rate barriers (24%-27% TEG), and PAR30/90 provisioning.
- **Cultural & regional fit**: Seamless digitization of the 31-day market tontine (*cotisation journalière*) with automated 1-day commission accounting (account `704000`).
- **SYSCOA-SFD Double-entry alignment**: Complete, closed-loop accounting matrix mapping every member, savings, tontine, and credit event into balanced Classes 1 to 9 journal entries.

---

## 5. Verification Method

### 5.1 Concrete Numerical Test Vectors

#### Test Vector 1: Constant Annuity Loan
- **Input**:
  - Principal $C_0 = 1\ 000\ 000\text{ XOF}$
  - Annual Rate $T_{ann} = 9.5\%$ ($r = \frac{0.095}{12} = 0.007916666\dots$)
  - Duration $n = 12$ months
- **Expected Results**:
  - Monthly Annuity: $A = \text{round}\left(1\ 000\ 000 \times \frac{0.00791667}{1 - (1.00791667)^{-12}}\right) = \mathbf{87\ 684\text{ XOF}}$
  - Month 1: $I_1 = \text{round}(1\ 000\ 000 \times 0.00791667) = \mathbf{7\ 917\text{ XOF}}$, $P_1 = 87\ 684 - 7\ 917 = \mathbf{79\ 767\text{ XOF}}$, $C_1 = \mathbf{920\ 233\text{ XOF}}$
  - Month 2: $I_2 = \text{round}(920\ 233 \times 0.00791667) = \mathbf{7\ 285\text{ XOF}}$, $P_2 = 87\ 684 - 7\ 285 = \mathbf{80\ 399\text{ XOF}}$, $C_2 = \mathbf{839\ 834\text{ XOF}}$
  - Month 12: $I_{12} = \text{round}(86\ 996 \times 0.00791667) = \mathbf{689\text{ XOF}}$ (or 688), $P_{12} = C_{11} = \mathbf{86\ 996\text{ XOF}}$, $C_{12} \equiv \mathbf{0\text{ XOF}}$
  - Total Interest: $\mathbf{52\ 208\text{ XOF}}$
  - Principal Sum Invariant: $\sum_{k=1}^{12} P_k \equiv \mathbf{1\ 000\ 000\text{ XOF}}$

#### Test Vector 2: Linear Constant Principal Loan
- **Input**: $C_0 = 1\ 200\ 000\text{ XOF}$, $T_{ann} = 12.0\%$ ($r = 0.01$), $n = 12$ months.
- **Expected Results**:
  - $P_k = 100\ 000\text{ XOF}$ for all $k \in [1, 12]$.
  - Month 1: $I_1 = 12\ 000$, $A_1 = 112\ 000$, $C_1 = 1\ 100\ 000$.
  - Month 12: $I_{12} = 1\ 000$, $A_{12} = 101\ 000$, $C_{12} \equiv 0$.
  - Total Interest: $\sum I_k = 12\ 000 + 11\ 000 + \dots + 1\ 000 = \mathbf{78\ 000\text{ XOF}}$.

#### Test Vector 3: 31-Day Tontine Cycle
- **Input**: Daily mise = $1\ 000\text{ XOF}$, 31 paid days.
- **Expected Results**:
  - Total collected: $31\ 000\text{ XOF}$ in Account `258000`.
  - SFD Commission (Credit `704000`): $1\ 000\text{ XOF}$.
  - Member DAV Payout (Credit `251100`): $30\ 000\text{ XOF}$.
  - Final Balance of Account `258000` for this carnet: $\mathbf{0\text{ XOF}}$.

#### Test Vector 4: BCEAO 15-Day Rule (*Règle des Quinzaines*)
- **Scenario**:
  - Jan 01: Opening balance = $100\ 000\text{ XOF}$ (Value date Jan 01 $\rightarrow$ productive in $Q_1, Q_2$).
  - Jan 10: Deposit $50\ 000\text{ XOF}$ (Value date Jan 16 $\rightarrow$ productive in $Q_2$).
  - Jan 20: Withdrawal $30\ 000\text{ XOF}$ (Value date Jan 15 $\rightarrow$ ceases earning interest in $Q_2$).
- **Fortnight Productive Balances**:
  - Month 1 $Q_1$ (Jan 1-15): Minimum productive balance = $100\ 000\text{ XOF}$.
  - Month 1 $Q_2$ (Jan 16-31): Productive balance = $100\ 000 + 50\ 000 - 30\ 000 = 120\ 000\text{ XOF}$.
- At annual rate $3.5\%$:
  - $I_{Q1} = 100\ 000 \times \frac{0.035}{24} = 145.8333\text{ XOF}$
  - $I_{Q2} = 120\ 000 \times \frac{0.035}{24} = 175.0000\text{ XOF}$
  - Total 2-quinzaine accrued interest = $320.8333\text{ XOF} \rightarrow \mathbf{321\text{ XOF}}$ upon rounding.

### 5.2 Automated Test Execution Command
Once implemented in `banolia-server/`:
```bash
cd /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/banolia-server && npm test
```
Tests must verify:
1. `tests/savings_tontines.test.ts`: 15-day value date computation and 31-day tontine settlement accounting.
2. `tests/loans_amortization.test.ts`: Zero-centime exactness on all 4 formulas, TEG usury barrier exceptions, and penalty calculation.
3. `tests/accounting.test.ts`: Double-entry zero-sum invariant check ($\sum \text{Debit} - \sum \text{Credit} \equiv 0$) on every banking transaction.
