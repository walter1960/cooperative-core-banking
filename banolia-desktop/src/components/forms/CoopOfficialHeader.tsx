import React, { useState, useEffect } from 'react';

export interface BankAccountItem {
  id: string;
  bankName: string;
  accountNumber: string;
}

export interface HeaderConfig {
  mode: 'custom_fields' | 'banner_image';
  bannerImageUrl: string;
  logoUrl: string;
  institutionName: string;
  institutionSubtitle: string;
  legalMentions: string;
  bankAccounts: BankAccountItem[];
  referenceSuffix: string;
  motto: string;
  treasurerName: string;
  pcaName: string;
  managerName: string;
  creditCommitteePresidentName: string;
}

export const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  mode: 'custom_fields',
  bannerImageUrl: '/coopectat_header_banner.png',
  logoUrl: '/copectat_logo.png',
  institutionName: 'COOPECTAT',
  institutionSubtitle: "Coopérative d'Épargne et de Crédits des Travailleurs de l'ASECNA TOGO – Lomé",
  legalMentions: "Agrément N° 130/MEFP/SG/CAS-IMEC, T/1/GFLM/2001/0088 A BP 10151 – Tél. 22–26–21–01 Email : coopectat@yahoo.fr",
  bankAccounts: [
    { id: '1', bankName: 'Compte UTB N°', accountNumber: '01031– 30849900800–25' },
    { id: '2', bankName: 'Compte DIAMOND BANK N°', accountNumber: '0440401383105764018' }
  ],
  referenceSuffix: '/COOPECTAT/CA/',
  motto: 'ENSEMBLE NOUS SOMMES FORTS',
  treasurerName: 'ANKRAH Adoté A-Sting',
  pcaName: 'PCA COOPECTAT',
  managerName: 'La Gérante',
  creditCommitteePresidentName: 'Le Président CC'
};

export const getStoredHeaderConfig = (): HeaderConfig => {
  try {
    const mode = (localStorage.getItem('coop_header_mode') as any) || DEFAULT_HEADER_CONFIG.mode;
    const bannerImageUrl = localStorage.getItem('coop_header_banner') || DEFAULT_HEADER_CONFIG.bannerImageUrl;
    const logoUrl = localStorage.getItem('coop_institution_logo') || DEFAULT_HEADER_CONFIG.logoUrl;
    const institutionName = localStorage.getItem('coop_institution_name') || DEFAULT_HEADER_CONFIG.institutionName;
    const institutionSubtitle = localStorage.getItem('coop_institution_sub') || DEFAULT_HEADER_CONFIG.institutionSubtitle;
    const legalMentions = localStorage.getItem('coop_legal_mentions') || DEFAULT_HEADER_CONFIG.legalMentions;
    const referenceSuffix = localStorage.getItem('coop_reference_format') || DEFAULT_HEADER_CONFIG.referenceSuffix;
    const motto = localStorage.getItem('coop_motto') || DEFAULT_HEADER_CONFIG.motto;
    const treasurerName = localStorage.getItem('coop_treasurer_name') || DEFAULT_HEADER_CONFIG.treasurerName;
    const pcaName = localStorage.getItem('coop_pca_name') || DEFAULT_HEADER_CONFIG.pcaName;
    const managerName = localStorage.getItem('coop_manager_name') || DEFAULT_HEADER_CONFIG.managerName;
    const creditCommitteePresidentName = localStorage.getItem('coop_cc_president_name') || DEFAULT_HEADER_CONFIG.creditCommitteePresidentName;
    
    let bankAccounts = DEFAULT_HEADER_CONFIG.bankAccounts;
    const storedAccounts = localStorage.getItem('coop_bank_accounts');
    if (storedAccounts) {
      bankAccounts = JSON.parse(storedAccounts);
    }

    return {
      mode,
      bannerImageUrl,
      logoUrl,
      institutionName,
      institutionSubtitle,
      legalMentions,
      bankAccounts,
      referenceSuffix,
      motto,
      treasurerName,
      pcaName,
      managerName,
      creditCommitteePresidentName
    };
  } catch (_) {
    return DEFAULT_HEADER_CONFIG;
  }
};

interface CoopOfficialHeaderProps {
  documentNumber?: string;
  onDocumentNumberChange?: (val: string) => void;
  showReference?: boolean;
  className?: string;
  overrideConfig?: Partial<HeaderConfig>;
}

