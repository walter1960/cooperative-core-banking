import { db } from '../sqlite';

export interface DbMemberRecord {
  id: string;
  code: string;
  manual_number?: string;
  legal_type: string;
  full_name: string;
  gender?: string;
  birth_date?: string;
  nationality: string;
  id_type: string;
  id_number: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  profession?: string;
  monthly_income: number;
  shares_purchased: number;
  shares_non_liberated: number;
  share_unit_price: number;
  status: string;
  registration_date: string;
  created_at: string;
}

export class MemberRepository {
  public static getAll(): DbMemberRecord[] {
    return db.prepare('SELECT * FROM members ORDER BY registration_date DESC').all() as DbMemberRecord[];
  }

  public static getByCode(code: string): DbMemberRecord | undefined {
    return db.prepare('SELECT * FROM members WHERE code = ?').get(code) as DbMemberRecord | undefined;
  }

  public static getById(id: string): DbMemberRecord | undefined {
    return db.prepare('SELECT * FROM members WHERE id = ?').get(id) as DbMemberRecord | undefined;
  }

  public static search(query: string): DbMemberRecord[] {
    const trimmed = query.trim();
    const q = `%${trimmed}%`;
    const digitsOnly = trimmed.replace(/\D/g, '');
    const cleanDigits = digitsOnly.length > 0 ? `%${digitsOnly}%` : q;

    return db.prepare(`
      SELECT * FROM members 
      WHERE code LIKE ? 
         OR manual_number LIKE ?
         OR full_name LIKE ? 
         OR phone LIKE ? 
         OR REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') LIKE ?
         OR id_number LIKE ?
      ORDER BY full_name ASC
    `).all(q, q, q, q, cleanDigits, q) as DbMemberRecord[];
  }

  public static getNextSequence(): number {
    const row = db.prepare('SELECT COUNT(*) as count FROM members').get() as { count: number };
    return row.count + 1;
  }

  public static create(member: Omit<DbMemberRecord, 'created_at'>): DbMemberRecord {
    const stmt = db.prepare(`
      INSERT INTO members (
        id, code, manual_number, legal_type, full_name, gender, birth_date,
        nationality, id_type, id_number, phone, email, address, city,
        profession, monthly_income, shares_purchased, shares_non_liberated,
        share_unit_price, status, registration_date
      ) VALUES (
        @id, @code, @manual_number, @legal_type, @full_name, @gender, @birth_date,
        @nationality, @id_type, @id_number, @phone, @email, @address, @city,
        @profession, @monthly_income, @shares_purchased, @shares_non_liberated,
        @share_unit_price, @status, @registration_date
      )
    `);

    stmt.run({
      id: member.id,
      code: member.code,
      manual_number: member.manual_number || null,
      legal_type: member.legal_type || 'INDIVIDUAL',
      full_name: member.full_name,
      gender: member.gender || null,
      birth_date: member.birth_date || null,
      nationality: member.nationality || 'Togolaise',
      id_type: member.id_type,
      id_number: member.id_number,
      phone: member.phone,
      email: member.email || null,
      address: member.address,
      city: member.city || 'Lomé',
      profession: member.profession || null,
      monthly_income: member.monthly_income || 0,
      shares_purchased: member.shares_purchased || 1,
      shares_non_liberated: member.shares_non_liberated || 0,
      share_unit_price: member.share_unit_price || 10000,
      status: member.status || 'ACTIVE',
      registration_date: member.registration_date
    });

    return this.getByCode(member.code)!;
  }

  public static updateStatus(code: string, status: string): boolean {
    const res = db.prepare('UPDATE members SET status = ? WHERE code = ?').run(status, code);
    return res.changes > 0;
  }
}
