import React, { useState } from 'react';
import { UserPlus, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { TellerService } from '../../services/teller/TellerService';
import { DbMember } from '../../types/database';

interface AccountOpeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  onMemberCreated: (member: DbMember) => void;
}

export const AccountOpeningModal: React.FC<AccountOpeningModalProps> = ({
  isOpen,
  onClose,
  isOnline,
  onMemberCreated
}) => {
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('1985-06-15');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('LOMÉ');
  const [spouseName, setSpouseName] = useState('');
  const [sharesCount, setSharesCount] = useState(1); // 1 part sociale = 5000 XOF
  const [initialDeposit, setInitialDeposit] = useState(10000);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName || !phone || !address) {
      setErrorMsg('Veuillez renseigner tous les champs obligatoires (Nom, Téléphone, Adresse).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await TellerService.createMemberWithAccounts({
        fullName,
        birthDate,
        address,
        city,
        phone,
        spouseName,
        sharesCount: Number(sharesCount),
        initialDepositAmount: Number(initialDeposit),
        cashierId: 'CSH-001',
        cashierName: 'MINDIZINA TOMROM (0000)',
        agencyCode: 'A02',
        isOnline
      });

      onMemberCreated(res.member);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la création du sociétaire.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalRequiredCash = (sharesCount * 5000) + 2000 + initialDeposit;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">Nouvelle Adhésion & Ouverture de Compte (KYC SFD)</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Identity Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Nom & Prénom(s) complets *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value.toUpperCase())}
                placeholder="Ex: KODJO Koffi Jean-Baptiste"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-amber-500 rounded-lg px-3 py-2 text-slate-900 font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Date de Naissance *</label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-amber-500 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Téléphone Principal (MoMo) *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 90123456 / 99887766"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-amber-500 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Ville / Localité</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-amber-500 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Adresse / Quartier *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Quartier Hedzranawoe, Rue de la Paix"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-amber-500 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Personne à contacter en cas d'urgence</label>
              <input
                type="text"
                value={spouseName}
                onChange={(e) => setSpouseName(e.target.value)}
                placeholder="Ex: Époux/se, Parent ou Tuteur légal"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-amber-500 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none"
              />
            </div>
          </div>

          {/* Shares & Accounts Setup */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-amber-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Souscription de Parts Sociales & Comptes Initiaux</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nombre de parts sociales (5 000 F / part)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={sharesCount}
                  onChange={(e) => setSharesCount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 focus:border-amber-500 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none"
                />
                <span className="text-[11px] text-amber-800 font-semibold">Total parts : {(sharesCount * 5000).toLocaleString('fr-FR')} F.CFA</span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Premier Dépôt Épargne Ordinaire (F.CFA)</label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 focus:border-amber-500 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500">Solde d'ouverture du livret</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg flex justify-between items-center text-xs font-bold border border-slate-200">
              <span className="text-slate-700">Total Espèces à encaisser au guichet :</span>
              <span className="text-amber-900 text-sm font-mono font-extrabold">{totalRequiredCash.toLocaleString('fr-FR')} F.CFA</span>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-bold transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Création...' : 'Valider l\'Adhésion & Imprimer Reçus'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
