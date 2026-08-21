import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_dimens.dart';
import '../../../../core/value_objects/money.dart';
import '../../../../shared/widgets/shared_widgets.dart';
import '../../domain/entities/mobile_money_entities.dart';
import '../notifiers/mobile_money_notifier.dart';

class MobileMoneyScreen extends StatefulWidget {
  final MobileMoneyNotifier notifier;

  const MobileMoneyScreen({super.key, required this.notifier});

  @override
  State<MobileMoneyScreen> createState() => _MobileMoneyScreenState();
}

class _MobileMoneyScreenState extends State<MobileMoneyScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _depositPhoneController = TextEditingController(text: '+228 90 00 00 01');
  final _depositAmountController = TextEditingController(text: '25000');
  final _withdrawPhoneController = TextEditingController(text: '+228 90 00 00 01');
  final _withdrawAmountController = TextEditingController(text: '10000');
  final _withdrawPinController = TextEditingController(text: '1234');

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _depositPhoneController.dispose();
    _depositAmountController.dispose();
    _withdrawPhoneController.dispose();
    _withdrawAmountController.dispose();
    _withdrawPinController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Mobile Money Gateway', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.accentGold,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(text: 'Dépôt (Cash-in)', icon: Icon(Icons.arrow_downward)),
            Tab(text: 'Retrait (Cash-out)', icon: Icon(Icons.arrow_upward)),
          ],
        ),
      ),
      body: ListenableBuilder(
        listenable: widget.notifier,
        builder: (context, _) {
          return TabBarView(
            controller: _tabController,
            children: [
              _buildDepositTab(),
              _buildWithdrawalTab(),
            ],
          );
        },
      ),
    );
  }

  Widget _buildProviderSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Sélectionnez votre Opérateur', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        const SizedBox(height: AppDimens.spacing8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: MobileMoneyProvider.values.map((prov) {
              final isSelected = widget.notifier.selectedProvider == prov;
              return Padding(
                padding: const EdgeInsets.only(right: AppDimens.spacing8),
                child: ChoiceChip(
                  label: Text(prov.displayName),
                  selected: isSelected,
                  selectedColor: AppColors.primaryGreen.withValues(alpha: 0.2),
                  onSelected: (_) => widget.notifier.selectProvider(prov),
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildDepositTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppDimens.spacing16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildProviderSelector(),
          const SizedBox(height: AppDimens.spacing16),
          AppTextField(
            label: 'Numéro de Téléphone Portefeuille',
            controller: _depositPhoneController,
            keyboardType: TextInputType.phone,
            prefixIcon: Icons.phone,
          ),
          const SizedBox(height: AppDimens.spacing12),
          AppTextField(
            label: 'Montant du Dépôt (F.CFA)',
            controller: _depositAmountController,
            keyboardType: TextInputType.number,
            prefixIcon: Icons.money,
          ),
          const SizedBox(height: AppDimens.spacing24),
          AppButton(
            label: 'Initier le Dépôt (USSD Push)',
            isLoading: widget.notifier.isLoading,
            onPressed: () async {
              final amount = int.tryParse(_depositAmountController.text) ?? 0;
              final res = await widget.notifier.initiateDeposit(
                memberCode: 'A0200389',
                accountNumber: '251100A020038901',
                customerMsisdn: _depositPhoneController.text,
                amount: Money(amount),
              );
              if (res != null && mounted) {
                _showStatusDialog(res.success, res.actionPromptMessage ?? res.errorMessage ?? '');
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildWithdrawalTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppDimens.spacing16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildProviderSelector(),
          const SizedBox(height: AppDimens.spacing16),
          AppTextField(
            label: 'Numéro de Téléphone Destinataire',
            controller: _withdrawPhoneController,
            keyboardType: TextInputType.phone,
            prefixIcon: Icons.phone,
          ),
          const SizedBox(height: AppDimens.spacing12),
          AppTextField(
            label: 'Montant du Retrait (F.CFA)',
            controller: _withdrawAmountController,
            keyboardType: TextInputType.number,
            prefixIcon: Icons.money,
          ),
          const SizedBox(height: AppDimens.spacing12),
          AppTextField(
            label: 'Code PIN Secret d\'Autorisation',
            controller: _withdrawPinController,
            obscureText: true,
            prefixIcon: Icons.lock,
          ),
          const SizedBox(height: AppDimens.spacing24),
          AppButton(
            label: 'Confirmer le Retrait Immédiat',
            isLoading: widget.notifier.isLoading,
            onPressed: () async {
              final amount = int.tryParse(_withdrawAmountController.text) ?? 0;
              final res = await widget.notifier.initiateWithdrawal(
                memberCode: 'A0200389',
                accountNumber: '251100A020038901',
                recipientMsisdn: _withdrawPhoneController.text,
                amount: Money(amount),
                pinAuthToken: _withdrawPinController.text,
              );
              if (res != null && mounted) {
                _showStatusDialog(res.success, res.actionPromptMessage ?? res.errorMessage ?? '');
              }
            },
          ),
        ],
      ),
    );
  }

  void _showStatusDialog(bool success, String message) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Icon(success ? Icons.check_circle : Icons.error, color: success ? AppColors.successGreen : AppColors.errorRed),
            const SizedBox(width: 8),
            Text(success ? 'Opération Réussie' : 'Échec Opération', style: const TextStyle(fontSize: 16)),
          ],
        ),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}
