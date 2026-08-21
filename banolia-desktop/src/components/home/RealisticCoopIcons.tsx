import React from 'react';

// 1. Inscription : Bloc-notes bleu métallisé avec feuille de formulaire et stylo à bille
export const RealisticInscriptionIcon: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      {/* Background shadow */}
      <filter id="insShadow" x="-10%" y="-10%" width="130%" height="130%" filterUnits="userSpaceOnUse">
        <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.25" />
      </filter>
      {/* Gradients */}
      <linearGradient id="padGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
      <linearGradient id="padBackGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="penBodyGrad" x1="0" y1="0" x2="10" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>
      <linearGradient id="metalGrad" x1="0" y1="0" x2="10" y2="10" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
    </defs>

    {/* Back blue folder */}
    <rect x="22" y="10" width="70" height="92" rx="8" fill="url(#padBackGrad)" filter="url(#insShadow)" />
    
    {/* Front paper pad */}
    <rect x="14" y="18" width="68" height="88" rx="6" fill="url(#padGrad)" filter="url(#insShadow)" />
    <rect x="15" y="19" width="66" height="86" rx="5" stroke="#e2e8f0" strokeWidth="1" />

    {/* Top binder strip */}
    <rect x="14" y="18" width="68" height="12" rx="4" fill="#334155" />
    <circle cx="25" cy="24" r="2" fill="#94a3b8" />
    <circle cx="48" cy="24" r="2" fill="#94a3b8" />
    <circle cx="70" cy="24" r="2" fill="#94a3b8" />

    {/* Cooperative Logo stamp on document */}
    <circle cx="32" cy="42" r="8" fill="#15803d" opacity="0.15" />
    <path d="M28 42C28 39.8 29.8 38 32 38C34.2 38 36 39.8 36 42" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />

    {/* Form Text Lines */}
    <rect x="44" y="38" width="30" height="3" rx="1.5" fill="#1e293b" />
    <rect x="44" y="44" width="22" height="2" rx="1" fill="#64748b" />
    
    {/* Form Row lines */}
    <rect x="22" y="55" width="52" height="2" rx="1" fill="#3b82f6" opacity="0.7" />
    <rect x="22" y="62" width="45" height="2" rx="1" fill="#94a3b8" />
    <rect x="22" y="69" width="52" height="2" rx="1" fill="#94a3b8" />
    <rect x="22" y="76" width="40" height="2" rx="1" fill="#94a3b8" />
    <rect x="22" y="83" width="48" height="2" rx="1" fill="#94a3b8" />
    <rect x="22" y="90" width="35" height="2" rx="1" fill="#15803d" opacity="0.8" />

    {/* Checkmark Stamp */}
    <circle cx="68" cy="85" r="7" fill="#22c55e" />
    <path d="M65 85L67 87L72 82" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

    {/* Blue Ballpoint Pen (Tilted across the pad) */}
    <g transform="translate(68, 25) rotate(25)" filter="url(#insShadow)">
      {/* Pen Body */}
      <rect x="6" y="10" width="8" height="65" rx="3" fill="url(#penBodyGrad)" />
      {/* Pen Tip Metal */}
      <polygon points="6,75 14,75 10,88" fill="url(#metalGrad)" />
      <circle cx="10" cy="88" r="1" fill="#0f172a" />
      {/* Pen Clip & Top */}
      <rect x="6" y="8" width="8" height="4" fill="url(#metalGrad)" />
      <path d="M12 10V28C12 30 14 30 14 28V10" fill="url(#metalGrad)" />
      {/* Grip lines */}
      <line x1="6" y1="62" x2="14" y2="62" stroke="#0284c7" strokeWidth="1" />
      <line x1="6" y1="65" x2="14" y2="65" stroke="#0284c7" strokeWidth="1" />
      <line x1="6" y1="68" x2="14" y2="68" stroke="#0284c7" strokeWidth="1" />
    </g>
  </svg>
);

