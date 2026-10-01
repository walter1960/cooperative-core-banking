import 'dart:convert';
import 'package:http/http.dart' as http;

/// Service d'envoi en direct des demandes mobiles vers le Core Banking
class MobileRequestService {
  MobileRequestService._();
  static final MobileRequestService instance = MobileRequestService._();

  // Liste des endpoints cibles (USB reverse localhost & WiFi LAN)
  static final List<String> _candidateServers = [
    'http://127.0.0.1:3000',     // Via USB ADB reverse
    'http://192.168.1.116:3000', // Via réseau local WiFi
    'http://10.0.2.2:3000',      // Émulateur fallback
  ];

  static String _customServerUrl = '';

  static void setServerUrl(String url) {
    _customServerUrl = url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  static String get serverUrl => _customServerUrl.isNotEmpty ? _customServerUrl : _candidateServers.first;

  /// Transmettre une demande de prêt au Core Banking Desktop
  static Future<bool> submitLoanRequest({
    required String requestNumber,
    required String memberCode,
    required String memberName,
    required String memberPhone,
    required int amount,
    required int durationMonths,
    required double interestRate,
    required int estimatedMonthlyPayment,
    required String purpose,
    String? guarantorName,
    String? attachmentName,
    String? writtenStatement,
  }) async {
    final body = {
      'type': 'LOAN',
      'requestNumber': requestNumber,
      'memberCode': memberCode,
      'memberName': memberName,
      'memberPhone': memberPhone,
      'amount': amount,
      'durationMonths': durationMonths,
      'interestRate': interestRate,
      'estimatedMonthlyPayment': estimatedMonthlyPayment,
      'purpose': purpose,
      'guarantorName': guarantorName ?? '',
      'attachmentName': attachmentName ?? '',
      'writtenStatement': writtenStatement ?? '',
      'notes': 'Soumis depuis l\'application mobile par le sociétaire',
    };
    return _postWithFailover('/api/mobile/requests', body);
  }

  /// Transmettre une demande de retrait au Core Banking Desktop
  static Future<bool> submitWithdrawalRequest({
    required String requestNumber,
    required String memberCode,
    required String memberName,
    required String memberPhone,
    required int amount,
    required String purpose,
    required String selectedAccount,
    required String selectedAgency,
  }) async {
    final body = {
      'type': 'WITHDRAWAL',
      'requestNumber': requestNumber,
      'memberCode': memberCode,
      'memberName': memberName,
      'memberPhone': memberPhone,
      'amount': amount,
      'purpose': purpose,
      'selectedAccount': selectedAccount,
      'selectedAgency': selectedAgency,
      'notes': 'Retrait partiel soumis depuis l\'application mobile',
    };
    return _postWithFailover('/api/mobile/requests', body);
  }

  static Future<bool> _postWithFailover(String path, Map<String, dynamic> body) async {
    final targets = <String>[];
    if (_customServerUrl.isNotEmpty) {
      targets.add(_customServerUrl);
    }
    targets.addAll(_candidateServers);

    for (final base in targets) {
      try {
        final uri = Uri.parse('$base$path');
        final response = await http
            .post(
              uri,
              headers: {'Content-Type': 'application/json'},
              body: jsonEncode(body),
            )
            .timeout(const Duration(seconds: 4));

        if (response.statusCode >= 200 && response.statusCode < 300) {
          return true;
        }
      } catch (e) {
        // Essayer le serveur suivant
        continue;
      }
    }
    return false;
  }
}
