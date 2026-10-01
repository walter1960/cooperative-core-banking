import React, { useState } from 'react';
import { 
  Settings, 
  X, 
  Building2, 
  Percent, 
  Calendar, 
  Coins, 
  ShieldCheck, 
  Palette, 
  Database, 
  Download, 
  UploadCloud, 
  Printer,
  Check,
  Image as ImageIcon,
  Upload,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  FileText,
  Stamp,
  Users,
  User
} from 'lucide-react';
import { CoopOfficialHeader, BankAccountItem, DEFAULT_HEADER_CONFIG } from '../forms/CoopOfficialHeader';

interface CooperativeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CooperativeSettingsModal: React.FC<CooperativeSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'header' | 'financial' | 'database'>('general');
  
  // Paramètres Généraux & Dynamiques (Sans texte en dur)
  const [institutionName, setInstitutionName] = useState<string>(() => {
    return localStorage.getItem('coop_institution_name') || DEFAULT_HEADER_CONFIG.institutionName;
  });
  const [institutionSub, setInstitutionSub] = useState<string>(() => {
    return localStorage.getItem('coop_institution_sub') || DEFAULT_HEADER_CONFIG.institutionSubtitle;
  });
  const [institutionCity, setInstitutionCity] = useState<string>(() => {
    return localStorage.getItem('coop_institution_city') || 'Lomé';
  });
  const [partnerEntity, setPartnerEntity] = useState<string>(() => {
    return localStorage.getItem('coop_partner_entity') || 'ASECNA TOGO';
  });
  const [accountManagerName, setAccountManagerName] = useState<string>(() => {
    return localStorage.getItem('coop_account_manager_name') || 'M. KODJO Mensah';
  });
  const [accountManagerTitle, setAccountManagerTitle] = useState<string>(() => {
    return localStorage.getItem('coop_account_manager_title') || 'Gestionnaire de Portefeuille / Gérant';
  });
  const [isMultiCenter, setIsMultiCenter] = useState<boolean>(() => {
    return localStorage.getItem('coop_multicenter_enabled') === 'true';
  });
  const [shareValue, setShareValue] = useState<number>(5000);
  const [maxCashierLimit, setMaxCashierLimit] = useState<number>(10000000);
  const [creditRate, setCreditRate] = useState<number>(6.5);
  const [exerciseYear, setExerciseYear] = useState<number>(2026);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Configuration En-tête & Documents Officiels
  const [headerMode, setHeaderMode] = useState<'custom_fields' | 'banner_image'>(() => {
    return (localStorage.getItem('coop_header_mode') as any) || DEFAULT_HEADER_CONFIG.mode;
  });
  const [bannerImageUrl, setBannerImageUrl] = useState<string>(() => {
    return localStorage.getItem('coop_header_banner') || DEFAULT_HEADER_CONFIG.bannerImageUrl;
  });
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    return localStorage.getItem('coop_institution_logo') || DEFAULT_HEADER_CONFIG.logoUrl;
  });
  const [legalMentions, setLegalMentions] = useState<string>(() => {
    return localStorage.getItem('coop_legal_mentions') || DEFAULT_HEADER_CONFIG.legalMentions;
  });
  const [referenceSuffix, setReferenceSuffix] = useState<string>(() => {
    return localStorage.getItem('coop_reference_format') || DEFAULT_HEADER_CONFIG.referenceSuffix;
  });
  const [motto, setMotto] = useState<string>(() => {
    return localStorage.getItem('coop_motto') || DEFAULT_HEADER_CONFIG.motto;
  });
  const [treasurerName, setTreasurerName] = useState<string>(() => {
    return localStorage.getItem('coop_treasurer_name') || DEFAULT_HEADER_CONFIG.treasurerName;
  });
  const [pcaName, setPcaName] = useState<string>(() => {
    return localStorage.getItem('coop_pca_name') || DEFAULT_HEADER_CONFIG.pcaName;
  });
  const [managerName, setManagerName] = useState<string>(() => {
    return localStorage.getItem('coop_manager_name') || DEFAULT_HEADER_CONFIG.managerName;
  });
  const [ccPresidentName, setCcPresidentName] = useState<string>(() => {
    return localStorage.getItem('coop_cc_president_name') || DEFAULT_HEADER_CONFIG.creditCommitteePresidentName;
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>(() => {
    try {
      const stored = localStorage.getItem('coop_bank_accounts');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (_) {}
    return DEFAULT_HEADER_CONFIG.bankAccounts;
  });

  if (!isOpen) return null;

  // Handlers pour fichiers image
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setBannerImageUrl(reader.result);
          setHeaderMode('banner_image');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setLogoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddBankAccount = () => {
    setBankAccounts([
      ...bankAccounts,
      { id: String(Date.now()), bankName: 'Compte Bancaire N°', accountNumber: '' }
    ]);
  };

  const handleRemoveBankAccount = (id: string) => {
    setBankAccounts(bankAccounts.filter(acc => acc.id !== id));
  };

  const handleUpdateBankAccount = (id: string, field: 'bankName' | 'accountNumber', value: string) => {
    setBankAccounts(bankAccounts.map(acc => acc.id === id ? { ...acc, [field]: value } : acc));
  };

  const handleResetToDefaultHeader = () => {
    setHeaderMode(DEFAULT_HEADER_CONFIG.mode);
    setBannerImageUrl(DEFAULT_HEADER_CONFIG.bannerImageUrl);
    setLogoUrl(DEFAULT_HEADER_CONFIG.logoUrl);
    setInstitutionName(DEFAULT_HEADER_CONFIG.institutionName);
    setInstitutionSub(DEFAULT_HEADER_CONFIG.institutionSubtitle);
    setLegalMentions(DEFAULT_HEADER_CONFIG.legalMentions);
    setReferenceSuffix(DEFAULT_HEADER_CONFIG.referenceSuffix);
    setMotto(DEFAULT_HEADER_CONFIG.motto);
    setTreasurerName(DEFAULT_HEADER_CONFIG.treasurerName);
    setPcaName(DEFAULT_HEADER_CONFIG.pcaName);
    setManagerName(DEFAULT_HEADER_CONFIG.managerName);
    setCcPresidentName(DEFAULT_HEADER_CONFIG.creditCommitteePresidentName);
    setBankAccounts(DEFAULT_HEADER_CONFIG.bankAccounts);
    setInstitutionCity('Lomé');
    setPartnerEntity('ASECNA TOGO');
    setAccountManagerName('M. KODJO Mensah');
    setAccountManagerTitle('Gestionnaire de Portefeuille / Gérant');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('coop_institution_name', institutionName);
    localStorage.setItem('coop_institution_sub', institutionSub);
    localStorage.setItem('coop_institution_city', institutionCity);
    localStorage.setItem('coop_partner_entity', partnerEntity);
    localStorage.setItem('coop_account_manager_name', accountManagerName);
    localStorage.setItem('coop_account_manager_title', accountManagerTitle);
    localStorage.setItem('coop_multicenter_enabled', String(isMultiCenter));

    // Sauvegarde configuration d'en-tête & signataires
    localStorage.setItem('coop_header_mode', headerMode);
    localStorage.setItem('coop_header_banner', bannerImageUrl);
    localStorage.setItem('coop_institution_logo', logoUrl);
    localStorage.setItem('coop_legal_mentions', legalMentions);
    localStorage.setItem('coop_reference_format', referenceSuffix);
    localStorage.setItem('coop_motto', motto);
    localStorage.setItem('coop_treasurer_name', treasurerName);
    localStorage.setItem('coop_pca_name', pcaName);
    localStorage.setItem('coop_manager_name', managerName);
    localStorage.setItem('coop_cc_president_name', ccPresidentName);
    localStorage.setItem('coop_bank_accounts', JSON.stringify(bankAccounts));

    // Émettre l'événement global de mise à jour instantanée
    window.dispatchEvent(new Event('coop_settings_updated'));
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      institutionName,
      institutionSub,
      isMultiCenter,
      headerConfig: {
        headerMode,
        bannerImageUrl,
        logoUrl,
        legalMentions,
        referenceSuffix,
        motto,
        treasurerName,
        pcaName,
        managerName,
        ccPresidentName,
        bankAccounts
      },
      localStorageDump: { ...localStorage }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_cooperative_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Paramètres & Personnalisation de la Coopérative
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                En-tête officiel, logo, comptes bancaires, signataires, règles financières et sauvegardes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 text-xs font-bold text-slate-600 px-6 gap-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-2.5 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-slate-900 text-slate-950'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Général & Déploiement
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('header')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'header'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>En-tête & Documents Officiels</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('financial')}
            className={`pb-2.5 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'financial'
                ? 'border-slate-900 text-slate-950'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Règles & Plafonds Financiers
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`pb-2.5 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'database'
                ? 'border-slate-900 text-slate-950'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Sauvegarde & Données
          </button>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="coop-settings-form" onSubmit={handleSave} className="space-y-5 text-xs font-semibold">
            
            {/* ------------------------------------------------------------- */}
            {/* TAB 1: GÉNÉRAL                                                */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">
                    Nom de la Coopérative / SFD
                  </label>
                  <input
                    type="text"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">
                    Sous-titre / Raison Sociale Complète
                  </label>
                  <input
                    type="text"
                    value={institutionSub}
                    onChange={(e) => setInstitutionSub(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                {/* Option Multi-centre activable ou non */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-800" />
                        <span className="font-bold text-slate-900 text-sm">Mode Multi-centre</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {isMultiCenter 
                          ? `Activé : Prise en charge de plusieurs agences (${institutionCity} Siège, Agences régionales).` 
                          : `Désactivé : Fonctionnement en Siège Unique centralisé (par ex. ${institutionCity} Siège ${partnerEntity}).`}
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isMultiCenter}
                        onChange={(e) => setIsMultiCenter(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                    </label>
                  </div>

                  <div className="text-[11px] px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600">
                    Configuration active : <strong className="text-slate-900">{isMultiCenter ? 'Architecture Multi-Agences & Caisses Déléguées' : `Siège Unique (${institutionCity})`}</strong>
                  </div>
                </div>

                {/* Localité et Entité Partenaire (100% Dynamiques) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-800 font-bold mb-1.5">
                      Ville / Localité du Siège
                    </label>
                    <input
                      type="text"
                      value={institutionCity}
                      onChange={(e) => setInstitutionCity(e.target.value)}
                      placeholder="Ex: Lomé, Kara, Cotonou, Abidjan..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-800 font-bold mb-1.5">
                      Organisme Partenaire / Entreprise
                    </label>
                    <input
                      type="text"
                      value={partnerEntity}
                      onChange={(e) => setPartnerEntity(e.target.value)}
                      placeholder="Ex: ASECNA TOGO, Personnel Port..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                {/* Gestionnaire de Compte (Personnalisable) */}
                <div className="p-4 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-800" />
                    <span className="font-bold text-indigo-950 text-sm">Gestionnaire de Compte Actif</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-indigo-900 font-bold mb-1">
                        Nom et Prénom(s) du Gestionnaire
                      </label>
                      <input
                        type="text"
                        value={accountManagerName}
                        onChange={(e) => setAccountManagerName(e.target.value)}
                        placeholder="Ex: M. KODJO Mawuli"
                        className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-indigo-900 font-bold mb-1">
                        Fonction / Titre
                      </label>
                      <input
                        type="text"
                        value={accountManagerTitle}
                        onChange={(e) => setAccountManagerTitle(e.target.value)}
                        placeholder="Ex: Gestionnaire de Portefeuille / Gérant"
                        className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-indigo-700">
                    Ce nom remplace "Administrateur" sur l'écran d'accueil, les fiches d'instructions et les reçus de caisse.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">
                    Année d'Exercice Comptable
                  </label>
                  <input
                    type="number"
                    value={exerciseYear}
                    onChange={(e) => setExerciseYear(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 2: EN-TÊTE & DOCUMENTS OFFICIELS                          */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'header' && (
              <div className="space-y-6">
                
                {/* Choix du mode d'en-tête */}
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl">
                  <span className="font-bold text-blue-950 text-xs block mb-1">
                    Méthode d'En-tête pour les Formulaires Officiels
                  </span>
                  <p className="text-[11px] text-blue-700 mb-3">
                    Sélectionnez si vous souhaitez composer dynamiquement les champs (logo + textes + comptes) ou importer directement une bannière graphique complète pré-dessinée (JPEG ou PNG).
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setHeaderMode('custom_fields')}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        headerMode === 'custom_fields'
                          ? 'border-blue-600 bg-white shadow-sm ring-2 ring-blue-600/20'
                          : 'border-slate-200 bg-white/60 hover:bg-white'
                      }`}
                    >
                      <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                        <span>Générateur Structuré</span>
                        {headerMode === 'custom_fields' && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-normal">
                        Logo à gauche + Titre/Agrément au centre + Comptes bancaires à droite + N° de référence
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHeaderMode('banner_image')}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        headerMode === 'banner_image'
                          ? 'border-blue-600 bg-white shadow-sm ring-2 ring-blue-600/20'
                          : 'border-slate-200 bg-white/60 hover:bg-white'
                      }`}
                    >
                      <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                        <span>Bannière Complète en Image</span>
                        {headerMode === 'banner_image' && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-normal">
                        Image globale d'en-tête officielle scannée ou conçue au format PNG / JPEG
                      </p>
                    </button>
                  </div>
                </div>

                {/* Option 1: Chargement de la bannière complète image */}
                {headerMode === 'banner_image' && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">Image Bannière Complète (PNG / JPEG)</span>
                      <button
                        type="button"
                        onClick={() => setBannerImageUrl(DEFAULT_HEADER_CONFIG.bannerImageUrl)}
                        className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Restaurer bannière officielle</span>
                      </button>
                    </div>

                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-white">
                      {bannerImageUrl ? (
                        <div className="space-y-3">
                          <img 
                            src={bannerImageUrl} 
                            alt="Aperçu Bannière" 
                            className="w-full max-h-24 object-contain mx-auto border border-slate-200 rounded bg-slate-50"
                          />
                          <div className="flex justify-center gap-2">
                            <label className="cursor-pointer px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-sm">
                              <Upload className="w-3.5 h-3.5 text-blue-400" />
                              <span>Changer l'image (PNG / JPEG)</span>
                              <input 
                                type="file" 
                                accept="image/png, image/jpeg, image/jpg" 
                                onChange={handleBannerFileChange} 
                                className="hidden" 
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center p-3">
                          <ImageIcon className="w-8 h-8 text-slate-400 mb-1" />
                          <span className="text-xs font-bold text-slate-800">Cliquez pour charger l'image d'en-tête (PNG / JPEG)</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">Format recommandé : 1200 x 200 px</span>
                          <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/jpg" 
                            onChange={handleBannerFileChange} 
                            className="hidden" 
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* Option 2: Champs structurés */}
                {headerMode === 'custom_fields' && (
                  <div className="space-y-4">
                    
                    {/* Logo upload */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">Logo de la Coopérative (Ovale / Emblème)</span>
                        <button
                          type="button"
                          onClick={() => setLogoUrl(DEFAULT_HEADER_CONFIG.logoUrl)}
                          className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Logo COOPECTAT par défaut</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
                        <div className="w-20 h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                          <img 
                            src={logoUrl || '/copectat_logo.png'} 
                            alt="Logo" 
                            className="w-full h-full object-contain p-1"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/copectat_logo.png'; }}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="text-[11px] text-slate-500 font-normal">
                            Chargez votre fichier image (JPEG, PNG ou SVG) pour remplacer le logo sur les formulaires imprimables.
                          </p>
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px] shadow-sm">
                            <Upload className="w-3.5 h-3.5 text-blue-400" />
                            <span>Charger un nouveau logo (PNG / JPEG)</span>
                            <input 
                              type="file" 
                              accept="image/png, image/jpeg, image/jpg, image/svg+xml" 
                              onChange={handleLogoFileChange} 
                              className="hidden" 
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Mentions Légales & Contacts */}
                    <div>
                      <label className="block text-slate-800 font-bold mb-1.5">
                        Mentions Légales, Agrément & Contacts
                      </label>
                      <textarea
                        value={legalMentions}
                        onChange={(e) => setLegalMentions(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                        placeholder="Agrément N° ..., BP ..., Tél ..., Email ..."
                      />
                    </div>

                    {/* Comptes Bancaires Institutionnels */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">Comptes Bancaires Institutionnels</span>
                          <span className="text-[10px] text-slate-500 font-normal">Comptes affichés en haut à droite des formulaires officiels</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddBankAccount}
                          className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-800 flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Ajouter un compte</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {bankAccounts.map((account) => (
                          <div key={account.id} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                            <input
                              type="text"
                              value={account.bankName}
                              onChange={(e) => handleUpdateBankAccount(account.id, 'bankName', e.target.value)}
                              placeholder="Ex: Compte UTB N°"
                              className="w-1/3 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                            />
                            <input
                              type="text"
                              value={account.accountNumber}
                              onChange={(e) => handleUpdateBankAccount(account.id, 'accountNumber', e.target.value)}
                              placeholder="Numéro de compte (ex: 01031- 30849900800-25)"
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveBankAccount(account.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Supprimer ce compte"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Format Suffixe N° Délibération */}
                    <div>
                      <label className="block text-slate-800 font-bold mb-1.5">
                        Suffixe Référence de Délibération / Document
                      </label>
                      <input
                        type="text"
                        value={referenceSuffix}
                        onChange={(e) => setReferenceSuffix(e.target.value)}
                        placeholder="/COOPECTAT/CA/"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 font-mono font-bold text-slate-900"
                      />
                    </div>

                  </div>
                )}

                {/* Signataires & Devise de la Coopérative */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Stamp className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-xs">Signataires Institutionnels & Devise Officielle</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Ces intitulés et signatures apparaîtront sur les délibérations de prêt et fiches de retrait.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-slate-700 text-[11px] font-bold mb-1">
                        Devise de la Coopérative (Bas de page)
                      </label>
                      <input
                        type="text"
                        value={motto}
                        onChange={(e) => setMotto(e.target.value)}
                        placeholder="Ex: ENSEMBLE NOUS SOMMES FORTS"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 text-[11px] font-bold mb-1">
                        Nom du Trésorier Général (TG)
                      </label>
                      <input
                        type="text"
                        value={treasurerName}
                        onChange={(e) => setTreasurerName(e.target.value)}
                        placeholder="Ex: ANKRAH Adoté A-Sting"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 text-[11px] font-bold mb-1">
                        Président du Conseil d'Administration (PCA)
                      </label>
                      <input
                        type="text"
                        value={pcaName}
                        onChange={(e) => setPcaName(e.target.value)}
                        placeholder="Ex: Le PCA COOPECTAT"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 text-[11px] font-bold mb-1">
                        Direction Générale / Gérance
                      </label>
                      <input
                        type="text"
                        value={managerName}
                        onChange={(e) => setManagerName(e.target.value)}
                        placeholder="Ex: La Gérante"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 text-[11px] font-bold mb-1">
                        Président du Comité de Crédit (CC)
                      </label>
                      <input
                        type="text"
                        value={ccPresidentName}
                        onChange={(e) => setCcPresidentName(e.target.value)}
                        placeholder="Ex: Le Président du CC"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Aperçu en direct (Temps Réel) */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Aperçu en direct (s'actualise instantanément à la frappe)</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleResetToDefaultHeader}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Réinitialiser aux valeurs d'origine</span>
                    </button>
                  </div>

                  <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs overflow-x-auto">
                    <CoopOfficialHeader 
                      documentNumber="2026/042" 
                      showReference={true} 
                      overrideConfig={{
                        mode: headerMode,
                        bannerImageUrl,
                        logoUrl,
                        institutionName,
                        institutionSubtitle: institutionSub,
                        legalMentions,
                        bankAccounts,
                        referenceSuffix,
                        motto,
                        treasurerName,
                        pcaName,
                        managerName,
                        creditCommitteePresidentName: ccPresidentName
                      }}
                    />
                  </div>
                </div>

              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 3: RÈGLES FINANCIÈRES                                     */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'financial' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-800 font-bold mb-1.5">Valeur Nominale Part Sociale (F.CFA)</label>
                    <input
                      type="number"
                      value={shareValue}
                      onChange={(e) => setShareValue(Number(e.target.value))}
                      step="1000"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1.5">Taux d'Intérêt Crédit Standard (%)</label>
                    <input
                      type="number"
                      value={creditRate}
                      onChange={(e) => setCreditRate(Number(e.target.value))}
                      step="0.1"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">Plafond Maximum Encaisse Guichet (F.CFA)</label>
                  <input
                    type="number"
                    value={maxCashierLimit}
                    onChange={(e) => setMaxCashierLimit(Number(e.target.value))}
                    step="500000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 4: SAUVEGARDE & BASE DE DONNÉES                           */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'database' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block">Sauvegarde Instantanée</span>
                  <p className="text-slate-500 text-xs">
                    Exportez l'intégralité des sociétaires, livrets d'épargne, écritures comptables, paramètres d'en-tête et transactions dans un fichier chiffré JSON.
                  </p>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm mt-2"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Télécharger la Sauvegarde Complète (.json)</span>
                  </button>
                </div>
              </div>
            )}

            {savedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl font-bold text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Paramètres, en-tête et signataires enregistrés avec succès !</span>
              </div>
            )}

          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 px-6 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl">
          <span className="text-[11px] text-slate-400">
            Toutes les modifications sont immédiatement appliquées aux formulaires et impressions.
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Fermer
            </button>
            <button
              type="submit"
              form="coop-settings-form"
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm transition-colors"
            >
              Enregistrer les modifications
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
