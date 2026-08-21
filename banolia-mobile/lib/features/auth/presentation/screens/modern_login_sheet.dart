import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';

class ModernLoginSheet extends StatefulWidget {
  final Function(String username, String password) onLogin;
  final VoidCallback onBiometric;

  const ModernLoginSheet({
    super.key,
    required this.onLogin,
    required this.onBiometric,
  });

  @override
  State<ModernLoginSheet> createState() => _ModernLoginSheetState();
}

class _ModernLoginSheetState extends State<ModernLoginSheet> {
  final _usernameController = TextEditingController(text: 'issaga.gaye');
  final _passwordController = TextEditingController(text: '••••••••••••');
  bool _obscurePassword = true;
  bool _rememberMe = true;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleSubmit() {
    widget.onLogin(_usernameController.text, _passwordController.text);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      padding: EdgeInsets.only(
        top: 20,
        left: 24,
        right: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 28,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 44,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Institutional Logo & Brand Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(
                    Icons.account_balance_rounded,
                    color: Colors.white,
                    size: 26,
                  ),
                ),
                const SizedBox(width: 14),
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'COOPEC BANQUE',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0F172A),
                        letterSpacing: 0.5,
                      ),
                    ),
                    Text(
                      "Espace Sécurisé Sociétaire",
                      style: TextStyle(
                        fontSize: 11,
                        color: Color(0xFF64748B),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 26),

            // Username field
            const Text(
              "Nom d'utilisateur / Matricule",
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: TextField(
                controller: _usernameController,
                style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                decoration: const InputDecoration(
                  hintText: 'Ex: A0200225 ou nom.prenom',
                  prefixIcon: Icon(Icons.person_outline_rounded, color: Color(0xFF64748B)),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                ),
              ),
            ),
            const SizedBox(height: 18),

            // Password field
            const Text(
              "Mot de passe",
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: TextField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                decoration: InputDecoration(
                  hintText: 'Saisissez votre mot de passe',
                  prefixIcon: const Icon(Icons.lock_outline_rounded, color: Color(0xFF64748B)),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                      color: const Color(0xFF64748B),
                    ),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Remember me + Forgot password row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    SizedBox(
                      width: 24,
                      height: 24,
                      child: Checkbox(
                        value: _rememberMe,
                        onChanged: (val) => setState(() => _rememberMe = val ?? true),
                        activeColor: const Color(0xFF0F172A),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'Se souvenir de moi',
                      style: TextStyle(fontSize: 12, color: Color(0xFF475569), fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
                TextButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Un code OTP sera envoyé par SMS')),
                    );
                  },
                  child: const Text(
                    'Mot de passe oublié ?',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1E3A8A)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Submit Button
            SizedBox(
              height: 52,
              child: ElevatedButton(
                onPressed: _handleSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFE11D48),
                  foregroundColor: Colors.white,
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: const Text(
                  'Se connecter',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Or Fingerprint option
            OutlinedButton.icon(
              onPressed: () {
                Navigator.pop(context);
                widget.onBiometric();
              },
              icon: const Icon(Icons.fingerprint_rounded, color: Color(0xFF0F172A)),
              label: const Text(
                "Utiliser l'empreinte digitale",
                style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.bold, fontSize: 13),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFFCBD5E1)),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
            const SizedBox(height: 22),

            // Registration footer links
            Center(
              child: Column(
                children: [
                  Wrap(
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      const Text(
                        "Vous n'avez pas un compte digital ? ",
                        style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                      ),
                      GestureDetector(
                        onTap: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("Formulaire d'activation digital")),
                          );
                        },
                        child: const Text(
                          "S'inscrire",
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFFE11D48)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      const Text(
                        "Vous n'êtes pas encore adhérent ? ",
                        style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                      ),
                      GestureDetector(
                        onTap: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("Adhésion sociétaire en ligne")),
                          );
                        },
                        child: const Text(
                          "Devenir sociétaire",
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1E3A8A)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
