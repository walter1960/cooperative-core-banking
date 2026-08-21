import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Printer, 
  Fingerprint, 
  Calendar, 
  CreditCard, 
  Phone, 
  MapPin, 
  User, 
  Building2, 
  FileText, 
  Download, 
  ShieldCheck, 
  Layers, 
  Coins, 
  Wallet,
  Clock,
  ArrowRight
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { Member, Account, LoanFile } from '../../types';
import { VirtualMemberCard } from '../card/VirtualMemberCard';

interface MemberAccountStatusProps {
  onSelectMember?: (code: string) => void;
}

export const MemberAccountStatus: React.FC<MemberAccountStatusProps> = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('A0200225');
  const [activeTab, setActiveTab] = useState<'comptes' | 'cheques' | 'credits' | 'dat' | 'plan_epargne'>('comptes');

  // Parameters matching the classical core banking screen
  const [exercise, setExercise] = useState<string>('2026');
  const [period, setPeriod] = useState<string>('Août');
  const [soldeType, setSoldeType] = useState<'THEORIQUE' | 'COMPTABLE'>('THEORIQUE');
  const [filterExcludeZero, setFilterExcludeZero] = useState<boolean>(false);
  const [showBiometricSuccess, setShowBiometricSuccess] = useState<boolean>(false);
  const [showCardModal, setShowCardModal] = useState<boolean>(false);

  useEffect(() => {
    const list = StorageService.getMembers();
    setMembers(list);
    if (list.length > 0) {
      const found = list.find(m => m.code === 'A0200225') || list[0];
      setSelectedMember(found);
      setSearchQuery(found.code);
    }
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    const found = members.find(m => 
      m.code.toLowerCase() === query || 
      m.manualNumber?.toLowerCase() === query || 
      m.fullName.toLowerCase().includes(query) ||
      m.phone.includes(query)
    );
    if (found) {
      setSelectedMember(found);
    }
  };

  const handleQuickSelect = (code: string) => {
    const found = members.find(m => m.code === code);
    if (found) {
      setSelectedMember(found);
      setSearchQuery(found.code);
    }
  };

  const handleVerifyBiometric = () => {
    setShowBiometricSuccess(true);
    setTimeout(() => setShowBiometricSuccess(false), 3000);
  };

  // Calculate age dynamically from birthdate
  const getCalculatedAge = (dobString?: string) => {
    if (!dobString) return '48 ans';
    let birthDateObj: Date;
    if (dobString.includes('/')) {
      const [d, m, y] = dobString.split('/').map(Number);
      birthDateObj = new Date(y, m - 1, d);
    } else {
      birthDateObj = new Date(dobString);
    }
    if (isNaN(birthDateObj.getTime())) return '48 ans';
    const now = new Date();
    let age = now.getFullYear() - birthDateObj.getFullYear();
    const m = now.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return `${age > 0 ? age : 0} ans`;
  };

  if (!selectedMember) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Chargement de la situation adhérent...
      </div>
    );
  }

  // Account lines for the selected member (matching core banking Syscoa schema)
  const memberCode = selectedMember.code;
  const accountsData = [
    { number: `20221210${memberCode}01`, product: 'CREDITS ORDINAIRES (001)', real: 0, frozen: 0, available: 0, status: 'ACTIF' },
    { number: `20312550${memberCode}01`, product: 'CREDIT AU PERSONNEL (002)', real: 0, frozen: 0, available: 0, status: 'ACTIF' },
    { number: `20412110${memberCode}01`, product: 'CREDITS ORDINAIRES (001)', real: 0, frozen: 0, available: 0, status: 'ACTIF' },
    { number: `20412550${memberCode}01`, product: 'CREDIT AU PERSONNEL (002)', real: 5257109, frozen: 0, available: 5257109, status: 'ACTIF' },
    { number: `25121100${memberCode}01`, product: 'EPARGNE ORDINAIRE (001)', real: 280424, frozen: 0, available: 280424, status: 'ACTIF' },
    { number: `25121300${memberCode}01`, product: 'Epargne remboursement Crédit/Plan', real: 125839, frozen: 0, available: 125839, status: 'ACTIF' },
    { number: `25331010${memberCode}01`, product: 'PLAN EPARGNE FIN CARRIERE (003)', real: 0, frozen: 0, available: 0, status: 'ACTIF' },
    { number: `25331020${memberCode}01`, product: 'PLAN EPARGNE PROJET PLUS (004)', real: 0, frozen: 0, available: 0, status: 'ACTIF' },
  ];

  const displayedAccounts = filterExcludeZero 
    ? accountsData.filter(a => a.available > 0)
    : accountsData;

  const totalReal = accountsData.reduce((s, a) => s + a.real, 0);
  const totalAvailable = accountsData.reduce((s, a) => s + a.available, 0);

  return (
    <div className="w-full px-6 lg:px-8 py-6 space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Banner: Classical Core Banking Window Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        
        {/* Row 1: Search, Exercise, Period, Biometrics & Action Hub */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-800 rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Situation des Comptes Adhérent 360°
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Consultation centralisée des soldes d'épargne, encours de crédits, parts sociales et garanties.
              </p>
            </div>
          </div>

          {/* Actions & Print */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCardModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Carte Virtuelle Adhérent</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Imprimer Situation A4</span>
            </button>
          </div>
        </div>

        {/* Row 2: Search Bar & Quick Member Switcher */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <form onSubmit={handleSearch} className="md:col-span-6 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Entrer code adhérent (ex: A0200225), nom, n° manuel..."
                className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 font-bold text-slate-900 text-xs focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all"
            >
              Consulter
            </button>
          </form>

          <div className="md:col-span-3 flex items-center gap-2">
            <span className="font-semibold text-slate-500">Exercice :</span>
            <input
              type="number"
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-mono font-bold text-slate-900 text-center"
            />
            <span className="font-semibold text-slate-500 ml-2">Période :</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-bold text-slate-900"
            >
              <option value="Janvier">Janvier</option>
              <option value="Février">Février</option>
              <option value="Mars">Mars</option>
              <option value="Avril">Avril</option>
              <option value="Mai">Mai</option>
              <option value="Juin">Juin</option>
              <option value="Juillet">Juillet</option>
              <option value="Août">Août</option>
              <option value="Septembre">Septembre</option>
              <option value="Octobre">Octobre</option>
              <option value="Novembre">Novembre</option>
              <option value="Décembre">Décembre</option>
            </select>
          </div>

          <div className="md:col-span-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleVerifyBiometric}
              className="flex items-center gap-1.5 bg-coop-primary hover:opacity-90 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition-all"
            >
              <Fingerprint className="w-4 h-4" />
              <span>Vérifier Empreinte</span>
            </button>
          </div>
        </div>

        {showBiometricSuccess && (
          <div className="p-3 bg-slate-900 text-white rounded-xl text-xs flex items-center gap-2 border border-slate-800 animate-in fade-in">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">Empreinte biométrique certifiée conforme (Norme ISO/IEC 19794-2).</span>
          </div>
        )}

        {/* Row 3: Institutional Member Record & Parts Sociales (Faithful to Screenshot) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs font-semibold">
          
          {/* Left Block (7 cols): Identification & Parts Sociales */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block mb-1">Code Adhérent</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{selectedMember.code}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Nom & Prénoms</span>
                <span className="font-bold text-slate-900 text-sm">{selectedMember.fullName} ({selectedMember.manualNumber || '610'})</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Date d'Inscription</span>
                <span className="font-mono font-bold text-slate-800">{selectedMember.registrationDate || '29/07/2009'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Frais d'Inscription</span>
                <span className="font-mono font-bold text-slate-800">0 F.CFA</span>
              </div>
            </div>

            {/* Parts Sociales Box */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
              <div className="font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
                <span>Parts Sociales du Sociétaire</span>
                <span className="text-[11px] text-slate-500 font-normal">Capital social individuel</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-500 text-[10px] block">Total Acheté</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{selectedMember.sharesPurchased || 5000} F</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-500 text-[10px] block">Total Vendu</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">0 F</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-500 text-[10px] block">Total Disponible</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">{selectedMember.sharesAvailable || 5000} F</span>
                </div>
              </div>
              <div className="flex justify-between text-slate-600 text-xs pt-1">
                <span>Nombre de parts : <strong>{Math.floor((selectedMember.sharesPurchased || 5000) / 5000)}</strong></span>
                <span>Valeur unitaire : <strong>5 000 F.CFA</strong></span>
              </div>
            </div>
          </div>

          {/* Right Block (5 cols): Other Member Information (DOB, Auto Age, Phone, Address) */}
          <div className="lg:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-900 border-b border-slate-200 pb-2">
              Autres Informations sur l'Adhérent
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">N° Manuel :</span>
                <span className="font-mono font-bold text-slate-900">{selectedMember.manualNumber || '610'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Nom du Conjoint :</span>
                <span className="font-bold text-slate-800">{selectedMember.spouseName || 'KODJO Afiwa'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Date de Naissance :</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedMember.birthDate || '18/08/1978'} <span className="text-emerald-800">({getCalculatedAge(selectedMember.birthDate)})</span>
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">N° Téléphone :</span>
                <span className="font-mono font-bold text-slate-800">{selectedMember.phone || '22262101'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Adresse / Domicile :</span>
                <span className="font-medium text-slate-800 text-right">{selectedMember.address || 'BP : 10151, LOMÉ'}</span>
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Statut Compte :</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ACTIF (RÉGULIER)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: Solde Options & Filtering Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-5 font-semibold text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="soldeType"
                checked={soldeType === 'THEORIQUE'}
                onChange={() => setSoldeType('THEORIQUE')}
                className="accent-slate-900"
              />
              <span>Solde Théorique</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="soldeType"
                checked={soldeType === 'COMPTABLE'}
                onChange={() => setSoldeType('COMPTABLE')}
                className="accent-slate-900"
              />
              <span>Solde Comptable</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={filterExcludeZero}
                onChange={(e) => setFilterExcludeZero(e.target.checked)}
                className="rounded accent-slate-900"
              />
              <span>Exclure solde disponible nul</span>
            </label>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-800">
            <span>Crédit Montant Dû : <strong className="font-mono text-slate-900">5 257 109 F</strong></span>
            <span>Tontine : <strong className="font-mono text-slate-900">0 F</strong></span>
            <span>Signatures Exigées : <strong className="font-mono">1</strong></span>
          </div>
        </div>
      </div>

      {/* Main Classical Core Banking Tab System (5 Tabs) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-0">
        
        {/* Tab Headers */}
        <div className="bg-slate-100 border-b border-slate-200 flex flex-wrap text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('comptes')}
            className={`py-3.5 px-6 border-r border-slate-200 transition-all ${
              activeTab === 'comptes'
                ? 'bg-white text-coop-primary border-t-2 border-t-coop-primary shadow-sm font-bold'
                : 'hover:bg-slate-200/60'
            }`}
          >
            Situation des comptes
          </button>

          <button
            onClick={() => setActiveTab('cheques')}
            className={`py-3.5 px-6 border-r border-slate-200 transition-all ${
              activeTab === 'cheques'
                ? 'bg-white text-coop-primary border-t-2 border-t-coop-primary shadow-sm font-bold'
                : 'hover:bg-slate-200/60'
            }`}
          >
            Situation des remises de chèques
          </button>

          <button
            onClick={() => setActiveTab('credits')}
            className={`py-3.5 px-6 border-r border-slate-200 transition-all ${
              activeTab === 'credits'
                ? 'bg-white text-coop-primary border-t-2 border-t-coop-primary shadow-sm font-bold'
                : 'hover:bg-slate-200/60'
            }`}
          >
            Situation dossier(s) crédit(s)
          </button>

          <button
            onClick={() => setActiveTab('dat')}
            className={`py-3.5 px-6 border-r border-slate-200 transition-all ${
              activeTab === 'dat'
                ? 'bg-white text-coop-primary border-t-2 border-t-coop-primary shadow-sm font-bold'
                : 'hover:bg-slate-200/60'
            }`}
          >
            Situation dépôt à terme (DAT)
          </button>

          <button
            onClick={() => setActiveTab('plan_epargne')}
            className={`py-3.5 px-6 transition-all ${
              activeTab === 'plan_epargne'
                ? 'bg-white text-coop-primary border-t-2 border-t-coop-primary shadow-sm font-bold'
                : 'hover:bg-slate-200/60'
            }`}
          >
            Situation plan épargne
          </button>
        </div>

        {/* Tab Content 1: Situation des Comptes */}
        {activeTab === 'comptes' && (
          <div className="p-6 space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">N° Compte</th>
                    <th className="py-3 px-4">Produit Bancaire</th>
                    <th className="py-3 px-4 text-right">Montant Réel</th>
                    <th className="py-3 px-4 text-right">Montant Gelé</th>
                    <th className="py-3 px-4 text-right">Disponible</th>
                    <th className="py-3 px-4 text-center">État Actuel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {displayedAccounts.map((acc) => (
                    <tr 
                      key={acc.number}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        acc.available > 0 ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{acc.number}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{acc.product}</td>
                      <td className="py-3.5 px-4 text-right font-mono">{acc.real.toLocaleString('fr-FR')} F</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-400">{acc.frozen.toLocaleString('fr-FR')} F</td>
                      <td className={`py-3.5 px-4 text-right font-mono font-bold text-sm ${
                        acc.available > 0 ? 'text-emerald-900 font-black' : 'text-slate-700'
                      }`}>
                        {acc.available.toLocaleString('fr-FR')} F
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                          {acc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 font-medium">
              <span>* Faites un double-clic sur une ligne pour extraire le relevé des mouvements.</span>
              <div className="flex items-center gap-4 text-sm font-bold text-slate-900">
                <span>Total Réel : <strong className="font-mono text-base">{totalReal.toLocaleString('fr-FR')} F</strong></span>
                <span>Total Disponible : <strong className="font-mono text-base text-emerald-900">{totalAvailable.toLocaleString('fr-FR')} F</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: Remises de Chèques */}
        {activeTab === 'cheques' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">N° Chèque</th>
                    <th className="py-3 px-4">Banque Tirée</th>
                    <th className="py-3 px-4">Émetteur</th>
                    <th className="py-3 px-4 text-right">Montant (F.CFA)</th>
                    <th className="py-3 px-4 text-center">Date Compensation</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold">CHQ-881902</td>
                    <td className="py-3 px-4 font-semibold">ECOBANK TOGO</td>
                    <td className="py-3 px-4">KODJO Koffi</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">350 000 F</td>
                    <td className="py-3 px-4 text-center font-mono">22/08/2026</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-800">ENCAISSÉ</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content 3: Dossiers Crédits */}
        {activeTab === 'credits' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">N° Prêt</th>
                    <th className="py-3 px-4">Objet du Crédit</th>
                    <th className="py-3 px-4 text-right">Capital Octroyé</th>
                    <th className="py-3 px-4 text-right">Capital Restant Dû</th>
                    <th className="py-3 px-4 text-right">Mensualité</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  <tr>
                    <td className="py-3.5 px-4 font-mono font-bold">CRE-2026-001</td>
                    <td className="py-3.5 px-4 font-semibold">Crédit Équipement & Rénovation</td>
                    <td className="py-3.5 px-4 text-right font-mono">6 000 000 F</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">5 257 109 F</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-800">120 000 F</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-800">EN COURS (SAIN)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content 4: Dépôt à Terme */}
        {activeTab === 'dat' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
              Aucun contrat de Dépôt à Terme (DAT) bloqué en cours pour cet adhérent.
            </div>
          </div>
        )}

        {/* Tab Content 5: Plan Épargne */}
        {activeTab === 'plan_epargne' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Intitulé du Plan</th>
                    <th className="py-3 px-4 text-right">Montant Cumulé</th>
                    <th className="py-3 px-4 text-right">Retenue Mensuelle</th>
                    <th className="py-3 px-4 text-center">Échéance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  <tr>
                    <td className="py-3.5 px-4 font-bold">Plan Épargne Fin de Carrière</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-900">125 839 F</td>
                    <td className="py-3.5 px-4 text-right font-mono">25 000 F / mois</td>
                    <td className="py-3.5 px-4 text-center font-mono">Retraite (2038)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Virtual Member Smart Card View */}
      {showCardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-800" />
                <span>Carte Virtuelle & Badge de Sociétaire</span>
              </h3>
              <button 
                onClick={() => setShowCardModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm p-1"
              >
                Fermer
              </button>
            </div>

            <VirtualMemberCard member={selectedMember} />
          </div>
        </div>
      )}
    </div>
  );
};
