import React from 'react';
import { ShiftPVReport } from '../../types/shift';
import { ReceiptFormatter } from '../../services/escpos/ReceiptFormatter';

interface ShiftPVViewProps {
  report: ShiftPVReport;
}

export const ShiftPVView: React.FC<ShiftPVViewProps> = ({ report }) => {
  const { shift, closingBilletage, openingBilletage, verificationHash, generatedAt } = report;
  const meta = ReceiptFormatter.getDefaultMetadata();

  return (
    <div className="bg-white text-black p-8 font-sans max-w-3xl mx-auto border border-gray-300 shadow-xl rounded-xl print:shadow-none print:border-none print:p-4 print:max-w-none text-xs">
      {/* Institution Header */}
      <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
        <div>
          <h1 className="text-lg font-black tracking-wide uppercase">{meta.institutionName}</h1>
          <p className="text-[11px] font-semibold text-gray-700">{meta.institutionSub}</p>
          <p className="text-[10px] text-gray-600">{meta.agrementNo}</p>
          <p className="text-[11px] font-bold mt-1">{shift.agencyName} ({shift.agencyCode})</p>
        </div>
        <div className="text-right">
          <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-mono font-bold inline-block">
            {shift.shiftCode}
          </div>
          <div className="text-[10px] text-gray-600 mt-1">Date PV : {new Date(generatedAt).toLocaleDateString('fr-FR')}</div>
        </div>
      </div>

      {/* PV Title */}
      <div className="text-center my-4 py-2 bg-gray-100 border border-gray-300 rounded font-black text-sm uppercase tracking-wider">
        PROCÈS-VERBAL D'ARRÊTÉ DE CAISSE JOURNALIER
      </div>

      {/* Cashier & Session Info */}
      <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
        <div>
          <span className="text-gray-500 font-semibold">Guichetier titulaire : </span>
          <span className="font-bold">{shift.cashierName}</span>
        </div>
        <div>
          <span className="text-gray-500 font-semibold">Superviseur / Chef d'agence : </span>
          <span className="font-bold">{shift.supervisorName || 'SUPERVISEUR DE SERVICE'}</span>
        </div>
        <div>
          <span className="text-gray-500 font-semibold">Ouverture caisse : </span>
          <span>{new Date(shift.openedAt).toLocaleString('fr-FR')}</span>
        </div>
        <div>
          <span className="text-gray-500 font-semibold">Clôture caisse : </span>
          <span>{shift.closedAt ? new Date(shift.closedAt).toLocaleString('fr-FR') : 'En cours'}</span>
        </div>
      </div>

      {/* Financial Summary Table */}
      <table className="w-full border-collapse border border-gray-300 mb-4">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="border border-gray-300 p-2 text-left">Rubrique Comptable & Flux de Caisse</th>
            <th className="border border-gray-300 p-2 text-right">Montant (F.CFA)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 p-2 font-medium">Solde d'ouverture (Report veille)</td>
            <td className="border border-gray-300 p-2 text-right font-mono">{shift.openingBalance.toLocaleString('fr-FR')} F</td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-2 text-emerald-700 font-medium">(+) Total Versements & Dépôts espèces</td>
            <td className="border border-gray-300 p-2 text-right font-mono text-emerald-700">+{shift.totalDeposits.toLocaleString('fr-FR')} F</td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-2 text-rose-700 font-medium">(-) Total Retraits espèces guichet</td>
            <td className="border border-gray-300 p-2 text-right font-mono text-rose-700">-{shift.totalWithdrawals.toLocaleString('fr-FR')} F</td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-2 font-medium">(+/-) Mouvements Coffre-Fort (Approvisionnements / Délestages)</td>
            <td className="border border-gray-300 p-2 text-right font-mono">{(shift.totalVaultTransfersIn - shift.totalVaultTransfersOut).toLocaleString('fr-FR')} F</td>
          </tr>
          <tr className="bg-gray-100 font-bold">
            <td className="border border-gray-300 p-2 uppercase">Solde Théorique de Clôture (Système)</td>
            <td className="border border-gray-300 p-2 text-right font-mono text-sm">{shift.theoreticalBalance.toLocaleString('fr-FR')} F.CFA</td>
          </tr>
          <tr className="bg-gray-50 font-bold">
            <td className="border border-gray-300 p-2 uppercase">Total Espèces Physiques (Billetage)</td>
            <td className="border border-gray-300 p-2 text-right font-mono text-sm">{(shift.physicalClosingBalance || 0).toLocaleString('fr-FR')} F.CFA</td>
          </tr>
          <tr className={`font-black ${
            (shift.discrepancyAmount || 0) === 0
              ? 'bg-emerald-50 text-emerald-800'
              : (shift.discrepancyAmount || 0) < 0
              ? 'bg-rose-50 text-rose-800'
              : 'bg-amber-50 text-amber-800'
          }`}>
            <td className="border border-gray-300 p-2">
              ÉCART DE CAISSE CONSTATÉ
              {shift.discrepancyAccount && shift.discrepancyAccount !== 'NONE' && (
                <span className="ml-2 font-normal text-[10px]">
                  (Imputation réglementaire : Compte SFD {shift.discrepancyAccount})
                </span>
              )}
            </td>
            <td className="border border-gray-300 p-2 text-right font-mono text-base">
              {(shift.discrepancyAmount || 0) > 0 ? `+${(shift.discrepancyAmount || 0).toLocaleString('fr-FR')}` : (shift.discrepancyAmount || 0).toLocaleString('fr-FR')} F.CFA
            </td>
          </tr>
        </tbody>
      </table>

      {/* Discrepancy Reason if any */}
      {shift.discrepancyReason && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded">
          <div className="font-bold text-amber-900 mb-1">Justification de l'écart de caisse :</div>
          <p className="text-amber-800 italic">{shift.discrepancyReason}</p>
        </div>
      )}

      {/* Billetage Details Matrix */}
      {closingBilletage && (
        <div className="mb-4">
          <h3 className="font-bold text-gray-700 uppercase mb-2 border-b pb-1">Détail du Billetage Physique</h3>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="space-y-1">
              <div className="flex justify-between border-b pb-0.5"><span>10 000 F x {closingBilletage.b_10000}</span><span>{(closingBilletage.b_10000 * 10000).toLocaleString('fr-FR')} F</span></div>
              <div className="flex justify-between border-b pb-0.5"><span>5 000 F x {closingBilletage.b_5000}</span><span>{(closingBilletage.b_5000 * 5000).toLocaleString('fr-FR')} F</span></div>
              <div className="flex justify-between border-b pb-0.5"><span>2 000 F x {closingBilletage.b_2000}</span><span>{(closingBilletage.b_2000 * 2000).toLocaleString('fr-FR')} F</span></div>
              <div className="flex justify-between border-b pb-0.5"><span>1 000 F x {closingBilletage.b_1000}</span><span>{(closingBilletage.b_1000 * 1000).toLocaleString('fr-FR')} F</span></div>
              <div className="flex justify-between border-b pb-0.5"><span>500 F (Billets) x {closingBilletage.b_500}</span><span>{(closingBilletage.b_500 * 500).toLocaleString('fr-FR')} F</span></div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between border-b pb-0.5"><span>500 F (Pièces) x {closingBilletage.p_500}</span><span>{(closingBilletage.p_500 * 500).toLocaleString('fr-FR')} F</span></div>
              <div className="flex justify-between border-b pb-0.5"><span>200 F (Pièces) x {closingBilletage.p_200}</span><span>{(closingBilletage.p_200 * 200).toLocaleString('fr-FR')} F</span></div>
              <div className="flex justify-between border-b pb-0.5"><span>100 F (Pièces) x {closingBilletage.p_100}</span><span>{(closingBilletage.p_100 * 100).toLocaleString('fr-FR')} F</span></div>
              <div className="flex justify-between border-b pb-0.5"><span>Pièces 50..5 F</span><span>{((closingBilletage.p_50 * 50) + (closingBilletage.p_25 * 25) + (closingBilletage.p_10 * 10) + (closingBilletage.p_5 * 5)).toLocaleString('fr-FR')} F</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Signature Boxes */}
      <div className="grid grid-cols-2 gap-8 pt-4 border-t-2 border-slate-900 mt-6">
        <div className="text-center">
          <div className="font-bold mb-1">Le Guichetier</div>
          <div className="text-[10px] text-gray-500 mb-12">{shift.cashierName}</div>
          <div className="border-t border-dashed border-gray-400 pt-1 text-[9px] text-gray-500">
            Signature & Date
          </div>
        </div>

        <div className="text-center">
          <div className="font-bold mb-1">Le Superviseur / Chef d'Agence</div>
          <div className="text-[10px] text-gray-500 mb-12">{shift.supervisorName || 'Direction de l\'Agence'}</div>
          <div className="border-t border-dashed border-gray-400 pt-1 text-[9px] text-gray-500">
            Signature & Cachet Officiel
          </div>
        </div>
      </div>

      {/* Digital Hash */}
      <div className="mt-8 pt-2 border-t border-gray-200 text-center text-[9px] text-gray-500 font-mono">
        Empreinte de Scellement SHA-256 : {verificationHash}
      </div>
    </div>
  );
};
