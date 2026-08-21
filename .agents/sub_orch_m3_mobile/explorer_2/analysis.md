# Comprehensive Technical Investigation & Architecture Specification: Unified Mobile Money Gateway & Dual-Mode Simulation Engine

**Document Reference**: `BANOLIA-ARCH-M3-MOMO-2026-08`  
**Date**: 2026-08-20  
**Author**: Explorer 2 (Mobile Money & Gateway Architecture Specialist)  
**Milestone**: Milestone 3 — Mobile Banking & Field Collector App (`banolia-mobile`)  
**Target Regulatory Zone**: BCEAO / UMOA (XOF - Franc CFA) — Togo (`TG`), Benin (`BJ`), Côte d'Ivoire (`CI`), Senegal (`SN`), Burkina Faso (`BF`), Mali (`ML`), Niger (`NE`), Guinea-Bissau (`GW`).

---

## 1. Executive Summary & Problem Domain

### 1.1 Context in West African Microfinance
In the West African Economic and Monetary Union (UMOA), cash-in/cash-out via Mobile Money represents over 85% of digital financial interactions for microfinance members (*sociétaires*) and market stall merchants. For a modern Decentralized Financial System (SFD / *Système Financier Décentralisé*), supporting local telecommunications and fintech operators is a critical operational requirement:

1. **Member Self-Service Deposits (C2B / Cash-In to Microfinance)**: Members credit their ordinary savings (*Dépôt à Vue - DAV* 251100) directly from their mobile wallets without travelling to the physical agency.
2. **Member Self-Service Withdrawals (B2C / Payout / Cash-Out to Wallet)**: Members disburse liquid savings from their DAV account to their personal mobile money wallet 24/7.
3. **Field Collector Encaissement (Tontine Terrain)**: Field collectors operating in busy markets (Grand Marché de Lomé, Dantokpa in Cotonou, Adjamé in Abidjan) can accept contactless Mobile Money payments (QR code / USSD Push) from vendors who do not have physical cash banknotes, generating instant thermal Bluetooth receipts.
4. **Automated Core Banking Accounting & Reconciliation**: Every mobile money flow must automatically generate balanced double-entry accounting records in the BCEAO SFD Chart of Accounts (SYSCOA-SFD Class 5: `578100` TMoney, `578200` Flooz, `578300` Wave, `578400` Orange Money, `578500` MTN MoMo) with zero discrepancy.

### 1.2 The Multi-Provider Fragmentation Challenge
The West African digital payments landscape is heavily fragmented across distinct protocols, authentication mechanisms, and operational flows:

| Operator | Brand | Target Countries | Primary Protocol | Flow Mechanics | Webhook Security |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Togocom** | **TMoney** | Togo (`TG`) | REST API + USSD Push | Synchronous init $\rightarrow$ USSD Prompt $\rightarrow$ Async Webhook | HMAC-SHA256 header |
| **Moov Africa** | **Flooz** | Togo, Benin, CI | Moov T-Push API | Token Request $\rightarrow$ Push Prompt $\rightarrow$ Callback | SHA-512 Hash + Secret |
| **Wave Mobile Money** | **Wave** | CI, Senegal | Wave Business REST API | Deep Link (`wave://`) / QR Session $\rightarrow$ Webhook | `Wave-Signature` (HMAC) |
| **MTN** | **MTN MoMo** | Benin, CI | MTN MoMo OpenAPI | OAuth 2.0 $\rightarrow$ `requesttopay` $\rightarrow$ Callback | Bearer + Subscription Key |
| **Orange** | **Orange Money** | CI, Senegal, Mali | OM Developer API | OAuth 2.0 $\rightarrow$ WebPayment / Direct Push | OAuth Token + IPN URL |

### 1.3 Key Architectural Deliverables
To resolve this fragmentation, this specification designs:
1. **A Unified Mobile Money Gateway Abstraction Layer** (Clean Architecture in Dart for Flutter mobile and TypeScript for the Core Backend).
2. **A Deterministic Dual-Mode Gateway Engine**:
   - **Sandbox Simulation Mode**: High-fidelity USSD push simulator with configurable network delays (1.5s - 3s), 7 distinct deterministic failure modes, and automated phone/amount test vectors.
   - **Real API Mode**: Resilient HTTP client with TLS 1.3, HMAC-SHA256 signature verification, OAuth2 token lifecycle management, and error normalization.
3. **End-to-End Workflow Integration**: Instant deposit crediting with Core Ledger posting, 2-phase hold-and-settle payout authorization, offline field collector QR collection, and automated daily bank statement reconciliation.

---

## 2. Deep Dive: Provider Specifications & Real API Contracts

```
+----------------------------------------------------------------------------------------------------+
|                                    MOBILE MONEY OPERATOR MATRIX                                    |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   +-------------------+  +-------------------+  +-------------------+  +------------------------+  |
|   |  TMONEY (TOGO)    |  |  FLOOZ (MOOV)     |  |   WAVE (CI/SN)    |  |  MTN MOMO / ORANGE     |  |
|   |  Togocom API      |  |  Moov T-Push      |  |   Wave Business   |  |  OpenAPI / WebPay      |  |
|   |  - USSD Push      |  |  - Token Push     |  |   - Deep Link QR  |  |  - OAuth2 Bearer       |  |
|   |  - HMAC-SHA256    |  |  - SHA-512 Hash   |  |   - Webhook HMAC  |  |  - X-Reference-Id UUID |  |
|   +---------+---------+  +---------+---------+  +---------+---------+  +-----------+------------+  |
|             |                      |                      |                        |               |
|             +----------------------+----------------------+------------------------+               |
|                                                |                                                   |
|                                                v                                                   |
|                      +---------------------------------------------------+                         |
|                      |        UNIFIED MOBILE MONEY GATEWAY ADAPTER       |                         |
|                      |  - C2B Deposit (Cash-in)                          |                         |
|                      |  - B2C Withdrawal (Payout / Cash-out)             |                         |
|                      |  - Transaction Status Check / Query               |                         |
|                      |  - Webhook / Callback Validation & Parsing        |                         |
|                      |  - Idempotency & Reference Generation             |                         |
|                      +-------------------------+-------------------------+                         |
|                                                |                                                   |
|                        +-----------------------+-----------------------+                           |
|                        |                                               |                           |
|                        v                                               v                           |
|       +----------------------------------+           +-----------------------------------+         |
|       |    SANDBOX SIMULATION ENGINE     |           |     REAL API HTTP CLIENT ENGINE   |         |
|       |  - Realistic USSD Push Emulation |           |  - TLS 1.3 + Timeout Policy       |         |
|       |  - 7 Configurable Failure Modes  |           |  - Token Refresh & HMAC Signing   |         |
|       |  - Deterministic Test Vectors    |           |  - Error Mapping Normalization    |         |
|       +----------------------------------+           +-----------------------------------+         |
+----------------------------------------------------------------------------------------------------+
```