// 2. Projet : Sac de pièces d'or, liasses de billets CFA et lingot d'or
export const RealisticProjetIcon: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="prjShadow" x="-10%" y="-10%" width="130%" height="130%" filterUnits="userSpaceOnUse">
        <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.25" />
      </filter>
      <radialGradient id="bagGrad" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="30%" stopColor="#eab308" />
        <stop offset="85%" stopColor="#a16207" />
        <stop offset="100%" stopColor="#713f12" />
      </radialGradient>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="40%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id="billGrad" x1="0" y1="0" x2="100" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#86efac" />
        <stop offset="50%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#15803d" />
      </linearGradient>
    </defs>

    {/* Stacks of Banknotes (Background) */}
    <g filter="url(#prjShadow)">
      {/* Bill stack 1 */}
      <rect x="65" y="48" width="40" height="20" rx="3" transform="rotate(12 65 48)" fill="url(#billGrad)" stroke="#14532d" strokeWidth="0.8" />
      <rect x="67" y="52" width="38" height="20" rx="3" transform="rotate(15 67 52)" fill="url(#billGrad)" stroke="#14532d" strokeWidth="0.8" />
      <rect x="69" y="56" width="38" height="20" rx="3" transform="rotate(18 69 56)" fill="url(#billGrad)" stroke="#14532d" strokeWidth="0.8" />
      <circle cx="90" cy="70" r="4" fill="#dcfce7" opacity="0.6" />
    </g>

    {/* Big Burlap Money Sack */}
    <g filter="url(#prjShadow)">
      {/* Tied top neck */}
      <path d="M50 32C46 22 40 18 36 20C32 22 34 28 42 34C44 35 48 36 52 35C58 34 68 30 68 22C68 16 60 18 54 32" fill="url(#bagGrad)" />
      {/* Red tie string */}
      <ellipse cx="50" cy="35" rx="8" ry="3" fill="#dc2626" />
      <path d="M46 36C44 42 42 46 41 48" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
      <path d="M50 36C52 42 54 47 55 49" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
      
      {/* Main Sack Belly */}
      <path d="M22 68C20 88 32 102 52 102C72 102 84 88 82 68C80 50 70 38 52 38C34 38 24 50 22 68Z" fill="url(#bagGrad)" />
      
      {/* Dollar / CFA sign embroidered */}
      <circle cx="52" cy="70" r="14" fill="#713f12" opacity="0.25" />
      <text x="52" y="77" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="900" textAnchor="middle" fill="#713f12" opacity="0.85">F</text>
    </g>

    {/* Gold Ingot / Bar in Foreground */}
    <g filter="url(#prjShadow)">
      <polygon points="72,82 102,78 108,92 78,98" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="0.8" />
      <polygon points="72,82 78,74 105,71 102,78" fill="#fef08a" />
      <polygon points="105,71 110,84 108,92 102,78" fill="#b45309" />
    </g>

    {/* Scattered Gold Coins around base */}
    <ellipse cx="20" cy="98" rx="8" ry="4" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="0.8" />
    <ellipse cx="28" cy="102" rx="8" ry="4" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="0.8" />
    <ellipse cx="38" cy="104" rx="8" ry="4" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="0.8" />
    <ellipse cx="64" cy="103" rx="8" ry="4" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="0.8" />
    <ellipse cx="76" cy="101" rx="8" ry="4" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="0.8" />
  </svg>
);

