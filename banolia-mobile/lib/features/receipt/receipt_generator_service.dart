import 'dart:typed_data';
import '../../core/utils/date_formatter.dart';
import '../../core/utils/hash_chain_utils.dart';
import '../../core/value_objects/money.dart';
import 'escpos_builder.dart';

class CotisationReceiptData {
  final String receiptNumber;
  final DateTime timestamp;
  final String collectorName;
  final String collectorId;
  final String terminalId;
  final String memberName;
  final String memberCode;
  final String cardId;
  final String stallNumber;
  final Money dailyMise;
  final int daysPaidCount;
  final List<int> allocatedStamps;
  final Money totalAmount;
  final Money cumulativeMonth;
  final int totalDaysDone; // out of 31
  final Money remainingToPay;
  final Money creditBuffer;
  final String idempotencyKey;
  final String signatureHmac;
  final String secretKey;

  const CotisationReceiptData({
    required this.receiptNumber,
    required this.timestamp,
    required this.collectorName,
    required this.collectorId,
    this.terminalId = 'POS-TERRAIN-004',
    required this.memberName,
    required this.memberCode,
    required this.cardId,
    required this.stallNumber,
    required this.dailyMise,
    required this.daysPaidCount,
    required this.allocatedStamps,
    required this.totalAmount,
    required this.cumulativeMonth,
    required this.totalDaysDone,
    required this.remainingToPay,
    required this.creditBuffer,
    required this.idempotencyKey,
    required this.signatureHmac,
    this.secretKey = 'banolia_pos_terminal_hw_sec_key_2026',
  });
}

class ShiftReconciliationReceiptData {
  final String shiftCode;
  final String collectorName;
  final String collectorId;
  final DateTime openedAt;
  final DateTime closedAt;
  final int transactionCount;
  final Money journalTotal;
  final Money physicalCash;
  final Money variance;
  final String status;
  final String rootHash;
  final String tipHash;

  const ShiftReconciliationReceiptData({
    required this.shiftCode,
    required this.collectorName,
    required this.collectorId,
    required this.openedAt,
    required this.closedAt,
    required this.transactionCount,
    required this.journalTotal,
    required this.physicalCash,
    required this.variance,
    required this.status,
    required this.rootHash,
    required this.tipHash,
  });
}

/// 58mm Thermal Receipt Generator for BANOLIA Field Operations
class ReceiptGeneratorService {
  ReceiptGeneratorService._();

  /// Build 2D QR payload for offline verification
  static String buildQrPayload(CotisationReceiptData data) {
    final stampsHex = data.allocatedStamps.fold<int>(0, (prev, day) => prev | (1 << (day - 1))).toRadixString(16).padLeft(8, '0').toUpperCase();
    final epoch = data.timestamp.millisecondsSinceEpoch ~/ 1000;
    final rawForHmac = '${data.receiptNumber}|${data.memberCode}|${data.cardId}|${data.totalAmount.amountXof}|$stampsHex|$epoch';
    final truncatedHmac = HashChainUtils.computeQrTruncatedHmac(secretKey: data.secretKey, payload: rawForHmac);

    return 'BNL|v1|${data.receiptNumber}|${data.memberCode}|${data.cardId}|${data.totalAmount.amountXof}|$stampsHex|$epoch|$truncatedHmac';
  }

