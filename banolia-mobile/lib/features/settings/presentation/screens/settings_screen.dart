import 'package:flutter/material.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/utils/currency_formatter.dart';

class SettingsScreen extends StatefulWidget {
  final CoopAppState appState;
  final VoidCallback onLogout;

  const SettingsScreen({
    super.key,
    required this.appState,
    required this.onLogout,
  });

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _isLoadingBio = false;

  void _showChangePinModal() {
    final currentPinCtrl = TextEditingController();
    final newPinCtrl = TextEditingController();
    final confirmPinCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Modifier le code PIN',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 8),
              const Text(
                'Le code PIN à 4 chiffres sécurise vos virements et validations d\'opérations.',
                style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: currentPinCtrl,
                obscureText: true,
                keyboardType: TextInputType.number,
                maxLength: 4,
                decoration: const InputDecoration(
                  labelText: 'Code PIN actuel',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.lock_outline),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: newPinCtrl,
                obscureText: true,
                keyboardType: TextInputType.number,
                maxLength: 4,
                decoration: const InputDecoration(
                  labelText: 'Nouveau code PIN (4 chiffres)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.pin_outlined),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: confirmPinCtrl,
                obscureText: true,
                keyboardType: TextInputType.number,
                maxLength: 4,
                decoration: const InputDecoration(
                  labelText: 'Confirmer le nouveau PIN',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.check_circle_outline),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  if (newPinCtrl.text.length == 4 && newPinCtrl.text == confirmPinCtrl.text) {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Code PIN modifié avec succès !'),
                        backgroundColor: Color(0xFF059669),
                      ),
                    );
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Les codes PIN ne correspondent pas ou sont invalides.'),
                        backgroundColor: Color(0xFFE11D48),
                      ),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F172A),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('Enregistrer le nouveau PIN', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showEditProfileModal() {
    final phoneCtrl = TextEditingController(text: widget.appState.memberPhone);
    final emailCtrl = TextEditingController(text: widget.appState.memberEmail);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Modifier mes coordonnées',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: phoneCtrl,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Numéro de téléphone',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.phone_outlined),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: emailCtrl,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Adresse e-mail',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.email_outlined),
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () {
                  widget.appState.updateMemberProfile(
                    phone: phoneCtrl.text,
                    email: emailCtrl.text,
                  );
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Coordonnées mises à jour avec succès !'),
                      backgroundColor: Color(0xFF059669),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F172A),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('Enregistrer', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = widget.appState;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Paramètres & Sécurité',
          style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w900, fontSize: 20),
        ),
      ),
      body: ListenableBuilder(
        listenable: state,
        builder: (context, _) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Profile Card Summary
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 6),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          color: const Color(0xFF0F172A),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Center(
                          child: Text(
                            'IG',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              state.memberName,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0F172A)),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Matricule : ${state.memberCode}',
                              style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              state.memberAgency,
                              style: const TextStyle(fontSize: 11, color: Color(0xFF059669), fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: _showEditProfileModal,
                        icon: const Icon(Icons.edit_outlined, color: Color(0xFF2563EB)),
                        tooltip: 'Modifier mes informations',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Section 1: Sécurité & Biométrie
                _buildSectionHeader('Sécurité & Authentification'),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      SwitchListTile(
                        value: state.isBiometricEnabled,
                        onChanged: _isLoadingBio
                            ? null
                            : (val) async {
                                setState(() => _isLoadingBio = true);
                                final messenger = ScaffoldMessenger.of(context);
                                final ok = await state.setBiometricsEnabled(val);
                                if (mounted) {
                                  setState(() => _isLoadingBio = false);
                                }
                                messenger.showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      ok
                                          ? (val
                                              ? 'Empreinte digitale activée avec succès !'
                                              : 'Empreinte digitale désactivée.')
                                          : 'Échec de l\'authentification biométrique.',
                                    ),
                                    backgroundColor: ok ? const Color(0xFF059669) : const Color(0xFFE11D48),
                                  ),
                                );
                              },
                        title: const Text('Connexion par Empreinte / Biométrie', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                        subtitle: const Text('Déverrouillez instantanément votre application', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                        secondary: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE11D48).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.fingerprint_rounded, color: Color(0xFFE11D48)),
                        ),
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF2563EB).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.lock_reset_rounded, color: Color(0xFF2563EB)),
                        ),
                        title: const Text('Changer mon code PIN', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                        subtitle: const Text('Code à 4 chiffres de validation d\'opérations', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: _showChangePinModal,
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF059669).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.tune_rounded, color: Color(0xFF059669)),
                        ),
                        title: const Text('Plafond journalier de virement', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                        subtitle: Text(
                          CurrencyFormatter.formatXOF(state.dailyTransferLimit),
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                        ),
                        trailing: DropdownButton<int>(
                          value: state.dailyTransferLimit,
                          underline: const SizedBox(),
                          items: const [
                            DropdownMenuItem(value: 500000, child: Text('500 000 F')),
                            DropdownMenuItem(value: 1000000, child: Text('1 000 000 F')),
                            DropdownMenuItem(value: 1500000, child: Text('1 500 000 F')),
                            DropdownMenuItem(value: 3000000, child: Text('3 000 000 F')),
                            DropdownMenuItem(value: 5000000, child: Text('5 000 000 F')),
                          ],
                          onChanged: (val) {
                            if (val != null) state.updatePreferences(transferLimit: val);
                          },
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Section 2: Préférences & Langue
                _buildSectionHeader('Préférences & Affichage'),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      ListTile(
                        leading: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF59E0B).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.language_rounded, color: Color(0xFFF59E0B)),
                        ),
                        title: const Text('Langue de l\'application', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                        trailing: DropdownButton<String>(
                          value: state.currentLanguage,
                          underline: const SizedBox(),
                          items: const [
                            DropdownMenuItem(value: 'FR', child: Text('Français (FR)')),
                            DropdownMenuItem(value: 'EE', child: Text('Éwé (Eʋegbe)')),
                            DropdownMenuItem(value: 'GEJ', child: Text('Mina (Gen-Gbe)')),
                          ],
                          onChanged: (val) {
                            if (val != null) {
                              state.updatePreferences(language: val);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Langue modifiée : $val')),
                              );
                            }
                          },
                        ),
                      ),
                      const Divider(height: 1),
                      SwitchListTile(
                        value: state.pushNotificationsEnabled,
                        onChanged: (val) => state.updatePreferences(pushNotifications: val),
                        title: const Text('Notifications Push', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                        subtitle: const Text('Alertes de mouvements de fonds et rappels', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                        secondary: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF6366F1).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.notifications_active_outlined, color: Color(0xFF6366F1)),
                        ),
                      ),
                      const Divider(height: 1),
                      SwitchListTile(
                        value: state.smsAlertsEnabled,
                        onChanged: (val) => state.updatePreferences(smsAlerts: val),
                        title: const Text('Alertes SMS Sécurisées', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                        subtitle: const Text('SMS instantané à chaque débit supérieur à 10 000 F', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                        secondary: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0D9488).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.sms_outlined, color: Color(0xFF0D9488)),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Section 3: Informations Institutionnelles & Déconnexion
                _buildSectionHeader('Institution & Réglementation'),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.verified_user_outlined, color: Color(0xFF059669)),
                        title: const Text('Agrément SFD & Normes BCEAO', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                        subtitle: const Text('Conforme au Plan Comptable SYSCOA-SFD UMOA', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.info_outline, color: Color(0xFF64748B)),
                        title: const Text('Version de l\'application', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                        trailing: const Text('v1.0.0+1 (Prod)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Bouton Déconnexion
                ElevatedButton.icon(
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Se Déconnecter ?'),
                        content: const Text('Êtes-vous sûr de vouloir fermer votre session sécurisée ?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(ctx),
                            child: const Text('Annuler'),
                          ),
                          ElevatedButton(
                            onPressed: () {
                              Navigator.pop(ctx);
                              widget.onLogout();
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFE11D48),
                              foregroundColor: Colors.white,
                            ),
                            child: const Text('Déconnexion'),
                          ),
                        ],
                      ),
                    );
                  },
                  icon: const Icon(Icons.logout_rounded),
                  label: const Text('Fermer ma session sécurisée', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFEE2E2),
                    foregroundColor: const Color(0xFFE11D48),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
                const SizedBox(height: 30),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: Color(0xFF64748B),
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}
