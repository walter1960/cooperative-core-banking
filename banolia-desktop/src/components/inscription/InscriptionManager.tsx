import React, { useState } from 'react';
import { 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Search, 
  ShieldCheck, 
  Wallet, 
  User, 
  Building2, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  RotateCcw, 
  CreditCard,
  Building,
  IdCard,
  Sparkles,
  Palette,
  Wifi
} from 'lucide-react';
import { TellerService } from '../../services/teller/TellerService';
import { DbMember } from '../../types/database';
import { Member } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface InscriptionManagerProps {
  members: Member[];
  onMemberCreated: (member: DbMember) => void;
  isOnline: boolean;
}

export interface CardVisualTheme {
  id: string;
  name: string;
  previewHex: string;
  bgClass: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  badgeBg: string;
  chipTone: 'gold' | 'silver';
}

export const CARD_THEMES: Record<string, CardVisualTheme> = {
  titanium: {
    id: 'titanium',
    name: 'Gris Platine / Titane',
    previewHex: '#CBD5E1',
    bgClass: 'bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300',
    cardBorder: 'border-slate-300 shadow-xl',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    badgeBg: 'bg-slate-300/90 text-slate-800 border-slate-400',
    chipTone: 'gold'
  },
  pearl: {
    id: 'pearl',
    name: 'Gris Perle & Nacre',
    previewHex: '#E2E8F0',
    bgClass: 'bg-gradient-to-br from-zinc-50 via-slate-100 to-zinc-200',
    cardBorder: 'border-zinc-300 shadow-xl',
    textPrimary: 'text-zinc-900',
    textSecondary: 'text-zinc-600',
    badgeBg: 'bg-zinc-200 text-zinc-800 border-zinc-400',
    chipTone: 'silver'
  },
  aero: {
    id: 'aero',
    name: 'Bleu Ciel Aéronautique',
    previewHex: '#BAE6FD',
    bgClass: 'bg-gradient-to-br from-sky-50 via-blue-100 to-sky-200',
    cardBorder: 'border-sky-200 shadow-xl',
    textPrimary: 'text-blue-950',
    textSecondary: 'text-blue-700',
    badgeBg: 'bg-blue-200 text-blue-900 border-blue-300',
    chipTone: 'gold'
  },
  champagne: {
    id: 'champagne',
    name: 'Or Champagne & Sable',
    previewHex: '#FEF08A',
    bgClass: 'bg-gradient-to-br from-amber-50 via-amber-100 to-yellow-200',
    cardBorder: 'border-amber-200 shadow-xl',
    textPrimary: 'text-amber-950',
    textSecondary: 'text-amber-800',
    badgeBg: 'bg-amber-200 text-amber-900 border-amber-300',
    chipTone: 'gold'
  },
  mint: {
    id: 'mint',
    name: 'Menthe & Jade Clair',
    previewHex: '#A7F3D0',
    bgClass: 'bg-gradient-to-br from-emerald-50 via-teal-100 to-emerald-200',
    cardBorder: 'border-emerald-200 shadow-xl',
    textPrimary: 'text-emerald-950',
    textSecondary: 'text-emerald-800',
    badgeBg: 'bg-emerald-200 text-emerald-900 border-emerald-300',
    chipTone: 'silver'
  },
  rose: {
    id: 'rose',
    name: 'Quartz Satiné',
    previewHex: '#FECDD3',
    bgClass: 'bg-gradient-to-br from-rose-50 via-pink-100 to-rose-200',
    cardBorder: 'border-rose-200 shadow-xl',
    textPrimary: 'text-rose-950',
    textSecondary: 'text-rose-800',
    badgeBg: 'bg-rose-200 text-rose-900 border-rose-300',
    chipTone: 'gold'
  }
};

