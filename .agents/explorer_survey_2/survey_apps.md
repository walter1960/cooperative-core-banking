# BANOLIA Microfinance Suite — Architecture & Technical Survey: Frontend & Mobile Applications
**Document Reference**: `BANOLIA-SURVEY-APPS-2026-08`  
**Date**: 2026-08-20  
**Scope**: Requirement 2 (Desktop Offline-First Application - Tauri/React) & Requirement 3 (Mobile Banking & Field Collector Application - Flutter)  
**Target Regulatory Zone**: BCEAO / UMOA (XOF - Franc CFA) — Togo, Benin, Côte d'Ivoire, Senegal, Mali, Burkina Faso, Niger, Guinea-Bissau.

---

## 1. Executive Summary & Existing Codebase Assessment

### 1.1 Existing Codebase Inventory
An inspection of `/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE` reveals the following state:
- **`banolia-desktop`**: A React 19 + TypeScript + Vite + Tailwind CSS desktop-ready web interface containing:
  - `CashierDesk.tsx`: Full teller counter supporting deposits, withdrawals, payment method selection (Cash, TMoney, Flooz, Wave), quick amount presets, change calculator, automatic thermal receipt printing triggering.
  - `MemberProfile.tsx`: 360-degree member situation view (Parts Sociales, Ordinary Savings 251211, Loan Portfolios 204121, Career/Project Plans 253310), search by code/manual number/phone.
  - `CreditManager.tsx`: Credit simulator and dynamic amortization schedule generator using constant annuity formulas compliant with BCEAO maximum usury rate ceilings (24-27%).
  - `SavingsManager.tsx`: Daily tontine management (1,000 F/day), retirement career plans (5.5% annual yield), and Term Deposits (DAT 6.0-7.5%).
  - `AccountingView.tsx`: BCEAO / SFD standard chart of accounts preview (Accounts 571100, 251211, 204121, 101100).
  - `OfflineSyncModal.tsx`: Decentralized sync hub with network disconnection simulator and pending sync queue visualizer.
  - `VoiceAssistantModal.tsx`: Multimodal Gemini voice assistant interface with speech recognition, intent parsing, French/local language speech synthesis, and keyboard shortcuts (`Ctrl+M`, `Ctrl+K`, `F2-F7`).
  - `storage.ts`: Initial in-memory / `localStorage` service providing CRUD abstractions for members, accounts, loans, cash register, and offline queues.
- **`banolia-mobile`**: Initialized workspace ready for the complete Flutter multiplatform client (Sociétaire M-Banking & Field Tontine Collector).
- **`docker-compose.yml`**: Apache Fineract core banking engine + MariaDB 11.4 (`fineract_tenants` / `fineract_default`) + Mifos X Web App back-office.

---

## 2. Requirement 2: Desktop Offline-First Application (Tauri / React)

```
+-------------------------------------------------------------------------------+
|                             TAURI DESKTOP APPLICATION                        |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |                      REACT 19 + TYPESCRIPT UI LAYER                     |  |
|  |  +-------------------+  +--------------------+  +--------------------+  |  |
|  |  | Cashier Desk (F3) |  | Member 360 View(F2)|  | Credit Portf. (F4) |  |  |
|  |  +-------------------+  +--------------------+  +--------------------+  |  |
|  |  | Tontine/DAT (F5)  |  | Accounting (F6)    |  | Sync Monitor (F7)  |  |  |
|  |  +-------------------+  +--------------------+  +--------------------+  |  |
|  |  | Global Search     |  | AI Voice Assistant |  | ESC/POS Print View |  |  |
|  |  | (Ctrl + K)        |  | (Ctrl + M / Voice) |  | (80mm Thermal CSS) |  |  |
|  |  +-------------------+  +--------------------+  +--------------------+  |  |
|  +-------------------------------------------------------------------------+  |
|                                      │                                        |
|                          IPC Bridge via @tauri-apps/api                       |
|                                      ▼                                        |
|  +-------------------------------------------------------------------------+  |
|  |                        RUST TAURI CORE BACKEND                          |  |
|  |                                                                         |  |
|  |  +--------------------+  +---------------------+  +------------------+  |  |
|  |  | SQLite / SQLCipher |  | Bidirectional Sync  |  | Hardware Access  |  |  |
|  |  | Encrypted Database |  | Queue & Idempotency |  | ESC/POS & Biomet.|  |  |
|  |  +--------------------+  +---------------------+  +------------------+  |  |
|  |  | Cashier Shift FSM  |  | Audit Trail Logger |  | Security & Auth  |  |  |
|  |  | & Billetage Engine |  | (BCEAO Compliant)   |  | (Argon2 / PIN)   |  |  |
|  |  +--------------------+  +---------------------+  +------------------+  |  |
|  +-------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------+
```

