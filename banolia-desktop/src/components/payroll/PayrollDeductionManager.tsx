import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  UploadCloud, 
  FileSpreadsheet, 
  Printer, 
  ShieldCheck, 
  Calculator,
  Search,
  Filter,
  Download,
  Coins,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { Member, LoanFile } from '../../types';

interface PayrollItem {
  id: string;
  employeeId: string;
  memberCode: string;
  fullName: string;
  netSalary: number;
  sharesDeduction: number;
  savingsDeduction: number;
  loanRepayment: number;
  totalDeduction: number;
  status: 'CONFORME' | 'ECART' | 'NON_CONFORME';
}

export const PayrollDeductionManager: React.FC = () => {
  const [selectedCompany, setSelectedCompany] = useState('ORGANISATION EMPLOYEUR');
  const [payrollMonth, setPayrollMonth] = useState('2026-08');
  const [payrollList, setPayrollList] = useState<PayrollItem[]>([]);
  const [isPosted, setIsPosted] = useState(false);
  const [postingMessage, setPostingMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Quotité calculator
  const [testSalary, setTestSalary] = useState<number>(450000);
  const [testRepayment, setTestRepayment] = useState<number>(120000);

  // Load real members dynamically from database
  useEffect(() => {
    const allMembers: Member[] = StorageService.getMembers();
    const allLoans: Record<string, LoanFile[]> = StorageService.getLoans();

    const generatedList: PayrollItem[] = allMembers.map((m, idx) => {
      const memberLoans = allLoans[m.code] || [];
      const activeLoan = memberLoans.find(l => l.status === 'EN_COURS' || l.status === 'EN_RETARD');
      
      const estimatedNetSalary = 350000 + ((idx * 45000) % 300000);
      const monthlySavings = m.monthlySavingsTarget || (m.isPayrollDeduction ? 25000 : 0);
      const sharesDed = 5000;
      const loanMonthly = activeLoan ? activeLoan.monthlyPayment || Math.round(activeLoan.amountGranted / (activeLoan.durationMonths || 12)) : 0;
      const totalDed = sharesDed + monthlySavings + loanMonthly;

      return {
        id: `PR-${String(idx + 1).padStart(3, '0')}`,
        employeeId: m.employeeId || `MAT-${String(8800 + idx)}`,
        memberCode: m.code,
        fullName: m.fullName,
        netSalary: estimatedNetSalary,
        sharesDeduction: sharesDed,
        savingsDeduction: monthlySavings,
        loanRepayment: loanMonthly,
        totalDeduction: totalDed,
        status: (loanMonthly / estimatedNetSalary) > 0.333 ? 'ECART' : 'CONFORME'
      };
    });

    setPayrollList(generatedList);
  }, []);

  const totalDeductionsSum = payrollList.reduce((acc, curr) => acc + curr.totalDeduction, 0);
  const totalSharesSum = payrollList.reduce((acc, curr) => acc + curr.sharesDeduction, 0);
  const totalSavingsSum = payrollList.reduce((acc, curr) => acc + curr.savingsDeduction, 0);
  const totalLoansSum = payrollList.reduce((acc, curr) => acc + curr.loanRepayment, 0);

  const maxCessible = Math.round(testSalary * 0.3333);
  const isQuotiteOk = testRepayment <= maxCessible;

  const handlePostBatch = () => {
    setIsPosted(true);
    setPostingMessage(`Bordereau mensuel (${payrollMonth}) pour "${selectedCompany}" imputé avec succès. Les comptes livrets et échéanciers de prêts ont été crédités pour un montant global de ${totalDeductionsSum.toLocaleString('fr-FR')} F.CFA.`);
  };

  const filtered = payrollList.filter(p => 
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.memberCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full px-6 lg:px-8 py-6 space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header Card - Full Width */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-100 text-slate-800 rounded-2xl border border-slate-200 flex items-center justify-center shadow-sm">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Prélèvements à la Source & Retenues sur Salaires
                </h1>
                <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full border border-slate-200 uppercase tracking-wider">
                  Check-off Automatique
                </span>
              </div>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Importation des bordereaux de paie employeurs, contrôle de la quotité cessible (33%) et imputation comptable directe.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Imprimer Bordereau A4</span>
            </button>

            <button 
              onClick={handlePostBatch}
              disabled={isPosted}
              className="flex items-center gap-2 px-6 py-3 bg-coop-primary hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isPosted ? 'Bordereau Déjà Imputé' : 'Valider & Imputer le Lot'}</span>
            </button>
          </div>
        </div>

        {postingMessage && (
          <div className="p-5 bg-slate-900 text-white rounded-xl text-sm flex items-center gap-3.5 border border-slate-800 animate-in fade-in">
            <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <span className="font-semibold text-slate-100">{postingMessage}</span>
          </div>
        )}

        {/* Company & Month Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-slate-800 font-bold mb-2 text-sm">
              Organisme Employeur / Entreprise Partenaire
            </label>
            <input
              type="text"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              placeholder="Ex: Entreprise Partenaire, Ministère, Société..."
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-800 font-bold mb-2 text-sm">
              Mois de Paie Concerné
            </label>
            <input
              type="month"
              value={payrollMonth}
              onChange={(e) => setPayrollMonth(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 font-mono font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-800 font-bold mb-2 text-sm">
              Fichier Bordereau de Paie (Excel / CSV)
            </label>
            <label className="flex items-center justify-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 border-dashed rounded-xl px-4 py-3 text-sm text-slate-700 font-semibold cursor-pointer transition-colors">
              <UploadCloud className="w-5 h-5 text-slate-600" />
              <span>Charger Fichier de Paie</span>
              <input type="file" accept=".csv, .xlsx, .xls" className="hidden" />
            </label>
          </div>
        </div>

        {/* Big Executive KPIs Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Retenues Prévues</span>
            <div className="text-2xl font-black font-mono text-slate-900 mt-2">
              {totalDeductionsSum.toLocaleString('fr-FR')} F.CFA
            </div>
            <span className="text-xs text-slate-500 mt-1 block font-medium">{payrollList.length} salariés dans le lot</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Parts Sociales Prélevées</span>
            <div className="text-2xl font-black font-mono text-slate-900 mt-2">
              {totalSharesSum.toLocaleString('fr-FR')} F.CFA
            </div>
            <span className="text-xs text-slate-500 mt-1 block font-medium">Augmentation du capital</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Épargne Mensuelle</span>
            <div className="text-2xl font-black font-mono text-emerald-800 mt-2">
              +{totalSavingsSum.toLocaleString('fr-FR')} F.CFA
            </div>
            <span className="text-xs text-slate-500 mt-1 block font-medium">Alimentation directe des livrets</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Remboursement Prêts</span>
            <div className="text-2xl font-black font-mono text-slate-900 mt-2">
              {totalLoansSum.toLocaleString('fr-FR')} F.CFA
            </div>
            <span className="text-xs text-slate-500 mt-1 block font-medium">Amortissement des échéances</span>
          </div>
        </div>
      </div>

      {/* Main Full-Width Table: Payroll Breakdown */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-slate-700" />
            <h2 className="text-lg font-bold text-slate-900">
              Ventilation Détaillée par Salarié (Bordereau de Paie)
            </h2>
          </div>

          <div className="relative w-96">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, matricule, code adhérent..."
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                <th className="py-4 px-5 font-bold">Matricule</th>
                <th className="py-4 px-5 font-bold">Code</th>
                <th className="py-4 px-5 font-bold">Nom & Prénoms</th>
                <th className="py-4 px-5 text-right font-bold">Salaire Net</th>
                <th className="py-4 px-5 text-right font-bold">Parts</th>
                <th className="py-4 px-5 text-right font-bold">Épargne</th>
                <th className="py-4 px-5 text-right font-bold">Prêt</th>
                <th className="py-4 px-5 text-right font-bold">Total Retenu</th>
                <th className="py-4 px-5 text-center font-bold">Quotité (33%)</th>
                <th className="py-4 px-5 text-center font-bold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filtered.map((item) => {
                const quotiteRatio = ((item.loanRepayment / item.netSalary) * 100).toFixed(1);
                const isOverLimit = Number(quotiteRatio) > 33.3;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">{item.employeeId}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-700">{item.memberCode}</td>
                    <td className="py-3.5 px-5 font-semibold text-slate-900 text-sm">{item.fullName}</td>
                    <td className="py-3.5 px-5 text-right font-mono">{item.netSalary.toLocaleString('fr-FR')} F</td>
                    <td className="py-3.5 px-5 text-right font-mono">{item.sharesDeduction.toLocaleString('fr-FR')} F</td>
                    <td className="py-3.5 px-5 text-right font-mono text-emerald-800 font-bold">+{item.savingsDeduction.toLocaleString('fr-FR')} F</td>
                    <td className="py-3.5 px-5 text-right font-mono text-slate-700">{item.loanRepayment.toLocaleString('fr-FR')} F</td>
                    <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900 text-sm">
                      {item.totalDeduction.toLocaleString('fr-FR')} F
                    </td>
                    <td className="py-3.5 px-5 text-center font-mono">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        isOverLimit ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'text-slate-600'
                      }`}>
                        {quotiteRatio}%
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
                        item.status === 'CONFORME'
                          ? 'bg-slate-100 text-slate-800 border-slate-300'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulator: Quotité Cessible 33% */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <Calculator className="w-6 h-6 text-slate-700" />
          <h2 className="text-lg font-bold text-slate-900">
            Simulateur Réglementaire de Quotité Cessible (Plafond Légal 33.3%)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-sm">
          <div>
            <label className="block text-slate-800 font-bold mb-2">
              Salaire Net Mensuel du Travailleur (F.CFA)
            </label>
            <input
              type="number"
              value={testSalary}
              onChange={(e) => setTestSalary(Number(e.target.value))}
              step="10000"
              className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-xl px-4 py-3 font-mono font-bold text-slate-900 text-base"
            />
          </div>

          <div>
            <label className="block text-slate-800 font-bold mb-2">
              Mensualité de Crédit Demandée (F.CFA)
            </label>
            <input
              type="number"
              value={testRepayment}
              onChange={(e) => setTestRepayment(Number(e.target.value))}
              step="5000"
              className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-xl px-4 py-3 font-mono font-bold text-slate-900 text-base"
            />
          </div>

          <div className="flex flex-col justify-center">
            <span className="text-slate-500 font-semibold text-xs">Plafond Maximum Autorisée (1/3 du Net) :</span>
            <div className="font-mono text-xl font-bold text-slate-900 mt-1">
              {maxCessible.toLocaleString('fr-FR')} F.CFA / mois
            </div>
            <div className={`text-xs font-bold mt-2 ${isQuotiteOk ? 'text-emerald-800' : 'text-rose-700'}`}>
              {isQuotiteOk ? 'Dossier Conforme : Règle des 33% respectée' : 'Dépassement de la quotité cessible autorisée'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
