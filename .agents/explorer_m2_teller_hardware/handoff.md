# Handoff Report: Teller Desk Operations, ESC/POS Thermal Printing & USB Biometrics (ISO 19794-2)

**Document Reference**: `BANOLIA-M2-EXP2-TELLER-HARDWARE-2026-08`  
**Working Directory**: `/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/explorer_m2_teller_hardware`  
**Milestone**: Milestone 2 — Desktop Offline-First Agency App (`banolia-desktop`)  
**Target Zone**: BCEAO / UMOA (XOF - Francs CFA)  

---

## 1. Observation

### 1.1 Existing Codebase State in `banolia-desktop/`
Direct inspection of `/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/banolia-desktop` reveals:
1. **Framework & Dependencies (`package.json`)**:
   - React 19.0.0, TypeScript 5.7.3, Vite 6.1.0, Tailwind CSS 4.3.3, Lucide React 0.475.0.
   - Currently configured as a high-fidelity desktop web application ready for Tauri IPC integration.
2. **Teller Counter (`src/components/CashierDesk.tsx`)**:
   - Supports basic deposits and withdrawals with member selection dropdown and quick cash buttons.
   - Lacks internal transfer (*virement compte à compte*), new account opening wizard (*ouverture de compte*), biometric scan integration trigger, and multi-tender breakdown.
   - Change calculator exists for basic cash operations but lacks currency bill breakdown.
3. **Receipt Component (`src/components/ThermalReceipt.tsx`)**:
   - Implements a basic HTML/CSS print block formatted for 80mm paper using `window.print()`.
   - Lacks raw ESC/POS binary byte stream generation (crucial for native USB POS thermal printers such as Epson TM-T20/T88, Xprinter, Rongta, Bixolon, Citizen).
   - Lacks 58mm compact receipt layout (essential for mobile Bluetooth and compact desktop printers).
   - Accented French characters and French number-to-words spelling (*Montant en toutes lettres*) are missing.
   - Missing 2D QR code ESC/POS raster generation and cash drawer kick pulse command (`ESC p 0 25 250`).
4. **Biometric Support**:
   - `src/types/index.ts` contains only a boolean `fingerprintEnrolled: boolean`.
   - No ISO/IEC 19794-2:2005 Finger Minutiae Record (FMR) binary parser, no minutiae extraction format, no 1:1 verification or 1:N identification matcher, and no hardware HAL bridge or mock driver.
5. **Storage & Services (`src/services/storage.ts`)**:
   - Basic `localStorage` wrapper for transactions and offline queue.
   - Needs enrichment for transfer transactions, account creation events, biometric templates (binary BLOB / Base64), and cashier shift audit events.

---

## 2. Logic Chain

### 2.1 Teller Desk Operations Architecture
In an UMOA microfinance agency (SFD), tellers handle high-volume cash and account operations under strict regulatory control (BCEAO Instruction N° 01/2011/SFD).

