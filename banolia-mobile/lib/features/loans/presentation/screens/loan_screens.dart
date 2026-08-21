import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_dimens.dart';
import '../../../../core/value_objects/money.dart';
import '../../../../shared/widgets/shared_widgets.dart';
import '../../domain/entities/loan_entities.dart';
import '../notifiers/loan_notifiers.dart';

class LoanSimulatorScreen extends StatefulWidget {
  final LoanNotifier notifier;

  const LoanSimulatorScreen({super.key, required this.notifier});

  @override
  State<LoanSimulatorScreen> createState() => _LoanSimulatorScreenState();
}

class _LoanSimulatorScreenState extends State<LoanSimulatorScreen> {
  final _amountController = TextEditingController(text: '1000000');
  int _durationMonths = 12;
  PaymentFrequency _frequency = PaymentFrequency.monthly;
  AmortizationType _amortizationType = AmortizationType.constantAnnuity;

  @override
  void initState() {
    super.initState();
    widget.notifier.loadLoanProducts();
    _triggerSimulation();
  }

  void _triggerSimulation() {
    final amount = int.tryParse(_amountController.text) ?? 1000000;
    widget.notifier.simulate(
      amount: Money(amount),
      durationMonths: _durationMonths,
      frequency: _frequency,
      amortizationType: _amortizationType,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Simulateur de Micro-Prêt', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
      ),
      body: ListenableBuilder(
        listenable: widget.notifier,
        builder: (context, _) {
          final sim = widget.notifier.currentSimulation;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(AppDimens.spacing16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildControlsCard(),
                const SizedBox(height: AppDimens.spacing16),

                if (widget.notifier.errorMessage != null)
                  Container(
                    padding: const EdgeInsets.all(AppDimens.spacing12),
                    margin: const EdgeInsets.only(bottom: AppDimens.spacing16),
                    decoration: BoxDecoration(
                      color: AppColors.errorRed.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(AppDimens.radiusMedium),
                      border: Border.all(color: AppColors.errorRed),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: AppColors.errorRed),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            widget.notifier.errorMessage!,
                            style: const TextStyle(color: AppColors.errorRed, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),

                if (sim != null) ...[
                  _buildResultsCard(sim),
                  const SizedBox(height: AppDimens.spacing24),

                  const Text('Échéancier Prévisionnel de Remboursement', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: AppDimens.spacing8),
                  _buildScheduleTable(sim.schedule),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildControlsCard() {
    return Container(
      padding: const EdgeInsets.all(AppDimens.spacing16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppDimens.radiusMedium),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppTextField(
            label: 'Montant Souhaité (F.CFA)',
            controller: _amountController,
            keyboardType: TextInputType.number,
            onChanged: (_) => _triggerSimulation(),
          ),
          const SizedBox(height: AppDimens.spacing12),
          Text('Durée : $_durationMonths Mois', style: const TextStyle(fontWeight: FontWeight.w600)),
          Slider(
            value: _durationMonths.toDouble(),
            min: 1,
            max: 36,
            divisions: 35,
            activeColor: AppColors.primaryGreen,
            label: '$_durationMonths Mois',
            onChanged: (val) {
              setState(() => _durationMonths = val.round());
              _triggerSimulation();
            },
          ),
          const SizedBox(height: AppDimens.spacing8),
          const Text('Mode d\'Amortissement', style: TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          DropdownButtonFormField<AmortizationType>(
            initialValue: _amortizationType,
            decoration: InputDecoration(
              filled: true,
              fillColor: AppColors.backgroundLight,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppDimens.radiusSmall)),
            ),
            items: const [
              DropdownMenuItem(value: AmortizationType.constantAnnuity, child: Text('Échéance Constante (Annuity)')),
              DropdownMenuItem(value: AmortizationType.constantPrincipal, child: Text('Principal Constant')),
              DropdownMenuItem(value: AmortizationType.inFine, child: Text('In Fine (Bullet / Récolte)')),
              DropdownMenuItem(value: AmortizationType.flat, child: Text('Taux Fixe Linéaire (Flat)')),
            ],
            onChanged: (val) {
              if (val != null) {
                setState(() => _amortizationType = val);
                _triggerSimulation();
              }
            },
          ),
          const SizedBox(height: AppDimens.spacing12),
          const Text('Périodicité', style: TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          SegmentedButton<PaymentFrequency>(
            segments: const [
              ButtonSegment(value: PaymentFrequency.monthly, label: Text('Mensuel')),
              ButtonSegment(value: PaymentFrequency.weekly, label: Text('Hebdo')),
              ButtonSegment(value: PaymentFrequency.quarterly, label: Text('Trimestriel')),
            ],
            selected: {_frequency},
            onSelectionChanged: (set) {
              setState(() => _frequency = set.first);
              _triggerSimulation();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildResultsCard(LoanSimulation sim) {
    return Container(
      padding: const EdgeInsets.all(AppDimens.spacing16),
      decoration: BoxDecoration(
        color: AppColors.primaryGreen.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(AppDimens.radiusMedium),
        border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Mensualité Périodique :', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              Text(sim.periodicPayment.formatted, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.primaryGreenDark)),
            ],
          ),
          const Divider(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total Intérêts :', style: TextStyle(fontSize: 13)),
              Text(sim.totalInterest.formatted, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Frais de Dossier + Assurance :', style: TextStyle(fontSize: 13)),
              Text((sim.totalFees + sim.totalInsurance).formatted, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Coût Total du Crédit :', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              Text(sim.totalRepayment.formatted, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.primaryGreenDark)),
            ],
          ),
          const Divider(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Text('TEG Annuel (BCEAO) : ', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  Text(sim.tegAnnualRate.toString(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.accentGoldDark)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: sim.isUsuryCompliant ? AppColors.successGreen : AppColors.errorRed,
                  borderRadius: BorderRadius.circular(AppDimens.radiusSmall),
                ),
                child: Text(
                  sim.isUsuryCompliant ? 'Conforme BCEAO (<=24%)' : 'Usure Dépassement (>24%)',
                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildScheduleTable(List<LoanScheduleInstallment> schedule) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppDimens.radiusMedium),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Table(
        border: TableBorder.symmetric(inside: const BorderSide(color: AppColors.dividerColor)),
        columnWidths: const {
          0: FlexColumnWidth(1.2),
          1: FlexColumnWidth(2),
          2: FlexColumnWidth(2),
          3: FlexColumnWidth(2),
          4: FlexColumnWidth(2),
        },
        children: [
          const TableRow(
            decoration: BoxDecoration(color: Color(0xFFF0F4F2)),
            children: [
              Padding(padding: EdgeInsets.all(8), child: Text('N°', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11))),
              Padding(padding: EdgeInsets.all(8), child: Text('Principal', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11))),
              Padding(padding: EdgeInsets.all(8), child: Text('Intérêt', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11))),
              Padding(padding: EdgeInsets.all(8), child: Text('Total', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11))),
              Padding(padding: EdgeInsets.all(8), child: Text('Restant', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11))),
            ],
          ),
          ...schedule.map((inst) => TableRow(
                children: [
                  Padding(padding: const EdgeInsets.all(8), child: Text('${inst.installmentNumber}', style: const TextStyle(fontSize: 11))),
                  Padding(padding: const EdgeInsets.all(8), child: Text(inst.principalDue.formattedAmountOnly, style: const TextStyle(fontSize: 11))),
                  Padding(padding: const EdgeInsets.all(8), child: Text(inst.interestDue.formattedAmountOnly, style: const TextStyle(fontSize: 11))),
                  Padding(padding: const EdgeInsets.all(8), child: Text(inst.totalInstallment.formattedAmountOnly, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11))),
                  Padding(padding: const EdgeInsets.all(8), child: Text(inst.remainingPrincipal.formattedAmountOnly, style: const TextStyle(fontSize: 11, color: AppColors.textMuted))),
                ],
              )),
        ],
      ),
    );
  }
}