### 2.1 Local Storage / SQLite Offline Database Schema
To achieve true 100% offline autonomy where tellers can execute transactions for days without network connectivity, the application embeds a high-performance, ACID-compliant **SQLite** database encrypted with **SQLCipher** (AES-256-CBC).

#### Complete DDL Specification
```sql
-- 1. Configuration & Parameters
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA encoding = "UTF-8";

-- 2. Agencies & Tellers
CREATE TABLE agencies (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,          -- Ex: "A02"
    name TEXT NOT NULL,                  -- Ex: "AGENCE LOMÉ MARCHÉ"
    zone_code TEXT NOT NULL DEFAULT 'TG',-- Ex: "TG", "BJ", "CI", "SN"
    currency TEXT NOT NULL DEFAULT 'XOF',
    phone TEXT,
    address TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('CASHIER', 'CHEF_AGENCE', 'AUDITOR', 'ADMIN')),
    pin_hash TEXT NOT NULL,              -- Argon2id hashed teller quick PIN
    biometric_template_hash TEXT,
    agency_id TEXT NOT NULL REFERENCES agencies(id),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. Members / Sociétaires
CREATE TABLE members (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,          -- Ex: "A0200225"
    manual_number TEXT NOT NULL,         -- Ex: "610"
    full_name TEXT NOT NULL,
    birth_date TEXT,
    registration_date TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    phone TEXT NOT NULL,
    spouse_name TEXT,
    shares_purchased INTEGER NOT NULL DEFAULT 0,
    shares_sold INTEGER NOT NULL DEFAULT 0,
    shares_available INTEGER NOT NULL DEFAULT 0,
    share_unit_price INTEGER NOT NULL DEFAULT 5000,
    status TEXT NOT NULL CHECK(status IN ('ACTIF', 'SUSPENDU', 'RADIE')),
    avatar_url TEXT,
    fingerprint_template BLOB,          -- ANSI 378 / ISO 19794-2 biometric minutiae
    fingerprint_enrolled INTEGER NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    last_synced_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_members_code ON members(code);
CREATE INDEX idx_members_phone ON members(phone);
CREATE INDEX idx_members_name ON members(full_name);

-- 4. Accounts (Épargne, Parts Sociales, Tontine, Plans)
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    account_number TEXT NOT NULL UNIQUE, -- Ex: "25121100A020022501"
    member_code TEXT NOT NULL REFERENCES members(code),
    product_code TEXT NOT NULL,          -- Ex: "251211" (Plan Comptable SFD)
    product_name TEXT NOT NULL,          -- Ex: "EPARGNE ORDINAIRE (001)"
    account_type TEXT NOT NULL CHECK(account_type IN ('SAVINGS', 'LOAN', 'DAT', 'CAREER_PLAN', 'PROJECT_PLAN', 'TONTINE', 'SHARES')),
    real_balance INTEGER NOT NULL DEFAULT 0,      -- In XOF (integer cents/francs)
    frozen_balance INTEGER NOT NULL DEFAULT 0,    -- Collateral / Nanti
    available_balance INTEGER NOT NULL DEFAULT 0, -- real_balance - frozen_balance
    currency TEXT NOT NULL DEFAULT 'XOF',
    status TEXT NOT NULL CHECK(status IN ('ACTIF', 'BLOQUE', 'SOLDE')),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_accounts_member ON accounts(member_code);
CREATE INDEX idx_accounts_number ON accounts(account_number);

-- 5. Loan Files & Amortization Schedules
CREATE TABLE loan_files (
    id TEXT PRIMARY KEY,
    loan_number TEXT NOT NULL UNIQUE,    -- Ex: "CR-2025-089"
    member_code TEXT NOT NULL REFERENCES members(code),
    product_name TEXT NOT NULL,
    amount_granted INTEGER NOT NULL,
    interest_rate REAL NOT NULL,         -- % annual (ex: 8.5)
    duration_months INTEGER NOT NULL,
    disbursement_date TEXT NOT NULL,
    maturity_date TEXT NOT NULL,
    monthly_payment INTEGER NOT NULL,
    remaining_principal INTEGER NOT NULL,
    overdue_amount INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK(status IN ('EN_ATTENTE', 'APPROUVE', 'EN_COURS', 'EN_RETARD', 'CLOTURE')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE loan_schedules (
    id TEXT PRIMARY KEY,
    loan_number TEXT NOT NULL REFERENCES loan_files(loan_number),
    installment_number INTEGER NOT NULL,
    due_date TEXT NOT NULL,
    principal_amount INTEGER NOT NULL,
    interest_amount INTEGER NOT NULL,
    fee_amount INTEGER NOT NULL DEFAULT 0,
    total_installment INTEGER NOT NULL,
    remaining_principal INTEGER NOT NULL,
    paid_amount INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK(status IN ('PENDING', 'PAID', 'PARTIAL', 'OVERDUE')),
    paid_at TEXT
);

-- 6. Cash Registers & Shifts (Gestion & Arrêté de Caisse)
CREATE TABLE cash_shifts (
    id TEXT PRIMARY KEY,
    shift_code TEXT NOT NULL UNIQUE,     -- Ex: "SHIFT-20260820-001"
    cashier_id TEXT NOT NULL REFERENCES users(id),
    cashier_name TEXT NOT NULL,
    agency_code TEXT NOT NULL,
    opened_at TEXT NOT NULL,
    closed_at TEXT,
    opening_balance INTEGER NOT NULL DEFAULT 0,
    total_deposits INTEGER NOT NULL DEFAULT 0,
    total_withdrawals INTEGER NOT NULL DEFAULT 0,
    total_vault_transfers INTEGER NOT NULL DEFAULT 0,
    theoretical_closing_balance INTEGER NOT NULL DEFAULT 0,
    physical_closing_balance INTEGER,
    discrepancy_amount INTEGER,         -- physical - theoretical
    discrepancy_reason TEXT,
    supervisor_id TEXT REFERENCES users(id),
    supervisor_notes TEXT,
    status TEXT NOT NULL CHECK(status IN ('OPEN', 'BALANCED', 'DISCREPANCY_PENDING', 'CLOSED_APPROVED')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE cash_billetages (
    id TEXT PRIMARY KEY,
    shift_id TEXT NOT NULL REFERENCES cash_shifts(id),
    type TEXT NOT NULL CHECK(type IN ('OPENING', 'CLOSING', 'MIDDAY_CHECK')),
    b_10000 INTEGER NOT NULL DEFAULT 0,
    b_5000  INTEGER NOT NULL DEFAULT 0,
    b_2000  INTEGER NOT NULL DEFAULT 0,
    b_1000  INTEGER NOT NULL DEFAULT 0,
    b_500   INTEGER NOT NULL DEFAULT 0,
    p_500   INTEGER NOT NULL DEFAULT 0,
    p_250   INTEGER NOT NULL DEFAULT 0,
    p_200   INTEGER NOT NULL DEFAULT 0,
    p_100   INTEGER NOT NULL DEFAULT 0,
    p_50    INTEGER NOT NULL DEFAULT 0,
    p_25    INTEGER NOT NULL DEFAULT 0,
    p_10    INTEGER NOT NULL DEFAULT 0,
    p_5     INTEGER NOT NULL DEFAULT 0,
    total_calculated INTEGER NOT NULL,
    counted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. Transactions Ledger
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    receipt_number TEXT NOT NULL UNIQUE, -- Ex: "REC-20260820-0042"
    shift_id TEXT NOT NULL REFERENCES cash_shifts(id),
    member_code TEXT NOT NULL REFERENCES members(code),
    member_name TEXT NOT NULL,
    account_number TEXT NOT NULL REFERENCES accounts(account_number),
    product_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('DEPOSIT', 'WITHDRAWAL', 'SHARE_PURCHASE', 'LOAN_REPAYMENT', 'TONTINE', 'VAULT_IN', 'VAULT_OUT')),
    amount INTEGER NOT NULL CHECK(amount > 0),
    fee_amount INTEGER NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('CASH', 'TMONEY', 'FLOOZ', 'WAVE', 'MTN_MOMO', 'ORANGE_MONEY')),
    cashier_name TEXT NOT NULL,
    agency_code TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    signature_hmac TEXT NOT NULL,
    sync_status TEXT NOT NULL CHECK(sync_status IN ('SYNCED', 'PENDING_OFFLINE', 'IN_FLIGHT', 'CONFLICT_FAILED')),
    sync_attempts INTEGER NOT NULL DEFAULT 0,
    server_tx_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_tx_sync_status ON transactions(sync_status);
CREATE INDEX idx_tx_account ON transactions(account_number);
CREATE INDEX idx_tx_shift ON transactions(shift_id);

-- 8. Offline Synchronization Queue
CREATE TABLE offline_sync_queue (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK(entity_type IN ('TRANSACTION', 'MEMBER_ENROLMENT', 'SHIFT_EVENT', 'LOAN_APPLICATION')),
    entity_id TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    priority INTEGER NOT NULL DEFAULT 5, -- 1=High (Shifts/Tx), 10=Low
    status TEXT NOT NULL CHECK(status IN ('PENDING', 'IN_FLIGHT', 'ACKNOWLEDGED', 'FAILED_RETRY', 'FAILED_FATAL')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    sent_at TEXT,
    acknowledged_at TEXT
);
CREATE INDEX idx_sync_queue_status_prio ON offline_sync_queue(status, priority);

-- 9. Comprehensive Audit Trail (BCEAO Prudentiel Compliance)
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,                -- Ex: "CASH_WITHDRAWAL_AUTH", "SHIFT_FORCE_CLOSE"
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    before_state_json TEXT,
    after_state_json TEXT,
    ip_address TEXT,
    device_fingerprint TEXT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

### 2.2 Bidirectional Sync Engine

```
+---------------------------------------------------------------------------------------------------+
|                                BIDIRECTIONAL SYNC PROTOCOL                                        |
|                                                                                                   |
|     DESKTOP CLIENT (Tauri)                                   CENTRAL CLOUD (BANOLIA / Fineract)   |
|  +--------------------------+                             +------------------------------------+  |
|  | 1. Queue Pending Batch   |                             |                                    |  |
|  |    (Status: IN_FLIGHT)   |                             |                                    |  |
|  +--------------------------+                             +------------------------------------+  |
|               │                                                              │                    |
|               │  POST /api/v1/sync/batch-push                                │                    |
|               │  Headers: X-Agency: A02, X-Device-HMAC: sha256...            │                    |
|               │  Body: { batchId, transactions: [ ... ] }                    │                    |
|               ├─────────────────────────────────────────────────────────────>│                    |
|               │                                                              │ 2. Deduplicate     |
|               │                                                              │    via Idempotency |
|               │                                                              │    Redis / SQL DB  |
|               │                                                              │ 3. Execute in      |
|               │                                                              │    Fineract Engine |
|               │  200 OK                                                      │                    |
|               │  Body: { batchId, acknowledged: [...], conflicts: [...] }    │                    |
|               │<─────────────────────────────────────────────────────────────┤                    |
|  +--------------------------+                                                │                    |
|  | 4. Update local SQLite   |                                                │                    |
|  |    Mark SYNCED           |                                                │                    |
|  +--------------------------+                                                │                    |
|               │                                                              │                    |
|               │  GET /api/v1/sync/delta-pull?sinceVersion=1420               │                    |
|               ├─────────────────────────────────────────────────────────────>│                    |
|               │                                                              │ 5. Compute Deltas: |
|               │                                                              │    - Member updates|
|               │  200 OK                                                      │    - Remote MoMo tx|
|               │  Body: { currentVersion: 1485, deltas: [ ... ] }             │    - Blacklists    |
|               │<─────────────────────────────────────────────────────────────┤                    |
|  +--------------------------+                                                                     |
|  | 6. Apply Deltas locally  |                                                                     |
|  |    Update Master SQLite  |                                                                     |
|  +--------------------------+                                                                     |
+---------------------------------------------------------------------------------------------------+
```

#### A. Idempotency Key Specification
Every single offline action generates a deterministic 128-bit RFC 4122 v4 UUID coupled with an agency/teller signature:
$$\text{IdempotencyKey} = \text{"idemp\_" } + \text{AgencyCode} + \text{"\_" } + \text{CashierCode} + \text{"\_" } + \text{TimestampMs} + \text{"\_" } + \text{HexHash}(Payload)$$
The central server maintains an un-expirable transactional table `processed_idempotency_keys` with a unique index. If a network packet drops during ACK transmission and the client retries, the server returns the cached success payload without executing duplicate financial entries.

#### B. Conflict Resolution Hierarchy
1. **Physical Cash Movements at Teller (Deposits/Withdrawals)**:
   - **Rule**: *Local Teller Authority Wins*.
   - **Rationale**: Physical cash has already entered or exited the cashier drawer. The central ledger must record the transaction as of the exact local historical timestamp.
2. **Concurrent Mobile Money vs Offline Counter Withdrawal**:
   - If a member initiates an online Mobile Money withdrawal while the offline counter simultaneously approves a withdrawal (creating an overdraft):
   - **Resolution**: The withdrawal is honoured; the account balance turns negative; an automatic recovery case is created (`OVERDRAFT_COMPENSATION_EVENT`) with SMS alert and hold on next deposit.
3. **Member Master Data (Phone, Address, Marital Status)**:
   - **Rule**: *Vector Clock / Highest Lamport Timestamp Wins*.

---

### 2.3 ESC/POS 80mm Thermal Receipt Generator

#### Technical Specifications
- **Paper Roll Width**: 80 mm (3.15 in)
- **Printable Area**: 72 mm (576 dots per line @ 203 DPI)
- **Columns**: Font A (12x24 dots): 48 characters/line; Font B (9x17 dots): 64 characters/line
- **Character Encoding**: PC850 (Multilingual Latin I) or CP1252 (Western European) for correct French accented characters (`é`, `è`, `à`, `ç`, `ù`).

#### Raw Byte Protocol Command Pipeline
```rust
pub struct EscPos80mmReceipt {
    buffer: Vec<u8>,
}

