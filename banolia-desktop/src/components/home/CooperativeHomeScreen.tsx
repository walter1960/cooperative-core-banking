import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Coins, 
  Lock, 
  Calculator, 
  Receipt, 
  Landmark, 
  Users, 
  Building2, 
  Shield, 
  Camera, 
  RotateCcw, 
  Edit2, 
  Palette 
} from 'lucide-react';
import { ThemeCustomizerModal, CooperativeTheme, defaultTheme } from './ThemeCustomizerModal';

import { 
  RealisticInscriptionIcon,
  RealisticProjetIcon,
  RealisticEpargneIcon,
  RealisticComptabiliteIcon,
  RealisticCaisseIcon,
  RealisticCreditIcon,
  RealisticSocietairesIcon,
  RealisticPrelevementsIcon
} from './RealisticCoopIcons';

interface ModuleItem {
  id: string;
  title: string;
  subtitle: string;
  iconType: 'inscription' | 'projet' | 'epargne' | 'comptabilite' | 'caisse' | 'credit' | 'societaires' | 'prelevements';
}

interface CooperativeHomeScreenProps {
  onSelectModule: (moduleId: string) => void;
}

export const CooperativeHomeScreen: React.FC<CooperativeHomeScreenProps> = ({ onSelectModule }) => {
  // Institution branding state (customizable and persisted)
  const [institutionName, setInstitutionName] = useState<string>(() => {
    return localStorage.getItem('coop_institution_name') || 'COOPEC';
  });
  const [institutionSubtitle, setInstitutionSubtitle] = useState<string>(() => {
    return localStorage.getItem('coop_institution_sub') || "Coopérative d'Épargne et de Crédit";
  });
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    return localStorage.getItem('coop_institution_logo') || '/copectat_logo.png';
  });

  // Custom Theme Colors State
  const [theme, setTheme] = useState<CooperativeTheme>(() => {
    const saved = localStorage.getItem('coop_custom_theme');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultTheme;
      }
    }
    return defaultTheme;
  });

  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save theme on change
  const handleUpdateTheme = (newTheme: CooperativeTheme) => {
    setTheme(newTheme);
    localStorage.setItem('coop_custom_theme', JSON.stringify(newTheme));
  };

  // Session Info
  const [sessionInfo] = useState({
    user: 'ADMINISTRATEUR',
    agency: 'Agence Siège',
    date: new Date().toLocaleDateString('fr-FR'),
    cashier: 'CSH-001',
    balance: '0 F.CFA'
  });

  const modules: ModuleItem[] = [
    {
      id: 'inscription',
      title: 'Inscription',
      subtitle: 'Adhésion d\'un nouveau sociétaire, dossier KYC & parts sociales',
      iconType: 'inscription'
    },
    {
      id: 'projet',
      title: 'Projet',
      subtitle: 'Financement de projets : habitat, véhicules et équipements',
      iconType: 'projet'
    },
    {
      id: 'epargne',
      title: 'Epargne',
      subtitle: 'Livrets d\'épargne obligatoire, épargne libre et dépôts à terme',
      iconType: 'epargne'
    },
    {
      id: 'comptabilite',
      title: 'Comptabilite',
      subtitle: 'Grand Livre SYSCOA-SFD, balance à 6 colonnes et bilans annuels',
      iconType: 'comptabilite'
    },
    {
      id: 'caisse',
      title: 'Caisse',
      subtitle: 'Guichet express, versements, retraits et billetage BCEAO',
      iconType: 'caisse'
    },
    {
      id: 'credit',
      title: 'Credit',
      subtitle: 'Avances sur salaires, prêts équipement & suivi des remboursements',
      iconType: 'credit'
    },
    {
      id: 'societaires',
      title: 'Societaires',
      subtitle: 'Fiches 360° des adhérents, situation financière & livrets',
      iconType: 'societaires'
    },
    {
      id: 'prelevements',
      title: 'Prelevements',
      subtitle: 'Retenues à la source employeurs & bordereaux de paie',
      iconType: 'prelevements'
    }
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setLogoUrl(result);
        localStorage.setItem('coop_institution_logo', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetDefaultLogo = () => {
    setLogoUrl('/copectat_logo.png');
    setInstitutionName('COOPEC');
    setInstitutionSubtitle("Coopérative d'Épargne et de Crédit");
    localStorage.removeItem('coop_institution_logo');
    localStorage.removeItem('coop_institution_name');
    localStorage.removeItem('coop_institution_sub');
  };

  const handleSaveOrgInfo = () => {
    localStorage.setItem('coop_institution_name', institutionName);
    localStorage.setItem('coop_institution_sub', institutionSubtitle);
    setIsEditingOrg(false);
  };

  const renderIcon = (type: ModuleItem['iconType']) => {
    switch (type) {
      case 'inscription':
        return <RealisticInscriptionIcon className="w-24 h-24" />;
      case 'projet':
        return <RealisticProjetIcon className="w-24 h-24" />;
      case 'epargne':
        return <RealisticEpargneIcon className="w-24 h-24" />;
      case 'comptabilite':
        return <RealisticComptabiliteIcon className="w-24 h-24" />;
      case 'caisse':
        return <RealisticCaisseIcon className="w-24 h-24" />;
      case 'credit':
        return <RealisticCreditIcon className="w-24 h-24" />;
      case 'societaires':
        return <RealisticSocietairesIcon className="w-24 h-24" />;
      case 'prelevements':
        return <RealisticPrelevementsIcon className="w-24 h-24" />;
    }
  };

  return (
    <div 
      className="w-screen h-screen flex flex-col select-none font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden"
      style={{ backgroundColor: theme.sidebarBg }}
    >
      {/* Top Main Banner Bar */}
      <div 
        className="h-11 px-6 flex items-center justify-between border-b shadow-sm transition-colors"
        style={{ 
          backgroundColor: theme.topBarBg, 
          color: theme.topBarText,
          borderColor: 'rgba(0,0,0,0.15)'
        }}
      >
        <div className="font-bold text-sm tracking-wider flex items-center gap-2">
          <span style={{ color: theme.primaryAccent }}>BIENVENUE DANS</span>
          <span className="font-black">{institutionName.toUpperCase()}</span>
        </div>
        
        <div className="flex items-center gap-4 text-xs font-medium opacity-90">
          <span>{institutionSubtitle}</span>
          
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="flex items-center gap-1.5 bg-black/20 hover:bg-black/40 text-white px-3 py-1 rounded-lg transition-colors border border-white/10 text-xs font-bold"
            title="Personnaliser les couleurs de l'interface"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Personnaliser Couleurs</span>
          </button>
        </div>
      </div>

      {/* Main Body Layout (Left Sidebar + Right Geometric Grid) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Panel */}
        <div 
          className="w-80 p-5 flex flex-col justify-between border-r shadow-xl z-10 transition-colors"
          style={{ 
            backgroundColor: theme.sidebarBg, 
            color: theme.sidebarText,
            borderColor: 'rgba(0,0,0,0.15)'
          }}
        >
          <div className="space-y-5">
            {/* Logo Box with Dynamic Upload & Customization */}
            <div 
              className="bg-white rounded-lg border-2 shadow-lg p-3 text-center flex flex-col items-center justify-center relative group min-h-[170px]"
              style={{ borderColor: theme.primaryAccent }}
            >
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Logo Coopérative" 
                  className="max-h-28 max-w-full object-contain drop-shadow-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="font-black text-xl text-[#0099cc] tracking-wider leading-tight">
                  VOTRE<br />LOGO
                </div>
              )}

              {/* Hover overlay to change logo */}
              <div className="absolute inset-0 bg-slate-900/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
                  style={{ backgroundColor: theme.primaryAccent }}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Changer le logo</span>
                </button>
                <button
                  onClick={handleResetDefaultLogo}
                  className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Réinitialiser</span>
                </button>
              </div>

              <input 
                ref={fileInputRef} 
                type="file" 
                accept="image/*" 
                onChange={handleLogoUpload} 
                className="hidden" 
              />
            </div>

            {/* Institution Title with Edit Trigger */}
            <div className="flex items-center justify-between text-xs pb-1 border-b border-white/20">
              <span className="font-bold truncate max-w-[200px]" style={{ color: theme.primaryAccent }}>
                {institutionName}
              </span>
              <button 
                onClick={() => setIsEditingOrg(!isEditingOrg)}
                className="text-slate-300 hover:text-white p-1"
                title="Modifier le nom de la coopérative"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Inline Org Editing Form */}
            {isEditingOrg && (
              <div className="p-3 bg-slate-900/80 rounded-lg border border-white/20 text-xs space-y-2 animate-in fade-in">
                <div>
                  <label className="block text-slate-300 text-[10px] mb-1 font-bold">Nom de la Coopérative</label>
                  <input
                    type="text"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[10px] mb-1 font-bold">Sous-titre / Description</label>
                  <input
                    type="text"
                    value={institutionSubtitle}
                    onChange={(e) => setInstitutionSubtitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-300 text-[11px]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button 
                    onClick={() => setIsEditingOrg(false)}
                    className="px-2 py-1 text-[11px] text-slate-300 hover:text-white"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleSaveOrgInfo}
                    className="px-3 py-1 text-white rounded text-[11px] font-bold"
                    style={{ backgroundColor: theme.primaryAccent }}
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            )}

            {/* Session Metadata */}
            <div className="space-y-2.5 text-xs text-white/90">
              <div className="flex items-center justify-between">
                <span className="opacity-70">Utilisateur :</span>
                <span className="font-bold font-mono">{sessionInfo.user}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="opacity-70">Agence :</span>
                <span className="font-semibold truncate max-w-[150px]">{sessionInfo.agency}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="opacity-70">Journée :</span>
                <span className="font-mono font-bold">{sessionInfo.date}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="opacity-70">Caisse :</span>
                <span className="font-mono">{sessionInfo.cashier}</span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-white/10">
                <span className="opacity-70">Solde Caisse :</span>
                <span className="font-mono font-black text-amber-300">{sessionInfo.balance}</span>
              </div>
            </div>
          </div>

          {/* Footer branding & compliance */}
          <div className="text-[11px] opacity-75 border-t border-white/10 pt-3 space-y-0.5">
            <div>Plateforme : <strong>Core Banking Coopératif</strong></div>
            <div>Réglementation : <strong>BCEAO / SYSCOA-SFD</strong></div>
          </div>
        </div>

        {/* Right Main Working Canvas */}
        <div 
          className="flex-1 relative p-8 flex items-center justify-center overflow-auto transition-colors"
          style={{ backgroundColor: theme.canvasBg }}
        >
          {/* Subtle Angled Background Graphic with Customizable Theme Ribbons */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <polygon points="0,0 60,0 40,45 0,45" fill={theme.canvasRibbon1} />
              <polygon points="0,55 55,55 35,100 0,100" fill={theme.canvasRibbon2} />
            </svg>
          </div>

          {/* Grid of Large Functional Action Tiles - Full Canvas Coverage */}
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-7xl px-6">
            {modules.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectModule(m.id)}
                className="w-full min-h-[220px] border rounded-xl shadow-sm hover:shadow-md hover:border-slate-400 transition-colors flex flex-col items-center justify-between p-6 group cursor-pointer"
                style={{ 
                  backgroundColor: theme.tileBg,
                  borderColor: theme.tileBorder
                }}
              >
                {/* Top spacer */}
                <div />

                {/* Center Big Icon - Fixed & Clear */}
                <div className="flex items-center justify-center">
                  {renderIcon(m.iconType)}
                </div>

                {/* Title & Description - Fixed */}
                <div className="text-center space-y-1">
                  <span 
                    className="font-extrabold text-lg tracking-wide block"
                    style={{ color: theme.tileTitleColor }}
                  >
                    {m.title}
                  </span>
                  <p className="text-xs text-slate-500 font-medium hidden md:block line-clamp-1">
                    {m.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Theme Customization Modal */}
      <ThemeCustomizerModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={theme}
        onUpdateTheme={handleUpdateTheme}
      />
    </div>
  );
};
