import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

enum PrinterStatus { disconnected, scanning, connecting, connected, printing, error }

class BluetoothPrinterDevice {
  final String name;
  final String address;
  final int? rssi;

  const BluetoothPrinterDevice({
    required this.name,
    required this.address,
    this.rssi,
  });
}

class PrintResult {
  final bool success;
  final int bytesSent;
  final String? errorMessage;
  final Duration duration;

  const PrintResult({
    required this.success,
    required this.bytesSent,
    this.errorMessage,
    required this.duration,
  });
}

abstract class BluetoothPrinterDriver {
  Future<List<BluetoothPrinterDevice>> scanDevices({Duration timeout = const Duration(seconds: 4)});
  Future<bool> connect(String address);
  Future<bool> disconnect();
  Future<bool> isConnected();
  Future<PrintResult> sendRawBytes(Uint8List bytes);
  Stream<PrinterStatus> get statusStream;
}

/// Virtual Thermal Printer Mock for testing and headless execution
class VirtualThermalPrinterMock implements BluetoothPrinterDriver {
  bool _connected = false;
  final List<Uint8List> _receivedJobs = [];
  final StreamController<PrinterStatus> _statusController = StreamController<PrinterStatus>.broadcast();

  @override
  Future<List<BluetoothPrinterDevice>> scanDevices({Duration timeout = const Duration(seconds: 4)}) async {
    return const [
      BluetoothPrinterDevice(name: 'POS-5802-TERRAIN', address: '00:11:22:33:44:55', rssi: -45),
      BluetoothPrinterDevice(name: 'MPT-II-THERMAL', address: 'AA:BB:CC:DD:EE:FF', rssi: -60),
    ];
  }

  @override
  Future<bool> connect(String address) async {
    _connected = true;
    _statusController.add(PrinterStatus.connected);
    return true;
  }

  @override
  Future<bool> disconnect() async {
    _connected = false;
    _statusController.add(PrinterStatus.disconnected);
    return true;
  }

  @override
  Future<bool> isConnected() async => _connected;

  @override
  Future<PrintResult> sendRawBytes(Uint8List bytes) async {
    if (!_connected) {
      return const PrintResult(
        success: false,
        bytesSent: 0,
        errorMessage: 'Imprimante non connectée',
        duration: Duration.zero,
      );
    }
    _receivedJobs.add(bytes);
    return PrintResult(
      success: true,
      bytesSent: bytes.length,
      duration: const Duration(milliseconds: 10),
    );
  }

  @override
  Stream<PrinterStatus> get statusStream => _statusController.stream;

  List<Uint8List> get receivedJobs => List.unmodifiable(_receivedJobs);

  void clearJobs() => _receivedJobs.clear();

  /// Extract raw text printed on receipt (decodes CP1252 bytes)
  String renderLastReceiptAsText() {
    if (_receivedJobs.isEmpty) return '';
    final bytes = _receivedJobs.last;
    final buffer = StringBuffer();

    int i = 0;
    while (i < bytes.length) {
      final b = bytes[i];

      // ESC @ (Init)
      if (b == 0x1B && i + 1 < bytes.length && bytes[i + 1] == 0x40) {
        i += 2;
        continue;
      }
      // ESC t n (Codepage)
      if (b == 0x1B && i + 2 < bytes.length && bytes[i + 1] == 0x74) {
        i += 3;
        continue;
      }
      // ESC a n (Align)
      if (b == 0x1B && i + 2 < bytes.length && bytes[i + 1] == 0x61) {
        i += 3;
        continue;
      }
      // ESC E n (Bold)
      if (b == 0x1B && i + 2 < bytes.length && bytes[i + 1] == 0x45) {
        i += 3;
        continue;
      }
      // ESC d n (Feed)
      if (b == 0x1B && i + 2 < bytes.length && bytes[i + 1] == 0x64) {
        i += 3;
        continue;
      }
      // GS ! n (Size)
      if (b == 0x1D && i + 2 < bytes.length && bytes[i + 1] == 0x21) {
        i += 3;
        continue;
      }
      // GS V m n (Cut)
      if (b == 0x1D && i + 3 < bytes.length && bytes[i + 1] == 0x56) {
        i += 4;
        continue;
      }
      // GS ( k ... (QR Code)
      if (b == 0x1D && i + 2 < bytes.length && bytes[i + 1] == 0x28 && bytes[i + 2] == 0x6B) {
        final pL = bytes[i + 3];
        final pH = bytes[i + 4];
        final len = pL + (pH * 256);
        i += 5 + len;
        continue;
      }

      if (b == 0x0A) {
        buffer.writeln();
      } else if (b >= 32 && b <= 126) {
        buffer.writeCharCode(b);
      } else {
        // CP1252 French accented characters
        switch (b) {
          case 0xE9: buffer.write('é'); break;
          case 0xE8: buffer.write('è'); break;
          case 0xEA: buffer.write('ê'); break;
          case 0xEB: buffer.write('ë'); break;
          case 0xE0: buffer.write('à'); break;
          case 0xE2: buffer.write('â'); break;
          case 0xE7: buffer.write('ç'); break;
          case 0xEE: buffer.write('î'); break;
          case 0xEF: buffer.write('ï'); break;
          case 0xF4: buffer.write('ô'); break;
          case 0xF9: buffer.write('ù'); break;
          case 0xFB: buffer.write('û'); break;
          case 0xB0: buffer.write('°'); break;
          default: buffer.write(' '); break;
        }
      }
      i++;
    }

    return buffer.toString();
  }

  /// Extract QR Code payload string if present in the last print job
  String? extractLastQrCodePayload() {
    if (_receivedJobs.isEmpty) return null;
    final bytes = _receivedJobs.last;

    for (int i = 0; i < bytes.length - 8; i++) {
      // Look for GS ( k pL pH 0x31 0x50 0x30
      if (bytes[i] == 0x1D &&
          bytes[i + 1] == 0x28 &&
          bytes[i + 2] == 0x6B &&
          bytes[i + 5] == 0x31 &&
          bytes[i + 6] == 0x50 &&
          bytes[i + 7] == 0x30) {
        final pL = bytes[i + 3];
        final pH = bytes[i + 4];
        final totalLen = pL + (pH * 256);
        final dataLen = totalLen - 3;
        final dataBytes = bytes.sublist(i + 8, i + 8 + dataLen);
        return utf8.decode(dataBytes);
      }
    }
    return null;
  }
}
