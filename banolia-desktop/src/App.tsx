import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  HelpCircle, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  FolderSync, 
  Printer, 
  Lock, 
  Calculator, 
  PlusCircle, 
  ArrowLeft, 
  Search, 
  Landmark, 
  User, 
  Wallet, 
  FileText, 
  Coins, 
  Receipt, 
  Users, 
  Building2,
  Settings,
  ShieldCheck,
  Scale,
  Sparkles,
  Stamp,
  Smartphone
} from 'lucide-react';

export type ModuleType = 'home' | 'inscription' | 'projet' | 'epargne' | 'comptabilite' | 'caisse' | 'credit' | 'societaires' | 'prelevements' | 'formulaires' | 'demandes_mobiles';

import { CooperativeHomeScreen } from './components/home/CooperativeHomeScreen';
import { InscriptionManager } from './components/inscription/InscriptionManager';
import { ProjectManager } from './components/project/ProjectManager';
import { SavingsManager } from './components/SavingsManager';
import { AccountingView } from './components/AccountingView';
import { CashierDesk } from './components/CashierDesk';
import { CreditManager } from './components/CreditManager';
import { MemberAccountStatus } from './components/member/MemberAccountStatus';
import { PayrollDeductionManager } from './components/payroll/PayrollDeductionManager';
import { CooperativeSettingsModal } from './components/settings/CooperativeSettingsModal';
import { CoopOfficialForms } from './components/forms/CoopOfficialForms';
import { MobileRequestsManager } from './components/mobile_requests/MobileRequestsManager';

import { SearchModal } from './components/SearchModal';
import { AccountOpeningModal } from './components/teller/AccountOpeningModal';
import { OfflineSyncModal } from './components/OfflineSyncModal';
import { ShiftBalancingModal } from './components/shift/ShiftBalancingModal';
import { BiometricAuthModal } from './components/biometrics/BiometricAuthModal';

import { StorageService } from './services/storage';
import { CoreBankingApi } from './services/api';
import { NetworkMonitor } from './services/sync/NetworkMonitor';
import { Member, Account, LoanFile, CashRegister } from './types';
import { useLiveActiveShift } from './db/hooks';
import { useTheme } from './context/ThemeContext';

