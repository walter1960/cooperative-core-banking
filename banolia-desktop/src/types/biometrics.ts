export interface Minutia {
  x: number; // 0 .. 16383 (14 bits)
  y: number; // 0 .. 16383 (14 bits)
  angle: number; // 0 .. 255 (representing 0 .. 2*PI radians)
  type: 'ENDING' | 'BIFURCATION' | 'OTHER';
  quality: number; // 0 .. 100
}

export interface Iso19794Template {
  formatVersion: string; // ' 20\0'
  recordLength: number;
  cbeffProductId: number;
  imageWidth: number;
  imageHeight: number;
  xResolution: number;
  yResolution: number;
  fingerPosition: number; // 1=Right Thumb, 2=Right Index, etc.
  fingerQuality: number; // 0 .. 100
  minutiae: Minutia[];
  rawBytes?: Uint8Array;
}

export interface BiometricMatchResult {
  matched: boolean;
  score: number; // 0 .. 100
  matchedMinutiaeCount: number;
  memberCode?: string;
  durationMs: number;
  status: 'SUCCESS' | 'NO_MATCH' | 'POOR_QUALITY' | 'TIMEOUT' | 'DEVICE_ERROR';
}

export interface BiometricEnrolment {
  memberCode: string;
  fingerPosition: number;
  templateBase64: string;
  enrolledAt: string;
  quality: number;
}