// 3. Epargne : Coffre-fort en bois précieux avec ferrures dorées et fente à pièces
export const RealisticEpargneIcon: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="boxShadow" x="-10%" y="-10%" width="130%" height="130%" filterUnits="userSpaceOnUse">
        <feDropShadow dx="2" dy="5" stdDeviation="4" floodOpacity="0.3" />
      </filter>
      <linearGradient id="woodFront" x1="0" y1="0" x2="0" y2="100">
        <stop offset="0%" stopColor="#78350f" />
        <stop offset="40%" stopColor="#581c87" />
        <stop offset="50%" stopColor="#451a03" />
        <stop offset="100%" stopColor="#290e02" />
      </linearGradient>
      <linearGradient id="woodTop" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#9a3412" />
        <stop offset="100%" stopColor="#431407" />
      </linearGradient>
      <linearGradient id="brassGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="45%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#854d0e" />
      </linearGradient>
    </defs>

    <g filter="url(#boxShadow)">
      {/* Chest Base Front */}
      <polygon points="20,48 100,48 94,100 26,100" fill="url(#woodFront)" stroke="#1c0a00" strokeWidth="1.5" />

      {/* Chest Top Lid */}
      <polygon points="20,48 35,20 105,20 100,48" fill="url(#woodTop)" stroke="#1c0a00" strokeWidth="1.5" />

      {/* Wood grain highlight lines */}
      <line x1="28" y1="60" x2="92" y2="60" stroke="#9a3412" strokeWidth="0.8" opacity="0.4" />
      <line x1="27" y1="75" x2="93" y2="75" stroke="#9a3412" strokeWidth="0.8" opacity="0.4" />
      <line x1="26" y1="88" x2="94" y2="88" stroke="#9a3412" strokeWidth="0.8" opacity="0.4" />

      {/* Top Coin Slot */}
      <ellipse cx="65" cy="32" rx="20" ry="4" fill="#1c0a00" stroke="url(#brassGrad)" strokeWidth="2" />

      {/* Gold Coin entering slot */}
      <ellipse cx="65" cy="24" rx="10" ry="3.5" fill="url(#brassGrad)" stroke="#78350f" strokeWidth="1" />
      <path d="M55 24V28C55 30 75 30 75 28V24" fill="url(#brassGrad)" />

      {/* Brass Corner Brackets Left */}
      <polygon points="20,48 28,48 28,56 24,56 24,100 26,100 20,48" fill="url(#brassGrad)" />
      <circle cx="25" cy="52" r="1.5" fill="#451a03" />
      <circle cx="25" cy="75" r="1.5" fill="#451a03" />
      <circle cx="25" cy="95" r="1.5" fill="#451a03" />

      {/* Brass Corner Brackets Right */}
      <polygon points="100,48 92,48 92,56 96,56 94,100 94,100 100,48" fill="url(#brassGrad)" />
      <circle cx="95" cy="52" r="1.5" fill="#451a03" />
      <circle cx="95" cy="75" r="1.5" fill="#451a03" />
      <circle cx="94" cy="95" r="1.5" fill="#451a03" />

      {/* Brass Center Plate with Keyhole & "BANK" */}
      <rect x="50" y="58" width="20" height="24" rx="3" fill="url(#brassGrad)" stroke="#451a03" strokeWidth="1" />
      <circle cx="60" cy="66" r="3" fill="#1c0a00" />
      <polygon points="59,66 61,66 62,74 58,74" fill="#1c0a00" />

      {/* Plate Rivets */}
      <circle cx="53" cy="61" r="1" fill="#451a03" />
      <circle cx="67" cy="61" r="1" fill="#451a03" />
      <circle cx="53" cy="79" r="1" fill="#451a03" />
      <circle cx="67" cy="79" r="1" fill="#451a03" />

      {/* "EPARGNE" text embossed */}
      <text x="60" y="92" fontFamily="Arial, sans-serif" fontSize="6.5" fontWeight="900" textAnchor="middle" fill="url(#brassGrad)" letterSpacing="1">EPARGNE</text>
    </g>
  </svg>
);

