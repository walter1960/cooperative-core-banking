import Dexie, { Table } from 'dexie';
import {
  DbMember,
  DbAccount,
  DbLoanFile,
  DbLoanSchedule,
  DbCashShift,
  DbCashBilletage,
  DbTransaction,
  DbOfflineSyncQueue,
  DbAuditLog
} from '../types/database';

export class BanoliaDatabase extends Dexie {
  members!: Table<DbMember, string>;
  accounts!: Table<DbAccount, string>;
  loanFiles!: Table<DbLoanFile, string>;
  loanSchedules!: Table<DbLoanSchedule, string>;
  cashShifts!: Table<DbCashShift, string>;
  cashBilletages!: Table<DbCashBilletage, string>;
  transactions!: Table<DbTransaction, string>;
  syncQueue!: Table<DbOfflineSyncQueue, string>;
  auditLogs!: Table<DbAuditLog, string>;

  constructor(dbName: string = 'BanoliaOfflineDB') {
    super(dbName);

    // Define Schema Version 1
    this.version(1).stores({
      members: 'id, &code, manualNumber, phone, fullName, status, fingerprintEnrolled, updatedAt',
      accounts: 'id, &accountNumber, memberCode, productCode, type, status',
      loanFiles: 'id, &loanNumber, memberCode, status',
      loanSchedules: 'id, loanNumber, installmentNumber, status, dueDate',
      cashShifts: 'id, &shiftCode, cashierId, status, openedAt',
      cashBilletages: 'id, shiftId, type',
      transactions: 'id, &receiptNumber, shiftId, memberCode, accountNumber, type, timestamp, createdAt, &idempotencyKey, syncStatus',
      syncQueue: 'id, entityType, entityId, &idempotencyKey, status, priority, createdAt',
      auditLogs: 'id, userId, action, resourceType, resourceId, timestamp'
    });
  }

  /**
   * Request persistent storage to prevent browser eviction
   */
  public async requestPersistence(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    }
    return false;
  }
}

export const db = new BanoliaDatabase();
