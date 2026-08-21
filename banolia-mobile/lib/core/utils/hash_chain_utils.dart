import 'dart:convert';
import 'package:crypto/crypto.dart';

/// Cryptographic Utilities for SHA-256 Tamper-Evident Hash Chaining and HMAC signatures
class HashChainUtils {
  HashChainUtils._();

  /// Compute SHA-256 hex string of input UTF-8 string
  static String sha256Hex(String input) {
    final bytes = utf8.encode(input);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  /// Compute Root Hash for a new Shift session:
  /// SHA-256(shiftId | collectorId | openingSalt)
  static String computeRootHash({
    required String shiftId,
    required String collectorId,
    required String openingSalt,
  }) {
    final canonical = '$shiftId|$collectorId|$openingSalt';
    return sha256Hex(canonical);
  }

  /// Compute canonical payload string for a cotisation transaction:
  /// IdempotencyKey | SeqNo | MemberCode | CardId | Amount | StampsCount | TimestampUtc
  static String computePayloadCanonical({
    required String idempotencyKey,
    required int sequenceNumber,
    required String memberCode,
    required String cardId,
    required int amount,
    required int stampsCount,
    required String timestampUtc,
  }) {
    return '$idempotencyKey|$sequenceNumber|$memberCode|$cardId|$amount|$stampsCount|$timestampUtc';
  }

  /// Compute Payload Hash: SHA-256(PayloadCanonical)
  static String computePayloadHash(String payloadCanonical) {
    return sha256Hex(payloadCanonical);
  }

  /// Compute Entry Hash: SHA-256(PrevHash | PayloadHash | SeqNo)
  static String computeEntryHash({
    required String prevHash,
    required String payloadHash,
    required int sequenceNumber,
  }) {
    final canonical = '$prevHash|$payloadHash|$sequenceNumber';
    return sha256Hex(canonical);
  }

  /// Compute HMAC-SHA-256 signature using device secret key
  static String computeHmacSignature({
    required String secretKey,
    required String entryHash,
  }) {
    final keyBytes = utf8.encode(secretKey);
    final dataBytes = utf8.encode(entryHash);
    final hmacSha256 = Hmac(sha256, keyBytes);
    final digest = hmacSha256.convert(dataBytes);
    return digest.toString();
  }

  /// Truncated 12-hex character signature for compact 2D QR offline codes
  static String computeQrTruncatedHmac({
    required String secretKey,
    required String payload,
  }) {
    final fullHmac = computeHmacSignature(secretKey: secretKey, entryHash: payload);
    return fullHmac.substring(0, 12).toUpperCase();
  }
}
