import React, { useState } from 'react';
import { ArrowLeftRight, CheckCircle2, AlertCircle, X, Wallet, User } from 'lucide-react';
import { TransactionManager } from '../../db/transactionManager';
import { DbMember, DbAccount, DbTransaction } from '../../types/database';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: DbMember[];
  accounts: DbAccount[];
  isOnline: boolean;
  onTransferComplete: (tx: DbTransaction) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  members,
  accounts,
  isOnline,
  onTransferComplete
}) => {
  const [sourceAccountNo, setSourceAccountNo] = useState(accounts[0]?.accountNumber || '');
  const [destAccountNo, setDestAccountNo] = useState(accounts[1]?.accountNumber || '');
  const [amount, setAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const sourceAccount = accounts.find(a => a.accountNumber === sourceAccountNo) || accounts[0];
  const destAccount = accounts.find(a => a.accountNumber === destAccountNo);
  const sourceMember = members.find(m => m.code === sourceAccount?.memberCode);
  const destMember = members.find(m => m.code === destAccount?.memberCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!amount || amount <= 0) {
      setErrorMsg('Veuillez saisir un montant valide.');
      return;
    }

    if (!sourceAccount || !destAccount) {
      setErrorMsg('Veuillez sélectionner le compte source et le compte destinataire.');
      return;
    }

    if (sourceAccount.accountNumber === destAccount.accountNumber) {
      setErrorMsg('Le compte source et le compte destinataire ne peuvent être identiques.');
      return;
    }

    if (sourceAccount.availableBalance < amount) {
      setErrorMsg(`Solde disponible insuffisant (${sourceAccount.availableBalance.toLocaleString('fr-FR')} F.CFA disponibles).`);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await TransactionManager.executeFinancialOperation({
        memberCode: sourceAccount.memberCode,
        memberName: sourceMember?.fullName || 'Sociétaire BANOLIA',
        accountNumber: sourceAccount.accountNumber,
        productName: sourceAccount.productName,
        type: 'TRANSFER',
        amount: Number(amount),
        paymentMethod: 'CASH', // Internal ledger transfer
        cashierId: 'CSH-001',
        cashierName: 'MINDIZINA TOMROM (0000)',
        agencyCode: 'A02',
        isOnline,
        destinationAccountNumber: destAccount.accountNumber,
        notes: notes || 'Virement compte à compte guichet'
      });

      onTransferComplete(res.transaction);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors du virement interne.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">
              Virement Interne Compte à Compte
            </h3>
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Source Account */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-slate-700 font-bold">1. Compte Émetteur (Débit) *</label>
            <select
              value={sourceAccountNo}
              onChange={(e) => setSourceAccountNo(e.target.value)}
              className="w-full bg-white border border-slate-300 focus:border-amber-500 rounded-lg px-3 py-2 text-slate-900 font-mono font-medium focus:outline-none"
            >
              {accounts.map(acc => {
                const mem = members.find(m => m.code === acc.memberCode);
                return (
                  <option key={acc.accountNumber} value={acc.accountNumber}>
                    {acc.accountNumber} - {mem?.fullName || acc.memberCode} (Dispo: {acc.availableBalance.toLocaleString('fr-FR')} F)
                  </option>
                );
              })}
            </select>

            {sourceAccount && (
              <div className="text-[11px] text-amber-900 font-bold flex justify-between">
                <span>Solde Disponible :</span>
                <span className="font-mono">{sourceAccount.availableBalance.toLocaleString('fr-FR')} F.CFA</span>
              </div>
            )}
          </div>

          {/* Destination Account */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-slate-700 font-bold">2. Compte Bénéficiaire (Crédit) *</label>
            <select
              value={destAccountNo}
              onChange={(e) => setDestAccountNo(e.target.value)}
              className="w-full bg-white border border-slate-300 focus:border-amber-500 rounded-lg px-3 py-2 text-slate-900 font-mono font-medium focus:outline-none"
            >
              {accounts.map(acc => {
                const mem = members.find(m => m.code === acc.memberCode);
                return (
                  <option key={acc.accountNumber} value={acc.accountNumber}>
                    {acc.accountNumber} - {mem?.fullName || acc.memberCode} ({acc.productName})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Amount & Notes */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Montant à transférer (F.CFA) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ex: 25000"
                min="100"
                required
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-amber-500 rounded-lg px-3 py-2 text-base font-mono font-bold text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Motif / Référence du virement</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Alimentation compte tontine / Remboursement prêt"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-amber-500 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none"
              />
            </div>
          </div>

          {/* Submit */}
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
              disabled={isProcessing}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>{isProcessing ? 'Exécution...' : 'Exécuter le Virement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
