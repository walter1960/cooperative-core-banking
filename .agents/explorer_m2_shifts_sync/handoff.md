# Technical Blueprint & Handoff: Cashier Shift Balancing (*Arrêté de Caisse*) & Bidirectional Batch Sync Engine

**Document Reference**: `BANOLIA-M2-EXP3-SHIFTS-SYNC-2026-08`  
**Date**: 2026-08-20T01:04:00Z  
**Agent**: Explorer 3 (`explorer_m2_shifts_sync`)  
**Scope**: Milestone 2 — Desktop Offline-First Agency App (`banolia-desktop`)  
**Target Regulatory Framework**: BCEAO / UMOA (XOF - Franc CFA) — SFD Regulatory Instruction N° 01/2011/SFD  

---

## 1. Observation

### 1.1 Existing Codebase Inventory & Current Implementation Gaps
Direct inspection of the repository `/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/banolia-desktop` reveals the following concrete state:

1. **Current Types (`src/types/index.ts`)**:
   - `CashRegister` (lines 62–72) is currently a minimal single-state object:
     ```typescript
     export interface CashRegister {
       id: string;
       code: string;
       name: string;
       agencyCode: string;
       agencyName: string;
       cashierName: string;
       balance: number;
       status: 'OPEN' | 'CLOSED';
       lastOpenedAt: string;
     }
     ```
   - **Gap**: Missing formal `CashShift`, `Billetage` breakdown (10 000, 5 000, 2 000, 1 000, 500 banknotes and 500, 200, 100, 50, 25, 10, 5 coins), opening vs. closing verification, discrepancy tracking, supervisor approval signatures, and signed Procès-Verbal metadata.
   - `Transaction` (lines 45–60) has `idempotencyKey: string` and `syncStatus: 'SYNCED' | 'PENDING_OFFLINE'`, but lacks HMAC cryptographic signature fields, retry counters, and server acknowledgement timestamps.

2. **Current Storage & Transaction Handling (`src/services/storage.ts`)**:
   - In `storage.ts` (lines 73–135), transactions update an in-memory/`localStorage` counter directly:
     ```typescript
     const cash = this.getCashRegister();
     if (txData.type === 'DEPOSIT') {
       cash.balance += txData.amount;
     } else if (txData.type === 'WITHDRAWAL') {
       cash.balance -= txData.amount;
     }
     localStorage.setItem(KEYS.CASH, JSON.stringify(cash));
     ```
   - In `storage.ts` (lines 137–153), sync is a naive local array wipe (`syncOfflineQueue()`) returning the count of items without actual network request replay, HMAC signing, exponential backoff, or conflict handling.

3. **Current UI Components**:
   - `CashierDesk.tsx` (lines 68–94) executes transactions without checking if the current cashier shift is open or balanced.
   - `AccountingView.tsx` (lines 43–76) contains static hardcoded SFD accounts (`571100`, `251211`, `204121`, `101100`) without dynamic reflection of shift deficit (`471200`) or surplus (`472200`) adjusting entries.
   - `OfflineSyncModal.tsx` (lines 37–56) provides a simulated disconnect toggle and pending queue table, but lacks detailed batch replay metrics, conflict indicators, and retry logs.
   - `ThermalReceipt.tsx` (lines 13–53) formats single transaction receipts but lacks a dedicated 80mm ESC/POS Procès-Verbal (PV) d'Arrêté de Caisse template.

4. **Package & Tooling Environment (`package.json`)**:
   - Framework: React 19.0.0, Vite 6.1.0, TypeScript 5.7.3, Tailwind CSS 4.3.3, `lucide-react` 0.475.0, `clsx` 2.1.1.
   - Build command: `npm run build` (`tsc && vite build`).

---

## 2. Logic Chain & Technical Blueprint

The architecture for Cashier Shift Balancing and the Bidirectional Batch Sync Engine is constructed systematically from regulatory, mathematical, and cryptographic requirements.