```
+---------------------------------------------------------------------------------------------------+
|                                     TELLER DESK ARCHITECTURE                                      |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  |                                    REACT 19 UI LAYER                                        |  |
|  |  +-----------------------+ +-----------------------+ +------------------------------------+  |  |
|  |  | Cash Desk (F3)        | | Quick Member Search   | | Biometric Match Modal (F8)         |  |  |
|  |  | - Deposit / Retrait   | | - Code / Phone / Name | | - Live Fingerprint Scan Animation  |  |  |
|  |  | - Virement Interne    | | - KYC Badge & Status  | | - 1:1 Verification & 1:N Lookup    |  |  |
|  |  | - Quick Cash / Monnaie| | - Photo & Signature   | | - Score Threshold (>= 70%)         |  |  |
|  |  +-----------------------+ +-----------------------+ +------------------------------------+  |  |
|  |  +-----------------------+ +-----------------------+ +------------------------------------+  |  |
|  |  | Account Opening Wizard| | Cash Drawer Trigger   | | Dual Receipt View                  |  |  |
|  |  | - Member Registration | | - ESC/POS Kick Pulse  | | - 80mm Full Agency Ticket          |  |  |
|  |  | - Initial Part Sociale| | - Billetage Monitor   | | - 58mm Compact Mobile Ticket       |  |  |
|  |  +-----------------------+ +-----------------------+ +------------------------------------+  |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                │                                                  |
|                        TypeScript Domain & Service Layer (`src/services/`)                        |
|                                                ▼                                                  |
|  +-----------------------+ +-----------------------+ +-----------------------+ +---------------+  |
|  | TellerService         | | KycService            | | EscPosEngine          | | BiometricHAL  |  |
|  | - Validation & Limits | | - KYC Status Checks   | | - 80mm/58mm Byte Gen  | | - ISO 19794-2 |  |
|  | - Atomic Balance Tx   | | - Anti-Money Launder  | | - QR Code & Drawer    | | - 1:1 & 1:N   |  |
|  | - Transfer Execution  | | - Member 360 Lookup   | | - Number-in-Words FR  | | - Mock Driver |  |
|  +-----------------------+ +-----------------------+ +-----------------------+ +---------------+  |
|                                                │                                                  |
|                                                ▼                                                  |
|  +---------------------------------------------------------------------------------------------+  |
|  |                         LOCAL PERSISTENCE & OFFLINE QUEUE (SQLite/Storage)                  |  |
|  |  - Encrypted Accounts & Ledger                                                              |  |
|  |  - SHA-256 HMAC Idempotency Key Generation                                                  |  |
|  |  - Sequential Gapless Receipt Generator (`REC-YYYYMMDD-XXXX`)                               |  |
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

### 2.2 ESC/POS Receipt Engine: Mathematical & Protocol Blueprint
Standard thermal POS receipt printers expect direct ESC/POS byte commands rather than HTML layout when connected via USB or serial raw endpoints.

#### A. ESC/POS Command Byte Map
| Command | Hex Sequence | Purpose |
|---------|--------------|---------|
| `ESC @` | `0x1B, 0x40` | Initialize printer hardware and clear buffer |
| `ESC t 16` | `0x1B, 0x74, 0x10` | Select Code Page WPC1252 (Western European with French accents: `é`, `è`, `à`, `ç`, `ù`, `ô`, `ê`, `î`, `û`, `°`) |
| `ESC a 0` | `0x1B, 0x61, 0x00` | Left alignment |
| `ESC a 1` | `0x1B, 0x61, 0x01` | Center alignment |
| `ESC a 2` | `0x1B, 0x61, 0x02` | Right alignment |
| `ESC E 1` | `0x1B, 0x45, 0x01` | Bold on |
| `ESC E 0` | `0x1B, 0x45, 0x00` | Bold off |
| `GS ! 0x11` | `0x1D, 0x21, 0x11` | Double width + Double height (for headers and totals) |
| `GS ! 0x00` | `0x1D, 0x21, 0x00` | Normal character size |
| `ESC M 1` | `0x1B, 0x4D, 0x01` | Font B (smaller 9x17 font for dense sub-lines) |
| `ESC M 0` | `0x1B, 0x4D, 0x00` | Font A (standard 12x24 font) |
| `ESC p 0 25 250` | `0x1B, 0x70, 0x00, 0x19, 0xFA` | Pulse to kick open cash drawer connected to RJ11/RJ12 port |
| `GS V 66 3` | `0x1D, 0x56, 0x42, 0x03` | Feed 3 lines and execute partial cut |

#### B. 2D QR Code Generation via ESC/POS Commands
To print the verification and audit QR code (`BANOLIA:REC:REC-20260820-0042:50000:A0200225`):
1. Set QR Model 2: `[0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]`
2. Set Module Size (width of QR dots, e.g. 4 dots): `[0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x04]`
3. Set Error Correction Level (Level M = 15%): `[0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31]`
4. Store QR Data payload: Let $L = \text{payload.length} + 3$, $pL = L \pmod{256}$, $pH = \lfloor L / 256 \rfloor$:
   $$\text{Command} = [0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30, \dots \text{ASCII Bytes} \dots]$$
5. Print QR Code from buffer: `[0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]`

#### C. Receipt Layout Grid Specifications
- **80mm Receipt (Standard Counter)**:
  - Total printable columns: 48 columns (Font A) or 64 columns (Font B).
  - Width: 576 dots @ 203 DPI (72mm).
  - Includes Header, Sub-header, Metadata box, Member details, Operation breakdown, French words line, Balances before/after, Tendered/Change, QR code, and Slogan.
- **58mm Receipt (Compact Counter & Mobile)**:
  - Total printable columns: 32 columns (Font A) or 42 columns (Font B).
  - Width: 384 dots @ 203 DPI (48mm).
  - Compact format with condensed labels.

#### D. French Amount-in-Words Algorithm (*Montant en toutes lettres*)
BCEAO accounting standards mandate writing financial amounts in full French words on every cashier receipt:
- Input: `50000` $\to$ `"CINQUANTE MILLE FRANCS CFA"`
- Input: `1352500` $\to$ `"UN MILLION TROIS CENT CINQUANTE-DEUX MILLE CINQ CENTS FRANCS CFA"`
- Input: `2500` $\to$ `"DEUX MILLE CINQ CENTS FRANCS CFA"`

### 2.3 USB Biometrics (ISO/IEC 19794-2:2005) Specification
Microfinance operations in West Africa rely on biometric verification to prevent identity theft and serve non-literate members. The system implements the **ISO/IEC 19794-2:2005 Finger Minutiae Record (FMR)** format.

#### A. ISO 19794-2 Binary Structure
```
+-------------------------------------------------------------------------------------+
|                  ISO/IEC 19794-2:2005 GENERAL RECORD HEADER (24 Bytes)              |
|  [0..3] Magic: "FMR\0" (0x46, 0x4D, 0x52, 0x00)                                     |
|  [4..7] Version: " 20\0" (0x20, 0x32, 0x30, 0x00)                                   |
|  [8..11] Total Record Length (Big-Endian uint32)                                    |
|  [12..13] CBEFF Product ID: 0x0033                                                  |
|  [14..15] Capture Device ID: 0x0000                                                 |
|  [16..17] Image Width (pixels): 500 (0x01F4)                                        |
|  [18..19] Image Height (pixels): 500 (0x01F4)                                       |
|  [20..21] X Resolution (pixels/cm): 197 (0x00C5 for 500 DPI)                        |
|  [22..23] Y Resolution (pixels/cm): 197 (0x00C5)                                     |
|  [24] Number of Finger Views: 1                                                     |
|  [25] Reserved: 0x00                                                                |
+-------------------------------------------------------------------------------------+
|                  FINGER VIEW HEADER (4 Bytes)                                       |
|  [26] Finger Position (0..10): 2 (Right Index)                                      |
|  [27] View Number (4 bits) & Impression Type (4 bits: 0 = Live plain)               |
|  [28] Finger Quality (0..100): 85                                                   |
|  [29] Minutiae Count N: (e.g. 32 minutiae)                                          |
+-------------------------------------------------------------------------------------+
|                  MINUTIAE DATA ARRAY (6 * N Bytes)                                  |
|  For each minutia k in [0 .. N-1]:                                                  |
|    - Bytes 0..1: [Type (2 bits: 01=End, 10=Bif) | X-Coord (14 bits: 0..16383)]       |
|    - Bytes 2..3: [Reserved (2 bits)              | Y-Coord (14 bits: 0..16383)]       |
|    - Byte 4:     Angle Theta (0..255, where angle_rad = Theta * 2*PI / 256)         |
|    - Byte 5:     Quality q (0..100)                                                 |
+-------------------------------------------------------------------------------------+
```

#### B. Minutiae Extraction and Matching Algorithm
Let $P = \{p_1, p_2, \dots, p_m\}$ be the probe template (live scan) and $R = \{r_1, r_2, \dots, r_n\}$ be the reference template (stored in database).

1. **Alignment Search**:
   Test candidate minutiae pairs $(p_i, r_j)$ as alignment anchors. Compute transformation:
   $$\Delta \theta = \theta(r_j) - \theta(p_i)$$
   $$\begin{bmatrix} x_p' \\ y_p' \end{bmatrix} = \begin{bmatrix} \cos \Delta \theta & -\sin \Delta \theta \\ \sin \Delta \theta & \cos \Delta \theta \end{bmatrix} \begin{bmatrix} x(p_k) - x(p_i) \\ y(p_k) - y(p_i) \end{bmatrix} + \begin{bmatrix} x(r_j) \\ y(r_j) \end{bmatrix}$$
2. **Pairing Criteria**:
   Two minutiae $p_k'$ and $r_l$ match if:
   - Euclidean spatial distance: $\sqrt{(x_p' - x_r)^2 + (y_p' - y_r)^2} \le r_0$ ($r_0 = 15$ pixels)
   - Direction difference: $\min(|\theta_p' - \theta_r|, 360^\circ - |\theta_p' - \theta_r|) \le \theta_0$ ($\theta_0 = 18^\circ$)
   - Type consistency: $(t_p == t_r)$ or $(q_p < 40 \lor q_r < 40)$
3. **Similarity Score Formula**:
   $$\text{Score}(P, R) = \min\left(100, \; \text{round}\left( \frac{2 \cdot k}{m + n} \cdot \left(1 - \frac{\overline{d}}{2 \cdot r_0}\right) \cdot \left(1 - \frac{\overline{\Delta \theta}}{2 \cdot \theta_0}\right) \times 100 \right)\right)$$
   where $k$ is the number of paired minutiae, $\overline{d}$ is the mean distance, and $\overline{\Delta \theta}$ is the mean angle difference.
4. **Decision Thresholds**:
   - $\text{Score} \ge 70$: **AUTHENTICATED / MATCH_SUCCESS**
   - $45 \le \text{Score} < 70$: **RETRY_SCAN**
   - $\text{Score} < 45$: **REJECTED / NO_MATCH**

#### C. Hardware Abstraction Layer & Simulation Mock
- `BiometricDriver`:
  - `initialize()`: Connects to native driver via Tauri IPC (`invoke('biometric_init')`).
  - `captureLive(timeoutMs)`: Triggers USB scanner (DigitalPersona / SecuGen / Futronic), extracts ISO 19794-2 template.
  - `verify1to1(probe, reference)`: Compares probe template against stored template.
  - `identify1toN(probe, candidateList)`: Fast $1:N$ search over enrolled member database.
- `MockBiometricDriver`:
  - Automatically activates in browser dev mode or when no physical USB reader is connected.
  - Generates deterministic ISO 19794-2 binary templates based on member codes.
  - Injects realistic jitter and scan delays (300-500ms) for high-fidelity UI testing and CI verification.

---

## 3. Caveats

1. **Hardware Driver Dependencies**:
   - Physical USB fingerprint scanners (e.g. DigitalPersona U.are.U 4500) require vendor shared libraries (`libdpfpdd.so` on Linux, `dpfpdd.dll` on Windows).
   - In pure browser/test environments, the application must seamlessly fall back to `MockBiometricDriver` without throwing runtime errors.
2. **Printer Interface Flexibility**:
   - Agency environments use either USB direct raw endpoints, network receipt printers (port 9100), or OS-level print spoolers.
   - The receipt engine provides both raw ESC/POS binary generators (`EscPosBuilder`) and standard browser print renderers (`ThermalReceipt80mm`, `ThermalReceipt58mm`) with `@media print` CSS styling.
3. **Accented Characters Encoding**:
   - ESC/POS printers use CP1252 / PC850 code tables for French characters. Raw byte generation must encode string characters via standard table offsets (`0xE9` for `é`, `0xE8` for `è`, `0xE0` for `à`, `0xE7` for `ç`).
4. **Offline Concurrency**:
   - In offline mode, ticket sequencing (`REC-YYYYMMDD-XXXX`) is kept strictly atomic in local storage to prevent duplicate receipt numbers during cashier sessions.

---

## 4. Conclusion & Actionable Implementation Blueprint

### 4.1 Detailed File Structure & Implementation Plan
The following modules must be created/updated in `banolia-desktop/`:

```
banolia-desktop/
├── src/
│   ├── types/
│   │   ├── index.ts               # Core domain models
│   │   ├── biometrics.ts          # ISO 19794-2 types & match interfaces
│   │   ├── escpos.ts              # ESC/POS layout & byte builder types
│   │   └── teller.ts              # Transfer, Account Opening, & Shift types
│   ├── services/
│   │   ├── escpos/
│   │   │   ├── EscPosBuilder.ts   # Binary ESC/POS command & QR generator
│   │   │   ├── ReceiptFormatter.ts# 80mm & 58mm text formatter + French words converter
│   │   │   └── PrinterDriver.ts   # Hardware HAL (USB, Serial, Network, Webview)
│   │   ├── biometrics/
│   │   │   ├── Iso19794Parser.ts  # ISO/IEC 19794-2 FMR binary parser/serializer
│   │   │   ├── MinutiaeMatcher.ts # 1:1 and 1:N minutiae matching engine
│   │   │   ├── BiometricDriver.ts # Hardware HAL interface & bridge
│   │   │   └── MockBiometricDriver.ts # Deterministic simulation driver
│   │   ├── teller/
│   │   │   ├── TellerService.ts   # Deposit, withdrawal, transfer, account opening
│   │   │   └── KycService.ts      # Member KYC validation & 360 lookup
│   │   └── storage.ts             # Enriched offline persistence
│   ├── components/
│   │   ├── CashierDesk.tsx        # Enhanced Teller Desk (Deposits, Retraits, Quick Cash)
│   │   ├── TransferModal.tsx      # Internal account-to-account transfer modal
│   │   ├── AccountOpeningModal.tsx# Member registration & initial share capital wizard
│   │   ├── BiometricAuthModal.tsx # Fingerprint scan & match animation modal
│   │   ├── ThermalReceipt80mm.tsx # 80mm printable thermal receipt view
│   │   ├── ThermalReceipt58mm.tsx # 58mm compact thermal receipt view
│   │   ├── MemberProfile.tsx      # Member 360 profile with KYC indicators
│   │   └── Navigation.tsx         # Navigation tabs with F-key shortcuts
│   └── App.tsx                    # Top-level orchestration & hotkey handling
└── tests/
    ├── escpos.test.ts             # ESC/POS byte sequence & layout tests
    ├── biometrics.test.ts         # ISO 19794-2 parsing & matching tests
    └── teller.test.ts             # Financial operations & transfer tests