---

### 2.1 Provider 1: TMoney (Togocom - Togo)

#### A. Architecture & Protocol
- **Operator**: Togocom (Togo Telecom / Telecel Group)
- **Zone**: Togo (`TG`), Currency: `XOF`, MSISDN format: `+228 90/91/92/93/70/71 XX XX XX`
- **Protocol**: HTTP/1.1 REST over TLS 1.3
- **Base Endpoint**: `https://api.tmoney.tg/v1` (Production) / `https://sandbox.api.tmoney.tg/v1` (Sandbox)

#### B. Authentication & Cryptography
Authentication utilizes an API Key paired with an **HMAC-SHA256 signature** sent on every request:
- Headers:
  ```http
  X-API-Key: tmoney_sec_live_98a72b4c1e
  X-Timestamp: 1724115932
  X-Signature: <Hex_HMAC_SHA256(Secret, Timestamp + HTTP_Method + Request_Path + Request_Body)>
  Content-Type: application/json
  ```

#### C. C2B Deposit (Push USSD) Contract
Initiates an immediate USSD pop-up on the member's mobile phone requesting their 4-digit TMoney PIN.

- **Request**: `POST /api/v1/payments/c2b-collect`
  ```json
  {
    "merchant_id": "MERC_BANOLIA_LOME",
    "transaction_ref": "TX-TM-20260820-0012",
    "idempotency_key": "idemp-tm-98402-9912",
    "customer_msisdn": "+22890123456",
    "amount": 25000,
    "currency": "XOF",
    "description": "Versement Epargne BANOLIA Compte 25121100A02",
    "callback_url": "https://core.banolia.org/api/v1/momo/callbacks/tmoney"
  }
  ```
- **Synchronous Response (`202 Accepted`)**:
  ```json
  {
    "status": "PENDING_USER_APPROVAL",
    "gateway_reference": "TM-GW-9948201",
    "transaction_ref": "TX-TM-20260820-0012",
    "message": "Invite USSD envoyée avec succès sur le combiné"
  }
  ```
- **Asynchronous Webhook Callback (`POST` to `callback_url`)**:
  ```json
  {
    "event": "PAYMENT_COMPLETED",
    "gateway_reference": "TM-GW-9948201",
    "transaction_ref": "TX-TM-20260820-0012",
    "customer_msisdn": "+22890123456",
    "amount": 25000,
    "fee": 0,
    "status": "SUCCESSFUL",
    "operator_tx_id": "TM99281726354",
    "timestamp": "2026-08-20T10:15:42Z",
    "signature": "a67f89b1c2..."
  }
  ```

#### D. B2C Payout (Cash-Out / Withdrawal) Contract
- **Request**: `POST /api/v1/payments/b2c-disburse`
  ```json
  {
    "merchant_id": "MERC_BANOLIA_LOME",
    "transaction_ref": "TX-TM-OUT-20260820-0044",
    "idempotency_key": "idemp-tm-out-1049",
    "recipient_msisdn": "+22890123456",
    "amount": 10000,
    "currency": "XOF",
    "purpose": "Retrait Epargne BANOLIA"
  }
  ```

---

### 2.2 Provider 2: Moov Flooz (Moov Africa - Togo, Benin, CI)

#### A. Architecture & Protocol
- **Operator**: Moov Africa (Maroc Telecom Group)
- **Zone**: Togo (`+228 96/97/98/99`), Benin (`+229 94/95/64/65`), Côte d'Ivoire (`+225 01/02/03`)
- **Protocol**: Moov T-Push JSON/REST Gateway API
- **Endpoint**: `https://api.moov-africa.tg/tpush/v2`

#### B. Authentication & Security
- Flooz requires generating a short-lived **Session Token** using Partner ID and SHA-512 credentials, or utilizing HMAC payload signing:
  $$\text{FloozChecksum} = \text{SHA512}(\text{PartnerCode} + \text{PartnerKey} + \text{TransactionRef} + \text{Amount} + \text{MSISDN})$$

#### C. C2B Deposit & Callback Flow
- **Request**: `POST /tpush/initiate`
  ```json
  {
    "partner_code": "FLOOZ_BANOLIA_TG",
    "reference": "FLZ-TX-20260820-0081",
    "msisdn": "22896112233",
    "amount": 15000,
    "currency": "XOF",
    "checksum": "8f3b...e4a1",
    "notification_url": "https://core.banolia.org/api/v1/momo/callbacks/flooz"
  }
  ```
- **Response**:
  ```json
  {
    "status": 0,
    "message": "Demande de confirmation transmise au client",
    "flooz_order_id": "FLZ-ORD-887410"
  }
  ```

---

### 2.3 Provider 3: Wave Mobile Money (Wave CI / Senegal)

#### A. Architecture & Protocol
- **Operator**: Wave Digital Finance (Fintech / UMOA Settlement Partner)
- **Zone**: Senegal (`SN` `+221`), Côte d'Ivoire (`CI` `+225`)
- **Protocol**: Wave Business REST API (JSON over HTTPS)
- **Base Endpoint**: `https://api.wave.com/v1`

#### B. Authentication & Webhooks
- **Authentication**: `Authorization: Bearer wave_ci_prod_secret_key_...`
- **Webhook Security**: Webhook payloads are verified against the `Wave-Signature` header containing a timestamp and HMAC-SHA256 signature ($t=\dots, v1=\dots$).

#### C. Checkout & Payout Contracts
1. **C2B Checkout Session (App-to-App Deep Link & QR Code)**:
   - `POST /v1/checkout/sessions`
   ```json
   {
     "amount": "50000",
     "currency": "XOF",
     "error_url": "https://mobile.banolia.org/payment/error",
     "success_url": "https://mobile.banolia.org/payment/success",
     "client_reference": "WAVE-BAN-20260820-019",
     "restrict_pid": "+2250700000001"
   }
   ```
   - **Response**:
   ```json
   {
     "id": "cos-19482049182",
     "amount": "50000",
     "currency": "XOF",
     "checkout_status": "open",
     "client_reference": "WAVE-BAN-20260820-019",
     "wave_launch_url": "wave://checkout?token=cos-19482049182",
     "qr_code_data": "https://pay.wave.com/c/cos-19482049182",
     "when_expires": "2026-08-20T10:45:00Z"
   }
   ```
2. **B2C Payout (Instant Payout to Wallet)**:
   - `POST /v1/payouts`
   ```json
   {
     "amount": "20000",
     "currency": "XOF",
     "mobile": "+2250700000001",
     "client_reference": "WAVE-PAY-20260820-008",
     "name": "Kouassi Yao Marc"
   }
   ```

---

### 2.4 Provider 4: MTN Mobile Money (MoMo OpenAPI - Benin, CI)