```
+---------------------------------------------------------------------------------------------------+
|                           BANOLIA DESKTOP SHIFT & SYNC ENGINE ARCHITECTURE                        |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +-------------------------------------+         +---------------------------------------------+  |
|  |     CASHIER SHIFT BALANCING FSM     |         |         BIDIRECTIONAL BATCH SYNC ENGINE     |  |
|  |  - Opening Count & Billetage        |         |  - SHA-256 HMAC Idempotency Generator       |  |
|  |  - Real-Time Theoretical Engine     |         |  - Persistent Outbox Queue (SQLite/IndexedDB)|  |
|  |  - Closing Physical Billetage Count |         |  - Exponential Backoff Replay Worker        |  |
|  |  - SFD 471200/472200 Accounting    |         |  - Deterministic Conflict Resolution Matrix |  |
|  |  - Dual-Signed PV Generation (A4/80)|         |  - Active Network Health Monitor            |  |
|  +------------------+------------------+         +----------------------+----------------------+  |
|                     |                                                   |                         |
|                     v                                                   v                         |
|  +---------------------------------------------------------------------------------------------+  |
|  |                             LOCAL ATOMIC STORAGE & AUDIT LOG                                |  |
|  |               (Strict Double-Entry Consistency & Tamper-Proof SQLite/Store)                 |  |
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

### 2.1 Cashier Shift Balancing Architecture (*Arrêté de Caisse*)

#### A. Shift Lifecycle Finite State Machine (FSM)

```
 [ UNINITIALIZED / CLOSED ]
             │
             │ Cashier logs in & confirms previous day carryover / inputs opening billetage
             ▼
      [ SHIFT_OPENING ]
             │
             │ Opening Billetage validated & signed
             ▼
      [ SHIFT_ACTIVE ] <───────────────────────────────────────────────────────┐
             │                                                                 │
             │ Teller performs operations:                                     │
             │ (+) Deposits, Loan Repayments, Tontine Mises, Vault In          │
             │ (-) Withdrawals, Loan Disbursements, Tontine Payouts, Vault Out │
             │ System recalculates Theoretical Balance in real-time            │
             │                                                                 │
             │ End of shift reached -> Click "Arrêté de Caisse"                │
             ▼                                                                 │
      [ CLOSING_COUNT ]                                                        │
             │                                                                 │
             │ Cashier inputs physical counts for 12 XOF denominations         │
             │ Total_Physique = SUM(qty_i * val_i)                             │
             │ Discrepancy = Total_Physique - Theoretical_Balance              │
             │                                                                 │
             ├───────────────┬──────────────────────────┬──────────────────────┤
             │               │                          │                      │
       Discrepancy == 0  Discrepancy < 0            Discrepancy > 0       Recount / Abort
             │               │                          │                      │
             ▼               ▼                          ▼                      │
        [ BALANCED ]    [ DEFICIT ]                [ SURPLUS ]                 │
             │          (Manquant Caisse)          (Excédent Caisse)           │
             │               │                          │                      │
             │          Mandatory reason           Mandatory reason            │
             │          Debit 471200               Debit 571200                │
             │          Credit 571200              Credit 472200               │
             │               │                          │                      │
             └───────────────┼──────────────────────────┘                      │
                             │                                                 │
                             │ Supervisor Review & Dual Electronic Signature   │
                             ▼                                                 │
                  [ CLOSED_AND_APPROVED ]                                      │
                             │                                                 │
                             ├─ Generate Signed Procès-Verbal (PV)             │
                             ├─ Export to A4 PDF / Web Print                   │
                             ├─ Print 80mm ESC/POS Shift Slip                  │
                             ├─ Seal transactions in immutable outbox          │
                             └─ Lock cashier drawer for current date           │
