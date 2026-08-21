export type Alignment = 'LEFT' | 'CENTER' | 'RIGHT';
export type TextSize = 'NORMAL' | 'DOUBLE_HEIGHT' | 'DOUBLE_WIDTH' | 'DOUBLE_BOTH';
export type PaperWidth = 80 | 58;

export interface ReceiptMetadata {
  institutionName: string;
  institutionSub: string;
  agrementNo: string;
  agencyCode: string;
  agencyName: string;
  agencyAddress: string;
  agencyPhone: string;
  cashierName: string;
  slogan: string;
}

export interface PrintableTransaction {
  receiptNumber: string;
  memberCode: string;
  memberName: string;
  manualNumber?: string;
  accountNumber: string;
  productName: string;
  type: string;
  amount: number;
  feeAmount?: number;
  paymentMethod: string;
  timestamp: string;
  previousBalance?: number;
  newBalance?: number;
  receivedAmount?: number;
  changeAmount?: number;
  cashierName: string;
  agencyCode: string;
  signatureHmac?: string;
}
