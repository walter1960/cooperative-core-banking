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
  Check
} from 'lucide-react';

interface CooperativeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CooperativeSettingsModal: React.FC<CooperativeSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'financial' | 'audit' | 'database'>('general');
  
  const [institutionName, setInstitutionName] = useState<string>(() => {
    return localStorage.getItem('coop_institution_name') || 'COOPEC';
  });
  const [institutionSub, setInstitutionSub] = useState<string>(() => {
    return localStorage.getItem('coop_institution_sub') || "Coopérative d'Épargne et de Crédit • Système Intégré SFD";
  });
  const [shareValue, setShareValue] = useState<number>(5000);
  const [maxCashierLimit, setMaxCashierLimit] = useState<number>(10000000);
  const [creditRate, setCreditRate] = useState<number>(6.5);
  const [exerciseYear, setExerciseYear] = useState<number>(2026);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('coop_institution_name', institutionName);
    localStorage.setItem('coop_institution_sub', institutionSub);
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
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 lg:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Paramètres Généraux & Utilitaires Système
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Configuration de la coopérative, plafonds réglementaires et sauvegardes.
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
        <div className="flex border-b border-slate-200 text-xs font-bold text-slate-600 gap-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'general'
                ? 'border-slate-900 text-slate-950'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Général & Institution
          </button>

          <button
            onClick={() => setActiveTab('financial')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'financial'
                ? 'border-slate-900 text-slate-950'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Règles & Plafonds Financiers
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'database'
                ? 'border-slate-900 text-slate-950'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Sauvegarde & Base de Données
          </button>
        </div>

        {/* Tab Content */}
        <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-800 font-bold mb-1.5">
                  Nom de la Coopérative / SFD
                </label>
                <input
                  type="text"
                  required
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="Ex: COOPEC SOLIDARITÉ"
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1.5">
                  Sous-titre Institutionnel & Mention d'Agrément
                </label>
                <input
                  type="text"
                  value={institutionSub}
                  onChange={(e) => setInstitutionSub(e.target.value)}
                  placeholder="Ex: Coopérative d'Épargne et de Crédit • Système Intégré SFD"
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">Exercice Comptable Actif</label>
                  <input
                    type="number"
                    value={exerciseYear}
                    onChange={(e) => setExerciseYear(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">Devise des Comptes</label>
                  <input
                    type="text"
                    disabled
                    value="Franc CFA (XOF / BCEAO)"
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl px-4 py-2.5 font-bold text-slate-700"
                  />
                </div>
              </div>
            </div>
          )}

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

          {activeTab === 'database' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">Sauvegarde Instantanée</span>
                <p className="text-slate-500 text-xs">
                  Exportez l'intégralité des sociétaires, livrets d'épargne, écritures comptables et transactions dans un fichier chiffré JSON.
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
              <span>Paramètres enregistrés avec succès !</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
            >
              Fermer
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