```

#### B. Complete BCEAO / UMOA (XOF) Billetage Specification
The physical cash count must account for all 12 legal tender denominations in circulation within the UMOA zone:

| Type | Denomination (XOF) | Code Key | Description / Physical Appearance |
| :--- | :--- | :--- | :--- |
| **Billet** | `10 000` | `b_10000` | Blue BCEAO Series (Transport/Telecom) |
| **Billet** | `5 000` | `b_5000` | Green BCEAO Series (Agriculture/Sahel) |
| **Billet** | `2 000` | `b_2000` | Red/Pink BCEAO Series (Environment/Water) |
| **Billet** | `1 000` | `b_1000` | Brown/Orange BCEAO Series (Education/Health) |
| **Billet** | `500` | `b_500` | Greenish Grey BCEAO Series (ICT) |
| **Pièce** | `500` | `p_500` | Bimetallic Round Gold/Silver Coin |
| **Pièce** | `200` | `p_200` | Bimetallic Round Gold/Silver Coin |
| **Pièce** | `100` | `p_100` | Nickel Coin |
| **Pièce** | `50` | `p_50` | Bronze-Aluminium Coin |
| **Pièce** | `25` | `p_25` | Bronze-Aluminium Coin |
| **Pièce** | `10` | `p_10` | Bronze-Aluminium Coin |
| **Pièce** | `5` | `p_5` | Aluminium Coin |

**Mathematical Formulations**:
$$Total\_Billetage = \sum_{k \in \{10000, 5000, 2000, 1000, 500\}} (k \cdot Q_{b,k}) + \sum_{m \in \{500, 200, 100, 50, 25, 10, 5\}} (m \cdot Q_{p,m})$$

$$Solde\_Théorique = Solde\_Ouverture + \sum Entrées\_Espèces - \sum Sorties\_Espèces$$
$$\text{où } \sum Entrées\_Espèces = Dépôts + Achats\_Parts + Remboursements\_Prêts + Cotisations\_Tontine + Délestages\_Coffre\_Entrant$$
$$\text{où } \sum Sorties\_Espèces = Retraits + Décaissements\_Prêts + Reversements\_Tontine + Approvisionnements\_Coffre\_Sortant$$

$$\text{Écart de Caisse } (\Delta) = Total\_Billetage\_Physique - Solde\_Théorique$$

#### C. Regulatory SFD Accounting Imputation Matrix
Compliant with **Plan Comptable des SFD (BCEAO Instruction N° 01/2010/RB/SFD)**:

| Scenario | Condition | Classification | Accounting Entry (Double-Entry Equilibrium) |
| :--- | :--- | :--- | :--- |
| **Caisse Juste** | $\Delta = 0$ | Équilibré | Aucune écriture d'ajustement. Solde théorique clôturé sur le compte `571200` (Caisse Guichet). |
| **Manquant / Déficit** | $\Delta < 0$ | Déficit de caisse | **Débit** `471200` (Débiteurs divers / Déficits de caisse à la charge du caissier) : $|\Delta|$<br>**Crédit** `571200` (Caisse Guichet Agence) : $|\Delta|$ |
| **Excédent de Caisse** | $\Delta > 0$ | Excédent de caisse | **Débit** `571200` (Caisse Guichet Agence) : $\Delta$<br>**Crédit** `472200` (Créditeurs divers / Excédents de caisse en attente) : $\Delta$ |

#### D. Procès-Verbal (PV) Structure & Multi-Format Generation
Every shift closure compiles an official immutable Procès-Verbal document containing:
1. **Header**: Institution Name (COOPEC BANOLIA), BCEAO Authorization (`Agrément N° T/1/1420/SFD`), Agency Code/Name, Shift Code (`SHIFT-YYYYMMDD-XXXX`), Date & Timestamp.
2. **Cashier & Supervisor Identity**: Cashier Name, ID, Supervisor/Chef d'Agence Name, ID.
3. **Financial Summary Table**:
   - Opening Cash Balance ($Solde\_Ouverture$)
   - Total Cash Deposits / Inflows ($+ \sum Entrées$)
   - Total Cash Withdrawals / Outflows ($- \sum Sorties$)
   - Vault Movements ($Net\_Coffre$)
   - Theoretical Closing Balance ($Solde\_Théorique$)
   - Physical Cash Count ($Total\_Billetage$)
   - Net Discrepancy ($\Delta$) and Accounting Imputation Account (`471200` or `472200`).
4. **Denomination Breakdown Grid**: Line-by-line breakdown of all 12 denominations with counts and sub-totals.
5. **Justification Note**: Mandatory explanation signed by the cashier if $\Delta \ne 0$.
6. **Digital Signatures & Cryptographic Audit Hash**:
   - Signature token generated via `SHA-256(ShiftId + CashierId + SupervisorId + TotalPhysical + Timestamp)`.
7. **Export Targets**:
   - High-fidelity **A4 Printable Web View / PDF**.
   - Compact **80mm ESC/POS Thermal Receipt Slip**.

---

### 2.2 Bidirectional Batch Sync Engine Architecture

#### A. Cryptographic Idempotency Protocol (HMAC-SHA256)
To guarantee strict zero-duplicate processing across offline networks, each offline action receives an immutable, deterministic, and verifiable idempotency signature:

$$\text{CanonicalString} = \text{AgencyCode} \mathbin{\Vert} \text{DeviceId} \mathbin{\Vert} \text{CashierId} \mathbin{\Vert} \text{LocalTxId} \mathbin{\Vert} \text{Amount} \mathbin{\Vert} \text{TimestampIso}$$
$$\text{SignatureHMAC} = \text{HMAC-SHA256}(\text{SecretKey}, \text{CanonicalString})$$
$$\text{IdempotencyKey} = \text{"idemp\_" } + \text{AgencyCode} + \text{"\_" } + \text{TimestampMs} + \text{"\_" } + \text{SignatureHMAC}[0..16]$$

**Server Deduplication Contract**:
- Central server maintains a table `processed_idempotency_keys` with unique index `(idempotency_key)`.
- If an offline batch request drops mid-flight and the client retries, the server recognizes the `idempotency_key`, bypasses double execution, and responds with the cached commit status and original `ledger_tx_id`.

#### B. Offline Outbox Queue & Exponential Backoff Replay State Machine

```
   [ LOCAL MUTATION CREATED ]
                │
                │ Atomic write to Local Database + Insert Outbox Entry
                ▼
        [ QUEUE: PENDING ]
                │
                ├─────────────────────────────┐
        Network Offline                       │ Network Online / Sync Triggered
                │                             ▼
                │                    [ QUEUE: IN_FLIGHT ]
                │                             │
                │             ┌───────────────┴────────────────┐
                │             │ POST /api/v1/sync/batch        │
                │             ▼                                ▼
                │     HTTP 200 (Success)              HTTP 5xx / Network Fail
                │             │                                │
                │             ▼                                ▼
                │    [ ACKNOWLEDGED / SYNCED ]       [ QUEUE: FAILED_RETRY ]
                │    Update local sync status                  │
                │    Purge / Archive Outbox                    │ Calculate Backoff:
                │                                              │ T = min(120s, 2s * 2^retries) + jitter
                │                                              ▼
                └───────────────────────────────────── [ WAIT TIMER ]
