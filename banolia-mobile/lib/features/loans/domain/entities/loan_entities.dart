import '../../../../core/value_objects/money.dart';
import '../../../../core/value_objects/rate.dart';

enum AmortizationType {
  constantAnnuity, // Échéances constantes
  constantPrincipal, // Amortissement constant
  inFine, // Remboursement Bullet
  flat, // Taux fixe linéaire
}

enum PaymentFrequency {
  weekly(52, 'Hebdomadaire'),
  biWeekly(26, 'Bimensuel'),
  monthly(12, 'Mensuel'),
  quarterly(4, 'Trimestriel');

  final int periodsPerYear;
  final String label;
  const PaymentFrequency(this.periodsPerYear, this.label);
}

class LoanScheduleInstallment {
  final int installmentNumber;
  final DateTime dueDate;
  final Money principalDue;
  final Money interestDue;
  final Money feesDue;
  final Money insuranceDue;
  final Money totalInstallment;
  final Money remainingPrincipal;

  const LoanScheduleInstallment({
    required this.installmentNumber,
    required this.dueDate,
    required this.principalDue,
    required this.interestDue,
    required this.feesDue,
    required this.insuranceDue,
    required this.totalInstallment,
    required this.remainingPrincipal,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is LoanScheduleInstallment &&
          runtimeType == other.runtimeType &&
          installmentNumber == other.installmentNumber &&
          totalInstallment == other.totalInstallment &&
          remainingPrincipal == other.remainingPrincipal;

  @override
  int get hashCode => Object.hash(installmentNumber, totalInstallment, remainingPrincipal);
}

class LoanProduct {
  final String id;
  final String code;
  final String name;
  final Money minAmount;
  final Money maxAmount;
  final int minDurationMonths;
  final int maxDurationMonths;
  final Rate defaultAnnualRate;
  final Rate adminFeeRate; // e.g. 1.5%
  final Rate insuranceRate; // e.g. 0.8%
  final List<AmortizationType> supportedAmortizationTypes;

  const LoanProduct({
    required this.id,
    required this.code,
    required this.name,
    required this.minAmount,
    required this.maxAmount,
    required this.minDurationMonths,
    required this.maxDurationMonths,
    required this.defaultAnnualRate,
    required this.adminFeeRate,
    required this.insuranceRate,
    required this.supportedAmortizationTypes,
  });
}

class LoanSimulation {
  final Money requestedAmount;
  final Rate annualInterestRate;
  final int durationMonths;
  final PaymentFrequency frequency;
  final AmortizationType amortizationType;
  final DateTime disbursementDate;
  final Money periodicPayment;
  final Money totalInterest;
  final Money totalFees;
  final Money totalInsurance;
  final Money totalRepayment;
  final Rate tegAnnualRate; // Taux Effectif Global
  final bool isUsuryCompliant; // TEG <= 24.0%
  final List<LoanScheduleInstallment> schedule;

  const LoanSimulation({
    required this.requestedAmount,
    required this.annualInterestRate,
    required this.durationMonths,
    required this.frequency,
    required this.amortizationType,
    required this.disbursementDate,
    required this.periodicPayment,
    required this.totalInterest,
    required this.totalFees,
    required this.totalInsurance,
    required this.totalRepayment,
    required this.tegAnnualRate,
    required this.isUsuryCompliant,
    required this.schedule,
  });
}

enum CollateralType {
  savingsDepositHold, // Nantissement sur compte épargne
  vehiclePledge, // Gage sur véhicule
  equipmentPledge, // Gage sur matériel d'exploitation
  realEstateMortgage, // Hypothèque
  commercialGoods, // Stock marchandise
}

class Collateral {
  final String id;
  final CollateralType type;
  final String description;
  final Money estimatedValue;
  final Money pledgedAmount;
  final String? documentProofUrl;

  const Collateral({
    required this.id,
    required this.type,
    required this.description,
    required this.estimatedValue,
    required this.pledgedAmount,
    this.documentProofUrl,
  });
}

class Guarantor {
  final String id;
  final String fullName;
  final String? memberCode;
  final String phone;
  final String nationalIdNumber;
  final String occupation;
  final String employerOrBusiness;
  final Money monthlyIncome;
  final Money guaranteedAmount;
  final String relationship;

  const Guarantor({
    required this.id,
    required this.fullName,
    this.memberCode,
    required this.phone,
    required this.nationalIdNumber,
    required this.occupation,
    required this.employerOrBusiness,
    required this.monthlyIncome,
    required this.guaranteedAmount,
    required this.relationship,
  });
}

enum LoanApplicationStatus {
  draft,
  submitted,
  underCreditCommitteeReview,
  approvedPendingDisbursement,
  disbursedActive,
  rejected,
  withdrawn,
}

class LoanApplication {
  final String id;
  final String applicationNumber;
  final String memberCode;
  final String loanProductId;
  final Money requestedAmount;
  final int durationMonths;
  final PaymentFrequency frequency;
  final AmortizationType amortizationType;
  final String purpose;
  final List<Collateral> collaterals;
  final List<Guarantor> guarantors;
  final LoanApplicationStatus status;
  final DateTime createdAt;

  const LoanApplication({
    required this.id,
    required this.applicationNumber,
    required this.memberCode,
    required this.loanProductId,
    required this.requestedAmount,
    required this.durationMonths,
    required this.frequency,
    required this.amortizationType,
    required this.purpose,
    required this.collaterals,
    required this.guarantors,
    required this.status,
    required this.createdAt,
  });
}

enum PreQualificationStatus { approved, moderateRiskRequiresGuarantor, rejected }

class PreQualificationResult {
  final PreQualificationStatus status;
  final double dstiRatio; // Debt Service to Income
  final Money maxBorrowingCapacity;
  final double collateralCoverageRatio;
  final List<String> feedbackMessages;

  const PreQualificationResult({
    required this.status,
    required this.dstiRatio,
    required this.maxBorrowingCapacity,
    required this.collateralCoverageRatio,
    required this.feedbackMessages,
  });

  bool get isEligible => status != PreQualificationStatus.rejected;
}
