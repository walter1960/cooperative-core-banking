# Technical Investigation & Architecture Specification: Field Collector Mode (Tontine Terrain) & Bluetooth ESC/POS 58mm Thermal Receipt Generator

**Document Reference**: `BANOLIA-M3-EXP3-FIELD-COLLECTOR-ESCPOS-2026-08`  
**Author**: Explorer 3 (Milestone 3: Mobile Banking & Field Collector App)  
**Date**: 2026-08-20  
**Target Environment**: Flutter / Dart 3.x (`banolia-mobile`)  
**Regulatory & Regional Context**: BCEAO / UMOA (XOF - Francs CFA) — Field Tontines (*Collecte Journalière de Tontine / Agents Démarcheurs*)

---

## 1. Executive Summary & Problem Space

In West African informal economies (e.g., Grand Marché de Lomé / Assigamé, Marché Dantokpa in Cotonou, Marché de Treichville in Abidjan), microfinance institutions (SFD / COOPEC) deploy roaming field collectors (*collecteurs de tontine* or *agents démarcheurs*). These collectors visit 100–300 market vendors daily to collect cash stakes (*mises de tontine*) averaging 500 F to 5,000 F CFA per day over 31-day cycles.

Field conditions present critical technical challenges:
1. **Network Blackouts**: Basements, indoor market halls, and crowded open-air markets frequently suffer zero cellular connectivity (2G/EDGE dropouts or total dead zones). All operations must execute **100% offline**.
2. **Fraud & Tampering Vulnerability**: In physical cash collection, untrusted or compromised devices could alter transaction amounts after printing receipts, delete records, reorder entries, or backdate collections. The mobile client must enforce **cryptographic tamper-evident hash chaining** and **monotonic sequence numbering**.
3. **High-Speed Field Ergonomics**: Collectors have 15–30 seconds per market stall. The UI requires instant stall lookup, NFC/QR card scanning, 1-tap presets, quick stamp allocation, and immediate thermal printing.
4. **Hardware Portability**: Collectors carry lightweight belt-clip Bluetooth 58mm thermal printers (e.g., POS-5802, MPT-II, ZJ-5805, Goojprt PT-210). The app must generate **raw binary ESC/POS byte streams** with correct character encoding (CP1252/PC850 for French accents), custom 32-column alignment, and standard 2D QR codes.
5. **Rigorous End-of-Day Settlement**: At day's end, the collector deposits physical cash into the agency vault. The app must execute an **Arrêté de Collecte** (reconciling physical cash tally vs. encrypted journal) and synchronize the batch with `banolia-server` using idempotent deduplication and sequence gap verification.

---

## 2. Field Collector Mode: Architecture & Domain Modeling