```

---

### 4.2 Complete Technical Specifications of Core Modules

#### A. `src/types/biometrics.ts`
```typescript
export interface Minutia {
  x: number; // 0 .. 16383 (14 bits)
  y: number; // 0 .. 16383 (14 bits)
  angle: number; // 0 .. 255 (representing 0 .. 2*PI radians)
  type: 'ENDING' | 'BIFURCATION' | 'OTHER';
  quality: number; // 0 .. 100
}

export interface Iso19794Template {
  formatVersion: string; // ' 20\0'
  recordLength: number;
  cbeffProductId: number;
  imageWidth: number;
  imageHeight: number;
  xResolution: number;
  yResolution: number;
  fingerPosition: number; // 1=Right Thumb, 2=Right Index, etc.
  fingerQuality: number; // 0 .. 100
  minutiae: Minutia[];
  rawBytes?: Uint8Array;
}

export interface BiometricMatchResult {
  matched: boolean;
  score: number; // 0 .. 100
  matchedMinutiaeCount: number;
  memberCode?: string;
  durationMs: number;
  status: 'SUCCESS' | 'NO_MATCH' | 'POOR_QUALITY' | 'TIMEOUT' | 'DEVICE_ERROR';
}

export interface BiometricEnrolment {
  memberCode: string;
  fingerPosition: number;
  templateBase64: string;
  enrolledAt: string;
  quality: number;
}
```

#### B. `src/services/biometrics/Iso19794Parser.ts`
```typescript
import { Iso19794Template, Minutia } from '../../types/biometrics';

