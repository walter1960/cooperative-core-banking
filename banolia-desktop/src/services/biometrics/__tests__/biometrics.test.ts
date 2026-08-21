import { describe, it, expect } from 'vitest';
import { Iso19794Parser } from '../Iso19794Parser';
import { MinutiaeMatcher } from '../MinutiaeMatcher';
import { MockBiometricDriver } from '../MockBiometricDriver';
import { Iso19794Template, Minutia } from '../../../types/biometrics';

describe('ISO 19794-2 Biometrics Unit Tests', () => {
  const driver = new MockBiometricDriver();

  describe('Iso19794Parser Serialization & Parsing', () => {
    it('should serialize and parse ISO/IEC 19794-2:2005 binary template without loss', () => {
      const minutiae: Minutia[] = [
        { x: 150, y: 220, angle: 45, type: 'ENDING', quality: 90 },
        { x: 280, y: 310, angle: 180, type: 'BIFURCATION', quality: 85 },
        { x: 340, y: 120, angle: 90, type: 'ENDING', quality: 75 },
        { x: 410, y: 400, angle: 250, type: 'OTHER', quality: 60 }
      ];

      const template: Iso19794Template = {
        formatVersion: ' 20\0',
        recordLength: 30 + minutiae.length * 6,
        cbeffProductId: 0x0033,
        imageWidth: 500,
        imageHeight: 500,
        xResolution: 197,
        yResolution: 197,
        fingerPosition: 2, // Right Index
        fingerQuality: 88,
        minutiae
      };

      const buffer = Iso19794Parser.serialize(template);
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBe(30 + 4 * 6); // 54 bytes

      // Verify Magic 'FMR\0'
      const view = new DataView(buffer.buffer);
      expect(view.getUint32(0, false)).toBe(0x464D5200);

      // Parse back
      const parsed = Iso19794Parser.parse(buffer);
      expect(parsed.fingerPosition).toBe(2);
      expect(parsed.fingerQuality).toBe(88);
      expect(parsed.minutiae).toHaveLength(4);

      expect(parsed.minutiae[0].x).toBe(150);
      expect(parsed.minutiae[0].y).toBe(220);
      expect(parsed.minutiae[0].angle).toBe(45);
      expect(parsed.minutiae[0].type).toBe('ENDING');
      expect(parsed.minutiae[0].quality).toBe(90);

      expect(parsed.minutiae[1].type).toBe('BIFURCATION');
    });

    it('should throw an error for corrupt or invalid header bytes', () => {
      const invalidBuffer = new Uint8Array([0x00, 0x00, 0x00, 0x00, 1, 2, 3, 4]);
      expect(() => Iso19794Parser.parse(invalidBuffer)).toThrow();
    });
  });

  describe('MinutiaeMatcher 1:1 Verification', () => {
    it('should authenticate genuine member probe with score >= 80%', () => {
      const memberCode = 'A0200225';
      const reference = driver.generateDeterministicTemplate(memberCode, 0);
      const probe = driver.generateDeterministicTemplate(memberCode, 2); // 2px spatial jitter

      const result = MinutiaeMatcher.match(probe, reference);
      expect(result.matched).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.status).toBe('SUCCESS');
    });

    it('should reject impostor member probe with score < 30%', () => {
      const refMember = 'A0200225';
      const impostorMember = 'A0200226';

      const reference = driver.generateDeterministicTemplate(refMember, 0);
      const probe = driver.generateDeterministicTemplate(impostorMember, 0);

      const result = MinutiaeMatcher.match(probe, reference);
      expect(result.matched).toBe(false);
      expect(result.score).toBeLessThan(30);
      expect(result.status).toBe('NO_MATCH');
    });
  });

  describe('MinutiaeMatcher 1:N Identification', () => {
    it('should identify the correct member code among candidate enrolled database', () => {
      const enrolledCodes = ['A0200225', 'A0200226', 'A0200227', 'A0200228'];
      const candidates = enrolledCodes.map(code => ({
        memberCode: code,
        template: driver.generateDeterministicTemplate(code, 0)
      }));

      // Test with probe of member A0200227 (with jitter)
      const probe = driver.generateDeterministicTemplate('A0200227', 2);
      const result = MinutiaeMatcher.identify1toN(probe, candidates);

      expect(result.matched).toBe(true);
      expect(result.memberCode).toBe('A0200227');
      expect(result.score).toBeGreaterThanOrEqual(80);
    });
  });

  describe('MockBiometricDriver Simulation', () => {
    it('should simulate live capture with deterministic output and realistic delay', async () => {
      await driver.initialize();
      const template = await driver.captureLive(5000, 'A0200225');

      expect(template.minutiae.length).toBeGreaterThan(20);
      expect(template.rawBytes).toBeDefined();
    });
  });
});
