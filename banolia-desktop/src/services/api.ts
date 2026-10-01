/**
 * BANOLIA Desktop API Client
 * Connects Desktop UI to real Core Banking SQLite Backend
 */

const API_BASE = '/api';

export interface ApiMember {
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

export interface ApiAccount {
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

export interface ApiLoan {
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

export interface ApiMobileRequest {
  id: string;
  type: 'LOAN' | 'WITHDRAWAL' | 'ADHESION';
  requestNumber: string;
  memberCode: string;
  memberName: string;
  memberPhone: string;
  amount: number;
  purpose: string;
  status: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE' | 'SERVI_GUICHET';
  submittedAt: string;
  durationMonths?: number;
  interestRate?: number;
  estimatedMonthlyPayment?: number;
  selectedAccount?: string;
  selectedAgency?: string;
  guarantorName?: string;
  notes?: string;
}

export interface ApiDashboardStats {
  totalMembers: number;
  activeMembers: number;
  financials: {
    totalSavings: number;
    totalBlockedSavings: number;
    totalAvailableSavings: number;
    totalShareCapital: number;
    totalLoansAmount: number;
    cashInVault: number;
  };
  credits: {
    pendingCount: number;
    activeCount: number;
  };
  mobileRequests: {
    pendingCount: number;
  };
}

export class CoreBankingApi {
  public static async isServerOnline(): Promise<boolean> {
    try {
      const res = await fetch('/health', { method: 'GET', headers: { 'Accept': 'application/json' } });
      return res.ok;
    } catch (_) {
      return false;
    }
  }

  // Members
  public static async getMembers(query?: string): Promise<ApiMember[]> {
    const url = query ? `${API_BASE}/members?q=${encodeURIComponent(query)}` : `${API_BASE}/members`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erreur lors de la récupération des sociétaires');
    const data = await res.json();
    return data.members || [];
  }

  public static async getMemberDetails(code: string): Promise<{
    member: ApiMember;
    accounts: ApiAccount[];
    loans: ApiLoan[];
    savingsLock: any;
  }> {
    const res = await fetch(`${API_BASE}/members/${code}`);
    if (!res.ok) throw new Error(`Sociétaire ${code} introuvable`);
    return await res.json();
  }

  public static async createMember(payload: Partial<ApiMember>): Promise<{
    member: ApiMember;
    accounts: ApiAccount[];
  }> {
    const res = await fetch(`${API_BASE}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Impossible d'inscrire le sociétaire");
    }
    return data;
  }

  // Accounts & Operations
  public static async deposit(accountNumber: string, amount: number, subtitle?: string): Promise<{ newBalance: number; reference: string }> {
    const res = await fetch(`${API_BASE}/accounts/${accountNumber}/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, subtitle })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Erreur lors du dépôt');
    }
    return data;
  }

  public static async withdraw(accountNumber: string, amount: number, subtitle?: string): Promise<{ newBalance: number; reference: string }> {
    const res = await fetch(`${API_BASE}/accounts/${accountNumber}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, subtitle })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Erreur lors du retrait');
    }
    return data;
  }

  public static async lockSavings(memberCode: string, isBlocked: boolean, percentage: number, durationMonths: number) {
    const res = await fetch(`${API_BASE}/accounts/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberCode, isBlocked, percentage, durationMonths })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Erreur lors du blocage d\'épargne');
    }
    return data;
  }

  // Loans
  public static async getLoans(): Promise<ApiLoan[]> {
    const res = await fetch(`${API_BASE}/loans`);
    if (!res.ok) throw new Error('Erreur lors de la récupération des crédits');
    const data = await res.json();
    return data.loans || [];
  }

  public static async createLoan(payload: any): Promise<{ loan: ApiLoan; schedules: any[] }> {
    const res = await fetch(`${API_BASE}/loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Erreur lors de la constitution du dossier de crédit');
    }
    return data;
  }

  // Dashboard Stats
  public static async getDashboardStats(): Promise<ApiDashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error('Erreur lors du calcul des statistiques réelles');
    const data = await res.json();
    return data.stats;
  }

  // Mobile Inbound Requests
  public static async getMobileRequests(): Promise<ApiMobileRequest[]> {
    const res = await fetch(`${API_BASE}/mobile/requests`);
    if (!res.ok) throw new Error('Erreur lors de la récupération des demandes mobiles');
    const data = await res.json();
    return data.requests || [];
  }

  public static async updateMobileRequestStatus(id: string, status: string, notes?: string, processedBy?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/mobile/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes, processedBy })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Erreur lors de la mise à jour du statut');
    }
    return data;
  }
}
