import React from 'react';
import { Transaction } from '../types';

interface ThermalReceiptProps {
  transaction: Transaction | null;
  agencyName: string;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ transaction, agencyName }) => {
  if (!transaction) return null;

  return (
    <div id="thermal-receipt-area" className="hidden print:block p-4 bg-white text-black font-mono text-[11px] leading-tight max-w-[80mm] mx-auto border border-dashed border-gray-300">
      <div className="text-center font-bold text-sm uppercase tracking-wider mb-1">
        {agencyName}
      </div>
      <div className="text-center text-[10px] text-gray-600 mb-2">
        Système BANOLIA Microfinance
      </div>

      <div className="border-t border-b border-black py-1 my-1 text-center font-bold">
        {transaction.type === 'DEPOSIT' && '*** REÇU DE VERSEMENT ESPÈCES ***'}
        {transaction.type === 'WITHDRAWAL' && '*** REÇU DE RETRAIT ESPÈCES ***'}
        {transaction.type === 'SHARE_PURCHASE' && '*** ACHAT PARTS SOCIALES ***'}
        {transaction.type === 'LOAN_REPAYMENT' && '*** REMBOURSEMENT CRÉDIT ***'}
      </div>

      <div className="space-y-0.5 my-2">
        <div>N° Reçu : <strong>{transaction.receiptNumber}</strong></div>
        <div>Date & Heure : {transaction.timestamp}</div>
        <div>Caissier : {transaction.cashierName}</div>
        <div>Mode : {transaction.paymentMethod}</div>
      </div>

      <div className="border-t border-gray-400 pt-1 my-1">
        <div>Code Adhérent : <strong>{transaction.memberCode}</strong></div>
        <div>Nom Adhérent : {transaction.memberName}</div>
        <div>Compte : {transaction.accountNumber}</div>
        <div>Produit : {transaction.productName}</div>
      </div>

      <div className="border-t-2 border-b-2 border-black py-2 my-2 flex justify-between items-center text-sm font-bold">
        <span>MONTANT :</span>
        <span>{transaction.amount.toLocaleString('fr-FR')} F.CFA</span>
      </div>

      <div className="text-[9px] text-center mt-3 text-gray-600">
        <div>Opération enregistrée avec succès.</div>
        <div className="font-mono text-[8px] mt-1">Ref: {transaction.idempotencyKey}</div>
        <div className="mt-2 text-[10px] font-bold">Merci de votre confiance.</div>
      </div>
    </div>
  );
};