export class Iso19794Parser {
  private static readonly MAGIC = 0x464D5200; // "FMR\0"
  private static readonly VERSION_20 = 0x20323000; // " 20\0"

  public static parse(buffer: Uint8Array): Iso19794Template {
    if (buffer.length < 30) {
      throw new Error(`Buffer too short for ISO 19794-2 header: ${buffer.length} bytes`);
    }

    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    const magic = view.getUint32(0, false);
    if (magic !== this.MAGIC) {
      throw new Error(`Invalid ISO 19794-2 Magic header: 0x${magic.toString(16)}`);
    }

    const totalLength = view.getUint32(8, false);
    const cbeffProductId = view.getUint16(12, false);
    const imageWidth = view.getUint16(16, false);
    const imageHeight = view.getUint16(18, false);
    const xResolution = view.getUint16(20, false);
    const yResolution = view.getUint16(22, false);

    const fingerPosition = view.getUint8(26);
    const fingerQuality = view.getUint8(28);
    const minutiaeCount = view.getUint8(29);

    const minutiae: Minutia[] = [];
    let offset = 30;

    for (let i = 0; i < minutiaeCount; i++) {
      if (offset + 6 > buffer.length) break;

      const raw01 = view.getUint16(offset, false);
      const typeBits = (raw01 >> 14) & 0x03;
      const x = raw01 & 0x3FFF;

      const raw23 = view.getUint16(offset + 2, false);
      const y = raw23 & 0x3FFF;

      const angle = view.getUint8(offset + 4);
      const quality = view.getUint8(offset + 5);

      let type: Minutia['type'] = 'OTHER';
      if (typeBits === 1) type = 'ENDING';
      else if (typeBits === 2) type = 'BIFURCATION';

      minutiae.push({ x, y, angle, type, quality });
      offset += 6;
    }

    return {
      formatVersion: ' 20\0',
      recordLength: totalLength,
      cbeffProductId,
      imageWidth,
      imageHeight,
      xResolution,
      yResolution,
      fingerPosition,
      fingerQuality,
      minutiae,
      rawBytes: buffer
    };
  }

