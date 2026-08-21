import React from 'react';
import { 
  LayoutGrid,
  Users, 
  CircleDollarSign, 
  Building2,
  CreditCard, 
  PiggyBank, 
  FileSpreadsheet, 
  RefreshCw, 
  Search,
  Settings,
  HelpCircle
} from 'lucide-react';

export type TabType = 'hub' | 'member' | 'cashier' | 'payroll' | 'credit' | 'savings' | 'sync' | 'accounting';

interface NavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenSearch: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  onOpenSearch
}) => {
  const tabs = [
    { id: 'hub', label: 'Accueil Hub', icon: LayoutGrid, shortcut: 'F1' },
    { id: 'member', label: 'Situation Adhérent', icon: Users, shortcut: 'F2' },
    { id: 'cashier', label: 'Caisse & Guichet', icon: CircleDollarSign, shortcut: 'F3' },
    { id: 'payroll', label: 'Prélèvements Salaires DRH', icon: Building2, shortcut: 'F4' },
    { id: 'credit', label: 'Portefeuille Crédit', icon: CreditCard, shortcut: 'F5' },
    { id: 'savings', label: 'Épargne & Tontine', icon: PiggyBank, shortcut: 'F6' },
    { id: 'accounting', label: 'Comptabilité & États', icon: FileSpreadsheet, shortcut: 'F7' },
    { id: 'sync', label: 'Synchronisation', icon: RefreshCw, shortcut: 'F8' },
  ] as const;

  return (
    <nav className="bg-slate-100 border-b border-slate-200 px-4 py-1.5 flex items-center justify-between">
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                isActive ? 'bg-amber-700 text-amber-100 font-bold' : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.shortcut}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 pl-4">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-all"
        >
          <Search className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden md:inline">Recherche universelle...</span>
          <kbd className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200">
            Ctrl + K
          </kbd>
        </button>

        <button className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg" title="Paramètres">
          <Settings className="w-4 h-4" />
        </button>

        <button className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg" title="Aide & Documentation">
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};
