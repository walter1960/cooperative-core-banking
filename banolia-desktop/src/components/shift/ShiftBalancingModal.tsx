import React, { useState } from 'react';
import { 
  Calculator, 
  CheckCircle2, 
  AlertCircle, 
  Coins, 
  Banknote, 
  Printer, 
  X, 
  ShieldAlert, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { Billetage, CashShift, ShiftPVReport } from '../../types/shift';
import { ShiftService } from '../../services/shift/ShiftService';
import { ShiftPVView } from './ShiftPVView';
import { DbCashShift } from '../../types/database';

interface ShiftBalancingModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShift?: DbCashShift | null;
  onShiftUpdated: () => void;
}

const emptyBilletage: Billetage = {
  b_10000: 0,
  b_5000: 0,
  b_2000: 0,
  b_1000: 0,
  b_500: 0,
  p_500: 0,
  p_200: 0,
  p_100: 0,
  p_50: 0,
  p_25: 0,
  p_10: 0,
  p_5: 0,
  totalCalculated: 0
};

export const ShiftBalancingModal: React.FC<ShiftBalancingModalProps> = ({
  isOpen,
  onClose,
  activeShift,
  onShiftUpdated
}) => {
  const [billetage, setBilletage] = useState<Billetage>({ ...emptyBilletage });
  const [openingBalance, setOpeningBalance] = useState<number | ''>(500000);
  const [discrepancyReason, setDiscrepancyReason] = useState('');
  const [supervisorPin, setSupervisorPin] = useState('');
  const [supervisorName, setSupervisorName] = useState('ADANGBO Kodjo (Chef d\'Agence)');
  const [errorMsg, setErrorMsg] = useState('');
  const [pvReport, setPvReport] = useState<ShiftPVReport | null>(null);
  const [isOpeningShift, setIsOpeningShift] = useState(!activeShift);

  if (!isOpen) return null;

  const currentTotal = ShiftService.calculateBilletageTotal(billetage);
  const theoreticalBalance = activeShift?.theoreticalClosingBalance || 0;
  const discrepancy = currentTotal - theoreticalBalance;

  const handleBilletageChange = (key: keyof Billetage, val: string) => {
    const count = parseInt(val, 10) || 0;
    const updated = {
      ...billetage,
      [key]: Math.max(0, count)
    };
    updated.totalCalculated = ShiftService.calculateBilletageTotal(updated);
    setBilletage(updated);
  };

  const handleOpenShift = async () => {
    setErrorMsg('');
    if (!openingBalance || openingBalance <= 0) {
      setErrorMsg('Veuillez saisir un solde d\'ouverture valide.');
      return;
    }

    try {
      await ShiftService.openShift({
        cashierId: 'CSH-001',
        cashierName: 'MINDIZINA TOMROM (0000)',
        agencyCode: 'A02',
        agencyName: 'AGENCE CENTRALE LOMÉ',
        openingBalance: Number(openingBalance),
        billetage
      });

      onShiftUpdated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l\'ouverture de caisse.');
    }
  };

  const handleCloseShift = async () => {
    setErrorMsg('');
    if (!activeShift) return;

    if (discrepancy !== 0 && (!discrepancyReason || discrepancyReason.trim().length === 0)) {
      setErrorMsg('Un motif explicatif est obligatoire pour tout écart de caisse.');
      return;
    }

    if (!supervisorPin || supervisorPin.length < 4) {
      setErrorMsg('Le code PIN du superviseur est requis pour valider l\'arrêté de caisse.');
      return;
    }

    try {
      const report = await ShiftService.closeAndApproveShift({
        shiftId: activeShift.id,
        closingBilletage: billetage,
        discrepancyReason,
        supervisorId: 'SUP-001',
        supervisorName,
        supervisorNotes: `Approbation effectuée avec PIN - Écart ${discrepancy} F`
      });

      setPvReport(report);
      onShiftUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la clôture de caisse.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 print:p-0 print:bg-white overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-8 print:border-none print:shadow-none print:bg-white print:p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <Calculator className="w-6 h-6 text-amber-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Arrêté de Caisse & Billetage Réglementaire (Instruction SFD BCEAO)
              </h2>
              <p className="text-xs text-slate-500">
                {activeShift ? `Caisse Ouverte : ${activeShift.shiftCode}` : 'Ouverture d\'une nouvelle caisse journalière'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {pvReport ? (
          /* View Mode: PV Generated */
          <div className="space-y-4">
            <ShiftPVView report={pvReport} />
            <div className="flex justify-end gap-3 print:hidden pt-4 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer le Procès-Verbal (PV A4)</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          /* Input Mode: Billetage & Balancing Form */
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-6 h-6 text-amber-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {activeShift ? 'Arrêté de Caisse & Billetage Réglementaire SFD' : 'Ouverture de Caisse (Initialisation du Guichet)'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Conforme aux exigences prudentielles et comptables BCEAO / UMOA
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Shift Summary or Opening Inputs */}
            {activeShift ? (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-medium block">Solde d'Ouverture :</span>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {activeShift.openingBalance.toLocaleString('fr-FR')} F
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Total Versements :</span>
                  <span className="text-sm font-mono font-bold text-amber-800">
                    +{activeShift.totalDeposits.toLocaleString('fr-FR')} F
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Total Retraits :</span>
                  <span className="text-sm font-mono font-bold text-rose-700">
                    -{activeShift.totalWithdrawals.toLocaleString('fr-FR')} F
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Solde Théorique Système :</span>
                  <span className="text-base font-mono font-black text-amber-900">
                    {theoreticalBalance.toLocaleString('fr-FR')} F.CFA
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Solde d'ouverture déclaré (F.CFA) *
                </label>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ex: 500000"
                  className="w-full bg-white border border-slate-300 focus:bg-white focus:border-amber-500 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500">
                  Le billetage physique ci-dessous doit correspondre exactement au solde d'ouverture.
                </p>
              </div>
            )}

            {/* Billetage 12-Denomination Input Matrix */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Banknote className="w-4 h-4 text-amber-600" />
                <span>Comptage Physique des Coupures (Billetage 12 Dénominations BCEAO)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Banknotes (Billets) */}
                <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-xs font-bold text-amber-900 border-b border-slate-100 pb-1">
                    Billets de Banque (Coupures)
                  </div>
                  {[
                    { key: 'b_10000', label: '10 000 F', multiplier: 10000 },
                    { key: 'b_5000', label: '5 000 F', multiplier: 5000 },
                    { key: 'b_2000', label: '2 000 F', multiplier: 2000 },
                    { key: 'b_1000', label: '1 000 F', multiplier: 1000 },
                    { key: 'b_500', label: '500 F', multiplier: 500 }
                  ].map(d => (
                    <div key={d.key} className="flex items-center justify-between gap-2 text-xs">
                      <span className="w-20 font-bold text-slate-700">{d.label} :</span>
                      <input
                        type="number"
                        min="0"
                        value={billetage[d.key as keyof Billetage] || ''}
                        onChange={(e) => handleBilletageChange(d.key as keyof Billetage, e.target.value)}
                        placeholder="0"
                        className="w-24 bg-slate-50 border border-slate-300 focus:bg-white rounded px-2 py-1 text-right font-mono text-slate-900 font-bold text-xs"
                      />
                      <span className="w-28 text-right font-mono text-slate-600 font-medium">
                        {((billetage[d.key as keyof Billetage] || 0) * d.multiplier).toLocaleString('fr-FR')} F
                      </span>
                    </div>
                  ))}
                </div>

                {/* Coins (Pièces) */}
                <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-xs font-bold text-amber-800 border-b border-slate-100 pb-1">
                    Pièces de Monnaie (Monnayage)
                  </div>
                  {[
                    { key: 'p_500', label: '500 F', multiplier: 500 },
                    { key: 'p_200', label: '200 F', multiplier: 200 },
                    { key: 'p_100', label: '100 F', multiplier: 100 },
                    { key: 'p_50', label: '50 F', multiplier: 50 },
                    { key: 'p_25', label: '25 F', multiplier: 25 },
                    { key: 'p_10', label: '10 F', multiplier: 10 },
                    { key: 'p_5', label: '5 F', multiplier: 5 }
                  ].map(d => (
                    <div key={d.key} className="flex items-center justify-between gap-2 text-xs">
                      <span className="w-20 font-bold text-slate-700">{d.label} :</span>
                      <input
                        type="number"
                        min="0"
                        value={billetage[d.key as keyof Billetage] || ''}
                        onChange={(e) => handleBilletageChange(d.key as keyof Billetage, e.target.value)}
                        placeholder="0"
                        className="w-24 bg-slate-50 border border-slate-300 focus:bg-white rounded px-2 py-1 text-right font-mono text-slate-900 font-bold text-xs"
                      />
                      <span className="w-28 text-right font-mono text-slate-600 font-medium">
                        {((billetage[d.key as keyof Billetage] || 0) * d.multiplier).toLocaleString('fr-FR')} F
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Total Physique vs Theoretical Reconciliation Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500 font-medium block">Total Physique Calculé :</span>
                <span className="text-xl font-mono font-black text-amber-900">
                  {currentTotal.toLocaleString('fr-FR')} F.CFA
                </span>
              </div>

              {activeShift && (
                <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                  discrepancy === 0
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : discrepancy < 0
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}>
                  {discrepancy === 0 ? (
                    <CheckCircle2 className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  ) : (
                    <ShieldAlert className="w-6 h-6 text-rose-600 flex-shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-bold">
                      {discrepancy === 0
                        ? 'Caisse Parfaitement Équilibrée (Écart = 0 F)'
                        : discrepancy < 0
                        ? `Déficit de Caisse : ${discrepancy.toLocaleString('fr-FR')} F.CFA`
                        : `Excédent de Caisse : +${discrepancy.toLocaleString('fr-FR')} F.CFA`}
                    </div>
                    {discrepancy !== 0 && (
                      <div className="text-[10px] opacity-80 mt-0.5 font-medium">
                        Imputation : SFD {discrepancy < 0 ? '471200 (Déficit guichet)' : '472200 (Excédent guichet)'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mandatory Justification for Discrepancies */}
            {activeShift && discrepancy !== 0 && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-300 space-y-2">
                <label className="block text-xs font-bold text-amber-900">
                  Motif justificatif obligatoire de l'écart (Compte SFD {discrepancy < 0 ? '471200' : '472200'}) *
                </label>
                <textarea
                  value={discrepancyReason}
                  onChange={(e) => setDiscrepancyReason(e.target.value)}
                  placeholder="Ex: Erreur de rendu de monnaie lors du versement de M. Agbodjan / Billet déchiré mis de côté..."
                  rows={2}
                  className="w-full bg-white border border-amber-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>
            )}

            {/* Supervisor PIN Verification for Closing */}
            {activeShift && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Superviseur / Chef d'Agence</label>
                  <input
                    type="text"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Code PIN Superviseur (Clôture & Scellement) *
                  </label>
                  <input
                    type="password"
                    value={supervisorPin}
                    onChange={(e) => setSupervisorPin(e.target.value)}
                    placeholder="••••"
                    maxLength={6}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 font-bold text-center tracking-widest text-sm"
                  />
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                Annuler
              </button>

              {activeShift ? (
                <button
                  onClick={handleCloseShift}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
                >
                  <Lock className="w-4 h-4" />
                  <span>Clôturer la Caisse & Générer le PV (Arrêté)</span>
                </button>
              ) : (
                <button
                  onClick={handleOpenShift}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Valider & Ouvrir la Caisse</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
