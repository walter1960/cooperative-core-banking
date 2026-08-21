import '../constants/bceao_constants.dart';
import '../utils/currency_formatter.dart';
import '../utils/french_number_words.dart';

/// Immutable 64-bit Integer-based Money Value Object for Franc CFA (BCEAO XOF).
/// Guarantees zero IEEE-754 floating point arithmetic errors.
class Money implements Comparable<Money> {
  final int amountXof;
  final String currency;

  const Money(this.amountXof, {this.currency = BceaoConstants.currencyCode});

  static const Money zero = Money(0);

  // Operator overloads
  Money operator +(Money other) => Money(amountXof + other.amountXof, currency: currency);
  Money operator -(Money other) => Money(amountXof - other.amountXof, currency: currency);
  Money operator *(num multiplier) => Money((amountXof * multiplier).round(), currency: currency);
  Money operator ~/(num divisor) => Money(amountXof ~/ divisor, currency: currency);

  bool operator >(Money other) => amountXof > other.amountXof;
  bool operator >=(Money other) => amountXof >= other.amountXof;
  bool operator <(Money other) => amountXof < other.amountXof;
  bool operator <=(Money other) => amountXof <= other.amountXof;

  bool get isNegative => amountXof < 0;
  bool get isZero => amountXof == 0;
  bool get isPositive => amountXof > 0;

  Money abs() => Money(amountXof.abs(), currency: currency);

  /// Human-readable formatted string: "10 000 F.CFA"
  String get formatted => CurrencyFormatter.formatXOF(amountXof);

  /// Number only string: "10 000"
  String get formattedAmountOnly => CurrencyFormatter.formatAmount(amountXof);

  /// French text representation for receipts/contracts: "DIX MILLE FRANCS CFA"
  String get inWords => FrenchNumberWords.convertToFrancsCfa(amountXof);

  @override
  int compareTo(Money other) => amountXof.compareTo(other.amountXof);

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Money && runtimeType == other.runtimeType && amountXof == other.amountXof;

  @override
  int get hashCode => amountXof.hashCode;

  @override
  String toString() => formatted;
}
