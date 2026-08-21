import React from 'react';
import { Wifi, WifiOff, RefreshCw, Shield, User, Landmark, Wallet } from 'lucide-react';
import { CashRegister } from '../types';

interface HeaderProps {
  cashRegister: CashRegister;
  isOnline: boolean;
  pendingSyncCount: number;
  onToggleOnline: () => void;
  onSyncNow: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  cashRegister,
  isOnline,
  pendingSyncCount,
  onToggleOnline,
  onSyncNow,
  isSyncing
}) => {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 shadow-sm">
      {/* Top Banner */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-wider text-slate-900">BANOLIA</span>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded uppercase">
                Core Banking
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Système Intégré de Microfinance & Digital Banking</p>
          </div>
        </div>

        {/* Agency & Cash Info */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs shadow-inner">
          <div className="flex items-center gap-1.5 text-slate-700 pr-3 border-r border-slate-200">
            <Landmark className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-slate-900">{cashRegister.agencyCode}</span> - {cashRegister.agencyName}
          </div>

          <div className="flex items-center gap-1.5 text-slate-700 px-3 border-r border-slate-200">
            <User className="w-4 h-4 text-amber-600" />
            <span className="text-slate-500">Caisse {cashRegister.code} :</span>
            <span className="font-semibold text-slate-800">{cashRegister.cashierName}</span>
          </div>

          <div className="flex items-center gap-2 pl-2">
            <Wallet className="w-4 h-4 text-amber-600" />
            <span className="text-slate-500">Solde Caisse :</span>
            <span className="font-mono font-bold text-sm text-amber-950 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300">
              {cashRegister.balance.toLocaleString('fr-FR')} F.CFA
            </span>
          </div>
        </div>

        {/* Sync Indicator (Only shown if pending transactions need replay) */}
        <div className="flex items-center gap-2.5">
          {pendingSyncCount > 0 && (
            <button
              onClick={onSyncNow}
              disabled={!isOnline || isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Synchronisation ({pendingSyncCount})</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
