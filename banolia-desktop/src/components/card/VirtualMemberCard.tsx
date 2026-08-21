import React from 'react';
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
  UserCheck
} from 'lucide-react';

interface VirtualMemberCardProps {
  member: Member;
  institutionName?: string;
  onPrint?: () => void;
}

export const VirtualMemberCard: React.FC<VirtualMemberCardProps> = ({
  member,
  institutionName = 'COOPEC',
  onPrint
}) => {
  // Format Card Number from member code
  const codeNum = member.code.replace(/\D/g, '') || '0200225';
  const cardNumber = `4532 •••• ${codeNum.slice(0, 4)} ${codeNum.slice(4) || '9012'}`;
  const expiryDate = '12/29';

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Visual Badge Card Container (ISO/IEC 7810 ID-1 Ratio) */}
      <div className="relative w-full max-w-md mx-auto aspect-[1.586/1] rounded-3xl p-6 shadow-2xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white border border-slate-700/60 flex flex-col justify-between select-none">
        
        {/* Background Security Guilloche Patterns & Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Card Row: Institution Header & NFC Wave */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md">
              <Building2 className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <span className="text-xs font-black tracking-widest uppercase text-white block">
                {institutionName}
              </span>
              <span className="text-[9px] font-semibold text-emerald-400 tracking-wider block uppercase">
                Carte de Sociétaire Officielle
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-slate-400 rotate-90" />
            <span className="text-[10px] font-mono font-bold bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 text-slate-300">
              SMART-PASS
            </span>
          </div>
        </div>

        {/* Middle Row: Gold Contact EMV Chip & QR Code */}
        <div className="relative z-10 flex items-center justify-between my-auto">
          {/* Gold EMV Chip Simulation */}
          <div className="w-12 h-9 rounded-lg bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 border border-amber-300 shadow-inner flex flex-col justify-around p-1">
            <div className="w-full h-px bg-amber-700/50" />
            <div className="w-full h-px bg-amber-700/50" />
            <div className="w-full h-px bg-amber-700/50" />
          </div>

          {/* Member Photo Avatar & Holographic Badge */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Matricule</span>
              <span className="text-xs font-mono font-bold text-slate-200">{member.employeeId || member.manualNumber || 'MAT-001'}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-slate-300 font-bold text-base shadow-md">
              {member.fullName ? member.fullName.split(' ').map(n => n[0]).slice(0, 2).join('') : 'SO'}
            </div>
          </div>
        </div>

        {/* Bottom Row: Member Info, Card Number, Expiry */}
        <div className="relative z-10 space-y-2">
          {/* Card Number */}
          <div className="font-mono text-sm tracking-widest font-bold text-slate-100 drop-shadow">
            {cardNumber}
          </div>

          <div className="flex items-end justify-between border-t border-slate-800/80 pt-2">
            <div>
              <span className="text-[8px] uppercase tracking-wider text-slate-400 block">Titulaire du Compte</span>
              <span className="text-xs font-bold text-white tracking-wide uppercase block truncate max-w-[200px]">
                {member.fullName || 'NOM ADHÉRENT'}
              </span>
              <span className="text-[9px] font-mono text-emerald-400 block">
                Code : {member.code}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[8px] uppercase tracking-wider text-slate-400 block">Expire Fin</span>
              <span className="text-xs font-mono font-bold text-slate-200 block">{expiryDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar: Print Badge */}
      <div className="flex items-center justify-center gap-3 print:hidden">
        <button
          type="button"
          onClick={onPrint || (() => window.print())}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <Printer className="w-4 h-4 text-emerald-400" />
          <span>Imprimer la Carte Virtuelle (Format Badge A4 / PVC)</span>
        </button>
      </div>
    </div>
  );
};