impl EscPos80mmReceipt {
    pub const INIT: &'static [u8] = &[0x1B, 0x40];                  // ESC @
    pub const ALIGN_LEFT: &'static [u8] = &[0x1B, 0x61, 0x00];      // ESC a 0
    pub const ALIGN_CENTER: &'static [u8] = &[0x1B, 0x61, 0x01];    // ESC a 1
    pub const ALIGN_RIGHT: &'static [u8] = &[0x1B, 0x61, 0x02];     // ESC a 2
    pub const BOLD_ON: &'static [u8] = &[0x1B, 0x45, 0x01];         // ESC E 1
    pub const BOLD_OFF: &'static [u8] = &[0x1B, 0x45, 0x00];        // ESC E 0
    pub const DOUBLE_SIZE: &'static [u8] = &[0x1D, 0x21, 0x11];     // GS ! 0x11 (2x W, 2x H)
    pub const NORMAL_SIZE: &'static [u8] = &[0x1D, 0x21, 0x00];     // GS ! 0x00
    pub const CUT_FEED: &'static [u8] = &[0x1D, 0x56, 0x42, 0x03];   // GS V 'B' 3 (Feed & Cut)
    pub const DRAWER_KICK: &'static [u8] = &[0x1B, 0x70, 0x00, 0x19, 0xFA]; // ESC p 0 25 250
}
```

#### Complete 80mm Receipt Layout & Content Standard
```
================================================
           COOPEC BANOLIA MICROFINANCE           
        Agrément BCEAO/UMOA N° T/1/1420/SFD       
           Agence Centrale - Marché Lomé         
    Tél: +228 22 26 21 01 / BP 10151 Lomé-TOGO   