```

**Backoff & Jitter Formulation**:
$$T_{\text{wait}} = \min\left(T_{\text{max}}, T_{\text{base}} \times 2^{\text{retry\_count}}\right) + \text{random\_uniform}(0, \text{Jitter})$$
- $T_{\text{base}} = 2.0\text{ seconds}$
- $T_{\text{max}} = 120.0\text{ seconds}$
- $\text{Jitter} = 1000\text{ ms}$
- Maximum Retries before manual escalation alert: `10`

#### C. Conflict Resolution Matrix & Deterministic Merge Rules

| Entity / Domain | Conflict Scenario | Resolution Rule | Architectural Rationale & Recovery Action |
| :--- | :--- | :--- | :--- |
| **Physical Teller Cash (Deposit / Withdrawal)** | Teller approved withdrawal offline while remote balance was locked/debited online. | **Local Teller Authority Wins (Post to Ledger)** | Physical cash was handed to member. Central ledger records the transaction at historical offline timestamp. If account dips below zero, triggers `OVERDRAFT_RECOVERY_CASE` (automatic freeze on next deposit + SMS alert). |
| **Cyclical Tontine Cotisation** | Collector collected daily mise offline while member updated status online. | **Local Field Authority Wins (Append-Only)** | Daily tontine collection is strictly additive into the 31-day cycle carnet ledger (`258000`). |
| **Member Master KYC (Phone, Address, Spouse)** | Desk updated phone number offline while member updated address on Mobile App. | **Field-Level Lamport Clock / LWW (Last-Write-Wins)** | Non-financial metadata merges at the field level using ISO-8601 server-validated timestamps. |
| **Account Freeze / Block Status** | Compliance officer blocked account on central server while offline teller initiated operation. | **Most Restrictive State Wins (Server Block Wins)** | If the account was flagged for AML/Sanction, subsequent sync marks offline transaction with `COMPLIANCE_REVIEW_REQUIRED` audit flag for manual managerial reconciliation. |
| **Cash Shift balancing** | Cashier closed shift offline while network was down. | **Local Shift State Authoritative** | Shift PV and discrepancy adjustments (`471200`/`472200`) commit as an atomic unit once connectivity returns. |

#### D. Active Network Connectivity Monitoring & Auto-Sync Triggers
1. **Multi-Signal Connectivity Detector**:
   - Signal 1: Web Browser DOM Event Listener (`window.addEventListener('online')` / `'offline'`).
   - Signal 2: Active Lightweight Heartbeat Probe (`GET /api/v1/health` with 3s timeout every 15 seconds) to catch captive portals or non-routing Wi-Fi.
2. **Automatic Sync Triggers**:
   - **Reconnection Event**: Immediate outbox flush when transitioning from `OFFLINE` $\rightarrow$ `ONLINE`.
   - **Transaction Creation**: Immediate synchronous push attempt if `ONLINE`; instant outbox enqueue if `OFFLINE` or on network error.
   - **Periodic Background Sweep**: Outbox queue scan every 60 seconds.
   - **Pre-Shift Close Hook**: Warns cashier and forces final batch sync before closing shift.
   - **Manual Keyboard/UI Trigger**: F7 shortcut or "Synchroniser Maintenant" button in header/modal.

---

## 3. Detailed Component & Code Specifications for Worker

### 3.1 Data Model Extensions (`src/types/shift.ts` & `src/types/sync.ts`)

```typescript
// src/types/shift.ts

