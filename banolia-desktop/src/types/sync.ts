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
  | 'VAULT_TRANSFER'
  | 'TRANSFER';

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
