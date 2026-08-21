import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_dimens.dart';
import '../../../../shared/widgets/shared_widgets.dart';
import '../../domain/entities/member_portal_entities.dart';
import '../notifiers/member_portal_notifiers.dart';

class MemberDashboardScreen extends StatefulWidget {
  final MemberPortalNotifier notifier;
  final VoidCallback onNavigateToLoanSimulator;
  final VoidCallback onNavigateToMobileMoney;
  final VoidCallback onNavigateToHistory;

  const MemberDashboardScreen({
    super.key,
    required this.notifier,
    required this.onNavigateToLoanSimulator,
    required this.onNavigateToMobileMoney,
    required this.onNavigateToHistory,
  });

  @override
  State<MemberDashboardScreen> createState() => _MemberDashboardScreenState();
}

class _MemberDashboardScreenState extends State<MemberDashboardScreen> {
  @override
  void initState() {
    super.initState();
    widget.notifier.loadDashboard('A0200389');
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.notifier,
      builder: (context, _) {
        if (widget.notifier.isLoading && widget.notifier.member == null) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator(color: AppColors.primaryGreen)),
          );
        }

        final member = widget.notifier.member;
        final tripleBalance = widget.notifier.aggregatedSavingsBalance;

        return Scaffold(
          backgroundColor: AppColors.backgroundLight,
          appBar: AppBar(
            backgroundColor: AppColors.primaryGreen,
            elevation: 0,
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('COOPEC BANOLIA', style: TextStyle(fontSize: 14, color: AppColors.accentGold, fontWeight: FontWeight.bold)),
                Text(member?.fullName ?? 'Sociétaire', style: const TextStyle(fontSize: 16, color: Colors.white, fontWeight: FontWeight.bold)),
              ],
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.history, color: Colors.white),
                onPressed: widget.onNavigateToHistory,
              ),
            ],
          ),
          body: RefreshIndicator(
            color: AppColors.primaryGreen,
            onRefresh: () => widget.notifier.loadDashboard('A0200389'),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppDimens.spacing16),
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Triple Balance Card
                  _buildTripleBalanceCard(tripleBalance),
                  const SizedBox(height: AppDimens.spacing16),

                  // Quick Action Buttons
                  _buildQuickActions(),
                  const SizedBox(height: AppDimens.spacing24),

                  // Accounts Portfolio
                  const Text(
                    'Mes Comptes & Portefeuilles',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: AppDimens.spacing12),
                  ...widget.notifier.accounts.map((acc) => _buildAccountTile(acc)),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildTripleBalanceCard(TripleBalance balance) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primaryGreenDark, AppColors.primaryGreen],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppDimens.radiusLarge),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryGreenDark.withValues(alpha: 0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(AppDimens.spacing20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'SOLDE DISPONIBLE',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.accentGold, letterSpacing: 1.1),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(AppDimens.radiusSmall),
                ),
                child: const Text('BCEAO XOF', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: AppDimens.spacing8),
          CurrencyDisplay(
            money: balance.availableBalance,
            isLarge: true,
            color: Colors.white,
          ),
          const Divider(color: Colors.white24, height: AppDimens.spacing24),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Solde Réel (Total)', style: TextStyle(fontSize: 12, color: Colors.white70)),
                    const SizedBox(height: 2),
                    Text(balance.realBalance.formatted, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Solde Gelé (Garantie)', style: TextStyle(fontSize: 12, color: AppColors.accentGoldLight)),
                    const SizedBox(height: 2),
                    Text(balance.frozenBalance.formatted, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.accentGoldLight)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Row(
      children: [
        Expanded(
          child: _buildActionButton(
            label: 'Mobile Money',
            icon: Icons.phone_android,
            color: AppColors.accentGoldDark,
            onTap: widget.onNavigateToMobileMoney,
          ),
        ),
        const SizedBox(width: AppDimens.spacing12),
        Expanded(
          child: _buildActionButton(
            label: 'Simuler Prêt',
            icon: Icons.calculate_outlined,
            color: AppColors.primaryGreen,
            onTap: widget.onNavigateToLoanSimulator,
          ),
        ),
        const SizedBox(width: AppDimens.spacing12),
        Expanded(
          child: _buildActionButton(
            label: 'Historique',
            icon: Icons.receipt_long,
            color: AppColors.infoBlue,
            onTap: widget.onNavigateToHistory,
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton({
    required String label,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppDimens.radiusMedium),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: AppDimens.spacing12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppDimens.radiusMedium),
          border: Border.all(color: AppColors.borderLight),
        ),
        child: Column(
          children: [
            CircleAvatar(
              radius: 20,
              backgroundColor: color.withValues(alpha: 0.12),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: AppDimens.spacing8),
            Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          ],
        ),
      ),
    );
  }

  Widget _buildAccountTile(Account account) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppDimens.spacing12),
      padding: const EdgeInsets.all(AppDimens.spacing16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppDimens.radiusMedium),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: AppColors.primaryGreen.withValues(alpha: 0.1),
            child: Icon(_getAccountIcon(account.accountType), color: AppColors.primaryGreen),
          ),
          const SizedBox(width: AppDimens.spacing16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(account.productName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 2),
                Text('N° ${account.accountNumber}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(account.balance.availableBalance.formatted, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.primaryGreenDark)),
              if (account.balance.frozenBalance.isPositive) ...[
                const SizedBox(height: 2),
                Text('Gelé: ${account.balance.frozenBalance.formatted}', style: const TextStyle(fontSize: 11, color: AppColors.frozenBalanceColor)),
              ],
            ],
          ),
        ],
      ),
    );
  }

  IconData _getAccountIcon(AccountType type) {
    switch (type) {
      case AccountType.savingsOrdinary:
      case AccountType.savingsLivret:
        return Icons.account_balance_wallet;
      case AccountType.shares:
        return Icons.pie_chart;
      case AccountType.termDeposit:
        return Icons.lock_clock;
      case AccountType.tontine:
        return Icons.event_repeat;
      case AccountType.loan:
        return Icons.monetization_on;
      case AccountType.collateralHold:
        return Icons.shield;
      case AccountType.projectPlan:
        return Icons.savings;
    }
  }
}

