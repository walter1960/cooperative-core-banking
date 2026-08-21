import Dexie from 'dexie';
import { db, BanoliaDatabase } from './database';
import { CryptoService } from '../services/crypto/CryptoService';
import {
  DbTransaction,
  DbOfflineSyncQueue,
  DbAuditLog,
  DbAccount,
  PaymentMethod,
  TransactionType
} from '../types/database';

export interface ProcessTransactionParams {
  memberCode: string;
  memberName: string;
  accountNumber: string;
  productName: string;
  type: TransactionType;
  amount: number;
  feeAmount?: number;
  paymentMethod: PaymentMethod;
  cashierName: string;
  cashierId: string;
  agencyCode: string;
  isOnline: boolean;
  destinationAccountNumber?: string;
  notes?: string;
}

export class TransactionManager {
  /**
   * Executes a financial operation atomically across Accounts, Cash Shifts,
   * Transactions, Sync Queue, and Audit Logs.
   */
  static async executeFinancialOperation(
    params: ProcessTransactionParams,
    customDb?: BanoliaDatabase
  ): Promise<{
    transaction: DbTransaction;
    receiptNumber: string;
  }> {
    const targetDb = customDb || db;
    const fee = params.feeAmount || 0;
    const totalAmount = params.amount + fee;

    if (params.amount <= 0) {
      throw new Error('Le montant de l\'opération doit être strictement positif.');
    }

    return await targetDb.transaction(
      'rw',
      [
        targetDb.accounts,
        targetDb.cashShifts,
        targetDb.transactions,
        targetDb.syncQueue,
        targetDb.auditLogs
      ],
      async () => {
        // 1. Fetch & Validate Active Cash Shift
        const activeShift = await targetDb.cashShifts
          .filter(s => s.status === 'OPEN_ACTIVE' || (s.status as string) === 'OPEN')
          .first();

        if (!activeShift) {
          throw new Error('Aucune caisse ouverte. Veuillez ouvrir votre caisse avant toute opération.');
        }

        // 2. Fetch & Validate Target Account
        const account = await targetDb.accounts
          .where('accountNumber')
          .equals(params.accountNumber)
          .first();

        if (!account) {
          throw new Error(`Compte source ${params.accountNumber} introuvable.`);
        }
        if (account.status !== 'ACTIF') {
          throw new Error(`Le compte ${params.accountNumber} est ${account.status}. Opération refusée.`);
        }

        const beforeAccountState = JSON.stringify(account);
        let destAccount: DbAccount | undefined;
        let beforeDestState: string | undefined;

        // 3. Handle Balances by Operation Type
        if (params.type === 'WITHDRAWAL') {
          if (account.availableBalance < totalAmount) {
            throw new Error(
              `Solde disponible insuffisant (${account.availableBalance.toLocaleString('fr-FR')} F.CFA disponibles pour un retrait de ${totalAmount.toLocaleString('fr-FR')} F.CFA).`
            );
          }
          account.realBalance -= totalAmount;
          account.availableBalance -= totalAmount;
          account.version += 1;
          account.updatedAt = new Date().toISOString();
          await targetDb.accounts.put(account);
        } else if (params.type === 'TRANSFER') {
          if (!params.destinationAccountNumber) {
            throw new Error('Compte destinataire requis pour un virement interne.');
          }
          if (params.destinationAccountNumber === params.accountNumber) {
            throw new Error('Le compte source et le compte destinataire ne peuvent être identiques.');
          }

          destAccount = await targetDb.accounts
            .where('accountNumber')
            .equals(params.destinationAccountNumber)
            .first();

          if (!destAccount) {
            throw new Error(`Compte destinataire ${params.destinationAccountNumber} introuvable.`);
          }
          if (destAccount.status !== 'ACTIF') {
            throw new Error(`Le compte destinataire est ${destAccount.status}. Virement refusé.`);
          }

          if (account.availableBalance < totalAmount) {
            throw new Error(
              `Solde disponible insuffisant sur le compte émetteur (${account.availableBalance.toLocaleString('fr-FR')} F.CFA disponibles).`
            );
          }

          beforeDestState = JSON.stringify(destAccount);
          // Debit source
          account.realBalance -= totalAmount;
          account.availableBalance -= totalAmount;
          account.version += 1;
          account.updatedAt = new Date().toISOString();
          await targetDb.accounts.put(account);

          // Credit destination
          destAccount.realBalance += params.amount;
          destAccount.availableBalance += params.amount;
          destAccount.version += 1;
          destAccount.updatedAt = new Date().toISOString();
          await targetDb.accounts.put(destAccount);
        } else {
          // DEPOSIT, SHARE_PURCHASE, TONTINE, LOAN_REPAYMENT
          account.realBalance += params.amount;
          account.availableBalance += params.amount;
          account.version += 1;
          account.updatedAt = new Date().toISOString();
          await targetDb.accounts.put(account);
        }

        // 4. Update Shift Running Totals
        if (params.paymentMethod === 'CASH') {
          if (
            params.type === 'DEPOSIT' ||
            params.type === 'SHARE_PURCHASE' ||
            params.type === 'TONTINE' ||
            params.type === 'LOAN_REPAYMENT'
          ) {
            activeShift.totalDeposits = (activeShift.totalDeposits || 0) + params.amount;
          } else if (params.type === 'WITHDRAWAL') {
            activeShift.totalWithdrawals = (activeShift.totalWithdrawals || 0) + params.amount;
          } else if (params.type === 'VAULT_IN') {
            activeShift.totalVaultIn = (activeShift.totalVaultIn || 0) + params.amount;
          } else if (params.type === 'VAULT_OUT') {
            activeShift.totalVaultOut = (activeShift.totalVaultOut || 0) + params.amount;
          }

          activeShift.theoreticalClosingBalance =
            (activeShift.openingBalance || 0) +
            (activeShift.totalDeposits || 0) +
            (activeShift.totalVaultIn || 0) -
            (activeShift.totalWithdrawals || 0) -
            (activeShift.totalVaultOut || 0);

          await targetDb.cashShifts.put(activeShift);
        }

        // 5. Generate Receipt Number & Idempotency Key
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const txCount = await targetDb.transactions.count();
        const receiptNumber = `REC-${dateStr}-${String(txCount + 1).padStart(4, '0')}`;
        const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        const idempotencyKey = CryptoService.generateIdempotencyKey({
          agencyCode: params.agencyCode,
          cashierId: params.cashierId,
          timestamp: now.toISOString(),
          accountNumber: params.accountNumber,
          amount: params.amount,
          type: params.type
        });

        // 6. Compute Hash Chain Link & HMAC Signature
        const lastTx = await targetDb.transactions.orderBy('createdAt').last();
        const previousTxHash = lastTx ? lastTx.signatureHmac : `GENESIS_${params.agencyCode}`;
        const signatureHmac = await CryptoService.computeTransactionHmac({
          txId,
          receiptNumber,
          accountNumber: params.accountNumber,
          amount: params.amount,
          type: params.type,
          timestamp: now.toISOString(),
          previousTxHash
        });

        // 7. Create & Persist Transaction
        const newTx: DbTransaction = {
          id: txId,
          receiptNumber,
          shiftId: activeShift.id,
          memberCode: params.memberCode,
          memberName: params.memberName,
          accountNumber: params.accountNumber,
          productName: params.productName,
          type: params.type,
          amount: params.amount,
          feeAmount: fee,
          paymentMethod: params.paymentMethod,
          cashierName: params.cashierName,
          agencyCode: params.agencyCode,
          timestamp: now.toISOString(),
          idempotencyKey,
          previousTxHash,
          signatureHmac,
          syncStatus: params.isOnline ? 'SYNCED' : 'PENDING_OFFLINE',
          syncAttempts: 0,
          sourceAccountNumber: params.accountNumber,
          destinationAccountNumber: params.destinationAccountNumber,
          notes: params.notes,
          createdAt: now.toISOString()
        };
        await targetDb.transactions.add(newTx);

        // 8. Queue in Offline Sync Queue
        const queueItem: DbOfflineSyncQueue = {
          id: `queue_${txId}`,
          entityType: 'TRANSACTION',
          entityId: txId,
          payloadJson: JSON.stringify(newTx),
          idempotencyKey,
          priority: 1, // High priority
          status: params.isOnline ? 'ACKNOWLEDGED' : 'PENDING',
          retryCount: 0,
          createdAt: now.toISOString(),
          sentAt: params.isOnline ? now.toISOString() : undefined,
          acknowledgedAt: params.isOnline ? now.toISOString() : undefined
        };
        await targetDb.syncQueue.add(queueItem);

        // 9. Append Regulatory Audit Log
        const auditEntry: DbAuditLog = {
          id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: params.cashierId,
          action: `FINANCIAL_${params.type}`,
          resourceType: 'ACCOUNT',
          resourceId: params.accountNumber,
          beforeStateJson: beforeAccountState,
          afterStateJson: JSON.stringify(account),
          deviceFingerprint: CryptoService.getDeviceFingerprint(),
          timestamp: now.toISOString()
        };
        await targetDb.auditLogs.add(auditEntry);

        if (destAccount && beforeDestState) {
          const destAudit: DbAuditLog = {
            id: `audit_${Date.now()}_dest_${Math.random().toString(36).substring(2, 6)}`,
            userId: params.cashierId,
            action: 'FINANCIAL_TRANSFER_CREDIT',
            resourceType: 'ACCOUNT',
            resourceId: destAccount.accountNumber,
            beforeStateJson: beforeDestState,
            afterStateJson: JSON.stringify(destAccount),
            deviceFingerprint: CryptoService.getDeviceFingerprint(),
            timestamp: now.toISOString()
          };
          await targetDb.auditLogs.add(destAudit);
        }

        return { transaction: newTx, receiptNumber };
      }
    );
  }
}
