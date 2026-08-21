export * from './database';
export * from './biometrics';
export * from './shift';
export * from './sync';
export * from './escpos';

// Backward compatible aliases
export interface Member {
  code: string;
  manualNumber: string;
  fullName: string;
  birthDate: string;
  registrationDate: string;
  address: string;
  city: string;
  phone: string;
  spouseName?: string;
  employeeId?: string;
  position?: string;
  hireDate?: string;
  monthlySavingsTarget?: number;
  isPayrollDeduction?: boolean;
  emergencyContact?: string;
  sharesPurchased: number;
  sharesSold: number;
  sharesAvailable: number;
  shareUnitPrice: number;
  status: 'ACTIF' | 'SUSPENDU' | 'RADIE';
  avatarUrl?: string;
  fingerprintEnrolled: boolean;
}

export interface Account {
  accountNumber: string;
  productName: string;
  type: 'SAVINGS' | 'LOAN' | 'DAT' | 'CAREER_PLAN' | 'PROJECT_PLAN' | 'TONTINE' | 'SHARES';
  realBalance: number;
  frozenBalance: number;
  availableBalance: number;
  currency: string;
  status: 'ACTIF' | 'BLOQUE' | 'SOLDE';
}

export interface LoanFile {
  loanNumber: string;
  productName: string;
  amountGranted: number;
  interestRate: number;
  durationMonths: number;
  disbursementDate: string;
  maturityDate: string;
  monthlyPayment: number;
  remainingPrincipal: number;
  overdueAmount: number;
  status: 'EN_COURS' | 'EN_RETARD' | 'CLOTURE' | 'EN_ATTENTE';
}

export interface Transaction {
  id: string;
  receiptNumber: string;
  memberCode: string;
  memberName: string;
  accountNumber: string;
  productName: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'SHARE_PURCHASE' | 'LOAN_REPAYMENT' | 'TONTINE' | 'TRANSFER';
  amount: number;
  feeAmount?: number;
  paymentMethod: 'CASH' | 'TMONEY' | 'FLOOZ' | 'WAVE' | 'MTN_MOMO' | 'ORANGE_MONEY';
  cashierName: string;
  agencyCode: string;
  timestamp: string;
  syncStatus: 'SYNCED' | 'PENDING_OFFLINE';
  idempotencyKey: string;
  previousTxHash?: string;
  signatureHmac?: string;
  sourceAccountNumber?: string;
  destinationAccountNumber?: string;
}

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
