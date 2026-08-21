import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { DbMember, DbAccount, DbCashShift, DbTransaction, DbLoanFile } from '../types/database';

export function useLiveMembers(searchQuery: string = ''): DbMember[] | undefined {
  return useLiveQuery(async () => {
    if (!searchQuery.trim()) {
      return await db.members.toArray();
    }
    const q = searchQuery.toLowerCase().trim();
    return await db.members
      .filter(m =>
        m.code.toLowerCase().includes(q) ||
        m.fullName.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        Boolean(m.manualNumber && m.manualNumber.includes(q))
      )
      .toArray();
  }, [searchQuery]);
}

export function useLiveMemberAccounts(memberCode: string): DbAccount[] | undefined {
  return useLiveQuery(async () => {
    if (!memberCode) return [];
    return await db.accounts.where('memberCode').equals(memberCode).toArray();
  }, [memberCode]);
}

export function useLiveActiveShift(): DbCashShift | undefined | null {
  return useLiveQuery(async () => {
    const shift = await db.cashShifts
      .filter(s => s.status === 'OPEN_ACTIVE' || (s.status as string) === 'OPEN')
      .first();
    return shift || null;
  });
}

export function useLiveOfflineQueueCount(): number | undefined {
  return useLiveQuery(async () => {
    return await db.syncQueue
      .filter(q => q.status === 'PENDING' || q.status === 'FAILED_RETRY')
      .count();
  });
}

export function useLiveRecentTransactions(limit: number = 20): DbTransaction[] | undefined {
  return useLiveQuery(async () => {
    return await db.transactions
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  }, [limit]);
}

export function useLiveMemberLoans(memberCode: string): DbLoanFile[] | undefined {
  return useLiveQuery(async () => {
    if (!memberCode) return [];
    return await db.loanFiles.where('memberCode').equals(memberCode).toArray();
  }, [memberCode]);
}
