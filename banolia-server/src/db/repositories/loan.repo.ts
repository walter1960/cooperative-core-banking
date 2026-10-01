import { db } from '../sqlite';

export interface DbLoanRecord {
  id: string;
  loan_number: string;
  member_code: string;
  product_name: string;
  amount: number;
  duration_months: number;
  interest_rate: number;
  calculation_method: string;
  monthly_payment: number;
  total_interest: number;
  purpose: string;
  guarantor_name?: string;
  attachment_name?: string;
  written_statement?: string;
  status: string;
  created_at: string;
}

export interface DbLoanScheduleRecord {
  id: string;
  loan_id: string;
  installment_number: number;
  due_date: string;
  principal_due: number;
  interest_due: number;
  total_due: number;
  remaining_principal: number;
  is_paid: number;
  paid_date?: string;
}

export class LoanRepository {
  public static getAll(): DbLoanRecord[] {
    return db.prepare('SELECT * FROM loans ORDER BY created_at DESC').all() as DbLoanRecord[];
  }

  public static getByNumber(loanNumber: string): DbLoanRecord | undefined {
    return db.prepare('SELECT * FROM loans WHERE loan_number = ?').get(loanNumber) as DbLoanRecord | undefined;
  }

  public static getByMember(memberCode: string): DbLoanRecord[] {
    return db.prepare('SELECT * FROM loans WHERE member_code = ? ORDER BY created_at DESC').all(memberCode) as DbLoanRecord[];
  }

  public static getSchedules(loanId: string): DbLoanScheduleRecord[] {
    return db.prepare('SELECT * FROM loan_schedules WHERE loan_id = ? ORDER BY installment_number ASC').all(loanId) as DbLoanScheduleRecord[];
  }

  public static createLoan(params: {
    memberCode: string;
    productName: string;
    amount: number;
    durationMonths: number;
    interestRate: number;
    calculationMethod: string;
    purpose: string;
    guarantorName?: string;
    attachmentName?: string;
    writtenStatement?: string;
  }): DbLoanRecord {
    const tx = db.transaction(() => {
      const count = (db.prepare('SELECT COUNT(*) as count FROM loans').get() as { count: number }).count;
      const loanNumber = `PRT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
      const loanId = `LOAN-${Date.now()}`;

      const r = params.interestRate / 100;
      let monthlyPayment = 0;
      let totalInterest = 0;

      if (params.calculationMethod === 'LINEAIRE') {
        totalInterest = Math.round(params.amount * r * (params.durationMonths / 12));
        monthlyPayment = Math.round((params.amount + totalInterest) / params.durationMonths);
      } else {
        // Dégressif
        const i = r / 12;
        monthlyPayment = Math.round(params.amount * (i * Math.pow(1 + i, params.durationMonths)) / (Math.pow(1 + i, params.durationMonths) - 1));
        totalInterest = (monthlyPayment * params.durationMonths) - params.amount;
      }

      db.prepare(`
        INSERT INTO loans (
          id, loan_number, member_code, product_name, amount, duration_months,
          interest_rate, calculation_method, monthly_payment, total_interest,
          purpose, guarantor_name, attachment_name, written_statement, status
        ) VALUES (
          @id, @loan_number, @member_code, @product_name, @amount, @duration_months,
          @interest_rate, @calculation_method, @monthly_payment, @total_interest,
          @purpose, @guarantor_name, @attachment_name, @written_statement, 'EN_INSTRUCTION'
        )
      `).run({
        id: loanId,
        loan_number: loanNumber,
        member_code: params.memberCode,
        product_name: params.productName,
        amount: params.amount,
        duration_months: params.durationMonths,
        interest_rate: params.interestRate,
        calculation_method: params.calculationMethod,
        monthly_payment: monthlyPayment,
        total_interest: totalInterest,
        purpose: params.purpose,
        guarantor_name: params.guarantorName || null,
        attachment_name: params.attachmentName || null,
        written_statement: params.writtenStatement || null
      });

      // Génération de l'échéancier réel
      const scheduleStmt = db.prepare(`
        INSERT INTO loan_schedules (
          id, loan_id, installment_number, due_date, principal_due,
          interest_due, total_due, remaining_principal, is_paid
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
      `);

      let remainingPrincipal = params.amount;
      const principalPerMonth = Math.round(params.amount / params.durationMonths);
      const interestPerMonth = Math.round(totalInterest / params.durationMonths);

      for (let n = 1; n <= params.durationMonths; n++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + n);
        const duePrincipal = n === params.durationMonths ? remainingPrincipal : principalPerMonth;
        remainingPrincipal -= duePrincipal;

        scheduleStmt.run(
          `SCH-${loanId}-${n}`,
          loanId,
          n,
          dueDate.toISOString().split('T')[0],
          duePrincipal,
          interestPerMonth,
          duePrincipal + interestPerMonth,
          Math.max(0, remainingPrincipal)
        );
      }

      return LoanRepository.getByNumber(loanNumber)!;
    });

    return tx();
  }

  public static updateStatus(loanId: string, status: string): boolean {
    const res = db.prepare('UPDATE loans SET status = ? WHERE id = ? OR loan_number = ?').run(status, loanId, loanId);
    return res.changes > 0;
  }
}
