import React, { useState } from 'react';
import { Printer, X, FileText, CheckCircle2 } from 'lucide-react';
import { PrintableTransaction } from '../../types/escpos';
import { ThermalReceipt80mm } from './ThermalReceipt80mm';
import { ThermalReceipt58mm } from './ThermalReceipt58mm';
import { ReceiptFormatter } from '../../services/escpos/ReceiptFormatter';
import { ThermalPrinterService } from '../../services/escpos/PrinterDriver';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PrintableTransaction | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction
}) => {
  const [layout, setLayout] = useState<80 | 58>(80);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);

  if (!isOpen || !transaction) return null;

  const handlePrint = async () => {
    setIsPrinting(true);
    setPrintSuccess(false);

    try {
      const printer = ThermalPrinterService.getInstance();
      const rawBytes = layout === 80
        ? ReceiptFormatter.buildReceipt80mm(transaction)
        : ReceiptFormatter.buildReceipt58mm(transaction);

      await printer.print(rawBytes);
      setPrintSuccess(true);
      setTimeout(() => setPrintSuccess(false), 2000);

      // Trigger browser print dialog for visual backup
      window.print();
    } catch (err) {
      console.error('Print error:', err);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 print:p-0 print:bg-white">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 print:border-none print:shadow-none print:bg-white print:p-0">
        {/* Modal Controls (Hidden during print) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Aperçu Ticket de Caisse : {transaction.receiptNumber}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Format toggle 80mm vs 58mm */}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setLayout(80)}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  layout === 80 ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                80mm (Standard)
              </button>
              <button
                onClick={() => setLayout(58)}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  layout === 58 ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                58mm (Mobile)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-center print:bg-white print:p-0 print:border-none print:overflow-visible">
          {layout === 80 ? (
            <ThermalReceipt80mm transaction={transaction} />
          ) : (
            <ThermalReceipt58mm transaction={transaction} />
          )}
        </div>

        {/* Print Action Bar (Hidden during print) */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 print:hidden">
          <div className="text-xs text-slate-500">
            {printSuccess && (
              <span className="text-amber-900 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                Impression envoyée avec succès
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              Fermer
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Impression...' : 'Imprimer Reçu (Entrée)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