  public static serialize(template: Iso19794Template): Uint8Array {
    const minutiaeCount = template.minutiae.length;
    const totalLength = 30 + minutiaeCount * 6;
    const buffer = new Uint8Array(totalLength);
    const view = new DataView(buffer.buffer);

    // General Header
    view.setUint32(0, this.MAGIC, false);
    view.setUint32(4, this.VERSION_20, false);
    view.setUint32(8, totalLength, false);
    view.setUint16(12, template.cbeffProductId || 0x0033, false);
    view.setUint16(14, 0x0000, false); // Device ID
    view.setUint16(16, template.imageWidth || 500, false);
    view.setUint16(18, template.imageHeight || 500, false);
    view.setUint16(20, template.xResolution || 197, false);
    view.setUint16(22, template.yResolution || 197, false);
    view.setUint8(24, 1); // 1 view
    view.setUint8(25, 0); // Reserved

    // View Header
    view.setUint8(26, template.fingerPosition || 2);
    view.setUint8(27, 0x00); // View 0, Impression 0 (live plain)
    view.setUint8(28, template.fingerQuality || 85);
    view.setUint8(29, minutiaeCount);

    // Minutiae
    let offset = 30;
    for (const m of template.minutiae) {
      let typeBits = 0;
      if (m.type === 'ENDING') typeBits = 1;
      else if (m.type === 'BIFURCATION') typeBits = 2;

      const raw01 = (typeBits << 14) | (m.x & 0x3FFF);
      const raw23 = m.y & 0x3FFF;

      view.setUint16(offset, raw01, false);
      view.setUint16(offset + 2, raw23, false);
      view.setUint8(offset + 4, m.angle);
      view.setUint8(offset + 5, m.quality);
      offset += 6;
    }

    return buffer;
  }
}
```

#### C. `src/services/biometrics/MinutiaeMatcher.ts`
```typescript
import { Iso19794Template, Minutia, BiometricMatchResult } from '../../types/biometrics';

