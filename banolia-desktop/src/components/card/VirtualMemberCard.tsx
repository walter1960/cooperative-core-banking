import React, { useState } from 'react';
import { Member } from '../../types';
import { 
  CreditCard, 
  Printer, 
  ShieldCheck, 
  QrCode, 
  Wifi, 
  Sparkles,
  Building2,
  Calendar,
  Phone,
  UserCheck,
  Palette
} from 'lucide-react';

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

interface VirtualMemberCardProps {
  member: Member;
  institutionName?: string;
  onPrint?: () => void;
}

export const VirtualMemberCard: React.FC<VirtualMemberCardProps> = ({
  member,
  institutionName = `${localStorage.getItem('coop_institution_name') || 'COOPECTAT'}${localStorage.getItem('coop_partner_entity') ? ` • ${localStorage.getItem('coop_partner_entity')}` : ''}`,
  onPrint
}) => {
  // Format Card Number from member code
  const codeNum = member.code.replace(/\D/g, '') || '0200225';
  const cardNumber = `2512  1100  ${codeNum.slice(0, 4)}  ${codeNum.slice(4) || '4901'}`;
  const expiryDate = '12/29';

  // Configurable color theme
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

  const activeThm = CARD_THEMES[cardThemeId] || CARD_THEMES.titanium;
  const isCustom = cardThemeId === 'custom';

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Palette de Personnalisation */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between flex-wrap gap-2 print:hidden">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Palette className="w-4 h-4 text-coop-primary" />
          <span>Thème de la Carte :</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {Object.values(CARD_THEMES).map((thm) => (
            <button
              key={thm.id}
              type="button"
              onClick={() => handleThemeSelect(thm.id)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border transition-all ${
                cardThemeId === thm.id
                  ? 'ring-2 ring-coop-primary border-slate-400 bg-white shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-slate-400 inline-block"
                style={{ backgroundColor: thm.previewHex }}
              />
              <span>{thm.name.split(' ')[0]}</span>
            </button>
          ))}

          {/* Libre */}
          <label 
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border cursor-pointer transition-all ${
              cardThemeId === 'custom'
                ? 'ring-2 ring-coop-primary border-slate-400 bg-white shadow-sm'
                : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
            }`}
          >
            <input
              type="color"
              value={customCardColor}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              className="w-2.5 h-2.5 rounded-full border-0 p-0 cursor-pointer overflow-hidden"
            />
            <span>Libre</span>
          </label>
        </div>
      </div>

      {/* Visual Badge Card Container (ISO/IEC 7810 ID-1 Ratio) - Lumineuse & Réaliste */}
      <div 
        style={isCustom ? { backgroundColor: customCardColor } : undefined}
        className={`relative w-full max-w-md mx-auto aspect-[1.586/1] rounded-3xl p-6 shadow-2xl overflow-hidden border-2 flex flex-col justify-between select-none transition-all duration-300 ${
          isCustom ? 'border-slate-300 text-slate-900 shadow-xl' : `${activeThm.bgClass} ${activeThm.cardBorder} ${activeThm.textPrimary}`
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
                {institutionName}
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
                Matricule {localStorage.getItem('coop_partner_entity') ? `(${localStorage.getItem('coop_partner_entity')})` : ''}
              </span>
              <span className="text-xs font-mono font-black bg-white/75 px-2 py-0.5 rounded border border-slate-300/80 shadow-sm">
                {member.employeeId || member.manualNumber || member.code || '130049'}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-sm shadow-md">
              {member.fullName ? member.fullName.split(' ').map(n => n[0]).slice(0, 2).join('') : 'SO'}
            </div>
          </div>
        </div>

        {/* Ligne 3 : Numéro de Carte Embossé */}
        <div className="relative z-10 font-mono text-base sm:text-lg tracking-widest font-black drop-shadow-sm">
          {cardNumber}
        </div>

        {/* Ligne 4 : Titulaire, Expiration */}
        <div className="relative z-10 border-t border-slate-400/30 pt-2 flex items-end justify-between">
          <div>
            <span className="text-[8px] uppercase tracking-wider block font-semibold opacity-75">
              Titulaire du Compte
            </span>
            <span className="text-xs font-black uppercase tracking-wide block truncate max-w-[210px]">
              {member.fullName || 'NOM ADHÉRENT'}
            </span>
            <span className="text-[9px] font-mono block opacity-80 font-bold">
              Compte N° 2512 1100 {member.code} 01
            </span>
          </div>

          <div className="text-right">
            <span className="text-[8px] uppercase tracking-wider block font-semibold opacity-75">
              Expire Fin
            </span>
            <span className="text-xs font-mono font-bold">{expiryDate}</span>
          </div>
        </div>
      </div>

      {/* Action Bar: Print Badge */}
      <div className="flex items-center justify-center gap-3 print:hidden">
        <button
          type="button"
          onClick={onPrint || (() => window.print())}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md"
        >
          <Printer className="w-4 h-4 text-emerald-400" />
          <span>Imprimer la Carte Virtuelle (Format Badge A4 / PVC)</span>
        </button>
      </div>
    </div>
  );
};