================================================
*** REÇU DE VERSEMENT D'ESPÈCES (GUICHET) ***   
------------------------------------------------
N° Reçu        : REC-20260820-0042
Date & Heure   : 20/08/2026 10:45:12
Guichet / Post : CAISSE 01 (Poste P-03)
Caissier       : MINDIZINA TOMROM (ID: 0000)
------------------------------------------------
Code Adhérent  : A0200225 (N° Manuel: 610)
Nom Adhérent   : MILDZINA TOMROM
N° Compte      : 25121100A020022501
Intitulé       : EPARGNE ORDINAIRE (001)
------------------------------------------------
MONTANT VERSÉ  : 50 000 F.CFA
(CINQUANTE MILLE FRANCS CFA)
------------------------------------------------
Ancien Solde   : 280 424 F.CFA
Nouveau Solde  : 330 424 F.CFA
Disponible     : 330 424 F.CFA
------------------------------------------------
Mode Règlement : ESPÈCES
Montant Reçu   : 50 000 F.CFA
Monnaie Rendue : 0 F.CFA
------------------------------------------------
     [  QR CODE AUTHENTIFICATION / AUDIT  ]     
        v1:REC-20260820-0042:50000:A0200225     
------------------------------------------------
Idempotency Ref: idemp-tx-1724150712-984a2
Conservez ce reçu comme preuve de paiement.
       BANOLIA : La Finance Solidaire UMOA       
