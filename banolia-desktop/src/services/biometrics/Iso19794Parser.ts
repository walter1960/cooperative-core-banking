import { Iso19794Template, Minutia } from '../../types/biometrics';

/**
 * BANOLIA Desktop — ISO/IEC 19794-2:2005 Finger Minutiae Record (FMR) Parser & Serializer
 * Compliant with standard 24-byte general record header, 4-byte finger view header, and 6-byte minutiae records.
 */
export class Iso19794Parser {
  private static readonly MAGIC = 0x464D5200; // "FMR\0"
  private static readonly VERSION_20 = 0x20323000; // " 20\0"

  /**
   * Parses binary buffer into Iso19794Template object
   */
  public static parse(buffer: Uint8Array): Iso19794Template {
    if (buffer.length < 30) {
      throw new Error(`Buffer too short for ISO 19794-2 header: ${buffer.length} bytes (minimum 30 bytes required)`);
    }

    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    const magic = view.getUint32(0, false);
    if (magic !== this.MAGIC) {
      throw new Error(`Invalid ISO 19794-2 Magic header: 0x${magic.toString(16).toUpperCase()} (expected 0x464D5200)`);
    }

    const totalLength = view.getUint32(8, false);
    const cbeffProductId = view.getUint16(12, false);
    const imageWidth = view.getUint16(16, false);
    const imageHeight = view.getUint16(18, false);
    const xResolution = view.getUint16(20, false);
    const yResolution = view.getUint16(22, false);

    const fingerPosition = view.getUint8(26);
    const fingerQuality = view.getUint8(28);
    const minutiaeCount = view.getUint8(29);

    const minutiae: Minutia[] = [];
    let offset = 30;

    for (let i = 0; i < minutiaeCount; i++) {
      if (offset + 6 > buffer.length) break;

      const raw01 = view.getUint16(offset, false);
      const typeBits = (raw01 >> 14) & 0x03;
      const x = raw01 & 0x3FFF;

      const raw23 = view.getUint16(offset + 2, false);
      const y = raw23 & 0x3FFF;

      const angle = view.getUint8(offset + 4);
      const quality = view.getUint8(offset + 5);

      let type: Minutia['type'] = 'OTHER';
      if (typeBits === 1) type = 'ENDING';
      else if (typeBits === 2) type = 'BIFURCATION';

      minutiae.push({ x, y, angle, type, quality });
      offset += 6;
    }

    return {
      formatVersion: ' 20\0',
      recordLength: totalLength,
      cbeffProductId,
      imageWidth,
      imageHeight,
      xResolution,
      yResolution,
      fingerPosition,
      fingerQuality,
      minutiae,
      rawBytes: buffer
    };
  }

  /**
   * Serializes Iso19794Template object into standard ISO/IEC 19794-2:2005 binary buffer
   */
  public static serialize(template: Iso19794Template): Uint8Array {
    const minutiaeCount = template.minutiae.length;
    const totalLength = 30 + minutiaeCount * 6;
    const buffer = new Uint8Array(totalLength);
    const view = new DataView(buffer.buffer);

    // General Record Header (24 Bytes)
    view.setUint32(0, this.MAGIC, false); // 'FMR\0'
    view.setUint32(4, this.VERSION_20, false); // ' 20\0'
    view.setUint32(8, totalLength, false);
    view.setUint16(12, template.cbeffProductId || 0x0033, false);
    view.setUint16(14, 0x0000, false); // Device ID
    view.setUint16(16, template.imageWidth || 500, false);
    view.setUint16(18, template.imageHeight || 500, false);
    view.setUint16(20, template.xResolution || 197, false);
    view.setUint16(22, template.yResolution || 197, false);
    view.setUint8(24, 1); // 1 finger view
    view.setUint8(25, 0); // Reserved

    // Finger View Header (4 Bytes)
    view.setUint8(26, template.fingerPosition || 2); // 2 = Right Index
    view.setUint8(27, 0x00); // View 0, Impression 0 (live plain)
    view.setUint8(28, template.fingerQuality || 85);
    view.setUint8(29, minutiaeCount);

    // Minutiae Array (6 * N Bytes)
    let offset = 30;
    for (const m of template.minutiae) {
      let typeBits = 0;
      if (m.type === 'ENDING') typeBits = 1;
      else if (m.type === 'BIFURCATION') typeBits = 2;

      const raw01 = (typeBits << 14) | (m.x & 0x3FFF);
      const raw23 = m.y & 0x3FFF;

      view.setUint16(offset, raw01, false);
      view.setUint16(offset + 2, raw23, false);
      view.setUint8(offset + 4, m.angle & 0xFF);
      view.setUint8(offset + 5, m.quality & 0xFF);
      offset += 6;
    }

    return buffer;
  }
}
