import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Landmark, 
  TrendingUp, 
  Calculator, 
  FileText,
  Layers,
  BookOpen,
  Scale,
  Check
} from 'lucide-react';
import { ReportsManager } from './reports/ReportsManager';

export const AccountingView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reports' | 'balance'>('reports');

  return (
    <div className="w-full px-6 lg:px-8 py-6 space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Tab Switcher - Full Width */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm flex items-center justify-between gap-3 text-sm font-semibold print:hidden">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 py-3 px-5 rounded-xl flex items-center justify-center gap-2.5 transition-all ${
            activeTab === 'reports'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span>Éditions & Reportings Réglementaires Multi-Formats (PDF / Excel / Word / HTML)</span>
        </button>

        <button
          onClick={() => setActiveTab('balance')}
          className={`flex-1 py-3 px-5 rounded-xl flex items-center justify-center gap-2.5 transition-all ${
            activeTab === 'balance'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span>Grand Livre & Balance Générale des Comptes (SYSCOA-SFD)</span>
        </button>
      </div>

      {activeTab === 'reports' ? (
        <ReportsManager />
      ) : (
        /* Balance & Grand Livre Table - Full Screen */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-5 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-100 text-slate-800 rounded-2xl border border-slate-200 flex items-center justify-center shadow-sm">
                <Scale className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Balance Générale des Comptes & Grand Livre (Plan SFD / BCEAO)
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-0.5">
                  Balance de vérification à 6 colonnes, équilibre strict Débit/Crédit et soldes cumulés.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold transition-all shadow-sm"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Imprimer Balance A4</span>
              </button>
            </div>
          </div>

          {/* Large KPIs Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Mouvements Débit</span>
              <div className="text-2xl font-black font-mono text-slate-900 mt-2">
                7 770 000 F.CFA
              </div>
              <span className="text-xs text-slate-500 mt-1 block font-medium">Flux débiteurs cumulés</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Mouvements Crédit</span>
              <div className="text-2xl font-black font-mono text-slate-900 mt-2">
                2 459 648 F.CFA
              </div>
              <span className="text-xs text-slate-500 mt-1 block font-medium">Flux créditeurs cumulés</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Équilibre Comptable</span>
              <div className="text-2xl font-black font-mono text-emerald-800 mt-2">
                PARFAITEMENT ÉQUILIBRÉ
              </div>
              <span className="text-xs text-slate-500 mt-1 block font-medium">Principe de la partie double respecté</span>
            </div>
          </div>

          {/* Full Screen High-Visibility Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                  <th className="py-4 px-5 font-bold">Compte SFD</th>
                  <th className="py-4 px-5 font-bold">Intitulé du Compte</th>
                  <th className="py-4 px-5 text-right font-bold">Mouvement Débit</th>
                  <th className="py-4 px-5 text-right font-bold">Mouvement Crédit</th>
                  <th className="py-4 px-5 text-right font-bold">Solde Débiteur</th>
                  <th className="py-4 px-5 text-right font-bold">Solde Créditeur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5 font-bold text-slate-900">571100</td>
                  <td className="py-4 px-5 font-sans font-semibold text-slate-900 text-sm">Caisse Principale (Agence Siège)</td>
                  <td className="py-4 px-5 text-right font-medium">1 450 000</td>
                  <td className="py-4 px-5 text-right font-medium">1 216 757</td>
                  <td className="py-4 px-5 text-right font-bold text-emerald-800 text-base">233 243 F</td>
                  <td className="py-4 px-5 text-right font-medium text-slate-400">-</td>
                </tr>
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5 font-bold text-slate-900">251211</td>
                  <td className="py-4 px-5 font-sans font-semibold text-slate-900 text-sm">Dépôts d'Épargne Ordinaire à Vue</td>
                  <td className="py-4 px-5 text-right font-medium">320 000</td>
                  <td className="py-4 px-5 text-right font-medium">600 424</td>
                  <td className="py-4 px-5 text-right font-medium text-slate-400">-</td>
                  <td className="py-4 px-5 text-right font-bold text-emerald-800 text-base">280 424 F</td>
                </tr>
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5 font-bold text-slate-900">204121</td>
                  <td className="py-4 px-5 font-sans font-semibold text-slate-900 text-sm">Crédits au Personnel & Dirigeants</td>
                  <td className="py-4 px-5 text-right font-medium">6 000 000</td>
                  <td className="py-4 px-5 text-right font-medium">742 891</td>
                  <td className="py-4 px-5 text-right font-bold text-slate-900 text-base">5 257 109 F</td>
                  <td className="py-4 px-5 text-right font-medium text-slate-400">-</td>
                </tr>
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5 font-bold text-slate-900">101100</td>
                  <td className="py-4 px-5 font-sans font-semibold text-slate-900 text-sm">Capital Social / Parts Sociales Souscrites</td>
                  <td className="py-4 px-5 text-right font-medium">0</td>
                  <td className="py-4 px-5 text-right font-medium">500 000</td>
                  <td className="py-4 px-5 text-right font-medium text-slate-400">-</td>
                  <td className="py-4 px-5 text-right font-bold text-slate-900 text-base">500 000 F</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
