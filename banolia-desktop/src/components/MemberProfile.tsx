import React, { useState } from 'react';
import { 
  Search, 
  Printer, 
  ArrowDownRight, 
  ArrowUpRight, 
  FileText, 
  Phone, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  CreditCard, 
  PiggyBank, 
  CheckCircle2, 
  AlertCircle,
  Share2
} from 'lucide-react';
import { Member, Account, LoanFile } from '../types';

interface MemberProfileProps {
  member: Member;
  accounts: Account[];
  loans: LoanFile[];
  onSelectMember: (code: string) => void;
  allMembers: Member[];
  onQuickDeposit: (accountNumber: string) => void;
  onQuickWithdrawal: (accountNumber: string) => void;
}

export const MemberProfile: React.FC<MemberProfileProps> = ({
  member,
  accounts,
  loans,
  onSelectMember,
  allMembers,
  onQuickDeposit,
  onQuickWithdrawal
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'loans' | 'dat' | 'savings_plan'>('accounts');
  const [searchQuery, setSearchQuery] = useState(member.code);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = allMembers.find(m => 
      m.code.toLowerCase() === searchQuery.toLowerCase() ||
      m.manualNumber === searchQuery ||
      m.phone.includes(searchQuery) ||
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (found) {
      onSelectMember(found.code);
    } else {
      alert("Aucun adhérent trouvé pour cette recherche.");
    }
  };

  const totalRealBalance = accounts.reduce((sum, a) => sum + a.realBalance, 0);
  const totalFrozenBalance = accounts.reduce((sum, a) => sum + a.frozenBalance, 0);
  const totalAvailableBalance = accounts.reduce((sum, a) => sum + a.availableBalance, 0);

  return (
    <div className="p-4 space-y-4">
      {/* Top Search & Identification Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[300px]">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par Matricule (ex: 130049), Nom ou Téléphone..."
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-amber-500 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all shadow-sm"
            >
              Rechercher
            </button>
          </div>

          {/* Quick Member switcher list */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Adhérents récents :</span>
            {allMembers.slice(0, 3).map((m) => (
              <button
                key={m.code}
                type="button"
                onClick={() => {
                  setSearchQuery(m.code);
                  onSelectMember(m.code);
                }}
                className={`text-xs px-2.5 py-1 rounded-md border font-mono transition-all ${
                  m.code === member.code
                    ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {m.code} ({m.fullName.split(' ')[0]})
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Member 360° Card Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-sm">
              <div className="w-full h-full bg-amber-50 rounded-[14px] flex items-center justify-center font-bold text-2xl text-amber-800">
                {member.fullName.charAt(0)}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900 tracking-wide">{member.fullName}</h1>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-1.5 text-xs text-slate-600 font-medium">
                <div>Matricule : <span className="font-mono text-amber-800 font-bold">{member.manualNumber || member.code}</span></div>
                <div className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {member.phone}</div>
                <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {member.city} ({member.address})</div>
                <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Inscription : {member.registrationDate}</div>
              </div>
            </div>
          </div>

          {/* Quick Global Actions */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Imprimer Situation</span>
            </button>
            <button className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm">
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Notification SMS / WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Parts Sociales & KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Parts Sociales Détenues</div>
            <div className="text-lg font-extrabold font-mono text-amber-800 mt-1">
              {member.sharesPurchased.toLocaleString('fr-FR')} F.CFA
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Valeur : {member.shareUnitPrice.toLocaleString('fr-FR')} F (1 part)</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Épargne Disponible</div>
            <div className="text-lg font-extrabold font-mono text-amber-800 mt-1">
              {totalAvailableBalance.toLocaleString('fr-FR')} F.CFA
            </div>
            <div className="text-[10px] text-amber-700 font-medium mt-0.5">Retirable immédiatement au guichet</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Montant Gelé (Garanties)</div>
            <div className="text-lg font-extrabold font-mono text-rose-700 mt-1">
              {totalFrozenBalance.toLocaleString('fr-FR')} F.CFA
            </div>
            <div className="text-[10px] text-rose-600 font-medium mt-0.5">Nanti pour sûretés / crédits</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Solde Total Brut</div>
            <div className="text-lg font-extrabold font-mono text-slate-900 mt-1">
              {totalRealBalance.toLocaleString('fr-FR')} F.CFA
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Cumul de tous les comptes</div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-200 bg-slate-50 px-3 pt-2 gap-2 overflow-x-auto">
          {[
            { id: 'accounts', label: 'Situation des comptes', count: accounts.length },
            { id: 'loans', label: 'Dossier(s) de crédit', count: loans.length },
            { id: 'dat', label: 'Dépôts à terme (DAT)', count: 0 },
            { id: 'savings_plan', label: 'Plans d\'épargne projet/carrière', count: accounts.filter(a => a.type === 'CAREER_PLAN' || a.type === 'PROJECT_PLAN').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                activeSubTab === tab.id
                  ? 'border-amber-600 text-amber-900 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeSubTab === tab.id ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab 1: Situation des comptes */}
        {activeSubTab === 'accounts' && (
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/50 uppercase text-[11px]">
                  <th className="py-3 px-3 font-bold">N° Compte</th>
                  <th className="py-3 px-3 font-bold">Produit Bancaire</th>
                  <th className="py-3 px-3 text-right font-bold">Montant Réel</th>
                  <th className="py-3 px-3 text-right font-bold">Montant Gelé</th>
                  <th className="py-3 px-3 text-right font-bold">Disponible</th>
                  <th className="py-3 px-3 text-center font-bold">Actions Guichet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {accounts.map((acc) => (
                  <tr key={acc.accountNumber} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-amber-800">{acc.accountNumber}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-900">{acc.productName}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {acc.realBalance.toLocaleString('fr-FR')} {acc.currency}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                      {acc.frozenBalance > 0 ? `${acc.frozenBalance.toLocaleString('fr-FR')} ${acc.currency}` : '0'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-amber-900">
                      <span className="bg-amber-50 px-2 py-1 rounded border border-amber-200">
                        {acc.availableBalance.toLocaleString('fr-FR')} {acc.currency}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onQuickDeposit(acc.accountNumber)}
                          className="flex items-center gap-1 bg-amber-50 hover:bg-amber-600 text-amber-900 hover:text-white border border-amber-300 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all shadow-sm"
                          title="Faire un versement d'espèces"
                        >
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          <span>Dépôt</span>
                        </button>
                        <button
                          onClick={() => onQuickWithdrawal(acc.accountNumber)}
                          disabled={acc.availableBalance <= 0}
                          className="flex items-center gap-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-300 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all disabled:opacity-40 disabled:hover:bg-rose-50 disabled:hover:text-rose-700 shadow-sm"
                          title="Faire un retrait d'espèces"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>Retrait</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Dossiers de crédit */}
        {activeSubTab === 'loans' && (
          <div className="p-4">
            {loans.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                Aucun dossier de crédit en cours pour cet adhérent.
              </div>
            ) : (
              <div className="space-y-3">
                {loans.map((loan) => (
                  <div key={loan.loanNumber} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-700 text-sm">{loan.loanNumber}</span>
                        <span className="text-xs font-bold text-slate-900">{loan.productName}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-2 flex flex-wrap gap-4 font-medium">
                        <span>Montant octroyé : <strong className="text-slate-900 font-mono">{loan.amountGranted.toLocaleString('fr-FR')} F</strong></span>
                        <span>Taux : <strong className="text-slate-900 font-mono">{loan.interestRate}%</strong></span>
                        <span>Durée : <strong className="text-slate-900 font-mono">{loan.durationMonths} mois</strong></span>
                        <span>Échéance mensuelle : <strong className="text-amber-800 font-mono font-bold">{loan.monthlyPayment.toLocaleString('fr-FR')} F</strong></span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] text-slate-500 font-bold uppercase">Capital Restant Dû :</div>
                      <div className="text-base font-black font-mono text-rose-700 mt-0.5">
                        {loan.remainingPrincipal.toLocaleString('fr-FR')} F.CFA
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