export class MinutiaeMatcher {
  private static readonly MAX_DISTANCE = 16; // Spatial tolerance (pixels)
  private static readonly MAX_ANGLE_DIFF = 18; // Angular tolerance (degrees)
  private static readonly MATCH_THRESHOLD = 70; // Acceptance score threshold

  public static match(probe: Iso19794Template, reference: Iso19794Template): BiometricMatchResult {
    const startTime = performance.now();
    const pMin = probe.minutiae;
    const rMin = reference.minutiae;

    if (pMin.length === 0 || rMin.length === 0) {
      return {
        matched: false,
        score: 0,
        matchedMinutiaeCount: 0,
        durationMs: performance.now() - startTime,
        status: 'POOR_QUALITY'
      };
    }

    let maxMatchedPairs = 0;
    let bestMeanDist = 0;
    let bestMeanAngle = 0;

    // Test anchor pairs for alignment
    const sampleLimitP = Math.min(pMin.length, 12);
    const sampleLimitR = Math.min(rMin.length, 12);

    for (let i = 0; i < sampleLimitP; i++) {
      for (let j = 0; j < sampleLimitR; j++) {
        const anchorP = pMin[i];
        const anchorR = rMin[j];

        // Type match preference
        if (anchorP.type !== anchorR.type && anchorP.quality > 50 && anchorR.quality > 50) {
          continue;
        }

        const deltaThetaRad = (anchorR.angle - anchorP.angle) * ((2 * Math.PI) / 256);
        const cosT = Math.cos(deltaThetaRad);
        const sinT = Math.sin(deltaThetaRad);

        let pairedCount = 0;
        let totalDist = 0;
        let totalAngleDiff = 0;
        const usedRefIndices = new Set<number>();

        for (let k = 0; k < pMin.length; k++) {
          const pt = pMin[k];
          const relX = pt.x - anchorP.x;
          const relY = pt.y - anchorP.y;

          const rotX = relX * cosT - relY * sinT + anchorR.x;
          const rotY = relX * sinT + relY * cosT + anchorR.y;
          const rotAngle = (pt.angle + Math.round((deltaThetaRad * 256) / (2 * Math.PI))) & 0xFF;

          let bestMatchIdx = -1;
          let bestDist = Infinity;
          let bestAngleDiff = Infinity;

          for (let l = 0; l < rMin.length; l++) {
            if (usedRefIndices.has(l)) continue;
            const refPt = rMin[l];

            const dx = rotX - refPt.x;
            const dy = rotY - refPt.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= this.MAX_DISTANCE) {
              const angleDiffUnits = Math.abs(rotAngle - refPt.angle);
              const angleDiffDeg = Math.min(angleDiffUnits, 256 - angleDiffUnits) * (360 / 256);

              if (angleDiffDeg <= this.MAX_ANGLE_DIFF && dist < bestDist) {
                bestDist = dist;
                bestAngleDiff = angleDiffDeg;
                bestMatchIdx = l;
              }
            }
          }

          if (bestMatchIdx !== -1) {
            pairedCount++;
            totalDist += bestDist;
            totalAngleDiff += bestAngleDiff;
            usedRefIndices.add(bestMatchIdx);
          }
        }

        if (pairedCount > maxMatchedPairs) {
          maxMatchedPairs = pairedCount;
          bestMeanDist = pairedCount > 0 ? totalDist / pairedCount : 0;
          bestMeanAngle = pairedCount > 0 ? totalAngleDiff / pairedCount : 0;
        }
      }
    }

    const totalMinutiaeAvg = (pMin.length + rMin.length) / 2;
    const pairRatio = maxMatchedPairs / totalMinutiaeAvg;

    const distPenalty = 1 - (bestMeanDist / (2 * this.MAX_DISTANCE));
    const anglePenalty = 1 - (bestMeanAngle / (2 * this.MAX_ANGLE_DIFF));