================================================
[Partial Cut]
```

---

### 2.4 USB Biometric Hardware Support & Mock Abstraction Layer

#### Supported Hardware
1. **DigitalPersona U.are.U 4500 / 5160 / 5300** (Standard in West African Microfinance).
2. **SecuGen Hamster Pro 20 / Hamster Plus**.
3. **Futronic FS80H / FS88H**.

#### Architecture & Native FFI Bridge
```
+---------------------------------------------------------------------+
|                      REACT GUICHET INTERFACE                        |
|                                                                     |
|  [ Modal: "Veuillez poser le doigt sur le lecteur biométrique..." ] |
|  [ Animation Scan / Score de Similarité: 98% / Validation ]         |
+---------------------------------------------------------------------+
                                   │
                     Tauri IPC: invoke('capture_and_verify')
                                   ▼
+---------------------------------------------------------------------+
|                   RUST BIOMETRIC HARDWARE ADAPTER                   |
|                                                                     |
|  pub trait BiometricReader {                                        |
|      fn initialize(&mut self) -> Result<(), BioError>;              |
|      fn capture_raw_image(&self) -> Result<RawFingerprint, BioErr>; |
|      fn extract_iso_minutiae(&self, img: &Raw) -> Result<Template>; |
|      fn match_1_to_1(&self, t1: &[u8], t2: &[u8]) -> MatchScore;   |
|  }                                                                  |
|                                                                     |
|  +------------------------+          +---------------------------+  |
|  | Real USB Native Driver |          | Mock Biometric Provider   |  |
|  | (libdpfpdd.so / libsg) |          | (Dev / Testing / CI)      |  |
|  +------------------------+          +---------------------------+  |
+---------------------------------------------------------------------+
```

#### Standard Minutiae Format
- **ISO/IEC 19794-2:2005** Compact Format (FMD) stored in SQLite as binary `BLOB` (approx. 512–1024 bytes per finger template).
- **Match Threshold**: Configurable threshold (Score $\ge 85 / 100$ with False Acceptance Rate $FAR < 0.001\%$).

---

### 2.5 Cashier Shift Balancing (Arrêté de Caisse & Gestion des Écarts)
Compliant with **BCEAO Instruction N° 01/2011/SFD** governing cash desk controls:

```
+-----------------------------------------------------------------------------------+
|                         CASHIER SHIFT BALANCING WORKFLOW                          |
|                                                                                   |
|  1. OUVERTURE DE CAISSE (Matin 07:30)                                             |
|     - Report du solde de la veille vérifié                                        |
|     - Billetage d'ouverture physique renseigné & validé                           |
|     - Statut: SHIFT_OPEN                                                          |
|                                                                                   |
|  2. EXÉCUTION DES OPÉRATIONS DE LA JOURNÉE                                       |
|     - Versements (+) / Retraits (-) / Remboursements (+)                          |
|     - Approvisionnements (+) / Délestages Coffre-Fort (-)                         |
|     - Solde théorique recalculé en temps réel à chaque transaction                |
|                                                                                   |
|  3. CLÔTURE & BILLETAGE PHYSIQUE (Soir 17:00)                                     |
|     - Saisie du décompte physique des billets et pièces                           |
|       (10 000, 5 000, 2 000, 1 000, 500 F et pièces 500, 250, 200, 100, 50...)     |
|     - Calcul automatique: Total_Physique = SUM(Quantité * Valeur_Faciale)         |
|                                                                                   |
|  4. CALCUL & GESTION DES ÉCARTS DE CAISSE                                         |
|     - Formule: Écart = Total_Physique - Solde_Théorique                           |
|     - SI Écart == 0 : "Caisse Juste" -> Clôture automatique                       |
|     - SI Écart < 0  : "Manquant de Caisse" -> Saisie motif obligatoire + Imputation|
|                       Compte SFD 471200 (Débiteurs divers / Retenue caissier)     |
|     - SI Écart > 0  : "Excédent de Caisse" -> Imputation Compte SFD 472200        |
|                       (Créditeurs divers / Attente régularisation)                |
|                                                                                   |
|  5. PROCÈS-VERBAL D'ARRÊTÉ & VERROUILLAGE                                         |
|     - Signature électronique Caissier + Chef d'Agence                             |
|     - Impression PV A4 / Ticket thermique 80mm                                    |
|     - Verrouillage total des écritures de la journée                              |
+-----------------------------------------------------------------------------------+
```

---

## 3. Requirement 3: Mobile Banking & Field Collector Application (Flutter)

```
+-------------------------------------------------------------------------------+
|                      BANOLIA MOBILE FLUTTER ARCHITECTURE                      |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |                     ROLE-ADAPTIVE PRESENTATION LAYER                    |  |
|  |                                                                         |  |
|  |  [ MODE ADHÉRENT / SOCIÉTAIRE ]        [ MODE COLLECTEUR TERRAIN ]      |  |
|  |  - Dashboard Solde Réel/Gelé/Dispo    - Tournée journalière du marché   |  |
|  |  - Relevé & Historique d'opérations   - Scan QR Carnet Adhérent         |  |
|  |  - Simulateur & Demande de Prêt       - Encaissement tontine 1-Tap      |  |
|  |  - Dépôt / Retrait Mobile Money       - Reçu thermique Bluetooth 58mm   |  |
|  |  - Suivi Carnet Tontine 31 jours      - Arrêté de collecte & Synchro    |  |
|  +-------------------------------------------------------------------------+  |
|                                      │                                        |
|                       BLoC / Riverpod State Management                        |
|                                      ▼                                        |
|  +-------------------------------------------------------------------------+  |
|  |                          DOMAIN / USECASES                              |  |
|  |  - ProcessMobileMoneyDeposit          - RecordOfflineTontineCollection  |  |
|  |  - RequestMicroLoanApplication        - PrintBluetoothReceiptUseCase    |  |
|  |  - CalculateAmortizationSchedule      - SynchronizeCollectorBatch       |  |
|  +-------------------------------------------------------------------------+  |
|                                      │                                        |
|                                      ▼                                        |
|  +-------------------------------------------------------------------------+  |
|  |                    DATA ACCESS & HARDWARE ADAPTERS                      |  |
|  |                                                                         |  |
|  |  +-----------------------+  +--------------------+  +----------------+  |  |
|  |  | Local Encrypted Store |  | Mobile Money HAL   |  | Bluetooth SPP  |  |  |
|  |  | (Hive / Isar / SQLite)|  | Unified Gateway    |  | Thermal Engine |  |  |
|  |  +-----------------------+  +--------------------+  +----------------+  |  |
|  |  | TMoney, Flooz, Wave, MTN MoMo, Orange Money   |  | Mock Sandbox   |  |  |
|  |  | Gateway Adapters (REST, USSD Push, Webhooks)  |  | Provider       |  |  |
|  |  +-----------------------------------------------+------------------+  |  |
|  +-------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------+
```

### 3.1 Sociétaire UI (M-Banking Portal)

#### A. Triple Balance Dashboard Display
- **Solde Réel (Total Asset)**: Sum of all deposited assets across savings and shares.
- **Solde Gelé (Pledged Collateral / Caution Tontine)**: Funds blocked as guarantee for active credits or tontine commitments.
- **Solde Disponible (Liquid Available)**: $Solde\_Disponible = Solde\_Réel - Solde\_Gelé$. Displayed prominently in bold emerald green with FCFA / XOF currency toggle.

#### B. Relevé d'Opérations & Exportation
- Grouped by day with relative indicators ("Aujourd'hui", "Hier", "15 Août 2026").
- Color-coded badges: Green (`+` Deposit / TMoney Cash-in), Red (`-` Withdrawal / Loan payment), Blue (Tontine cycle payment), Purple (Quarterly Interest payment).
- PDF generation on device via `pdf` package with 1-click sharing via WhatsApp and Telegram.

#### C. Micro-Credit Hub
- Loan Simulator with interactive sliders for Amount (50 000 F to 5 000 000 F) and Duration (3 to 24 months).
- Instant Pre-qualification check based on historical savings and shares balance.
- Active loan progress tracking with countdown to next installment date.

---

### 3.2 Mobile Money Gateways Architecture

```
+-----------------------------------------------------------------------------------+
|                        MOBILE MONEY UNIFIED GATEWAY LAYER                         |
|                                                                                   |
|                           +-------------------------------+                       |
|                           |      MobileMoneyGateway       |                       |
|                           |     (Abstract Interface)      |                       |
|                           +---------------+---------------+                       |
|                                           │                                       |
|        ┌─────────────────┬────────────────┼─────────────────┬──────────────────┐  |
|        ▼                 ▼                ▼                 ▼                  ▼  |
|  +-----------+     +-----------+    +-----------+     +------------+    +-----------+ |
|  |  TMoney   |     |   Flooz   |    |   Wave    |     |  MTN MoMo  |    |  Orange   | |
|  | (Togocom) |     |  (Moov)   |    | (QR/Link) |     | (OpenAPI)  |    |  (OM API) | |
|  +-----------+     +-----------+    +-----------+     +------------+    +-----------+ |
|        │                 │                │                 │                  │  |
|        └─────────────────┴────────────────┼─────────────────┴──────────────────┘  |
|                                           │                                       |
|                                           ▼                                       |
|                           +-------------------------------+                       |
|                           |     Mock Sandbox Adapter      |                       |
|                           |  (Local Dev / Automated CI)   |                       |
|                           +-------------------------------+                       |
+-----------------------------------------------------------------------------------+
```

#### Unified Gateway Interface (Dart)
```dart
abstract class MobileMoneyGateway {
  Future<PaymentInitiationResult> initiateDeposit({
    required double amount,
    required String phoneNumber,
    required String memberCode,
    required String targetAccountNumber,
  });

