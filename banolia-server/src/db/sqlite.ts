import Database from 'better-sqlite3';
import path from 'path';

// Chemin persistant du fichier de base de données SQLite
const DB_PATH = process.env.DATABASE_PATH || path.resolve(__dirname, '../../data/cooperative.db');

export const db: Database.Database = new Database(DB_PATH);

// Configuration optimale pour la robustesse bancaire
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

/**
 * Initialisation des tables de la vraie base de données
 */
export function initializeDatabase(): void {
  const schemaSql = `
    -- 1. Agences & Points de service
    CREATE TABLE IF NOT EXISTS agencies (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      phone TEXT,
      is_main INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 2. Sociétaires (Membres officiels)
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      manual_number TEXT,
      legal_type TEXT DEFAULT 'INDIVIDUAL',
      full_name TEXT NOT NULL,
      gender TEXT,
      birth_date TEXT,
      nationality TEXT DEFAULT 'Togolaise',
      id_type TEXT NOT NULL,
      id_number TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT NOT NULL,
      city TEXT DEFAULT 'Lomé',
      profession TEXT,
      monthly_income INTEGER DEFAULT 0,
      shares_purchased INTEGER DEFAULT 1,
      shares_non_liberated INTEGER DEFAULT 0,
      share_unit_price INTEGER DEFAULT 10000,
      status TEXT DEFAULT 'ACTIVE',
      registration_date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 3. Comptes d'Épargne & Disponibilités
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      account_number TEXT UNIQUE NOT NULL,
      member_code TEXT NOT NULL REFERENCES members(code) ON DELETE RESTRICT,
      product_code TEXT NOT NULL,
      type TEXT NOT NULL,
      balance INTEGER DEFAULT 0,
      blocked_balance INTEGER DEFAULT 0,
      currency TEXT DEFAULT 'XOF',
      status TEXT DEFAULT 'ACTIVE',
      opened_at TEXT DEFAULT (datetime('now'))
    );

    -- 4. Blocage Volontaire d'Épargne
    CREATE TABLE IF NOT EXISTS savings_locks (
      id TEXT PRIMARY KEY,
      member_code TEXT NOT NULL REFERENCES members(code) ON DELETE RESTRICT,
      blocked_amount INTEGER NOT NULL,
      percentage REAL NOT NULL,
      duration_months INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      until_date TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE'
    );

    -- 5. Demandes & Dossiers de Prêt
    CREATE TABLE IF NOT EXISTS loans (
      id TEXT PRIMARY KEY,
      loan_number TEXT UNIQUE NOT NULL,
      member_code TEXT NOT NULL REFERENCES members(code) ON DELETE RESTRICT,
      product_name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      duration_months INTEGER NOT NULL,
      interest_rate REAL NOT NULL,
      calculation_method TEXT NOT NULL,
      monthly_payment INTEGER NOT NULL,
      total_interest INTEGER NOT NULL,
      purpose TEXT NOT NULL,
      guarantor_name TEXT,
      attachment_name TEXT,
      written_statement TEXT,
      status TEXT DEFAULT 'EN_INSTRUCTION',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 6. Échéanciers d'Amortissement
    CREATE TABLE IF NOT EXISTS loan_schedules (
      id TEXT PRIMARY KEY,
      loan_id TEXT NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
      installment_number INTEGER NOT NULL,
      due_date TEXT NOT NULL,
      principal_due INTEGER NOT NULL,
      interest_due INTEGER NOT NULL,
      total_due INTEGER NOT NULL,
      remaining_principal INTEGER NOT NULL,
      is_paid INTEGER DEFAULT 0,
      paid_date TEXT
    );

    -- 7. Sessions de Caisse (Guichet)
    CREATE TABLE IF NOT EXISTS cash_shifts (
      id TEXT PRIMARY KEY,
      shift_code TEXT UNIQUE NOT NULL,
      cashier_id TEXT NOT NULL,
      agency_id TEXT NOT NULL,
      opened_at TEXT NOT NULL,
      closed_at TEXT,
      opening_balance INTEGER DEFAULT 0,
      closing_balance INTEGER,
      system_balance INTEGER DEFAULT 0,
      status TEXT DEFAULT 'OPEN'
    );

    -- 8. Transactions Financières & Écritures
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      reference TEXT UNIQUE NOT NULL,
      shift_id TEXT REFERENCES cash_shifts(id),
      member_code TEXT REFERENCES members(code),
      account_number TEXT REFERENCES accounts(account_number),
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      category TEXT NOT NULL,
      subtitle TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 9. Demandes Inbound Mobile (Prêts & Retraits du smartphone)
    CREATE TABLE IF NOT EXISTS mobile_requests (
      id TEXT PRIMARY KEY,
      request_number TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      member_code TEXT NOT NULL,
      member_name TEXT NOT NULL,
      member_phone TEXT NOT NULL,
      amount INTEGER NOT NULL,
      purpose TEXT,
      status TEXT DEFAULT 'EN_ATTENTE',
      details TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 10. Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 11. Grand Livre Général (SYSCOA-SFD)
    CREATE TABLE IF NOT EXISTS gl_entries (
      id TEXT PRIMARY KEY,
      entry_number TEXT UNIQUE NOT NULL,
      entry_date TEXT NOT NULL,
      label TEXT NOT NULL,
      debit_account TEXT NOT NULL,
      credit_account TEXT NOT NULL,
      amount INTEGER NOT NULL,
      reference TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Index pour la performance
    CREATE INDEX IF NOT EXISTS idx_members_code ON members(code);
    CREATE INDEX IF NOT EXISTS idx_accounts_member ON accounts(member_code);
    CREATE INDEX IF NOT EXISTS idx_accounts_number ON accounts(account_number);
    CREATE INDEX IF NOT EXISTS idx_loans_member ON loans(member_code);
    CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member_code);
    CREATE INDEX IF NOT EXISTS idx_mobile_requests_number ON mobile_requests(request_number);
  `;

  db.exec(schemaSql);

  // Insérer l'agence principale si aucune n'existe
  const agencyCount = db.prepare('SELECT COUNT(*) as count FROM agencies').get() as { count: number };
  if (agencyCount.count === 0) {
    db.prepare(`
      INSERT INTO agencies (id, code, name, city, phone, is_main)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('AG-01', 'AG-SIEGE-LOME', 'Agence Siège Principal Lomé', 'Lomé', '+228 22 26 21 01', 1);
  }

  console.log(`[Database] SQLite connected & schema initialized at: ${DB_PATH}`);
}