    const rawScore = Math.min(100, Math.round(pairRatio * distPenalty * anglePenalty * 100));
    const finalScore = isNaN(rawScore) ? 0 : rawScore;
    const isMatch = finalScore >= this.MATCH_THRESHOLD;

    return {
      matched: isMatch,
      score: finalScore,
      matchedMinutiaeCount: maxMatchedPairs,
      durationMs: performance.now() - startTime,
      status: isMatch ? 'SUCCESS' : 'NO_MATCH'
    };
  }
}
```

#### D. `src/services/escpos/EscPosBuilder.ts`
```typescript
export class EscPosBuilder {
  private buffer: number[] = [];

  constructor() {
    this.init();
  }

  public init(): this {
    this.buffer.push(0x1B, 0x40); // ESC @
    this.buffer.push(0x1B, 0x74, 0x10); // ESC t 16 (WPC1252 French)
    return this;
  }

  public align(alignment: 'LEFT' | 'CENTER' | 'RIGHT'): this {
    const code = alignment === 'LEFT' ? 0x00 : alignment === 'CENTER' ? 0x01 : 0x02;
    this.buffer.push(0x1B, 0x61, code);
    return this;
  }

  public bold(enable: boolean): this {
    this.buffer.push(0x1B, 0x45, enable ? 0x01 : 0x00);
    return this;
  }

  public size(size: 'NORMAL' | 'DOUBLE_HEIGHT' | 'DOUBLE_WIDTH' | 'DOUBLE_BOTH'): this {
    const code =
      size === 'NORMAL' ? 0x00 :
      size === 'DOUBLE_HEIGHT' ? 0x10 :
      size === 'DOUBLE_WIDTH' ? 0x01 : 0x11;
    this.buffer.push(0x1D, 0x21, code);
    return this;
  }

  public text(str: string): this {
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      // Map standard French accents to CP1252
      let byte = charCode;
      if (charCode === 0xE9) byte = 0xE9; // é
      else if (charCode === 0xE8) byte = 0xE8; // è
      else if (charCode === 0xE0) byte = 0xE0; // à
      else if (charCode === 0xE7) byte = 0xE7; // ç
      else if (charCode === 0xF9) byte = 0xF9; // ù
      else if (charCode === 0xEA) byte = 0xEA; // ê
      else if (charCode === 0xEB) byte = 0xEB; // ë
      else if (charCode === 0xEE) byte = 0xEE; // î
      else if (charCode === 0xEF) byte = 0xEF; // ï
      else if (charCode === 0xF4) byte = 0xF4; // ô
      else if (charCode === 0xFB) byte = 0xFB; // û
      else if (charCode === 0xB0) byte = 0xB0; // °
      else if (charCode > 0xFF) byte = 0x3F; // '?' for unmapped unicode

      this.buffer.push(byte);
    }
    return this;
  }

  public line(str: string = ''): this {
    this.text(str);
    this.buffer.push(0x0A); // LF
    return this;
  }

  public separator(width: 32 | 48 = 48, char: string = '-'): this {
    return this.line(char.repeat(width));
  }

  public doubleSeparator(width: 32 | 48 = 48): this {
    return this.line('='.repeat(width));
  }

  public feed(lines: number = 1): this {
    this.buffer.push(0x1B, 0x64, lines);
    return this;
  }

  public kickCashDrawer(): this {
    this.buffer.push(0x1B, 0x70, 0x00, 0x19, 0xFA);
    return this;
  }

  public cut(partial: boolean = true): this {
    this.feed(3);
    this.buffer.push(0x1D, 0x56, partial ? 0x42 : 0x41, 0x03);
    return this;
  }

  public qrCode(data: string, moduleSize: number = 4): this {
    const dataBytes = Array.from(new TextEncoder().encode(data));
    const len = dataBytes.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);

    // 1. Model 2
    this.buffer.push(0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
    // 2. Module Size
    this.buffer.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, moduleSize);
    // 3. Error Correction Level M
    this.buffer.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31);
    // 4. Store Data
    this.buffer.push(0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30, ...dataBytes);
    // 5. Print QR
    this.buffer.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30);

    return this;
  }

  public build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}
