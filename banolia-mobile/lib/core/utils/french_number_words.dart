/// French Number to Words Converter for Microfinance Legal Receipts and Contracts
/// Follows French grammatical rules (trait d'union, accords de cent et vingt, millions, etc.)
class FrenchNumberWords {
  FrenchNumberWords._();

  static const List<String> _units = [
    'ZÉRO',
    'UN',
    'DEUX',
    'TROIS',
    'QUATRE',
    'CINQ',
    'SIX',
    'SEPT',
    'HUIT',
    'NEUF',
    'DIX',
    'ONZE',
    'DOUZE',
    'TREIZE',
    'QUATORZE',
    'QUINZE',
    'SEIZE',
    'DIX-SEPT',
    'DIX-HUIT',
    'DIX-NEUF',
  ];

  static const List<String> _tens = [
    '',
    'DIX',
    'VINGT',
    'TRENTE',
    'QUARANTE',
    'CINQUANTE',
    'SOIXANTE',
    'SOIXANTE-DIX',
    'QUATRE-VINGTS',
    'QUATRE-VINGT-DIX',
  ];

  /// Convert integer amount to uppercase French text with Francs CFA suffix
  static String convertToFrancsCfa(int amount) {
    if (amount == 0) return 'ZÉRO FRANC CFA';
    final isNegative = amount < 0;
    final absAmount = amount.abs();
    final words = convert(absAmount);
    final currency = absAmount == 1 ? 'FRANC CFA' : 'FRANCS CFA';
    return '${isNegative ? 'MOINS ' : ''}$words $currency';
  }

  /// Convert positive integer to French text
  static String convert(int n) {
    if (n == 0) return 'ZÉRO';
    if (n < 0) return 'MOINS ${convert(-n)}';

    if (n >= 1000000000) {
      final billions = n ~/ 1000000000;
      final remainder = n % 1000000000;
      final prefix = billions == 1 ? 'UN MILLIARD' : '${convert(billions)} MILLIARDS';
      if (remainder == 0) return prefix;
      return '$prefix ${convert(remainder)}';
    }

    if (n >= 1000000) {
      final millions = n ~/ 1000000;
      final remainder = n % 1000000;
      final prefix = millions == 1 ? 'UN MILLION' : '${convert(millions)} MILLIONS';
      if (remainder == 0) return prefix;
      return '$prefix ${convert(remainder)}';
    }

    if (n >= 1000) {
      final thousands = n ~/ 1000;
      final remainder = n % 1000;
      final prefix = thousands == 1 ? 'MILLE' : '${convert(thousands)} MILLE';
      if (remainder == 0) return prefix;
      return '$prefix ${convert(remainder)}';
    }

    if (n >= 100) {
      final hundreds = n ~/ 100;
      final remainder = n % 100;
      String prefix;
      if (hundreds == 1) {
        prefix = 'CENT';
      } else {
        prefix = remainder == 0 ? '${_units[hundreds]} CENTS' : '${_units[hundreds]} CENT';
      }
      if (remainder == 0) return prefix;
      return '$prefix ${convert(remainder)}';
    }

    if (n >= 20) {
      final tensDigit = n ~/ 10;
      final unitDigit = n % 10;

      if (tensDigit == 7) {
        if (unitDigit == 1) {
          return 'SOIXANTE ET ONZE';
        } else {
          return 'SOIXANTE-${_units[10 + unitDigit]}';
        }
      }

      if (tensDigit == 8) {
        if (unitDigit == 0) {
          return 'QUATRE-VINGTS';
        } else {
          return 'QUATRE-VINGT-${_units[unitDigit]}';
        }
      }

      if (tensDigit == 9) {
        return 'QUATRE-VINGT-${_units[10 + unitDigit]}';
      }

      final tensWord = _tens[tensDigit];
      if (unitDigit == 0) {
        return tensWord;
      } else if (unitDigit == 1) {
        return '$tensWord ET UN';
      } else {
        return '$tensWord-${_units[unitDigit]}';
      }
    }

    return _units[n];
  }
}
