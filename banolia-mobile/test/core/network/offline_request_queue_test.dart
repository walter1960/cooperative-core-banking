import 'package:flutter_test/flutter_test.dart';
import 'package:banolia_mobile/core/network/api_client.dart';
import 'package:banolia_mobile/core/network/network_info.dart';
import 'package:banolia_mobile/core/network/offline_request_queue.dart';
import 'package:http/http.dart' as http;

void main() {
  group('Offline Request Queue and Network Client', () {
    late ControllableNetworkInfo networkInfo;
    late OfflineRequestQueue queue;

    setUp(() {
      networkInfo = ControllableNetworkInfo();
      queue = OfflineRequestQueue(networkInfo: networkInfo);
    });

    test('Enqueues HTTP requests when offline', () {
      final req1 = QueuedHttpRequest(
        method: 'POST',
        path: '/sync/batch',
        body: {'batch_id': 'batch-001'},
        idempotencyKey: 'idemp-001',
      );
      final req2 = QueuedHttpRequest(
        method: 'GET',
        path: '/members',
        idempotencyKey: 'idemp-002',
      );

      queue.enqueue(req1);
      queue.enqueue(req2);

      expect(queue.length, equals(2));
      expect(queue.items.first.idempotencyKey, equals('idemp-001'));
    });

    test('Does not flush when offline', () async {
      networkInfo.setOnline(false);

      final req = QueuedHttpRequest(
        method: 'POST',
        path: '/sync/batch',
        body: {'batch_id': 'batch-001'},
        idempotencyKey: 'idemp-001',
      );
      queue.enqueue(req);

      final client = ApiClient(httpClient: http.Client(), networkInfo: networkInfo);
      final result = await queue.flush(client);

      expect(result.totalProcessed, equals(0));
      expect(queue.length, equals(1));
    });

    test('Removes request by id and clears queue', () {
      final req = QueuedHttpRequest(
        method: 'POST',
        path: '/test',
        idempotencyKey: 'idemp-test',
      );
      queue.enqueue(req);
      expect(queue.length, equals(1));

      queue.remove(req.id);
      expect(queue.isEmpty, isTrue);
    });
  });
}
