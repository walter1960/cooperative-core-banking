import 'package:flutter_test/flutter_test.dart';
import 'package:banolia_mobile/core/errors/exceptions.dart';
import 'package:banolia_mobile/core/value_objects/money.dart';
import 'package:banolia_mobile/core/value_objects/rate.dart';
import 'package:banolia_mobile/features/loans/domain/entities/loan_entities.dart';
import 'package:banolia_mobile/features/loans/domain/services/loan_simulation_engine.dart';
import 'package:banolia_mobile/features/loans/domain/repositories/loan_usecases.dart';
import 'package:banolia_mobile/features/loans/data/loan_data.dart';
import 'package:banolia_mobile/core/network/api_client.dart';
import 'package:banolia_mobile/core/network/network_info.dart';
import 'package:banolia_mobile/core/storage/local_database.dart';
import 'package:http/http.dart' as http;

void main() {
  group('Micro-Loan Amortization Calculation Engine', () {
    const principal = Money(1000000); // 1 000 000 XOF
    const nominalRate = Rate(12.0); // 12% per year
    const durationMonths = 12;

    test('1. Constant Annuity: Generates fixed installments and absorbs cent remainder', () {
      final sim = LoanSimulationEngine.simulate(
        requestedAmount: principal,
        annualInterestRate: nominalRate,
        durationMonths: durationMonths,
        frequency: PaymentFrequency.monthly,
        amortizationType: AmortizationType.constantAnnuity,
      );

      expect(sim.schedule.length, equals(12));

      // Check sum of principal equals principal granted
      int totalPrincipalSum = 0;
      for (final inst in sim.schedule) {
        totalPrincipalSum += inst.principalDue.amountXof;
      }
      expect(totalPrincipalSum, equals(principal.amountXof));

      // Check remaining principal on last period is exactly 0
      expect(sim.schedule.last.remainingPrincipal, equals(Money.zero));

      // Periodic payment is approximately 88 849 F.CFA
      expect(sim.periodicPayment.amountXof, greaterThan(85000));
      expect(sim.periodicPayment.amountXof, lessThan(92000));
    });

    test('2. Constant Principal: Divides principal equally and absorbs remainder', () {
      final sim = LoanSimulationEngine.simulate(
        requestedAmount: principal,
        annualInterestRate: nominalRate,
        durationMonths: durationMonths,
        frequency: PaymentFrequency.monthly,
        amortizationType: AmortizationType.constantPrincipal,
      );

      expect(sim.schedule.length, equals(12));

      int totalPrincipalSum = 0;
      for (final inst in sim.schedule) {
        totalPrincipalSum += inst.principalDue.amountXof;
      }
      expect(totalPrincipalSum, equals(principal.amountXof));
      expect(sim.schedule.last.remainingPrincipal, equals(Money.zero));

      // Installments decrease over time
      expect(sim.schedule.first.totalInstallment > sim.schedule.last.totalInstallment, isTrue);
    });

    test('3. Bullet (In Fine): Periodic interest only, full principal at maturity', () {
      final sim = LoanSimulationEngine.simulate(
        requestedAmount: principal,
        annualInterestRate: nominalRate,
        durationMonths: durationMonths,
        frequency: PaymentFrequency.monthly,
        amortizationType: AmortizationType.inFine,
      );

      expect(sim.schedule.length, equals(12));

      // For periods 1..11, principal is 0
      for (int i = 0; i < 11; i++) {
        expect(sim.schedule[i].principalDue, equals(Money.zero));
        expect(sim.schedule[i].remainingPrincipal, equals(principal));
      }

      // Period 12 pays full principal
      expect(sim.schedule.last.principalDue, equals(principal));
      expect(sim.schedule.last.remainingPrincipal, equals(Money.zero));
    });

    test('4. Flat Rate: Linear interest and integer principal distribution', () {
      final sim = LoanSimulationEngine.simulate(
        requestedAmount: principal,
        annualInterestRate: const Rate(10.0),
        durationMonths: durationMonths,
        frequency: PaymentFrequency.monthly,
        amortizationType: AmortizationType.flat,
      );

      expect(sim.schedule.length, equals(12));
      int totalPrincipalSum = 0;
      for (final inst in sim.schedule) {
        totalPrincipalSum += inst.principalDue.amountXof;
      }
      expect(totalPrincipalSum, equals(principal.amountXof));
      expect(sim.schedule.last.remainingPrincipal, equals(Money.zero));
    });

    test('Weekly frequency generates 52 periods per year correctly', () {
      final sim = LoanSimulationEngine.simulate(
        requestedAmount: const Money(500000),
        annualInterestRate: const Rate(10.0),
        durationMonths: 6, // 26 weeks
        frequency: PaymentFrequency.weekly,
        amortizationType: AmortizationType.constantAnnuity,
      );

      expect(sim.schedule.length, equals(26));
      expect(sim.schedule.last.remainingPrincipal, equals(Money.zero));
    });

    test('BCEAO Usury Ceiling Enforcement (TEG <= 24.0%)', () {
      // Nominal rate 12% is compliant
      final compliantSim = LoanSimulationEngine.simulate(
        requestedAmount: principal,
        annualInterestRate: const Rate(12.0),
        durationMonths: 12,
        frequency: PaymentFrequency.monthly,
        amortizationType: AmortizationType.constantAnnuity,
      );
      expect(compliantSim.isUsuryCompliant, isTrue);
      expect(compliantSim.tegAnnualRate.percent, lessThanOrEqualTo(24.0));

      // Excessive nominal rate (35%) violates BCEAO ceiling and throws UsuryViolationException
      expect(
        () => LoanSimulationEngine.simulate(
          requestedAmount: principal,
          annualInterestRate: const Rate(35.0),
          durationMonths: 12,
          frequency: PaymentFrequency.monthly,
          amortizationType: AmortizationType.constantAnnuity,
          enforceUsuryCeiling: true,
        ),
        throwsA(isA<UsuryViolationException>()),
      );
    });
  });

  group('Loan Pre-Qualification Assessment', () {
    late ILoanRepository loanRepo;
    late CheckLoanPrequalificationUseCase prequalUseCase;

    setUp(() {
      final localDb = LocalDatabase();
      final apiClient = ApiClient(httpClient: http.Client(), networkInfo: AlwaysOnlineNetworkInfo());
      loanRepo = LoanRepositoryImpl(apiClient: apiClient, localDatabase: localDb);
      prequalUseCase = CheckLoanPrequalificationUseCase(loanRepo);
    });

    test('Rejects if member seniority is less than 90 days', () async {
      final res = await prequalUseCase(
        memberCode: 'A0200389',
        requestedAmount: const Money(500000),
        netMonthlyIncome: const Money(300000),
        existingMonthlyDebt: Money.zero,
        pledgedCollateralValue: const Money(200000),
        memberSeniorityDays: 45, // < 90 days
        paidUpShareCapital: const Money(150000),
        estimatedMonthlyPayment: const Money(50000),
      );

      expect(res.status, equals(PreQualificationStatus.rejected));
      expect(res.feedbackMessages.any((m) => m.contains('Ancienneté insuffisante')), isTrue);
    });

    test('Rejects if requested amount exceeds 5x share capital', () async {
      final res = await prequalUseCase(
        memberCode: 'A0200389',
        requestedAmount: const Money(1000000), // > 5 * 100 000
        netMonthlyIncome: const Money(400000),
        existingMonthlyDebt: Money.zero,
        pledgedCollateralValue: const Money(300000),
        memberSeniorityDays: 120,
        paidUpShareCapital: const Money(100000), // Max loan = 500 000
        estimatedMonthlyPayment: const Money(90000),
      );

      expect(res.status, equals(PreQualificationStatus.rejected));
      expect(res.feedbackMessages.any((m) => m.contains('5x vos parts sociales')), isTrue);
    });

    test('Flags moderate risk (requires guarantor) if DSTI is between 33% and 40%', () async {
      final res = await prequalUseCase(
        memberCode: 'A0200389',
        requestedAmount: const Money(500000),
        netMonthlyIncome: const Money(250000),
        existingMonthlyDebt: Money.zero,
        pledgedCollateralValue: const Money(150000),
        memberSeniorityDays: 180,
        paidUpShareCapital: const Money(200000),
        estimatedMonthlyPayment: const Money(90000), // DSTI = 90k/250k = 36%
      );

      expect(res.status, equals(PreQualificationStatus.moderateRiskRequiresGuarantor));
      expect(res.isEligible, isTrue);
    });

    test('Approves optimal profile with DSTI <= 33% and sufficient collateral', () async {
      final res = await prequalUseCase(
        memberCode: 'A0200389',
        requestedAmount: const Money(500000),
        netMonthlyIncome: const Money(300000),
        existingMonthlyDebt: Money.zero,
        pledgedCollateralValue: const Money(150000), // 30% collateral coverage
        memberSeniorityDays: 200,
        paidUpShareCapital: const Money(200000),
        estimatedMonthlyPayment: const Money(50000), // DSTI = 50k/300k = 16.7%
      );

      expect(res.status, equals(PreQualificationStatus.approved));
      expect(res.isEligible, isTrue);
    });
  });

  group('Loan Application Submission & Products', () {
    late ILoanRepository loanRepo;
    late SubmitLoanApplicationUseCase submitUseCase;

    setUp(() {
      final localDb = LocalDatabase();
      final apiClient = ApiClient(httpClient: http.Client(), networkInfo: AlwaysOnlineNetworkInfo());
      loanRepo = LoanRepositoryImpl(apiClient: apiClient, localDatabase: localDb);
      submitUseCase = SubmitLoanApplicationUseCase(loanRepo);
    });

    test('Fetches available loan products', () async {
      final products = await loanRepo.getLoanProducts();
      expect(products.isNotEmpty, isTrue);
      expect(products.any((p) => p.code == 'MICRO-COMMERCE'), isTrue);
    });


    test('Submits loan application with collaterals and guarantors', () async {
      final app = LoanApplication(
        id: 'app-001',
        applicationNumber: 'DMD-202608-0042',
        memberCode: 'A0200389',
        loanProductId: 'prod-01',
        requestedAmount: const Money(1000000),
        durationMonths: 12,
        frequency: PaymentFrequency.monthly,
        amortizationType: AmortizationType.constantAnnuity,
        purpose: 'Achat de stock pagnes Wax',
        collaterals: const [
          Collateral(
            id: 'collat-01',
            type: CollateralType.savingsDepositHold,
            description: 'Nantissement sur compte DAV 251100',
            estimatedValue: Money(250000),
            pledgedAmount: Money(250000),
          ),
        ],
        guarantors: const [
          Guarantor(
            id: 'guar-01',
            fullName: 'KOUASSI YAO',
            phone: '+22890112233',
            nationalIdNumber: 'TG-LOM-1988-0012',
            occupation: 'Commerçant',
            employerOrBusiness: 'Marché Assigamé',
            monthlyIncome: Money(400000),
            guaranteedAmount: Money(1000000),
            relationship: 'Frère / Caution Solidaire',
          ),
        ],
        status: LoanApplicationStatus.submitted,
        createdAt: DateTime.now(),
      );

      final submitted = await submitUseCase(app);
      expect(submitted.applicationNumber, equals('DMD-202608-0042'));
      expect(submitted.collaterals.length, equals(1));
      expect(submitted.guarantors.length, equals(1));

      final memberApps = await loanRepo.getMemberLoanApplications('A0200389');
      expect(memberApps.any((a) => a.applicationNumber == 'DMD-202608-0042'), isTrue);
    });
  });
}

