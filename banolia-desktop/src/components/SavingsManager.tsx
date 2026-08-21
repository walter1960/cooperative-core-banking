import React, { useState } from 'react';
import { PiggyBank, Calendar, Shield, Users, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Member } from '../types';

interface SavingsManagerProps {
  members: Member[];
}

export const SavingsManager: React.FC<SavingsManagerProps> = ({ members }) => {
  const [notification, setNotification] = useState<string>('');

  const handleAction = (title: string) => {
    setNotification(`${title} initialisé avec succès dans le grand livre.`);
    setTimeout(() => setNotification(''), 5000);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <PiggyBank className="w-5 h-5 text-amber-600" />
          <span>Gestion des Tontines & Produits d'Épargne Programmée</span>
        </h2>

        {notification && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-amber-800 uppercase">Tontine Journalière (Marché)</span>
            <div className="text-xl font-bold font-mono text-slate-900">Mise fixe : 1 000 F / jour</div>
            <p className="text-xs text-slate-600">Cycle de 31 jours avec prélèvement d'une cotisation au titre de la commission du collecteur.</p>
            <button 
              onClick={() => handleAction('Nouveau Carnet Tontine Marché')}
              className="w-full mt-2 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              Ouvrir un Carnet Tontine
            </button>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-amber-700 uppercase">Plan Épargne Fin de Carrière</span>
            <div className="text-xl font-bold font-mono text-slate-900">Rémunération : 5.5% / an</div>
            <p className="text-xs text-slate-600">Épargne bloquée à terme avec versements périodiques programmés et capitalisation semestrielle.</p>
            <button 
              onClick={() => handleAction('Souscription Plan Carrière')}
              className="w-full mt-2 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              Souscrire un Plan Carrière
            </button>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-indigo-700 uppercase">Dépôt à Terme (DAT)</span>
            <div className="text-xl font-bold font-mono text-slate-900">Taux contractuel : 6.0% à 7.5%</div>
            <p className="text-xs text-slate-600">Placement de trésorerie sur 6, 12 ou 24 mois avec émission d'un contrat de dépôt.</p>
            <button 
              onClick={() => handleAction('Nouveau Contrat Dépôt à Terme (DAT)')}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              Nouveau Dépôt à Terme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
