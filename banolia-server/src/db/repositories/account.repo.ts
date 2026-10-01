import { db } from '../sqlite';

export interface DbAccountRecord {
  id: string;
  account_number: string;
  member_code: string;
  product_code: string;
  type: string;
  balance: number;
  blocked_balance: number;
  currency: string;
  status: string;
  opened_at: string;
}

export interface DbSavingsLockRecord {
  id: string;
  member_code: string;
  blocked_amount: number;
  percentage: number;
  duration_months: number;
  start_date: string;
  until_date: string;
  status: string;
}

export class AccountRepository {
  public static getByMember(memberCode: string): DbAccountRecord[] {
    return db.prepare('SELECT * FROM accounts WHERE member_code = ?').all(memberCode) as DbAccountRecord[];
  }

  public static getByNumber(accountNumber: string): DbAccountRecord | undefined {
    return db.prepare('SELECT * FROM accounts WHERE account_number = ?').get(accountNumber) as DbAccountRecord | undefined;
  }

  public static create(account: Omit<DbAccountRecord, 'opened_at'>): DbAccountRecord {
    db.prepare(`
      INSERT INTO accounts (id, account_number, member_code, product_code, type, balance, blocked_balance, currency, status)
      VALUES (@id, @account_number, @member_code, @product_code, @type, @balance, @blocked_balance, @currency, @status)
    `).run(account);
    return this.getByNumber(account.account_number)!;
  }

  public static deposit(accountNumber: string, amount: number, reference: string, category: string, subtitle?: string): { success: boolean; newBalance: number } {
    if (amount <= 0) throw new Error('Montant de dépôt invalide');

    const tx = db.transaction(() => {
      const account = this.getByNumber(accountNumber);
      if (!account) throw new Error('Compte introuvable');

      const newBalance = account.balance + amount;
      db.prepare('UPDATE accounts SET balance = ? WHERE account_number = ?').run(newBalance, accountNumber);

      db.prepare(`
        INSERT INTO transactions (id, reference, member_code, account_number, type, amount, category, subtitle)
        VALUES (?, ?, ?, ?, 'DEPOSIT', ?, ?, ?)
      `).run(`TX-${Date.now()}-${Math.floor(Math.random()*1000)}`, reference, account.member_code, accountNumber, amount, category, subtitle || 'Versement d\'épargne');

      return { success: true, newBalance };
    });

    return tx();
  }

  public static withdraw(accountNumber: string, amount: number, reference: string, category: string, subtitle?: string): { success: boolean; newBalance: number } {
    if (amount <= 0) throw new Error('Montant de retrait invalide');

    const tx = db.transaction(() => {
      const account = this.getByNumber(accountNumber);
      if (!account) throw new Error('Compte introuvable');

      const availableLiquid = account.balance - account.blocked_balance;
      if (availableLiquid < amount) {
        throw new Error(`Solde liquide disponible insuffisant (Disponible : ${availableLiquid} F CFA, Bloqué : ${account.blocked_balance} F CFA)`);
      }

      const newBalance = account.balance - amount;
      db.prepare('UPDATE accounts SET balance = ? WHERE account_number = ?').run(newBalance, accountNumber);

      db.prepare(`
        INSERT INTO transactions (id, reference, member_code, account_number, type, amount, category, subtitle)
        VALUES (?, ?, ?, ?, 'WITHDRAWAL', ?, ?, ?)
      `).run(`TX-${Date.now()}-${Math.floor(Math.random()*1000)}`, reference, account.member_code, accountNumber, amount, category, subtitle || 'Retrait au guichet');

      return { success: true, newBalance };
    });

    return tx();
  }

  public static configureLock(params: {
    memberCode: string;
    isBlocked: boolean;
    percentage: number;
    durationMonths: number;
  }): { blockedAmount: number } {
    const tx = db.transaction(() => {
      const savingsAccount = db.prepare(`
        SELECT * FROM accounts 
        WHERE member_code = ? AND product_code = 'EPG_VOLONTAIRE'
      `).get(params.memberCode) as DbAccountRecord | undefined;

      if (!savingsAccount) throw new Error('Compte d\'épargne introuvable pour ce sociétaire');

      if (!params.isBlocked) {
        db.prepare('UPDATE accounts SET blocked_balance = 0 WHERE id = ?').run(savingsAccount.id);
        db.prepare('UPDATE savings_locks SET status = \'CANCELLED\' WHERE member_code = ? AND status = \'ACTIVE\'').run(params.memberCode);
        return { blockedAmount: 0 };
      }

      const blockedAmount = Math.round((savingsAccount.balance * params.percentage) / 100);
      db.prepare('UPDATE accounts SET blocked_balance = ? WHERE id = ?').run(blockedAmount, savingsAccount.id);

      const now = new Date();
      const until = new Date(now);
      until.setMonth(until.getMonth() + params.durationMonths);

      db.prepare('UPDATE savings_locks SET status = \'SUPERSEDED\' WHERE member_code = ? AND status = \'ACTIVE\'').run(params.memberCode);

      db.prepare(`
        INSERT INTO savings_locks (id, member_code, blocked_amount, percentage, duration_months, start_date, until_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
      `).run(
        `LCK-${Date.now()}`,
        params.memberCode,
        blockedAmount,
        params.percentage,
        params.durationMonths,
        now.toISOString(),
        until.toISOString()
      );

      return { blockedAmount };
    });

    return tx();
  }

  public static getTransactionsByMember(memberCode: string, limit: number = 50) {
    return db.prepare(`
      SELECT * FROM transactions 
      WHERE member_code = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(memberCode, limit);
  }
}