// 4. Comptabilite : Bilan financier avec graphiques colorés, calculatrice de précision et crayon
export const RealisticComptabiliteIcon: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="cptShadow" x="-10%" y="-10%" width="130%" height="130%" filterUnits="userSpaceOnUse">
        <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.25" />
      </filter>
      <linearGradient id="calcBody" x1="0" y1="0" x2="0" y2="100">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
    </defs>

    {/* Financial Chart Document (Background) */}
    <g filter="url(#cptShadow)">
      <rect x="25" y="12" width="70" height="90" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
      {/* Document Header */}
      <rect x="32" y="20" width="30" height="3" rx="1.5" fill="#0f172a" />
      <rect x="32" y="26" width="20" height="2" rx="1" fill="#94a3b8" />
      
      {/* Pie Chart */}
      <circle cx="76" cy="28" r="10" fill="#e2e8f0" />
      <path d="M76 28 L76 18 A10 10 0 0 1 86 28 Z" fill="#ef4444" />
      <path d="M76 28 L86 28 A10 10 0 0 1 73 38 Z" fill="#3b82f6" />
      <path d="M76 28 L73 38 A10 10 0 0 1 76 18 Z" fill="#22c55e" />

      {/* Bar Chart */}
      <rect x="32" y="44" width="6" height="24" rx="1" fill="#3b82f6" />
      <rect x="42" y="38" width="6" height="30" rx="1" fill="#22c55e" />
      <rect x="52" y="48" width="6" height="20" rx="1" fill="#f59e0b" />
      <rect x="62" y="34" width="6" height="34" rx="1" fill="#6366f1" />
      <rect x="72" y="40" width="6" height="28" rx="1" fill="#ec4899" />
      <line x1="30" y1="70" x2="82" y2="70" stroke="#94a3b8" strokeWidth="1" />
    </g>

    {/* Pocket Calculator (Foreground Right) */}
    <g transform="translate(56, 46)" filter="url(#cptShadow)">
      <rect x="0" y="0" width="46" height="62" rx="6" fill="url(#calcBody)" stroke="#0f172a" strokeWidth="1.5" />
      {/* LCD Screen */}
      <rect x="5" y="6" width="36" height="12" rx="2" fill="#86efac" stroke="#15803d" strokeWidth="0.8" />
      <text x="38" y="16" fontFamily="monospace" fontSize="8" fontWeight="bold" fill="#064e3b" textAnchor="end">8 450 000</text>

      {/* Keypad Buttons */}
      <rect x="6" y="22" width="7" height="6" rx="1.5" fill="#64748b" />
      <rect x="15" y="22" width="7" height="6" rx="1.5" fill="#64748b" />
      <rect x="24" y="22" width="7" height="6" rx="1.5" fill="#64748b" />
      <rect x="33" y="22" width="7" height="6" rx="1.5" fill="#f97316" />

      <rect x="6" y="31" width="7" height="6" rx="1.5" fill="#94a3b8" />
      <rect x="15" y="31" width="7" height="6" rx="1.5" fill="#94a3b8" />
      <rect x="24" y="31" width="7" height="6" rx="1.5" fill="#94a3b8" />
      <rect x="33" y="31" width="7" height="6" rx="1.5" fill="#3b82f6" />

      <rect x="6" y="40" width="7" height="6" rx="1.5" fill="#94a3b8" />
      <rect x="15" y="40" width="7" height="6" rx="1.5" fill="#94a3b8" />
      <rect x="24" y="40" width="7" height="6" rx="1.5" fill="#94a3b8" />
      <rect x="33" y="40" width="7" height="15" rx="1.5" fill="#22c55e" />

      <rect x="6" y="49" width="16" height="6" rx="1.5" fill="#94a3b8" />
      <rect x="24" y="49" width="7" height="6" rx="1.5" fill="#94a3b8" />
    </g>

    {/* Red Accountant Pencil (Tilted Left) */}
    <g transform="translate(10, 60) rotate(-40)" filter="url(#cptShadow)">
      <polygon points="0,5 60,5 60,11 0,11" fill="#ef4444" />
      <polygon points="60,5 70,8 60,11" fill="#fed7aa" />
      <polygon points="68,7 70,8 68,9" fill="#0f172a" />
      <rect x="-8" y="5" width="8" height="6" rx="2" fill="#ec4899" />
      <rect x="-2" y="5" width="2" height="6" fill="#cbd5e1" />
    </g>

    {/* Gold Coins stack at base */}
    <ellipse cx="26" cy="100" rx="8" ry="3" fill="#fbbf24" stroke="#b45309" />
    <ellipse cx="26" cy="96" rx="8" ry="3" fill="#fbbf24" stroke="#b45309" />
    <ellipse cx="26" cy="92" rx="8" ry="3" fill="#fef08a" stroke="#b45309" />
  </svg>
);

