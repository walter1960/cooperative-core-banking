import React from 'react';
import { PrintableTransaction, ReceiptMetadata } from '../../types/escpos';
import { ReceiptFormatter } from '../../services/escpos/ReceiptFormatter';

interface ThermalReceipt58mmProps {
  transaction: PrintableTransaction;
  metadata?: ReceiptMetadata;
}

export const ThermalReceipt58mm: React.FC<ThermalReceipt58mmProps> = ({
  transaction,
  metadata = ReceiptFormatter.getDefaultMetadata()
}) => {
  const amountInWords = ReceiptFormatter.amountToWordsFR(transaction.amount);

  return (
    <div className="bg-white text-black p-3 font-mono text-[10px] max-w-[240px] mx-auto border border-dashed border-gray-300 shadow-md print:shadow-none print:border-none print:p-0">
      {/* Header */}
      <div className="text-center space-y-0.5 pb-2 border-b border-black">
        <div className="text-sm font-black">{metadata.institutionName}</div>
        <div className="text-[8px] text-gray-600">{metadata.agrementNo}</div>
        <div className="text-[9px] font-bold">{metadata.agencyCode} - {metadata.agencyName.substring(0, 20)}</div>
      </div>

      {/* Operation */}
      <div className="text-center py-1.5 border-b border-black font-black uppercase text-xs">
        {transaction.type}
      </div>

      {/* Details */}
      <div className="py-1.5 space-y-0.5 border-b border-black text-[9px]">
        <div className="flex justify-between">
          <span>Reçu:</span>
          <span className="font-bold">{transaction.receiptNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{transaction.timestamp.split('T')[0] || transaction.timestamp}</span>
        </div>
        <div className="flex justify-between">
          <span>Membre:</span>
          <span className="font-bold">{transaction.memberCode}</span>
        </div>
        <div className="truncate font-bold uppercase">{transaction.memberName}</div>
        <div className="truncate text-[8px]">{transaction.accountNumber}</div>
      </div>

      {/* Amount */}
      <div className="py-2 text-center border-b border-black">
        <div className="text-base font-black">{transaction.amount.toLocaleString('fr-FR')} XOF</div>
      </div>

      {/* Amount in French Words */}
      <div className="py-1 border-b border-black text-[8px] leading-tight uppercase font-bold">
        {amountInWords}
      </div>

      {/* Footer */}
      <div className="text-center pt-2 text-[8px] text-gray-600 space-y-1">
        <div>BANOLIA:{transaction.receiptNumber}</div>
        <div className="font-bold uppercase text-black">Merci de votre confiance</div>
      </div>
    </div>
  );
};
