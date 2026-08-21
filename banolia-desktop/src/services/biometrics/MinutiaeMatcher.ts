import { Iso19794Template, BiometricMatchResult } from '../../types/biometrics';

/**
 * BANOLIA Desktop — ISO 19794-2 Minutiae Matching Engine
 * Implements spatial and angular alignment with Euclidean distance and rotation tolerance.
 */
export class MinutiaeMatcher {
  private static readonly MAX_DISTANCE = 16; // Spatial tolerance in pixels
  private static readonly MAX_ANGLE_DIFF = 18; // Angular tolerance in degrees
  private static readonly MATCH_THRESHOLD = 70; // Score threshold for positive match

  /**
   * Matches a probe template against a stored reference template (1:1 Verification)
   */
  public static match(probe: Iso19794Template, reference: Iso19794Template): BiometricMatchResult {
    const startTime = performance.now();
    const pMin = probe.minutiae;
    const rMin = reference.minutiae;

    if (!pMin || !rMin || pMin.length === 0 || rMin.length === 0) {
      return {
        matched: false,
        score: 0,
        matchedMinutiaeCount: 0,
        durationMs: performance.now() - startTime,
        status: 'POOR_QUALITY'
      };
    }

    let maxMatchedPairs = 0;
    let bestMeanDist = 0;
    let bestMeanAngle = 0;

    // Test anchor pairs for alignment
    const sampleLimitP = Math.min(pMin.length, 12);
    const sampleLimitR = Math.min(rMin.length, 12);

    for (let i = 0; i < sampleLimitP; i++) {
      for (let j = 0; j < sampleLimitR; j++) {
        const anchorP = pMin[i];
        const anchorR = rMin[j];

        // Type match preference when quality is high
        if (anchorP.type !== anchorR.type && anchorP.quality > 50 && anchorR.quality > 50) {
          continue;
        }

        const deltaThetaRad = (anchorR.angle - anchorP.angle) * ((2 * Math.PI) / 256);
        const cosT = Math.cos(deltaThetaRad);
        const sinT = Math.sin(deltaThetaRad);

        let pairedCount = 0;
        let totalDist = 0;
        let totalAngleDiff = 0;
        const usedRefIndices = new Set<number>();

        for (let k = 0; k < pMin.length; k++) {
          const pt = pMin[k];
          const relX = pt.x - anchorP.x;
          const relY = pt.y - anchorP.y;

          const rotX = relX * cosT - relY * sinT + anchorR.x;
          const rotY = relX * sinT + relY * cosT + anchorR.y;
          const rotAngle = (pt.angle + Math.round((deltaThetaRad * 256) / (2 * Math.PI))) & 0xFF;

          let bestMatchIdx = -1;
          let bestDist = Infinity;
          let bestAngleDiff = Infinity;

          for (let l = 0; l < rMin.length; l++) {
            if (usedRefIndices.has(l)) continue;
            const refPt = rMin[l];

            const dx = rotX - refPt.x;
            const dy = rotY - refPt.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= this.MAX_DISTANCE) {
              const angleDiffUnits = Math.abs(rotAngle - refPt.angle);
              const angleDiffDeg = Math.min(angleDiffUnits, 256 - angleDiffUnits) * (360 / 256);

              if (angleDiffDeg <= this.MAX_ANGLE_DIFF && dist < bestDist) {
                bestDist = dist;
                bestAngleDiff = angleDiffDeg;
                bestMatchIdx = l;
              }
            }
          }

          if (bestMatchIdx !== -1) {
            pairedCount++;
            totalDist += bestDist;
            totalAngleDiff += bestAngleDiff;
            usedRefIndices.add(bestMatchIdx);
          }
        }

        if (pairedCount > maxMatchedPairs) {
          maxMatchedPairs = pairedCount;
          bestMeanDist = pairedCount > 0 ? totalDist / pairedCount : 0;
          bestMeanAngle = pairedCount > 0 ? totalAngleDiff / pairedCount : 0;
        }
      }
    }

    const totalMinutiaeAvg = (pMin.length + rMin.length) / 2;
    const pairRatio = maxMatchedPairs / totalMinutiaeAvg;

    const distPenalty = Math.max(0, 1 - (bestMeanDist / (2 * this.MAX_DISTANCE)));
    const anglePenalty = Math.max(0, 1 - (bestMeanAngle / (2 * this.MAX_ANGLE_DIFF)));

    const rawScore = Math.min(100, Math.round(pairRatio * distPenalty * anglePenalty * 100));
    const finalScore = isNaN(rawScore) ? 0 : rawScore;
    const isMatch = finalScore >= this.MATCH_THRESHOLD;

    return {
      matched: isMatch,
      score: finalScore,
      matchedMinutiaeCount: maxMatchedPairs,
      durationMs: performance.now() - startTime,
      status: isMatch ? 'SUCCESS' : 'NO_MATCH'
    };
  }

  /**
   * Searches for a matching member in a list of candidate templates (1:N Identification)
   */
  public static identify1toN(
    probe: Iso19794Template,
    candidates: Array<{ memberCode: string; template: Iso19794Template }>
  ): BiometricMatchResult {
    let bestResult: BiometricMatchResult = {
      matched: false,
      score: 0,
      matchedMinutiaeCount: 0,
      durationMs: 0,
      status: 'NO_MATCH'
    };

    const startTime = performance.now();

    for (const candidate of candidates) {
      const matchRes = this.match(probe, candidate.template);
      if (matchRes.score > bestResult.score) {
        bestResult = {
          ...matchRes,
          memberCode: candidate.memberCode
        };
      }
    }

    bestResult.durationMs = performance.now() - startTime;
    return bestResult;
  }
}
