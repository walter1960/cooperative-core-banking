import { db } from '../sqlite';

export interface DbMobileRequestRecord {
  id: string;
  request_number: string;
  type: string;
  member_code: string;
  member_name: string;
  member_phone: string;
  amount: number;
  purpose?: string;
  status: string;
  details?: string; // JSON string of extra fields (duration, interest, agency, etc.)
  created_at: string;
}

export class MobileRequestRepository {
  public static getAll(): DbMobileRequestRecord[] {
    return db.prepare('SELECT * FROM mobile_requests ORDER BY created_at DESC').all() as DbMobileRequestRecord[];
  }

  public static getByNumber(requestNumber: string): DbMobileRequestRecord | undefined {
    return db.prepare('SELECT * FROM mobile_requests WHERE request_number = ?').get(requestNumber) as DbMobileRequestRecord | undefined;
  }

  public static getById(id: string): DbMobileRequestRecord | undefined {
    return db.prepare('SELECT * FROM mobile_requests WHERE id = ?').get(id) as DbMobileRequestRecord | undefined;
  }

  public static getByMember(memberCode: string): DbMobileRequestRecord[] {
    return db.prepare('SELECT * FROM mobile_requests WHERE member_code = ? ORDER BY created_at DESC').all(memberCode) as DbMobileRequestRecord[];
  }

  public static create(data: {
    id?: string;
    request_number: string;
    type: string;
    member_code: string;
    member_name: string;
    member_phone: string;
    amount: number;
    purpose?: string;
    status?: string;
    details?: any;
  }): DbMobileRequestRecord {
    const id = data.id || `REQ-MOB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const detailsStr = data.details ? (typeof data.details === 'string' ? data.details : JSON.stringify(data.details)) : null;

    db.prepare(`
      INSERT INTO mobile_requests (
        id, request_number, type, member_code, member_name, member_phone, amount, purpose, status, details
      ) VALUES (
        @id, @request_number, @type, @member_code, @member_name, @member_phone, @amount, @purpose, @status, @details
      )
    `).run({
      id,
      request_number: data.request_number,
      type: data.type,
      member_code: data.member_code,
      member_name: data.member_name,
      member_phone: data.member_phone,
      amount: data.amount,
      purpose: data.purpose || null,
      status: data.status || 'EN_ATTENTE',
      details: detailsStr
    });

    return this.getById(id)!;
  }

  public static updateStatus(idOrNumber: string, status: string, processedBy?: string, notes?: string): DbMobileRequestRecord | undefined {
    const existing = db.prepare('SELECT * FROM mobile_requests WHERE id = ? OR request_number = ?').get(idOrNumber, idOrNumber) as DbMobileRequestRecord | undefined;
    if (!existing) return undefined;

    let detailsObj: any = {};
    if (existing.details) {
      try {
        detailsObj = JSON.parse(existing.details);
      } catch (_) {}
    }

    if (processedBy) detailsObj.processedBy = processedBy;
    if (notes) detailsObj.notes = notes;
    detailsObj.processedAt = new Date().toISOString();

    db.prepare(`
      UPDATE mobile_requests 
      SET status = ?, details = ? 
      WHERE id = ?
    `).run(status, JSON.stringify(detailsObj), existing.id);

    return this.getById(existing.id);
  }

  public static delete(id: string): boolean {
    const res = db.prepare('DELETE FROM mobile_requests WHERE id = ? OR request_number = ?').run(id, id);
    return res.changes > 0;
  }
}