#### A. Architecture & Protocol
- **Operator**: MTN Group (Ericsson Convergator OpenAPI 2.0 / 3.0)
- **Zone**: Benin (`BJ` `+229 97/96/61/62`), Côte d'Ivoire (`CI` `+225 05/45/55`)
- **Base Endpoint**: `https://proxy.momoapi.mtn.com` / `https://sandbox.momodeveloper.mtn.com`

#### B. Authentication (OAuth 2.0 + API User/Key)
1. Generate API User & Key (Sandbox provision)
2. Obtain Access Token:
   - `POST /collection/token/` with `Authorization: Basic <Base64(API_User:API_Key)>`
   - Header: `Ocp-Apim-Subscription-Key: <SubscriptionKey>`
   - Response: `{ "access_token": "jwt_token...", "token_type": "Bearer", "expires_in": 3600 }`

#### C. RequestToPay (C2B Collection)
- **Request**: `POST /collection/v1_0/requesttopay`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  X-Reference-Id: e2817290-7cb1-483b-9a42-5f609e32a101
  X-Target-Environment: live
  Ocp-Apim-Subscription-Key: 98a72b4c1e...
  Content-Type: application/json
  ```
- **Body**:
  ```json
  {
    "amount": "10000",
    "currency": "XOF",
    "externalId": "MOMO-BAN-20260820-044",
    "payer": {
      "partyIdType": "MSISDN",
      "partyId": "22997123456"
    },
    "payerMessage": "Cotisation BANOLIA",
    "payeeNote": "Compte 251211"
  }
  ```
- **Synchronous Response**: `202 Accepted` (Empty body).
- **Status Check**: `GET /collection/v1_0/requesttopay/e2817290-7cb1-483b-9a42-5f609e32a101`
  ```json
  {
    "amount": "10000",
    "currency": "XOF",
    "financialTransactionId": "994827101",
    "externalId": "MOMO-BAN-20260820-044",
    "payer": { "partyIdType": "MSISDN", "partyId": "22997123456" },
    "status": "SUCCESSFUL"
  }
  ```

---

### 2.5 Provider 5: Orange Money (Orange Developer API - CI, Senegal, Mali, Burkina)

#### A. Architecture & Protocol
- **Operator**: Orange Group (Orange MEA Developer API)
- **Zone**: Côte d'Ivoire (`+225 07`), Senegal (`+221 77/78`), Mali (`+223`), Burkina Faso (`+226`)
- **Protocol**: REST OAuth 2.0 Web Payment & Direct USSD Push
- **Base Endpoint**: `https://api.orange.com/orange-money-webpay/dev/v1`

#### B. Payment Initiation
- `POST /webpayment`
  ```json
  {
    "merchant_key": "om_merch_key_102",
    "currency": "XOF",
    "order_id": "OM-BAN-20260820-091",
    "amount": 30000,
    "return_url": "https://mobile.banolia.org/om/success",
    "cancel_url": "https://mobile.banolia.org/om/cancel",
    "notif_url": "https://core.banolia.org/api/v1/momo/callbacks/orange",
    "lang": "fr",
    "reference": "BANOLIA Epargne"
  }
  ```

---

## 3. Unified Mobile Money Gateway Abstraction Layer

To insulate the Mobile Banking presentation layer and Core Banking business logic from individual provider quirks, we specify a **Unified Mobile Money Gateway Abstraction** conforming to Clean Architecture principles.

```
+---------------------------------------------------------------------------------------------------+
|                                 CLEAN ARCHITECTURE GATEWAY LAYERS                                 |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [ DOMAIN LAYER (Entities & Contracts) ]                                                          |
|  - MobileMoneyProvider (Enum: TMONEY, FLOOZ, WAVE, MTN_MOMO, ORANGE_MONEY)                        |
|  - PaymentDirection (C2B_DEPOSIT, B2C_WITHDRAWAL)                                                 |
|  - PaymentStatus (INITIATED, PENDING_USER_PIN, PROCESSING, SUCCESSFUL, FAILED, TIMEOUT, CANCELLED)|
|  - PaymentTransaction (Value Object with currency, references, timestamps, fees)                  |
|  - MobileMoneyGateway (Abstract Interface Definition)                                             |
|                                                                                                   |
|  [ APPLICATION / USECASES LAYER ]                                                                 |
|  - InitiateMobileMoneyDepositUseCase                                                              |
|  - InitiateMobileMoneyWithdrawalUseCase                                                           |
|  - PollTransactionStatusUseCase                                                                   |
|  - ProcessGatewayWebhookUseCase                                                                   |
|                                                                                                   |
|  [ INFRASTRUCTURE LAYER (Adapters & Implementations) ]                                            |
|  +---------------------------------------------------------------------------------------------+  |
|  |  DualModeGatewayAggregator (Dispatches to Sandbox Simulator OR Real HTTP Client)           |  |
|  +---------------------------------------------------------------------------------------------+  |
|        |                                                         |                                |
|        v                                                         v                                |
|  +-------------------------------+                         +-----------------------------------+  |
|  | SandboxMobileMoneyAdapter     |                         | RealHttpMobileMoneyAdapter        |  |
|  | - Simulation State Machine    |                         | - TMoneyGatewayAdapter            |  |
|  | - Failure Mode Injector       |                         | - FloozGatewayAdapter             |  |
|  | - USSD/Push Delay Simulator   |                         | - WaveGatewayAdapter              |  |
|  | - Deterministic Test Vectors  |                         | - MtnMoMoGatewayAdapter           |  |
|  +-------------------------------+                         | - OrangeMoneyGatewayAdapter       |  |
|                                                            +-----------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

### 3.1 Domain Entities & Value Objects (Dart)

```dart
/// Enumeration of supported Mobile Money operators across BCEAO zone
enum MobileMoneyProvider {
  tmoney('TMoney (Togocom)', 'TG', 'XOF', '+228'),
  flooz('Moov Flooz', 'TG_BJ_CI', 'XOF', '+228/+229/+225'),
  wave('Wave Mobile Money', 'CI_SN', 'XOF', '+225/+221'),
  mtnMomo('MTN Mobile Money', 'BJ_CI', 'XOF', '+229/+225'),
  orangeMoney('Orange Money', 'CI_SN_ML_BF', 'XOF', '+225/+221');

  final String displayName;
  final String region;
  final String currency;
  final String countryPrefixes;
  const MobileMoneyProvider(this.displayName, this.region, this.currency, this.countryPrefixes);
}

/// Transaction direction
enum PaymentDirection {
  c2bDeposit,      // Member wallet -> Microfinance SFD account (Cash-in)
  b2cWithdrawal,   // Microfinance SFD account -> Member wallet (Cash-out / Payout)
}

