import { Iso19794Template, BiometricMatchResult } from '../../types/biometrics';

export interface IBiometricDriver {
  initialize(): Promise<boolean>;
  isAvailable(): Promise<boolean>;
  captureLive(timeoutMs?: number): Promise<Iso19794Template>;
  verify1to1(probe: Iso19794Template, reference: Iso19794Template): Promise<BiometricMatchResult>;
  identify1toN(
    probe: Iso19794Template,
    candidates: Array<{ memberCode: string; template: Iso19794Template }>
  ): Promise<BiometricMatchResult>;
}
