import 'package:flutter/foundation.dart';
import '../../../../core/value_objects/money.dart';
import '../../../../core/value_objects/rate.dart';
import '../../domain/entities/loan_entities.dart';
import '../../domain/repositories/loan_usecases.dart';

class LoanNotifier extends ChangeNotifier {
  final SimulateMicroLoanUseCase simulateMicroLoanUseCase;
  final CheckLoanPrequalificationUseCase checkLoanPrequalificationUseCase;
  final SubmitLoanApplicationUseCase submitLoanApplicationUseCase;
  final ILoanRepository loanRepository;

  List<LoanProduct> _products = [];
  LoanProduct? _selectedProduct;
  LoanSimulation? _currentSimulation;
  PreQualificationResult? _preQualification;
  List<LoanApplication> _applications = [];
  bool _isLoading = false;
  String? _errorMessage;

  LoanNotifier({
    required this.simulateMicroLoanUseCase,
    required this.checkLoanPrequalificationUseCase,
    required this.submitLoanApplicationUseCase,
    required this.loanRepository,
  });

  List<LoanProduct> get products => _products;
  LoanProduct? get selectedProduct => _selectedProduct;
  LoanSimulation? get currentSimulation => _currentSimulation;
  PreQualificationResult? get preQualification => _preQualification;
  List<LoanApplication> get applications => _applications;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> loadLoanProducts() async {
    _isLoading = true;
    notifyListeners();

    try {
      _products = await loanRepository.getLoanProducts();
      if (_products.isNotEmpty) {
        _selectedProduct = _products.first;
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void selectProduct(LoanProduct product) {
    _selectedProduct = product;
    notifyListeners();
  }

  void simulate({
    required Money amount,
    required int durationMonths,
    required PaymentFrequency frequency,
    required AmortizationType amortizationType,
    Rate? customRate,
  }) {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final rate = customRate ?? _selectedProduct?.defaultAnnualRate ?? const Rate(12.0);
      final adminFee = _selectedProduct?.adminFeeRate ?? const Rate(1.5);
      final insurance = _selectedProduct?.insuranceRate ?? const Rate(0.8);

      _currentSimulation = simulateMicroLoanUseCase(
        requestedAmount: amount,
        annualInterestRate: rate,
        durationMonths: durationMonths,
        frequency: frequency,
        amortizationType: amortizationType,
        adminFeeRate: adminFee,
        insuranceRate: insurance,
      );
    } catch (e) {
      _errorMessage = e.toString();
      _currentSimulation = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> evaluatePrequalification({
    required String memberCode,
    required Money requestedAmount,
    required Money netMonthlyIncome,
    required Money existingMonthlyDebt,
    required Money pledgedCollateralValue,
    required int memberSeniorityDays,
    required Money paidUpShareCapital,
    required Money estimatedMonthlyPayment,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      _preQualification = await checkLoanPrequalificationUseCase(
        memberCode: memberCode,
        requestedAmount: requestedAmount,
        netMonthlyIncome: netMonthlyIncome,
        existingMonthlyDebt: existingMonthlyDebt,
        pledgedCollateralValue: pledgedCollateralValue,
        memberSeniorityDays: memberSeniorityDays,
        paidUpShareCapital: paidUpShareCapital,
        estimatedMonthlyPayment: estimatedMonthlyPayment,
      );
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<LoanApplication?> submitApplication(LoanApplication application) async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await submitLoanApplicationUseCase(application);
      _applications.add(res);
      return res;
    } catch (e) {
      _errorMessage = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