```
+---------------------------------------------------------------------------------------------------+
|                                BANOLIA MOBILE: FIELD COLLECTOR ARCHITECTURE                       |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  |                             PRESENTATION LAYER (Flutter Widgets)                             |  |
|  |  +---------------------+ +-----------------------+ +-----------------------+ +-------------+  |  |
|  |  | Market Route View   | | Stall Quick Search    | | 1-Tap Collection Card | | Daily Shift |  |  |
|  |  | - Map / Sector Sort | | - Code / Name / Stall | | - 31-Day Stamp Grid   | | Summary &   |  |  |
|  |  | - Distance (Havers.)| | - QR/NFC Fast Scanner | | - Multi-day Presets   | | Billetage   |  |  |
|  |  +---------------------+ +-----------------------+ +-----------------------+ +-------------+  |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                │                                                  |
|                                                ▼                                                  |
|  +---------------------------------------------------------------------------------------------+  |
|  |                             DOMAIN LAYER (Use Cases & Business Logic)                       |  |
|  |  +----------------------------+  +----------------------------+  +--------------------------+  |  |
|  |  | RecordOfflineCotisation    |  | AllocateStampsUseCase      |  | ReconcileCollectorShift  |  |  |
|  |  | - Hash Chain Computation   |  | - 31-day cycle calculation |  | - Billetage variance     |  |  |
|  |  | - HMAC Signature           |  | - Commission calculation   |  | - Summary QR generation  |  |  |
|  |  +----------------------------+  +----------------------------+  +--------------------------+  |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                │                                                  |
|                                                ▼                                                  |
|  +---------------------------------------------------------------------------------------------+  |
|  |                             DATA ACCESS & HARDWARE ADAPTER LAYER                            |  |
|  |  +------------------------------------+   +-----------------------------------------------+  |  |
|  |  | Local Encrypted Store (SQLite/Hive)|   | Bluetooth ESC/POS 58mm Thermal Engine         |  |  |
|  |  | - Tamper-evident Journal           |   | - Raw Byte Stream Generator (CP1252/PC850)    |  |  |
|  |  | - Offline Members & Cards Cache    |   | - 2D QR Code Builder & Offline Auth Token     |  |  |
|  |  | - Outbox Batch Sync Queue          |   | - Virtual Thermal Printer Driver (Test/Mock)  |  |  |
|  |  +------------------------------------+   +-----------------------------------------------+  |  |
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Cryptographic Tamper-Evident Journaling & Offline Storage

### 3.1 Hash Chaining Formulation
Every offline transaction $T_i$ ($i \in \{1, 2, \dots, N\}$) recorded on the mobile collector device is cryptographically bound to its predecessor, creating a local immutable ledger:

$$\text{PrevHash}_1 = \text{SHA-256}(\text{ShiftSessionId} \mathbin{\Vert} \text{CollectorId} \mathbin{\Vert} \text{OpeningSalt})$$
$$\text{PayloadCanonical}_i = \text{IdempotencyKey}_i \mathbin{\Vert} \text{SeqNo}_i \mathbin{\Vert} \text{MemberCode}_i \mathbin{\Vert} \text{CardId}_i \mathbin{\Vert} \text{Amount}_i \mathbin{\Vert} \text{Stamps}_i \mathbin{\Vert} \text{TimestampUtc}_i$$
$$\text{PayloadHash}_i = \text{SHA-256}(\text{PayloadCanonical}_i)$$
$$\text{EntryHash}_i = \text{SHA-256}(\text{PrevHash}_i \mathbin{\Vert} \text{PayloadHash}_i \mathbin{\Vert} \text{SeqNo}_i)$$
$$\text{PrevHash}_{i+1} = \text{EntryHash}_i$$
$$\text{CollectorSignature}_i = \text{HMAC-SHA-256}(K_{\text{device\_secret}}, \text{EntryHash}_i)$$

**Security Guarantees**:
1. **Append-Only Immutability**: If a collector edits an amount in SQLite (e.g. changing 5,000 F to 1,000 F after pocketing 4,000 F), $\text{PayloadHash}_i$ changes, breaking $\text{EntryHash}_i$ and all downstream hashes $T_{i+1} \dots T_N$.
2. **Deletion Detection**: Deleting any transaction creates a gap in sequence numbers $\text{SeqNo}$ and invalidates $\text{PrevHash}_{i+1}$.
3. **Non-Repudiation**: The HMAC signature proves the record originated on the enrolled collector hardware.

### 3.2 Complete SQLite Schema Specification (DDL)

```sql
-- 1. Collector Daily Shift Ledger
CREATE TABLE collector_shifts (
    id TEXT PRIMARY KEY,                       -- UUID v4
    shift_code TEXT NOT NULL UNIQUE,           -- Ex: "COLSHIFT-20260820-004"
    collector_id TEXT NOT NULL,                -- Ex: "COL-04"
    collector_name TEXT NOT NULL,              -- Ex: "K. MINTA"
    agency_code TEXT NOT NULL DEFAULT 'A02',   -- Ex: "A02"
    device_id TEXT NOT NULL,                   -- Hardware UUID
    opened_at TEXT NOT NULL,                   -- ISO-8601 UTC
    closed_at TEXT,                            -- ISO-8601 UTC
    status TEXT NOT NULL CHECK(status IN ('OPEN', 'SETTLING', 'CLOSED_BALANCED', 'CLOSED_DISCREPANCY', 'SYNCED')),
    opening_salt TEXT NOT NULL,                -- Random 32-hex string
    root_hash TEXT NOT NULL,                   -- SHA-256(ShiftId || CollectorId || Salt)
    tip_hash TEXT NOT NULL,                    -- Current head hash of the chain
    transaction_count INTEGER NOT NULL DEFAULT 0,
    total_collected_amount INTEGER NOT NULL DEFAULT 0,
    physical_cash_declared INTEGER,
    discrepancy_amount INTEGER,                -- physical - total_collected
    discrepancy_reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Offline Member & Route Cache
CREATE TABLE field_members (
    member_code TEXT PRIMARY KEY,              -- Ex: "A0200389"
    manual_number TEXT NOT NULL,               -- Ex: "883"
    full_name TEXT NOT NULL,                   -- Ex: "AMEGNINOU ABLAVI"
    phone TEXT NOT NULL,                       -- Ex: "90 12 34 56"
    market_name TEXT NOT NULL,                 -- Ex: "Grand Marché de Lomé"
    market_sector TEXT NOT NULL,               -- Ex: "Hall Tissus - 1er Étage"
    stall_number TEXT NOT NULL,                -- Ex: "Étal N° 42B"
    latitude REAL,                             -- Ex: 6.12871
    longitude REAL,                            -- Ex: 1.21583
    route_order INTEGER NOT NULL DEFAULT 0,    -- Walking sequence priority
    status TEXT NOT NULL DEFAULT 'ACTIF',
    last_synced_at TEXT NOT NULL
);
CREATE INDEX idx_field_members_search ON field_members(member_code, manual_number, full_name, phone, stall_number);
CREATE INDEX idx_field_members_route ON field_members(market_sector, route_order);

-- 3. Offline Tontine Card Subscriptions
CREATE TABLE field_tontine_cards (
    id TEXT PRIMARY KEY,                       -- Ex: "CARD-2026-0883"
    member_code TEXT NOT NULL REFERENCES field_members(member_code),
    account_number TEXT NOT NULL,              -- Ex: "25330000A020038901"
    cycle_month INTEGER NOT NULL,              -- 1 .. 12
    cycle_year INTEGER NOT NULL,               -- 2026
    daily_mise INTEGER NOT NULL,               -- e.g. 1000 XOF
    total_days INTEGER NOT NULL DEFAULT 31,
    paid_days_count INTEGER NOT NULL DEFAULT 0,
    stamps_bitmask INTEGER NOT NULL DEFAULT 0, -- 32-bit integer (bits 0..30 representing days 1..31)
    cumulative_amount INTEGER NOT NULL DEFAULT 0,
    commission_day_index INTEGER NOT NULL DEFAULT 31, -- Day 31 allocated to coop fee
    commission_amount INTEGER NOT NULL DEFAULT 0,
    credit_buffer INTEGER NOT NULL DEFAULT 0,  -- Partial coin deposits (< daily_mise)
    status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'COMPLETED', 'SETTLED_SAVINGS', 'BLOCKED')),
    updated_at TEXT NOT NULL
);
CREATE INDEX idx_cards_member ON field_tontine_cards(member_code);