export function App() {
  const { theme } = useTheme();
  const [activeModule, setActiveModule] = useState<ModuleType>('home');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isAccountOpeningOpen, setIsAccountOpeningOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [selectedMemberCode, setSelectedMemberCode] = useState<string>('130049');
  const [preselectedAccount, setPreselectedAccount] = useState<string>('');

  const [isMultiCenter, setIsMultiCenter] = useState<boolean>(() => {
    return localStorage.getItem('coop_multicenter_enabled') === 'true';
  });
  const [institutionCity, setInstitutionCity] = useState<string>(() => {
    return localStorage.getItem('coop_institution_city') || 'Lomé';
  });
  const [pendingMobileCount, setPendingMobileCount] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('coop_mobile_requests');
      if (stored) {
        return JSON.parse(stored).filter((r: any) => r.status === 'EN_ATTENTE').length;
      }
    } catch (_) {}
    return 2;
  });

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setIsMultiCenter(localStorage.getItem('coop_multicenter_enabled') === 'true');
      setInstitutionCity(localStorage.getItem('coop_institution_city') || 'Lomé');
      try {
        const stored = localStorage.getItem('coop_mobile_requests');
        if (stored) {
          setPendingMobileCount(JSON.parse(stored).filter((r: any) => r.status === 'EN_ATTENTE').length);
        }
      } catch (_) {}
    };
    window.addEventListener('coop_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('coop_settings_updated', handleSettingsUpdate);
  }, []);

  // Data states
  const [members, setMembers] = useState<Member[]>([]);
  const [accountsMap, setAccountsMap] = useState<Record<string, Account[]>>({});
  const [loansMap, setLoansMap] = useState<Record<string, LoanFile[]>>({});
  const [cashRegister, setCashRegister] = useState<CashRegister>(StorageService.getCashRegister());

  const activeShift = useLiveActiveShift();

  const loadData = async () => {
    // Purger les anciennes données de simulation du cache local si présentes
    try {
      const storedMems = localStorage.getItem('banolia_members');
      if (storedMems && (storedMems.includes('MINDIZINA') || storedMems.includes('130049'))) {
        localStorage.removeItem('banolia_members');
        localStorage.removeItem('banolia_accounts');
        localStorage.removeItem('banolia_loans');
        localStorage.removeItem('banolia_transactions');
        localStorage.removeItem('coop_mobile_requests');
      }
    } catch (_) {}

    try {
      const apiMembers = await CoreBankingApi.getMembers();
      if (apiMembers && apiMembers.length > 0) {
        const mappedMembers: Member[] = apiMembers.map(m => ({
          code: m.code,
          manualNumber: m.manual_number || m.code,
          fullName: m.full_name,
          birthDate: m.birth_date || '',
          registrationDate: m.registration_date,
          address: m.address,
          city: m.city,
          phone: m.phone,
          spouseName: '',
          sharesPurchased: m.shares_purchased * m.share_unit_price,
          sharesSold: 0,
          sharesAvailable: (m.shares_purchased - m.shares_non_liberated) * m.share_unit_price,
          shareUnitPrice: m.share_unit_price,
          status: m.status === 'ACTIVE' ? 'ACTIF' : 'SUSPENDU',
          fingerprintEnrolled: false
        }));
        setMembers(mappedMembers);

        const newAccountsMap: Record<string, Account[]> = {};
        const newLoansMap: Record<string, LoanFile[]> = {};

        for (const m of apiMembers) {
          try {
            const details = await CoreBankingApi.getMemberDetails(m.code);
            newAccountsMap[m.code] = (details.accounts || []).map(a => ({
              accountNumber: a.account_number,
              productName: a.product_code === 'EPG_VOLONTAIRE' ? 'EPARGNE ORDINAIRE (001)' : 'PARTS SOCIALES (101)',
              type: a.type === 'SHARE_CAPITAL' ? 'SHARES' : 'SAVINGS',
              realBalance: a.balance,
              frozenBalance: a.blocked_balance,
              availableBalance: a.balance - a.blocked_balance,
              currency: 'F.CFA',
              status: a.status === 'ACTIVE' ? 'ACTIF' : 'BLOQUE'
            }));

            newLoansMap[m.code] = (details.loans || []).map(l => ({
              loanNumber: l.loan_number,
              productName: l.product_name,
              amountGranted: l.amount,
              interestRate: l.interest_rate,
              durationMonths: l.duration_months,
              disbursementDate: l.created_at.slice(0, 10),
              maturityDate: '',
              monthlyPayment: l.monthly_payment,
              remainingPrincipal: l.amount,
              overdueAmount: 0,
              status: (l.status === 'DECAISSE' || l.status === 'APPROUVE' ? 'EN_COURS' : 'EN_ATTENTE') as 'EN_COURS' | 'EN_RETARD' | 'CLOTURE' | 'EN_ATTENTE'
            }));
          } catch (_) {}
        }

        setAccountsMap(newAccountsMap);
        setLoansMap(newLoansMap);
      } else {
        setMembers([]);
        setAccountsMap({});
        setLoansMap({});
      }

      const mobileReqs = await CoreBankingApi.getMobileRequests();
      const pendingCount = mobileReqs.filter(r => r.status === 'EN_ATTENTE').length;
      setPendingMobileCount(pendingCount);

      const stats = await CoreBankingApi.getDashboardStats();
      if (stats) {
        setCashRegister(prev => ({
          ...prev,
          balance: stats.financials.cashInVault || 0
        }));
      }
    } catch (err) {
      console.warn('[Core Banking API] Mode local / fallback:', err);
      setMembers(StorageService.getMembers());
      setAccountsMap(StorageService.getAccounts());
      setLoansMap(StorageService.getLoans());
      setCashRegister(StorageService.getCashRegister());
    }
  };

  useEffect(() => {
    loadData();

    const unsubscribe = NetworkMonitor.getInstance().subscribe((online) => {
      setIsOnline(online);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModule('home');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unsubscribe();
    };
  }, []);

  const handleSelectModule = (moduleId: string) => {
    setActiveModule(moduleId as ModuleType);
  };

  const getModuleTitle = () => {
    switch (activeModule) {
      case 'inscription': return { title: 'Inscription & Adhésion Sociétaire', icon: FileText };
      case 'projet': return { title: 'Projets & Financements Sociétaires', icon: Coins };
      case 'epargne': return { title: 'Épargne & Tontine des Sociétaires', icon: Lock };
      case 'comptabilite': return { title: 'Comptabilité & Grand Livre SYSCOA-SFD', icon: Calculator };
      case 'caisse': return { title: 'Guichet Express & Caisse Journalière', icon: Receipt };
      case 'credit': return { title: 'Portefeuille Crédit & Prêts sur Salaire', icon: Landmark };
      case 'societaires': return { title: 'Situation des Comptes Adhérent 360°', icon: Users };
      case 'prelevements': return { title: 'Prélèvements', icon: Building2 };
      case 'formulaires': return { title: 'Formulaires Officiels (Prêt & Retrait)', icon: Stamp };
      case 'demandes_mobiles': return { title: 'Demandes Mobiles (Prêts & Retraits en Ligne)', icon: Smartphone };
      default: return { title: 'Accueil Coopérative', icon: Landmark };
    }
  };

  const activeModuleInfo = getModuleTitle();
  const IconComponent = activeModuleInfo.icon;

  const getTabStyle = (moduleName: ModuleType) => {
    if (activeModule === moduleName) {
      return {
        backgroundColor: theme.primaryAccent,
        color: '#ffffff',
        fontWeight: 'bold'
      };
    }
    return {};
  };

  return (
    <div 
      style={{ backgroundColor: theme.canvasBg }}
      className="w-screen h-screen flex flex-col font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden select-none"
    >
      
      {/* Universal Institutional Top Ribbon Menu */}
      <header 
        style={{ backgroundColor: theme.topBarBg, color: theme.topBarText }}
        className="border-b border-black/20 px-4 py-1.5 flex items-center justify-between text-xs print:hidden z-30 select-none transition-colors duration-200"
      >
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-2.5 py-1 hover:bg-white/10 rounded font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 opacity-80" />
            <span>Paramètres</span>
          </button>

          <span className="opacity-30">|</span>

          <button
            onClick={() => setActiveModule('inscription')}
            style={getTabStyle('inscription')}
            className={`px-2.5 py-1 rounded font-semibold transition-all ${
              activeModule !== 'inscription' ? 'hover:bg-white/10 opacity-90 hover:opacity-100' : ''
            }`}
          >
            Adhésion
          </button>

          <button
            onClick={() => setActiveModule('societaires')}
            style={getTabStyle('societaires')}
            className={`px-2.5 py-1 rounded font-semibold transition-all ${
              activeModule !== 'societaires' ? 'hover:bg-white/10 opacity-90 hover:opacity-100' : ''
            }`}
          >
            Situation Comptes
          </button>

          <button
            onClick={() => setActiveModule('epargne')}
            style={getTabStyle('epargne')}
            className={`px-2.5 py-1 rounded font-semibold transition-all ${
              activeModule !== 'epargne' ? 'hover:bg-white/10 opacity-90 hover:opacity-100' : ''
            }`}
          >
            Épargne
          </button>

          <button
            onClick={() => setActiveModule('caisse')}
            style={getTabStyle('caisse')}
            className={`px-2.5 py-1 rounded font-semibold transition-all ${
              activeModule !== 'caisse' ? 'hover:bg-white/10 opacity-90 hover:opacity-100' : ''
            }`}
          >
            Caisse
          </button>

          <button
            onClick={() => setActiveModule('credit')}
            style={getTabStyle('credit')}
            className={`px-2.5 py-1 rounded font-semibold transition-all ${
              activeModule !== 'credit' ? 'hover:bg-white/10 opacity-90 hover:opacity-100' : ''
            }`}
          >
            Crédit
          </button>

          <button
            onClick={() => setActiveModule('comptabilite')}
            style={getTabStyle('comptabilite')}
            className={`px-2.5 py-1 rounded font-semibold transition-all ${
              activeModule !== 'comptabilite' ? 'hover:bg-white/10 opacity-90 hover:opacity-100' : ''
            }`}
          >
            Comptabilité
          </button>

          <button
            onClick={() => setActiveModule('prelevements')}
            style={getTabStyle('prelevements')}
            className={`px-2.5 py-1 rounded font-semibold transition-all ${
              activeModule !== 'prelevements' ? 'hover:bg-white/10 opacity-90 hover:opacity-100' : ''
            }`}
          >
            Prélèvements
          </button>

          <button
            onClick={() => setActiveModule('projet')}
            style={getTabStyle('projet')}
            className={`px-2.5 py-1 rounded font-semibold transition-all ${
              activeModule !== 'projet' ? 'hover:bg-white/10 opacity-90 hover:opacity-100' : ''
            }`}
          >
            Projets
          </button>

          <button
            onClick={() => setActiveModule('formulaires')}
            style={getTabStyle('formulaires')}
            className={`px-2.5 py-1 rounded font-semibold transition-all ${
              activeModule !== 'formulaires' ? 'hover:bg-white/10 opacity-90 hover:opacity-100' : ''
            }`}
          >
            Formulaires
          </button>

          <button
            onClick={() => setActiveModule('demandes_mobiles')}
            style={getTabStyle('demandes_mobiles')}
            className={`px-2.5 py-1 rounded font-semibold transition-all flex items-center gap-1.5 ${
              activeModule !== 'demandes_mobiles' ? 'hover:bg-white/10 opacity-90 hover:opacity-100' : ''
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Demandes Mobiles</span>
            {pendingMobileCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-sm">
                {pendingMobileCount}
              </span>
            )}
          </button>
        </div>

        {/* Multi-centre vs Mono-centre Badge Dynamique */}
        <div className="flex items-center gap-2">
          {isMultiCenter ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-100 border border-indigo-400/30">
              <Building2 className="w-3 h-3" /> Multi-centre
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-100 border border-emerald-400/30">
              <Building2 className="w-3 h-3" /> Siège Unique ({institutionCity})
            </span>
          )}
        </div>
      </header>

      {/* If Home Screen */}
      {activeModule === 'home' ? (
        <CooperativeHomeScreen onSelectModule={handleSelectModule} />
      ) : (
        /* Workspace Screen with Clear Navigation Header */
        <div 
          style={{ backgroundColor: theme.canvasBg }}
          className="flex-1 flex flex-col overflow-hidden transition-colors duration-200"
        >
          
          {/* Top Module Action Bar */}
          <div 
            style={{ backgroundColor: theme.topBarBg, color: theme.topBarText }}
            className="px-5 py-2.5 flex items-center justify-between border-b border-black/20 shadow-md print:hidden transition-colors duration-200"
          >
            {/* Left: Back to Home Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveModule('home')}
                style={{ backgroundColor: theme.primaryAccent, color: '#ffffff' }}
                className="flex items-center gap-2 hover:opacity-90 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                title="Revenir à l'écran d'accueil principal"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Accueil Coopérative</span>
              </button>

              <div className="flex items-center gap-2 pl-3 border-l border-white/20">
                <div 
                  style={{ backgroundColor: 'rgba(0,0,0,0.25)', color: theme.topBarText }}
                  className="p-1.5 rounded-lg"
                >
                  <IconComponent className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">{activeModuleInfo.title}</h2>
                  <p className="text-[10px] opacity-75">Coopérative d'Épargne et de Crédit</p>
                </div>
              </div>
            </div>

            {/* Quick Search & Cash Balance */}
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 bg-black/20 hover:bg-black/30 border border-white/20 text-white/90 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              >
                <Search 
                  style={{ color: theme.primaryAccent }}
                  className="w-3.5 h-3.5" 
                />
                <span className="hidden md:inline">Recherche Sociétaire...</span>
                <kbd className="bg-black/40 text-white/70 px-1.5 py-0.5 rounded text-[10px] font-mono border border-white/10">
                  Ctrl+K
                </kbd>
              </button>

              <div className="hidden lg:flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-mono">
                <Wallet className="w-3.5 h-3.5 text-amber-400" />
                <span className="opacity-80">Encaisse Caisse :</span>
                <span className="font-bold text-amber-300">
                  {(activeShift ? activeShift.theoreticalClosingBalance : cashRegister.balance).toLocaleString('fr-FR')} F
                </span>
              </div>
            </div>
          </div>

          {/* Module Content */}
          <main className="flex-1 overflow-y-auto">
            {activeModule === 'inscription' && (
              <InscriptionManager
                members={members}
                isOnline={isOnline}
                onMemberCreated={(newMem) => {
                  loadData();
                  setSelectedMemberCode(newMem.code);
                }}
              />
            )}

            {activeModule === 'projet' && (
              <ProjectManager />
            )}

            {activeModule === 'societaires' && (
              <MemberAccountStatus
                onSelectMember={(code: string) => setSelectedMemberCode(code)}
              />
            )}

            {activeModule === 'caisse' && (
              <CashierDesk
                members={members}
                accountsMap={accountsMap}
                isOnline={isOnline}
                onTransactionComplete={loadData}
                selectedAccountNumber={preselectedAccount}
              />
            )}

            {activeModule === 'prelevements' && (
              <PayrollDeductionManager />
            )}

            {activeModule === 'credit' && (
              <CreditManager
                members={members}
                loansMap={loansMap}
              />
            )}

            {activeModule === 'epargne' && (
              <SavingsManager
                members={members}
              />
            )}

            {activeModule === 'comptabilite' && (
              <AccountingView />
            )}

            {activeModule === 'formulaires' && (
              <CoopOfficialForms
                members={members}
              />
            )}

            {activeModule === 'demandes_mobiles' && (
              <MobileRequestsManager />
            )}
          </main>
        </div>
      )}

      {/* Global Member Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        members={members}
        onSelectMember={(code: string) => {
          setSelectedMemberCode(code);
          setActiveModule('societaires');
        }}
      />

      {/* Global Parameters & Settings Modal */}
      <CooperativeSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
