import React from 'react';
import { Palette, RotateCcw, Check, X } from 'lucide-react';
import { ThemeManager } from '../../services/theme/ThemeManager';

export interface CooperativeTheme {
  topBarBg: string;
  topBarText: string;
  sidebarBg: string;
  sidebarText: string;
  primaryAccent: string;
  canvasBg: string;
  canvasRibbon1: string;
  canvasRibbon2: string;
  tileTitleColor: string;
  tileBg: string;
  tileBorder: string;
}

export const defaultTheme: CooperativeTheme = {
  topBarBg: '#29323b',
  topBarText: '#ffffff',
  sidebarBg: '#333d47',
  sidebarText: '#f8fafc',
  primaryAccent: '#15803d', // Forest Green
  canvasBg: '#dcdfe4',
  canvasRibbon1: '#15803d',
  canvasRibbon2: '#29323b',
  tileTitleColor: '#15803d',
  tileBg: '#ffffff',
  tileBorder: '#cbd5e1'
};

export const themePresets: { name: string; theme: CooperativeTheme }[] = [
  {
    name: 'Émeraude & Vert Forêt (Standard)',
    theme: {
      topBarBg: '#29323b',
      topBarText: '#ffffff',
      sidebarBg: '#333d47',
      sidebarText: '#f8fafc',
      primaryAccent: '#15803d',
      canvasBg: '#dcdfe4',
      canvasRibbon1: '#15803d',
      canvasRibbon2: '#29323b',
      tileTitleColor: '#15803d',
      tileBg: '#ffffff',
      tileBorder: '#cbd5e1'
    }
  },
  {
    name: 'Or Ambré & Anthracite Institutionnel',
    theme: {
      topBarBg: '#1e293b',
      topBarText: '#ffffff',
      sidebarBg: '#334155',
      sidebarText: '#f8fafc',
      primaryAccent: '#d97706',
      canvasBg: '#e2e8f0',
      canvasRibbon1: '#d97706',
      canvasRibbon2: '#1e293b',
      tileTitleColor: '#b45309',
      tileBg: '#ffffff',
      tileBorder: '#cbd5e1'
    }
  },
  {
    name: 'Bleu Saphir & Finance Moderne',
    theme: {
      topBarBg: '#0f172a',
      topBarText: '#ffffff',
      sidebarBg: '#1e293b',
      sidebarText: '#f8fafc',
      primaryAccent: '#2563eb',
      canvasBg: '#e0e7ff',
      canvasRibbon1: '#2563eb',
      canvasRibbon2: '#0f172a',
      tileTitleColor: '#1d4ed8',
      tileBg: '#ffffff',
      tileBorder: '#cbd5e1'
    }
  },
  {
    name: 'Pourpre / Rubis & Gris Slate',
    theme: {
      topBarBg: '#27272a',
      topBarText: '#ffffff',
      sidebarBg: '#3f3f46',
      sidebarText: '#f8fafc',
      primaryAccent: '#be123c',
      canvasBg: '#f1f5f9',
      canvasRibbon1: '#be123c',
      canvasRibbon2: '#27272a',
      tileTitleColor: '#be123c',
      tileBg: '#ffffff',
      tileBorder: '#cbd5e1'
    }
  },
  {
    name: 'Violet / Indigo Classique',
    theme: {
      topBarBg: '#2e1065',
      topBarText: '#ffffff',
      sidebarBg: '#3b0764',
      sidebarText: '#f8fafc',
      primaryAccent: '#6b3ba7',
      canvasBg: '#e9d5ff',
      canvasRibbon1: '#6b3ba7',
      canvasRibbon2: '#2e1065',
      tileTitleColor: '#6b3ba7',
      tileBg: '#ffffff',
      tileBorder: '#cbd5e1'
    }
  }
];

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: CooperativeTheme;
  onUpdateTheme: (theme: CooperativeTheme) => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onUpdateTheme
}) => {
  if (!isOpen) return null;

  const handleColorChange = (key: keyof CooperativeTheme, value: string) => {
    const updated = { ...currentTheme, [key]: value };
    onUpdateTheme(updated);
    ThemeManager.setTheme(updated);
  };

  const handleApplyPreset = (preset: CooperativeTheme) => {
    onUpdateTheme(preset);
    ThemeManager.setTheme(preset);
  };

  const handleReset = () => {
    onUpdateTheme(defaultTheme);
    ThemeManager.setTheme(defaultTheme);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Personnalisation des Couleurs & Thème Graphique
              </h2>
              <p className="text-xs text-slate-500">
                Adaptez les teintes de chaque section selon la charte graphique de votre coopérative
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Thèmes Prédéfinis (Palettes Rapides)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {themePresets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyPreset(p.theme)}
                className="text-left p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between transition-all"
              >
                <span>{p.name}</span>
                <div className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: p.theme.sidebarBg }} />
                  <span className="w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: p.theme.primaryAccent }} />
                  <span className="w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: p.theme.canvasBg }} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Granular Color Pickers */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Personnalisation Détaillée par Composant
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Top Bar Background */}
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Bandeau Supérieur (En-tête) :</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={currentTheme.topBarBg}
                  onChange={(e) => handleColorChange('topBarBg', e.target.value)}
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                />
                <span className="font-mono text-[11px] text-slate-500">{currentTheme.topBarBg}</span>
              </div>
            </div>

            {/* Sidebar Background */}
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Volet Latéral Gauche :</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={currentTheme.sidebarBg}
                  onChange={(e) => handleColorChange('sidebarBg', e.target.value)}
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                />
                <span className="font-mono text-[11px] text-slate-500">{currentTheme.sidebarBg}</span>
              </div>
            </div>

            {/* Primary Accent Color */}
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Couleur d'Accent Principale :</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={currentTheme.primaryAccent}
                  onChange={(e) => handleColorChange('primaryAccent', e.target.value)}
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                />
                <span className="font-mono text-[11px] text-slate-500">{currentTheme.primaryAccent}</span>
              </div>
            </div>

            {/* Canvas Background */}
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Fond de l'Espace Central :</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={currentTheme.canvasBg}
                  onChange={(e) => handleColorChange('canvasBg', e.target.value)}
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                />
                <span className="font-mono text-[11px] text-slate-500">{currentTheme.canvasBg}</span>
              </div>
            </div>

            {/* Tile Title Color */}
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Titres des Tuiles Modules :</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={currentTheme.tileTitleColor}
                  onChange={(e) => handleColorChange('tileTitleColor', e.target.value)}
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                />
                <span className="font-mono text-[11px] text-slate-500">{currentTheme.tileTitleColor}</span>
              </div>
            </div>

            {/* Canvas Ribbon Decor */}
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Ruban Décoratif Géométrique :</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={currentTheme.canvasRibbon1}
                  onChange={(e) => handleColorChange('canvasRibbon1', e.target.value)}
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                />
                <span className="font-mono text-[11px] text-slate-500">{currentTheme.canvasRibbon1}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-bold px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser par Défaut</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 bg-coop-primary hover:opacity-90 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Appliquer & Fermer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