export type ShiftStatus = 
  | 'UNINITIALIZED'
  | 'OPEN'
  | 'CLOSING_COUNT'
  | 'BALANCED'
  | 'DEFICIT_PENDING'
  | 'SURPLUS_PENDING'
  | 'CLOSED_APPROVED';

export interface Billetage {
  // Banknotes (Billets)
  b_10000: number;
  b_5000: number;
  b_2000: number;
  b_1000: number;
  b_500: number;
  // Coins (Pièces)
  p_500: number;
  p_200: number;
  p_100: number;
  p_50: number;
  p_25: number;
  p_10: number;
  p_5: number;
  totalCalculated: number;
}

export interface CashShift {
  id: string;
  shiftCode: string;               // e.g. "SHIFT-20260820-001"
  agencyCode: string;              // e.g. "A02"
  agencyName: string;
  cashierId: string;
  cashierName: string;
  supervisorId?: string;
  supervisorName?: string;
  
  openedAt: string;                // ISO-8601
  closedAt?: string;               // ISO-8601
  status: ShiftStatus;

  // Financial Balances (in XOF)
  openingBalance: number;
  openingBilletage?: Billetage;
  
  totalDeposits: number;
  totalWithdrawals: number;
  totalSharePurchases: number;
  totalLoanRepayments: number;
  totalTontineCollections: number;
  totalVaultTransfersIn: number;
  totalVaultTransfersOut: number;

  theoreticalBalance: number;     // opening + in - out
  physicalClosingBalance?: number;// sum of closing billetage
  discrepancyAmount?: number;     // physical - theoretical
  discrepancyAccount?: '471200' | '472200' | 'NONE';
  discrepancyReason?: string;

