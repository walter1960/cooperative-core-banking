import React, { useState } from 'react';
import { 
  PiggyBank, 
  Search, 
  UserCheck, 
  Calendar, 
  Building2, 
  Percent, 
  TrendingUp, 
  ShieldCheck, 
  PlusCircle, 
  CheckCircle2, 
  FileText, 
  Printer, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { Member } from '../types';
import { useTheme } from '../context/ThemeContext';

interface SavingsPlanItem {
  id: string;
  memberCode: string;
  employeeId: string;
  memberName: string;
  planTitle: string;
  planType: 'CARRIERE' | 'HABITAT' | 'EQUIPEMENT' | 'VOLONTAIRE';
  monthlyDeduction: number;
  targetAmount: number;
  accumulatedAmount: number;
  interestRate: number;
  durationMonths: number;
  startDate: string;
  paymentMethod: string;
  status: 'ACTIF' | 'SUSPENDU' | 'TERMINE';
  accountNumber: string;
}

const INITIAL_PLANS: SavingsPlanItem[] = [
  {
    id: 'PLAN-2026-001',
    memberCode: '130049',
    employeeId: '130049',
    memberName: 'MILDZINA Tomrom Didier',
    planTitle: 'Plan Épargne Fin de Carrière',
    planType: 'CARRIERE',
    monthlyDeduction: 50000,
    targetAmount: 5000000,
    accumulatedAmount: 1850000,
    interestRate: 5.5,
    durationMonths: 60,
    startDate: '01/01/2024',
    paymentMethod: 'Prélèvement',
    status: 'ACTIF',
    accountNumber: '2533101013004901'
  },
  {
    id: 'PLAN-2026-002',
    memberCode: '130050',
    employeeId: '130050',
    memberName: 'AGBODJAN Koffi Mensah',
    planTitle: 'Plan Épargne Projet Habitat',
    planType: 'HABITAT',
    monthlyDeduction: 75000,
    targetAmount: 3500000,
    accumulatedAmount: 1200000,
    interestRate: 5.0,
    durationMonths: 36,
    startDate: '15/03/2025',
    paymentMethod: 'Prélèvement',
    status: 'ACTIF',
    accountNumber: '2533102013005001'
  },
  {
    id: 'PLAN-2026-003',
    memberCode: '130051',
    employeeId: '130051',
    memberName: 'AMOUZOU Ablavi',
    planTitle: 'Épargne Volontaire Mensuelle',
    planType: 'VOLONTAIRE',
    monthlyDeduction: 25000,
    targetAmount: 1000000,
    accumulatedAmount: 450000,
    interestRate: 3.5,
    durationMonths: 24,
    startDate: '01/06/2025',
    paymentMethod: 'Prélèvement',
    status: 'ACTIF',
    accountNumber: '2533101013005101'
  }
];

interface SavingsManagerProps {
  members: Member[];
}

export const SavingsManager: React.FC<SavingsManagerProps> = ({ members }) => {
  const { theme } = useTheme();
  const [plans, setPlans] = useState<SavingsPlanItem[]>(INITIAL_PLANS);
  const [searchMemberQuery, setSearchMemberQuery] = useState('130049');
  const [selectedMember, setSelectedMember] = useState<Member>(() => {
    return members.find(m => m.code === '130049' || m.manualNumber === '130049') || members[0] || {
      code: '130049',
      fullName: 'MILDZINA Tomrom Didier',
      phone: '22 26 21 01',
      manualNumber: '130049',
      city: localStorage.getItem('coop_institution_city') || 'Lomé',
      address: 'Siège Principal'
    } as Member;
  });

  const [notification, setNotification] = useState<string>('');
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);

  // Form states for creating a new savings plan
  const [planType, setPlanType] = useState<SavingsPlanItem['planType']>('CARRIERE');
  const [planTitle, setPlanTitle] = useState('Plan Épargne Fin de Carrière');
  const [monthlyDeduction, setMonthlyDeduction] = useState<number>(50000);
  const [targetAmount, setTargetAmount] = useState<number>(3000000);
  const [durationMonths, setDurationMonths] = useState<number>(36);
  const [interestRate, setInterestRate] = useState<number>(5.5);
  const [paymentMethod, setPaymentMethod] = useState('Prélèvement');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  // Automatically adjust default title and rate based on plan type
  const handlePlanTypeChange = (type: SavingsPlanItem['planType']) => {
    setPlanType(type);
    if (type === 'CARRIERE') {
      setPlanTitle('Plan Épargne Fin de Carrière');
      setInterestRate(5.5);
    } else if (type === 'HABITAT') {
      setPlanTitle('Plan Épargne Projet Habitat');
      setInterestRate(5.0);
    } else if (type === 'EQUIPEMENT') {
      setPlanTitle('Plan Épargne Équipement & Véhicule');
      setInterestRate(4.5);
    } else {
      setPlanTitle('Épargne Volontaire Mensuelle');
      setInterestRate(3.5);
    }
  };

  const handleSelectMember = (m: Member) => {
    setSelectedMember(m);
    setSearchMemberQuery(m.manualNumber || m.code);
  };

  const handleCreateSavingsPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    const matricule = selectedMember.manualNumber || selectedMember.code || '130049';
    const newPlan: SavingsPlanItem = {
      id: `PLAN-2026-${String(plans.length + 1).padStart(3, '0')}`,
      memberCode: selectedMember.code,
      employeeId: matricule,
      memberName: selectedMember.fullName,
      planTitle: planTitle.trim() || 'Plan Épargne Sociétaire',
      planType,
      monthlyDeduction: Number(monthlyDeduction),
      targetAmount: Number(targetAmount),
      accumulatedAmount: 0,
      interestRate: Number(interestRate),
      durationMonths: Number(durationMonths),
      startDate: new Date(startDate).toLocaleDateString('fr-FR'),
      paymentMethod,
      status: 'ACTIF',
      accountNumber: `2533${planType === 'CARRIERE' ? '1010' : '1020'}${matricule}01`
    };

    setPlans([newPlan, ...plans]);
    setIsCreatingPlan(false);
    setNotification(`Le Plan d'Épargne "${newPlan.planTitle}" a été créé avec succès pour ${newPlan.memberName} (Matricule ${newPlan.employeeId}).`);
    setTimeout(() => setNotification(''), 7000);
  };

  // Filter members matching query
  const searchResults = members.filter(m => 
    (m.manualNumber && m.manualNumber.toLowerCase().includes(searchMemberQuery.toLowerCase())) ||
    m.code.toLowerCase().includes(searchMemberQuery.toLowerCase()) ||
    m.fullName.toLowerCase().includes(searchMemberQuery.toLowerCase())
  );

  // Projections
  const totalCotisation = monthlyDeduction * durationMonths;
  const estimatedInterests = Math.round(totalCotisation * (interestRate / 100) * (durationMonths / 24));
  const estimatedFinalCapital = totalCotisation + estimatedInterests;

  return (
    <div className="w-full px-6 lg:px-10 py-6 space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div 
            style={{ backgroundColor: theme.primaryAccent, color: '#ffffff' }}
            className="p-3.5 rounded-2xl shadow-sm"
          >
            <PiggyBank className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">
                Espace Gestionnaire de Compte : Plans d'Épargne Sociétaires
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                Prélèvement sur Salaire
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Instruction, création et paramétrage des plans d'épargne contractuelle pour les sociétaires inscrits.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreatingPlan(!isCreatingPlan)}
          style={{ backgroundColor: theme.primaryAccent, color: '#ffffff' }}
          className="flex items-center gap-2 hover:opacity-95 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isCreatingPlan ? 'Fermer le formulaire' : 'Créer un Nouveau Plan d\'Épargne'}</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs flex items-center gap-3 border border-slate-800 animate-in fade-in shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{notification}</span>
        </div>
      )}

      {/* Account Manager Form for Creating a Plan */}
      {isCreatingPlan && (
        <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Formulaire d'Ouverture de Plan d'Épargne
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Souscription & Paramétrage par le Gestionnaire de Compte
              </h2>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              Adhérent Inscrit
            </span>
          </div>

          {/* Section 1: Member Selection */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Sélectionner l'Adhérent Inscrit (Par Matricule ou Nom)
              </label>
              <span className="text-[11px] text-slate-500 font-semibold">
                * Le sociétaire doit être préalablement inscrit à la coopérative
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 relative">
                <input
                  type="text"
                  value={searchMemberQuery}
                  onChange={(e) => setSearchMemberQuery(e.target.value)}
                  placeholder="Tapez le matricule (ex: 130049) ou nom..."
                  className="w-full bg-white border border-slate-300 focus:border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                
                {/* Search Quick Switch dropdown */}
                {searchResults.length > 0 && searchMemberQuery && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {searchResults.slice(0, 4).map((m) => (
                      <button
                        key={m.code}
                        type="button"
                        onClick={() => handleSelectMember(m)}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-slate-900">{m.fullName}</span>
                        <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          Mat: {m.manualNumber || m.code}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Member Info Card */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm">
                    {selectedMember.fullName.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">{selectedMember.fullName}</span>
                    <span className="font-mono text-[11px] text-slate-600 font-semibold">
                      Matricule : <strong className="text-slate-900">{selectedMember.manualNumber || selectedMember.code}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Sociétaire Actif
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Savings Plan Parameters */}
          <form onSubmit={handleCreateSavingsPlan} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-3">
                2. Caractéristiques & Paramétrage Financier du Plan
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Type de Plan d'Épargne</label>
                  <select
                    value={planType}
                    onChange={(e) => handlePlanTypeChange(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-bold focus:outline-none"
                  >
                    <option value="CARRIERE">Retraite & Fin de Carrière (5.5%)</option>
                    <option value="HABITAT">Projet Habitat & Foncier (5.0%)</option>
                    <option value="EQUIPEMENT">Équipement & Véhicule (4.5%)</option>
                    <option value="VOLONTAIRE">Épargne Volontaire Libre (3.5%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Intitulé du Contrat</label>
                  <input
                    type="text"
                    required
                    value={planTitle}
                    onChange={(e) => setPlanTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Retenue Mensuelle (F.CFA)</label>
                  <input
                    type="number"
                    required
                    step="5000"
                    min="10000"
                    value={monthlyDeduction}
                    onChange={(e) => setMonthlyDeduction(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Objectif / Cible (F.CFA)</label>
                  <input
                    type="number"
                    required
                    step="100000"
                    min="200000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Durée de Souscription (Mois)</label>
                  <select
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="12">12 Mois (1 an)</option>
                    <option value="24">24 Mois (2 ans)</option>
                    <option value="36">36 Mois (3 ans)</option>
                    <option value="48">48 Mois (4 ans)</option>
                    <option value="60">60 Mois (5 ans)</option>
                    <option value="120">120 Mois (10 ans - Carrière)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Taux Rémunérateur (% / an)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Mode d'Alimentation</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="Prélèvement">Prélèvement</option>
                    <option value="Virement permanent bancaire">Virement bancaire (UTB / Diamond)</option>
                    <option value="Versement périodique guichet">Versement au guichet agence</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Date Prise d'Effet</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-medium text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Projection & Financial Summary Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Simulation Financière Prévisionnelle
                </span>
                <span className="text-xs text-emerald-400 font-mono font-bold">
                  Taux appliqué : {interestRate}% / an
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Cumul des Cotisations :</span>
                  <span className="text-base font-mono font-bold text-white">
                    {totalCotisation.toLocaleString('fr-FR')} F.CFA
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Intérêts Estimés :</span>
                  <span className="text-base font-mono font-bold text-emerald-400">
                    + {estimatedInterests.toLocaleString('fr-FR')} F.CFA
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Capital Final Prévisionnel :</span>
                  <span className="text-base font-mono font-bold text-yellow-400">
                    {estimatedFinalCapital.toLocaleString('fr-FR')} F.CFA
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingPlan(false)}
                className="px-5 py-2.5 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-all"
              >
                Annuler
              </button>

              <button
                type="submit"
                style={{ backgroundColor: theme.primaryAccent, color: '#ffffff' }}
                className="px-6 py-2.5 hover:opacity-95 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Activer le Plan & Enregistrer la Retenue Paie</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Portfolio of Active Savings Plans */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Portefeuille des Plans d'Épargne en Cours de Gestion
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Contrats d'épargne active avec retenue sur salaire ou prélèvement.
            </p>
          </div>
          <span className="text-xs font-bold font-mono px-3 py-1 bg-slate-100 rounded-lg text-slate-800 border border-slate-200">
            {plans.length} Contrats Actifs
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Réf. Contrat</th>
                <th className="py-3 px-4">Matricule</th>
                <th className="py-3 px-4">Nom du Sociétaire</th>
                <th className="py-3 px-4">Intitulé du Plan</th>
                <th className="py-3 px-4 text-right">Prélèvement (Mois)</th>
                <th className="py-3 px-4 text-right">Épargne Constituée</th>
                <th className="py-3 px-4 text-center">Progression</th>
                <th className="py-3 px-4 text-center">Taux</th>
                <th className="py-3 px-4 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {plans.map((p) => {
                const progressPct = Math.min(100, Math.round((p.accumulatedAmount / p.targetAmount) * 100));
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{p.id}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{p.employeeId}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{p.memberName}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{p.planTitle}</span>
                      <span className="text-[10px] text-slate-500 block">{p.paymentMethod}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {p.monthlyDeduction.toLocaleString('fr-FR')} F
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <span className="font-bold text-emerald-800 block text-xs">
                        {p.accumulatedAmount.toLocaleString('fr-FR')} F
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Cible : {p.targetAmount.toLocaleString('fr-FR')} F
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="w-24 mx-auto space-y-1">
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div 
                            style={{ width: `${progressPct}%`, backgroundColor: theme.primaryAccent }}
                            className="h-full rounded-full transition-all"
                          />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-600">{progressPct}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                      {p.interestRate}%
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
