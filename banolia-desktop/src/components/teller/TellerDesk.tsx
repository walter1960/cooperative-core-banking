import React, { useState, useEffect } from 'react';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Wallet, 
  ArrowLeftRight,
  UserPlus,
  Coins,
  Banknote,
  ShieldCheck,
  Search,
  Lock
} from 'lucide-react';
import { 
  useLiveMembers, 
  useLiveMemberAccounts, 
  useLiveActiveShift,
  useLiveRecentTransactions
} from '../../hooks/useLiveStorage';
import { TransactionManager } from '../../db/transactionManager';
import { TellerService } from '../../services/teller/TellerService';
import { ReceiptFormatter } from '../../services/escpos/ReceiptFormatter';
import { ThermalPrinterService } from '../../services/escpos/PrinterDriver';
import { TransferModal } from './TransferModal';
import { AccountOpeningModal } from './AccountOpeningModal';
import { ReceiptModal } from '../receipts/ReceiptModal';
import { DbMember, DbAccount, DbTransaction, PaymentMethod, TransactionType } from '../../types/database';
import { PrintableTransaction } from '../../types/escpos';

interface TellerDeskProps {
  isOnline: boolean;
  onOpenShiftModal: () => void;
  selectedAccountNumber?: string;
}

export const TellerDesk: React.FC<TellerDeskProps> = ({
  isOnline,
  onOpenShiftModal,
  selectedAccountNumber
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const members = useLiveMembers(searchQuery) || [];
  const [selectedMemberCode, setSelectedMemberCode] = useState<string>('');
  
  // Set default member once members load
  useEffect(() => {
    if (!selectedMemberCode && members.length > 0) {
      setSelectedMemberCode(members[0].code);
    }
  }, [members, selectedMemberCode]);

  const currentMember = members.find(m => m.code === selectedMemberCode) || members[0];
  const memberAccounts = useLiveMemberAccounts(currentMember?.code || '') || [];
  
  const [selectedAccountNo, setSelectedAccountNo] = useState<string>('');
  useEffect(() => {
    if (selectedAccountNumber) {
      setSelectedAccountNo(selectedAccountNumber);
    } else if (memberAccounts.length > 0 && !selectedAccountNo) {
      setSelectedAccountNo(memberAccounts[0].accountNumber);
    }
  }, [memberAccounts, selectedAccountNumber, selectedAccountNo]);

  const currentAccount = memberAccounts.find(a => a.accountNumber === selectedAccountNo) || memberAccounts[0];

  const activeShift = useLiveActiveShift();
  const recentTransactions = useLiveRecentTransactions(10) || [];

  const [txType, setTxType] = useState<TransactionType>('DEPOSIT');
  const [amount, setAmount] = useState<number | ''>('');
  const [receivedAmount, setReceivedAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Modals state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAccountOpeningOpen, setIsAccountOpeningOpen] = useState(false);
  const [receiptTx, setReceiptTx] = useState<PrintableTransaction | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const changeToReturn = typeof amount === 'number' && typeof receivedAmount === 'number' && receivedAmount >= amount
    ? receivedAmount - amount
    : 0;

  const changeBreakdown = changeToReturn > 0 ? TellerService.calculateChangeBreakdown(changeToReturn) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (typeof amount !== 'number' || amount <= 0) {
      setErrorMsg('Veuillez saisir un montant valide.');
      return;
    }

    if (!currentAccount) {
      setErrorMsg('Veuillez sélectionner un compte.');
      return;
    }

    if (!activeShift) {
      setErrorMsg('Aucune caisse ouverte. Veuillez ouvrir la caisse avant d\'effectuer une opération.');
      return;
    }

    if (txType === 'WITHDRAWAL' && currentAccount.availableBalance < amount) {
      setErrorMsg(`Solde disponible insuffisant (${currentAccount.availableBalance.toLocaleString('fr-FR')} F.CFA disponibles).`);
      return;
    }

    setIsProcessing(true);
    try {
      const prevBal = currentAccount.realBalance;
      // Execute in transactional offline storage & ledger
      const res = await TransactionManager.executeFinancialOperation({
        memberCode: currentMember.code,
        memberName: currentMember.fullName,
        accountNumber: currentAccount.accountNumber,
        productName: currentAccount.productName,
        type: txType,
        amount: Number(amount),
        paymentMethod,
        cashierId: activeShift.cashierId,
        cashierName: activeShift.cashierName,
        agencyCode: activeShift.agencyCode,
        isOnline
      });

      const newBal = txType === 'WITHDRAWAL' ? prevBal - Number(amount) : prevBal + Number(amount);

      // Prepare printable receipt
      const printable: PrintableTransaction = {
        receiptNumber: res.receiptNumber,
        memberCode: currentMember.code,
        memberName: currentMember.fullName,
        manualNumber: currentMember.manualNumber,
        accountNumber: currentAccount.accountNumber,
        productName: currentAccount.productName,
        type: txType === 'DEPOSIT' ? 'VERSEMENT' : 'RETRAIT',
        amount: Number(amount),
        feeAmount: 0,
        paymentMethod,
        timestamp: new Date().toISOString(),
        previousBalance: prevBal,
        newBalance: newBal,
        receivedAmount: typeof receivedAmount === 'number' ? receivedAmount : undefined,
        changeAmount: changeToReturn > 0 ? changeToReturn : undefined,
        cashierName: activeShift.cashierName,
        agencyCode: activeShift.agencyCode,
        signatureHmac: res.transaction.signatureHmac
      };

      setReceiptTx(printable);
      setIsReceiptModalOpen(true);

      // Reset form
      setAmount('');
      setReceivedAmount('');

      // Auto-trigger ESC/POS thermal printer
      try {
        const rawBytes = ReceiptFormatter.buildReceipt80mm(printable);
        await ThermalPrinterService.getInstance().print(rawBytes);
      } catch (printErr) {
        console.warn('Auto print failed:', printErr);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l\'exécution de l\'opération.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Top Banner Alert if Cashier Shift is Closed */}
      {!activeShift && (
        <div className="lg:col-span-3 bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-center justify-between gap-3 text-amber-900 text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Caisse Actuellement Fermée : </span>
              <span>Vous devez effectuer l'arrêté / ouverture de caisse avec le billetage initial avant de pouvoir opérer au guichet.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenShiftModal}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap shadow-sm"
          >
            Ouvrir la Caisse
          </button>
        </div>
      )}

      {/* Left 2 Cols: Main Cashier Form */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        {/* Header & Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">Guichet Express : Opération de Caisse</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTransferOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-sm"
            >
              <ArrowLeftRight className="w-4 h-4 text-amber-600" />
              <span>Virement</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAccountOpeningOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-sm"
            >
              <UserPlus className="w-4 h-4 text-amber-600" />
              <span>Nouveau Membre</span>
            </button>
          </div>
        </div>

        {/* Operation Type Switcher */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-2">
          <button
            type="button"
            onClick={() => setTxType('DEPOSIT')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black transition-all ${
              txType === 'DEPOSIT'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>VERSEMENT / DÉPÔT ESPÈCES</span>
          </button>
          <button
            type="button"
            onClick={() => setTxType('WITHDRAWAL')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black transition-all ${
              txType === 'WITHDRAWAL'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>RETRAIT ESPÈCES GUICHET</span>
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Member Search & Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rechercher / Sélectionner Sociétaire
              </label>
              <div className="relative">
                <select
                  value={currentMember?.code || ''}
                  onChange={(e) => {
                    setSelectedMemberCode(e.target.value);
                    const accs = memberAccounts;
                    if (accs[0]) setSelectedAccountNo(accs[0].accountNumber);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none"
                >
                  {members.map(m => (
                    <option key={m.code} value={m.code}>
                      {m.code} - {m.fullName} ({m.phone})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Compte d'Imputation
              </label>
              <select
                value={selectedAccountNo || currentAccount?.accountNumber}
                onChange={(e) => setSelectedAccountNo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none font-mono font-medium"
              >
                {memberAccounts.map(a => (
                  <option key={a.accountNumber} value={a.accountNumber}>
                    {a.productName} (Dispo: {a.availableBalance.toLocaleString('fr-FR')} F)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Account Balance Alert box */}
          {currentAccount && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Solde Réel : </span>
                <span className="font-mono font-bold text-slate-900">{currentAccount.realBalance.toLocaleString('fr-FR')} F</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Montant Gelé / Nantissement : </span>
                <span className="font-mono font-bold text-rose-600">{currentAccount.frozenBalance.toLocaleString('fr-FR')} F</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Solde Disponible : </span>
                <span className="font-mono font-black text-amber-900 text-sm">{currentAccount.availableBalance.toLocaleString('fr-FR')} F.CFA</span>
              </div>
            </div>
          )}

          {/* Amount & Multi-Tender Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Montant de l'opération (F.CFA) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ex: 50000"
                required
                min="100"
                step="100"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-amber-500 rounded-lg px-3 py-2 text-base font-mono font-bold text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mode de Règlement
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'CASH', label: 'Espèces' },
                  { id: 'TMONEY', label: 'TMoney' },
                  { id: 'FLOOZ', label: 'Flooz' },
                  { id: 'WAVE', label: 'Wave' },
                  { id: 'MTN_MOMO', label: 'MTN MoMo' },
                  { id: 'ORANGE_MONEY', label: 'Orange Money' }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPaymentMethod(p.id as PaymentMethod)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all truncate text-center ${
                      paymentMethod === p.id
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm font-black'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Cash Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Montants rapides :</span>
            {[1000, 5000, 10000, 25000, 50000, 100000, 250000].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-mono font-semibold px-2.5 py-1 rounded border border-slate-300 transition-colors"
              >
                {val.toLocaleString('fr-FR')} F
              </button>
            ))}
          </div>

          {/* Change Calculator & Denomination Breakdown */}
          {paymentMethod === 'CASH' && txType === 'DEPOSIT' && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-600 font-semibold mb-1">Montant remis par l'adhérent :</label>
                  <input
                    type="number"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ex: 100000"
                    className="w-full bg-white border border-slate-300 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-slate-900"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <div className="text-[11px] text-slate-600 font-semibold">Monnaie à rendre :</div>
                  <div className={`text-lg font-mono font-black ${changeToReturn > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                    {changeToReturn.toLocaleString('fr-FR')} F.CFA
                  </div>
                </div>
              </div>

              {changeBreakdown.length > 0 && (
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Coupures suggérées :</span>
                  {changeBreakdown.map((item, idx) => (
                    <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] font-mono font-semibold text-slate-700">
                      {item.count} x {item.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isProcessing || !activeShift}
            className={`w-full py-3.5 rounded-xl font-black text-sm text-white transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 ${
              txType === 'DEPOSIT'
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/20'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>
              {isProcessing ? 'Traitement en cours...' : 'Valider l\'Opération & Imprimer le Reçu (Entrée)'}
            </span>
          </button>
        </form>
      </div>

      {/* Right Column: Shift Status & Recent Tx Card */}
      <div className="space-y-4">
        {/* Active Shift Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">État Caisse Guichet</span>
            <button
              onClick={onOpenShiftModal}
              className="text-xs text-amber-700 hover:text-amber-800 font-bold"
            >
              Arrêté de Caisse
            </button>
          </div>

          {activeShift ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Code Caisse :</span>
                <span className="font-bold text-slate-900">{activeShift.shiftCode}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Guichetier :</span>
                <span className="text-slate-800 font-semibold">{activeShift.cashierName}</span>
              </div>
              <div className="flex justify-between font-mono pt-1 border-t border-slate-100">
                <span className="text-slate-500">Solde Théorique :</span>
                <span className="text-sm font-black text-amber-900">
                  {activeShift.theoreticalClosingBalance.toLocaleString('fr-FR')} F.CFA
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500 text-xs font-medium">
              Aucune session de caisse ouverte.
            </div>
          )}
        </div>

        {/* Recent Transactions List */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            <span>Opérations Récentes de la Session</span>
          </h3>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Aucune opération dans cette session.
              </div>
            ) : (
              recentTransactions.map(tx => (
                <div
                  key={tx.id}
                  className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg space-y-1 text-xs"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-slate-700">{tx.receiptNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      tx.type === 'DEPOSIT'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : tx.type === 'WITHDRAWAL'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-sky-100 text-sky-800 border border-sky-200'
                    }`}>
                      {tx.type}
                    </span>
                  </div>

                  <div className="flex justify-between items-center font-mono">
                    <span className="text-slate-600 truncate max-w-[140px] font-medium">{tx.memberName}</span>
                    <span className="font-bold text-slate-900">{tx.amount.toLocaleString('fr-FR')} F</span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                    <span>{new Date(tx.timestamp).toLocaleTimeString('fr-FR')}</span>
                    <span className="font-mono text-slate-600 font-semibold">
                      Guichet CSH-001
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        members={members}
        accounts={memberAccounts}
        isOnline={isOnline}
        onTransferComplete={(tx) => {
          const printable: PrintableTransaction = {
            receiptNumber: tx.receiptNumber,
            memberCode: tx.memberCode,
            memberName: tx.memberName,
            accountNumber: tx.accountNumber,
            productName: tx.productName,
            type: 'VIREMENT INTERNE',
            amount: tx.amount,
            paymentMethod: 'CASH',
            timestamp: tx.timestamp,
            cashierName: tx.cashierName,
            agencyCode: tx.agencyCode,
            signatureHmac: tx.signatureHmac
          };
          setReceiptTx(printable);
          setIsReceiptModalOpen(true);
        }}
      />

      <AccountOpeningModal
        isOpen={isAccountOpeningOpen}
        onClose={() => setIsAccountOpeningOpen(false)}
        isOnline={isOnline}
        onMemberCreated={(mem) => {
          setSelectedMemberCode(mem.code);
        }}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        transaction={receiptTx}
      />
    </div>
  );
};