  Future<PaymentInitiationResult> initiateWithdrawal({
    required double amount,
    required String phoneNumber,
    required String memberCode,
    required String sourceAccountNumber,
    required String pinToken,
  });

  Future<TransactionStatusResult> checkStatus({
    required String gatewayReferenceId,
  });

  Future<void> handleWebhookNotification(Map<String, dynamic> payload);
}
```

#### Gateway Providers Technical Matrix
| Provider | Coverage | Protocol / Integration Mode | USSD / Push Flow | Settlement Speed |
| :--- | :--- | :--- | :--- | :--- |
| **TMoney** | Togo | REST API + USSD Push | Server pushes USSD prompt to client phone $\rightarrow$ Client enters 4-digit PIN $\rightarrow$ Webhook callback | Instant (< 3s) |
| **Flooz** | Togo, Benin, CI | Moov Money T-Push API | Tokenized push notification + OTP authentication | Instant (< 4s) |
| **Wave** | Senegal, CI | Wave Business REST + Deep Link | Direct App-to-App launch (`wave://checkout?token=...`) / QR scan | Instant (< 1s) |
| **MTN MoMo** | Benin, CI | MTN MoMo OpenAPI (Collections & Disbursements) | OAuth 2.0 Token $\rightarrow$ `POST /collection/v1_0/requesttopay` | Instant (< 3s) |
| **Orange Money**| CI, Senegal | OM Web Payment API / Developer Portal | Client Credentials $\rightarrow$ Init Webview / USSD push | Instant (< 3s) |
| **Mock Sandbox**| Global Dev | In-Memory Deterministic Mock | Simulates network delays, user cancellations, and success responses | 1.5s simulated |

