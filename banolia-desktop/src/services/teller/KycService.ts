import { db, BanoliaDatabase } from '../../db/database';
import { DbMember, DbAccount, DbLoanFile } from '../../types/database';

export class KycService {
  /**
   * Searches members across Code, FullName, Phone, and Physical Manual Register Number
   */
  public static async searchMembers(
    query: string,
    customDb?: BanoliaDatabase
  ): Promise<DbMember[]> {
    const targetDb = customDb || db;
    if (!query || !query.trim()) {
      return await targetDb.members.toArray();
    }

    const q = query.toLowerCase().trim();
    return await targetDb.members
      .filter(m =>
        m.code.toLowerCase().includes(q) ||
        m.fullName.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        Boolean(m.manualNumber && m.manualNumber.includes(q))
      )
      .toArray();
  }

  /**
   * Retrieves full Member 360 data including accounts and active loans
   */
  public static async getMember360(
    memberCode: string,
    customDb?: BanoliaDatabase
  ): Promise<{
    member: DbMember | undefined;
    accounts: DbAccount[];
    loans: DbLoanFile[];
    totalSavingsBalance: number;
    totalAvailableBalance: number;
  }> {
    const targetDb = customDb || db;
    const member = await targetDb.members.where('code').equals(memberCode).first();
    const accounts = await targetDb.accounts.where('memberCode').equals(memberCode).toArray();
    const loans = await targetDb.loanFiles.where('memberCode').equals(memberCode).toArray();

    const totalSavingsBalance = accounts.reduce((acc, curr) => acc + (curr.type !== 'LOAN' ? curr.realBalance : 0), 0);
    const totalAvailableBalance = accounts.reduce((acc, curr) => acc + (curr.type !== 'LOAN' ? curr.availableBalance : 0), 0);

    return {
      member,
      accounts,
      loans,
      totalSavingsBalance,
      totalAvailableBalance
    };
  }
}
