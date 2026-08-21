import { ShiftStatus } from './shift';
export type { ShiftStatus };
export type MemberStatus = 'ACTIF' | 'SUSPENDU' | 'RADIE';
export type AccountType = 'SAVINGS' | 'LOAN' | 'DAT' | 'CAREER_PLAN' | 'PROJECT_PLAN' | 'TONTINE' | 'SHARES';
export type AccountStatus = 'ACTIF' | 'BLOQUE' | 'SOLDE';
export type LoanStatus = 'EN_ATTENTE' | 'APPROUVE' | 'EN_COURS' | 'EN_RETARD' | 'CLOTURE';
export type InstallmentStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE';
export type BilletageType = 'OPENING' | 'CLOSING' | 'MIDDAY_CHECK';
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'SHARE_PURCHASE' | 'LOAN_REPAYMENT' | 'TONTINE' | 'TRANSFER' | 'VAULT_IN' | 'VAULT_OUT';
export type PaymentMethod = 'CASH' | 'TMONEY' | 'FLOOZ' | 'WAVE' | 'MTN_MOMO' | 'ORANGE_MONEY';
export type SyncStatus = 'SYNCED' | 'PENDING_OFFLINE' | 'IN_FLIGHT' | 'CONFLICT_FAILED';
export type QueueEntity = 'TRANSACTION' | 'MEMBER_ENROLMENT' | 'MEMBER_ENROLLMENT' | 'SHIFT_EVENT' | 'LOAN_APPLICATION' | 'TRANSFER' | 'VAULT_TRANSFER';
export type QueueStatus = 'PENDING' | 'IN_FLIGHT' | 'ACKNOWLEDGED' | 'FAILED_RETRY' | 'FAILED_FATAL';