// 5. Caisse : Caisse enregistreuse de guichet avec ticket thermique et tiroir-caisse
export const RealisticCaisseIcon: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="caisseShadow" x="-10%" y="-10%" width="130%" height="130%" filterUnits="userSpaceOnUse">
        <feDropShadow dx="2" dy="5" stdDeviation="4" floodOpacity="0.3" />
      </filter>
      <linearGradient id="posBody" x1="0" y1="0" x2="0" y2="100">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
      <linearGradient id="posDrawer" x1="0" y1="0" x2="0" y2="100">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
    </defs>

    <g filter="url(#caisseShadow)">
      {/* Cash Drawer Bottom Base */}
      <rect x="15" y="78" width="90" height="26" rx="4" fill="url(#posDrawer)" stroke="#0f172a" strokeWidth="1.5" />
      {/* Keyhole on drawer */}
      <circle cx="60" cy="91" r="2.5" fill="#f8fafc" />
      <line x1="60" y1="91" x2="60" y2="96" stroke="#f8fafc" strokeWidth="1.5" />
      <line x1="20" y1="84" x2="100" y2="84" stroke="#334155" strokeWidth="1" />

      {/* Main Terminal Housing */}
      <polygon points="26,78 94,78 86,40 34,40" fill="url(#posBody)" stroke="#94a3b8" strokeWidth="1.5" />

      {/* Cashier Screen Tower Left */}
      <rect x="58" y="24" width="30" height="24" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
      <rect x="61" y="27" width="24" height="18" rx="2" fill="#22c55e" />
      <text x="73" y="39" fontFamily="monospace" fontSize="7" fontWeight="black" fill="#052e16" textAnchor="middle">0.00 F</text>

      {/* Thermal Printer Tower Right with Ticket Output */}
      <rect x="30" y="28" width="24" height="18" rx="3" fill="#334155" />
      <rect x="34" y="26" width="16" height="3" fill="#0f172a" />
      
      {/* Printed Receipt Paper coming out */}
      <path d="M34 26 L34 8 L37 11 L40 8 L43 11 L46 8 L49 11 L50 8 L50 26 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
      <line x1="36" y1="14" x2="48" y2="14" stroke="#94a3b8" strokeWidth="0.8" />
      <line x1="36" y1="18" x2="48" y2="18" stroke="#94a3b8" strokeWidth="0.8" />
      <line x1="36" y1="22" x2="44" y2="22" stroke="#15803d" strokeWidth="0.8" />

      {/* Keypad on the sloped front */}
      <g transform="translate(32, 48)">
        <rect x="0" y="0" width="56" height="24" rx="2" fill="#e2e8f0" />
        {/* Buttons Grid */}
        <circle cx="8" cy="6" r="2.5" fill="#3b82f6" />
        <circle cx="16" cy="6" r="2.5" fill="#64748b" />
        <circle cx="24" cy="6" r="2.5" fill="#64748b" />
        <circle cx="32" cy="6" r="2.5" fill="#64748b" />
        <circle cx="40" cy="6" r="2.5" fill="#ef4444" />
        <circle cx="48" cy="6" r="2.5" fill="#22c55e" />

        <circle cx="8" cy="14" r="2.5" fill="#94a3b8" />
        <circle cx="16" cy="14" r="2.5" fill="#94a3b8" />
        <circle cx="24" cy="14" r="2.5" fill="#94a3b8" />
        <circle cx="32" cy="14" r="2.5" fill="#94a3b8" />
        <rect x="38" y="11" width="12" height="6" rx="2" fill="#22c55e" />
      </g>
    </g>
  </svg>
);

// 6. Credit : Sac de crédit scellé de cire rouge avec colonnes de pièces d'or
export const RealisticCreditIcon: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="crdShadow" x="-10%" y="-10%" width="130%" height="130%" filterUnits="userSpaceOnUse">
        <feDropShadow dx="2" dy="5" stdDeviation="4" floodOpacity="0.28" />
      </filter>
      <radialGradient id="sackGrad" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="35%" stopColor="#d97706" />
        <stop offset="90%" stopColor="#92400e" />
        <stop offset="100%" stopColor="#451a03" />
      </radialGradient>
      <linearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="40%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>

    {/* Gold Coin Stack Left */}
    <g filter="url(#crdShadow)">
      <ellipse cx="26" cy="88" rx="10" ry="4" fill="url(#coinGrad)" stroke="#78350f" strokeWidth="0.8" />
      <ellipse cx="26" cy="83" rx="10" ry="4" fill="url(#coinGrad)" stroke="#78350f" strokeWidth="0.8" />
      <ellipse cx="26" cy="78" rx="10" ry="4" fill="url(#coinGrad)" stroke="#78350f" strokeWidth="0.8" />
      <ellipse cx="26" cy="73" rx="10" ry="4" fill="url(#coinGrad)" stroke="#78350f" strokeWidth="0.8" />
      <ellipse cx="26" cy="68" rx="10" ry="4" fill="url(#coinGrad)" stroke="#78350f" strokeWidth="0.8" />
      <ellipse cx="26" cy="63" rx="10" ry="4" fill="url(#coinGrad)" stroke="#78350f" strokeWidth="0.8" />
    </g>

    {/* Gold Coin Stack Right */}
    <g filter="url(#crdShadow)">
      <ellipse cx="94" cy="90" rx="10" ry="4" fill="url(#coinGrad)" stroke="#78350f" strokeWidth="0.8" />
      <ellipse cx="94" cy="85" rx="10" ry="4" fill="url(#coinGrad)" stroke="#78350f" strokeWidth="0.8" />
      <ellipse cx="94" cy="80" rx="10" ry="4" fill="url(#coinGrad)" stroke="#78350f" strokeWidth="0.8" />
      <ellipse cx="94" cy="75" rx="10" ry="4" fill="url(#coinGrad)" stroke="#78350f" strokeWidth="0.8" />
      <ellipse cx="94" cy="70" rx="10" ry="4" fill="url(#coinGrad)" stroke="#78350f" strokeWidth="0.8" />
    </g>

    {/* Central Sealed Credit Money Sack */}
    <g filter="url(#crdShadow)">
      {/* Top ruffle */}
      <path d="M52 28C46 16 38 14 36 18C34 22 42 28 50 30C54 31 64 30 68 24C70 18 64 16 58 28" fill="url(#sackGrad)" />
      
      {/* Main Sack Belly */}
      <path d="M28 66C26 86 38 100 60 100C82 100 94 86 92 66C90 46 80 34 60 34C40 34 30 46 28 66Z" fill="url(#sackGrad)" />

      {/* Red Wax Seal */}
      <circle cx="60" cy="42" r="9" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
      <circle cx="60" cy="42" r="6" fill="#ef4444" />
      <text x="60" y="45" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#7f1d1d">★</text>

      {/* Seal Ribbon Hanging Down */}
      <polygon points="56,48 53,64 57,60 61,64 58,48" fill="#dc2626" />

      {/* Credit Text / Crest on Bag */}
      <path d="M48 64C48 58 72 58 72 64C72 74 48 74 48 84C48 90 72 90 72 84" stroke="#451a03" strokeWidth="3.5" strokeLinecap="round" opacity="0.6" />
    </g>
  </svg>
);