export const CoopOfficialHeader: React.FC<CoopOfficialHeaderProps> = ({
  documentNumber = '2026/042',
  onDocumentNumberChange,
  showReference = true,
  className = '',
  overrideConfig
}) => {
  const [baseConfig, setBaseConfig] = useState<HeaderConfig>(getStoredHeaderConfig);

  useEffect(() => {
    const handleUpdate = () => {
      setBaseConfig(getStoredHeaderConfig());
    };
    window.addEventListener('coop_settings_updated', handleUpdate);
    return () => window.removeEventListener('coop_settings_updated', handleUpdate);
  }, []);

  const config: HeaderConfig = {
    ...baseConfig,
    ...(overrideConfig || {})
  };

  // -------------------------------------------------------------
  // MODE 1 : IMAGE COMPLÈTE CHARGÉE (JPEG ou PNG)
  // -------------------------------------------------------------
  if (config.mode === 'banner_image' && config.bannerImageUrl) {
    return (
      <div className={`relative border-b-2 border-slate-900 pb-3 mb-4 ${className}`}>
        <img 
          src={config.bannerImageUrl} 
          alt="Bannière d'En-tête Officielle" 
          className="w-full max-h-36 object-contain rounded-sm"
        />
        {showReference && (
          <div className="flex justify-end items-center pt-2 font-mono font-bold text-slate-900 text-xs">
            <span>N° </span>
            {onDocumentNumberChange ? (
              <input 
                type="text" 
                value={documentNumber} 
                onChange={(e) => onDocumentNumberChange(e.target.value)} 
                className="w-20 text-center font-bold font-mono border-b border-dotted border-slate-800 bg-transparent focus:outline-none ml-1 mr-1"
              />
            ) : (
              <span className="border-b border-dotted border-slate-800 px-1 font-bold ml-1 mr-1">
                {documentNumber}
              </span>
            )}
            <span>{config.referenceSuffix}</span>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // MODE 2 : GÉNÉRATEUR STRUCTURÉ (FIDÈLE À LA MAQUETTE / PHOTO)
  // Format : [Ligne verticale | Logo Oval] [Nom + Description + Agrément] [Comptes Bancaires + N° Réf]
  // -------------------------------------------------------------
  return (
    <div className={`border-b-2 border-slate-900 pb-4 mb-4 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        
        {/* Left Section: Logo with subtle left vertical border and padding */}
        <div className="flex items-center gap-3">
          <div className="border-l border-slate-300 pl-2 flex items-center justify-center">
            <img 
              src={config.logoUrl || '/copectat_logo.png'} 
              alt={`${config.institutionName} Logo`} 
              className="w-20 h-16 object-contain"
              onError={(e) => {
                // Fallback to local copectat_logo if customized path is broken
                (e.target as HTMLImageElement).src = '/copectat_logo.png';
              }}
            />
          </div>

          {/* Center-Left Section: Institution Name, Subtitle and Legal Mentions */}
          <div className="max-w-[460px]">
            <h2 className="text-2xl font-black tracking-wider uppercase text-[#0B1E38] font-serif leading-none mb-1">
              {config.institutionName}
            </h2>
            <div className="text-[11px] font-bold text-slate-800 leading-tight">
              {config.institutionSubtitle}
            </div>
            <div className="text-[9px] text-slate-600 font-medium leading-tight mt-1">
              {config.legalMentions}
            </div>
          </div>
        </div>

        {/* Right Section: Bank Accounts & Reference Number */}
        <div className="text-right text-[10px] space-y-0.5 font-medium shrink-0">
          {config.bankAccounts && config.bankAccounts.length > 0 ? (
            config.bankAccounts.map((acc) => (
              <div key={acc.id} className="text-slate-800">
                <span className="font-normal">{acc.bankName} </span>
                <strong className="font-bold text-slate-950">{acc.accountNumber}</strong>
              </div>
            ))
          ) : (
            <>
              <div>Compte UTB N° <strong>01031– 30849900800–25</strong></div>
              <div>Compte DIAMOND BANK N° <strong>0440401383105764018</strong></div>
            </>
          )}

          {showReference && (
            <div className="pt-2 font-mono text-slate-900 text-xs flex items-center justify-end">
              <span className="font-bold mr-1">N°</span>
              {onDocumentNumberChange ? (
                <input 
                  type="text" 
                  value={documentNumber} 
                  onChange={(e) => onDocumentNumberChange(e.target.value)} 
                  className="w-20 text-center font-bold font-mono border-b border-dotted border-slate-800 bg-transparent focus:outline-none"
                />
              ) : (
                <span className="border-b border-dotted border-slate-800 px-1 font-bold">
                  {documentNumber}
                </span>
              )}
              <span className="font-bold ml-1">{config.referenceSuffix}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