-- 4. Append-Only Tamper-Evident Transaction Journal
CREATE TABLE field_transactions_journal (
    id TEXT PRIMARY KEY,                       -- UUID v4
    shift_id TEXT NOT NULL REFERENCES collector_shifts(id),
    sequence_number INTEGER NOT NULL,          -- Monotonic: 1, 2, 3, ...
    receipt_number TEXT NOT NULL UNIQUE,       -- Ex: "TON-20260820-0142"
    idempotency_key TEXT NOT NULL UNIQUE,      -- Ex: "idemp_col04_1724152530_7e4a"
    card_id TEXT NOT NULL REFERENCES field_tontine_cards(id),
    member_code TEXT NOT NULL REFERENCES field_members(member_code),
    member_name TEXT NOT NULL,
    stall_number TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK(amount > 0),
    stamps_allocated_count INTEGER NOT NULL,   -- e.g. 1, 2, 3 days
    stamps_indices_json TEXT NOT NULL,         -- e.g. "[14, 15]"
    cumulative_after INTEGER NOT NULL,
    days_remaining_after INTEGER NOT NULL,
    prev_hash TEXT NOT NULL,                   -- 64-character hex SHA-256
    payload_hash TEXT NOT NULL,                -- 64-character hex SHA-256
    entry_hash TEXT NOT NULL UNIQUE,           -- 64-character hex SHA-256
    signature_hmac TEXT NOT NULL,              -- 64-character hex HMAC
    latitude REAL,
    longitude REAL,
    timestamp_utc TEXT NOT NULL,
    sync_status TEXT NOT NULL CHECK(sync_status IN ('PENDING_SYNC', 'IN_FLIGHT', 'COMMITTED_SERVER', 'ERROR_FATAL')),
    sync_attempts INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_journal_shift_seq ON field_transactions_journal(shift_id, sequence_number);
CREATE INDEX idx_journal_sync_status ON field_transactions_journal(sync_status);

-- 5. Outbox Batch Packages for Server Upload
CREATE TABLE field_sync_batches (
    batch_id TEXT PRIMARY KEY,
    shift_id TEXT NOT NULL REFERENCES collector_shifts(id),
    collector_id TEXT NOT NULL,
    start_seq INTEGER NOT NULL,
    end_seq INTEGER NOT NULL,
    transaction_count INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    root_hash TEXT NOT NULL,
    head_hash TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('PENDING', 'UPLOADING', 'ACKNOWLEDGED', 'FAILED_RETRY')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    acknowledged_at TEXT
);
```

---

## 4. Member Routing & Geolocation Search

### 4.1 Geolocation Distance & Haversine Sorting
To optimize the collector's walking path without relying on live Google Maps API (which requires an active internet connection), the app embeds an offline **Haversine Distance Calculator**:

$$d = 2 R \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)} \right)$$

where $R = 6\,371\,000\text{ meters}$, $\phi$ is latitude in radians, and $\lambda$ is longitude in radians.

```dart
class GeoLocationUtils {
  static const double earthRadiusMeters = 6371000.0;

  static double distanceMeters(double lat1, double lon1, double lat2, double lon2) {
    final dLat = _degToRad(lat2 - lat1);
    final dLon = _degToRad(lon2 - lon1);

    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(_degToRad(lat1)) *
            math.cos(_degToRad(lat2)) *
            math.sin(dLon / 2) *
            math.sin(dLon / 2);
    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return earthRadiusMeters * c;
  }

  static double _degToRad(double deg) => deg * (math.pi / 180.0);
}
```

### 4.2 Multi-Criteria Offline Search Algorithm
The offline search evaluates 4 indexed criteria with priority weighting:
1. **Exact Barcode / Card ID**: Scanned QR `CARD-2026-0883` $\to$ instant $O(1)$ lookup.
2. **Adherent Manual / Code**: `883` or `A0200389`.
3. **Stall / Sector Match**: `42B` or `Hall Tissus`.
4. **Normalized Name Prefix**: Diacritic-insensitive matching (`amegninou` matches `AMEGNINOU ABLAVI`).

---

## 5. Cotisation Collection & Tontine Domain Engine

### 5.1 31-Day Tontine Cycle Rules (BCEAO Microfinance Model)
- **Cycle Periodicity**: 31 calendar days.
- **Fixed Daily Unit ($M$)**: 500 F, 1,000 F, 2,000 F, 5,000 F, or 10,000 F CFA.
- **Cycle Maturation Total**: $31 \times M$.
- **Institutional Commission**: By standard BCEAO / West African COOPEC practice, **1 day of contribution** ($1 \times M$) is retained as cooperative operating commission / collector fee.
- **Member Net Payout**: $30 \times M$, payable at cycle closure or transferred to ordinary savings (Compte 251211).

### 5.2 Stamp Grid Allocation Mathematics
The 31 days are indexed $1 \dots 31$. The status is tracked using a 32-bit integer bitmask:

$$\text{Bit } k \text{ is SET } (1) \iff \text{Day } k \text{ is PAID } (k \in [1..31])$$
$$\text{StampsBitmask} = \sum_{k \in \text{PaidDays}} 2^{k-1}$$

```dart
class TontineStampEngine {
  /// Allocates stamps given a payment amount and current card state.
  static StampAllocationResult allocate({
    required int dailyMise,
    required int currentBitmask,
    required int creditBuffer,
    required int paymentAmount,
    int totalDays = 31,
  }) {
    if (paymentAmount <= 0) throw ArgumentError('Amount must be positive');

    final totalAvailable = creditBuffer + paymentAmount;
    final stampsToAllocate = totalAvailable ~/ dailyMise;
    final newCreditBuffer = totalAvailable % dailyMise;

    final allocatedDays = <int>[];
    int updatedBitmask = currentBitmask;

    // Find consecutive unpaid days
    for (int day = 1; day <= totalDays; day++) {
      if (allocatedDays.length >= stampsToAllocate) break;
      final bit = 1 << (day - 1);
      if ((updatedBitmask & bit) == 0) {
        updatedBitmask |= bit;
        allocatedDays.add(day);
      }
    }

    final newPaidCount = _countSetBits(updatedBitmask);
    final isCompleted = newPaidCount >= totalDays;

    return StampAllocationResult(
      allocatedDays: allocatedDays,
      updatedBitmask: updatedBitmask,
      newPaidCount: newPaidCount,
      newCreditBuffer: newCreditBuffer,
      effectiveAmountAllocated: stampsToAllocate * dailyMise,
      isCycleCompleted: isCompleted,
    );
  }

  static int _countSetBits(int n) {
    int count = 0;
    while (n > 0) {
      count += n & 1;
      n >>= 1;
    }
    return count;
  }
}
```

### 5.3 Payment Scenarios Matrix

| Scenario | Input Amount | Card Status Before | Resulting Allocation | Credit Buffer | Resulting Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Standard 1-Day** | 1 000 F (M=1000) | Day 13 paid (13/31) | Allocates Day 14 | 0 F | 14/31 paid |
| **Advance Multi-Day** | 3 000 F (M=1000) | Day 13 paid (13/31) | Allocates Days 14, 15, 16 | 0 F | 16/31 paid |
| **Partial Coin Deposit**| 500 F (M=1000) | Day 13 paid (13/31) | 0 stamps allocated | +500 F buffer | 13/31 paid (+500 F credit) |
| **Buffer Completion** | 500 F (M=1000) | Day 13 paid, Buffer=500 | Allocates Day 14 ($500+500=1000$) | 0 F | 14/31 paid |
| **Final Day Closure** | 2 000 F (M=1000) | Day 29 paid (29/31) | Allocates Days 30, 31 | 0 F | 31/31 COMPLETED |

---

## 6. End-of-Day Reconciliation & Core Backend Sync

### 6.1 Daily Collector Reconciliation Workflow (*Arrêté de Collecte*)
```
 [ FIELD ROUND COMPLETE ]
            │
            ▼
 [ COUNT PHYSICAL CASH (BILLETAGE) ]
   10 000, 5 000, 2 000, 1 000, 500 Notes
   500, 250, 200, 100, 50, 25, 10, 5 Coins
            │
            ▼
 [ COMPUTE DISCREPANCY ]
   Variance = Physical_Cash - Journal_Total
            ├──────────────────────────┬──────────────────────────┐
            ▼                          ▼                          ▼
      Variance == 0              Variance < 0               Variance > 0
     [ CAISSE JUSTE ]       [ MANQUANT DE CAISSE ]     [ EXCÉDENT DE CAISSE ]
            │                          │                          │
            │                   Collector Liable           Recorded in 472200
            │                   (SFD 471200)               Pending Audit
            └──────────────────────────┼──────────────────────────┘
                                       ▼
                       [ GENERATE SUMMARY QR CODE ]
                        (Signed Summary for Teller)
                                       │
                                       ▼
                       [ CORE BACKEND BATCH SYNC ]
                        (POST /api/v1/sync/batch)
```

### 6.2 Core Backend Batch Sync Contract

- **Endpoint**: `POST /api/v1/sync/batch`
- **Headers**:
  - `Content-Type: application/json`
  - `X-Agency-Code: A02`
  - `X-Collector-Id: COL-04`
  - `X-Device-Id: DEV-PIXEL-7A-8832`
  - `X-Shift-Id: COLSHIFT-20260820-004`
- **Request Payload**:
```json
{
  "batch_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "shift_id": "COLSHIFT-20260820-004",
  "collector_id": "COL-04",
  "device_id": "DEV-PIXEL-7A-8832",
  "start_seq": 1,
  "end_seq": 3,
  "transaction_count": 3,
  "total_amount": 6000,
  "root_hash": "a7f8b92d6e3c1a4f5b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a",
  "tip_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "transactions": [
    {
      "sequence_number": 1,
      "idempotency_key": "idemp_col04_1724152530_7e4a1",
      "receipt_number": "TON-20260820-0142",
      "card_id": "CARD-2026-0883",
      "member_code": "A0200389",
      "account_number": "25330000A020038901",
      "amount": 2000,
      "stamps_allocated_count": 2,
      "stamps_indices": [14, 15],
      "prev_hash": "a7f8b92d6e3c1a4f5b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a",
      "payload_hash": "3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d",
      "entry_hash": "5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e",
      "signature_hmac": "9a4f882eb4017e4ab82919fac4019a4f882eb4017e4ab82919fac4019a4f882e",
      "latitude": 6.12871,
      "longitude": 1.21583,
      "timestamp_utc": "2026-08-20T11:15:30Z"
    },
    {
      "sequence_number": 2,
      "idempotency_key": "idemp_col04_1724152610_8f5b2",
      "receipt_number": "TON-20260820-0143",
      "card_id": "CARD-2026-0412",
      "member_code": "A0200105",
      "account_number": "25330000A020010501",
      "amount": 1000,
      "stamps_allocated_count": 1,
      "stamps_indices": [20],
      "prev_hash": "5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e",
      "payload_hash": "7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
      "entry_hash": "1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f",
      "signature_hmac": "c4019a4f882eb4017e4ab82919fa9a4f882eb4017e4ab82919fac4019a4f882e",
      "latitude": 6.12885,
      "longitude": 1.21590,
      "timestamp_utc": "2026-08-20T11:16:50Z"
    },
    {
      "sequence_number": 3,
      "idempotency_key": "idemp_col04_1724152780_1a2c3",
      "receipt_number": "TON-20260820-0144",
      "card_id": "CARD-2026-0955",
      "member_code": "A0200560",
      "account_number": "25330000A020056001",
      "amount": 3000,
      "stamps_allocated_count": 3,
      "stamps_indices": [5, 6, 7],
      "prev_hash": "1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f",
      "payload_hash": "9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d",
      "entry_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "signature_hmac": "882eb4017e4ab82919fac4019a4f9a4f882eb4017e4ab82919fac4019a4f882e",
      "latitude": 6.12899,
      "longitude": 1.21601,
      "timestamp_utc": "2026-08-20T11:19:40Z"
    }
  ]
}
```

- **Server Validation & Accounting Posting**:
  1. **Chain Verification**: Server starts with `root_hash`, computes each $EntryHash_i$, validates against $PrevHash_{i+1}$, and checks tip matches `tip_hash`.
  2. **Gap Check**: Asserts sequence is strictly contiguous $1 \dots 3$.
  3. **Accounting Posting**:
     - **Debit**: SFD Compte `571200` (Caisse Collecteur Terrain / Portefeuille Démarcheur) = $6\,000\text{ XOF}$
     - **Credit**: SFD Compte `253300` (Épargne Tontinière Souscrite Adhérents) = $6\,000\text{ XOF}$
- **Response Payload**:
```json
{
  "status": "SUCCESS",
  "batch_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "processed_count": 3,
  "server_timestamp": "2026-08-20T17:45:00Z",
  "results": [
    { "idempotency_key": "idemp_col04_1724152530_7e4a1", "status": "COMMITTED", "ledger_tx_id": "LTX-20260820-9981" },
    { "idempotency_key": "idemp_col04_1724152610_8f5b2", "status": "COMMITTED", "ledger_tx_id": "LTX-20260820-9982" },
    { "idempotency_key": "idemp_col04_1724152780_1a2c3", "status": "COMMITTED", "ledger_tx_id": "LTX-20260820-9983" }
  ]
}
```

---

## 7. Bluetooth ESC/POS 58mm Thermal Receipt Generator

### 7.1 Exact ESC/POS Binary Protocol & Hex Command Map

Thermal receipt printers parse raw binary commands defined by the Epson Standard Code for POS (ESC/POS). On 58mm portable printers, line width is 384 dots (48mm printable area at 203 DPI):
- **Font A** ($12 \times 24$ dots): **32 characters per line**.
- **Font B** ($9 \times 17$ dots): **42 characters per line**.

| Command | Hex Opcode | ASCII / Name | Operational Function |
| :--- | :--- | :--- | :--- |
| `INIT` | `1B 40` | `ESC @` | Hardware initialization, resets print buffer and modes. |
| `CODE_PAGE_CP1252` | `1B 74 10` | `ESC t 16` | Select Code Page WPC1252 (Western Latin-1 French accented characters: `é`, `è`, `à`, `ç`, `ù`, `ô`, `ê`, `î`, `û`, `°`). |
| `CODE_PAGE_PC850` | `1B 74 02` | `ESC t 2` | Fallback Multilingual Latin-1 Code Page. |
| `ALIGN_LEFT` | `1B 61 00` | `ESC a 0` | Align text buffer to left margin. |
| `ALIGN_CENTER` | `1B 61 01` | `ESC a 1` | Center alignment across the 32-column line. |
| `ALIGN_RIGHT` | `1B 61 02` | `ESC a 2` | Right alignment. |
| `BOLD_ON` | `1B 45 01` | `ESC E 1` | Turn on bold / emphasized font weight. |
| `BOLD_OFF` | `1B 45 00` | `ESC E 0` | Turn off bold. |
| `DOUBLE_HEIGHT` | `1D 21 01` | `GS ! 1` | $1\times$ width, $2\times$ height font. |
| `DOUBLE_WIDTH` | `1D 21 10` | `GS ! 16` | $2\times$ width, $1\times$ height font. |
| `DOUBLE_BOTH` | `1D 21 11` | `GS ! 17` | $2\times$ width, $2\times$ height font (for headers & grand totals). |
| `NORMAL_SIZE` | `1D 21 00` | `GS ! 0` | Reset font dimensions to $1\times 1$. |
| `FONT_A` | `1B 4D 00` | `ESC M 0` | Select Font A ($12 \times 24$, 32 chars/line). |
| `FONT_B` | `1B 4D 01` | `ESC M 1` | Select Font B ($9 \times 17$, 42 chars/line). |
| `LINE_FEED` | `0A` | `LF` | Print current buffer and advance paper by 1 line. |
| `FEED_N` | `1B 64 n` | `ESC d n` | Feed $n$ lines of paper (e.g. `1B 64 03` feeds 3 lines). |
| `QR_MODEL_2` | `1D 28 6B 04 00 31 41 32 00` | `GS ( k ...` | Select QR Code Model 2. |
| `QR_SET_SIZE` | `1D 28 6B 03 00 31 43 n` | `GS ( k ...` | Set QR module size $n \in [3..6]$ (default 4 for 58mm). |
| `QR_ERROR_CORR` | `1D 28 6B 03 00 31 45 31` | `GS ( k ...` | Set Error Correction Level M (15% redundancy). |
| `QR_STORE_DATA` | `1D 28 6B pL pH 31 50 30 <bytes>` | `GS ( k ...` | Load payload into printer QR buffer ($pL + pH \times 256 = \text{len} + 3$). |
| `QR_PRINT` | `1D 28 6B 03 00 31 51 30` | `GS ( k ...` | Render and print QR code symbol. |
| `CUT_PARTIAL` | `1D 56 42 n` | `GS V 66 n` | Feed $n$ lines and perform partial cut (on supported printers). |

### 7.2 58mm Standard Receipt Format (32-Column Grid Layout)

```
01234567890123456789012345678901 (32 columns)
================================
     COOPEC BANOLIA TERRAIN     
  Agrement BCEAO/UMOA T/1/1420  
     Agence Centrale - Lome     
   Tel: 22 26 21 01 / BP 10151  
================================
*** RECU COTISATION TONTINE *** 
--------------------------------
Recu N°   : TON-20260820-0142
Date      : 20/08/2026 11:15:30
Collecteur: K. MINTA (COL-04)
Terminal  : POS-TERRAIN-004
--------------------------------
Adherent  : AMEGNINOU ABLAVI
Code      : A0200389
Carnet    : CARNET-TONTINE-0883
Etal      : N° 42 - Hall Tissus
--------------------------------
MISE DU JOUR  :      1 000 F.CFA
Nbre de Jours :          2 Jours
Timbres Payes :     J-14 & J-15 
--------------------------------
MONTANT TOTAL :      2 000 F.CFA
(DEUX MILLE FRANCS CFA)
--------------------------------
Cumul Mois    :     15 000 F.CFA
Jours Effectues:        15 / 31 j
Reste a Payer :     16 000 F.CFA
Credit Solde  :          0 F.CFA
--------------------------------
      [ 2D QR CODE AUDIT ]      
  BANOLIA|v1|TON-0142|A0200389..
--------------------------------
Sig   : #7E4A-B829-19FA-C401
Idemp : idemp_col04_1724152530
   Conservez ce reçu de paiement
    BANOLIA : Finance Solidaire 
================================
[Feed 4 lines & Tear]
```

### 7.3 Offline QR Verification Payload Specification
The printed QR code embeds a compact pipe-delimited payload signed with the collector's HMAC secret:

$$\text{Payload} = \text{"BNL|v1|" } \mathbin{\Vert} \text{ReceiptNo} \mathbin{\Vert} \text{"|" } \mathbin{\Vert} \text{MemberCode} \mathbin{\Vert} \text{"|" } \mathbin{\Vert} \text{CardId} \mathbin{\Vert} \text{"|" } \mathbin{\Vert} \text{Amount} \mathbin{\Vert} \text{"|" } \mathbin{\Vert} \text{StampsHex} \mathbin{\Vert} \text{"|" } \mathbin{\Vert} \text{TimestampEpoch} \mathbin{\Vert} \text{"|" } \mathbin{\Vert} \text{HMAC12}$$

Example payload:
`BNL|v1|TON-20260820-0142|A0200389|CARD-0883|2000|0000C000|1724152530|7E4AB82919FA`

Any supervisor or agency auditor scanning this code offline can verify that:
1. The receipt number and member code match.
2. The amount matches.
3. The cryptographic truncated HMAC signature matches the institutional secret key.

---

## 8. Hardware Abstraction Layer & Virtual Thermal Printer Mock

### 8.1 Dart Hardware Abstraction Interface

```dart
enum PrinterStatus { disconnected, scanning, connecting, connected, printing, error }

abstract class BluetoothPrinterDriver {
  /// Scan for nearby Bluetooth thermal printers
  Future<List<BluetoothPrinterDevice>> scanDevices({Duration timeout = const Duration(seconds: 4)});

  /// Connect to a specific printer MAC address / UUID
  Future<bool> connect(String address);

  /// Disconnect current session
  Future<bool> disconnect();

  /// Check connection status
  Future<bool> isConnected();

  /// Send raw ESC/POS byte stream
  Future<PrintResult> sendRawBytes(Uint8List bytes);

  /// Stream of connection / hardware status
  Stream<PrinterStatus> get statusStream;
}

class BluetoothPrinterDevice {
  final String name;
  final String address;
  final int? rssi;

  const BluetoothPrinterDevice({
    required this.name,
    required this.address,
    this.rssi,
  });
}

class PrintResult {
  final bool success;
  final int bytesSent;
  final String? errorMessage;
  final Duration duration;

  const PrintResult({
    required this.success,
    required this.bytesSent,
    this.errorMessage,
    required this.duration,
  });
}
```

### 8.2 Virtual Thermal Printer Mock (`VirtualThermalPrinterMock`)
For unit tests, integration tests, and headless CI runs (where no physical Bluetooth device exists), the `VirtualThermalPrinterMock` provides a full ESC/POS byte interpreter that decodes commands, aligns text into a 32-column canvas, extracts QR payloads, and validates formatting rules.

```dart
class VirtualThermalPrinterMock implements BluetoothPrinterDriver {
  bool _connected = false;
  final List<Uint8List> _receivedJobs = [];
  final StreamController<PrinterStatus> _statusCtrl = StreamController<PrinterStatus>.broadcast();

  @override
  Future<List<BluetoothPrinterDevice>> scanDevices({Duration timeout = const Duration(seconds: 4)}) async {
    return const [
      BluetoothPrinterDevice(name: 'MOCK-POS-58', address: '00:11:22:33:44:55', rssi: -45),
      BluetoothPrinterDevice(name: 'MOCK-MPT-II', address: 'AA:BB:CC:DD:EE:FF', rssi: -60),
    ];
  }

  @override
  Future<bool> connect(String address) async {
    _connected = true;
    _statusCtrl.add(PrinterStatus.connected);
    return true;
  }

  @override
  Future<bool> disconnect() async {
    _connected = false;
    _statusCtrl.add(PrinterStatus.disconnected);
    return true;
  }

  @override
  Future<bool> isConnected() async => _connected;

  @override
  Future<PrintResult> sendRawBytes(Uint8List bytes) async {
    if (!_connected) {
      return PrintResult(
        success: false,
        bytesSent: 0,
        errorMessage: 'Printer not connected',
        duration: Duration.zero,
      );
    }
    _receivedJobs.add(bytes);
    return PrintResult(
      success: true,
      bytesSent: bytes.length,
      duration: const Duration(milliseconds: 25),
    );
  }

  @override
  Stream<PrinterStatus> get statusStream => _statusCtrl.stream;

  List<Uint8List> get receivedJobs => List.unmodifiable(_receivedJobs);
  void clearJobs() => _receivedJobs.clear();

  /// Decodes received raw bytes into structured printer instructions
  List<DecodedEscPosCommand> decodeLastJob() {
    if (_receivedJobs.isEmpty) return [];
    return EscPosDecoder.decode(_receivedJobs.last);
  }

  /// Renders the last receipt as a 32-column formatted text string
  String renderLastReceiptAsText() {
    if (_receivedJobs.isEmpty) return '';
    return EscPosDecoder.renderToText(_receivedJobs.last);
  }
}
```

---

## 9. Dart Implementation Specifications for Worker

### 9.1 ESC/POS Binary Builder (`lib/features/receipt/escpos_builder.dart`)

```dart
class EscPosBuilder {
  final List<int> _buffer = [];

  EscPosBuilder() {
    init();
  }

  EscPosBuilder init() {
    _buffer.addAll([0x1B, 0x40]); // ESC @ (Initialize)
    _buffer.addAll([0x1B, 0x74, 0x10]); // ESC t 16 (CP1252 French Latin-1)
    return this;
  }

  EscPosBuilder align(PrintAlignment alignment) {
    int code = 0;
    switch (alignment) {
      case PrintAlignment.left:
        code = 0x00;
        break;
      case PrintAlignment.center:
        code = 0x01;
        break;
      case PrintAlignment.right:
        code = 0x02;
        break;
    }
    _buffer.addAll([0x1B, 0x61, code]);
    return this;
  }

  EscPosBuilder bold(bool enable) {
    _buffer.addAll([0x1B, 0x45, enable ? 0x01 : 0x00]);
    return this;
  }

  EscPosBuilder size(FontSize size) {
    int code = 0x00;
    switch (size) {
      case FontSize.normal:
        code = 0x00;
        break;
      case FontSize.doubleHeight:
        code = 0x01;
        break;
      case FontSize.doubleWidth:
        code = 0x10;
        break;
      case FontSize.doubleBoth:
        code = 0x11;
        break;
    }
    _buffer.addAll([0x1D, 0x21, code]);
    return this;
  }

  EscPosBuilder text(String str) {
    for (int i = 0; i < str.length; i++) {
      final codeUnit = str.codeUnitAt(i);
      // Map standard French accented characters to CP1252 single-byte codes
      int byte = codeUnit;
      switch (codeUnit) {
        case 0x00E9: byte = 0xE9; break; // é
        case 0x00E8: byte = 0xE8; break; // è
        case 0x00EA: byte = 0xEA; break; // ê
        case 0x00EB: byte = 0xEB; break; // ë
        case 0x00E0: byte = 0xE0; break; // à
        case 0x00E2: byte = 0xE2; break; // â
        case 0x00E7: byte = 0xE7; break; // ç
        case 0x00EE: byte = 0xEE; break; // î
        case 0x00EF: byte = 0xEF; break; // ï
        case 0x00F4: byte = 0xF4; break; // ô
        case 0x00F9: byte = 0xF9; break; // ù
        case 0x00FB: byte = 0xFB; break; // û
        case 0x00B0: byte = 0xB0; break; // °
        default:
          if (codeUnit > 0xFF) byte = 0x3F; // '?' for unmapped Unicode
          break;
      }
      _buffer.add(byte);
    }
    return this;
  }

  EscPosBuilder line([String str = '']) {
    text(str);
    _buffer.add(0x0A); // LF
    return this;
  }

  EscPosBuilder separator([int width = 32, String char = '-']) {
    return line(char * width);
  }

  EscPosBuilder doubleSeparator([int width = 32]) {
    return line('=' * width);
  }

  EscPosBuilder keyValue(String label, String value, {int totalWidth = 32}) {
    final spacesCount = totalWidth - label.length - value.length;
    if (spacesCount > 0) {
      line(label + (' ' * spacesCount) + value);
    } else {
      line('$label: $value');
    }
    return this;
  }

  EscPosBuilder feed([int lines = 1]) {
    _buffer.addAll([0x1B, 0x64, lines]);
    return this;
  }

  EscPosBuilder cut({bool partial = true}) {
    feed(3);
    _buffer.addAll([0x1D, 0x56, partial ? 0x42 : 0x41, 0x03]);
    return this;
  }

  EscPosBuilder qrCode(String data, {int moduleSize = 4}) {
    final dataBytes = utf8.encode(data);
    final len = dataBytes.length + 3;
    final pL = len % 256;
    final pH = len ~/ 256;

    // 1. Model 2
    _buffer.addAll([0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]);
    // 2. Module Size (e.g. 4 dots per module)
    _buffer.addAll([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, moduleSize]);
    // 3. Error Correction Level M
    _buffer.addAll([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31]);
    // 4. Store Payload
    _buffer.addAll([0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30]);
    _buffer.addAll(dataBytes);
    // 5. Print Symbol
    _buffer.addAll([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]);

    return this;
  }

  Uint8List build() => Uint8List.fromList(_buffer);
}

enum PrintAlignment { left, center, right }
enum FontSize { normal, doubleHeight, doubleWidth, doubleBoth }
```

### 9.2 French Amount in Words Converter (`lib/core/utils/french_number_words.dart`)

```dart
class FrenchNumberWords {
  static const _ones = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF'];
  static const _teens = ['DIX', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE', 'DIX-SEPT', 'DIX-HUIT', 'DIX-NEUF'];
  static const _tens = ['', 'DIX', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE', 'SOIXANTE-DIX', 'QUATRE-VINGTS', 'QUATRE-VINGT-DIX'];

  static String convert(int amount) {
    if (amount == 0) return 'ZÉRO FRANC CFA';
    if (amount < 0) return 'MOINS ${convert(amount.abs())}';

    final words = _convertNumber(amount);
    return '$words FRANCS CFA'.trim();
  }

  static String _convertNumber(int n) {
    if (n == 0) return '';
    if (n < 10) return _ones[n];
    if (n < 20) return _teens[n - 10];
    if (n < 100) {
      final ten = n ~/ 10;
      final rem = n % 10;
      if (ten == 7) {
        return rem == 1 ? 'SOIXANTE ET ONZE' : 'SOIXANTE-${_convertNumber(10 + rem)}';
      }
      if (ten == 9) {
        return 'QUATRE-VINGT-${_convertNumber(10 + rem)}';
      }
      if (rem == 0) return ten == 8 ? 'QUATRE-VINGTS' : _tens[ten];
      if (rem == 1 && ten != 8) return '${_tens[ten]} ET UN';
      return '${_tens[ten]}-${_ones[rem]}';
    }
    if (n < 1000) {
      final hundred = n ~/ 100;
      final rem = n % 100;
      final hStr = hundred == 1 ? 'CENT' : '${_ones[hundred]} CENTS';
      if (rem == 0) return hStr;
      final hBase = hundred == 1 ? 'CENT' : '${_ones[hundred]} CENT';
      return '$hBase ${_convertNumber(rem)}';
    }
    if (n < 1000000) {
      final thousand = n ~/ 1000;
      final rem = n % 1000;
      final tStr = thousand == 1 ? 'MILLE' : '${_convertNumber(thousand)} MILLE';
      return rem == 0 ? tStr : '$tStr ${_convertNumber(rem)}';
    }
    if (n < 1000000000) {
      final million = n ~/ 1000000;
      final rem = n % 1000000;
      final mStr = million == 1 ? 'UN MILLION' : '${_convertNumber(million)} MILLIONS';
      return rem == 0 ? mStr : '$mStr ${_convertNumber(rem)}';
    }
    return n.toString();
  }
}
```

---

## 10. Verification Plan & Test Strategy

### 10.1 Test Coverage Matrix

| Test Suite | Focus Area | Test Vectors & Scenarios | Verification Assertion |
| :--- | :--- | :--- | :--- |
| **`tontine_stamp_test.dart`** | Stamp Engine | 1-day (1000 F), 3-day advance (3000 F), partial (500 F), buffer completion | Bitmask bit count matches, correct stamp array indices `[14, 15]`, exact credit buffer arithmetic. |
| **`hash_chain_test.dart`** | Tamper Detection | Record 5 sequential transactions, mutate amount of Tx #2 in memory | Chain verification fails at sequence #2 with `CHAIN_INTEGRITY_VIOLATION`. |
| **`escpos_binary_test.dart`** | Binary Opcode Integrity | Header, Bold, Alignment, CP1252 accents (`é`, `è`, `à`), QR Code | Byte sequence starts with `0x1B, 0x40`, contains `0x1D, 0x28, 0x6B` (QR), `0x1D, 0x56` (Cut), and no line exceeds 32 chars in Font A. |
| **`virtual_printer_test.dart`**| Virtual Mock & HAL | Scan devices, connect, stream 58mm job, decode receipt text | Virtual mock captures 100% of bytes, decodes all text headers and totals without packet loss. |
| **`french_words_test.dart`** | Number to Words | `50000`, `2000`, `1352500`, `71000`, `80000` | Exact French orthography: `"CINQUANTE MILLE FRANCS CFA"`, `"QUATRE-VINGTS MILLE FRANCS CFA"`. |
| **`eod_reconciliation_test.dart`**| Shift Reconciliation | Physical billetage vs theoretical total (equal, deficit, surplus) | Correctly identifies `CAISSE_JUSTE`, `MANQUANT` (SFD 471200), `EXCEDENT` (SFD 472200). |
| **`offline_sync_test.dart`** | Outbox Batch Sync | Batch of 10 offline transactions submitted with network retry | Deduplicated via idempotency key, zero duplicates, sequence order strictly preserved. |

---

## 11. Implementation Action Items for Worker

1. **Directory & File Layout**:
   - Create `lib/features/field_collector/domain/models/`: `collector_shift.dart`, `field_member.dart`, `field_tontine_card.dart`, `field_transaction.dart`, `stamp_allocation_result.dart`.
   - Create `lib/features/field_collector/domain/usecases/`: `record_offline_cotisation_usecase.dart`, `allocate_stamps_usecase.dart`, `reconcile_shift_usecase.dart`, `sync_collector_batch_usecase.dart`.
   - Create `lib/features/field_collector/data/`: `local_tontine_journal_repository.dart`, `hash_chain_service.dart`.
   - Create `lib/features/receipt/`: `escpos_builder.dart`, `escpos_decoder.dart`, `tontine_receipt_formatter.dart`, `bluetooth_printer_driver.dart`, `virtual_thermal_printer_mock.dart`.
   - Create `lib/core/utils/`: `french_number_words.dart`, `geolocation_utils.dart`, `hmac_security.dart`.
   - Create `test/features/field_collector/`: Unit and mock test files corresponding to the test matrix.

2. **Integration Touchpoints**:
   - Connect the Field Collector UI (`lib/features/field_collector/presentation/`) with the persistent local store.
   - Wire the Bluetooth receipt print trigger to fire automatically upon successful transaction commit.