// 7. Societaires : Groupe tridimensionnel d'adhérents et sociétaires
export const RealisticSocietairesIcon: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="socShadow" x="-10%" y="-10%" width="130%" height="130%" filterUnits="userSpaceOnUse">
        <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.25" />
      </filter>
      <linearGradient id="suitGrad" x1="0" y1="0" x2="0" y2="100">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="100">
        <stop offset="0%" stopColor="#fed7aa" />
        <stop offset="100%" stopColor="#fba36e" />
      </linearGradient>
      <linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="100">
        <stop offset="0%" stopColor="#78350f" />
        <stop offset="100%" stopColor="#290e02" />
      </linearGradient>
    </defs>

    {/* Background Left Member (Woman in orange/rose blouse) */}
    <g transform="translate(14, 28)" filter="url(#socShadow)">
      <circle cx="20" cy="18" r="12" fill="url(#skinGrad)" />
      {/* Hair */}
      <path d="M8 18C8 8 32 8 32 18C32 26 30 30 20 30C10 30 8 26 8 18Z" fill="#92400e" />
      <circle cx="20" cy="17" r="10" fill="url(#skinGrad)" />
      {/* Blouse */}
      <path d="M4 52C4 36 36 36 36 52Z" fill="#f97316" />
    </g>

    {/* Background Right Member (Woman in purple blouse) */}
    <g transform="translate(66, 28)" filter="url(#socShadow)">
      <circle cx="20" cy="18" r="12" fill="url(#skinGrad)" />
      {/* Hair */}
      <path d="M6 18C6 6 34 6 34 18C34 26 30 30 20 30C10 30 6 26 6 18Z" fill="#713f12" />
      <circle cx="20" cy="17" r="10" fill="url(#skinGrad)" />
      {/* Blouse */}
      <path d="M4 52C4 36 36 36 36 52Z" fill="#a855f7" />
    </g>

    {/* Foreground Center Member (Executive in suit & tie) */}
    <g transform="translate(36, 22)" filter="url(#socShadow)">
      {/* Head & Neck */}
      <circle cx="24" cy="22" r="15" fill="url(#skinGrad)" />
      {/* Hair */}
      <path d="M9 18C9 8 39 8 39 18C39 12 33 6 24 6C15 6 9 12 9 18Z" fill="url(#hairGrad)" />
      
      {/* Shoulders & Business Suit */}
      <path d="M0 68C0 44 48 44 48 68Z" fill="url(#suitGrad)" />
      {/* White Shirt Collar */}
      <polygon points="24,44 14,56 34,56" fill="#ffffff" />
      {/* Green/Gold Tie */}
      <polygon points="22,46 26,46 28,68 24,72 20,68" fill="#15803d" />
    </g>

    {/* Green Cooperative Member Badge Shield */}
    <g transform="translate(48, 86)" filter="url(#socShadow)">
      <circle cx="12" cy="12" r="11" fill="#15803d" stroke="#ffffff" strokeWidth="1.5" />
      <path d="M8 12L11 15L16 9" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

