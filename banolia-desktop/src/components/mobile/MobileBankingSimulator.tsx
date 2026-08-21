import React, { useState } from 'react';
import { 
  Smartphone, 
  Fingerprint, 
  ShieldCheck, 
  Wallet, 
  CreditCard, 
  ArrowLeftRight, 
  Receipt, 
  PhoneCall, 
  Star, 
  Eye, 
  EyeOff, 
  Bell, 
  MessageSquare, 
  Mail, 
  Download, 
  FileText, 
  CheckCircle2, 
  X, 
  ChevronUp, 
  Landmark, 
  Globe, 
  HelpCircle, 
  Calculator, 
  MapPin, 
  RotateCcw,
  Sparkles,
  Lock,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const MobileBankingSimulator: React.FC = () => {
  const { theme } = useTheme();

  // Mobile App State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoginSheetOpen, setIsLoginSheetOpen] = useState<boolean>(false);
  const [isUtilitiesOpen, setIsUtilitiesOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'accueil' | 'comptes' | 'cartes' | 'virements' | 'menu'>('comptes');
  const [accountSubTab, setAccountSubTab] = useState<'titulaires' | 'dat'>('titulaires');
  const [cardIndex, setCardIndex] = useState<number>(0);
  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(true);
  const [isFavorite, setIsFavorite] = useState<boolean>(true);

  // Form states
  const [username, setUsername] = useState<string>('issaga.gaye');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Notifications / SMS / Email simulations
  const [notificationCategory, setNotificationCategory] = useState<'ALL' | 'SMS' | 'EMAIL'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const accounts = [
    {
      id: 'acc1',
      title: 'COMPTES CHEQUES',
      number: '99988361998',
      balance: 2000000,
      currency: 'XOF',
      type: 'CHEQUES',
      gradient: 'from-blue-700 to-blue-900',
    },
    {
      id: 'acc2',
      title: 'LIVRET EPARGNE SOCIETAIRE',
      number: '99988361999',
      balance: 1450000,
      currency: 'XOF',
      type: 'EPARGNE',
      gradient: 'from-emerald-700 to-emerald-900',
    },
    {
      id: 'acc3',
      title: 'PARTS SOCIALES SOUSCRITES',
      number: 'PS-0200225',
      balance: 50000,
      currency: 'XOF',
      type: 'PARTS',
      gradient: 'from-purple-700 to-purple-900',
    },
  ];

  const currentAccount = accounts[cardIndex];

  const notifications = [
    {
      id: 'n1',
      type: 'SMS',
      title: 'Avis de Crédit - Virement Reçu',
      content: 'COOPEC Alert: Crédit de +50 000 FCFA sur compte 99988361998. Ref: VIR-2026-904. Nouveau solde dispo: 2 000 000 FCFA le 21/08/2026.',
      time: 'Il y a 10 min',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    {
      id: 'n2',
      type: 'EMAIL',
      title: 'Relevé Mensuel Arrêté (Format PDF)',
      content: 'Votre relevé officiel bimensuel de compte certifié BCEAO est disponible au téléchargement.',
      time: 'Hier à 18:30',
      hasPdf: true,
      pdfName: 'Releve_COOPEC_99988361998_Aout2026.pdf',
      color: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    {
      id: 'n3',
      type: 'SMS',
      title: 'Prélèvement Mensuel de Tontine',
      content: 'COOPEC Alerte: Débit de -25 000 FCFA au titre de votre épargne tontine mensuelle. Solde disponible: 1 950 000 FCFA.',
      time: '19 Août 2026',
      color: 'bg-amber-100 text-amber-800 border-amber-300'
    },
    {
      id: 'n4',
      type: 'EMAIL',
      title: 'Avis d\'échéance Prêt Habitat',
      content: 'Cher Sociétaire, la mensualité de 45 000 FCFA de votre prêt sera prélevée automatiquement le 28 Août.',
      time: '18 Août 2026',
      hasPdf: false,
      color: 'bg-purple-100 text-purple-800 border-purple-300'
    }
  ];

  const filteredNotifs = notificationCategory === 'ALL'
    ? notifications
    : notifications.filter(n => n.type === notificationCategory);

  return (
    <div className="min-h-full p-6 lg:p-8 flex flex-col items-center justify-center space-y-6">
      
      {/* Top Banner Header */}
      <div className="max-w-4xl w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div 
            style={{ backgroundColor: theme.primaryAccent }}
            className="p-3 text-white rounded-2xl shadow"
          >
            <Smartphone className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">
              Simulateur Mobile Banking Adhérent 360°
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Conforme aux maquettes bancaires officielles (Coris Bank / UEMOA) • Authentification biométrique, jauge financière & alertes SMS/Email.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => {
              setIsAuthenticated(!isAuthenticated);
              triggerToast(isAuthenticated ? "Déconnexion effectuée" : "Session adhérent connectée");
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-all"
          >
            {isAuthenticated ? '🔒 Verrouiller App' : '🔓 Déverrouiller'}
          </button>
          <button
            onClick={() => {
              setIsAuthenticated(true);
              setActiveTab('menu');
              triggerToast("Avis SMS et Email prêts à tester");
            }}
            style={{ backgroundColor: theme.primaryAccent, color: '#ffffff' }}
            className="px-4 py-2 hover:opacity-90 font-bold rounded-xl transition-all shadow-sm"
          >
            📨 Voir Alertes SMS/Email
          </button>
        </div>
      </div>

      {/* Smartphone Hardware Frame */}
      <div className="relative w-[375px] h-[780px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-[5px] border-slate-800 flex flex-col overflow-hidden select-none">
        
        {/* Dynamic Island / Speaker Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-4 bg-slate-900 rounded-full z-50 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-slate-950/80 mr-3 border border-slate-800" />
          <div className="w-10 h-1.5 rounded-full bg-slate-800" />
        </div>

        {/* Screen Bezel Area */}
        <div className="relative flex-1 bg-white rounded-[38px] overflow-hidden flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
          
          {/* Status Bar */}
          <div className="h-9 px-6 flex items-center justify-between text-[11px] font-bold text-slate-800 bg-transparent z-40">
            <span>09:41</span>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[10px]">5G</span>
              <div className="w-5 h-2.5 border border-slate-700 rounded-sm p-0.5 flex items-center">
                <div className="h-full w-3.5 bg-slate-800 rounded-xs" />
              </div>
            </div>
          </div>

          {/* Toast popup */}
          {toastMessage && (
            <div className="absolute top-10 left-4 right-4 bg-slate-900/95 backdrop-blur text-white px-4 py-2.5 rounded-2xl text-xs font-semibold z-50 shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* SCREEN CONTENT */}
          {!isAuthenticated ? (
            /* ============================================================
               1. SPLASH / LOCK SCREEN (Photo 3 & 5)
               ============================================================ */
            <div className="relative flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-slate-900 via-slate-850 to-slate-950 text-white overflow-hidden">
              
              {/* Background ambient lighting */}
              <div 
                style={{ backgroundColor: theme.primaryAccent }}
                className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-25 pointer-events-none"
              />

              {/* Language & Country Switcher (Top Right) */}
              <div className="flex justify-end pt-1">
                <div className="flex items-center gap-1.5 bg-black/40 border border-white/20 px-3 py-1 rounded-full text-xs font-semibold">
                  <span>Français</span>
                  <span>🇹🇬</span>
                  <ChevronRight className="w-3.5 h-3.5 text-white/60 rotate-90" />
                </div>
              </div>

              {/* Center Welcome & Biometrics */}
              <div className="flex flex-col items-center text-center space-y-6">
                <div>
                  <h2 className="text-2xl font-black tracking-tight leading-tight">
                    Bienvenue sur<br />MyCOOPEC Bank
                  </h2>
                  <p className="text-xs text-white/70 mt-1">
                    Coopérative d'Épargne et de Crédit
                  </p>
                </div>

                {/* Biometric Touch Circle with Pulse Glow */}
                <button
                  onClick={() => {
                    setIsAuthenticated(true);
                    triggerToast("Empreinte reconnue avec succès !");
                  }}
                  className="group relative w-28 h-28 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
                >
                  <div className="absolute inset-0 rounded-full border border-emerald-400/40 animate-ping opacity-40" />
                  <Fingerprint className="w-14 h-14 text-white group-hover:text-emerald-400 transition-colors" />
                </button>

                <p className="text-[11px] text-white/60 font-medium">
                  Toucher pour déverrouiller par empreinte
                </p>
              </div>

              {/* Connect Button (Red/Coral gradient matching Photo 5) */}
              <div className="space-y-4 pb-2">
                <button
                  onClick={() => setIsLoginSheetOpen(true)}
                  className="w-full py-3.5 rounded-2xl text-white font-black text-sm bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-[0.98] transition-all shadow-lg shadow-rose-900/40"
                >
                  Se connecter
                </button>

                {/* Quick Utilities Drawer trigger */}
                <button
                  onClick={() => setIsUtilitiesOpen(true)}
                  className="w-full flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors"
                >
                  <span className="text-[11px] text-center leading-tight">
                    Profitez de la praticité ultime avec<br />les utilitaires MyCOOPEC
                  </span>
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center mt-1">
                    <ChevronUp className="w-5 h-5 text-white" />
                  </div>
                </button>

                <p className="text-center text-[10px] text-white/40">
                  v3.2.0 • Système Sécurisé UEMOA-SFD
                </p>
              </div>

              {/* ============================================================
                 BOTTOM SHEET: LOGIN FORM (Photo 2)
                 ============================================================ */}
              {isLoginSheetOpen && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex flex-col justify-end animate-in fade-in duration-200">
                  <div className="bg-white rounded-t-[32px] p-6 text-slate-900 space-y-4 animate-in slide-in-from-bottom duration-300">
                    
                    {/* Handle bar */}
                    <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto" />

                    {/* Logo & Header */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2.5">
                        <div 
                          style={{ backgroundColor: theme.primaryAccent }}
                          className="p-2 rounded-xl text-white font-black"
                        >
                          <Landmark className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900">COOPEC BANQUE</h3>
                          <p className="text-[10px] text-slate-500 font-semibold">Espace Sécurisé Adhérent</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsLoginSheetOpen(false)}
                        className="p-1 text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Username field */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Nom d'utilisateur / Matricule</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-800"
                      />
                    </div>

                    {/* Password field */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Mot de passe</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-800 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember me & Forgot Password */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-slate-300 text-slate-900 focus:ring-0"
                        />
                        <span>Se souvenir de moi</span>
                      </label>
                      <button 
                        onClick={() => triggerToast("Code OTP envoyé par SMS au numéro associé")}
                        className="text-blue-700 font-bold hover:underline"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={() => {
                        setIsLoginSheetOpen(false);
                        setIsAuthenticated(true);
                        triggerToast("Bienvenue " + username + " !");
                      }}
                      className="w-full py-3 rounded-xl text-white font-bold text-xs bg-rose-600 hover:bg-rose-700 transition-all shadow-md"
                    >
                      Se connecter
                    </button>

                    {/* Footer register links */}
                    <div className="text-center text-[11px] text-slate-500 space-y-1 pt-1">
                      <div>
                        Vous n'avez pas un compte digital ?{' '}
                        <button 
                          onClick={() => triggerToast("Formulaire de création de compte digital")}
                          className="text-rose-600 font-bold hover:underline"
                        >
                          S'inscrire
                        </button>
                      </div>
                      <div>
                        Vous n'êtes pas encore adhérent ?{' '}
                        <button 
                          onClick={() => triggerToast("Pré-adhésion en ligne")}
                          className="text-blue-700 font-bold hover:underline"
                        >
                          Devenir sociétaire
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================
                 BOTTOM SHEET: QUICK UTILITIES (Photo 3)
                 ============================================================ */}
              {isUtilitiesOpen && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex flex-col justify-end animate-in fade-in duration-200">
                  <div className="bg-white rounded-t-[32px] p-6 text-slate-900 space-y-4 animate-in slide-in-from-bottom duration-300">
                    
                    <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto" />

                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-black text-slate-900">Utilitaires MyCOOPEC Bank</h3>
                      <button onClick={() => setIsUtilitiesOpen(false)}>
                        <X className="w-5 h-5 text-slate-400" />
                      </button>
                    </div>

                    {/* 3 top utility boxes */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <button 
                        onClick={() => triggerToast("Taux BCEAO : 1 EUR = 655.957 FCFA")}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center gap-1.5 hover:bg-slate-100 transition-colors"
                      >
                        <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                          <RotateCcw className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-[11px]">Convertisseur</span>
                      </button>

                      <button 
                        onClick={() => triggerToast("Formulaire de réclamation 24/7")}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center gap-1.5 hover:bg-slate-100 transition-colors"
                      >
                        <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-[11px]">Réclamations</span>
                      </button>

                      <button 
                        onClick={() => triggerToast("Assistance : +228 90 00 00 00")}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center gap-1.5 hover:bg-slate-100 transition-colors"
                      >
                        <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
                          <PhoneCall className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-[11px]">Aide & support</span>
                      </button>
                    </div>

                    {/* 2 middle tiles */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">Nous trouver</div>
                          <div className="text-[10px] text-slate-500">Agences & GAB</div>
                        </div>
                        <MapPin className="w-5 h-5 text-sky-600" />
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">Simulateur</div>
                          <div className="text-[10px] text-slate-500">Calcul crédit</div>
                        </div>
                        <Calculator className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>

                    {/* Demo button */}
                    <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-amber-400" />
                        <div>
                          <div className="font-bold text-xs">Essayer notre démo</div>
                          <div className="text-[10px] text-white/70">Expérience adhérent complète</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsUtilitiesOpen(false);
                          setIsAuthenticated(true);
                          triggerToast("Mode Démo activé");
                        }}
                        className="px-4 py-1.5 bg-white text-slate-900 font-bold rounded-xl text-xs"
                      >
                        Démo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ============================================================
               2. AUTHENTICATED DASHBOARD (Photo 4)
               ============================================================ */
            <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
              
              {/* Header */}
              <div className="bg-white px-5 py-2.5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Comptes</h2>
                  <p className="text-[10px] text-slate-500 font-semibold">Adhérent : {username}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setActiveTab('menu')}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 relative"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
                  </button>
                </div>
              </div>

              {/* Main Scrolling Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* 1. Pill Tabs (Comptes titulaires / Comptes DAT) */}
                <div className="bg-slate-200/80 p-1 rounded-full flex text-xs font-bold">
                  <button
                    onClick={() => setAccountSubTab('titulaires')}
                    className={`flex-1 py-1.5 rounded-full transition-all ${
                      accountSubTab === 'titulaires'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Comptes titulaires
                  </button>
                  <button
                    onClick={() => setAccountSubTab('dat')}
                    className={`flex-1 py-1.5 rounded-full transition-all ${
                      accountSubTab === 'dat'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Comptes DAT & Épargne
                  </button>
                </div>

                {/* 2. Visual Bank Account Card (Photo 4) */}
                <div className={`p-5 rounded-3xl text-white shadow-xl bg-gradient-to-br ${currentAccount.gradient} space-y-4`}>
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-white/20 rounded-lg">
                        <Wallet className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-[11px] font-black tracking-wider uppercase">{currentAccount.title}</div>
                        <div className="text-[11px] font-mono text-white/80 font-bold">{currentAccount.number}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsFavorite(!isFavorite)}
                      className="text-amber-300 hover:text-amber-400 transition-colors"
                    >
                      <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-300' : ''}`} />
                    </button>
                  </div>

                  {/* Balance Display */}
                  <div className="flex items-end justify-between pt-1">
                    <div>
                      <div className="text-[10px] text-white/70 font-semibold">Solde Actuel</div>
                      <div className="text-xl font-black font-mono tracking-tight">
                        {isBalanceVisible
                          ? `${currentAccount.balance.toLocaleString('fr-FR')} ${currentAccount.currency}`
                          : '•••••••• XOF'}
                      </div>
                    </div>
                    <button
                      onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/80 transition-colors"
                    >
                      {isBalanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Card Carousel Navigation */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                  <button
                    disabled={cardIndex === 0}
                    onClick={() => setCardIndex(cardIndex - 1)}
                    className="flex items-center gap-1 disabled:opacity-30 hover:text-slate-900"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Précédent</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {accounts.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          cardIndex === i ? 'w-4 bg-slate-900' : 'w-1.5 bg-slate-300'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    disabled={cardIndex === accounts.length - 1}
                    onClick={() => setCardIndex(cardIndex + 1)}
                    className="flex items-center gap-1 disabled:opacity-30 hover:text-slate-900"
                  >
                    <span>Suivant</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 3. Quick 3-Action Buttons (Photo 4) */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => triggerToast("Module de virement compte à compte")}
                    className="p-3.5 bg-white border border-slate-200 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
                  >
                    <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                      <ArrowLeftRight className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">Virement</span>
                  </button>

                  <button
                    onClick={() => triggerToast("Paiement factures & cotisations tontines")}
                    className="p-3.5 bg-white border border-slate-200 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
                  >
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">Paiement factures</span>
                  </button>

                  <button
                    onClick={() => triggerToast("Mobile Money Flooz & T-Money")}
                    className="p-3.5 bg-white border border-slate-200 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
                  >
                    <div className="p-2 rounded-xl bg-slate-900 text-white">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">Achat crédit mobile</span>
                  </button>
                </div>

                {/* 4. Speedometer / Gauge Financial Visualization (Photo 4) */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500">Solde & Capacité d'emprunt</span>
                    <span className="font-mono font-black text-slate-900">2 000 000 XOF</span>
                  </div>

                  {/* Circular Speedometer Gauge SVG */}
                  <div className="relative flex flex-col items-center justify-center pt-2">
                    <svg viewBox="0 0 160 90" className="w-48 h-28">
                      {/* Background Arc */}
                      <path
                        d="M 20 80 A 60 60 0 0 1 140 80"
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="12"
                        strokeLinecap="round"
                      />
                      {/* Active Blue Arc (75%) */}
                      <path
                        d="M 20 80 A 60 60 0 0 1 118 36"
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="12"
                        strokeLinecap="round"
                      />
                      {/* Warning Red Arc (25%) */}
                      <path
                        d="M 118 36 A 60 60 0 0 1 140 80"
                        fill="none"
                        stroke="#E11D48"
                        strokeWidth="12"
                        strokeLinecap="round"
                      />
                    </svg>

                    <div className="absolute bottom-2 text-center">
                      <div className="text-xs font-black text-emerald-700">75% disponible</div>
                      <div className="text-[9px] text-slate-400 font-medium">Quotité 33% respectée</div>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                    <div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase">Entrées</div>
                      <div className="text-xs font-bold text-emerald-600">+350 000 F</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase">Dépenses</div>
                      <div className="text-xs font-bold text-rose-600">-120 000 F</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase">Épargne</div>
                      <div className="text-xs font-bold text-blue-600">+25 000 F</div>
                    </div>
                  </div>
                </div>

                {/* 5. Notification / SMS / Email Message List preview */}
                {activeTab === 'menu' && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <span>Centre de Notifications & SMS</span>
                      </h3>
                      <div className="flex gap-1 text-[10px] font-bold">
                        {(['ALL', 'SMS', 'EMAIL'] as const).map(cat => (
                          <button
                            key={cat}
                            onClick={() => setNotificationCategory(cat)}
                            className={`px-2 py-0.5 rounded-full ${
                              notificationCategory === cat
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {filteredNotifs.map(n => (
                        <div 
                          key={n.id} 
                          className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{n.title}</span>
                            <span className="text-[9px] text-slate-400">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-tight">{n.content}</p>
                          {n.hasPdf && (
                            <button
                              onClick={() => triggerToast(`Téléchargement de ${n.pdfName}`)}
                              className="mt-1 flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                            >
                              <Download className="w-3 h-3" />
                              <span>{n.pdfName}</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 5-Tab Bottom Navigation Bar (Photo 4) */}
              <div className="bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-around text-[10px] font-bold text-slate-400">
                <button
                  onClick={() => setActiveTab('accueil')}
                  className={`flex flex-col items-center gap-1 ${activeTab === 'accueil' ? 'text-slate-900' : 'hover:text-slate-700'}`}
                >
                  <Landmark className="w-5 h-5" />
                  <span>Accueil</span>
                </button>

                <button
                  onClick={() => setActiveTab('comptes')}
                  className={`flex flex-col items-center gap-1 ${activeTab === 'comptes' ? 'text-blue-700 font-extrabold' : 'hover:text-slate-700'}`}
                >
                  <Wallet className="w-5 h-5" />
                  <span>Comptes</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('cartes');
                    triggerToast("Gestion des cartes virtuelles et prêts");
                  }}
                  className={`flex flex-col items-center gap-1 ${activeTab === 'cartes' ? 'text-slate-900' : 'hover:text-slate-700'}`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Cartes</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('virements');
                    triggerToast("Virements & transferts express");
                  }}
                  className={`flex flex-col items-center gap-1 ${activeTab === 'virements' ? 'text-slate-900' : 'hover:text-slate-700'}`}
                >
                  <ArrowLeftRight className="w-5 h-5" />
                  <span>Virements</span>
                </button>

                <button
                  onClick={() => setActiveTab('menu')}
                  className={`flex flex-col items-center gap-1 ${activeTab === 'menu' ? 'text-slate-900 font-extrabold' : 'hover:text-slate-700'}`}
                >
                  <Bell className="w-5 h-5" />
                  <span>Alertes</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
