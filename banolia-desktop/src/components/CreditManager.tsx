import React, { useState } from 'react';
import { 
  Calculator, 
  ShieldCheck, 
  FileText, 
  Percent, 
  Calendar, 
  Landmark, 
  ShieldAlert, 
  UserCheck, 
  Printer, 
  RotateCcw,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Member, LoanFile } from '../types';

interface CreditManagerProps {
  members: Member[];
  loansMap: Record<string, LoanFile[]>;
}

export const CreditManager: React.FC<CreditManagerProps> = ({ members, loansMap }) => {
  const [selectedMemberCode, setSelectedMemberCode] = useState<string>(members[0]?.code || 'A0200225');
  const [amount, setAmount] = useState<number>(1000000);
  const [interestRate, setInterestRate] = useState<number>(9.5); // % annuel
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [productType, setProductType] = useState<string>('Prêt Équipement & Habitat');
  const [netSalary, setNetSalary] = useState<number>(450000);
  const [successMsg, setSuccessMsg] = useState<string>('');

  const targetMember = members.find(m => m.code === selectedMemberCode) || members[0];

  // Calculations (Constant Annuity Formula)
  const monthlyRate = interestRate / 100 / 12;
  const monthlyPayment = monthlyRate > 0
    ? Math.round((amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -durationMonths)))
    : Math.round(amount / durationMonths);

  const totalRepayment = monthlyPayment * durationMonths;
  const totalInterest = totalRepayment - amount;

  // Quotité cessible check (1/3 of net salary)
  const maxCessible = Math.round(netSalary * 0.3333);
  const isQuotiteOk = monthlyPayment <= maxCessible;
  const debtRatio = ((monthlyPayment / netSalary) * 100).toFixed(1);

  // Generate official amortization schedule
  const schedule = [];
  let remainingPrincipal = amount;
  for (let i = 1; i <= durationMonths; i++) {
    const interestPart = Math.round(remainingPrincipal * monthlyRate);
    const principalPart = monthlyPayment - interestPart;
    remainingPrincipal = Math.max(0, remainingPrincipal - principalPart);
    schedule.push({
      month: i,
      principalPart,
      interestPart,
      totalPayment: monthlyPayment,
      remainingPrincipal
    });
  }

  const handleCreateLoan = () => {
    setSuccessMsg(`Dossier de prêt N° CRE-${Date.now().toString().slice(-6)} accordé avec succès pour ${targetMember?.fullName} (Montant : ${amount.toLocaleString('fr-FR')} F.CFA sur ${durationMonths} mois).`);
  };

  return (
    <div className="w-full px-6 lg:px-10 py-6 space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 flex items-center justify-center shadow-inner">
            <Landmark className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Portefeuille Crédit & Prêts sur Salaire
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Simulation & Octroi
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Instruction de crédit, simulation des mensualités, contrôle de la quotité cessible (33%) et échéancier officiel.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimer Contrat & Échéancier</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button 
            onClick={() => setSuccessMsg('')}
            className="text-xs text-emerald-800 hover:text-emerald-950 font-bold underline"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Main Grid: Left Loan Request & Simulator + Right Schedule Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* Left Column (5 Cols): Loan Inputs & Quotité Check */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-700" />
              <span>Paramètres du Prêt</span>
            </h2>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">Sociétaire Emprunteur</label>
              <select
                value={selectedMemberCode}
                onChange={(e) => setSelectedMemberCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold focus:outline-none"
              >
                {members.map(m => (
                  <option key={m.code} value={m.code}>
                    {m.code} - {m.fullName} ({m.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Salaire Net (F.CFA)</label>
                <input
                  type="number"
                  value={netSalary}
                  onChange={(e) => setNetSalary(Number(e.target.value))}
                  step="10000"
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-600 rounded-xl px-4 py-2.5 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Type de Prêt</label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none"
                >
                  <option value="Prêt Équipement & Habitat">Prêt Équipement & Habitat</option>
                  <option value="Avance Scolaire & Fêtes">Avance Scolaire & Fêtes</option>
                  <option value="Prêt Véhicule / Moto">Prêt Véhicule / Moto</option>
                  <option value="Secours d'Urgence Social">Secours d'Urgence Social</option>
                </select>
              </div>
            </div>

            {/* Amount Selection & Fast Chips */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-800">Montant Demandé (F.CFA)</label>
              <div className="flex flex-wrap gap-2">
                {[500000, 1000000, 2000000, 5000000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      amount === val
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {val.toLocaleString('fr-FR')} F
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                step="50000"
                min="100000"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-600 rounded-xl px-4 py-2.5 text-base font-mono font-bold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Taux d'Intérêt Annuel (%)</label>
                <input
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  step="0.5"
                  min="1"
                  max="27"
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-600 rounded-xl px-4 py-2.5 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Durée de Remboursement</label>
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none"
                >
                  {[3, 6, 9, 12, 18, 24, 36, 48, 60].map(m => (
                    <option key={m} value={m}>{m} mois ({Math.floor(m/12)} an(s) {m%12 ? `${m%12}m` : ''})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quotité & Financial Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-medium">Mensualité constante :</span>
              <span className="font-mono font-black text-emerald-900 text-base">{monthlyPayment.toLocaleString('fr-FR')} F.CFA</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-medium">Total des Intérêts :</span>
              <span className="font-mono font-bold text-emerald-800">{totalInterest.toLocaleString('fr-FR')} F.CFA</span>
            </div>
            <div className="flex justify-between items-center text-slate-900 pt-2 border-t border-slate-200 font-bold">
              <span>Montant Global Dû :</span>
              <span className="font-mono text-base font-black text-slate-900">{totalRepayment.toLocaleString('fr-FR')} F.CFA</span>
            </div>

            {/* Quotité Check Bar */}
            <div className="pt-2 border-t border-slate-200 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Taux d'endettement estimé :</span>
                <span className={`font-bold ${isQuotiteOk ? 'text-emerald-800' : 'text-rose-700'}`}>
                  {debtRatio}% (Max légal 33.3%)
                </span>
              </div>
              <div className={`text-xs font-bold ${isQuotiteOk ? 'text-emerald-800' : 'text-rose-700'}`}>
                {isQuotiteOk ? 'Dossier Conforme : Règle des 33% respectée' : 'Dépassement de la quotité cessible autorisée'}
              </div>
            </div>
          </div>

          <button 
            onClick={handleCreateLoan}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black py-3.5 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Landmark className="w-5 h-5" />
            <span>Valider & Octroyer le Prêt</span>
          </button>
        </div>

        {/* Right Column (7 Cols): Amortization Schedule Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-700" />
              <span>Échéancier d'Amortissement ({durationMonths} Mensualités)</span>
            </h3>
            <span className="text-xs font-mono text-slate-500 font-bold">
              Amortissement à Annuités Constantes
            </span>
          </div>

          <div className="max-h-[500px] overflow-y-auto pr-1">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="sticky top-0 bg-slate-50 text-slate-600 uppercase text-xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 font-bold">Échéance</th>
                  <th className="py-3 px-3.5 text-right font-bold">Capital Amorti</th>
                  <th className="py-3 px-3.5 text-right font-bold">Intérêts</th>
                  <th className="py-3 px-3.5 text-right font-bold">Total Mensualité</th>
                  <th className="py-3 px-3.5 text-right font-bold">Capital Restant Dû</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {schedule.map((row) => (
                  <tr key={row.month} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-sans font-bold text-slate-900">Mois {row.month}</td>
                    <td className="py-3 px-3.5 text-right">{row.principalPart.toLocaleString('fr-FR')} F</td>
                    <td className="py-3 px-3.5 text-right text-emerald-800 font-semibold">{row.interestPart.toLocaleString('fr-FR')} F</td>
                    <td className="py-3 px-3.5 text-right font-black text-slate-900">{row.totalPayment.toLocaleString('fr-FR')} F</td>
                    <td className="py-3 px-3.5 text-right text-slate-500">{row.remainingPrincipal.toLocaleString('fr-FR')} F</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
