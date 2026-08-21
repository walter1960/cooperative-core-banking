import '../../../../core/network/api_client.dart';
import '../../../../core/storage/local_database.dart';
import '../../../../core/value_objects/money.dart';
import '../../../../core/value_objects/rate.dart';
import '../domain/entities/loan_entities.dart';
import '../domain/repositories/loan_usecases.dart';

class LoanRepositoryImpl implements ILoanRepository {
  final ApiClient apiClient;
  final LocalDatabase localDatabase;
  final List<LoanApplication> _applications = [];

  LoanRepositoryImpl({required this.apiClient, required this.localDatabase});

  @override
  Future<List<LoanProduct>> getLoanProducts() async {
    return const [
      LoanProduct(
        id: 'prod-001',
        code: 'MICRO-COMMERCE',
        name: 'Crédit Fonds de Roulement Marchand',
        minAmount: Money(100000),
        maxAmount: Money(5000000),
        minDurationMonths: 3,
        maxDurationMonths: 24,
        defaultAnnualRate: Rate(12.0),
        adminFeeRate: Rate(1.5),
        insuranceRate: Rate(0.8),
        supportedAmortizationTypes: [
          AmortizationType.constantAnnuity,
          AmortizationType.constantPrincipal,
          AmortizationType.flat,
        ],
      ),
      LoanProduct(
        id: 'prod-002',
        code: 'AGRI-CAMPAGNE',
        name: 'Crédit Intrants & Récolte Agricole',
        minAmount: Money(200000),
        maxAmount: Money(10000000),
        minDurationMonths: 6,
        maxDurationMonths: 12,
        defaultAnnualRate: Rate(10.5),
        adminFeeRate: Rate(1.0),
        insuranceRate: Rate(0.6),
        supportedAmortizationTypes: [
          AmortizationType.inFine,
          AmortizationType.constantAnnuity,
        ],
      ),
      LoanProduct(
        id: 'prod-003',
        code: 'EQUIP-PRO',
        name: 'Financement Matériel & Équipement Artisanal',
        minAmount: Money(500000),
        maxAmount: Money(15000000),
        minDurationMonths: 12,
        maxDurationMonths: 36,
        defaultAnnualRate: Rate(11.0),
        adminFeeRate: Rate(2.0),
        insuranceRate: Rate(1.0),
        supportedAmortizationTypes: [
          AmortizationType.constantPrincipal,
          AmortizationType.constantAnnuity,
        ],
      ),
    ];
  }

  @override
  Future<LoanApplication> submitLoanApplication(LoanApplication application) async {
    _applications.add(application);
    return application;
  }

  @override
  Future<List<LoanApplication>> getMemberLoanApplications(String memberCode) async {
    return _applications.where((a) => a.memberCode == memberCode).toList();
  }

  @override
  Future<PreQualificationResult> evaluatePrequalification({
    required String memberCode,
    required Money requestedAmount,
    required Money netMonthlyIncome,
    required Money existingMonthlyDebt,
    required Money pledgedCollateralValue,
    required int memberSeniorityDays,
    required Money paidUpShareCapital,
  }) async {
    final check = CheckLoanPrequalificationUseCase(this);
    // Rough estimate for payment
    final estimatedPayment = requestedAmount ~/ 12;
    return check(
      memberCode: memberCode,
      requestedAmount: requestedAmount,
      netMonthlyIncome: netMonthlyIncome,
      existingMonthlyDebt: existingMonthlyDebt,
      pledgedCollateralValue: pledgedCollateralValue,
      memberSeniorityDays: memberSeniorityDays,
      paidUpShareCapital: paidUpShareCapital,
      estimatedMonthlyPayment: estimatedPayment,
    );
  }
}
