import 'package:flutter_test/flutter_test.dart';
import 'package:banolia_mobile/core/value_objects/money.dart';
import 'package:banolia_mobile/core/utils/currency_formatter.dart';
import 'package:banolia_mobile/core/utils/french_number_words.dart';

void main() {
  group('Money Value Object', () {
    test('Arithmetic operations preserve integer precision in XOF', () {
      const m1 = Money(15000);
      const m2 = Money(5000);

      expect(m1 + m2, equals(const Money(20000)));
      expect(m1 - m2, equals(const Money(10000)));
      expect(m1 * 2, equals(const Money(30000)));
      expect(m1 * 0.1, equals(const Money(1500))); // Banker's/standard round
      expect(m1 ~/ 3, equals(const Money(5000)));
    });

    test('Comparisons and status properties work correctly', () {
      const m100 = Money(100);
      const m200 = Money(200);
      const mZero = Money.zero;
      const mNeg = Money(-50);

      expect(m200 > m100, isTrue);
      expect(m100 < m200, isTrue);
      expect(m100 >= m100, isTrue);
      expect(m100 <= m100, isTrue);
      expect(mZero.isZero, isTrue);
      expect(mNeg.isNegative, isTrue);
      expect(m100.isPositive, isTrue);
      expect(mNeg.abs(), equals(const Money(50)));
    });

    test('Currency formatting conforms to BCEAO XOF standards', () {
      expect(const Money(0).formatted, equals('0 F.CFA'));
      expect(const Money(1000).formatted, equals('1 000 F.CFA'));
      expect(const Money(2500000).formatted, equals('2 500 000 F.CFA'));
      expect(const Money(-500).formatted, equals('-500 F.CFA'));

      expect(CurrencyFormatter.parseXOF('10 000 F.CFA'), equals(10000));
      expect(CurrencyFormatter.parseXOF('2 500 000 XOF'), equals(2500000));
    });

    test('French number words converts integer amounts accurately for receipts', () {
      expect(FrenchNumberWords.convertToFrancsCfa(0), equals('ZÉRO FRANC CFA'));
      expect(FrenchNumberWords.convertToFrancsCfa(1), equals('UN FRANC CFA'));
      expect(FrenchNumberWords.convertToFrancsCfa(1000), equals('MILLE FRANCS CFA'));
      expect(FrenchNumberWords.convertToFrancsCfa(2000), equals('DEUX MILLE FRANCS CFA'));
      expect(FrenchNumberWords.convertToFrancsCfa(15750), equals('QUINZE MILLE SEPT CENT CINQUANTE FRANCS CFA'));
      expect(FrenchNumberWords.convertToFrancsCfa(80), equals('QUATRE-VINGTS FRANCS CFA'));
      expect(FrenchNumberWords.convertToFrancsCfa(71), equals('SOIXANTE ET ONZE FRANCS CFA'));
      expect(FrenchNumberWords.convertToFrancsCfa(95), equals('QUATRE-VINGT-QUINZE FRANCS CFA'));
      expect(FrenchNumberWords.convertToFrancsCfa(1000000), equals('UN MILLION FRANCS CFA'));
      expect(FrenchNumberWords.convertToFrancsCfa(1250000), equals('UN MILLION DEUX CENT CINQUANTE MILLE FRANCS CFA'));
    });
  });
}
