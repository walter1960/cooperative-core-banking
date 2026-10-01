import { db } from '../sqlite';

export interface DbCashShiftRecord {
  id: string;
  shift_code: string;
  cashier_id: string;
  agency_id: string;
  opened_at: string;
  closed_at?: string;
  opening_balance: number;
  closing_balance?: number;
  system_balance: number;
  status: 'OPEN' | 'CLOSED';
}

export interface DbTransactionRecord {
  id: string;
  reference: string;
  shift_id?: string;
  member_code?: string;
  account_number?: string;
  type: string; // 'DEPOSIT' | 'WITHDRAWAL' | 'SHARE_PURCHASE' | 'LOAN_DISBURSEMENT' | 'LOAN_REPAYMENT'
  amount: number;
  category: string;
  subtitle?: string;
  created_at: string;
}

export class CaisseRepository {
  public static getActiveShift(): DbCashShiftRecord | undefined {
    return db.prepare('SELECT * FROM cash_shifts WHERE status = \'OPEN\' ORDER BY opened_at DESC LIMIT 1').get() as DbCashShiftRecord | undefined;
  }

  public static getShiftById(id: string): DbCashShiftRecord | undefined {
    return db.prepare('SELECT * FROM cash_shifts WHERE id = ? OR shift_code = ?').get(id, id) as DbCashShiftRecord | undefined;
  }

  public static getAllShifts(limit: number = 50): DbCashShiftRecord[] {
    return db.prepare('SELECT * FROM cash_shifts ORDER BY opened_at DESC LIMIT ?').all(limit) as DbCashShiftRecord[];
  }

  public static openShift(params: {
    cashierId: string;
    agencyId?: string;
    openingBalance: number;
  }): DbCashShiftRecord {
    const existing = this.getActiveShift();
    if (existing) {
      throw new Error(`Une session de caisse est déjà active (${existing.shift_code})`);
    }

    const count = (db.prepare('SELECT COUNT(*) as count FROM cash_shifts').get() as { count: number }).count;
    const shiftCode = `SFT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(3, '0')}`;
    const id = `shift-${Date.now()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO cash_shifts (id, shift_code, cashier_id, agency_id, opened_at, opening_balance, system_balance, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN')
    `).run(
      id,
      shiftCode,
      params.cashierId,
      params.agencyId || 'AG-01',
      now,
      params.openingBalance,
      params.openingBalance
    );

    return this.getShiftById(id)!;
  }

  public static closeShift(shiftId: string, closingBalance: number): DbCashShiftRecord {
    const shift = this.getShiftById(shiftId);
    if (!shift) throw new Error('Session de caisse introuvable');
    if (shift.status === 'CLOSED') throw new Error('Cette session est déjà fermée');

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE cash_shifts 
      SET status = 'CLOSED', closed_at = ?, closing_balance = ? 
      WHERE id = ?
    `).run(now, closingBalance, shift.id);

    return this.getShiftById(shift.id)!;
  }

  public static recordTransaction(params: {
    reference: string;
    shiftId?: string;
    memberCode?: string;
    accountNumber?: string;
    type: string;
    amount: number;
    category: string;
    subtitle?: string;
  }): DbTransactionRecord {
    const id = `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO transactions (id, reference, shift_id, member_code, account_number, type, amount, category, subtitle)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        params.reference,
        params.shiftId || null,
        params.memberCode || null,
        params.accountNumber || null,
        params.type,
        params.amount,
        params.category,
        params.subtitle || null
      );

      // Si rattaché à une caisse ouverte, ajuster le solde de caisse
      if (params.shiftId) {
        const delta = params.type === 'DEPOSIT' || params.type === 'LOAN_REPAYMENT' || params.type === 'SHARE_PURCHASE'
          ? params.amount
          : -params.amount;
        db.prepare('UPDATE cash_shifts SET system_balance = system_balance + ? WHERE id = ?').run(delta, params.shiftId);
      }

      return db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as DbTransactionRecord;
    });

    return tx();
  }

  public static getTransactions(limit: number = 100): DbTransactionRecord[] {
    return db.prepare('SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?').all(limit) as DbTransactionRecord[];
  }

  public static getTransactionsByShift(shiftId: string): DbTransactionRecord[] {
    return db.prepare('SELECT * FROM transactions WHERE shift_id = ? ORDER BY created_at DESC').all(shiftId) as DbTransactionRecord[];
  }
}