export const InscriptionManager: React.FC<InscriptionManagerProps> = ({
  members,
  onMemberCreated,
  isOnline
}) => {
  const { theme } = useTheme();
  // Active step in the workflow (1: Identité, 2: Emploi & DRH, 3: Parts & Cotisations)
  const [activeStep, setActiveStep] = useState<number>(1);

  // Personnalisation des couleurs de la Carte Virtuelle
  const [cardThemeId, setCardThemeId] = useState<string>(() => {
    return localStorage.getItem('coop_card_theme') || 'titanium';
  });
  const [customCardColor, setCustomCardColor] = useState<string>(() => {
    return localStorage.getItem('coop_card_custom_color') || '#E2E8F0';
  });

  const handleThemeSelect = (themeKey: string) => {
    setCardThemeId(themeKey);
    localStorage.setItem('coop_card_theme', themeKey);
  };

  const handleCustomColorChange = (hexColor: string) => {
    setCustomCardColor(hexColor);
    setCardThemeId('custom');
    localStorage.setItem('coop_card_theme', 'custom');
    localStorage.setItem('coop_card_custom_color', hexColor);
  };

  // Form Fields - Clean initial states (zero hardcoded dummy values)
  const institutionName = localStorage.getItem('coop_institution_name') || 'COOPECTAT';
  const partnerEntity = localStorage.getItem('coop_partner_entity') || 'ASECNA';
  const defaultCity = localStorage.getItem('coop_institution_city') || 'Lomé';

  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const fullName = `${lastName.trim().toUpperCase()} ${firstName.trim()}`.trim();
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState(defaultCity);
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Two-way Dynamic Age <-> BirthDate
  const [birthDate, setBirthDate] = useState('');
  const [ageInput, setAgeInput] = useState<string>('');

  // Two-way Dynamic Seniority <-> HireDate
  const [hireDate, setHireDate] = useState('');
  const [seniorityInput, setSeniorityInput] = useState<string>('');

  // Enterprise details
  const [employeeId, setEmployeeId] = useState('');
  const [position, setPosition] = useState('');

  // Financial & Subscription Setup
  const [sharesCount, setSharesCount] = useState<number>(2); // 1 part = 5000 XOF
  const [monthlySavings, setMonthlySavings] = useState<number>(25000); // 25 000 XOF / mois
  const [isPayrollDeduction, setIsPayrollDeduction] = useState<boolean>(true); // Retenue à la source

  // Submission & Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMember, setSuccessMember] = useState<{ member: DbMember; receiptNumber: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchMemberQuery, setSearchMemberQuery] = useState('');

  const shareUnitPrice = 5000;
  const totalSharesAmount = sharesCount * shareUnitPrice;
  const adhesionFees = 2000; // Frais de livret
  const totalInitialDue = totalSharesAmount + adhesionFees;

  // Real-time Dynamic Two-Way Calculation for Age (robuste et sans décalage UTC)
  const handleBirthDateChange = (dateVal: string) => {
    setBirthDate(dateVal);
    if (!dateVal) {
      setAgeInput('');
      return;
    }
    const parts = dateVal.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d) && y >= 1900 && y <= new Date().getFullYear()) {
        const today = new Date();
        let age = today.getFullYear() - y;
        const monthDiff = today.getMonth() - m;
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) {
          age--;
        }
        if (age >= 0 && age <= 130) {
          setAgeInput(String(age));
        }
      }
    }
  };

  const handleAgeChange = (ageVal: string) => {
    setAgeInput(ageVal);
    if (!ageVal) {
      setBirthDate('');
      return;
    }
    const numAge = parseInt(ageVal, 10);
    if (!isNaN(numAge) && numAge >= 0 && numAge <= 130) {
      const today = new Date();
      const birthYear = today.getFullYear() - numAge;
      let mStr = '01';
      let dStr = '01';
      if (birthDate) {
        const parts = birthDate.split('-');
        if (parts.length === 3 && parts[1] && parts[2]) {
          mStr = parts[1];
          dStr = parts[2];
        }
      }
      setBirthDate(`${birthYear}-${mStr}-${dStr}`);
    }
  };

  // Real-time Dynamic Two-Way Calculation for Seniority
  const handleHireDateChange = (dateVal: string) => {
    setHireDate(dateVal);
    if (!dateVal) {
      setSeniorityInput('');
      return;
    }
    const parts = dateVal.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d) && y >= 1950 && y <= new Date().getFullYear()) {
        const today = new Date();
        let seniority = today.getFullYear() - y;
        const monthDiff = today.getMonth() - m;
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) {
          seniority--;
        }
        if (seniority >= 0) {
          setSeniorityInput(String(seniority));
        }
      }
    }
  };

  const handleSeniorityChange = (seniorityVal: string) => {
    setSeniorityInput(seniorityVal);
    if (!seniorityVal) {
      setHireDate('');
      return;
    }
    const numYears = parseInt(seniorityVal, 10);
    if (!isNaN(numYears) && numYears >= 0 && numYears <= 60) {
      const today = new Date();
      const hireYear = today.getFullYear() - numYears;
      let mStr = '01';
      let dStr = '01';
      if (hireDate) {
        const parts = hireDate.split('-');
        if (parts.length === 3 && parts[1] && parts[2]) {
          mStr = parts[1];
          dStr = parts[2];
        }
      }
      setHireDate(`${hireYear}-${mStr}-${dStr}`);
    }
  };

  // Form Reset
  const handleResetForm = () => {
    setLastName('');
    setFirstName('');
    setPhone('');
    setCity(defaultCity);
    setAddress('');
    setEmergencyContact('');
    setBirthDate('');
    setAgeInput('');
    setHireDate('');
    setSeniorityInput('');
    setEmployeeId('');
    setPosition('');
    setSharesCount(2);
    setMonthlySavings(25000);
    setIsPayrollDeduction(true);
    setActiveStep(1);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!lastName.trim() || !firstName.trim()) {
      setErrorMsg('Veuillez renseigner distinctement le Nom et le(s) Prénom(s) du sociétaire.');
      setActiveStep(1);
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('Veuillez renseigner le Numéro de téléphone du sociétaire.');
      setActiveStep(1);
      return;
    }

    setIsSubmitting(true);
    const currentManager = localStorage.getItem('coop_account_manager_name') || 'ADMINISTRATEUR';
    try {
      const res = await TellerService.createMemberWithAccounts({
        fullName: fullName.trim().toUpperCase(),
        birthDate: birthDate || '1990-01-01',
        address: `${address || 'Siège'} (${city})`.trim(),
        city: city.trim().toUpperCase(),
        phone: phone.trim(),
        employeeId: employeeId.trim().toUpperCase(),
        position: position.trim(),
        hireDate: hireDate || '2020-01-01',
        monthlySavingsTarget: Number(monthlySavings),
        isPayrollDeduction,
        emergencyContact: emergencyContact.trim(),
        sharesCount: Number(sharesCount),
        initialDepositAmount: 0,
        cashierId: 'CSH-001',
        cashierName: `${currentManager} (CSH-001)`,
        agencyCode: 'A01',
        isOnline
      });

      const receiptNum = res.transactions?.[0]?.receiptNumber || `REC-${Date.now().toString().slice(-6)}`;
      setSuccessMember({ member: res.member, receiptNumber: receiptNum });
      onMemberCreated(res.member);
      handleResetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'enregistrement de l'adhésion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchMemberQuery.toLowerCase()) ||
    m.code.toLowerCase().includes(searchMemberQuery.toLowerCase()) ||
    (m.employeeId && m.employeeId.toLowerCase().includes(searchMemberQuery.toLowerCase())) ||
    m.phone.includes(searchMemberQuery)
  );

  return (
    <div className="w-full px-6 lg:px-10 py-6 space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header Card - Sober and Professional */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 text-slate-800 rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Adhésion & Inscription d'un Sociétaire
              </h1>
              <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
                Parcours Structuré
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Enregistrement officiel d'un salarié, souscription de parts sociales et ouverture du livret d'épargne.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetForm}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Nouveau Formulaire</span>
          </button>
        </div>
      </div>

      {/* Success Notification - Executive & High-Contrast */}
      {successMember && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg space-y-4 animate-in fade-in zoom-in-95 border border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Adhésion enregistrée avec succès
                </h3>
                <p className="text-xs text-slate-400">
                  Le sociétaire est actif. Ses comptes d'épargne et de parts sociales sont créés.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-coop-primary hover:opacity-90 text-white font-bold rounded-xl text-xs shadow transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer l'Attestation</span>
              </button>
              <button
                onClick={() => setSuccessMember(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block text-[11px]">Sociétaire :</span>
              <span className="font-bold text-white text-sm truncate block mt-0.5">{successMember.member.fullName}</span>
            </div>
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block text-[11px]">Code Adhérent :</span>
              <span className="font-mono font-bold text-emerald-400 text-sm block mt-0.5">{successMember.member.code}</span>
            </div>
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block text-[11px]">Compte Livret :</span>
              <span className="font-mono text-slate-200 text-xs block mt-0.5">25121100{successMember.member.code}01</span>
            </div>
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block text-[11px]">Retenue DRH Mensuelle :</span>
              <span className="font-bold text-slate-100 text-sm block mt-0.5">
                {successMember.member.isPayrollDeduction ? `${(successMember.member.monthlySavingsTarget || 0).toLocaleString('fr-FR')} F / mois` : 'Guichet'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error notification */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Main 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* Left Column (7 Cols): Guided 3-Step Form */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Step Progress Selector Bar - Sober Monochrome Accent */}
          <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm flex items-center justify-between gap-2 text-sm font-semibold">
            <button
              onClick={() => setActiveStep(1)}
              style={activeStep === 1 ? { backgroundColor: theme.primaryAccent, color: '#ffffff' } : {}}
              className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                activeStep === 1 
                  ? 'font-bold shadow-sm' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">1</span>
              <span>1. Identité</span>
            </button>

            <button
              onClick={() => setActiveStep(2)}
              style={activeStep === 2 ? { backgroundColor: theme.primaryAccent, color: '#ffffff' } : {}}
              className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                activeStep === 2 
                  ? 'font-bold shadow-sm' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">2</span>
              <span>2. Emploi & DRH</span>
            </button>

            <button
              onClick={() => setActiveStep(3)}
              style={activeStep === 3 ? { backgroundColor: theme.primaryAccent, color: '#ffffff' } : {}}
              className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                activeStep === 3 
                  ? 'font-bold shadow-sm' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">3</span>
              <span>3. Épargne & Parts</span>
            </button>
          </div>

          {/* Form Box */}
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm space-y-6">
            
            {/* STEP 1: IDENTITÉ */}
            {activeStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Étape 1 : Identité & État Civil</h2>
                    <p className="text-slate-500 text-xs">Renseignez les coordonnées personnelles de l'agent</p>
                  </div>
                  <User className="w-5 h-5 text-slate-600" />
                </div>

                <div className="space-y-4">
                  {/* Nom à part et Prénoms à part */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-800 font-bold mb-1.5 text-sm">
                        Nom de Famille *
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Ex: MILDZINA"
                        className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl px-4 py-3 text-base font-bold text-slate-900 uppercase focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-800 font-bold mb-1.5 text-sm">
                        Prénom(s) *
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Ex: Tomrom Didier"
                        className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl px-4 py-3 text-base font-bold text-slate-900 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Aperçu en direct */}
                  {(lastName || firstName) && (
                    <div className="px-4 py-2.5 bg-slate-100/90 rounded-xl border border-slate-200 text-xs flex items-center justify-between text-slate-700 animate-in fade-in">
                      <span className="font-semibold text-slate-500">Intitulé officiel sociétaire :</span>
                      <span className="font-bold text-slate-900 font-mono text-sm tracking-wide">
                        {fullName}
                      </span>
                    </div>
                  )}

                  {/* Date de Naissance & Âge */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-800 font-semibold mb-1.5 text-sm flex items-center justify-between">
                        <span>Date de Naissance *</span>
                        <Calendar className="w-4 h-4 text-slate-400" />
                      </label>
                      <input
                        type="date"
                        required
                        value={birthDate}
                        onChange={(e) => handleBirthDateChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl px-3.5 py-3 text-sm text-slate-900 font-semibold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-800 font-semibold mb-1.5 text-sm">
                        Âge (ans) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={ageInput}
                          onChange={(e) => handleAgeChange(e.target.value)}
                          placeholder="Ex: 35"
                          className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl pl-4 pr-14 py-3 text-sm font-mono font-bold text-slate-900 focus:outline-none"
                        />
                        <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400">ans</span>
                      </div>
                    </div>
                  </div>

                  {/* Phone & City */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-800 font-semibold mb-1.5 text-sm">
                        Numéro de Téléphone *
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Ex: 90 12 34 56"
                          className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm font-mono font-bold text-slate-900 focus:outline-none"
                        />
                        <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-800 font-semibold mb-1.5 text-sm">
                        Ville de Résidence
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Ex: Lomé"
                          className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 font-medium focus:outline-none"
                        />
                        <MapPin className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Address & Emergency Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-800 font-semibold mb-1.5 text-sm">
                        Quartier / Domicile
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ex: Quartier Aéroport, Rue 12"
                        className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-800 font-semibold mb-1.5 text-sm">
                        Contact en cas d'urgence
                      </label>
                      <input
                        type="text"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="Ex: Conjoint : 90 44 33 22"
                        className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    style={{ backgroundColor: theme.primaryAccent, color: '#ffffff' }}
                    className="flex items-center gap-2 px-6 py-2.5 hover:opacity-90 rounded-xl text-sm font-semibold shadow-sm transition-all"
                  >
                    <span>Étape Suivante</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: EMPLOI */}
            {activeStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Étape 2 : Situation Professionnelle</h2>
                    <p className="text-slate-500 text-xs">Matricule, poste occupé et ancienneté dans l'entreprise</p>
                  </div>
                  <Briefcase className="w-5 h-5 text-slate-600" />
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-800 font-semibold mb-1.5 text-sm">
                        Matricule Employé {partnerEntity ? `(${partnerEntity})` : ''}
                      </label>
                      <input
                        type="text"
                        autoFocus
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="Ex: 130049"
                        className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-800 font-semibold mb-1.5 text-sm">
                        Poste / Fonction Occupée
                      </label>
                      <input
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="Ex: Contrôleur, Technicien, Cadre..."
                        className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Date d'Embauche & Ancienneté */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-800 font-semibold mb-1.5 text-sm flex items-center justify-between">
                        <span>Date d'Embauche</span>
                        <Calendar className="w-4 h-4 text-slate-400" />
                      </label>
                      <input
                        type="date"
                        value={hireDate}
                        onChange={(e) => handleHireDateChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl px-3.5 py-3 text-sm text-slate-900 font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-800 font-semibold mb-1.5 text-sm">
                        Ancienneté (ans)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={seniorityInput}
                          onChange={(e) => handleSeniorityChange(e.target.value)}
                          placeholder="Ex: 5"
                          className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl pl-4 pr-14 py-3 text-sm font-mono font-bold text-slate-900 focus:outline-none"
                        />
                        <span className="absolute right-3.5 top-3.5 text-xs font-semibold text-slate-400">ans</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Retour</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    style={{ backgroundColor: theme.primaryAccent, color: '#ffffff' }}
                    className="flex items-center gap-2 px-6 py-2.5 hover:opacity-90 rounded-xl text-sm font-semibold shadow-sm transition-all"
                  >
                    <span>Étape Suivante</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PARTS & COTISATION */}
            {activeStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Étape 3 : Parts Sociales & Épargne</h2>
                    <p className="text-slate-500 text-xs">Fixez le nombre de parts et la mensualité convenue</p>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-slate-600" />
                </div>

                <div className="space-y-5">
                  {/* Shares selection chips */}
                  <div>
                    <label className="block text-slate-800 font-semibold mb-2 text-sm">
                      Nombre de Parts Sociales Souscrites (1 part = 5 000 F.CFA)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[1, 2, 4, 10].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSharesCount(num)}
                          style={sharesCount === num ? { backgroundColor: theme.primaryAccent, borderColor: theme.primaryAccent, color: '#ffffff' } : {}}
                          className={`p-3.5 rounded-xl border text-center transition-all ${
                            sharesCount === num
                              ? 'shadow-sm font-bold'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="text-base font-bold">{num} Part{num > 1 ? 's' : ''}</div>
                          <div className={`text-xs mt-0.5 ${sharesCount === num ? 'text-white/80' : 'text-slate-500'}`}>
                            {(num * 5000).toLocaleString('fr-FR')} F
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Monthly Savings & Quick Amount Chips */}
                  <div className="space-y-2.5">
                    <label className="block text-slate-800 font-semibold text-sm">
                      Épargne Mensuelle Programmée (Retenue par mois) *
                    </label>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {[10000, 25000, 50000, 100000].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setMonthlySavings(amt)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            monthlySavings === amt
                              ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {amt.toLocaleString('fr-FR')} F
                        </button>
                      ))}
                    </div>
                    <div className="relative pt-1">
                      <input
                        type="number"
                        min="1000"
                        step="5000"
                        value={monthlySavings}
                        onChange={(e) => setMonthlySavings(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl px-4 py-3 font-mono font-bold text-slate-900 text-base focus:outline-none"
                      />
                      <span className="absolute right-4 top-4 text-xs font-semibold text-slate-400">F.CFA / mois</span>
                    </div>
                  </div>

                  {/* Payroll Deduction Option */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <label className="block text-slate-800 font-semibold text-sm">
                      Mode de Règlement & Retenue
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setIsPayrollDeduction(true)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          isPayrollDeduction
                            ? 'bg-white border-slate-900 text-slate-950 shadow-sm ring-1 ring-slate-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-700" />
                            <span>Prélèvement</span>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isPayrollDeduction ? 'border-slate-900 bg-slate-900' : 'border-slate-300'}`}>
                            {isPayrollDeduction && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          Inclus automatiquement chaque fin de mois dans le bordereau de prélèvement.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsPayrollDeduction(false)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          !isPayrollDeduction
                            ? 'bg-white border-slate-900 text-slate-950 shadow-sm ring-1 ring-slate-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-slate-700" />
                            <span>Versement Libre Guichet</span>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!isPayrollDeduction ? 'border-slate-900 bg-slate-900' : 'border-slate-300'}`}>
                            {!isPayrollDeduction && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          Le membre effectue ses versements à la caisse ou via Mobile Money.
                        </p>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Retour</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{ backgroundColor: theme.primaryAccent, color: '#ffffff' }}
                    className="flex items-center gap-2 px-8 py-3 hover:opacity-90 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow transition-all"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>{isSubmitting ? 'Enregistrement...' : 'Valider & Créer le Livret'}</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Right Column (5 Cols): Vraie Carte Virtuelle Lumineuse & Configurable */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Barre de Personnalisation des Couleurs de la Carte */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Palette className="w-4 h-4 text-coop-primary" />
                <span>Personnaliser la Couleur de la Carte :</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {cardThemeId === 'custom' ? 'Sur-mesure' : (CARD_THEMES[cardThemeId]?.name || 'Gris Titane')}
              </span>
            </div>

            {/* Thèmes prédéfinis lumineux & Color Picker */}
            <div className="flex items-center gap-2 flex-wrap">
              {Object.values(CARD_THEMES).map((thm) => (
                <button
                  key={thm.id}
                  type="button"
                  onClick={() => handleThemeSelect(thm.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                    cardThemeId === thm.id
                      ? 'ring-2 ring-coop-primary ring-offset-1 border-slate-400 bg-slate-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                  title={thm.name}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-slate-400/60 shadow-inner inline-block"
                    style={{ backgroundColor: thm.previewHex }}
                  />
                  <span>{thm.name.split(' ')[0]}</span>
                </button>
              ))}

              {/* Sélecteur de couleur personnalisée */}
              <label 
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                  cardThemeId === 'custom'
                    ? 'ring-2 ring-coop-primary ring-offset-1 border-slate-400 bg-slate-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
                title="Choisir une couleur libre"
              >
                <input
                  type="color"
                  value={customCardColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="w-3.5 h-3.5 rounded-full border-0 p-0 cursor-pointer overflow-hidden"
                />
                <span>Libre</span>
              </label>
            </div>
          </div>

          {/* Vraie Carte Virtuelle Réaliste (Format Standard ISO ID-1 - Lumineuse & Pas Sombre) */}
          {(() => {
            const activeThm = CARD_THEMES[cardThemeId] || CARD_THEMES.titanium;
            const isCustom = cardThemeId === 'custom';

            return (
              <div
                style={isCustom ? { backgroundColor: customCardColor } : undefined}
                className={`relative w-full aspect-[1.586/1] rounded-3xl p-5 sm:p-6 shadow-2xl border-2 overflow-hidden flex flex-col justify-between select-none transition-all duration-300 ${
                  isCustom
                    ? 'border-slate-300 text-slate-900 shadow-xl'
                    : `${activeThm.bgClass} ${activeThm.cardBorder} ${activeThm.textPrimary}`
                }`}
              >
                {/* Reflet verre & trame de sécurité guillochée */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/35 via-transparent to-black/5 pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:18px_18px] opacity-15 pointer-events-none" />

                {/* Ligne 1 : En-tête Institutionnel & Sans Contact NFC */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black tracking-widest uppercase block drop-shadow-sm">
                        {institutionName} • {partnerEntity || 'SOCIÉTAIRE'}
                      </span>
                      <span className="text-[9px] font-bold tracking-wider block uppercase opacity-75">
                        Carte de Sociétaire Officielle
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Wifi className="w-5 h-5 rotate-90 opacity-75" />
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border shadow-sm ${
                      isCustom ? 'bg-white/80 text-slate-900 border-slate-300' : activeThm.badgeBg
                    }`}>
                      SMART-PASS
                    </span>
                  </div>
                </div>

                {/* Ligne 2 : Puce EMV Dorée Réaliste & Matricule / Avatar */}
                <div className="relative z-10 flex items-center justify-between my-auto">
                  {/* Puce Contact EMV Métallique */}
                  <div className="flex items-center gap-3">
                    {activeThm.chipTone === 'silver' ? (
                      <div className="w-12 h-9 rounded-lg bg-gradient-to-tr from-slate-200 via-white to-slate-300 border border-slate-400 shadow-md flex flex-col justify-around p-1">
                        <div className="w-full h-px bg-slate-500/50" />
                        <div className="w-full h-px bg-slate-500/50" />
                        <div className="w-full h-px bg-slate-500/50" />
                      </div>
                    ) : (
                      <div className="w-12 h-9 rounded-lg bg-gradient-to-tr from-amber-300 via-yellow-100 to-amber-400 border border-amber-400 shadow-md flex flex-col justify-around p-1">
                        <div className="w-full h-px bg-amber-600/50" />
                        <div className="w-full h-px bg-amber-600/50" />
                        <div className="w-full h-px bg-amber-600/50" />
                      </div>
                    )}
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider opacity-60">
                      NFC SANS CONTACT
                    </span>
                  </div>

                  {/* Matricule & Initiales */}
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <span className="text-[8px] uppercase tracking-wider block font-bold opacity-75">
                        Matricule {partnerEntity ? `(${partnerEntity})` : ''}
                      </span>
                      <span className="text-xs font-mono font-black bg-white/75 px-2 py-0.5 rounded border border-slate-300/80 shadow-sm">
                        {employeeId || '130049'}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-sm shadow-md">
                      {fullName.trim() ? fullName.slice(0, 2).toUpperCase() : '--'}
                    </div>
                  </div>
                </div>

                {/* Ligne 3 : Numéro de Carte Embossé à 16 chiffres */}
                <div className="relative z-10 font-mono text-base sm:text-lg tracking-widest font-black drop-shadow-sm">
                  2512&nbsp;&nbsp;1100&nbsp;&nbsp;{employeeId || '1300'}&nbsp;&nbsp;4901
                </div>

                {/* Ligne 4 : Nom du Titulaire, Fonction & Date d'Expiration */}
                <div className="relative z-10 border-t border-slate-400/30 pt-2 flex items-end justify-between">
                  <div>
                    <span className="text-[8px] uppercase tracking-wider block font-semibold opacity-75">
                      Titulaire du Compte
                    </span>
                    <span className="text-xs font-black uppercase tracking-wide block truncate max-w-[210px]">
                      {fullName.trim() ? fullName.toUpperCase() : 'NOM & PRÉNOM DU SOCIÉTAIRE'}
                    </span>
                    <span className="text-[10px] block opacity-80 font-medium truncate max-w-[210px]">
                      {position.trim() ? position : 'Fonction non renseignée'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[8px] uppercase tracking-wider block font-semibold opacity-75">
                      Expire Fin
                    </span>
                    <span className="text-xs font-mono font-bold">12/29</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Synthèse Financière attachée au bas de la carte */}
          <div className="grid grid-cols-3 gap-2 text-xs bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block">Parts Souscrites</span>
              <span className="font-bold text-slate-900">{sharesCount} parts ({(sharesCount * 5000).toLocaleString('fr-FR')} F)</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block">Épargne Mensuelle</span>
              <span className="font-bold text-emerald-600">{monthlySavings.toLocaleString('fr-FR')} F/mois</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-semibold block">Règlement</span>
              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
                {isPayrollDeduction ? 'Prélèvement' : 'Guichet'}
              </span>
            </div>
          </div>

          {/* Quick Search & Registered Directory */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <IdCard className="w-4 h-4 text-slate-600" />
                <span>Répertoire des Adhérents ({members.length})</span>
              </h3>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchMemberQuery}
                onChange={(e) => setSearchMemberQuery(e.target.value)}
                placeholder="Rechercher par nom, matricule..."
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 font-medium focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="max-h-[320px] overflow-y-auto space-y-2 divide-y divide-slate-100">
              {filteredMembers.map((m) => (
                <div key={m.code} className="pt-2 text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-xs">{m.fullName}</span>
                    <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {m.code}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>{m.employeeId ? `Mat: ${m.employeeId}` : m.phone}</span>
                    <span>Épargne : <strong className="text-slate-800">{m.monthlySavingsTarget ? `${m.monthlySavingsTarget.toLocaleString('fr-FR')} F/m` : 'Libre'}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
