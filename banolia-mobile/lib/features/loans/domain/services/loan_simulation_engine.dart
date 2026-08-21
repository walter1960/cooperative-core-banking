import 'dart:math' as math;
import '../../../../core/constants/bceao_constants.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/utils/newton_raphson_solver.dart';
import '../../../../core/value_objects/money.dart';
import '../../../../core/value_objects/rate.dart';
import '../entities/loan_entities.dart';

/// Micro-Loan Amortization Engine & BCEAO Usury Compliance Validator
class LoanSimulationEngine {
  LoanSimulationEngine._();

  /// Simulates a micro-loan and returns complete amortization schedule
  static LoanSimulation simulate({
    required Money requestedAmount,
    required Rate annualInterestRate,
    required int durationMonths,
    required PaymentFrequency frequency,
    required AmortizationType amortizationType,
    DateTime? disbursementDate,
    Rate adminFeeRate = const Rate(1.0), // 1.0% dossier fee
    Rate insuranceRate = const Rate(0.5), // 0.5% insurance fee
    bool enforceUsuryCeiling = true,
  }) {
    if (requestedAmount.amountXof <= 0) {
      throw ArgumentError('Le montant du prêt doit être strictement positif');
    }
    if (durationMonths <= 0) {
      throw ArgumentError('La durée doit être d\'au moins 1 mois');
    }

    final start = disbursementDate ?? DateTime.now();
    final c0 = requestedAmount.amountXof;
    final f = frequency.periodsPerYear;
    final n = math.max(1, (durationMonths * f / 12).round());
    final r = annualInterestRate.decimalFraction / f;

    // Upfront fees
    final fileFee = (c0 * adminFeeRate.decimalFraction).round();
    final insFee = (c0 * insuranceRate.decimalFraction).round();
    final totalFees = Money(fileFee);
    final totalInsurance = Money(insFee);
    final netDisbursed = (c0 - fileFee - insFee).toDouble();

    final schedule = <LoanScheduleInstallment>[];
    int remainingPrincipal = c0;
    int cumulativeInterest = 0;

    switch (amortizationType) {
      case AmortizationType.constantAnnuity:
        // A = C0 * r / (1 - (1+r)^-n)
        double annuityFloat;
        if (r == 0) {
          annuityFloat = c0 / n;
        } else {
          annuityFloat = c0 * r / (1.0 - math.pow(1.0 + r, -n));
        }
        final fixedAnnuity = annuityFloat.round();

        for (int k = 1; k <= n; k++) {
          final interest = (remainingPrincipal * r).round();
          int principal;
          int installmentTotal;

          if (k == n) {
            // Remainder absorption in final period
            principal = remainingPrincipal;
            installmentTotal = principal + interest;
            remainingPrincipal = 0;
          } else {
            principal = fixedAnnuity - interest;
            if (principal > remainingPrincipal) {
              principal = remainingPrincipal;
            }
            installmentTotal = principal + interest;
            remainingPrincipal -= principal;
          }

          cumulativeInterest += interest;
          final dueDate = _computeDueDate(start, k, frequency);

          schedule.add(LoanScheduleInstallment(
            installmentNumber: k,
            dueDate: dueDate,
            principalDue: Money(principal),
            interestDue: Money(interest),
            feesDue: Money.zero,
            insuranceDue: Money.zero,
            totalInstallment: Money(installmentTotal),
            remainingPrincipal: Money(remainingPrincipal),
          ));
        }
        break;

      case AmortizationType.constantPrincipal:
        final basePrincipal = c0 ~/ n;

        for (int k = 1; k <= n; k++) {
          final interest = (remainingPrincipal * r).round();
          int principal;

          if (k == n) {
            principal = remainingPrincipal;
            remainingPrincipal = 0;
          } else {
            principal = basePrincipal;
            remainingPrincipal -= principal;
          }

          final installmentTotal = principal + interest;
          cumulativeInterest += interest;
          final dueDate = _computeDueDate(start, k, frequency);

          schedule.add(LoanScheduleInstallment(
            installmentNumber: k,
            dueDate: dueDate,
            principalDue: Money(principal),
            interestDue: Money(interest),
            feesDue: Money.zero,
            insuranceDue: Money.zero,
            totalInstallment: Money(installmentTotal),
            remainingPrincipal: Money(remainingPrincipal),
          ));
        }
        break;

      case AmortizationType.inFine:
        final periodicInterest = (c0 * r).round();

        for (int k = 1; k <= n; k++) {
          int principal = 0;
          int interest = periodicInterest;

          if (k == n) {
            principal = c0;
            remainingPrincipal = 0;
          }

          final installmentTotal = principal + interest;
          cumulativeInterest += interest;
          final dueDate = _computeDueDate(start, k, frequency);

          schedule.add(LoanScheduleInstallment(
            installmentNumber: k,
            dueDate: dueDate,
            principalDue: Money(principal),
            interestDue: Money(interest),
            feesDue: Money.zero,
            insuranceDue: Money.zero,
            totalInstallment: Money(installmentTotal),
            remainingPrincipal: Money(remainingPrincipal),
          ));
        }
        break;

      case AmortizationType.flat:
        final totalInterestFlat = (c0 * annualInterestRate.decimalFraction * (n / f)).round();
        final basePrincipal = c0 ~/ n;
        final baseInterest = totalInterestFlat ~/ n;
        int accumulatedInterestFlat = 0;

        for (int k = 1; k <= n; k++) {
          int principal;
          int interest;

          if (k == n) {
            principal = remainingPrincipal;
            interest = totalInterestFlat - accumulatedInterestFlat;
            remainingPrincipal = 0;
          } else {
            principal = basePrincipal;
            interest = baseInterest;
            accumulatedInterestFlat += interest;
            remainingPrincipal -= principal;
          }

          final installmentTotal = principal + interest;
          cumulativeInterest += interest;
          final dueDate = _computeDueDate(start, k, frequency);

          schedule.add(LoanScheduleInstallment(
            installmentNumber: k,
            dueDate: dueDate,
            principalDue: Money(principal),
            interestDue: Money(interest),
            feesDue: Money.zero,
            insuranceDue: Money.zero,
            totalInstallment: Money(installmentTotal),
            remainingPrincipal: Money(remainingPrincipal),
          ));
        }
        break;
    }

    // Calculate TEG using Newton-Raphson on exact cash flows
    final cashFlowsOut = schedule.map((e) => e.totalInstallment.amountXof.toDouble()).toList();
    final tegPercent = NewtonRaphsonSolver.calculateAnnualTeg(
      netDisbursed: netDisbursed,
      installments: cashFlowsOut,
      periodsPerYear: f,
    );

    final isUsuryCompliant = tegPercent <= BceaoConstants.usuryRateCeilingPercent;

    if (enforceUsuryCeiling && !isUsuryCompliant) {
      throw UsuryViolationException(
        message: 'Le Taux Effectif Global (TEG: ${tegPercent.toStringAsFixed(2)}%) dépasse le seuil d\'usure légal BCEAO (${BceaoConstants.usuryRateCeilingPercent}%).',
        calculatedTeg: tegPercent,
        usuryCeiling: BceaoConstants.usuryRateCeilingPercent,
      );
    }

    final totalInterestMoney = Money(cumulativeInterest);
    final totalRepayment = requestedAmount + totalInterestMoney;
    final periodicPayment = schedule.isNotEmpty ? schedule.first.totalInstallment : Money.zero;

    return LoanSimulation(
      requestedAmount: requestedAmount,
      annualInterestRate: annualInterestRate,
      durationMonths: durationMonths,
      frequency: frequency,
      amortizationType: amortizationType,
      disbursementDate: start,
      periodicPayment: periodicPayment,
      totalInterest: totalInterestMoney,
      totalFees: totalFees,
      totalInsurance: totalInsurance,
      totalRepayment: totalRepayment,
      tegAnnualRate: Rate(tegPercent),
      isUsuryCompliant: isUsuryCompliant,
      schedule: schedule,
    );
  }

  static DateTime _computeDueDate(DateTime start, int periodIndex, PaymentFrequency frequency) {
    switch (frequency) {
      case PaymentFrequency.weekly:
        return start.add(Duration(days: 7 * periodIndex));
      case PaymentFrequency.biWeekly:
        return start.add(Duration(days: 14 * periodIndex));
      case PaymentFrequency.monthly:
        return DateTime(start.year, start.month + periodIndex, start.day);
      case PaymentFrequency.quarterly:
        return DateTime(start.year, start.month + (3 * periodIndex), start.day);
    }
  }
}