---

### 3.3 Offline Tontine Field Collector Mode (Mode Collecteur Terrain)

#### A. Business Reality in West African Markets
Market vendors in Lomé (Grand Marché, Hedzranawoé), Cotonou (Dantokpa), or Abidjan (Treichville, Adjamé) contribute daily to tontines (e.g. 500 F, 1 000 F, 2 000 F per day for 31 days). Field collectors walk between market stalls with poor cellular signal. The app must execute 100% offline.

#### B. Collector Workflow
1. **Morning Briefing & Round Sync**: Collector downloads the assigned route of adherents (100–300 members) into local mobile storage.
2. **At the Market Stall**:
   - Collector scans the member's physical card QR code or NFC badge.
   - App instantly loads member name, daily rate, and monthly calendar matrix (e.g. Day 14/31).
   - Collector presses **"Encaisser 1 000 F"**.
   - Transaction is encrypted locally with collector's private cryptographic key.
3. **Instant Bluetooth Receipt Printing (58mm Thermal)**:
   - Mobile sends ESC/POS payload via Bluetooth SPP to the portable belt printer.
   - 58mm receipt is immediately handed to the market vendor.
4. **End of Day Reconciliation**:
   - Collector returns to the agency with the cash bag.
   - App summarizes total collected (e.g. 245 000 F.CFA across 182 members).
   - Teller at Guichet scans collector summary QR code to transfer physical cash into agency vault and trigger bulk Fineract batch sync.