  closingBilletage?: Billetage;
  digitalSignatureCashier?: string;
  digitalSignatureSupervisor?: string;
  pvHash?: string;
  syncStatus: 'SYNCED' | 'PENDING_OFFLINE';
}
```

```typescript
// src/types/sync.ts

export type OutboxItemStatus = 
  | 'PENDING'
  | 'IN_FLIGHT'
  | 'ACKNOWLEDGED'
  | 'FAILED_RETRY'
  | 'FATAL_ERROR';

export type OutboxEntityType = 
  | 'TRANSACTION'
  | 'SHIFT_EVENT'
  | 'MEMBER_ENROLLMENT'
  | 'VAULT_TRANSFER';

export interface OutboxQueueItem {
  id: string;
  entityType: OutboxEntityType;
  entityId: string;
  payload: any;
  idempotencyKey: string;
  signatureHmac: string;
  priority: number;               // 1 = High (Shifts/Tx), 10 = Low (Logs)
  status: OutboxItemStatus;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;           // ISO-8601
  lastError?: string;
  createdAt: string;              // ISO-8601
  sentAt?: string;
  acknowledgedAt?: string;
}

export interface SyncBatchRequest {
  batchId: string;
  agencyCode: string;
  cashierId: string;
  deviceId: string;
  timestamp: string;
  items: Array<{
    idempotencyKey: string;
    entityType: OutboxEntityType;
    entityId: string;
    payload: any;
    signatureHmac: string;
    offlineCreatedAt: string;
  }>;
}