// 8. Prelevements : Tour d'entreprise moderne avec bordereaux de paie DRH
export const RealisticPrelevementsIcon: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="prvShadow" x="-10%" y="-10%" width="130%" height="130%" filterUnits="userSpaceOnUse">
        <feDropShadow dx="2" dy="5" stdDeviation="4" floodOpacity="0.25" />
      </filter>
      <linearGradient id="towerGrad" x1="0" y1="0" x2="60" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="40%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="backTowerGrad" x1="0" y1="0" x2="40" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#64748b" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
    </defs>

    {/* Background Secondary Office Tower */}
    <g filter="url(#prvShadow)">
      <polygon points="62,18 96,18 96,96 62,96" fill="url(#backTowerGrad)" stroke="#0f172a" strokeWidth="1" />
      {/* Grid Windows */}
      <rect x="68" y="26" width="6" height="8" rx="1" fill="#fef08a" opacity="0.8" />
      <rect x="78" y="26" width="6" height="8" rx="1" fill="#94a3b8" />
      <rect x="88" y="26" width="4" height="8" rx="1" fill="#fef08a" opacity="0.8" />

      <rect x="68" y="38" width="6" height="8" rx="1" fill="#94a3b8" />
      <rect x="78" y="38" width="6" height="8" rx="1" fill="#fef08a" opacity="0.8" />
      <rect x="88" y="38" width="4" height="8" rx="1" fill="#94a3b8" />

      <rect x="68" y="50" width="6" height="8" rx="1" fill="#fef08a" opacity="0.8" />
      <rect x="78" y="50" width="6" height="8" rx="1" fill="#94a3b8" />
      <rect x="88" y="50" width="4" height="8" rx="1" fill="#fef08a" opacity="0.8" />
    </g>

    {/* Main Glass Skyscraper (Headquarters) */}
    <g filter="url(#prvShadow)">
      <polygon points="20,30 64,12 64,100 20,100" fill="url(#towerGrad)" stroke="#0f172a" strokeWidth="1.5" />
      
      {/* Glass facade grid lines */}
      <line x1="32" y1="25" x2="32" y2="100" stroke="#bae6fd" strokeWidth="0.8" opacity="0.6" />
      <line x1="44" y1="20" x2="44" y2="100" stroke="#bae6fd" strokeWidth="0.8" opacity="0.6" />
      <line x1="56" y1="15" x2="56" y2="100" stroke="#bae6fd" strokeWidth="0.8" opacity="0.6" />

      {/* Horizontal floor dividers */}
      <line x1="20" y1="38" x2="64" y2="28" stroke="#0284c7" strokeWidth="1" />
      <line x1="20" y1="50" x2="64" y2="40" stroke="#0284c7" strokeWidth="1" />
      <line x1="20" y1="62" x2="64" y2="52" stroke="#0284c7" strokeWidth="1" />
      <line x1="20" y1="74" x2="64" y2="64" stroke="#0284c7" strokeWidth="1" />
      <line x1="20" y1="86" x2="64" y2="76" stroke="#0284c7" strokeWidth="1" />
    </g>

    {/* DRH Payroll Check-off Document in Foreground */}
    <g transform="translate(48, 52)" filter="url(#prvShadow)">
      <rect x="0" y="0" width="48" height="46" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
      {/* Document header */}
      <rect x="5" y="6" width="22" height="3" rx="1" fill="#15803d" />
      <rect x="5" y="11" width="16" height="2" rx="1" fill="#94a3b8" />

      {/* Table rows of salary deduction */}
      <rect x="5" y="17" width="38" height="2" rx="1" fill="#3b82f6" />
      <rect x="5" y="22" width="38" height="2" rx="1" fill="#e2e8f0" />
      <rect x="5" y="27" width="38" height="2" rx="1" fill="#e2e8f0" />
      <rect x="5" y="32" width="38" height="2" rx="1" fill="#e2e8f0" />

      {/* Success stamp badge */}
      <circle cx="36" cy="34" r="8" fill="#22c55e" stroke="#ffffff" strokeWidth="1" />
      <path d="M33 34L35 36L40 31" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);
