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
import { useTheme } from '../context/ThemeContext';

interface CreditManagerProps {
  members: Member[];
  loansMap: Record<string, LoanFile[]>;
}

export const CreditManager: React.FC<CreditManagerProps> = ({ members, loansMap }) => {
  const { theme } = useTheme();
  const [selectedMemberCode, setSelectedMemberCode] = useState<string>(members[0]?.code || '130049');
  const [amount, setAmount] = useState<number>(1000000);
  const [interestRate, setInterestRate] = useState<number>(9.5); // % annuel
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [productType, setProductType] = useState<string>('Prêt Équipement & Habitat');
  const [netSalary, setNetSalary] = useState<number>(450000);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Calendrier d'échéances (Date Début & Date Fin)
  const formatDateYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 13);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  });

  const computeMonthsFromDates = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return 12;
    const parts1 = startStr.split('-').map(Number);
    const parts2 = endStr.split('-').map(Number);
    if (parts1.length < 3 || parts2.length < 3) return 12;
    const [y1, m1, d1] = parts1;
    const [y2, m2, d2] = parts2;
    if (isNaN(y1) || isNaN(m1) || isNaN(y2) || isNaN(m2)) return 12;
    let months = (y2 - y1) * 12 + (m2 - m1);
    if ((d2 || 1) >= (d1 || 1) + 14) months += 1;
    return Math.max(1, Math.min(60, months));
  };

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (newStart && endDate) {
      const months = computeMonthsFromDates(newStart, endDate);
      setDurationMonths(months);
    }
  };

  const handleEndDateChange = (newEnd: string) => {
    setEndDate(newEnd);
    if (startDate && newEnd) {
      const months = computeMonthsFromDates(startDate, newEnd);
      setDurationMonths(months);
    }
  };

  const handleQuickDuration = (months: number) => {
    setDurationMonths(months);
    if (!startDate) return;
    const parts = startDate.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const target = new Date(parts[0], parts[1] - 1 + months, parts[2] || 1);
      setEndDate(formatDateYMD(target));
    }
  };

  const targetMember = members.find(m => m.code === selectedMemberCode) || members[0];

  // Grille Officielle des Prêts (Durées, Taux et Modalité)
  // Court terme : 0 à 12 mois -> 5% (Linéaire)
  // Moyen terme : 13 à 36 mois -> 10% (Linéaire)
  // Long terme : 37 à 60 mois -> 9% (Taux dégressif sur CRD)
  const getGridConfig = (months: number) => {
    if (months <= 12) {
      return { category: 'Court Terme (0 à 12 mois)', rate: 5.0, mode: 'LINEAIRE' as const, label: 'Taux Linéaire Constant' };
    }
    if (months <= 36) {
      return { category: 'Moyen Terme (13 à 36 mois)', rate: 10.0, mode: 'LINEAIRE' as const, label: 'Taux Linéaire Constant' };
    }
    return { category: 'Long Terme (37 à 60 mois)', rate: 9.0, mode: 'DEGRESSIF' as const, label: 'Taux Dégressif (sur Capital Restant Dû)' };
  };

  const gridConfig = getGridConfig(durationMonths);
  const effectiveRate = gridConfig.rate;
  const isDegressive = gridConfig.mode === 'DEGRESSIF';

  // Calculations selon la méthode adéquate
  let monthlyPayment = 0;
  let totalInterest = 0;
  const schedule: Array<{
    month: number;
    dateLabel: string;
    principalPart: number;
    interestPart: number;
    totalPayment: number;
    remainingPrincipal: number;
  }> = [];

  if (!isDegressive) {
    // Mode Linéaire : (Capital / n) + (Capital * Taux / 12)
    const monthlyInterest = Math.round((amount * (effectiveRate / 100)) / 12);
    const monthlyPrincipal = Math.round(amount / durationMonths);
    monthlyPayment = monthlyPrincipal + monthlyInterest;
    totalInterest = monthlyInterest * durationMonths;

    let remaining = amount;
    for (let i = 1; i <= durationMonths; i++) {
      const p = (i === durationMonths) ? remaining : monthlyPrincipal;
      remaining = Math.max(0, remaining - p);
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      const dateLabel = isNaN(dueDate.getTime()) ? `M${i}` : dueDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });

      schedule.push({
        month: i,
        dateLabel,
        principalPart: p,
        interestPart: monthlyInterest,
        totalPayment: p + monthlyInterest,
        remainingPrincipal: remaining
      });
    }
  } else {
    // Mode Dégressif : Annuité constante
    const monthlyRate = effectiveRate / 100 / 12;
    monthlyPayment = monthlyRate > 0
      ? Math.round((amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -durationMonths)))
      : Math.round(amount / durationMonths);

    let remaining = amount;
    for (let i = 1; i <= durationMonths; i++) {
      const interestPart = Math.round(remaining * monthlyRate);
      const principalPart = (i === durationMonths) ? remaining : (monthlyPayment - interestPart);
      totalInterest += interestPart;
      remaining = Math.max(0, remaining - principalPart);
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      const dateLabel = isNaN(dueDate.getTime()) ? `M${i}` : dueDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });

      schedule.push({
        month: i,
        dateLabel,
        principalPart,
        interestPart,
        totalPayment: principalPart + interestPart,
        remainingPrincipal: remaining
      });
    }
  }

  const totalRepayment = amount + totalInterest;

  // Quotité cessible check (1/3 of net salary)
  const maxCessible = Math.round(netSalary * 0.3333);
  const isQuotiteOk = monthlyPayment <= maxCessible;
  const debtRatio = ((monthlyPayment / netSalary) * 100).toFixed(1);

  const handleCreateLoan = () => {
    setSuccessMsg(`Dossier de prêt N° CRE-${Date.now().toString().slice(-6)} accordé avec succès pour ${targetMember?.fullName} (Montant : ${amount.toLocaleString('fr-FR')} F.CFA sur ${durationMonths} mois au taux de ${effectiveRate}% [${gridConfig.label}]).`);
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
                {[500000, 1000000, 2500000, 5000000, 10000000, 15000000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    style={amount === val ? { backgroundColor: theme.primaryAccent, color: '#ffffff', borderColor: theme.primaryAccent } : {}}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      amount === val
                        ? 'shadow-sm'
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
                max="15000000"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl px-4 py-2.5 text-base font-mono font-bold text-slate-900"
              />
            </div>

            {/* Calendrier de Remboursement & Durée Dynamique */}
            <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Calendrier d'Échéance & Durée</span>
                </div>
                <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg">
                  <span className="text-[11px] font-bold text-blue-800">Durée :</span>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={durationMonths}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 1 && val <= 60) {
                        handleQuickDuration(val);
                      }
                    }}
                    className="w-12 bg-white border border-blue-300 font-mono font-black text-xs text-blue-950 px-1.5 py-0.5 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="font-mono font-bold text-xs text-blue-800">mois</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date de Début (1er Prélèvement)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date de Fin (Dernière Échéance)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 shadow-sm"
                  />
                </div>
              </div>

              {/* Raccourcis Paliers */}
              <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-1 text-xs">
                <span className="text-[11px] text-slate-500 font-medium mr-1">Raccourcis :</span>
                {[6, 12, 18, 24, 36, 48, 60].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleQuickDuration(m)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all ${
                      durationMonths === m
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            {/* Taux & Méthode de la Grille Officielle */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-bold block">Taux Grille Officielle</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{effectiveRate}% / an</span>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${
                isDegressive ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {gridConfig.label}
              </span>
            </div>
          </div>

          {/* Quotité & Financial Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-medium">Mensualité constante :</span>
              <span className="font-mono font-black text-slate-950 text-base">{monthlyPayment.toLocaleString('fr-FR')} F.CFA</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-medium">Total des Intérêts :</span>
              <span className="font-mono font-bold text-coop-primary">{totalInterest.toLocaleString('fr-FR')} F.CFA</span>
            </div>
            <div className="flex justify-between items-center text-slate-900 pt-2 border-t border-slate-200 font-bold">
              <span>Montant Global Dû :</span>
              <span className="font-mono text-base font-black text-slate-900">{totalRepayment.toLocaleString('fr-FR')} F.CFA</span>
            </div>

            {/* Quotité Check Bar */}
            <div className="pt-2 border-t border-slate-200 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Taux d'endettement estimé :</span>
                <span className={`font-bold ${isQuotiteOk ? 'text-coop-primary' : 'text-rose-700'}`}>
                  {debtRatio}% (Max légal 33.3%)
                </span>
              </div>
              <div className={`text-xs font-bold ${isQuotiteOk ? 'text-coop-primary' : 'text-rose-700'}`}>
                {isQuotiteOk ? 'Dossier Conforme : Règle des 33% respectée' : 'Dépassement de la quotité cessible autorisée'}
              </div>
            </div>
          </div>

          <button 
            onClick={handleCreateLoan}
            style={{ backgroundColor: theme.primaryAccent, color: '#ffffff' }}
            className="w-full hover:opacity-90 text-white font-black py-3.5 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Landmark className="w-5 h-5" />
            <span>Valider & Octroyer le Prêt</span>
          </button>
        </div>

        {/* Right Column (7 Cols): Amortization Schedule Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-coop-primary" />
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
                    <td className="py-3 px-3.5 font-sans text-slate-900">
                      <div className="font-bold">Mois {row.month}</div>
                      <div className="text-[11px] text-slate-500 font-normal">{row.dateLabel}</div>
                    </td>
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
