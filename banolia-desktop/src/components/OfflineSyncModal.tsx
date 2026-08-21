import React from 'react';
import { RefreshCw, CheckCircle2, Wifi, WifiOff, AlertTriangle, ShieldCheck, Database } from 'lucide-react';
import { Transaction } from '../types';

interface OfflineSyncModalProps {
  isOnline: boolean;
  onToggleOnline: () => void;
  pendingTransactions: Transaction[];
  onSyncNow: () => void;
  isSyncing: boolean;
}

export const OfflineSyncModal: React.FC<OfflineSyncModalProps> = ({
  isOnline,
  onToggleOnline,
  pendingTransactions,
  onSyncNow,
  isSyncing
}) => {
  return (
    <div className="p-4 space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isOnline ? 'bg-amber-50 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700 border border-slate-300'}`}>
              {isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Moteur de Synchronisation Décentralisé</h2>
              <p className="text-xs text-slate-500">
                État actuel : <strong className={isOnline ? 'text-amber-900' : 'text-slate-700'}>{isOnline ? 'Connecté au Serveur Central' : 'Mode Hors-ligne (Base Locale Active)'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleOnline}
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                isOnline 
                  ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
            >
              {isOnline ? 'Passer en Hors-Ligne' : 'Rétablir Connexion Réseau'}
            </button>

            <button
              onClick={onSyncNow}
              disabled={!isOnline || pendingTransactions.length === 0 || isSyncing}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Synchroniser Maintenant ({pendingTransactions.length})</span>
            </button>
          </div>
        </div>

        {/* Architecture explanation banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-amber-900 text-xs font-bold flex items-center gap-1.5 mb-1">
              <Database className="w-4 h-4 text-amber-600" /> Base Locale (Offline-First)
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Toutes les opérations de caisse sont immédiatement persistées dans la base locale sécurisée, assurant une continuité de service totale au guichet.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-amber-900 text-xs font-bold flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-4 h-4 text-amber-600" /> Idempotence & Anti-Doublon
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Chaque ticket possède un condensat cryptographique unique empêchant strictement les doubles imputations lors de la reconnexion.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-indigo-900 text-xs font-bold flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Piste d'Audit BCEAO
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Horodatage certifié et numérotation séquentielle sur chaque transaction pour respecter toutes les exigences réglementaires.
            </p>
          </div>
        </div>
      </div>

      {/* Pending Transactions List */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          File d'attente de synchronisation ({pendingTransactions.length} opération(s) en attente)
        </h3>

        {pendingTransactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-amber-600 mx-auto mb-2 opacity-80" />
            <div>Toutes vos transactions sont synchronisées avec le serveur central.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-[11px] uppercase">
                  <th className="py-2.5 px-3 font-bold">N° Reçu</th>
                  <th className="py-2.5 px-3 font-bold">Adhérent</th>
                  <th className="py-2.5 px-3 font-bold">Opération</th>
                  <th className="py-2.5 px-3 text-right font-bold">Montant</th>
                  <th className="py-2.5 px-3 font-bold">Horodatage Local</th>
                  <th className="py-2.5 px-3 text-center font-bold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                {pendingTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-amber-700">{tx.receiptNumber}</td>
                    <td className="py-2.5 px-3 text-slate-900 font-sans font-medium">{tx.memberName} ({tx.memberCode})</td>
                    <td className="py-2.5 px-3 font-sans font-semibold">{tx.type}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-900">{tx.amount.toLocaleString('fr-FR')} F</td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">{tx.timestamp}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] px-2.5 py-0.5 rounded-full font-sans font-bold">
                        En attente
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