#### 58mm Bluetooth Mini-Receipt Format
```
================================
   BANOLIA TONTINE TERRAIN      
   COOPEC BANOLIA - LOME        
================================
Reçu N°   : TON-20260820-0142
Date      : 20/08/2026 11:15
Collecteur: K. MINTA (COL-04)
--------------------------------
Adhérent  : AMEGNINOU ABLAVI
Code      : A0200389
Carnet    : CARNET-TONTINE-0883
Étal      : N° 42 - Hall Tissus
--------------------------------
MISE DU JOUR : 1 000 F.CFA
Jour Payé    : 14 / 31
--------------------------------
Cumul Mois   : 14 000 F.CFA
Reste à payer: 17 000 F.CFA
--------------------------------
Signature: #9A4F-882E-B401
   Merci pour votre fidélité!   
================================
```

---

## 4. Cross-Platform Technology Stack & Component Synthesis

| Subsystem | Desktop Agency App (R2) | Mobile Banking & Collector App (R3) |
| :--- | :--- | :--- |
| **Framework** | **Tauri v2 + React 19** | **Flutter 3.x (Dart 3.x)** |
| **Local Database** | SQLite with SQLCipher (AES-256) | SQLite / Isar Database (AES-256) |
| **State Management**| React Context + TanStack Query | BLoC (Business Logic Component) / Riverpod |
| **Hardware Access** | USB Raw / Serial / FFI Rust (`libusb`, `escpos-rs`)| Bluetooth Serial / BLE (`flutter_bluetooth_serial`) |
| **Receipt Engine**  | ESC/POS 80mm Native & Web Print CSS | ESC/POS 58mm/80mm Bluetooth Thermal Stream |
| **Biometrics**      | Native USB Driver (ISO 19794-2) + Mock | Local Device Biometrics (`local_auth` Fingerprint/FaceID) |
| **Sync Protocol**   | Bidirectional Batch Sync with Idempotency Keys | Batch Collector Sync & REST Mobile Money Gateway |
| **Voice Interface** | Gemini Multimodal API (Web Speech & Audio) | Gemini Audio Streaming SDK |

---

## 5. Verification & Testing Strategy

### 5.1 Test Matrices
1. **Tier 1: Unit Tests**:
   - Financial calculation precision (constant annuity formulas, interest accrual, cashier billetage sums).
   - Idempotency key generation and collision resistance.
   - ESC/POS byte sequence generation for all transaction types.
2. **Tier 2: Component & Widget Tests**:
   - React components rendering under forced offline conditions.
   - Flutter member dashboard displaying correct `Solde Disponible` calculation.
3. **Tier 3: Integration & Offline Sync Tests**:
   - Execute 50 offline transactions on desktop, restore network connection, verify 100% sync to Fineract without single duplicate.
   - Field collector offline batch collection of 100 tontine transactions synced to cashier shift without mismatch.
4. **Tier 4: Hardware & Mock Validation**:
   - Thermal receipt layout validation on 80mm and 58mm virtual thermal spoolers.
   - USB biometric mock validation covering match success ($\ge 85\%$) and match rejection ($< 85\%$).
5. **Tier 5: Adversarial & Edge Case Tests**:
   - Power failure simulation during middle of transaction SQLite write (WAL rollback verification).
   - Replay attack with duplicate idempotency keys.
   - Network timeout during Mobile Money USSD push callback.
