import 'dart:convert';
import 'package:http/http.dart' as http;
import '../errors/exceptions.dart';
import 'network_info.dart';

/// REST API Client with interceptors and error normalization
class ApiClient {
  final http.Client httpClient;
  final NetworkInfo networkInfo;
  final String baseUrl;
  String? _authToken;

  ApiClient({
    required this.httpClient,
    required this.networkInfo,
    this.baseUrl = 'https://core.banolia.org/api/v1',
  });

  void setAuthToken(String? token) {
    _authToken = token;
  }

  Map<String, String> _buildHeaders([Map<String, String>? customHeaders]) {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    if (customHeaders != null) {
      headers.addAll(customHeaders);
    }
    return headers;
  }

  Future<dynamic> get(String path, {Map<String, String>? headers, Map<String, dynamic>? queryParams}) async {
    if (!await networkInfo.isConnected) {
      throw const NetworkException('Aucune connexion réseau disponible');
    }

    Uri uri = Uri.parse('$baseUrl$path');
    if (queryParams != null && queryParams.isNotEmpty) {
      uri = uri.replace(queryParameters: queryParams.map((k, v) => MapEntry(k, v.toString())));
    }

    try {
      final response = await httpClient.get(uri, headers: _buildHeaders(headers));
      return _processResponse(response);
    } on AppException {
      rethrow;
    } catch (e) {
      throw NetworkException('Erreur de communication avec le serveur: $e');
    }
  }

  Future<dynamic> post(String path, {dynamic body, Map<String, String>? headers}) async {
    if (!await networkInfo.isConnected) {
      throw const NetworkException('Aucune connexion réseau disponible');
    }

    final uri = Uri.parse('$baseUrl$path');
    try {
      final response = await httpClient.post(
        uri,
        headers: _buildHeaders(headers),
        body: body != null ? jsonEncode(body) : null,
      );
      return _processResponse(response);
    } on AppException {
      rethrow;
    } catch (e) {
      throw NetworkException('Erreur de communication avec le serveur: $e');
    }
  }

  dynamic _processResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      try {
        return jsonDecode(response.body);
      } catch (_) {
        return response.body;
      }
    } else if (response.statusCode == 401 || response.statusCode == 403) {
      throw ServerException('Session expirée ou non autorisée', 'AUTH_ERROR', response.statusCode);
    } else if (response.statusCode == 404) {
      throw ServerException('Ressource introuvable', 'NOT_FOUND', response.statusCode);
    } else {
      String message = 'Erreur serveur (${response.statusCode})';
      try {
        final data = jsonDecode(response.body);
        if (data is Map && data.containsKey('message')) {
          message = data['message'].toString();
        }
      } catch (_) {}
      throw ServerException(message, 'SERVER_ERROR', response.statusCode);
    }
  }
}
