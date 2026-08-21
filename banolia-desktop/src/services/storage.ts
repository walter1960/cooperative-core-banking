import { Member, Account, LoanFile, CashRegister, Transaction } from '../types';
import { initialMembers, initialAccounts, initialLoans, initialCashRegister, initialTransactions } from '../mockData';

const KEYS = {
  MEMBERS: 'banolia_members',
  ACCOUNTS: 'banolia_accounts',
  LOANS: 'banolia_loans',
  CASH: 'banolia_cash_register',
  TRANSACTIONS: 'banolia_transactions',
  OFFLINE_QUEUE: 'banolia_offline_queue',
  IS_OFFLINE_FORCED: 'banolia_offline_forced'
};

export class StorageService {
  static getMembers(): Member[] {
    const data = localStorage.getItem(KEYS.MEMBERS);
    if (!data) {
      localStorage.setItem(KEYS.MEMBERS, JSON.stringify(initialMembers));
      return initialMembers;
    }
    return JSON.parse(data);
  }

  static getAccounts(): Record<string, Account[]> {
    const data = localStorage.getItem(KEYS.ACCOUNTS);
    if (!data) {
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(initialAccounts));
      return initialAccounts;
    }
    return JSON.parse(data);
  }

  static getLoans(): Record<string, LoanFile[]> {
    const data = localStorage.getItem(KEYS.LOANS);
    if (!data) {
      localStorage.setItem(KEYS.LOANS, JSON.stringify(initialLoans));
      return initialLoans;
    }
    return JSON.parse(data);
  }

  static getCashRegister(): CashRegister {
    const data = localStorage.getItem(KEYS.CASH);
    if (!data) {
      localStorage.setItem(KEYS.CASH, JSON.stringify(initialCashRegister));
      return initialCashRegister;
    }
    return JSON.parse(data);
  }

  static getTransactions(): Transaction[] {
    const data = localStorage.getItem(KEYS.TRANSACTIONS);
    if (!data) {
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(initialTransactions));
      return initialTransactions;
    }
    return JSON.parse(data);
  }

  static getOfflineQueue(): Transaction[] {
    const data = localStorage.getItem(KEYS.OFFLINE_QUEUE);
    return data ? JSON.parse(data) : [];
  }

  static isForcedOffline(): boolean {
    return localStorage.getItem(KEYS.IS_OFFLINE_FORCED) === 'true';
  }

  static setForcedOffline(val: boolean) {
    localStorage.setItem(KEYS.IS_OFFLINE_FORCED, val ? 'true' : 'false');
  }

  static processTransaction(
    txData: Omit<Transaction, 'id' | 'receiptNumber' | 'timestamp' | 'syncStatus' | 'idempotencyKey'>,
    isOnline: boolean
  ): { transaction: Transaction; receiptNumber: string } {
    const txCount = this.getTransactions().length + 1;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const receiptNumber = `REC-${dateStr}-${String(txCount).padStart(4, '0')}`;
    const id = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const idempotencyKey = `idemp-${id}`;

    const newTx: Transaction = {
      ...txData,
      id,
      receiptNumber,
      timestamp: `${now.toLocaleDateString('fr-FR')} ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      syncStatus: isOnline ? 'SYNCED' : 'PENDING_OFFLINE',
      idempotencyKey
    };

    // 1. Update Accounts
    const allAccounts = this.getAccounts();
    const memberAccounts = allAccounts[txData.memberCode] || [];
    const targetAcc = memberAccounts.find(a => a.accountNumber === txData.accountNumber);

    if (targetAcc) {
      if (txData.type === 'DEPOSIT') {
        targetAcc.realBalance += txData.amount;
        targetAcc.availableBalance += txData.amount;
      } else if (txData.type === 'WITHDRAWAL') {
        if (targetAcc.availableBalance < txData.amount) {
          throw new Error('Solde disponible insuffisant pour effectuer ce retrait.');
        }
        targetAcc.realBalance -= txData.amount;
        targetAcc.availableBalance -= txData.amount;
      }
      allAccounts[txData.memberCode] = memberAccounts;
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(allAccounts));
    }

    // 2. Update Cash Register
    const cash = this.getCashRegister();
    if (txData.type === 'DEPOSIT') {
      cash.balance += txData.amount;
    } else if (txData.type === 'WITHDRAWAL') {
      cash.balance -= txData.amount;
    }
    localStorage.setItem(KEYS.CASH, JSON.stringify(cash));

    // 3. Save Transaction
    const allTx = this.getTransactions();
    allTx.unshift(newTx);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(allTx));

    // 4. If offline, add to offline sync queue
    if (!isOnline) {
      const queue = this.getOfflineQueue();
      queue.push(newTx);
      localStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    }

    return { transaction: newTx, receiptNumber };
  }

  static syncOfflineQueue(): number {
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return 0;

    const count = queue.length;
    // Mark transactions as synced
    const allTx = this.getTransactions();
    allTx.forEach(tx => {
      if (tx.syncStatus === 'PENDING_OFFLINE') {
        tx.syncStatus = 'SYNCED';
      }
    });

    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(allTx));
    localStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify([]));
    return count;
  }
}
