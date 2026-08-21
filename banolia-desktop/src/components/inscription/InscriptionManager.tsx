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
  Sparkles
} from 'lucide-react';
import { TellerService } from '../../services/teller/TellerService';
import { DbMember } from '../../types/database';
import { Member } from '../../types';

interface InscriptionManagerProps {
  members: Member[];
  onMemberCreated: (member: DbMember) => void;
  isOnline: boolean;
}

export const InscriptionManager: React.FC<InscriptionManagerProps> = ({
  members,
  onMemberCreated,
  isOnline
}) => {
  // Active step in the workflow (1: Identité, 2: Emploi & DRH, 3: Parts & Cotisations)
  const [activeStep, setActiveStep] = useState<number>(1);

  // Form Fields - Clean initial states (zero hardcoded dummy values)
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Lomé');
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

  // Real-time Dynamic Two-Way Calculation for Age
  const handleBirthDateChange = (dateVal: string) => {
    setBirthDate(dateVal);
    if (!dateVal) {
      setAgeInput('');
      return;
    }
    const birth = new Date(dateVal);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    if (age >= 16 && age <= 100) {
      setAgeInput(String(age));
    }
  };

  const handleAgeChange = (ageVal: string) => {
    setAgeInput(ageVal);
    const numAge = parseInt(ageVal, 10);
    if (!isNaN(numAge) && numAge >= 16 && numAge <= 100) {
      const today = new Date();
      const birthYear = today.getFullYear() - numAge;
      const approxDate = `${birthYear}-01-01`;
      setBirthDate(approxDate);
    }
  };

  // Real-time Dynamic Two-Way Calculation for Seniority
  const handleHireDateChange = (dateVal: string) => {
    setHireDate(dateVal);
    if (!dateVal) {
      setSeniorityInput('');
      return;
    }
    const hire = new Date(dateVal);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - hire.getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
    setSeniorityInput(String(diffYears));
  };

  const handleSeniorityChange = (seniorityVal: string) => {
    setSeniorityInput(seniorityVal);
    const numYears = parseInt(seniorityVal, 10);
    if (!isNaN(numYears) && numYears >= 0 && numYears <= 50) {
      const today = new Date();
      const hireYear = today.getFullYear() - numYears;
      const approxDate = `${hireYear}-01-01`;
      setHireDate(approxDate);
    }
  };

  // Form Reset
  const handleResetForm = () => {
    setFullName('');
    setPhone('');
    setCity('Lomé');
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

    if (!fullName.trim()) {
      setErrorMsg('Veuillez renseigner le Nom & Prénom(s) du sociétaire.');
      setActiveStep(1);
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('Veuillez renseigner le Numéro de téléphone du sociétaire.');
      setActiveStep(1);
      return;
    }

    setIsSubmitting(true);
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
        cashierName: 'ADMINISTRATEUR (CSH-001)',
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
                className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow transition-all"
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
              className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                activeStep === 1 
                  ? 'bg-slate-900 text-white font-bold shadow-sm' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">1</span>
              <span>1. Identité</span>
            </button>

            <button
              onClick={() => setActiveStep(2)}
              className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                activeStep === 2 
                  ? 'bg-slate-900 text-white font-bold shadow-sm' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">2</span>
              <span>2. Emploi & DRH</span>
            </button>

            <button
              onClick={() => setActiveStep(3)}
              className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                activeStep === 3 
                  ? 'bg-slate-900 text-white font-bold shadow-sm' 
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
                  {/* Full Name */}
                  <div>
                    <label className="block text-slate-800 font-semibold mb-1.5 text-sm">
                      Nom & Prénom(s) complets *
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ex: KODJO Koffi Jean-Baptiste"
                      className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl px-4 py-3 text-base font-bold text-slate-900 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Age & BirthDate Auto Sync */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
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
                        className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col justify-between">
                      <label className="block text-slate-800 font-semibold mb-1.5 text-sm">
                        Âge Actuel (Calculé Automatiquement)
                      </label>
                      <div className="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-900 flex items-center justify-between">
                        <span>{ageInput ? `${ageInput} ans` : 'Sélectionnez la date'}</span>
                        <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          Temps Réel
                        </span>
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
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
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
                        Matricule Employé / DRH
                      </label>
                      <input
                        type="text"
                        autoFocus
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="Ex: EMP-4081 / MAT-102"
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

                  {/* Seniority & Hire Date Dual Sync */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-slate-800 font-semibold mb-1.5 text-sm flex items-center justify-between">
                        <span>Date d'Embauche</span>
                        <Calendar className="w-4 h-4 text-slate-400" />
                      </label>
                      <input
                        type="date"
                        value={hireDate}
                        onChange={(e) => handleHireDateChange(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-800 font-semibold mb-1.5 text-sm flex items-center justify-between">
                        <span>Ancienneté Calculée</span>
                        <span className="text-xs text-slate-500 font-semibold">Synchronisé</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={seniorityInput}
                          onChange={(e) => handleSeniorityChange(e.target.value)}
                          placeholder="Ex: 5"
                          className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-xl pl-4 pr-14 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none"
                        />
                        <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">ans</span>
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
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
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
                          className={`p-3.5 rounded-xl border text-center transition-all ${
                            sharesCount === num
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="text-base font-bold">{num} Part{num > 1 ? 's' : ''}</div>
                          <div className={`text-xs mt-0.5 ${sharesCount === num ? 'text-slate-300' : 'text-slate-500'}`}>
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
                            <span>Prélèvement DRH</span>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isPayrollDeduction ? 'border-slate-900 bg-slate-900' : 'border-slate-300'}`}>
                            {isPayrollDeduction && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          Inclus automatiquement chaque fin de mois dans le bordereau DRH.
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
                    className="flex items-center gap-2 px-8 py-3 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow transition-all"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>{isSubmitting ? 'Enregistrement...' : 'Valider & Créer le Livret'}</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Right Column (5 Cols): Live Member Card - Clean Executive Dark Slate */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Virtual Member Card */}
          <div className="bg-[#0f172a] text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden space-y-5">
            {/* Top Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
                  Carte Sociétaire • Aperçu Direct
                </span>
              </div>
              <span className="font-mono text-[11px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-md border border-slate-700 font-semibold">
                EN COURS
              </span>
            </div>

            {/* Member Identity & Dynamic Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-bold text-slate-200 shadow-sm">
                {fullName.trim() ? fullName.slice(0, 2).toUpperCase() : '--'}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white truncate">
                  {fullName.trim() ? fullName.toUpperCase() : 'NOM & PRÉNOM DU SOCIÉTAIRE'}
                </h3>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {position.trim() ? position : 'Fonction non renseignée'}
                </p>
                <div className="flex items-center gap-2.5 text-xs text-slate-400 mt-1">
                  {employeeId && <span className="font-mono text-slate-300 font-semibold">Mat: {employeeId}</span>}
                  {ageInput && <span>• {ageInput} ans</span>}
                  {seniorityInput && <span>• {seniorityInput} ans d'anc.</span>}
                </div>
              </div>
            </div>

            {/* Card Financial Details */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 font-mono">
              <div>
                <span className="text-[11px] text-slate-400 block font-sans">Parts Souscrites</span>
                <span className="font-semibold text-white text-sm">
                  {sharesCount} parts ({(sharesCount * 5000).toLocaleString('fr-FR')} F)
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-sans">Épargne Mensuelle</span>
                <span className="font-semibold text-emerald-400 text-sm">
                  {monthlySavings.toLocaleString('fr-FR')} F/mois
                </span>
              </div>
            </div>

            {/* Mode badge */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Mode de Retenue :</span>
              <span className="font-semibold text-slate-200">
                {isPayrollDeduction ? 'Prélèvement à la source DRH' : 'Versement Guichet Libre'}
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
