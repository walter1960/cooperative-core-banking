/**
 * BANOLIA Desktop — ESC/POS Command Byte Builder
 * Generates raw ESC/POS binary byte arrays for USB/Serial/Network thermal printers.
 * Supports CP1252 French character mapping, 2D QR codes, cash drawer pulse, and auto-cut.
 */

export class EscPosBuilder {
  private buffer: number[] = [];

  constructor() {
    this.init();
  }

  /**
   * Initializes printer hardware and selects Code Page 1252 (Western European)
   */
  public init(): this {
    this.buffer.push(0x1B, 0x40); // ESC @ (Reset/Init)
    this.buffer.push(0x1B, 0x74, 0x10); // ESC t 16 (CP1252 / WPC1252)
    return this;
  }

  /**
   * Sets text alignment (LEFT, CENTER, RIGHT)
   */
  public align(alignment: 'LEFT' | 'CENTER' | 'RIGHT'): this {
    const code = alignment === 'LEFT' ? 0x00 : alignment === 'CENTER' ? 0x01 : 0x02;
    this.buffer.push(0x1B, 0x61, code); // ESC a n
    return this;
  }

  /**
   * Enables or disables bold text
   */
  public bold(enable: boolean = true): this {
    this.buffer.push(0x1B, 0x45, enable ? 0x01 : 0x00); // ESC E n
    return this;
  }

  /**
   * Sets text sizing (NORMAL, DOUBLE_HEIGHT, DOUBLE_WIDTH, DOUBLE_BOTH)
   */
  public size(size: 'NORMAL' | 'DOUBLE_HEIGHT' | 'DOUBLE_WIDTH' | 'DOUBLE_BOTH'): this {
    const code =
      size === 'NORMAL' ? 0x00 :
      size === 'DOUBLE_HEIGHT' ? 0x01 :
      size === 'DOUBLE_WIDTH' ? 0x10 : 0x11;
    this.buffer.push(0x1D, 0x21, code); // GS ! n
    return this;
  }

  /**
   * Appends text string encoded to CP1252
   */
  public text(str: string): this {
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      let byte = charCode;

      // Handle French Accents in CP1252
      switch (charCode) {
        case 0x00E9: byte = 0xE9; break; // é
        case 0x00E8: byte = 0xE8; break; // è
        case 0x00E0: byte = 0xE0; break; // à
        case 0x00E7: byte = 0xE7; break; // ç
        case 0x00F9: byte = 0xF9; break; // ù
        case 0x00EA: byte = 0xEA; break; // ê
        case 0x00EB: byte = 0xEB; break; // ë
        case 0x00EE: byte = 0xEE; break; // î
        case 0x00EF: byte = 0xEF; break; // ï
        case 0x00F4: byte = 0xF4; break; // ô
        case 0x00FB: byte = 0xFB; break; // û
        case 0x00B0: byte = 0xB0; break; // °
        case 0x00C9: byte = 0xC9; break; // É
        case 0x00C8: byte = 0xC8; break; // È
        case 0x00C0: byte = 0xC0; break; // À
        case 0x00C7: byte = 0xC7; break; // Ç
        default:
          if (charCode > 0xFF) {
            byte = 0x3F; // '?' for unmapped unicode
          }
          break;
      }

      this.buffer.push(byte);
    }
    return this;
  }

  /**
   * Appends text followed by Line Feed (0x0A)
   */
  public line(str: string = ''): this {
    this.text(str);
    this.buffer.push(0x0A); // LF
    return this;
  }

  /**
   * Prints horizontal single separator line
   */
  public separator(width: number = 48, char: string = '-'): this {
    return this.line(char.repeat(width));
  }

  /**
   * Prints horizontal double separator line
   */
  public doubleSeparator(width: number = 48): this {
    return this.line('='.repeat(width));
  }

  /**
   * Two-column key-value formatted line (Left-aligned key, Right-aligned value)
   */
  public twoColumn(left: string, right: string, totalWidth: number = 48): this {
    const spaceCount = Math.max(1, totalWidth - left.length - right.length);
    const formatted = left + ' '.repeat(spaceCount) + right;
    return this.line(formatted);
  }

  /**
   * Feeds N lines
   */
  public feed(lines: number = 1): this {
    this.buffer.push(0x1B, 0x64, lines); // ESC d n
    return this;
  }

  /**
   * Sends pulse to open cash drawer connected to RJ11/RJ12 port (ESC p 0 25 250)
   */
  public kickCashDrawer(): this {
    this.buffer.push(0x1B, 0x70, 0x00, 0x19, 0xFA);
    return this;
  }

  /**
   * Executes paper cut (partial or full)
   */
  public cut(partial: boolean = true): this {
    this.feed(3);
    this.buffer.push(0x1D, 0x56, partial ? 0x42 : 0x41, 0x03); // GS V m n
    return this;
  }

  /**
   * Generates native ESC/POS 2D QR Code (Model 2, Error Correction Level M)
   */
  public qrCode(data: string, moduleSize: number = 4): this {
    const dataBytes = Array.from(new TextEncoder().encode(data));
    const len = dataBytes.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);

    // 1. QR Code Model 2: GS ( k 04 00 31 41 32 00
    this.buffer.push(0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
    // 2. Module Size: GS ( k 03 00 31 43 n
    this.buffer.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, moduleSize);
    // 3. Error Correction Level M: GS ( k 03 00 31 45 31
    this.buffer.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31);
    // 4. Store QR Data: GS ( k pL pH 31 50 30 <data>
    this.buffer.push(0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30, ...dataBytes);
    // 5. Print QR from buffer: GS ( k 03 00 31 51 30
    this.buffer.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30);

    return this;
  }

  /**
   * Returns final raw byte array
   */
  public build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}
