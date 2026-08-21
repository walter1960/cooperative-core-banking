import 'dart:convert';
import 'dart:typed_data';

enum PrintAlignment { left, center, right }
enum FontSize { normal, doubleHeight, doubleWidth, doubleBoth }

/// 58mm Bluetooth ESC/POS Thermal Receipt Protocol Binary Generator
class EscPosBuilder {
  final List<int> _buffer = [];

  EscPosBuilder() {
    init();
  }

  /// Reset buffer and initialize printer hardware
  EscPosBuilder init() {
    _buffer.addAll([0x1B, 0x40]); // ESC @ (Initialize)
    _buffer.addAll([0x1B, 0x74, 0x10]); // ESC t 16 (CP1252 French Latin-1)
    return this;
  }

  /// Align text buffer (Left: 0, Center: 1, Right: 2)
  EscPosBuilder align(PrintAlignment alignment) {
    int code;
    switch (alignment) {
      case PrintAlignment.left:
        code = 0x00;
        break;
      case PrintAlignment.center:
        code = 0x01;
        break;
      case PrintAlignment.right:
        code = 0x02;
        break;
    }
    _buffer.addAll([0x1B, 0x61, code]);
    return this;
  }

  /// Toggle bold font weight
  EscPosBuilder bold(bool enable) {
    _buffer.addAll([0x1B, 0x45, enable ? 0x01 : 0x00]);
    return this;
  }

  /// Set font dimensions
  EscPosBuilder size(FontSize size) {
    int code;
    switch (size) {
      case FontSize.normal:
        code = 0x00;
        break;
      case FontSize.doubleHeight:
        code = 0x01;
        break;
      case FontSize.doubleWidth:
        code = 0x10;
        break;
      case FontSize.doubleBoth:
        code = 0x11;
        break;
    }
    _buffer.addAll([0x1D, 0x21, code]);
    return this;
  }

  /// Map text with French accented characters into CP1252 single-byte codes
  EscPosBuilder text(String str) {
    for (int i = 0; i < str.length; i++) {
      final codeUnit = str.codeUnitAt(i);
      int byte = codeUnit;
      switch (codeUnit) {
        case 0x00E9: byte = 0xE9; break; // é
        case 0x00E8: byte = 0xE8; break; // è
        case 0x00EA: byte = 0xEA; break; // ê
        case 0x00EB: byte = 0xEB; break; // ë
        case 0x00E0: byte = 0xE0; break; // à
        case 0x00E2: byte = 0xE2; break; // â
        case 0x00E7: byte = 0xE7; break; // ç
        case 0x00EE: byte = 0xEE; break; // î
        case 0x00EF: byte = 0xEF; break; // ï
        case 0x00F4: byte = 0xF4; break; // ô
        case 0x00F9: byte = 0xF9; break; // ù
        case 0x00FB: byte = 0xFB; break; // û
        case 0x00B0: byte = 0xB0; break; // °
        default:
          if (codeUnit > 0xFF) byte = 0x3F; // '?' for unmapped unicode
          break;
      }
      _buffer.add(byte);
    }
    return this;
  }

  /// Print text followed by Line Feed (0x0A)
  EscPosBuilder line([String str = '']) {
    text(str);
    _buffer.add(0x0A);
    return this;
  }

  /// Single line separator (default 32 chars)
  EscPosBuilder separator([int width = 32, String char = '-']) {
    return line(char * width);
  }

  /// Double line separator (default 32 chars)
  EscPosBuilder doubleSeparator([int width = 32]) {
    return line('=' * width);
  }

  /// Left/Right padded key-value pair formatted to exact line width
  EscPosBuilder keyValue(String label, String value, {int totalWidth = 32}) {
    final spacesCount = totalWidth - label.length - value.length;
    if (spacesCount > 0) {
      line(label + (' ' * spacesCount) + value);
    } else {
      line('$label: $value');
    }
    return this;
  }

  /// Feed n lines
  EscPosBuilder feed([int lines = 1]) {
    _buffer.addAll([0x1B, 0x64, lines]);
    return this;
  }

  /// Partial paper cut command
  EscPosBuilder cut({bool partial = true}) {
    feed(3);
    _buffer.addAll([0x1D, 0x56, partial ? 0x42 : 0x41, 0x03]);
    return this;
  }

  /// Render 2D QR Code (Model 2, Error Correction Level M)
  EscPosBuilder qrCode(String data, {int moduleSize = 4}) {
    final dataBytes = utf8.encode(data);
    final len = dataBytes.length + 3;
    final pL = len % 256;
    final pH = len ~/ 256;

    // 1. Select Model 2
    _buffer.addAll([0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]);

    // 2. Set Module Size (default 4)
    _buffer.addAll([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, moduleSize]);

    // 3. Error Correction Level M (0x31)
    _buffer.addAll([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31]);

    // 4. Store Data in QR buffer
    _buffer.addAll([0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30]);
    _buffer.addAll(dataBytes);

    // 5. Print QR symbol
    _buffer.addAll([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]);

    return this;
  }

  /// Export generated raw byte stream
  Uint8List build() => Uint8List.fromList(_buffer);

  List<int> get rawBytes => List.unmodifiable(_buffer);
}
