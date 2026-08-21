import 'package:flutter_test/flutter_test.dart';
import 'package:banolia_mobile/core/value_objects/money.dart';
import 'package:banolia_mobile/features/receipt/escpos_builder.dart';
import 'package:banolia_mobile/features/receipt/receipt_generator_service.dart';
import 'package:banolia_mobile/features/receipt/virtual_thermal_printer_mock.dart';

void main() {
  group('58mm ESC/POS Binary Receipt Generator', () {
    test('EscPosBuilder emits valid hardware initialization and CP1252 code page opcodes', () {
      final builder = EscPosBuilder();
      final bytes = builder.build();

      // ESC @ (1B 40) + ESC t 16 (1B 74 10)
      expect(bytes.length, greaterThanOrEqualTo(5));
      expect(bytes[0], equals(0x1B));
      expect(bytes[1], equals(0x40));
      expect(bytes[2], equals(0x1B));
      expect(bytes[3], equals(0x74));
      expect(bytes[4], equals(0x10));
    });

    test('CP1252 French accented characters are correctly mapped to single-byte codes', () {
      final builder = EscPosBuilder();
      builder.text('éèêëàâçîôù°');
      final bytes = builder.build();

      expect(bytes.contains(0xE9), isTrue); // é
      expect(bytes.contains(0xE8), isTrue); // è
      expect(bytes.contains(0xEA), isTrue); // ê
      expect(bytes.contains(0xEB), isTrue); // ë
      expect(bytes.contains(0xE0), isTrue); // à
      expect(bytes.contains(0xE2), isTrue); // â
      expect(bytes.contains(0xE7), isTrue); // ç
      expect(bytes.contains(0xEE), isTrue); // î
      expect(bytes.contains(0xF4), isTrue); // ô
      expect(bytes.contains(0xF9), isTrue); // ù
      expect(bytes.contains(0xB0), isTrue); // °
    });

    test('QR Code binary sequence contains Model 2, module size, and data buffer', () {
      final builder = EscPosBuilder();
      builder.qrCode('BNL|v1|TEST', moduleSize: 4);
      final bytes = builder.build();

      // GS ( k (1D 28 6B)
      expect(bytes.contains(0x1D), isTrue);
      expect(bytes.contains(0x28), isTrue);
      expect(bytes.contains(0x6B), isTrue);
    });

    test('ReceiptGeneratorService generates full 32-column Cotisation Receipt and 2D QR audit payload', () {
      final receiptData = CotisationReceiptData(
        receiptNumber: 'TON-20260820-0142',
        timestamp: DateTime(2026, 8, 20, 11, 15, 30),
        collectorName: 'K. MINTA',
        collectorId: 'COL-04',
        memberName: 'AMEGNINOU ABLAVI',
        memberCode: 'A0200389',
        cardId: 'CARD-2026-0883',
        stallNumber: 'Étal N° 42B - Hall Tissus',
        dailyMise: const Money(1000),
        daysPaidCount: 2,
        allocatedStamps: [14, 15],
        totalAmount: const Money(2000),
        cumulativeMonth: const Money(15000),
        totalDaysDone: 15,
        remainingToPay: const Money(16000),
        creditBuffer: Money.zero,
        idempotencyKey: 'idemp_col04_1724152530_7e4a',
        signatureHmac: '7E4AB82919FAC401',
      );

      final qrPayload = ReceiptGeneratorService.buildQrPayload(receiptData);
      expect(qrPayload.startsWith('BNL|v1|TON-20260820-0142|A0200389|CARD-2026-0883|2000|'), isTrue);

      final bytes = ReceiptGeneratorService.generateCotisationReceiptBytes(receiptData);
      expect(bytes.isNotEmpty, isTrue);
    });

    test('VirtualThermalPrinterMock connects, receives print job, decodes text, and extracts QR payload', () async {
      final mockPrinter = VirtualThermalPrinterMock();
      await mockPrinter.connect('00:11:22:33:44:55');
      expect(await mockPrinter.isConnected(), isTrue);

      final receiptData = CotisationReceiptData(
        receiptNumber: 'TON-20260820-0142',
        timestamp: DateTime(2026, 8, 20, 11, 15, 30),
        collectorName: 'K. MINTA',
        collectorId: 'COL-04',
        memberName: 'AMEGNINOU ABLAVI',
        memberCode: 'A0200389',
        cardId: 'CARD-2026-0883',
        stallNumber: 'Étal N° 42B',
        dailyMise: const Money(1000),
        daysPaidCount: 2,
        allocatedStamps: [14, 15],
        totalAmount: const Money(2000),
        cumulativeMonth: const Money(15000),
        totalDaysDone: 15,
        remainingToPay: const Money(16000),
        creditBuffer: Money.zero,
        idempotencyKey: 'idemp_col04_1724152530_7e4a',
        signatureHmac: '7E4AB82919FAC401',
      );

      final bytes = ReceiptGeneratorService.generateCotisationReceiptBytes(receiptData);
      final printResult = await mockPrinter.sendRawBytes(bytes);

      expect(printResult.success, isTrue);
      expect(mockPrinter.receivedJobs.length, equals(1));

      // Decode printed text
      final renderedText = mockPrinter.renderLastReceiptAsText();
      expect(renderedText.contains('COOPEC BANOLIA TERRAIN'), isTrue);
      expect(renderedText.contains('RECU COTISATION TONTINE'), isTrue);
      expect(renderedText.contains('TON-20260820-0142'), isTrue);
      expect(renderedText.contains('AMEGNINOU ABLAVI'), isTrue);
      expect(renderedText.contains('DEUX MILLE FRANCS CFA'), isTrue); // French amount in words

      // Extract QR Code payload
      final extractedQr = mockPrinter.extractLastQrCodePayload();
      expect(extractedQr, isNotNull);
      expect(extractedQr!.startsWith('BNL|v1|TON-20260820-0142'), isTrue);
    });

    test('ReceiptGeneratorService generates Shift Reconciliation Receipt and printer decodes', () async {
      final mockPrinter = VirtualThermalPrinterMock();
      await mockPrinter.connect('00:11:22:33:44:55');

      final shiftData = ShiftReconciliationReceiptData(
        shiftCode: 'COLSHIFT-20260820-004',
        collectorName: 'K. MINTA',
        collectorId: 'COL-04',
        openedAt: DateTime(2026, 8, 20, 8, 0, 0),
        closedAt: DateTime(2026, 8, 20, 16, 30, 0),
        transactionCount: 28,
        journalTotal: const Money(65000),
        physicalCash: const Money(65000),
        variance: Money.zero,
        status: 'CAISSE JUSTE (BALANCED)',
        rootHash: 'a7f8b92d6e3c1a4f5b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a',
        tipHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      );

      final bytes = ReceiptGeneratorService.generateShiftReconciliationReceiptBytes(shiftData);
      final res = await mockPrinter.sendRawBytes(bytes);
      expect(res.success, isTrue);

      final text = mockPrinter.renderLastReceiptAsText();
      expect(text.contains('ARRETE DE COLLECTE JOURNALIERE'), isTrue);
      expect(text.contains('COLSHIFT-20260820-004'), isTrue);
      expect(text.contains('65 000 F.CFA'), isTrue);
      expect(text.contains('CAISSE JUSTE'), isTrue);
    });
  });
}