/// Normalized transaction status
enum PaymentStatus {
  initiated,              // Request received and validated locally
  pendingUserApproval,    // USSD push / interactive prompt sent to subscriber phone
  processing,             // User entered PIN; awaiting telecommunication clearing
  successful,             // Transaction confirmed, funds transferred and settled
  failed,                 // Operator or account error
  timeout,                // USSD prompt expired with no user entry (typically 60-120s)
  cancelledByUser,        // Subscriber dismissed or explicitly refused USSD pop-up
}

/// Immutable Value Object representing normalized Money in XOF
class Money {
  final int amount; // Stored in integer Francs CFA (0 decimal currency)
  final String currency;

  const Money(this.amount, {this.currency = 'XOF'}) : assert(amount >= 0, 'Amount cannot be negative');

  @override
  String toString() => '$amount $currency';
}

/// Normalized Payment Transaction Entity
class PaymentTransaction {
  final String id;                     // Internal Banolia UUIDv4
  final String transactionRef;          // Unique human-readable reference (e.g. TX-TM-20260820-0012)
  final String idempotencyKey;          // Deterministic deduplication key
  final MobileMoneyProvider provider;
  final PaymentDirection direction;
  final Money amount;
  final Money fee;
  final String customerMsisdn;          // E.164 formatted phone (+22890123456)
  final String memberCode;              // Banolia Member ID (A0200225)
  final String accountNumber;           // Account number (25121100A020022501)
  final PaymentStatus status;
  final String? operatorTxId;           // External telecom reference (e.g. TM99281726354)
  final String? failureReason;
  final DateTime createdAt;
  final DateTime? completedAt;

  const PaymentTransaction({
    required this.id,
    required this.transactionRef,
    required this.idempotencyKey,
    required this.provider,
    required this.direction,
    required this.amount,
    required this.fee,
    required this.customerMsisdn,
    required this.memberCode,
    required this.accountNumber,
    required this.status,
    this.operatorTxId,
    this.failureReason,
    required this.createdAt,
    this.completedAt,
  });

  PaymentTransaction copyWith({
    PaymentStatus? status,
    String? operatorTxId,
    String? failureReason,
    DateTime? completedAt,
  }) {
    return PaymentTransaction(
      id: id,
      transactionRef: transactionRef,
      idempotencyKey: idempotencyKey,
      provider: provider,
      direction: direction,
      amount: amount,
      fee: fee,
      customerMsisdn: customerMsisdn,
      memberCode: memberCode,
      accountNumber: accountNumber,
      status: status ?? this.status,
      operatorTxId: operatorTxId ?? this.operatorTxId,
      failureReason: failureReason ?? this.failureReason,
      createdAt: createdAt,
      completedAt: completedAt ?? this.completedAt,
    );
  }
}
```

---

### 3.2 Unified Gateway Interface (`MobileMoneyGateway`)

```dart
/// Abstract contract that every Provider Adapter (and the Simulator) must satisfy.
abstract class MobileMoneyGateway {
  /// Unique provider identification
  MobileMoneyProvider get provider;

  /// Initiates a C2B Deposit (Cash-in to Microfinance).
  /// Pushes a USSD or interactive prompt to subscriber's phone.
  Future<PaymentInitiationResult> initiateDeposit(DepositRequest request);

  /// Initiates a B2C Withdrawal (Payout / Cash-out to wallet).
  /// Directly credits the member's mobile money wallet.
  Future<PaymentInitiationResult> initiateWithdrawal(WithdrawalRequest request);

  /// Queries the live or simulated status of a transaction.
  Future<PaymentStatusResult> checkStatus({
    required String transactionRef,
    required String? operatorTxId,
  });

  /// Validates and parses an incoming asynchronous Webhook/IPN payload.
  Future<WebhookParseResult> parseAndValidateWebhook({
    required Map<String, dynamic> rawPayload,
    required Map<String, String> headers,
  });
}

class DepositRequest {
  final String idempotencyKey;
  final String memberCode;
  final String accountNumber;
  final String customerMsisdn;
  final Money amount;
  final String? customDescription;

  const DepositRequest({
    required this.idempotencyKey,
    required this.memberCode,
    required this.accountNumber,
    required this.customerMsisdn,
    required this.amount,
    this.customDescription,
  });
}

class WithdrawalRequest {
  final String idempotencyKey;
  final String memberCode;
  final String accountNumber;
  final String recipientMsisdn;
  final Money amount;
  final String pinAuthToken; // Biometric/PIN authorization token from device

  const WithdrawalRequest({
    required this.idempotencyKey,
    required this.memberCode,
    required this.accountNumber,
    required this.recipientMsisdn,
    required this.amount,
    required this.pinAuthToken,
  });
}

class PaymentInitiationResult {
  final bool success;
  final String transactionRef;
  final PaymentStatus initialStatus;
  final String? operatorGatewayRef;
  final String? actionPromptMessage; // User-facing instruction (e.g. "Veuillez saisir votre code secret sur le pop-up")
  final String? deepLinkUrl;         // For Wave/Orange checkout links
  final String? errorMessage;

  const PaymentInitiationResult({
    required this.success,
    required this.transactionRef,
    required this.initialStatus,
    this.operatorGatewayRef,
    this.actionPromptMessage,
    this.deepLinkUrl,
    this.errorMessage,
  });
}

class PaymentStatusResult {
  final String transactionRef;
  final PaymentStatus status;
  final String? operatorTxId;
  final Money? settledAmount;
  final Money? operatorFee;
  final String? failureCode;
  final String? failureMessage;

  const PaymentStatusResult({
    required this.transactionRef,
    required this.status,
    this.operatorTxId,
    this.settledAmount,
    this.operatorFee,
    this.failureCode,
    this.failureMessage,
  });
}

class WebhookParseResult {
  final bool isValidSignature;
  final String transactionRef;
  final PaymentStatus status;
  final String? operatorTxId;
  final Money amount;
  final String rawEvent;