  /// Generate 58mm raw ESC/POS binary byte stream for Cotisation Receipt
  static Uint8List generateCotisationReceiptBytes(CotisationReceiptData data) {
    final builder = EscPosBuilder();

    // 1. Header
    builder
        .doubleSeparator()
        .align(PrintAlignment.center)
        .bold(true)
        .line('COOPEC BANOLIA TERRAIN')
        .bold(false)
        .line('Agrement BCEAO/UMOA T/1/1420')
        .line('Agence Centrale - Lome')
        .line('Tel: 22 26 21 01 / BP 10151')
        .doubleSeparator();

    // 2. Title
    builder
        .align(PrintAlignment.center)
        .bold(true)
        .line('*** RECU COTISATION TONTINE ***')
        .bold(false)
        .separator();

    // 3. Receipt & Collector info
    builder
        .align(PrintAlignment.left)
        .line('Recu N°   : ${data.receiptNumber}')
        .line('Date      : ${DateFormatter.formatDateTime(data.timestamp)}')
        .line('Collecteur: ${data.collectorName} (${data.collectorId})')
        .line('Terminal  : ${data.terminalId}')
        .separator();

    // 4. Member info
    builder
        .line('Adherent  : ${data.memberName}')
        .line('Code      : ${data.memberCode}')
        .line('Carnet    : ${data.cardId}')
        .line('Etal      : ${data.stallNumber}')
        .separator();

    // 5. Cotisation & Stamps
    final stampsStr = data.allocatedStamps.isEmpty
        ? 'Aucun'
        : data.allocatedStamps.map((d) => 'J-$d').join(' & ');
    builder
        .keyValue('MISE DU JOUR  :', data.dailyMise.formatted)
        .keyValue('Nbre de Jours :', '${data.daysPaidCount} Jours')
        .keyValue('Timbres Payes :', stampsStr)
        .separator();

    // 6. Total Amount
    builder
        .bold(true)
        .keyValue('MONTANT TOTAL :', data.totalAmount.formatted)
        .bold(false)
        .align(PrintAlignment.center)
        .line('(${data.totalAmount.inWords})')
        .separator();

    // 7. Cumulative & Balance
    builder
        .align(PrintAlignment.left)
        .keyValue('Cumul Mois    :', data.cumulativeMonth.formatted)
        .keyValue('Jours Effectues:', '${data.totalDaysDone} / 31 j')
        .keyValue('Reste a Payer :', data.remainingToPay.formatted)
        .keyValue('Credit Solde  :', data.creditBuffer.formatted)
        .separator();

    // 8. 2D QR Code Audit
    final qrPayload = buildQrPayload(data);
    builder
        .align(PrintAlignment.center)
        .qrCode(qrPayload, moduleSize: 4)
        .line('Scan QR pour contrôle hors-ligne')
        .separator();

    // 9. Footer & Integrity Signature
    final truncatedSig = data.signatureHmac.length >= 16
        ? '#${data.signatureHmac.substring(0, 4)}-${data.signatureHmac.substring(4, 8)}-${data.signatureHmac.substring(8, 12)}-${data.signatureHmac.substring(12, 16)}'.toUpperCase()
        : data.signatureHmac;

    builder
        .align(PrintAlignment.left)
        .line('Sig   : $truncatedSig')
        .line('Idemp : ${data.idempotencyKey.length > 24 ? data.idempotencyKey.substring(0, 24) : data.idempotencyKey}')
        .align(PrintAlignment.center)
        .line('Conservez ce reçu de paiement')
        .line('BANOLIA : Finance Solidaire')
        .doubleSeparator()
        .cut();

    return builder.build();
  }

  /// Generate 58mm ESC/POS binary receipt for Shift Reconciliation (Arrêté de Caisse)
  static Uint8List generateShiftReconciliationReceiptBytes(ShiftReconciliationReceiptData data) {
    final builder = EscPosBuilder();

    builder
        .doubleSeparator()
        .align(PrintAlignment.center)
        .bold(true)
        .line('COOPEC BANOLIA TERRAIN')
        .line('ARRETE DE COLLECTE JOURNALIERE')
        .bold(false)
        .doubleSeparator()
        .align(PrintAlignment.left)
        .line('Session   : ${data.shiftCode}')
        .line('Collecteur: ${data.collectorName} (${data.collectorId})')
        .line('Ouverture : ${DateFormatter.formatDateTime(data.openedAt)}')
        .line('Fermeture : ${DateFormatter.formatDateTime(data.closedAt)}')
        .separator()
        .keyValue('Nbre Transactions:', '${data.transactionCount}')
        .keyValue('Total Journalisé :', data.journalTotal.formatted)
        .keyValue('Espèces Physiques:', data.physicalCash.formatted)
        .separator()
        .bold(true)
        .keyValue('Écart de Caisse  :', data.variance.formatted)
        .keyValue('Statut Arrêté    :', data.status)
        .bold(false)
        .separator()
        .align(PrintAlignment.left)
        .line('Root Hash: ${data.rootHash.substring(0, 16)}...')
        .line('Tip Hash : ${data.tipHash.substring(0, 16)}...')
        .separator()
        .align(PrintAlignment.center)
        .line('Signature Caissier / Collecteur')
        .feed(3)
        .line('................................')
        .doubleSeparator()
        .cut();

    return builder.build();
  }
}
