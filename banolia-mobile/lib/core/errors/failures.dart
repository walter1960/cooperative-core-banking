/// Base failure class for Clean Architecture domain layer
abstract class Failure {
  final String message;
  final String? code;

  const Failure(this.message, [this.code]);

  @override
  String toString() => '$runtimeType: $message${code != null ? ' ($code)' : ''}';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Failure &&
          runtimeType == other.runtimeType &&
          message == other.message &&
          code == other.code;

  @override
  int get hashCode => Object.hash(runtimeType, message, code);
}

class ServerFailure extends Failure {
  final int? statusCode;
  const ServerFailure(super.message, [super.code, this.statusCode]);
}

class NetworkFailure extends Failure {
  const NetworkFailure([super.message = 'Erreur de connexion réseau', super.code = 'NETWORK_ERROR']);
}

class CacheFailure extends Failure {
  const CacheFailure([super.message = 'Erreur d\'accès au stockage local', super.code = 'CACHE_ERROR']);
}

class AuthFailure extends Failure {
  const AuthFailure(super.message, [super.code = 'AUTH_ERROR']);
}

class InsufficientBalanceFailure extends Failure {
  final int requiredAmount;
  final int availableAmount;

  const InsufficientBalanceFailure({
    required String message,
    required this.requiredAmount,
    required this.availableAmount,
    String? code = 'INSUFFICIENT_BALANCE',
  }) : super(message, code);
}

class UsuryViolationFailure extends Failure {
  final double calculatedTeg;
  final double usuryCeiling;

  const UsuryViolationFailure({
    required String message,
    required this.calculatedTeg,
    required this.usuryCeiling,
    String? code = 'USURY_CEILING_EXCEEDED',
  }) : super(message, code);
}

class InvalidHashChainFailure extends Failure {
  final int brokenSequenceNumber;
  final String expectedHash;
  final String actualHash;

  const InvalidHashChainFailure({
    required String message,
    required this.brokenSequenceNumber,
    required this.expectedHash,
    required this.actualHash,
    String? code = 'HASH_CHAIN_INTEGRITY_VIOLATION',
  }) : super(message, code);
}

class DiscrepancyFailure extends Failure {
  final int physicalAmount;
  final int journalAmount;
  final int discrepancyAmount;

  const DiscrepancyFailure({
    required String message,
    required this.physicalAmount,
    required this.journalAmount,
    required this.discrepancyAmount,
    String? code = 'CASH_DISCREPANCY',
  }) : super(message, code);
}

class PrinterFailure extends Failure {
  const PrinterFailure(super.message, [super.code = 'PRINTER_ERROR']);
}

class MobileMoneyFailure extends Failure {
  final String? operatorCode;
  const MobileMoneyFailure(super.message, [super.code = 'MOMO_ERROR', this.operatorCode]);
}