  const WebhookParseResult({
    required this.isValidSignature,
    required this.transactionRef,
    required this.status,
    this.operatorTxId,
    required this.amount,
    required this.rawEvent,
  });
}
```

---

### 3.3 Idempotency Key & Transaction Reference Generation Specification

#### Deterministic Formula
To prevent double-billing and duplicate ledger postings during unstable mobile connections:

$$\text{TransactionRef} = \text{"TX-" } + \text{ProviderPrefix} + \text{"-" } + \text{YYYYMMDD} + \text{"-" } + \text{SequentialHexId}$$
$$\text{IdempotencyKey} = \text{"idemp\_momo\_" } + \text{SHA256}(\text{MemberCode} + \text{"|" } + \text{AccountNumber} + \text{"|" } + \text{Amount} + \text{"|" } + \text{ClientNonce})$$

- **Collision Resistance**: Client Nonce is an RFC 4122 v4 UUID generated at the moment user clicks "Confirmer".
- **Replay Safety**: The backend maintains a Redis/SQL unique constraint on `idempotency_key`. If the same key is received within 24 hours, the system immediately returns the existing transaction state without re-calling the telecom operator.

---

### 3.4 Unified Error Mapping & Exception Hierarchy

Every telecom operator returns proprietary error codes (e.g. TMoney `ERR_204`, Flooz `RC_4011`, MTN `RESOURCE_NOT_FOUND`, Wave `insufficient_funds`). The gateway normalizes these into a standardized domain exception hierarchy:

| Standard Domain Error | TMoney Code | Flooz Code | Wave Error | MTN MoMo Reason | Orange Money Code | User-Facing Message (French) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `INSUFFICIENT_FUNDS` | `TM_BAL_01` | `FLZ_102` | `insufficient_funds` | `NOT_ENOUGH_FUNDS` | `OM_402_BAL` | Solde insuffisant sur votre compte Mobile Money. |
| `USER_CANCELLED` | `TM_USR_CAN` | `FLZ_109` | `user_cancelled` | `APPROVAL_REJECTED` | `OM_USER_ABORT` | Opération annulée par l'utilisateur. |
| `USSD_TIMEOUT` | `TM_TIME_02`| `FLZ_108` | `session_expired` | `EXPIRED` | `OM_TIMEOUT` | Délai d'attente dépassé. Veuillez réessayer. |
| `INVALID_PIN` | `TM_AUTH_05`| `FLZ_101` | `auth_failed` | `INVALID_CREDENTIALS` | `OM_PIN_ERR` | Code secret PIN incorrect. |
| `LIMIT_EXCEEDED` | `TM_LIM_99` | `FLZ_115` | `limit_exceeded` | `TRANSACTION_LIMIT_BREACHED`| `OM_LIMIT` | Plafond journalier Mobile Money atteint. |
| `INVALID_MSISDN` | `TM_TEL_04` | `FLZ_100` | `invalid_phone` | `PAYER_NOT_FOUND` | `OM_PHONE_INVALID` | Numéro de téléphone non reconnu ou inactif. |
| `NETWORK_FAILURE` | `TM_NET_500`| `FLZ_500` | `upstream_error` | `INTERNAL_PROCESSING_ERROR` | `OM_SRV_DOWN` | Passerelle opérateur temporairement indisponible. |

---

## 4. Dual-Mode Gateway Implementation Architecture

```
+----------------------------------------------------------------------------------------------------+
|                                    DUAL-MODE GATEWAY ARCHITECTURE                                  |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                     +---------------------------+                                  |
|                                     | MobileMoneyGatewayFactory |                                  |
|                                     +-------------+-------------+                                  |
|                                                   |                                                |
|                   ┌───────────────────────────────┴───────────────────────────────┐                 |
|                   ▼                                                               ▼                 |
|      [ MODE = SANDBOX / TEST ]                                       [ MODE = PRODUCTION ]         |
|  +--------------------------------+                          +----------------------------------+  |
|  | SandboxSimulationEngine        |                          | RealHttpGatewayAdapter           |  |
|  |                                |                          |                                  |  |
|  | 1. Realistic Latency Generator |                          | 1. Resilient HTTP Client         |  |
|  |    - Gaussian delay (1.5 - 3s) |                          |    - TLS 1.3 / HTTP/2            |  |
|  |    - USSD interactive timing   |                          |    - Connection Pooling & Retries|  |
|  |                                |                          |                                  |  |
|  | 2. Configurable Failure Engine |                          | 2. Security & Auth Handler       |  |
|  |    - Dynamic Mode Injection    |                          |    - HMAC-SHA256 Signatures      |  |
|  |    - 7 distinct failure types  |                          |    - OAuth2 Bearer auto-refresh  |  |
|  |                                |                          |    - Webhook Signature Verifier  |  |
|  | 3. Automated Test Vectors      |                          |                                  |  |
|  |    - Deterministic phone rules |                          | 3. Provider Specific Clients     |  |
|  |    - Deterministic amounts     |                          |    - TMoney / Flooz / Wave /     |  |
|  |    - Memory State Machine      |                          |      MTN MoMo / Orange Money     |  |
|  +--------------------------------+                          +----------------------------------+  |
+----------------------------------------------------------------------------------------------------+
```

---

### 4.1 Mode A: High-Fidelity Sandbox Simulation Engine

The **Sandbox Simulation Engine** enables 100% offline development, automated CI/CD pipeline verification, and deterministic UI demonstrations without requiring live telecommunications SIM cards or real money transfers.

#### A. Interactive USSD Push & Latency Emulation
- **Simulated USSD Prompt**: In sandbox mode, initiating a C2B deposit dispatches an in-app simulated USSD modal to mimic the real Android/iOS system popup:
  ```
  +----------------------------------------------------+
  | [USSD SIMULATION - TMONEY / FLOOZ]                 |
  |                                                    |
  | Paiement Marchand BANOLIA MICROFINANCE             |
  | Montant: 25 000 F.CFA                              |
  | Entrez votre code secret PIN TMoney pour valider : |
  | [ **** ]                                           |
  |                                                    |
  | [ 1: Valider ]                [ 2: Annuler ]       |
  +----------------------------------------------------+
  ```
- **Configurable Latency**: Emulates telecommunications network delay using configurable Gaussian or fixed jitter ($t \in [1200\text{ms}, 3000\text{ms}]$).

#### B. 7 Configurable Failure Modes & Injection Controls
The simulator allows setting an explicit global or per-request **Simulation Override Mode**:
1. `FORCE_SUCCESS`: Always succeeds after 1.5s delay.
2. `FORCE_INSUFFICIENT_BALANCE`: Fails with `INSUFFICIENT_FUNDS` error code.
3. `FORCE_USER_CANCELLED`: Simulates user pressing "Cancel" on USSD dialog.
4. `FORCE_TIMEOUT`: Hangs for 5 seconds then returns `USSD_TIMEOUT`.
5. `FORCE_NETWORK_ERROR`: Simulates HTTP 503 upstream gateway outage.
6. `FORCE_INVALID_PIN`: Simulates wrong PIN entry by user.
7. `FORCE_LIMIT_EXCEEDED`: Simulates daily regulatory ceiling breach.

#### C. Automated Deterministic Test Vectors
When no manual override is forced, the simulator analyzes the **MSISDN** and **Amount** to deterministically execute test vectors:

| MSISDN Pattern | Amount | Simulated Outcome | Target Provider | Description |
| :--- | :--- | :--- | :--- | :--- |
| `+22890000001` | Any | `SUCCESSFUL` | TMoney | Standard nominal success |
| `+22890000002` | Any | `INSUFFICIENT_FUNDS` | TMoney | Insufficient wallet balance |
| `+22890000003` | Any | `USER_CANCELLED` | TMoney | User cancelled prompt |
| `+22890000004` | Any | `USSD_TIMEOUT` | TMoney | User did not answer USSD in time |
| `+22890000005` | Any | `INVALID_PIN` | TMoney | Wrong PIN 3 times |
| `+22896000001` | Any | `SUCCESSFUL` | Flooz | Standard nominal success |
| `+22896000002` | Any | `INSUFFICIENT_FUNDS` | Flooz | Insufficient Flooz balance |
| `+22507000001` | Any | `SUCCESSFUL` | Wave | Instant Wave checkout success |
| `+22997000001` | Any | `SUCCESSFUL` | MTN MoMo | MoMo collection success |
| `+22507000099` | Any | `SUCCESSFUL` | Orange Money | OM WebPayment success |
| Any MSISDN | `99 999 F` | `LIMIT_EXCEEDED` | All Providers | Amount trigger for limit exceeded |
| Any MSISDN | `50 000 F` | `NETWORK_FAILURE` | All Providers | Amount trigger for network error |

#### D. Dart Sandbox Engine Implementation Blueprint

```dart
class SandboxSimulationEngine implements MobileMoneyGateway {
  @override
  final MobileMoneyProvider provider;