// 1. Member Entity
export interface DbMember {
  id: string;                         // UUID
  code: string;                       // Primary Key / Unique (e.g. "A0200225")
  manualNumber: string;               // Physical register number (e.g. "610")
  fullName: string;
  birthDate: string;                  // YYYY-MM-DD
  registrationDate: string;           // YYYY-MM-DD
  address: string;
  city: string;
  phone: string;                      // Indexed for quick teller search
  spouseName?: string;
  employeeId?: string;                // Matricule employé
  position?: string;                  // Poste / Fonction
  hireDate?: string;                  // Date d'embauche
  monthlySavingsTarget?: number;      // Épargne mensuelle programmée
  isPayrollDeduction?: boolean;       // Retenue sur salaire DRH
  emergencyContact?: string;          // Contact urgence
  sharesPurchased: number;            // Total shares subscribed
  sharesSold: number;
  sharesAvailable: number;
  shareUnitPrice: number;             // Default 5000 XOF
  status: MemberStatus;
  avatarUrl?: string;
  fingerprintTemplate?: string;       // Encrypted Base64 ISO 19794-2 minutiae
  fingerprintEnrolled: boolean;
  version: number;                    // Version counter for conflict resolution
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 2. Account Entity
export interface DbAccount {
  id: string;
  accountNumber: string;              // Unique (e.g. "25121100A020022501")
  memberCode: string;                 // FK -> DbMember.code
  productCode: string;                // SFD Code (e.g. "251211", "204121", "101100")
  productName: string;
  type: AccountType;
  realBalance: number;                // In XOF (integer cents)
  frozenBalance: number;              // Pledged / Collateral
  availableBalance: number;           // realBalance - frozenBalance
  currency: string;                   // "XOF"
  status: AccountStatus;
  interestRatePercent?: number;       // e.g. 5.5 for DAT
  termDurationMonths?: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// 3. Loan File Entity
export interface DbLoanFile {
  id: string;
  loanNumber: string;                 // Unique (e.g. "CR-2025-089")
  memberCode: string;                 // FK -> DbMember.code
  productName: string;
  amountGranted: number;              // Principal
  interestRate: number;               // Annual %
  durationMonths: number;
  amortizationType: 'CONSTANT_ANNUITY' | 'LINEAR' | 'BULLET' | 'FLAT';
  disbursementDate: string;
  maturityDate: string;
  monthlyPayment: number;
  remainingPrincipal: number;
  overdueAmount: number;
  penaltyRate: number;                // e.g. 2.0% per month overdue
  status: LoanStatus;
  createdAt: string;
  updatedAt: string;
}

// 4. Loan Schedule Installment
export interface DbLoanSchedule {
  id: string;
  loanNumber: string;                 // FK -> DbLoanFile.loanNumber
  installmentNumber: number;          // 1, 2, 3...
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  feeAmount: number;
  totalInstallment: number;
  remainingPrincipal: number;
  paidAmount: number;
  status: InstallmentStatus;
  paidAt?: string;
}

// 5. Cash Shift Entity (Arrêté de Caisse)
export interface DbCashShift {
  id: string;
  shiftCode: string;                  // Unique (e.g. "SHIFT-20260820-001")
  cashierId: string;
  cashierName: string;
  agencyCode: string;
  agencyName: string;
  openedAt: string;
  closedAt?: string;
  openingBalance: number;             // Carried over from previous shift
  totalDeposits: number;              // Sum of all cash deposits
  totalWithdrawals: number;           // Sum of all cash withdrawals
  totalTransfersIn: number;           // Inbound transfers
  totalTransfersOut: number;          // Outbound transfers
  totalVaultIn: number;               // Approvisionnements coffre
  totalVaultOut: number;              // Délestages vers coffre
  theoreticalClosingBalance: number;  // Calculated: opening + dep + vaultIn - wdr - vaultOut
  physicalClosingBalance?: number;    // From physical billetage
  discrepancyAmount?: number;         // physical - theoretical
  discrepancyReason?: string;         // Mandatory if discrepancy != 0
  imputationAccount?: string;         // SFD 471200 (deficit) or 472200 (surplus)
  supervisorId?: string;
  supervisorName?: string;
  supervisorNotes?: string;
  status: ShiftStatus;
  pvSignatureHash?: string;           // SHA-256 of final balance + teller PIN hash
  createdAt: string;
}

// 6. Cash Billetage Entity
export interface DbCashBilletage {
  id: string;
  shiftId: string;                    // FK -> DbCashShift.id
  type: BilletageType;
  // Notes
  b10000: number;                     // 10 000 F
  b5000: number;                      // 5 000 F
  b2000: number;                      // 2 000 F
  b1000: number;                      // 1 000 F
  b500: number;                       // 500 F note
  // Coins
  p500: number;                       // 500 F coin
  p200: number;                       // 200 F coin
  p100: number;                       // 100 F coin
  p50: number;                        // 50 F coin
  p25: number;                        // 25 F coin
  p10: number;                        // 10 F coin
  p5: number;                         // 5 F coin
  totalCalculated: number;            // Sum of all notes and coins
  countedAt: string;
  countedBy: string;
}

// 7. Transaction Entity (Grand Livre Guichet)
export interface DbTransaction {
  id: string;
  receiptNumber: string;              // Sequential (e.g. "REC-20260820-0042")
  shiftId: string;                    // FK -> DbCashShift.id
  memberCode: string;                 // FK -> DbMember.code
  memberName: string;
  accountNumber: string;              // FK -> DbAccount.accountNumber
  productName: string;
  type: TransactionType;
  amount: number;                     // > 0
  feeAmount: number;
  paymentMethod: PaymentMethod;
  cashierName: string;
  agencyCode: string;
  timestamp: string;                  // ISO 8601
  idempotencyKey: string;             // Deterministic SHA-256
  previousTxHash: string;             // Hash chain link for non-repudiation
  signatureHmac: string;              // HMAC-SHA256(payload + previousTxHash)
  syncStatus: SyncStatus;
  syncAttempts: number;
  serverTxId?: string;
  sourceAccountNumber?: string;       // For internal transfers
  destinationAccountNumber?: string;  // For internal transfers
  notes?: string;
  createdAt: string;
}

// 8. Offline Synchronization Queue Entity
export interface DbOfflineSyncQueue {
  id: string;
  entityType: QueueEntity;
  entityId: string;                   // FK to the entity ID
  payloadJson: string;                // Complete JSON payload
  idempotencyKey: string;             // Unique index
  priority: number;                   // 1 (Critical: Shift, Tx) to 10 (Low: Profile edit)
  status: QueueStatus;
  retryCount: number;
  lastError?: string;
  createdAt: string;
  sentAt?: string;
  acknowledgedAt?: string;
}

// 9. Audit Log Entity
export interface DbAuditLog {
  id: string;
  userId: string;
  action: string;                     // e.g. "FINANCIAL_DEPOSIT", "SHIFT_RECONCILIATION"
  resourceType: string;
  resourceId: string;
  beforeStateJson?: string;
  afterStateJson?: string;
  ipAddress?: string;
  deviceFingerprint: string;
  timestamp: string;
}
