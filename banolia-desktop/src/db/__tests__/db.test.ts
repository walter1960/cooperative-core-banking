import { describe, it, expect, beforeEach } from 'vitest';
import { BanoliaDatabase } from '../database';
import { seedDatabase } from '../seed';
import { TransactionManager } from '../transactionManager';

describe('Local Database & ACID TransactionManager Integration Tests', () => {
  let testDb: BanoliaDatabase;

  beforeEach(async () => {
    testDb = new BanoliaDatabase(`test_dexie_db_${Date.now()}`);
    await testDb.open();
    await seedDatabase(testDb);
  });

  describe('Database Schema & Seed Data', () => {
    it('should initialize all 9 tables and populate seed data', async () => {
      const members = await testDb.members.toArray();
      const accounts = await testDb.accounts.toArray();
      const loans = await testDb.loanFiles.toArray();
      const shifts = await testDb.cashShifts.toArray();

      expect(members.length).toBeGreaterThanOrEqual(4);
      expect(accounts.length).toBeGreaterThanOrEqual(6);
      expect(loans.length).toBeGreaterThanOrEqual(1);
      expect(shifts.length).toBeGreaterThanOrEqual(1);

      const activeShift = shifts.find(s => s.status === 'OPEN_ACTIVE');
      expect(activeShift).toBeDefined();
      expect(activeShift?.shiftCode).toBe('SHIFT-20260820-001');
    });
  });

  describe('ACID Transaction Execution', () => {
    it('should atomically process cash deposit and update Account, Shift, Journal, Sync, and Audit', async () => {
      const accountBefore = await testDb.accounts.where('accountNumber').equals('25121100A020022501').first();
      const shiftBefore = await testDb.cashShifts.where('status').equals('OPEN_ACTIVE').first();

      const initialRealBal = accountBefore!.realBalance;
      const initialDeposits = shiftBefore!.totalDeposits;

      const res = await TransactionManager.executeFinancialOperation({
        memberCode: 'A0200225',
        memberName: 'MINDIZINA Tomrom',
        accountNumber: '25121100A020022501',
        productName: 'EPARGNE ORDINAIRE (001)',
        type: 'DEPOSIT',
        amount: 25000,
        paymentMethod: 'CASH',
        cashierId: 'CSH-001',
        cashierName: 'MINDIZINA TOMROM',
        agencyCode: 'A02',
        isOnline: false
      }, testDb);

      expect(res.receiptNumber).toMatch(/^REC-\d{8}-\d{4}$/);
      expect(res.transaction.amount).toBe(25000);
      expect(res.transaction.syncStatus).toBe('PENDING_OFFLINE');

      // Check account updated
      const accountAfter = await testDb.accounts.where('accountNumber').equals('25121100A020022501').first();
      expect(accountAfter!.realBalance).toBe(initialRealBal + 25000);
      expect(accountAfter!.availableBalance).toBe(initialRealBal + 25000);

      // Check cash shift running totals updated
      const shiftAfter = await testDb.cashShifts.where('status').equals('OPEN_ACTIVE').first();
      expect(shiftAfter!.totalDeposits).toBe(initialDeposits + 25000);

      // Check outbox item queued
      const queueItem = await testDb.syncQueue.where('entityId').equals(res.transaction.id).first();
      expect(queueItem).toBeDefined();
      expect(queueItem?.status).toBe('PENDING');

      // Check audit log recorded
      const auditLog = await testDb.auditLogs.where('resourceId').equals('25121100A020022501').last();
      expect(auditLog?.action).toBe('FINANCIAL_DEPOSIT');
    });

    it('should atomically process cash withdrawal and decrement account balance', async () => {
      const accountBefore = await testDb.accounts.where('accountNumber').equals('25121100A020022501').first();
      const initialBal = accountBefore!.availableBalance;

      const res = await TransactionManager.executeFinancialOperation({
        memberCode: 'A0200225',
        memberName: 'MINDIZINA Tomrom',
        accountNumber: '25121100A020022501',
        productName: 'EPARGNE ORDINAIRE (001)',
        type: 'WITHDRAWAL',
        amount: 30000,
        paymentMethod: 'CASH',
        cashierId: 'CSH-001',
        cashierName: 'MINDIZINA TOMROM',
        agencyCode: 'A02',
        isOnline: true
      }, testDb);

      const accountAfter = await testDb.accounts.where('accountNumber').equals('25121100A020022501').first();
      expect(accountAfter!.availableBalance).toBe(initialBal - 30000);
      expect(res.transaction.syncStatus).toBe('SYNCED');
    });

    it('should enforce overdraft protection and rollback completely if balance is insufficient', async () => {
      const accountBefore = await testDb.accounts.where('accountNumber').equals('25121100A020022501').first();
      const initialBal = accountBefore!.availableBalance;
      const initialTxCount = await testDb.transactions.count();

      // Attempt withdrawal of 10 000 000 XOF (> available balance)
      await expect(TransactionManager.executeFinancialOperation({
        memberCode: 'A0200225',
        memberName: 'MINDIZINA Tomrom',
        accountNumber: '25121100A020022501',
        productName: 'EPARGNE ORDINAIRE (001)',
        type: 'WITHDRAWAL',
        amount: 10000000,
        paymentMethod: 'CASH',
        cashierId: 'CSH-001',
        cashierName: 'MINDIZINA TOMROM',
        agencyCode: 'A02',
        isOnline: false
      }, testDb)).rejects.toThrow(/Solde disponible insuffisant/);

      // Verify balance and transaction count are strictly unchanged (ACID Rollback)
      const accountAfter = await testDb.accounts.where('accountNumber').equals('25121100A020022501').first();
      expect(accountAfter!.availableBalance).toBe(initialBal);
      const txCountAfter = await testDb.transactions.count();
      expect(txCountAfter).toBe(initialTxCount);
    });

    it('should atomically execute internal account-to-account transfer', async () => {
      const srcAccNo = '25121100A020022501'; // Mindizina (280424 F)
      const destAccNo = '25121100A020022601'; // Agbodjan (800000 F)

      const srcBefore = await testDb.accounts.where('accountNumber').equals(srcAccNo).first();
      const destBefore = await testDb.accounts.where('accountNumber').equals(destAccNo).first();

      const res = await TransactionManager.executeFinancialOperation({
        memberCode: 'A0200225',
        memberName: 'MINDIZINA Tomrom',
        accountNumber: srcAccNo,
        productName: 'EPARGNE ORDINAIRE (001)',
        type: 'TRANSFER',
        amount: 40000,
        paymentMethod: 'CASH',
        cashierId: 'CSH-001',
        cashierName: 'MINDIZINA TOMROM',
        agencyCode: 'A02',
        isOnline: false,
        destinationAccountNumber: destAccNo
      }, testDb);

      expect(res.transaction.type).toBe('TRANSFER');

      const srcAfter = await testDb.accounts.where('accountNumber').equals(srcAccNo).first();
      const destAfter = await testDb.accounts.where('accountNumber').equals(destAccNo).first();

      expect(srcAfter!.availableBalance).toBe(srcBefore!.availableBalance - 40000);
      expect(destAfter!.availableBalance).toBe(destBefore!.availableBalance + 40000);
    });

    it('should maintain cryptographic hash chain between sequential transactions', async () => {
      const tx1 = await TransactionManager.executeFinancialOperation({
        memberCode: 'A0200225',
        memberName: 'MINDIZINA Tomrom',
        accountNumber: '25121100A020022501',
        productName: 'EPARGNE ORDINAIRE (001)',
        type: 'DEPOSIT',
        amount: 10000,
        paymentMethod: 'CASH',
        cashierId: 'CSH-001',
        cashierName: 'MINDIZINA TOMROM',
        agencyCode: 'A02',
        isOnline: true
      }, testDb);

      const tx2 = await TransactionManager.executeFinancialOperation({
        memberCode: 'A0200225',
        memberName: 'MINDIZINA Tomrom',
        accountNumber: '25121100A020022501',
        productName: 'EPARGNE ORDINAIRE (001)',
        type: 'DEPOSIT',
        amount: 15000,
        paymentMethod: 'CASH',
        cashierId: 'CSH-001',
        cashierName: 'MINDIZINA TOMROM',
        agencyCode: 'A02',
        isOnline: true
      }, testDb);

      // Tx2 previousTxHash must point to Tx1 signatureHmac
      expect(tx2.transaction.previousTxHash).toBe(tx1.transaction.signatureHmac);
    });
  });
});
