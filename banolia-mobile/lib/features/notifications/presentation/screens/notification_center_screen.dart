import 'package:flutter/material.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/utils/date_formatter.dart';

class NotificationCenterScreen extends StatefulWidget {
  final CoopAppState? appState;

  const NotificationCenterScreen({super.key, this.appState});

  @override
  State<NotificationCenterScreen> createState() => _NotificationCenterScreenState();
}

class _NotificationCenterScreenState extends State<NotificationCenterScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Color _getNotifColor(String type) {
    switch (type) {
      case 'CREDIT':
        return const Color(0xFF059669);
      case 'DEBIT':
        return const Color(0xFFE11D48);
      case 'PRET':
        return const Color(0xFF2563EB);
      case 'RETRAIT':
        return const Color(0xFFD97706);
      case 'FIN_DE_MOIS':
        return const Color(0xFF7C3AED);
      default:
        return const Color(0xFF0F172A);
    }
  }

  IconData _getNotifIcon(String type) {
    switch (type) {
      case 'CREDIT':
        return Icons.arrow_downward_rounded;
      case 'DEBIT':
        return Icons.arrow_upward_rounded;
      case 'PRET':
        return Icons.calculate_rounded;
      case 'RETRAIT':
        return Icons.qr_code_rounded;
      case 'FIN_DE_MOIS':
        return Icons.schedule_send_rounded;
      default:
        return Icons.notifications_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = widget.appState ?? CoopAppState();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Notifications & Alertes Mails',
          style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w900, fontSize: 18),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFF0F172A),
          indicatorColor: const Color(0xFF0F172A),
          tabs: const [
            Tab(text: 'Opérations en Direct'),
            Tab(text: 'Courriels & Reçus (Mail)'),
          ],
        ),
      ),
      body: ListenableBuilder(
        listenable: state,
        builder: (context, _) {
          return TabBarView(
            controller: _tabController,
            children: [
              // TAB 1: Notifications d'opérations
              state.notifications.isEmpty
                  ? const Center(child: Text('Aucune notification pour le moment.'))
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: state.notifications.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (ctx, i) {
                        final notif = state.notifications[i];
                        final color = _getNotifColor(notif.type);
                        final icon = _getNotifIcon(notif.type);

                        return Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 4),
                            ],
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: color.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(icon, color: color, size: 22),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(notif.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A))),
                                        Text(
                                          DateFormatter.formatDate(notif.timestamp),
                                          style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(notif.message, style: const TextStyle(fontSize: 12, color: Color(0xFF475569), height: 1.3)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),

              // TAB 2: Courriels & Reçus envoyés ("Mail en cas où")
              state.emailLogs.isEmpty
                  ? const Center(child: Text('Aucun courriel envoyé pour le moment.'))
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: state.emailLogs.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (ctx, i) {
                        final em = state.emailLogs[i];

                        return Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 4),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.mark_email_read_rounded, color: Color(0xFF2563EB), size: 20),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Envoyé à : ${em.recipientEmail}',
                                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF2563EB)),
                                      ),
                                    ],
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(color: const Color(0xFFD1FAE5), borderRadius: BorderRadius.circular(6)),
                                    child: const Text('DELIVRE', style: TextStyle(color: Color(0xFF047857), fontWeight: FontWeight.bold, fontSize: 9)),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(em.subject, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A))),
                              const SizedBox(height: 4),
                              Text(em.bodySummary, style: const TextStyle(fontSize: 11, color: Color(0xFF475569))),
                              if (em.attachmentReference != null) ...[
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(8)),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.attach_file_rounded, size: 14, color: Color(0xFF64748B)),
                                      const SizedBox(width: 4),
                                      Text('Pièce jointe : ${em.attachmentReference}', style: const TextStyle(fontSize: 10, color: Color(0xFF0F172A), fontWeight: FontWeight.w600)),
                                    ],
                                  ),
                                ),
                              ],
                              const SizedBox(height: 6),
                              Text(
                                DateFormatter.formatDateTime(em.sentAt),
                                style: const TextStyle(fontSize: 9, color: Color(0xFF94A3B8)),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ],
          );
        },
      ),
    );
  }
}
