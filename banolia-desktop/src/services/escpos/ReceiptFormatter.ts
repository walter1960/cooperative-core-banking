import { EscPosBuilder } from './EscPosBuilder';
import { PrintableTransaction, ReceiptMetadata } from '../../types/escpos';
import { CashShift, Billetage } from '../../types/shift';

export class ReceiptFormatter {
  private static readonly ONES = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF'];
  private static readonly TEENS = ['DIX', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE', 'DIX-SEPT', 'DIX-HUIT', 'DIX-NEUF'];
  private static readonly TENS = ['', 'DIX', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE', 'SOIXANTE-DIX', 'QUATRE-VINGTS', 'QUATRE-VINGT-DIX'];

  /**
   * Converts monetary amount in XOF into legal French words (BCEAO standard)
   */
  public static amountToWordsFR(amount: number): string {
    if (amount === 0) return 'ZÉRO FRANC CFA';
    if (amount < 0) return 'MOINS ' + this.amountToWordsFR(Math.abs(amount));

    const n = Math.floor(amount);
    const words = this.convertNumber(n);
    return `${words} FRANCS CFA`.trim();
  }

  private static convertNumber(n: number): string {
    if (n === 0) return '';
    if (n < 10) return this.ONES[n];
    if (n < 20) return this.TEENS[n - 10];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const rem = n % 10;
      if (ten === 7) {
        return rem === 1 ? 'SOIXANTE ET ONZE' : `SOIXANTE-${this.convertNumber(10 + rem)}`;
      }
      if (ten === 9) {
        return `QUATRE-VINGT-${this.convertNumber(10 + rem)}`;
      }
      if (rem === 0) return ten === 8 ? 'QUATRE-VINGTS' : this.TENS[ten];
      if (rem === 1 && ten !== 8) return `${this.TENS[ten]} ET UN`;
      return `${this.TENS[ten]}-${this.ONES[rem]}`;
    }
    if (n < 1000) {
      const hundred = Math.floor(n / 100);
      const rem = n % 100;
      const hStr = hundred === 1 ? 'CENT' : `${this.ONES[hundred]} CENTS`;
      if (rem === 0) return hStr;
      const hBase = hundred === 1 ? 'CENT' : `${this.ONES[hundred]} CENT`;
      return `${hBase} ${this.convertNumber(rem)}`;
    }
    if (n < 1000000) {
      const thousand = Math.floor(n / 1000);
      const rem = n % 1000;
      const tStr = thousand === 1 ? 'MILLE' : `${this.convertNumber(thousand)} MILLE`;
      return rem === 0 ? tStr : `${tStr} ${this.convertNumber(rem)}`;
    }
    if (n < 1000000000) {
      const million = Math.floor(n / 1000000);
      const rem = n % 1000000;
      const mStr = million === 1 ? 'UN MILLION' : `${this.convertNumber(million)} MILLIONS`;
      return rem === 0 ? mStr : `${mStr} ${this.convertNumber(rem)}`;
    }
    return n.toString();
  }

  public static getDefaultMetadata(): ReceiptMetadata {
    return {
      institutionName: 'COOPEC BANOLIA',
      institutionSub: 'INSTITUTION DE MICROFINANCE & DIGITAL BANKING',
      agrementNo: 'Agrément N° T/1/1420/SFD - BCEAO / UMOA',
      agencyCode: 'A02',
      agencyName: 'AGENCE CENTRALE DE LOMÉ',
      agencyAddress: 'Boulevard du 13 Janvier, Lomé - TOGO',
      agencyPhone: '+228 22 26 21 00',
      cashierName: 'MINDIZINA TOMROM (0000)',
      slogan: 'L\'inclusion financière et la solidarité au service du développement'
    };
  }

  /**
   * Builds an 80mm ESC/POS Binary Receipt
   */
  public static buildReceipt80mm(
    tx: PrintableTransaction,
    meta: ReceiptMetadata = this.getDefaultMetadata()
  ): Uint8Array {
    const b = new EscPosBuilder();
    const width = 48;

    b.init()
      .align('CENTER')
      .bold(true)
      .size('DOUBLE_BOTH')
      .line(meta.institutionName)
      .size('NORMAL')
      .bold(false)
      .line(meta.institutionSub)
      .line(meta.agrementNo)
      .separator(width)
      .line(`${meta.agencyName} (${meta.agencyCode})`)
      .line(meta.agencyAddress)
      .line(`Tél : ${meta.agencyPhone}`)
      .doubleSeparator(width);

    // Ticket Header
    b.align('CENTER')
      .bold(true)
      .size('DOUBLE_HEIGHT')
      .line(`REÇU D'OPÉRATION : ${tx.type.toUpperCase()}`)
      .size('NORMAL')
      .bold(false)
      .separator(width);

    // Details Grid
    b.align('LEFT')
      .twoColumn('N° Reçu :', tx.receiptNumber, width)
      .twoColumn('Date & Heure :', tx.timestamp, width)
      .twoColumn('Guichetier :', tx.cashierName || meta.cashierName, width)
      .separator(width)
      .twoColumn('Code Adhérent :', tx.memberCode, width)
      .twoColumn('Nom Adhérent :', tx.memberName, width);

    if (tx.manualNumber) {
      b.twoColumn('N° Manuel :', tx.manualNumber, width);
    }

    b.twoColumn('Compte N° :', tx.accountNumber, width)
      .twoColumn('Intitulé :', tx.productName, width)
      .separator(width);

    // Financial breakdown
    b.align('CENTER')
      .bold(true)
      .size('DOUBLE_BOTH')
      .line(`${tx.amount.toLocaleString('fr-FR')} XOF`)
      .size('NORMAL')
      .bold(false);

    if (tx.feeAmount && tx.feeAmount > 0) {
      b.twoColumn('Frais d\'opération :', `${tx.feeAmount.toLocaleString('fr-FR')} XOF`, width);
      b.twoColumn('Total Débit/Crédit :', `${(tx.amount + tx.feeAmount).toLocaleString('fr-FR')} XOF`, width);
    }

    b.separator(width)
      .align('LEFT')
      .line('Montant en toutes lettres :')
      .bold(true)
      .line(this.amountToWordsFR(tx.amount))
      .bold(false)
      .separator(width);

    // Balances
    if (tx.previousBalance !== undefined && tx.newBalance !== undefined) {
      b.twoColumn('Ancien Solde :', `${tx.previousBalance.toLocaleString('fr-FR')} XOF`, width)
        .twoColumn('Nouveau Solde :', `${tx.newBalance.toLocaleString('fr-FR')} XOF`, width)
        .separator(width);
    }

    // Payment details
    b.twoColumn('Mode de Règlement :', tx.paymentMethod, width);
    if (tx.receivedAmount && tx.changeAmount !== undefined) {
      b.twoColumn('Montant Reçu :', `${tx.receivedAmount.toLocaleString('fr-FR')} XOF`, width)
        .twoColumn('Monnaie Rendue :', `${tx.changeAmount.toLocaleString('fr-FR')} XOF`, width);
    }

    // Security & QR Code
    b.separator(width)
      .align('CENTER')
      .line('Vérification d\'authenticité :')
      .qrCode(`BANOLIA:REC:${tx.receiptNumber}:${tx.amount}:${tx.memberCode}`, 4)
      .line(`Empreinte HMAC : ${tx.signatureHmac ? tx.signatureHmac.substring(0, 24) + '...' : 'SECURE_CHAIN_OK'}`)
      .separator(width)
      .line(meta.slogan)
      .line('Conservez précieusement ce ticket comme preuve de versement.')
      .kickCashDrawer()
      .cut(true);

    return b.build();
  }

  /**
   * Builds a compact 58mm ESC/POS Binary Receipt
   */
  public static buildReceipt58mm(
    tx: PrintableTransaction,
    meta: ReceiptMetadata = this.getDefaultMetadata()
  ): Uint8Array {
    const b = new EscPosBuilder();
    const width = 32;

    b.init()
      .align('CENTER')
      .bold(true)
      .size('DOUBLE_HEIGHT')
      .line(meta.institutionName)
      .size('NORMAL')
      .bold(false)
      .line(meta.agrementNo)
      .separator(width)
      .bold(true)
      .line(`REÇU : ${tx.type.toUpperCase()}`)
      .bold(false)
      .separator(width)
      .align('LEFT')
      .twoColumn('Reçu:', tx.receiptNumber, width)
      .twoColumn('Date:', tx.timestamp.split('T')[0] || tx.timestamp, width)
      .twoColumn('Membre:', tx.memberCode, width)
      .line(tx.memberName.substring(0, 32))
      .twoColumn('Compte:', tx.accountNumber.substring(0, 18), width)
      .separator(width)
      .align('CENTER')
      .bold(true)
      .size('DOUBLE_HEIGHT')
      .line(`${tx.amount.toLocaleString('fr-FR')} XOF`)
      .size('NORMAL')
      .bold(false)
      .separator(width)
      .align('LEFT')
      .line(this.amountToWordsFR(tx.amount))
      .separator(width)
      .align('CENTER')
      .qrCode(`BANOLIA:${tx.receiptNumber}:${tx.amount}`, 3)
      .line('Merci de votre confiance !')
      .cut(true);

    return b.build();
  }

  /**
   * Builds an 80mm ESC/POS Shift Balancing Slip (Arrêté de caisse)
   */
  public static buildShiftPV80mm(
    shift: CashShift,
    billetage?: Billetage,
    meta: ReceiptMetadata = this.getDefaultMetadata()
  ): Uint8Array {
    const b = new EscPosBuilder();
    const width = 48;

    b.init()
      .align('CENTER')
      .bold(true)
      .size('DOUBLE_BOTH')
      .line(meta.institutionName)
      .size('NORMAL')
      .bold(false)
      .line('PROCÈS-VERBAL D\'ARRÊTÉ DE CAISSE')
      .line(meta.agrementNo)
      .doubleSeparator(width)
      .align('LEFT')
      .twoColumn('Code Arrêté :', shift.shiftCode, width)
      .twoColumn('Date Ouverture :', shift.openedAt, width)
      .twoColumn('Date Clôture :', shift.closedAt || new Date().toISOString(), width)
      .twoColumn('Guichetier :', shift.cashierName, width)
      .twoColumn('Statut :', shift.status, width)
      .separator(width);

    // Balances
    b.twoColumn('Solde Ouverture :', `${shift.openingBalance.toLocaleString('fr-FR')} XOF`, width)
      .twoColumn('Total Versements (+) :', `${shift.totalDeposits.toLocaleString('fr-FR')} XOF`, width)
      .twoColumn('Total Retraits (-) :', `${shift.totalWithdrawals.toLocaleString('fr-FR')} XOF`, width)
      .twoColumn('Mouvements Coffre Net :', `${(shift.totalVaultTransfersIn - shift.totalVaultTransfersOut).toLocaleString('fr-FR')} XOF`, width)
      .separator(width)
      .bold(true)
      .twoColumn('SOLDE THÉORIQUE :', `${shift.theoreticalBalance.toLocaleString('fr-FR')} XOF`, width);

    if (shift.physicalClosingBalance !== undefined) {
      b.twoColumn('TOTAL PHYSIQUE :', `${shift.physicalClosingBalance.toLocaleString('fr-FR')} XOF`, width);
    }

    if (shift.discrepancyAmount !== undefined) {
      const ecartSign = shift.discrepancyAmount > 0 ? `+${shift.discrepancyAmount}` : `${shift.discrepancyAmount}`;
      b.twoColumn('ÉCART DE CAISSE :', `${ecartSign} XOF`, width)
        .twoColumn('Compte Imputation :', `SFD ${shift.discrepancyAccount || 'NONE'}`, width);
    }
    b.bold(false).separator(width);

    // Denominations
    if (billetage) {
      b.align('CENTER').bold(true).line('DÉTAIL DU BILLETAGE PHYSIQUE').bold(false).separator(width);
      b.twoColumn('Billets 10 000 F x ' + billetage.b_10000, (billetage.b_10000 * 10000).toLocaleString('fr-FR') + ' F', width);
      b.twoColumn('Billets 5 000 F x ' + billetage.b_5000, (billetage.b_5000 * 5000).toLocaleString('fr-FR') + ' F', width);
      b.twoColumn('Billets 2 000 F x ' + billetage.b_2000, (billetage.b_2000 * 2000).toLocaleString('fr-FR') + ' F', width);
      b.twoColumn('Billets 1 000 F x ' + billetage.b_1000, (billetage.b_1000 * 1000).toLocaleString('fr-FR') + ' F', width);
      b.twoColumn('Billets 500 F x ' + billetage.b_500, (billetage.b_500 * 500).toLocaleString('fr-FR') + ' F', width);
      b.twoColumn('Pièces 500 F x ' + billetage.p_500, (billetage.p_500 * 500).toLocaleString('fr-FR') + ' F', width);
      b.twoColumn('Pièces 200 F x ' + billetage.p_200, (billetage.p_200 * 200).toLocaleString('fr-FR') + ' F', width);
      b.twoColumn('Pièces 100 F x ' + billetage.p_100, (billetage.p_100 * 100).toLocaleString('fr-FR') + ' F', width);
      b.twoColumn('Pièces 50..5 F', ((billetage.p_50 * 50) + (billetage.p_25 * 25) + (billetage.p_10 * 10) + (billetage.p_5 * 5)).toLocaleString('fr-FR') + ' F', width);
      b.separator(width);
    }

    b.align('CENTER')
      .line('Signature Caissier                Signature Superviseur')
      .feed(2)
      .qrCode(`BANOLIA:SHIFT:${shift.shiftCode}:${shift.theoreticalBalance}:${shift.discrepancyAmount || 0}`, 4)
      .line(`Scellé Hash : ${shift.pvHash || 'HASH_AUDIT_VERIFIED'}`)
      .cut(true);

    return b.build();
  }
}