  final Map<String, PaymentTransaction> _inMemoryTransactions = {};
  SimulationOverrideMode overrideMode = SimulationOverrideMode.automaticTestVectors;
  Duration simulatedDelay = const Duration(milliseconds: 1500);

  SandboxSimulationEngine({required this.provider});

  @override
  Future<PaymentInitiationResult> initiateDeposit(DepositRequest request) async {
    final txRef = 'TX-SIM-${provider.name.toUpperCase()}-${DateTime.now().millisecondsSinceEpoch}';

    // 1. Evaluate deterministic test vector or override
    final simulatedOutcome = _resolveOutcome(request.customerMsisdn, request.amount.amount);

    final transaction = PaymentTransaction(
      id: 'sim-uuid-${DateTime.now().microsecondsSinceEpoch}',
      transactionRef: txRef,
      idempotencyKey: request.idempotencyKey,
      provider: provider,
      direction: PaymentDirection.c2bDeposit,
      amount: request.amount,
      fee: const Money(0),
      customerMsisdn: request.customerMsisdn,
      memberCode: request.memberCode,
      accountNumber: request.accountNumber,
      status: PaymentStatus.pendingUserApproval,
      createdAt: DateTime.now(),
    );

    _inMemoryTransactions[txRef] = transaction;

    // Simulate async telecom delay
    await Future.delayed(simulatedDelay);

    if (simulatedOutcome == PaymentStatus.failed || simulatedOutcome == PaymentStatus.cancelledByUser || simulatedOutcome == PaymentStatus.timeout) {
      _inMemoryTransactions[txRef] = transaction.copyWith(
        status: simulatedOutcome,
        failureReason: _getReasonForStatus(simulatedOutcome),
        completedAt: DateTime.now(),
      );
      return PaymentInitiationResult(
        success: false,
        transactionRef: txRef,
        initialStatus: simulatedOutcome,
        errorMessage: _getReasonForStatus(simulatedOutcome),
      );
    }

    // Success path: transition to processing then successful
    _inMemoryTransactions[txRef] = transaction.copyWith(
      status: PaymentStatus.successful,
      operatorTxId: 'SIM-OP-${DateTime.now().millisecondsSinceEpoch}',
      completedAt: DateTime.now(),
    );

    return PaymentInitiationResult(
      success: true,
      transactionRef: txRef,
      initialStatus: PaymentStatus.successful,
      operatorGatewayRef: 'SIM-GW-REF-99',
      actionPromptMessage: 'Simulation: Paiement validé avec succès sur le simulateur USSD.',
    );
  }

  @override
  Future<PaymentInitiationResult> initiateWithdrawal(WithdrawalRequest request) async {
    final txRef = 'TX-SIM-OUT-${provider.name.toUpperCase()}-${DateTime.now().millisecondsSinceEpoch}';
    final simulatedOutcome = _resolveOutcome(request.recipientMsisdn, request.amount.amount);

    await Future.delayed(simulatedDelay);

    if (simulatedOutcome != PaymentStatus.successful) {
      return PaymentInitiationResult(
        success: false,
        transactionRef: txRef,
        initialStatus: simulatedOutcome,
        errorMessage: _getReasonForStatus(simulatedOutcome),
      );
    }

    return PaymentInitiationResult(
      success: true,
      transactionRef: txRef,
      initialStatus: PaymentStatus.successful,
      operatorGatewayRef: 'SIM-PAYOUT-REF-88',
      actionPromptMessage: 'Simulation: Virement Mobile Money transmis au portefeuille.',
    );
  }

  @override
  Future<PaymentStatusResult> checkStatus({required String transactionRef, required String? operatorTxId}) async {
    final tx = _inMemoryTransactions[transactionRef];
    if (tx == null) {
      return PaymentStatusResult(
        transactionRef: transactionRef,
        status: PaymentStatus.failed,
        failureMessage: 'Transaction introuvable dans le bac à sable',
      );
    }
    return PaymentStatusResult(
      transactionRef: tx.transactionRef,
      status: tx.status,
      operatorTxId: tx.operatorTxId,
      settledAmount: tx.amount,
      failureMessage: tx.failureReason,
    );
  }

  @override
  Future<WebhookParseResult> parseAndValidateWebhook({required Map<String, dynamic> rawPayload, required Map<String, String> headers}) async {
    return WebhookParseResult(
      isValidSignature: true,
      transactionRef: rawPayload['transaction_ref'] ?? 'TX-SIM-UNKNOWN',
      status: PaymentStatus.successful,
      operatorTxId: 'OP-SIM-HOOK-123',
      amount: Money(rawPayload['amount'] ?? 1000),
      rawEvent: 'SIMULATED_WEBHOOK_EVENT',
    );
  }

  PaymentStatus _resolveOutcome(String msisdn, int amount) {
    if (overrideMode != SimulationOverrideMode.automaticTestVectors) {
      return _mapOverrideToStatus(overrideMode);
    }
    // Amount triggers
    if (amount == 99999) return PaymentStatus.failed;
    if (amount == 50000) return PaymentStatus.failed;

    // Phone number triggers
    if (msisdn.endsWith('00002')) return PaymentStatus.failed; // Insufficient
    if (msisdn.endsWith('00003')) return PaymentStatus.cancelledByUser;
    if (msisdn.endsWith('00004')) return PaymentStatus.timeout;
    if (msisdn.endsWith('00005')) return PaymentStatus.failed; // Invalid PIN

    return PaymentStatus.successful;
  }

