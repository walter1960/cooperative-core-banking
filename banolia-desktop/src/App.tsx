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
  Sparkles
} from 'lucide-react';

export type ModuleType = 'home' | 'inscription' | 'projet' | 'epargne' | 'comptabilite' | 'caisse' | 'credit' | 'societaires' | 'prelevements';

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

import { SearchModal } from './components/SearchModal';
import { AccountOpeningModal } from './components/teller/AccountOpeningModal';
import { OfflineSyncModal } from './components/OfflineSyncModal';
import { ShiftBalancingModal } from './components/shift/ShiftBalancingModal';
import { BiometricAuthModal } from './components/biometrics/BiometricAuthModal';

import { StorageService } from './services/storage';
import { NetworkMonitor } from './services/sync/NetworkMonitor';
import { db } from './db/database';
import { seedDatabase } from './db/seed';
import { Member, Account, LoanFile, CashRegister } from './types';
import { useLiveActiveShift } from './db/hooks';

export function App() {
  const [activeModule, setActiveModule] = useState<ModuleType>('home');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isAccountOpeningOpen, setIsAccountOpeningOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [selectedMemberCode, setSelectedMemberCode] = useState<string>('A0200225');
  const [preselectedAccount, setPreselectedAccount] = useState<string>('');

  // Data states
  const [members, setMembers] = useState<Member[]>([]);
  const [accountsMap, setAccountsMap] = useState<Record<string, Account[]>>({});
  const [loansMap, setLoansMap] = useState<Record<string, LoanFile[]>>({});
  const [cashRegister, setCashRegister] = useState<CashRegister>(StorageService.getCashRegister());

  const activeShift = useLiveActiveShift();

  const loadData = () => {
    setMembers(StorageService.getMembers());
    setAccountsMap(StorageService.getAccounts());
    setLoansMap(StorageService.getLoans());
    setCashRegister(StorageService.getCashRegister());
  };

  useEffect(() => {
    seedDatabase(db).catch(console.error);
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
      case 'prelevements': return { title: 'Prélèvements à la Source & Retenues sur Salaires', icon: Building2 };
      default: return { title: 'Accueil Coopérative', icon: Landmark };
    }
  };

  const activeModuleInfo = getModuleTitle();
  const IconComponent = activeModuleInfo.icon;

  return (
    <div className="w-screen h-screen bg-[#333d47] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden select-none">
      
      {/* Universal Institutional Top Ribbon Menu (Always accessible) */}
      <header className="bg-[#212830] border-b border-[#181e24] px-4 py-1.5 flex items-center justify-between text-xs text-slate-300 print:hidden z-30 select-none">
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-2.5 py-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Paramètres</span>
          </button>

          <span className="text-slate-600">|</span>

          <button
            onClick={() => setActiveModule('inscription')}
            className={`px-2.5 py-1 rounded font-semibold transition-colors ${
              activeModule === 'inscription' ? 'bg-coop-primary text-white font-bold' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Adhésion
          </button>

          <button
            onClick={() => setActiveModule('societaires')}
            className={`px-2.5 py-1 rounded font-semibold transition-colors ${
              activeModule === 'societaires' ? 'bg-coop-primary text-white font-bold' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Situation Comptes
          </button>

          <button
            onClick={() => setActiveModule('epargne')}
            className={`px-2.5 py-1 rounded font-semibold transition-colors ${
              activeModule === 'epargne' ? 'bg-coop-primary text-white font-bold' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Épargne
          </button>

          <button
            onClick={() => setActiveModule('caisse')}
            className={`px-2.5 py-1 rounded font-semibold transition-colors ${
              activeModule === 'caisse' ? 'bg-coop-primary text-white font-bold' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Caisse
          </button>

          <button
            onClick={() => setActiveModule('credit')}
            className={`px-2.5 py-1 rounded font-semibold transition-colors ${
              activeModule === 'credit' ? 'bg-coop-primary text-white font-bold' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Crédit
          </button>

          <button
            onClick={() => setActiveModule('comptabilite')}
            className={`px-2.5 py-1 rounded font-semibold transition-colors ${
              activeModule === 'comptabilite' ? 'bg-coop-primary text-white font-bold' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Comptabilité
          </button>

          <button
            onClick={() => setActiveModule('prelevements')}
            className={`px-2.5 py-1 rounded font-semibold transition-colors ${
              activeModule === 'prelevements' ? 'bg-coop-primary text-white font-bold' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Prélèvements
          </button>

          <button
            onClick={() => setActiveModule('projet')}
            className={`px-2.5 py-1 rounded font-semibold transition-colors ${
              activeModule === 'projet' ? 'bg-coop-primary text-white font-bold' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Projets
          </button>

          <span className="text-slate-600">|</span>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-2.5 py-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white font-semibold transition-colors"
          >
            Utilitaires
          </button>
        </div>
      </header>

      {/* If Home Screen */}
      {activeModule === 'home' ? (
        <CooperativeHomeScreen onSelectModule={handleSelectModule} />
      ) : (
        /* Workspace Screen with Clear Navigation Header */
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
          
          {/* Top Module Action Bar */}
          <div className="bg-[#29323b] text-white px-5 py-2.5 flex items-center justify-between border-b border-[#1f262d] shadow-md print:hidden">
            {/* Left: Back to Home Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveModule('home')}
                className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                title="Revenir à l'écran d'accueil principal"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Accueil Coopérative</span>
              </button>

              <div className="flex items-center gap-2 pl-3 border-l border-slate-600">
                <div className="p-1.5 bg-emerald-900 text-emerald-300 rounded-lg">
                  <IconComponent className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">{activeModuleInfo.title}</h2>
                  <p className="text-[10px] text-slate-400">Coopérative d'Épargne et de Crédit</p>
                </div>
              </div>
            </div>

            {/* Quick Search & Cash Balance */}
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              >
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Recherche Sociétaire...</span>
                <kbd className="bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700">
                  Ctrl+K
                </kbd>
              </button>

              <div className="hidden lg:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-[11px] font-mono">
                <Wallet className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400">Encaisse Caisse :</span>
                <span className="font-bold text-amber-300">
                  {(activeShift ? activeShift.theoreticalClosingBalance : cashRegister.balance).toLocaleString('fr-FR')} F
                </span>
              </div>
            </div>
          </div>

          {/* Module Content */}
          <main className="flex-1 bg-slate-100 overflow-y-auto">
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

      {/* Global Parameters & Utilities Modal */}
      <CooperativeSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
