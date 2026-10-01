import 'package:uuid/uuid.dart';
import 'api_client.dart';
import 'network_info.dart';

class QueuedHttpRequest {
  final String id;
  final String method; // 'GET', 'POST', 'PUT', 'DELETE'
  final String path;
  final dynamic body;
  final Map<String, String>? headers;
  final String idempotencyKey;
  final DateTime createdAt;
  int retryAttempts;

  QueuedHttpRequest({
    String? id,
    required this.method,
    required this.path,
    this.body,
    this.headers,
    required this.idempotencyKey,
    DateTime? createdAt,
    this.retryAttempts = 0,
  })  : id = id ?? const Uuid().v4(),
        createdAt = createdAt ?? DateTime.now().toUtc();

  Map<String, dynamic> toJson() => {
        'id': id,
        'method': method,
        'path': path,
        'body': body,
        'headers': headers,
        'idempotency_key': idempotencyKey,
        'created_at': createdAt.toIso8601String(),
        'retry_attempts': retryAttempts,
      };

  factory QueuedHttpRequest.fromJson(Map<String, dynamic> json) {
    return QueuedHttpRequest(
      id: json['id'] as String,
      method: json['method'] as String,
      path: json['path'] as String,
      body: json['body'],
      headers: (json['headers'] as Map?)?.cast<String, String>(),
      idempotencyKey: json['idempotency_key'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      retryAttempts: json['retry_attempts'] as int? ?? 0,
    );
  }
}

class QueueFlushResult {
  final int totalProcessed;
  final int successCount;
  final int failureCount;
  final List<dynamic> results;

  const QueueFlushResult({
    required this.totalProcessed,
    required this.successCount,
    required this.failureCount,
    required this.results,
  });
}

/// Offline HTTP Request Queue for offline-first resilient sync
class OfflineRequestQueue {
  final List<QueuedHttpRequest> _queue = [];
  final NetworkInfo networkInfo;

  OfflineRequestQueue({required this.networkInfo});

  int get length => _queue.length;
  bool get isEmpty => _queue.isEmpty;
  bool get isNotEmpty => _queue.isNotEmpty;
  List<QueuedHttpRequest> get items => List.unmodifiable(_queue);

  void enqueue(QueuedHttpRequest request) {
    _queue.add(request);
  }

  void remove(String id) {
    _queue.removeWhere((r) => r.id == id);
  }

  void clear() {
    _queue.clear();
  }

  /// Flush queued requests sequentially when online
  Future<QueueFlushResult> flush(ApiClient apiClient) async {
    if (!await networkInfo.isConnected || _queue.isEmpty) {
      return QueueFlushResult(
        totalProcessed: 0,
        successCount: 0,
        failureCount: 0,
        results: [],
      );
    }

    final List<QueuedHttpRequest> pending = List.from(_queue);
    final List<dynamic> results = [];
    int successCount = 0;
    int failureCount = 0;

    for (final req in pending) {
      try {
        dynamic response;
        if (req.method.toUpperCase() == 'POST') {
          response = await apiClient.post(
            req.path,
            body: req.body,
            headers: {
              ...?req.headers,
              'X-Idempotency-Key': req.idempotencyKey,
            },
          );
        } else if (req.method.toUpperCase() == 'GET') {
          response = await apiClient.get(
            req.path,
            headers: req.headers,
          );
        }
        results.add(response);
        successCount++;
        _queue.removeWhere((r) => r.id == req.id);
      } catch (e) {
        req.retryAttempts++;
        failureCount++;
        results.add({'error': e.toString(), 'request_id': req.id});
      }
    }

    return QueueFlushResult(
      totalProcessed: pending.length,
      successCount: successCount,
      failureCount: failureCount,
      results: results,
    );
  }
}
