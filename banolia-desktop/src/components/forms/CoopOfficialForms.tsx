import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Search, 
  CheckCircle, 
  XCircle, 
  Stamp, 
  Building2, 
  CreditCard, 
  UserCheck, 
  Calendar,
  DollarSign,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { Member } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { CoopOfficialHeader, getStoredHeaderConfig } from './CoopOfficialHeader';

interface CoopOfficialFormsProps {
  members: Member[];
}

export const CoopOfficialForms: React.FC<CoopOfficialFormsProps> = ({ members }) => {
  const { theme } = useTheme();
  const [activeFormTab, setActiveFormTab] = useState<'deliberation' | 'retrait'>('deliberation');
  
  // Configuration Institutionnelle Dynamique (En-tête, Devise, Signataires)
  const [headerConfig, setHeaderConfig] = useState(getStoredHeaderConfig);

  React.useEffect(() => {
    const handleUpdate = () => {
      setHeaderConfig(getStoredHeaderConfig());
    };
    window.addEventListener('coop_settings_updated', handleUpdate);
    return () => window.removeEventListener('coop_settings_updated', handleUpdate);
  }, []);

  // Search & Member auto-fill
  const [searchQuery, setSearchQuery] = useState('130049');
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

  // ==========================================
  // FORMULAIRE 1 : DÉLIBÉRATION DE PRÊT
  // ==========================================
  const [delibNumber, setDelibNumber] = useState('2026/042');
  const [savingsAmount, setSavingsAmount] = useState<number>(280424);
  const [debtAmount, setDebtAmount] = useState<number>(525710);
  const [subscriptionAmount, setSubscriptionAmount] = useState<number>(50000);
  
  const [delibDecision, setDelibDecision] = useState<'APPROUVER' | 'REJETER'>('APPROUVER');
  const [grantedAmount, setGrantedAmount] = useState<number>(2500000);
  const [rejectedAmount, setRejectedAmount] = useState<number>(0);
  
  const [installmentsCount, setInstallmentsCount] = useState<number>(24);
  const [loanInterestRate, setLoanInterestRate] = useState<number>(6.5);
  const [startDateStr, setStartDateStr] = useState('01/10/2026');
  const [cityDateStr, setCityDateStr] = useState(() => {
    const city = localStorage.getItem('coop_institution_city') || 'Lomé';
    return `${city}, le ${new Date().toLocaleDateString('fr-FR')}`;
  });

  // Décompte Financier
  const [insuranceFee, setInsuranceFee] = useState<number>(37500); // 1.5%
  const [dossierFee, setDossierFee] = useState<number>(25000); // 1%
  const [previousLoanDeduction, setPreviousLoanDeduction] = useState<number>(0); // Rachat éventuel
  const [savingsComplement, setSavingsComplement] = useState<number>(0);

  // Auto-calculation: Net à Payer
  const totalDeductions = (delibDecision === 'APPROUVER' ? insuranceFee + dossierFee + previousLoanDeduction + savingsComplement : 0);
  const netToPay = Math.max(0, (delibDecision === 'APPROUVER' ? grantedAmount - totalDeductions : 0));

  // ==========================================
  // FORMULAIRE 2 : FICHE DE RETRAIT PARTIEL N° R
  // ==========================================
  const [retraitRefNumber, setRetraitRefNumber] = useState('2026-089');
  const [retraitRequestedAmount, setRetraitRequestedAmount] = useState<number>(200000);
  const [retraitDateNum, setRetraitDateNum] = useState('28/08/2026 - R-89');
  
  // Section 2 - Analyse Gérante
  const [retraitCurrentSavings, setRetraitCurrentSavings] = useState<number>(1280000);
  const [retraitGuaranteeSavings, setRetraitGuaranteeSavings] = useState<number>(300000);
  const [retraitSubscriptionFlag, setRetraitSubscriptionFlag] = useState<'O' | 'N'>('O');
  const [retraitSubscriptionAmount, setRetraitSubscriptionAmount] = useState<number>(50000);
  const [retraitCurrentCredit, setRetraitCurrentCredit] = useState<number>(450000);
  const [retraitEngagementType, setRetraitEngagementType] = useState<'COURT_MOYEN' | 'LONG_TERME'>('LONG_TERME');
  
  // Calcul et Règles du Retrait Maximum :
  // Court et Moyen terme : basé directement sur le solde disponible.
  // Long terme : Épargne Actuelle - Épargne Garantie - Crédit Long Terme en cours
  const maxPossibleWithdrawal = retraitEngagementType === 'LONG_TERME'
    ? Math.max(0, retraitCurrentSavings - retraitGuaranteeSavings - retraitCurrentCredit)
    : Math.max(0, retraitCurrentSavings - 50000);

  // Section 3 - Avis Comité
  const [retraitCommitteeGranted, setRetraitCommitteeGranted] = useState<number>(200000);
  const [retraitCommitteeDate, setRetraitCommitteeDate] = useState('29/08/2026');

  // Section 4 - Avis TG et PCA
  const [retraitTgPcaGranted, setRetraitTgPcaGranted] = useState<number>(200000);

  // Section 5 - Décaissement Caissier
  const [retraitDisbursedAmount, setRetraitDisbursedAmount] = useState<number>(200000);

  // Quick Member Switch
  const handleSelectMember = (m: Member) => {
    setSelectedMember(m);
    setSearchQuery(m.manualNumber || m.code);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full px-4 lg:px-8 py-6 space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header Controls (Hidden during print) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div 
              style={{ backgroundColor: theme.primaryAccent, color: '#ffffff' }}
              className="p-3 rounded-xl shadow-sm"
            >
              <Stamp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  Formulaires Officiels Numériques {headerConfig.institutionName} {localStorage.getItem('coop_partner_entity') ? `• ${localStorage.getItem('coop_partner_entity')}` : ''}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                  Conformes aux Documents Originaux
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Saisie interactive, calcul automatique des décomptes et impression au format officiel A4.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              style={{ backgroundColor: theme.primaryAccent, color: '#ffffff' }}
              className="flex items-center gap-2 hover:opacity-95 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer la Fiche Officielle A4</span>
            </button>
          </div>
        </div>

        {/* Member Selector Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
              Sociétaire concerné :
            </span>
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher matricule (ex: 130049) ou nom..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Quick switcher buttons */}
          <div className="flex items-center gap-2">
            {members.slice(0, 3).map((m) => (
              <button
                key={m.code}
                type="button"
                onClick={() => handleSelectMember(m)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-all ${
                  (m.manualNumber || m.code) === (selectedMember.manualNumber || selectedMember.code)
                    ? 'bg-slate-900 border-slate-900 text-white font-bold'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {m.manualNumber || m.code} ({m.fullName.split(' ')[0]})
              </button>
            ))}
          </div>
        </div>

        {/* Document Tab Switcher */}
        <div className="flex border-b border-slate-200 gap-2 pt-2">
          <button
            onClick={() => setActiveFormTab('deliberation')}
            className={`pb-2.5 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
              activeFormTab === 'deliberation'
                ? 'border-slate-900 text-slate-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Formulaire 1 : DÉLIBÉRATION DE PRÊT</span>
          </button>

          <button
            onClick={() => setActiveFormTab('retrait')}
            className={`pb-2.5 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
              activeFormTab === 'retrait'
                ? 'border-slate-900 text-slate-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Formulaire 2 : FICHE DE RETRAIT PARTIEL</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DOCUMENT NUMÉRIQUE 1 : DÉLIBÉRATION DE PRÊT (FIDÈLE À LA PHOTO ORIGINALE) */}
      {/* ========================================================================= */}
      {activeFormTab === 'deliberation' && (
        <div className="bg-white border border-slate-300 shadow-2xl rounded-xl p-8 max-w-[860px] mx-auto text-slate-950 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none">
          
          {/* Institutional Official Header (Dynamique & Configurable) */}
          <CoopOfficialHeader
            documentNumber={delibNumber}
            onDocumentNumberChange={setDelibNumber}
            showReference={true}
          />

          {/* Title Banner */}
          <div className="text-center py-2 mb-4">
            <h1 className="text-xl font-black uppercase tracking-widest text-slate-950 font-serif border-b-2 border-t-2 border-slate-900 py-1 inline-block px-8">
              DÉLIBÉRATION DE PRÊT
            </h1>
          </div>

          {/* Main Grid: Situation Sociétaire (Left) & Décision (Center/Right) */}
          <div className="grid grid-cols-12 gap-6 mb-6">
            
            {/* Left Block: Situation Financière Actuelle (3 Encadrés) */}
            <div className="col-span-12 sm:col-span-4 space-y-2.5 text-xs font-bold">
              <div className="flex items-center justify-between border border-slate-900 p-2 rounded">
                <span>ÉPARGNE :</span>
                <input 
                  type="number" 
                  value={savingsAmount}
                  onChange={(e) => setSavingsAmount(Number(e.target.value))}
                  className="w-28 text-right font-mono font-bold bg-transparent focus:outline-none"
                />
                <span className="font-normal text-[10px] ml-1">F</span>
              </div>

              <div className="flex items-center justify-between border border-slate-900 p-2 rounded">
                <span>DETTE :</span>
                <input 
                  type="number" 
                  value={debtAmount}
                  onChange={(e) => setDebtAmount(Number(e.target.value))}
                  className="w-28 text-right font-mono font-bold bg-transparent focus:outline-none"
                />
                <span className="font-normal text-[10px] ml-1">F</span>
              </div>

              <div className="flex items-center justify-between border border-slate-900 p-2 rounded">
                <span>SOUSCRIPTION :</span>
                <input 
                  type="number" 
                  value={subscriptionAmount}
                  onChange={(e) => setSubscriptionAmount(Number(e.target.value))}
                  className="w-28 text-right font-mono font-bold bg-transparent focus:outline-none"
                />
                <span className="font-normal text-[10px] ml-1">F</span>
              </div>
            </div>

            {/* Right Block: Décision du Comité de Crédits */}
            <div className="col-span-12 sm:col-span-8 border border-slate-900 p-3 rounded space-y-2.5 text-xs">
              <div className="font-bold text-slate-900">
                Le Comité de crédits après délibération décide de :
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                {/* Rejeter / Approuver Options */}
                <div className="space-y-2 font-bold">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="decision" 
                      checked={delibDecision === 'REJETER'} 
                      onChange={() => setDelibDecision('REJETER')}
                      className="w-4 h-4 text-slate-900"
                    />
                    <span>Rejeter :</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="decision" 
                      checked={delibDecision === 'APPROUVER'} 
                      onChange={() => setDelibDecision('APPROUVER')}
                      className="w-4 h-4 text-slate-900"
                    />
                    <span>Approuver :</span>
                  </label>
                </div>

                {/* Amounts Box */}
                <div className="space-y-2 font-mono">
                  <div className="flex items-center justify-between border border-slate-400 p-1.5 rounded bg-slate-50">
                    <span className="text-[10px] font-sans font-bold text-slate-600">MONTANT ACCORDÉ :</span>
                    <input 
                      type="number"
                      disabled={delibDecision !== 'APPROUVER'}
                      value={delibDecision === 'APPROUVER' ? grantedAmount : 0}
                      onChange={(e) => setGrantedAmount(Number(e.target.value))}
                      className="w-24 text-right font-bold text-slate-900 bg-transparent focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between border border-slate-400 p-1.5 rounded bg-slate-50">
                    <span className="text-[10px] font-sans font-bold text-slate-600">MONTANT REJETÉ :</span>
                    <input 
                      type="number"
                      disabled={delibDecision !== 'REJETER'}
                      value={delibDecision === 'REJETER' ? rejectedAmount : 0}
                      onChange={(e) => setRejectedAmount(Number(e.target.value))}
                      className="w-24 text-right font-bold text-slate-900 bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Member & Loan Details Lines */}
          <div className="space-y-3 text-xs font-medium mb-6">
            <div className="flex items-baseline gap-2">
              <span className="whitespace-nowrap font-bold">La demande introduite par M(me) :</span>
              <span className="flex-1 font-bold font-mono text-sm border-b border-dotted border-slate-800 pb-0.5">
                {selectedMember.fullName} (Matricule : {selectedMember.manualNumber || selectedMember.code})
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="whitespace-nowrap font-bold">Pour un montant :</span>
              <span className="flex-1 font-mono font-bold text-sm border-b border-dotted border-slate-800 pb-0.5">
                {grantedAmount.toLocaleString('fr-FR')} Francs CFA
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2">
              <span className="whitespace-nowrap font-bold">Remboursable en</span>
              <input 
                type="number" 
                value={installmentsCount}
                onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                className="w-12 text-center font-mono font-bold border-b border-dotted border-slate-800 bg-transparent focus:outline-none"
              />
              <span className="whitespace-nowrap font-bold">Mensualités au taux de</span>
              <input 
                type="number" 
                step="0.1"
                value={loanInterestRate}
                onChange={(e) => setLoanInterestRate(Number(e.target.value))}
                className="w-14 text-center font-mono font-bold border-b border-dotted border-slate-800 bg-transparent focus:outline-none"
              />
              <span className="whitespace-nowrap font-bold">% à compter de</span>
              <input 
                type="text" 
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                className="w-28 text-center font-mono font-bold border-b border-dotted border-slate-800 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Middle Signatures & Financial Breakdown Table */}
          <div className="grid grid-cols-12 gap-6 items-start mb-6">
            
            {/* Left: Date & Signatures Comité de Crédit / Gérante */}
            <div className="col-span-12 sm:col-span-6 space-y-8">
              <div className="flex items-center gap-2 text-xs font-bold">
                <input 
                  type="text" 
                  value={cityDateStr} 
                  onChange={(e) => setCityDateStr(e.target.value)}
                  className="w-48 font-bold border-b border-dotted border-slate-800 bg-transparent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-bold pt-4 text-center">
                <div className="border-t border-slate-900 pt-2">
                  <span>{headerConfig.creditCommitteePresidentName}</span>
                  <div className="h-16 flex items-center justify-center text-[11px] text-slate-400 italic">
                    (Émargement & Sceau)
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-2">
                  <span>{headerConfig.managerName}</span>
                  <div className="h-16 flex items-center justify-center text-[11px] text-slate-400 italic">
                    (Visa & Signature)
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Tableau Décomptes Financiers (Faithful to Photo 1) */}
            <div className="col-span-12 sm:col-span-6 border border-slate-900 rounded overflow-hidden text-xs">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-bold bg-slate-50">ASSURANCE</td>
                    <td className="p-2 text-right font-mono font-bold">
                      <input 
                        type="number" 
                        value={insuranceFee}
                        onChange={(e) => setInsuranceFee(Number(e.target.value))}
                        className="w-24 text-right font-mono font-bold bg-transparent focus:outline-none"
                      /> F
                    </td>
                  </tr>

                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-bold bg-slate-50">FRAIS DE DOSSIER</td>
                    <td className="p-2 text-right font-mono font-bold">
                      <input 
                        type="number" 
                        value={dossierFee}
                        onChange={(e) => setDossierFee(Number(e.target.value))}
                        className="w-24 text-right font-mono font-bold bg-transparent focus:outline-none"
                      /> F
                    </td>
                  </tr>

                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-bold bg-slate-50">MONTANT DU PRÊT À DÉDUIRE</td>
                    <td className="p-2 text-right font-mono font-bold">
                      <input 
                        type="number" 
                        value={previousLoanDeduction}
                        onChange={(e) => setPreviousLoanDeduction(Number(e.target.value))}
                        className="w-24 text-right font-mono font-bold bg-transparent focus:outline-none"
                      /> F
                    </td>
                  </tr>

                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-bold bg-slate-50">COMPLÉMENT ÉPARGNE</td>
                    <td className="p-2 text-right font-mono font-bold">
                      <input 
                        type="number" 
                        value={savingsComplement}
                        onChange={(e) => setSavingsComplement(Number(e.target.value))}
                        className="w-24 text-right font-mono font-bold bg-transparent focus:outline-none"
                      /> F
                    </td>
                  </tr>

                  <tr className="bg-slate-900 text-white">
                    <td className="p-2.5 font-black uppercase text-xs">NET À PAYER</td>
                    <td className="p-2.5 text-right font-mono font-black text-sm text-yellow-300">
                      {netToPay.toLocaleString('fr-FR')} F
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Authority Signatures */}
          <div className="grid grid-cols-2 gap-8 border-t-2 border-slate-900 pt-6 mt-6 text-xs font-bold text-center">
            <div>
              <div className="uppercase tracking-wider text-slate-800">Le Trésorier Général</div>
              <div className="font-mono font-extrabold text-sm text-slate-950 mt-1">
                {headerConfig.treasurerName}
              </div>
              <div className="h-16 flex items-center justify-center text-[10px] text-slate-400 italic">
                (Signature & Date)
              </div>
            </div>

            <div>
              <div className="uppercase tracking-wider text-slate-800">
                Le Président du Conseil d'Administration
              </div>
              <div className="font-bold text-sm text-slate-950 mt-1">
                {headerConfig.pcaName}
              </div>
              <div className="h-16 flex items-center justify-center text-[10px] text-slate-400 italic">
                (Signature & Date)
              </div>
            </div>
          </div>

          {/* Official Institutional Motto (Faithful to Photo 1 bottom right) */}
          <div className="text-right text-[11px] font-black italic tracking-widest text-slate-800 uppercase mt-4 pt-2 border-t border-slate-200">
            {headerConfig.motto}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOCUMENT NUMÉRIQUE 2 : FICHE DE RETRAIT PARTIEL N° R (PHOTO ORIGINALE 2)  */}
      {/* ========================================================================= */}
      {activeFormTab === 'retrait' && (
        <div className="bg-white border border-slate-300 shadow-2xl rounded-xl p-8 max-w-[860px] mx-auto text-slate-950 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none space-y-6">
          
          {/* En-tête Institutionnel Officiel */}
          <CoopOfficialHeader showReference={false} />

          {/* Header Title */}
          <div className="border-b-2 border-slate-900 pb-3 flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-lg font-black uppercase tracking-wider text-slate-900 font-serif">
              FICHE DE RETRAIT PARTIEL N° R <input 
                type="text" 
                value={retraitRefNumber} 
                onChange={(e) => setRetraitRefNumber(e.target.value)}
                className="w-28 text-center font-bold font-mono border-b border-dotted border-slate-800 bg-transparent focus:outline-none"
              />
            </h1>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {headerConfig.institutionName} {localStorage.getItem('coop_partner_entity') ? `/ ${localStorage.getItem('coop_partner_entity')}` : ''}
            </span>
          </div>

          {/* Section 1: Informations à remplir par le coopérateur */}
          <div className="border border-slate-900 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 p-2 font-bold uppercase text-slate-900 border-b border-slate-900">
              1- INFORMATIONS À REMPLIR PAR LE COOPÉRATEUR
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
              <div>
                <span className="text-slate-500 font-bold block mb-1">NOM ET PRÉNOMS :</span>
                <span className="font-bold text-slate-900 font-mono text-sm block">
                  {selectedMember.fullName}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">N° MATRICULE :</span>
                <span className="font-mono font-bold text-slate-900 text-sm block">
                  {selectedMember.manualNumber || selectedMember.code}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">MONTANT SOLLICITÉ :</span>
                <div className="flex items-center gap-1 font-mono font-bold text-base text-slate-900">
                  <input 
                    type="number"
                    value={retraitRequestedAmount}
                    onChange={(e) => setRetraitRequestedAmount(Number(e.target.value))}
                    className="w-36 font-bold border-b border-dotted border-slate-800 bg-transparent focus:outline-none"
                  />
                  <span>F.CFA</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">DATE SIGNATURE et NUMÉRO :</span>
                <input 
                  type="text"
                  value={retraitDateNum}
                  onChange={(e) => setRetraitDateNum(e.target.value)}
                  className="w-full font-bold border-b border-dotted border-slate-800 bg-transparent focus:outline-none text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Analyse de la demande par la Gérante */}
          <div className="border border-slate-900 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 p-2 font-bold uppercase text-slate-900 border-b border-slate-900 flex items-center justify-between">
              <span>2- ANALYSE DE LA DEMANDE PAR LA GÉRANTE</span>
              <div className="flex items-center gap-2 text-[10px] lowercase font-normal">
                <span className="font-bold uppercase">Règle appliquée :</span>
                <button
                  type="button"
                  onClick={() => setRetraitEngagementType('COURT_MOYEN')}
                  className={`px-2 py-0.5 rounded font-bold uppercase ${
                    retraitEngagementType === 'COURT_MOYEN' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  Court/Moyen Terme
                </button>
                <button
                  type="button"
                  onClick={() => setRetraitEngagementType('LONG_TERME')}
                  className={`px-2 py-0.5 rounded font-bold uppercase ${
                    retraitEngagementType === 'LONG_TERME' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  Long Terme
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              
              {/* OBLIGATION DE DÉPLACEMENT PHYSIQUE EN AGENCE */}
              <div className="bg-rose-50 border border-rose-300 text-rose-900 p-2.5 rounded-lg flex items-center gap-2.5 font-bold text-[11px]">
                <span className="text-base">⚠️</span>
                <span>
                  OBLIGATION FORMELLE : Le coopérateur doit impérativement se déplacer physiquement en agence / au guichet pour effectuer le retrait d'espèces muni de cette fiche signée et de sa pièce d'identité.
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-semibold">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-300">
                  <span className="text-[10px] text-slate-500 block font-bold">ÉPARGNE ACTUEL</span>
                  <input 
                    type="number"
                    value={retraitCurrentSavings}
                    onChange={(e) => setRetraitCurrentSavings(Number(e.target.value))}
                    className="w-full font-mono font-bold text-sm bg-transparent focus:outline-none mt-1"
                  />
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-300">
                  <span className="text-[10px] text-slate-500 block font-bold">ÉPARGNE GARANTIE</span>
                  <input 
                    type="number"
                    value={retraitGuaranteeSavings}
                    onChange={(e) => setRetraitGuaranteeSavings(Number(e.target.value))}
                    className="w-full font-mono font-bold text-sm bg-transparent focus:outline-none mt-1"
                  />
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-300">
                  <span className="text-[10px] text-slate-500 block font-bold">SOUSCRIPTION (O/N)</span>
                  <div className="flex items-center gap-2 mt-1">
                    <select
                      value={retraitSubscriptionFlag}
                      onChange={(e) => setRetraitSubscriptionFlag(e.target.value as any)}
                      className="font-bold border border-slate-400 rounded px-1.5 py-0.5 bg-white"
                    >
                      <option value="O">OUI (O)</option>
                      <option value="N">NON (N)</option>
                    </select>
                    <input 
                      type="number"
                      value={retraitSubscriptionAmount}
                      onChange={(e) => setRetraitSubscriptionAmount(Number(e.target.value))}
                      className="w-20 font-mono font-bold text-xs bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-300">
                  <span className="text-[10px] text-slate-500 block font-bold">CRÉDIT EN COURS (C)</span>
                  <input 
                    type="number"
                    value={retraitCurrentCredit}
                    onChange={(e) => setRetraitCurrentCredit(Number(e.target.value))}
                    className="w-full font-mono font-bold text-sm text-red-900 bg-transparent focus:outline-none mt-1"
                  />
                </div>
              </div>

              {/* Retrait maximal possible */}
              <div className="p-3 bg-slate-900 text-white rounded-lg flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    RETRAIT MAXIMAL POSSIBLE ({retraitEngagementType === 'LONG_TERME' ? 'RÈGLE LONG TERME' : 'RÈGLE COURT/MOYEN TERME'})
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {retraitEngagementType === 'LONG_TERME'
                      ? 'Formule : Épargne Actuelle - Épargne Garantie - Crédit Long Terme en cours'
                      : 'Basé directement sur le solde disponible de l\'épargne.'}
                  </span>
                </div>
                <div className="text-lg font-black font-mono text-emerald-400">
                  {maxPossibleWithdrawal.toLocaleString('fr-FR')} F.CFA
                </div>
              </div>

              <div className="text-right text-xs font-bold pt-2">
                <span>DATE ET SIGNATURE GÉRANTE : </span>
                <span className="italic text-slate-500 font-normal">________________________</span>
              </div>
            </div>
          </div>

          {/* Section 3: Avis du Comité de Crédit */}
          <div className="border border-slate-900 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 p-2 font-bold uppercase text-slate-900 border-b border-slate-900 flex items-center justify-between">
              <span>3- AVIS DU COMITÉ DE CRÉDIT</span>
              <div className="flex items-center gap-2">
                <span>MONTANT ACCORDÉ :</span>
                <input 
                  type="number"
                  value={retraitCommitteeGranted}
                  onChange={(e) => setRetraitCommitteeGranted(Number(e.target.value))}
                  className="w-28 font-mono font-bold border-b border-dotted border-slate-800 bg-transparent focus:outline-none text-right"
                />
                <span>F</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 p-4 text-center font-bold">
              <div className="border-t border-slate-400 pt-1">
                <span>PRÉSIDENT</span>
                <div className="h-10 flex items-center justify-center text-[10px] text-slate-400 italic">Visa</div>
              </div>
              <div className="border-t border-slate-400 pt-1">
                <span>VICE-PRÉSIDENT</span>
                <div className="h-10 flex items-center justify-center text-[10px] text-slate-400 italic">Visa</div>
              </div>
              <div className="border-t border-slate-400 pt-1">
                <span>SECRÉTAIRE</span>
                <div className="h-10 flex items-center justify-center text-[10px] text-slate-400 italic">Visa</div>
              </div>
            </div>
          </div>

          {/* Section 4: Avis du T.G et du PCA */}
          <div className="border border-slate-900 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 p-2 font-bold uppercase text-slate-900 border-b border-slate-900 flex items-center justify-between">
              <span>4- AVIS DU T.G ET DU PCA</span>
              <div className="flex items-center gap-2">
                <span>MONTANT ACCORDÉ :</span>
                <input 
                  type="number"
                  value={retraitTgPcaGranted}
                  onChange={(e) => setRetraitTgPcaGranted(Number(e.target.value))}
                  className="w-28 font-mono font-bold border-b border-dotted border-slate-800 bg-transparent focus:outline-none text-right"
                />
                <span>F</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 p-4 text-center font-bold">
              <div className="border-t border-slate-400 pt-1">
                <span>TRÉSORIER GÉNÉRAL</span>
                <div className="text-[10px] font-mono text-slate-600">{headerConfig.treasurerName}</div>
                <div className="h-10 flex items-center justify-center text-[10px] text-slate-400 italic">Date et Signature</div>
              </div>
              <div className="border-t border-slate-400 pt-1">
                <span>{headerConfig.pcaName}</span>
                <div className="h-10 flex items-center justify-center text-[10px] text-slate-400 italic">Date et Signature</div>
              </div>
            </div>
          </div>

          {/* Section 5: Décaissement des fonds par le Caissier */}
          <div className="border border-slate-900 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 p-2 font-bold uppercase text-slate-900 border-b border-slate-900 flex items-center justify-between">
              <span>5- DÉCAISSEMENT DES FONDS PAR LE CAISSIER</span>
              <div className="flex items-center gap-2">
                <span>MONTANT DÉCAISSÉ :</span>
                <input 
                  type="number"
                  value={retraitDisbursedAmount}
                  onChange={(e) => setRetraitDisbursedAmount(Number(e.target.value))}
                  className="w-28 font-mono font-bold border-b border-dotted border-slate-800 bg-transparent focus:outline-none text-right text-emerald-900"
                />
                <span>F</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 p-4 text-center font-bold">
              <div className="border border-slate-300 p-3 rounded">
                <span className="block text-slate-800">DATE ET ÉMARGEMENT COOPÉRATEUR</span>
                <span className="text-[10px] text-slate-500 font-normal block mb-2">
                  (Précédé de Nom et Prénoms manuscrits)
                </span>
                <div className="h-14 border-t border-dotted border-slate-300 flex items-center justify-center text-slate-400 text-xs italic">
                  Signature sociétaire
                </div>
              </div>

              <div className="border border-slate-300 p-3 rounded">
                <span className="block text-slate-800">DATE ET ÉMARGEMENT CAISSIER</span>
                <span className="text-[10px] text-slate-500 font-normal block mb-2">
                  (Validation caisse & sortie de fonds)
                </span>
                <div className="h-14 border-t border-dotted border-slate-300 flex items-center justify-center text-slate-400 text-xs italic">
                  Cachet de caisse & Visa
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default CoopOfficialForms;