```

#### E. `src/services/escpos/ReceiptFormatter.ts` (French Amount in Words)
```typescript
export class ReceiptFormatter {
  private static readonly ONES = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF'];
  private static readonly TEENS = ['DIX', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE', 'DIX-SEPT', 'DIX-HUIT', 'DIX-NEUF'];
  private static readonly TENS = ['', 'DIX', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE', 'SOIXANTE-DIX', 'QUATRE-VINGTS', 'QUATRE-VINGT-DIX'];

  public static amountToWordsFR(amount: number): string {
    if (amount === 0) return 'ZÉRO FRANC CFA';
    if (amount < 0) return 'MOINS ' + this.amountToWordsFR(Math.abs(amount));

    const n = Math.floor(amount);
    const words = this.convertNumber(n);
    return `${words} FRANCS CFA`.trim();
  }

  private static convertNumber(n: number): string {
    if (n === 0) return '';
    if (n < 10) return this.ONES[n];
    if (n < 20) return this.TEENS[n - 10];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const rem = n % 10;
      if (ten === 7) {
        return rem === 1 ? 'SOIXANTE ET ONZE' : `SOIXANTE-${this.convertNumber(10 + rem)}`;
      }
      if (ten === 9) {
        return `QUATRE-VINGT-${this.convertNumber(10 + rem)}`;
      }
      if (rem === 0) return ten === 8 ? 'QUATRE-VINGTS' : this.TENS[ten];
      if (rem === 1 && ten !== 8) return `${this.TENS[ten]} ET UN`;
      return `${this.TENS[ten]}-${this.ONES[rem]}`;
    }
    if (n < 1000) {
      const hundred = Math.floor(n / 100);
      const rem = n % 100;
      const hStr = hundred === 1 ? 'CENT' : `${this.ONES[hundred]} CENTS`;
      if (rem === 0) return hStr;
      const hBase = hundred === 1 ? 'CENT' : `${this.ONES[hundred]} CENT`;
      return `${hBase} ${this.convertNumber(rem)}`;
    }
    if (n < 1000000) {
      const thousand = Math.floor(n / 1000);
      const rem = n % 1000;
      const tStr = thousand === 1 ? 'MILLE' : `${this.convertNumber(thousand)} MILLE`;
      return rem === 0 ? tStr : `${tStr} ${this.convertNumber(rem)}`;
    }
    if (n < 1000000000) {
      const million = Math.floor(n / 1000000);
      const rem = n % 1000000;
      const mStr = million === 1 ? 'UN MILLION' : `${this.convertNumber(million)} MILLIONS`;
      return rem === 0 ? mStr : `${mStr} ${this.convertNumber(rem)}`;
    }
    return n.toString();
  }
}
```

---

## 5. Verification Method

### 5.1 Unit & Integration Test Suite
To verify the implementation independently, the Worker will execute:

```bash
cd /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/banolia-desktop
npm test
```

### 5.2 Specific Test Cases Matrix
| Test Suite | Scenario | Input / Vector | Expected Assertion |
|------------|----------|----------------|---------------------|
| `biometrics.test.ts` | ISO 19794-2 Serialization & Parsing | 32 minutiae template with Endings & Bifurcations | Serialized binary header starts with `0x464D5200`, length matches $30 + 32 \times 6 = 222$ bytes, parsed minutiae match coordinates exactly. |
| `biometrics.test.ts` | 1:1 Biometric Verification (Genuine) | Probe generated from same member code with $\pm 2$ px jitter | Matching score $\ge 85\%$, `matched === true`. |
| `biometrics.test.ts` | 1:1 Biometric Verification (Impostor) | Probe from member `A0200226` vs Ref `A0200225` | Matching score $< 30\%$, `matched === false`. |
| `biometrics.test.ts` | 1:N Identification Search | Database of 10 enrolled members, probe of member 3 | Identified member code matches candidate 3 with score $\ge 80\%$. |
| `escpos.test.ts` | ESC/POS 80mm Byte Stream | Receipt with Deposit, Header, QR code, Cut, Drawer | Output byte array contains `0x1B, 0x40` (init), `0x1B, 0x70` (drawer kick), `0x1D, 0x28, 0x6B` (QR), `0x1D, 0x56` (cut). |
| `escpos.test.ts` | Amount to Words (French) | `50000`, `1352500`, `2500` | `"CINQUANTE MILLE FRANCS CFA"`, `"UN MILLION TROIS CENT CINQUANTE-DEUX MILLE CINQ CENTS FRANCS CFA"`. |
| `teller.test.ts` | Cash Withdrawal with Overdraft Check | Account balance $150,000$, attempt withdrawal $200,000$ | Throws Insufficient Balance error, balance unchanged. |
| `teller.test.ts` | Internal Transfer Execution | Member A ($100,000$) $\to$ Member B ($50,000$), transfer $30,000$ | Debited A to $70,000$, credited B to $80,000$, generates dual ledger entries. |
| `teller.test.ts` | Change Calculation & Denomination Breakdown | Operation $37,500$ XOF, Tendered $50,000$ XOF | Change returned $= 12,500$ XOF ($1\times 10000 + 1\times 2000 + 1\times 500$). |

---
**Report Status**: Complete & Actionable. Ready for Worker implementation.
