import 'package:intl/intl.dart';

/// Currency and number formatting utilities for BCEAO XOF
class CurrencyFormatter {
  CurrencyFormatter._();

  static final NumberFormat _xofNumberFormat = NumberFormat('#,##0', 'fr_FR');

  /// Format an integer amount into "10 000 F.CFA"
  static String formatXOF(int amount, {String symbol = 'F.CFA'}) {
    final sign = amount < 0 ? '-' : '';
    final formatted = _xofNumberFormat.format(amount.abs()).replaceAll('\u00A0', ' ').replaceAll('\u202F', ' ');
    return '$sign$formatted $symbol';
  }

  /// Format an integer amount without the currency symbol: "10 000"
  static String formatAmount(int amount) {
    final sign = amount < 0 ? '-' : '';
    final formatted = _xofNumberFormat.format(amount.abs()).replaceAll('\u00A0', ' ').replaceAll('\u202F', ' ');
    return '$sign$formatted';
  }

  /// Parse a formatted string into integer XOF
  static int parseXOF(String text) {
    final clean = text
        .replaceAll('F.CFA', '')
        .replaceAll('XOF', '')
        .replaceAll('CFA', '')
        .replaceAll(' ', '')
        .replaceAll('\u00A0', '')
        .replaceAll('\u202F', '')
        .trim();
    return int.tryParse(clean) ?? 0;
  }
}
