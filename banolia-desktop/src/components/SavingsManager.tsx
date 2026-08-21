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
    <div className="w-full px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 rounded-xl text-coop-primary">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Gestion de l'Épargne, Tontines & Dépôts à Terme (DAT)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Gestion intégrée des livrets d'épargne ordinaire, tontines périodiques et placements bloqués.
              </p>
            </div>
          </div>
        </div>

        {notification && (
          <div className="p-4 bg-slate-900 text-white rounded-xl text-xs flex items-center gap-2 border border-slate-800 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="font-semibold">{notification}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-coop-primary uppercase tracking-wider block">Tontine Journalière (Marché)</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">Mise fixe : 1 000 F / jour</div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Cycle de 31 jours avec prélèvement d'une cotisation au titre de la commission du collecteur.
              </p>
            </div>
            <button 
              onClick={() => handleAction('Nouveau Carnet Tontine Marché')}
              className="w-full mt-4 bg-coop-primary hover:opacity-90 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Ouvrir un Carnet Tontine
            </button>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-coop-primary uppercase tracking-wider block">Plan Épargne Fin de Carrière</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">Rémunération : 5.5% / an</div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Épargne bloquée à terme avec versements périodiques programmés et capitalisation semestrielle.
              </p>
            </div>
            <button 
              onClick={() => handleAction('Souscription Plan Carrière')}
              className="w-full mt-4 bg-coop-primary hover:opacity-90 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Souscrire un Plan Carrière
            </button>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-coop-primary uppercase tracking-wider block">Dépôt à Terme (DAT)</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">Taux contractuel : 6.0% à 7.5%</div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Placement de trésorerie sur 6, 12 ou 24 mois avec émission d'un contrat de dépôt officiel.
              </p>
            </div>
            <button 
              onClick={() => handleAction('Nouveau Contrat Dépôt à Terme (DAT)')}
              className="w-full mt-4 bg-coop-primary hover:opacity-90 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Nouveau Dépôt à Terme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
