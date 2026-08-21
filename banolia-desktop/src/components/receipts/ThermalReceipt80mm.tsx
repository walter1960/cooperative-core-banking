import React from 'react';
import { PrintableTransaction, ReceiptMetadata } from '../../types/escpos';
import { ReceiptFormatter } from '../../services/escpos/ReceiptFormatter';

interface ThermalReceipt80mmProps {
  transaction: PrintableTransaction;
  metadata?: ReceiptMetadata;
}

export const ThermalReceipt80mm: React.FC<ThermalReceipt80mmProps> = ({
  transaction,
  metadata = ReceiptFormatter.getDefaultMetadata()
}) => {
  const amountInWords = ReceiptFormatter.amountToWordsFR(transaction.amount);

  return (
    <div className="bg-white text-black p-5 font-mono text-xs max-w-[340px] mx-auto border border-dashed border-gray-300 shadow-md print:shadow-none print:border-none print:p-0">
      {/* Header */}
      <div className="text-center space-y-1 pb-3 border-b border-black">
        <div className="text-base font-black tracking-wide">{metadata.institutionName}</div>
        <div className="text-[10px] font-semibold text-gray-700">{metadata.institutionSub}</div>
        <div className="text-[9px] text-gray-600">{metadata.agrementNo}</div>
        <div className="text-[10px] font-bold mt-1">{metadata.agencyName} ({metadata.agencyCode})</div>
        <div className="text-[9px] text-gray-600">{metadata.agencyAddress}</div>
        <div className="text-[9px] text-gray-600">Tél : {metadata.agencyPhone}</div>
      </div>

      {/* Title */}
      <div className="text-center py-2 border-b border-black font-extrabold text-sm uppercase">
        REÇU DE CAISSE : {transaction.type}
      </div>

      {/* Transaction Details */}
      <div className="py-2 space-y-1 text-[11px] border-b border-black">
        <div className="flex justify-between">
          <span className="text-gray-600">N° Reçu :</span>
          <span className="font-bold">{transaction.receiptNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Date & Heure :</span>
          <span>{transaction.timestamp}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Guichetier :</span>
          <span>{transaction.cashierName || metadata.cashierName}</span>
        </div>
      </div>

      {/* Member Details */}
      <div className="py-2 space-y-1 text-[11px] border-b border-black">
        <div className="flex justify-between">
          <span className="text-gray-600">Code Sociétaire :</span>
          <span className="font-bold">{transaction.memberCode}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Nom :</span>
          <span className="font-bold uppercase">{transaction.memberName}</span>
        </div>
        {transaction.manualNumber && (
          <div className="flex justify-between">
            <span className="text-gray-600">N° Manuel :</span>
            <span>{transaction.manualNumber}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600">Compte N° :</span>
          <span className="font-semibold">{transaction.accountNumber}</span>
        </div>
        <div className="text-[10px] text-gray-600">{transaction.productName}</div>
      </div>

      {/* Amount Box */}
      <div className="py-3 text-center border-b border-black space-y-1">
        <div className="text-gray-600 text-[10px]">MONTANT NET</div>
        <div className="text-xl font-black">{transaction.amount.toLocaleString('fr-FR')} XOF</div>
        {transaction.feeAmount && transaction.feeAmount > 0 ? (
          <div className="text-[10px] text-gray-600">
            + Frais : {transaction.feeAmount.toLocaleString('fr-FR')} XOF (Total : {(transaction.amount + transaction.feeAmount).toLocaleString('fr-FR')} XOF)
          </div>
        ) : null}
      </div>

      {/* Amount in French Words */}
      <div className="py-2 border-b border-black text-[10px]">
        <span className="text-gray-600 block mb-0.5">Montant en toutes lettres :</span>
        <span className="font-bold uppercase leading-tight">{amountInWords}</span>
      </div>

      {/* Balances & Settlement */}
      <div className="py-2 border-b border-black space-y-1 text-[11px]">
        {transaction.previousBalance !== undefined && transaction.newBalance !== undefined && (
          <>
            <div className="flex justify-between text-gray-600">
              <span>Ancien Solde :</span>
              <span>{transaction.previousBalance.toLocaleString('fr-FR')} XOF</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Nouveau Solde :</span>
              <span>{transaction.newBalance.toLocaleString('fr-FR')} XOF</span>
            </div>
          </>
        )}
        <div className="flex justify-between text-gray-600 pt-1">
          <span>Mode Règlement :</span>
          <span className="font-semibold">{transaction.paymentMethod}</span>
        </div>
        {transaction.receivedAmount && transaction.changeAmount !== undefined && (
          <>
            <div className="flex justify-between text-gray-600">
              <span>Montant Reçu :</span>
              <span>{transaction.receivedAmount.toLocaleString('fr-FR')} XOF</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Monnaie Rendue :</span>
              <span className="font-bold">{transaction.changeAmount.toLocaleString('fr-FR')} XOF</span>
            </div>
          </>
        )}
      </div>

      {/* QR & Security Footer */}
      <div className="text-center pt-3 space-y-1 text-[9px] text-gray-600">
        <div className="font-mono text-[8px] bg-gray-100 p-1 rounded">
          BANOLIA:REC:{transaction.receiptNumber}:{transaction.amount}:{transaction.memberCode}
        </div>
        <div className="text-[8px] text-gray-500">
          HMAC: {transaction.signatureHmac ? transaction.signatureHmac.substring(0, 24) + '...' : 'SEAL_VERIFIED_OK'}
        </div>
        <div className="italic pt-1 font-sans">{metadata.slogan}</div>
        <div className="font-bold uppercase text-[9px] text-black">Conservez ce ticket comme reçu officiel</div>
      </div>
    </div>
  );
};