class TransactionHistoryScreen extends StatelessWidget {
  final MemberPortalNotifier notifier;

  const TransactionHistoryScreen({super.key, required this.notifier});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Historique des Transactions', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
      ),
      body: ListenableBuilder(
        listenable: notifier,
        builder: (context, _) {
          if (notifier.isLoading) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen));
          }

          if (notifier.transactions.isEmpty) {
            return const Center(child: Text('Aucune transaction enregistrée'));
          }

          return ListView.separated(
            padding: const EdgeInsets.all(AppDimens.spacing16),
            itemCount: notifier.transactions.length,
            separatorBuilder: (_, __) => const SizedBox(height: AppDimens.spacing8),
            itemBuilder: (context, index) {
              final tx = notifier.transactions[index];
              return Container(
                padding: const EdgeInsets.all(AppDimens.spacing12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(AppDimens.radiusMedium),
                  border: Border.all(color: AppColors.borderLight),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: tx.isCredit
                          ? AppColors.successGreen.withValues(alpha: 0.12)
                          : AppColors.errorRed.withValues(alpha: 0.12),
                      child: Icon(
                        tx.isCredit ? Icons.arrow_downward : Icons.arrow_upward,
                        color: tx.isCredit ? AppColors.successGreen : AppColors.errorRed,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: AppDimens.spacing12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(tx.description, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          const SizedBox(height: 2),
                          Text('Réf: ${tx.receiptNumber}', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '${tx.isCredit ? '+' : '-'}${tx.amount.formatted}',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: tx.isCredit ? AppColors.successGreen : AppColors.errorRed,
                          ),
                        ),
                        if (tx.feeAmount.isPositive)
                          Text('Frais: ${tx.feeAmount.formatted}', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                      ],
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
