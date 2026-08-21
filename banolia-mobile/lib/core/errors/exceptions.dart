/// Base exception for all Banolia mobile exceptions
abstract class AppException implements Exception {
  final String message;
  final String? code;

  const AppException(this.message, [this.code]);

  @override
  String toString() => '$runtimeType: $message${code != null ? ' (Code: $code)' : ''}';
}

class ServerException extends AppException {
  final int? statusCode;
  const ServerException(super.message, [super.code, this.statusCode]);
}

class NetworkException extends AppException {
  const NetworkException(super.message, [super.code]);
}

class CacheException extends AppException {
  const CacheException(super.message, [super.code]);
}

class AuthException extends AppException {
  const AuthException(super.message, [super.code]);
}

class InsufficientBalanceException extends AppException {
  final int requiredAmount;
  final int availableAmount;

  const InsufficientBalanceException({
    required String message,
    required this.requiredAmount,
    required this.availableAmount,
    String? code,
  }) : super(message, code);
}

class UsuryViolationException extends AppException {
  final double calculatedTeg;
  final double usuryCeiling;

  const UsuryViolationException({
    required String message,
    required this.calculatedTeg,
    required this.usuryCeiling,
    String? code,
  }) : super(message, code);
}

class InvalidHashChainException extends AppException {
  final int brokenSequenceNumber;
  final String expectedHash;
  final String actualHash;

  const InvalidHashChainException({
    required String message,
    required this.brokenSequenceNumber,
    required this.expectedHash,
    required this.actualHash,
  }) : super(message, 'HASH_CHAIN_INTEGRITY_VIOLATION');
}

class DiscrepancyException extends AppException {
  final int physicalAmount;
  final int journalAmount;
  final int discrepancyAmount;

  const DiscrepancyException({
    required String message,
    required this.physicalAmount,
    required this.journalAmount,
    required this.discrepancyAmount,
  }) : super(message, 'CASH_DISCREPANCY');
}

class HardwarePrinterException extends AppException {
  const HardwarePrinterException(super.message, [super.code]);
}

class MobileMoneyGatewayException extends AppException {
  final String? providerError;
  const MobileMoneyGatewayException(super.message, [super.code, this.providerError]);
}
