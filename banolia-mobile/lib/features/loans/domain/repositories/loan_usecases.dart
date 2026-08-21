import '../../../../core/value_objects/money.dart';
import '../../../../core/value_objects/rate.dart';
import '../entities/loan_entities.dart';
import '../services/loan_simulation_engine.dart';

abstract class ILoanRepository {
  Future<List<LoanProduct>> getLoanProducts();
  Future<LoanApplication> submitLoanApplication(LoanApplication application);
  Future<List<LoanApplication>> getMemberLoanApplications(String memberCode);
  Future<PreQualificationResult> evaluatePrequalification({
    required String memberCode,
    required Money requestedAmount,
    required Money netMonthlyIncome,
    required Money existingMonthlyDebt,
    required Money pledgedCollateralValue,
    required int memberSeniorityDays,
    required Money paidUpShareCapital,
  });
}

class SimulateMicroLoanUseCase {
  LoanSimulation call({
    required Money requestedAmount,
    required Rate annualInterestRate,
    required int durationMonths,
    required PaymentFrequency frequency,
    required AmortizationType amortizationType,
    DateTime? disbursementDate,
    Rate adminFeeRate = const Rate(1.0),
    Rate insuranceRate = const Rate(0.5),
    bool enforceUsuryCeiling = true,
  }) {
    return LoanSimulationEngine.simulate(
      requestedAmount: requestedAmount,
      annualInterestRate: annualInterestRate,
      durationMonths: durationMonths,
      frequency: frequency,
      amortizationType: amortizationType,
      disbursementDate: disbursementDate,
      adminFeeRate: adminFeeRate,
      insuranceRate: insuranceRate,
      enforceUsuryCeiling: enforceUsuryCeiling,
    );
  }
}

class CheckLoanPrequalificationUseCase {
  final ILoanRepository repository;
  CheckLoanPrequalificationUseCase(this.repository);

  Future<PreQualificationResult> call({
    required String memberCode,
    required Money requestedAmount,
    required Money netMonthlyIncome,
    required Money existingMonthlyDebt,
    required Money pledgedCollateralValue,
    required int memberSeniorityDays,
    required Money paidUpShareCapital,
    required Money estimatedMonthlyPayment,
  }) async {
    final messages = <String>[];
    bool isEligible = true;

    // 1. Seniority Check (>= 90 days)
    if (memberSeniorityDays < 90) {
      isEligible = false;
      messages.add('Ancienneté insuffisante ($memberSeniorityDays jours). Minimum requis : 90 jours.');
    }

    // 2. Share Capital Multiplier (Max 5x paid-up shares)
    final maxByShares = paidUpShareCapital * 5;
    if (requestedAmount > maxByShares) {
      isEligible = false;
      messages.add('Montant demandé supérieur au plafond de 5x vos parts sociales (${maxByShares.formatted}).');
    }

    // 3. Debt Service to Income Ratio (DSTI)
    // DSTI = (newPayment + existingDebt) / netIncome
    double dsti = 0.0;
    if (netMonthlyIncome.amountXof > 0) {
      final totalDebtService = (estimatedMonthlyPayment + existingMonthlyDebt).amountXof;
      dsti = (totalDebtService / netMonthlyIncome.amountXof) * 100.0;
    } else {
      dsti = 100.0;
    }

    PreQualificationStatus status;
    if (!isEligible || dsti > 40.0) {
      status = PreQualificationStatus.rejected;
      if (dsti > 40.0) {
        messages.add('Taux d\'endettement trop élevé (${dsti.toStringAsFixed(1)}%). Plafond toléré : 40%.');
      }
    } else if (dsti > 33.0) {
      status = PreQualificationStatus.moderateRiskRequiresGuarantor;
      messages.add('Taux d\'endettement modéré (${dsti.toStringAsFixed(1)}%). Caution solidaire / garant supplémentaire exigé.');
    } else {
      status = PreQualificationStatus.approved;
      messages.add('Profil pré-qualifié avec succès. Taux d\'endettement optimal (${dsti.toStringAsFixed(1)}%).');
    }

    // 4. Collateral Coverage
    final collateralCoverage = requestedAmount.amountXof > 0
        ? (pledgedCollateralValue.amountXof / requestedAmount.amountXof) * 100.0
        : 0.0;
    if (collateralCoverage < 20.0) {
      messages.add('Garanties matérielles ou nantissements inférieurs au standard de 20% (${collateralCoverage.toStringAsFixed(1)}%).');
    }

    final maxBorrowing = Money((netMonthlyIncome.amountXof * 0.33 * 12).round());

    return PreQualificationResult(
      status: status,
      dstiRatio: dsti,
      maxBorrowingCapacity: maxBorrowing,
      collateralCoverageRatio: collateralCoverage,
      feedbackMessages: messages,
    );
  }
}

class SubmitLoanApplicationUseCase {
  final ILoanRepository repository;
  SubmitLoanApplicationUseCase(this.repository);

  Future<LoanApplication> call(LoanApplication application) {
    if (application.requestedAmount.amountXof <= 0) {
      throw ArgumentError('Montant invalide');
    }
    return repository.submitLoanApplication(application);
  }
}