export interface SyncBatchResponse {
  batchId: string;
  serverTimestamp: string;
  status: 'SUCCESS' | 'PARTIAL' | 'ERROR';
  results: Array<{
    idempotencyKey: string;
    status: 'COMMITTED' | 'DUPLICATE' | 'CONFLICT_RESOLVED' | 'REJECTED';
    ledgerTxId?: string;
    error?: string;
  }>;
  deltaUpdates?: {
    accounts?: Array<{ accountNumber: string; realBalance: number; availableBalance: number }>;
    members?: any[];
  };
}
```

### 3.2 Service Implementation Blueprints

#### 1. `src/services/shiftService.ts`
- **Responsibilities**:
  - `getCurrentShift()`: Returns active `CashShift` or creates a new one.
  - `openShift(openingBalance: number, billetage: Billetage, cashierName: string)`: Opens shift, writes to storage, creates audit log.
  - `recordTransactionOnShift(tx: Transaction)`: Updates running theoretical balance, increments breakdown counters.
  - `calculateBilletageTotal(billetage: Partial<Billetage>)`: Pure function calculating $\sum Q_i \cdot V_i$.
  - `reconcileShift(closingBilletage: Billetage, reason?: string)`: Calculates $\Delta = Total_{physique} - Solde_{theorique}$, evaluates deficit/surplus, assigns account `471200` (if $\Delta < 0$) or `472200` (if $\Delta > 0$).
  - `approveAndCloseShift(supervisorId: string, supervisorName: string)`: Generates SHA-256 PV hash, locks shift, commits accounting adjustment, and queues shift event in the Outbox.

#### 2. `src/services/syncEngine.ts`
- **Responsibilities**:
  - `generateIdempotencyKey(payload: any, agencyCode: string, cashierId: string)`: Deterministic HMAC-SHA256 signature and unique prefix.
  - `enqueue(entityType: OutboxEntityType, entityId: string, payload: any)`: Atomically stores outbox item.
  - `processOutbox(isOnline: boolean)`: Batches pending items (up to 25 items), sends `POST /api/v1/sync/batch`, marks acknowledged items, schedules retry with exponential backoff and jitter on failure.
  - `pullDeltas()`: Fetches remote account/member balance changes and applies deterministic local merges.

#### 3. `src/services/networkMonitor.ts`
- **Responsibilities**:
  - Listens to `window.online` / `window.offline`.
  - Performs active HTTP ping every 15s (`/api/v1/health`).
  - Emits status change events to subscribers.

### 3.3 UI Component Specifications for Worker

1. **`src/components/CashShiftModal.tsx`**:
   - Interactive modal accessible via keyboard shortcut (`F8` or Shift status pill in header).
   - Step 1: Open Shift / View Real-Time Status.
   - Step 2: Billetage Matrix input with 12 denomination fields (5 notes, 7 coins) featuring live subtotal computations.
   - Step 3: Reconciliation Comparison Box:
     - Big bold display of Physical Cash vs. Theoretical Balance.
     - Live Difference indicator ($\Delta$). Color coded: Emerald (0), Rose ($< 0$), Amber ($> 0$).
     - If $\Delta \ne 0$: Displays mandatory explanation textarea and the designated SFD regulatory imputation account badge (`SFD 471200` or `SFD 472200`).
   - Step 4: Final Validation with Cashier PIN/Password and Supervisor approval.

2. **`src/components/ShiftPVView.tsx`**:
   - High-precision Procès-Verbal print layout.
   - CSS Print optimization (`@media print` rules) for clean single-page A4 and compact 80mm roll.
   - Formatted dual signature blocks with timestamp and digital verification QR code/hash.

3. **Enhanced `src/components/OfflineSyncModal.tsx`**:
   - Live network status pill (Latency ms, Packet success rate).
   - Real-time Outbox queue monitor with retry indicators, payload inspector, and force-sync button.
   - Conflict resolution audit log tab.

---

## 4. Caveats

1. **Local Storage vs. SQLite Native Backend**:
   - The current web build uses `localStorage` / in-memory store in `storage.ts`. In production Tauri desktop packaging, this should seamlessly bind to Tauri's SQLite / SQLCipher plugin (`tauri-plugin-sql`) while retaining the exact same TypeScript domain interfaces.
2. **Server API Availability**:
   - When the backend (`banolia-server`) is unreachable or undergoing development, the sync engine operates gracefully in mock simulation mode, keeping outbox items safely in `PENDING` state without data loss.
3. **Supervisor Authentication**:
   - In single-user agency configurations, supervisor approval can be configured to auto-sign or require a distinct Chef d'Agence PIN code.

---

## 5. Conclusion

The technical design for Cashier Shift Balancing (*Arrêté de caisse*) and the Bidirectional Batch Sync Engine is complete, mathematically robust, and fully compliant with BCEAO SFD regulations. It solves the offline-first requirement with zero transaction loss, deterministic conflict resolution, automated 471200/472200 discrepancy accounting, and official signed Procès-Verbal generation.

---

## 6. Verification Method

### 6.1 Automated Verification Commands
The Worker can verify the implementation with the following suite:

```bash
# 1. Typecheck and build banolia-desktop
cd /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/banolia-desktop
npm run build

# 2. Run unit tests
npm test
```

### 6.2 Test Case Specifications for Implementation
1. **Billetage Summation Invariant**:
   - Test that $\sum (Q_i \cdot V_i)$ calculates correctly for all 12 denominations, including zero quantities and large cash amounts ($> 50\,000\,000\text{ XOF}$).
2. **Shift Reconciliation Invariant**:
   - Test $\Delta = 0 \rightarrow$ Status `BALANCED`, Discrepancy Account `NONE`.
   - Test $\Delta = -5000 \rightarrow$ Status `DEFICIT_PENDING`, Discrepancy Account `471200`.
   - Test $\Delta = +10000 \rightarrow$ Status `SURPLUS_PENDING`, Discrepancy Account `472200`.
3. **Idempotency & Deduplication Invariant**:
   - Assert that identical payload generates identical HMAC signature and identical `idempotencyKey`.
   - Assert that replaying an acknowledged outbox item does not double-post to local cash balance.
4. **Offline Outbox Replay Invariant**:
   - Queue 20 transactions in offline mode.
   - Trigger online transition.
   - Assert all 20 transitions change from `PENDING` $\rightarrow$ `IN_FLIGHT` $\rightarrow$ `ACKNOWLEDGED`.
