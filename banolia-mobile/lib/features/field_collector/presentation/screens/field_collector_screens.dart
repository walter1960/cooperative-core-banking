import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_dimens.dart';
import '../../../../core/constants/bceao_constants.dart';
import '../../../../core/value_objects/money.dart';
import '../../../../shared/widgets/shared_widgets.dart';
import '../../../receipt/receipt_generator_service.dart';
import '../../../receipt/virtual_thermal_printer_mock.dart';
import '../../../tontine/domain/entities/tontine_entities.dart';
import '../../../tontine/presentation/notifiers/tontine_notifier.dart';
import '../../domain/entities/field_collector_entities.dart';
import '../notifiers/field_collector_notifier.dart';

class FieldCollectorHomeScreen extends StatefulWidget {
  final FieldCollectorNotifier collectorNotifier;
  final TontineNotifier tontineNotifier;
  final VirtualThermalPrinterMock printerMock;

  const FieldCollectorHomeScreen({
    super.key,
    required this.collectorNotifier,
    required this.tontineNotifier,
    required this.printerMock,
  });

  @override
  State<FieldCollectorHomeScreen> createState() => _FieldCollectorHomeScreenState();
}

class _FieldCollectorHomeScreenState extends State<FieldCollectorHomeScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    widget.collectorNotifier.loadShiftAndRoster();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('BANOLIA Démarcheur (Terrain)', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.calculate),
            tooltip: 'Arrêté de Caisse & Billetage',
            onPressed: () {
              Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => ShiftReconciliationScreen(
                  collectorNotifier: widget.collectorNotifier,
                  printerMock: widget.printerMock,
                ),
              ));
            },
          ),
        ],
      ),
      body: ListenableBuilder(
        listenable: widget.collectorNotifier,
        builder: (context, _) {
          final shift = widget.collectorNotifier.activeShift;

          return Column(
            children: [
              // Shift Status Header
              _buildShiftHeader(shift),

              // Search & Route Controls
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppDimens.spacing16, vertical: AppDimens.spacing8),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _searchController,
                        onChanged: (q) => widget.collectorNotifier.search(q),
                        decoration: InputDecoration(
                          hintText: 'Recherche adhérent, étal, code...',
                          prefixIcon: const Icon(Icons.search, color: AppColors.primaryGreen),
                          filled: true,
                          fillColor: Colors.white,
                          contentPadding: const EdgeInsets.symmetric(vertical: 0),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(AppDimens.radiusMedium),
                            borderSide: const BorderSide(color: AppColors.borderLight),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton.filled(
                      style: IconButton.styleFrom(backgroundColor: AppColors.primaryGreen),
                      icon: const Icon(Icons.near_me, color: Colors.white),
                      tooltip: 'Trier par distance GPS',
                      onPressed: () {
                        widget.collectorNotifier.sortByDistance(6.12870, 1.21580);
                      },
                    ),
                  ],
                ),
              ),

              // Member Roster List
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(AppDimens.spacing16),
                  itemCount: widget.collectorNotifier.members.length,
                  separatorBuilder: (_, __) => const SizedBox(height: AppDimens.spacing8),
                  itemBuilder: (context, index) {
                    final member = widget.collectorNotifier.members[index];
                    return _buildMemberCard(member, shift);
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildShiftHeader(CollectorShift? shift) {
    if (shift == null) {
      return Container(
        padding: const EdgeInsets.all(AppDimens.spacing16),
        color: AppColors.warningOrange.withValues(alpha: 0.15),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Aucune session active', style: TextStyle(fontWeight: FontWeight.bold)),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryGreen, foregroundColor: Colors.white),
              onPressed: () {
                widget.collectorNotifier.openShift(
                  collectorId: 'COL-04',
                  collectorName: 'K. MINTA',
                  deviceId: 'DEV-POS-04',
                );
              },
              child: const Text('Ouvrir la Journée'),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(AppDimens.spacing16),
      decoration: const BoxDecoration(
        color: AppColors.primaryGreenDark,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(shift.shiftCode, style: const TextStyle(color: AppColors.accentGold, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 2),
              Text('${shift.collectorName} (${shift.collectorId})', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(shift.totalCollectedAmount.formatted, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
              Text('${shift.transactionCount} cotisations', style: const TextStyle(color: Colors.white70, fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMemberCard(FieldMember member, CollectorShift? shift) {
    return InkWell(
      onTap: shift == null
          ? null
          : () {
              Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => TontineCollectionScreen(
                  member: member,
                  shift: shift,
                  collectorNotifier: widget.collectorNotifier,
                  tontineNotifier: widget.tontineNotifier,
                  printerMock: widget.printerMock,
                ),
              ));
            },
      borderRadius: BorderRadius.circular(AppDimens.radiusMedium),
      child: Container(
        padding: const EdgeInsets.all(AppDimens.spacing12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppDimens.radiusMedium),
          border: Border.all(color: AppColors.borderLight),
        ),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: AppColors.primaryGreen.withValues(alpha: 0.1),
              child: Text(member.manualNumber, style: const TextStyle(color: AppColors.primaryGreen, fontWeight: FontWeight.bold, fontSize: 12)),
            ),
            const SizedBox(width: AppDimens.spacing12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(member.fullName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 2),
                  Text('${member.stallNumber} • ${member.marketSector}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }
}

class TontineCollectionScreen extends StatefulWidget {
  final FieldMember member;
  final CollectorShift shift;
  final FieldCollectorNotifier collectorNotifier;
  final TontineNotifier tontineNotifier;
  final VirtualThermalPrinterMock printerMock;

  const TontineCollectionScreen({
    super.key,
    required this.member,
    required this.shift,
    required this.collectorNotifier,
    required this.tontineNotifier,
    required this.printerMock,
  });

  @override
  State<TontineCollectionScreen> createState() => _TontineCollectionScreenState();
}

class _TontineCollectionScreenState extends State<TontineCollectionScreen> {
  final String _cardId = 'CARD-2026-0883';

  @override
  void initState() {
    super.initState();
    widget.tontineNotifier.loadCard(_cardId);
  }

  Future<void> _collectAmount(int amountXof) async {
    final card = widget.tontineNotifier.activeCard;
    if (card == null) return;

    final entry = await widget.tontineNotifier.recordCotisation(
      shiftId: widget.shift.id,
      rootHash: widget.shift.rootHash,
      lastEntryHash: widget.shift.tipHash,
      currentSequenceNumber: widget.shift.transactionCount,
      memberCode: widget.member.memberCode,
      memberName: widget.member.fullName,
      stallNumber: widget.member.stallNumber,
      paymentAmount: Money(amountXof),
    );

    if (entry != null) {
      final updatedShift = widget.shift.copyWith(
        transactionCount: widget.shift.transactionCount + 1,
        totalCollectedAmount: widget.shift.totalCollectedAmount + Money(amountXof),
        tipHash: entry.entryHash,
      );
      await widget.collectorNotifier.repository.saveShift(updatedShift);
      await widget.collectorNotifier.loadShiftAndRoster();

      final receiptData = CotisationReceiptData(
        receiptNumber: entry.receiptNumber,
        timestamp: entry.timestampUtc,
        collectorName: widget.shift.collectorName,
        collectorId: widget.shift.collectorId,
        memberName: widget.member.fullName,
        memberCode: widget.member.memberCode,
        cardId: _cardId,
        stallNumber: widget.member.stallNumber,
        dailyMise: card.dailyMise,
        daysPaidCount: entry.stampsAllocatedCount,
        allocatedStamps: entry.stampsIndices,
        totalAmount: Money(amountXof),
        cumulativeMonth: entry.cumulativeAfter,
        totalDaysDone: card.paidDaysCount + entry.stampsAllocatedCount,
        remainingToPay: Money(card.dailyMise.amountXof * (31 - (card.paidDaysCount + entry.stampsAllocatedCount))),
        creditBuffer: Money.zero,
        idempotencyKey: entry.idempotencyKey,
        signatureHmac: entry.signatureHmac,
      );

      final bytes = ReceiptGeneratorService.generateCotisationReceiptBytes(receiptData);
      await widget.printerMock.connect('00:11:22:33:44:55');
      await widget.printerMock.sendRawBytes(bytes);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.successGreen,
            content: Text('Cotisation de ${Money(amountXof).formatted} enregistrée & reçu imprimé !'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: Text(widget.member.fullName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
      ),
      body: ListenableBuilder(
        listenable: widget.tontineNotifier,
        builder: (context, _) {
          final card = widget.tontineNotifier.activeCard;
          if (card == null) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(AppDimens.spacing16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildCardInfo(card),
                const SizedBox(height: AppDimens.spacing16),

                const Text('Grille des Timbres (Cycle 31 Jours)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: AppDimens.spacing8),
                _buildStampGrid(card),
                const SizedBox(height: AppDimens.spacing24),

                const Text('Encaissement Rapide 1-Tap', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: AppDimens.spacing12),
                Row(
                  children: [
                    Expanded(child: _buildPresetButton(1000, '1 Jour')),
                    const SizedBox(width: 8),
                    Expanded(child: _buildPresetButton(2000, '2 Jours')),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(child: _buildPresetButton(3000, '3 Jours')),
                    const SizedBox(width: 8),
                    Expanded(child: _buildPresetButton(5000, '5 Jours')),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildCardInfo(FieldTontineCard card) {
    return Container(
      padding: const EdgeInsets.all(AppDimens.spacing16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppDimens.radiusMedium),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Carnet : ${card.id}', style: const TextStyle(fontWeight: FontWeight.bold)),
              Text('Mise : ${card.dailyMise.formatted}/j', style: const TextStyle(color: AppColors.primaryGreen, fontWeight: FontWeight.bold)),
            ],
          ),
          const Divider(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Cumul : ${card.cumulativeAmount.formatted}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              Text('Payés : ${card.paidDaysCount} / 31 j', style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStampGrid(FieldTontineCard card) {
    return Container(
      padding: const EdgeInsets.all(AppDimens.spacing12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppDimens.radiusMedium),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 7,
          mainAxisSpacing: 6,
          crossAxisSpacing: 6,
          childAspectRatio: 1.1,
        ),
        itemCount: 31,
        itemBuilder: (context, index) {
          final day = index + 1;
          final isPaid = card.isDayPaid(day);
          final isCommission = day == 31;

          return Container(
            decoration: BoxDecoration(
              color: isPaid
                  ? AppColors.primaryGreen
                  : (isCommission ? AppColors.accentGold.withValues(alpha: 0.2) : AppColors.backgroundLight),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(
                color: isPaid
                    ? AppColors.primaryGreen
                    : (isCommission ? AppColors.accentGold : AppColors.borderLight),
              ),
            ),
            child: Center(
              child: Text(
                '$day',
                style: TextStyle(
                  color: isPaid ? Colors.white : AppColors.textPrimary,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPresetButton(int amount, String label) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: AppDimens.spacing12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppDimens.radiusMedium)),
      ),
      onPressed: () => _collectAmount(amount),
      child: Column(
        children: [
          Text(Money(amount).formatted, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          Text(label, style: const TextStyle(fontSize: 11, color: Colors.white70)),
        ],
      ),
    );
  }
}

class ShiftReconciliationScreen extends StatefulWidget {
  final FieldCollectorNotifier collectorNotifier;
  final VirtualThermalPrinterMock printerMock;

  const ShiftReconciliationScreen({
    super.key,
    required this.collectorNotifier,
    required this.printerMock,
  });

  @override
  State<ShiftReconciliationScreen> createState() => _ShiftReconciliationScreenState();
}

class _ShiftReconciliationScreenState extends State<ShiftReconciliationScreen> {
  final Map<int, TextEditingController> _controllers = {};

  @override
  void initState() {
    super.initState();
    for (final denom in BceaoConstants.allDenominations) {
      _controllers[denom] = TextEditingController(text: '0');
    }
  }

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  BilletageReconciliation _computeReconciliation() {
    final items = <BilletageItem>[];
    for (final denom in BceaoConstants.allDenominations) {
      final count = int.tryParse(_controllers[denom]?.text ?? '0') ?? 0;
      items.add(BilletageItem(denomination: denom, count: count));
    }
    return widget.collectorNotifier.reconcileBilletage(items);
  }

  @override
  Widget build(BuildContext context) {
    final recon = _computeReconciliation();
    final shift = widget.collectorNotifier.activeShift;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Arrêté de Caisse & Billetage', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppDimens.spacing16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSummaryCard(recon),
            const SizedBox(height: AppDimens.spacing16),

            const Text('Comptage des Espèces Physiques (12 Coupures)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: AppDimens.spacing8),
            ...BceaoConstants.allDenominations.map((denom) => _buildDenomRow(denom)),

            const SizedBox(height: AppDimens.spacing24),
            AppButton(
              label: 'Clôturer la Session & Imprimer l\'Arrêté',
              onPressed: shift == null
                  ? null
                  : () async {
                      final closed = await widget.collectorNotifier.closeShift();
                      if (closed != null && mounted) {
                        final data = ShiftReconciliationReceiptData(
                          shiftCode: closed.shiftCode,
                          collectorName: closed.collectorName,
                          collectorId: closed.collectorId,
                          openedAt: closed.openedAt,
                          closedAt: closed.closedAt ?? DateTime.now(),
                          transactionCount: closed.transactionCount,
                          journalTotal: closed.totalCollectedAmount,
                          physicalCash: recon.totalPhysicalCash,
                          variance: recon.variance,
                          status: recon.isBalanced ? 'CAISSE JUSTE' : (recon.isShortage ? 'MANQUANT' : 'EXCÉDENT'),
                          rootHash: closed.rootHash,
                          tipHash: closed.tipHash,
                        );
                        final bytes = ReceiptGeneratorService.generateShiftReconciliationReceiptBytes(data);
                        await widget.printerMock.connect('00:11:22:33:44:55');
                        await widget.printerMock.sendRawBytes(bytes);

                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            backgroundColor: AppColors.successGreen,
                            content: Text('Session clôturée avec succès ! Reçu arrêté généré.'),
                          ),
                        );
                        Navigator.of(context).pop();
                      }
                    },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryCard(BilletageReconciliation recon) {
    return Container(
      padding: const EdgeInsets.all(AppDimens.spacing16),
      decoration: BoxDecoration(
        color: recon.isBalanced
            ? AppColors.successGreen.withValues(alpha: 0.1)
            : (recon.isShortage ? AppColors.errorRed.withValues(alpha: 0.1) : AppColors.warningOrange.withValues(alpha: 0.1)),
        borderRadius: BorderRadius.circular(AppDimens.radiusMedium),
        border: Border.all(
          color: recon.isBalanced ? AppColors.successGreen : (recon.isShortage ? AppColors.errorRed : AppColors.warningOrange),
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total Journalisé :', style: TextStyle(fontSize: 13)),
              Text(recon.journalTotal.formatted, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Espèces Comptées :', style: TextStyle(fontSize: 13)),
              Text(recon.totalPhysicalCash.formatted, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            ],
          ),
          const Divider(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                recon.isBalanced
                    ? 'CAISSE JUSTE (Compte ${recon.accountingAccountCode})'
                    : (recon.isShortage ? 'MANQUANT (Compte ${recon.accountingAccountCode})' : 'EXCÉDENT (Compte ${recon.accountingAccountCode})'),
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: recon.isBalanced ? AppColors.successGreen : (recon.isShortage ? AppColors.errorRed : AppColors.warningOrange),
                ),
              ),
              Text(
                recon.variance.formatted,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: recon.isBalanced ? AppColors.successGreen : (recon.isShortage ? AppColors.errorRed : AppColors.warningOrange),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDenomRow(int denom) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppDimens.radiusSmall),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '${Money(denom).formattedAmountOnly} F',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          const Text('x', style: TextStyle(color: AppColors.textMuted)),
          const SizedBox(width: 12),
          SizedBox(
            width: 80,
            child: TextField(
              controller: _controllers[denom],
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(isDense: true, contentPadding: EdgeInsets.all(6)),
            ),
          ),
        ],
      ),
    );
  }
}
