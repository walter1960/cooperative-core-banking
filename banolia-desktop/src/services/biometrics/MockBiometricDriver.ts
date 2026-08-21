import { IBiometricDriver } from './BiometricDriver';
import { Iso19794Template, Minutia, BiometricMatchResult } from '../../types/biometrics';
import { Iso19794Parser } from './Iso19794Parser';
import { MinutiaeMatcher } from './MinutiaeMatcher';

export class MockBiometricDriver implements IBiometricDriver {
  private initialized: boolean = false;

  public async initialize(): Promise<boolean> {
    this.initialized = true;
    return true;
  }

  public async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Generates deterministic ISO 19794-2 template for a member code
   */
  public generateDeterministicTemplate(
    memberCode: string,
    jitter: number = 0,
    minutiaeCount: number = 32
  ): Iso19794Template {
    let seed = 0;
    for (let i = 0; i < memberCode.length; i++) {
      seed = ((seed << 5) - seed) + memberCode.charCodeAt(i);
      seed |= 0;
    }

    const pseudoRandom = (offset: number) => {
      const x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };

    const minutiae: Minutia[] = [];
    for (let i = 0; i < minutiaeCount; i++) {
      const baseX = Math.floor(100 + pseudoRandom(i * 4 + 1) * 300);
      const baseY = Math.floor(100 + pseudoRandom(i * 4 + 2) * 300);
      const baseAngle = Math.floor(pseudoRandom(i * 4 + 3) * 256);
      const type: Minutia['type'] = i % 3 === 0 ? 'BIFURCATION' : 'ENDING';

      // Apply optional jitter for probe scans
      const jitterX = jitter > 0 ? Math.floor((pseudoRandom(i * 10 + 7) - 0.5) * 2 * jitter) : 0;
      const jitterY = jitter > 0 ? Math.floor((pseudoRandom(i * 10 + 8) - 0.5) * 2 * jitter) : 0;
      const jitterAngle = jitter > 0 ? Math.floor((pseudoRandom(i * 10 + 9) - 0.5) * 2 * (jitter / 2)) : 0;

      minutiae.push({
        x: Math.max(0, Math.min(500, baseX + jitterX)),
        y: Math.max(0, Math.min(500, baseY + jitterY)),
        angle: (baseAngle + jitterAngle + 256) % 256,
        type,
        quality: 80 + Math.floor(pseudoRandom(i) * 20)
      });
    }

    const template: Iso19794Template = {
      formatVersion: ' 20\0',
      recordLength: 30 + minutiaeCount * 6,
      cbeffProductId: 0x0033,
      imageWidth: 500,
      imageHeight: 500,
      xResolution: 197,
      yResolution: 197,
      fingerPosition: 2, // Right index
      fingerQuality: 88,
      minutiae
    };

    template.rawBytes = Iso19794Parser.serialize(template);
    return template;
  }

  /**
   * Simulates a live hardware capture with 300ms realistic sensor delay
   */
  public async captureLive(timeoutMs: number = 5000, simulatedMemberCode: string = 'A0200225'): Promise<Iso19794Template> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.generateDeterministicTemplate(simulatedMemberCode, 2); // 2px jitter
  }

  /**
   * 1:1 Verification
   */
  public async verify1to1(probe: Iso19794Template, reference: Iso19794Template): Promise<BiometricMatchResult> {
    return MinutiaeMatcher.match(probe, reference);
  }

  /**
   * 1:N Identification
   */
  public async identify1toN(
    probe: Iso19794Template,
    candidates: Array<{ memberCode: string; template: Iso19794Template }>
  ): Promise<BiometricMatchResult> {
    return MinutiaeMatcher.identify1toN(probe, candidates);
  }
}