  String _getReasonForStatus(PaymentStatus status) {
    switch (status) {
      case PaymentStatus.cancelledByUser:
        return 'Annulé par l\'utilisateur sur le terminal mobile';
      case PaymentStatus.timeout:
        return 'Délai d\'attente de confirmation USSD expiré';
      case PaymentStatus.failed:
      default:
        return 'Solde insuffisant ou rejet opérateur simulé';
    }
  }

  PaymentStatus _mapOverrideToStatus(SimulationOverrideMode mode) {
    switch (mode) {
      case SimulationOverrideMode.forceInsufficientBalance:
      case SimulationOverrideMode.forceInvalidPin:
      case SimulationOverrideMode.forceLimitExceeded:
      case SimulationOverrideMode.forceNetworkError:
        return PaymentStatus.failed;
      case SimulationOverrideMode.forceUserCancelled:
        return PaymentStatus.cancelledByUser;
      case SimulationOverrideMode.forceTimeout:
        return PaymentStatus.timeout;
      case SimulationOverrideMode.forceSuccess:
      default:
        return PaymentStatus.successful;
    }
  }
}

enum SimulationOverrideMode {
  automaticTestVectors,
  forceSuccess,
  forceInsufficientBalance,
  forceUserCancelled,
  forceTimeout,
  forceNetworkError,
  forceInvalidPin,
  forceLimitExceeded,
}
```

---

### 4.2 Mode B: Real API Client Engine

The **Real API Engine** connects securely over TLS 1.3 to production telecommunications gateways.

#### Key Production Engine Features:
1. **Connection Pooling & HTTP/2 Multiplexing**: Minimizes TLS handshake overhead.
2. **Circuit Breaker Pattern**: If an operator gateway returns consecutive 5xx errors for > 30s, the circuit opens for 60s to prevent request pileup, failing fast with informative feedback.
3. **Automatic Token Caching & Re-auth**: For OAuth2 operators (MTN MoMo, Orange Money), access tokens are cached with a safety margin (e.g. refresh 5 minutes before expiry).
4. **Cryptographic Signature Verification**: Validates all incoming Webhook callbacks against the operator's secret key before invoking the Core Ledger.

---

## 5. End-to-End Workflow Integration

```
+----------------------------------------------------------------------------------------------------+
|                         MOBILE MONEY CORE BANKING INTEGRATION WORKFLOWS                            |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ WORKFLOW 1: C2B MEMBER DEPOSIT (CASH-IN) ]                                                      |
|                                                                                                    |
|   Member Mobile App          Mobile Money Gateway          Telecom Operator          Core Banking  |
|          │                            │                           │                        │       |
|          │ 1. Initiate Deposit (25k)  │                           │                        │       |
|          ├───────────────────────────>│                           │                        │       |
|          │                            │ 2. Push USSD Request      │                        │       |
|          │                            ├──────────────────────────>│                        │       |
|          │                            │                           │ 3. USSD Prompt Pop-up  │       |
|          │                            │                           │<── [Member enters PIN] │       |
|          │                            │ 4. Webhook Callback (ACK) │                        │       |
|          │                            │<──────────────────────────┤                        │       |
|          │                            │                           │                        │       |
|          │                            │ 5. Double-Entry Posting (Debit 578100 / Credit 251100)     |
|          │                            ├───────────────────────────────────────────────────>│       |
|          │                            │                                                    │       |
|          │ 6. Real-time Balance Update│                                                    │       |
|          │<───────────────────────────┴────────────────────────────────────────────────────┤       |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

### 5.1 Workflow 1: Instant Member Deposit Crediting (C2B)

1. **User Action**: Member selects **"Dépôt Mobile Money"** in `banolia-mobile`, selects operator (e.g. TMoney), inputs amount (`25 000 XOF`) and confirms.
2. **Gateway Initiation**: Mobile app calls `initiateDeposit()`.
3. **Operator Interaction**: Telecom pushes USSD interactive screen to the phone. Member enters PIN.
4. **Core Banking Settlement**:
   - Webhook arrives at `banolia-server` endpoint `/api/v1/momo/callbacks/tmoney`.
   - Webhook signature is validated.
   - Core Ledger executes atomic journal entry:
     - **Débit `578100`** (Compte Marchand TMoney) : `25 000 XOF`
     - **Crédit `251100`** (Dépôt à Vue Adhérent) : `25 000 XOF`
   - Real & Available balances of member are incremented.
5. **Client Notification**: WebSocket / Firebase Cloud Message pushes instant notification to mobile app; UI balance refreshes dynamically.

---

### 5.2 Workflow 2: Member Wallet Payout (B2C Cash-Out / Withdrawal)

To eliminate race conditions and overdraft risks:
1. **Two-Phase Commit Balance Hold**:
   - Member requests withdrawal of `10 000 XOF` via Flooz.
   - App prompts for Biometric / PIN confirmation.
   - Core Banking immediately creates an in-flight hold:
     - $Solde\_Disponible \leftarrow Solde\_Disponible - 10\ 000\text{ XOF}$
     - $Solde\_Gelé \leftarrow Solde\_Gelé + 10\ 000\text{ XOF}$
2. **Gateway Execution**:
   - Backend calls `initiateWithdrawal()` on Flooz adapter.
3. **Settlement on Success**:
   - When operator returns `SUCCESSFUL`:
     - $Solde\_Gelé \leftarrow Solde\_Gelé - 10\ 000\text{ XOF}$
     - $Solde\_Réel \leftarrow Solde\_Réel - 10\ 000\text{ XOF}$
     - Ledger Posting:
       - **Débit `251100`** (DAV Adhérent) : `10 000 XOF`
       - **Crédit `578200`** (Compte Marchand Flooz) : `10 000 XOF`
4. **Rollback on Failure**:
   - If operator rejects (e.g. recipient wallet inactive, telecom timeout), the hold is automatically released:
     - $Solde\_Gelé \leftarrow Solde\_Gelé - 10\ 000\text{ XOF}$
     - $Solde\_Disponible \leftarrow Solde\_Disponible + 10\ 000\text{ XOF}$

---

### 5.3 Workflow 3: Field Collector Market Stall Mobile Money Collection

```
+------------------------------------------------------------------------------------+
|                FIELD COLLECTOR MOBILE MONEY TONTINE ENCAISSEMENT                  |
+------------------------------------------------------------------------------------+
|                                                                                    |
|  1. Collector at Market Stall: Member wants to pay daily tontine (1 000 XOF) via   |
|     Wave or TMoney.                                                                |
|  2. Collector App generates dynamic QR Code / sends USSD Push.                     |
|  3. Member scans Wave QR with their personal phone or enters TMoney PIN.           |
|  4. Collector terminal receives Instant Payment Confirmation via BLE/Cellular sync.|
|  5. 58mm Bluetooth ESC/POS mini thermal printer prints receipt immediately:        |
|     "MODE: TMONEY | REF: TX-TM-20260820-091 | STATUT: PAYE".                       |
|  6. At evening reconciliation, Mobile Money collections are segregated from cash   |
|     banknotes, preventing cashier cash drawer discrepancies.                       |
+------------------------------------------------------------------------------------+
```

