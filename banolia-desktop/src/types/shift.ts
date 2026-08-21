export type ShiftStatus = 
  | 'UNINITIALIZED'
  | 'OPENING'
  | 'OPEN_ACTIVE'
  | 'CLOSING_COUNT'
  | 'RECONCILIATION'
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
  totalTransfersIn: number;
  totalTransfersOut: number;
  totalVaultTransfersIn: number;
  totalVaultTransfersOut: number;

  theoreticalBalance: number;     // opening + in - out
  physicalClosingBalance?: number;// sum of closing billetage
  discrepancyAmount?: number;     // physical - theoretical
  discrepancyAccount?: '471200' | '472200' | '571200' | 'NONE';
  discrepancyReason?: string;

  closingBilletage?: Billetage;
  digitalSignatureCashier?: string;
  digitalSignatureSupervisor?: string;
  pvHash?: string;
  syncStatus: 'SYNCED' | 'PENDING_OFFLINE';
}

export interface ShiftPVReport {
  shift: CashShift;
  openingBilletage?: Billetage;
  closingBilletage?: Billetage;
  generatedAt: string;
  verificationHash: string;
}
