import 'dart:math' as math;

/// Numerical Solver for Internal Rate of Return (IRR) and BCEAO TEG
/// Uses the Newton-Raphson method with quadratic convergence.
class NewtonRaphsonSolver {
  NewtonRaphsonSolver._();

  static const double tolerance = 1e-7;
  static const int maxIterations = 100;

  /// Solves for periodic rate x such that:
  /// sum_{k=1}^n [ payments[k-1] / (1 + x)^k ] - netDisbursed = 0
  ///
  /// Returns periodic interest rate x.
  static double solvePeriodicRate({
    required double netDisbursed,
    required List<double> cashFlowsOut, // Installments [A_1, A_2, ..., A_n]
    double initialGuess = 0.01,
  }) {
    if (netDisbursed <= 0 || cashFlowsOut.isEmpty) return 0.0;

    double x = initialGuess;

    for (int iter = 0; iter < maxIterations; iter++) {
      double g = -netDisbursed;
      double gPrime = 0.0;

      for (int k = 1; k <= cashFlowsOut.length; k++) {
        final ak = cashFlowsOut[k - 1];
        final denom = math.pow(1.0 + x, k).toDouble();
        final denomPrime = math.pow(1.0 + x, k + 1).toDouble();

        g += ak / denom;
        gPrime -= (k * ak) / denomPrime;
      }

      if (g.abs() < tolerance) {
        return x;
      }

      if (gPrime.abs() < 1e-12) {
        // Fallback / avoid division by zero
        break;
      }

      final xNext = x - (g / gPrime);
      if ((xNext - x).abs() < tolerance) {
        return xNext;
      }

      x = xNext;
      // Guard against non-physical negative rates
      if (x < -0.99) x = -0.99;
    }

    return x;
  }

  /// Calculates annualized TEG (Taux Effectif Global) as a percentage
  /// [periodicRate] * [periodsPerYear] * 100
  static double calculateAnnualTeg({
    required double netDisbursed,
    required List<double> installments,
    required int periodsPerYear,
  }) {
    final periodicRate = solvePeriodicRate(
      netDisbursed: netDisbursed,
      cashFlowsOut: installments,
      initialGuess: 0.12 / periodsPerYear,
    );
    return periodicRate * periodsPerYear * 100.0;
  }
}