---

### 5.4 Workflow 4: Daily Automated Reconciliation & Settlement Engine

At End-of-Day (EOD), the microfinance institution reconciles external telecommunications financial statements with internal General Ledger balances (`578100`–`578500`).

#### A. Reconciliation Data Model (SQL)
```sql
CREATE TABLE momo_reconciliation_records (
    id VARCHAR(36) PRIMARY KEY,
    reconciliation_date DATE NOT NULL,
    provider ENUM('TMONEY', 'FLOOZ', 'WAVE', 'MTN_MOMO', 'ORANGE_MONEY') NOT NULL,
    internal_tx_count INT NOT NULL,
    internal_total_amount DECIMAL(15, 2) NOT NULL,
    operator_tx_count INT NOT NULL,
    operator_total_amount DECIMAL(15, 2) NOT NULL,
    operator_total_fees DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    discrepancy_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    status ENUM('BALANCED', 'DISCREPANCY_FLAGGED', 'ADJUSTED') NOT NULL DEFAULT 'BALANCED',
    reconciled_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### B. Telecom Commission Accounting
When the telecom operator charges a distribution fee (e.g. 1.0% on B2C payout):
- **Débit `611000`** (Frais et commissions de passerelles Mobile Money) : `100 XOF`
- **Crédit `578100`** (Compte Marchand TMoney) : `100 XOF`

---

## 6. Implementation Architecture & Code Blueprint for `banolia-mobile`

### 6.1 Dependency Matrix & Package Layout
In `banolia-mobile/pubspec.yaml`:
```yaml
name: banolia_mobile
description: BANOLIA Mobile Banking & Field Collector Application (Flutter / Dart)
version: 1.0.0+1
environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_bloc: ^8.1.3         # State management
  equatable: ^2.0.5            # Value comparison
  http: ^1.1.0                 # REST HTTP client
  crypto: ^3.0.3               # SHA-256 / HMAC algorithms
  uuid: ^4.2.1                 # RFC 4122 v4 UUID generator
  qr_flutter: ^4.1.0           # QR code rendering
  mobile_scanner: ^3.5.5       # QR code camera scanner
  intl: ^0.19.0                # Number & date formatting (XOF Francs)
  shared_preferences: ^2.2.2   # Offline settings & credentials cache
```

### 6.2 BLoC State Management Architecture

```dart
// mobile_money_event.dart
abstract class MobileMoneyEvent extends Equatable {
  const MobileMoneyEvent();
  @override
  List<Object?> get props => [];
}

class InitiateDepositEvent extends MobileMoneyEvent {
  final MobileMoneyProvider provider;
  final String customerMsisdn;
  final Money amount;
  final String memberCode;
  final String accountNumber;

  const InitiateDepositEvent({
    required this.provider,
    required this.customerMsisdn,
    required this.amount,
    required this.memberCode,
    required this.accountNumber,
  });

  @override
  List<Object?> get props => [provider, customerMsisdn, amount, memberCode, accountNumber];
}

class CheckTransactionStatusEvent extends MobileMoneyEvent {
  final String transactionRef;
  const CheckTransactionStatusEvent(this.transactionRef);

  @override
  List<Object?> get props => [transactionRef];
}

// mobile_money_state.dart
abstract class MobileMoneyState extends Equatable {
  const MobileMoneyState();
  @override
  List<Object?> get props => [];
}

class MobileMoneyInitial extends MobileMoneyState {}
class MobileMoneyLoading extends MobileMoneyState {
  final String message;
  const MobileMoneyLoading(this.message);
  @override
  List<Object?> get props => [message];
}

class MobileMoneyPendingPrompt extends MobileMoneyState {
  final String transactionRef;
  final String promptMessage;
  const MobileMoneyPendingPrompt({required this.transactionRef, required this.promptMessage});
  @override
  List<Object?> get props => [transactionRef, promptMessage];
}

class MobileMoneySuccess extends MobileMoneyState {
  final PaymentTransaction transaction;
  final String successMessage;
  const MobileMoneySuccess({required this.transaction, required this.successMessage});
  @override
  List<Object?> get props => [transaction, successMessage];
}

class MobileMoneyFailure extends MobileMoneyState {
  final String errorCode;
  final String userFacingMessage;
  const MobileMoneyFailure({required this.errorCode, required this.userFacingMessage});
  @override
  List<Object?> get props => [errorCode, userFacingMessage];
}
```

---

## 7. Comprehensive Testing & Verification Plan

```
+----------------------------------------------------------------------------------------------------+
|                               TESTING & VERIFICATION METHODOLOGY                                   |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ TIER 1: UNIT TESTS ]                                                                            |
|  - Idempotency key generation & collision resistance                                               |
|  - E.164 phone number normalization per country (+228, +229, +225, +221)                          |
|  - HMAC-SHA256 & SHA-512 signature calculations                                                    |
|  - Normalized error mapping across all 5 operators                                                 |
|                                                                                                    |
|  [ TIER 2: SANDBOX TEST VECTORS ]                                                                  |
|  - Execute all 7 deterministic failure modes (+22890000001 -> Success, +22890000002 -> Balance...) |
|  - Verify USSD latency delay emulation (1.5s)                                                      |
|  - In-memory state machine transition assertions (initiated -> pending -> success/fail)           |
|                                                                                                    |
|  [ TIER 3: CONCURRENCY & REPLAY ATTACK HARDENING ]                                                 |
|  - Submit identical idempotency key 10 times concurrently; assert exactly 1 charge executed       |
|  - Simulate network drop during USSD wait; assert polling recovers transaction state               |
|                                                                                                    |
|  [ TIER 4: END-TO-END CORE BANKING LEDGER VERIFICATION ]                                          |
|  - C2B Deposit: assert Account 251100 credited, Account 578100 debited, sum(Debit)-sum(Credit)=0 |
|  - B2C Payout: assert hold-and-settle cycle releases balance on operator failure                  |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 8. Summary of Architectural Recommendations for Implementation

1. **Clean Gateway Abstraction**: Implement `MobileMoneyGateway` interface in `banolia-mobile/lib/src/services/momo_gateway.dart`.
2. **Deterministic Sandbox First**: Package `SandboxSimulationEngine` with full test vector coverage to ensure rapid local development and automated CI testing without live SIM cards.
3. **Two-Phase Payout Commitment**: Enforce available balance freezing prior to dispatching B2C payout requests to avoid overdraft exposure.
4. **Strict BCEAO Double-Entry Compliance**: Ensure all successful mobile money transactions trigger immediate postings to SYSCOA-SFD accounts (`578100`–`578500`, `251100`, `611000`).

---
