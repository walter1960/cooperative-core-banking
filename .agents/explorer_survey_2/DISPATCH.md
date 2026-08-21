## 2026-08-20T00:57:49Z

You are Explorer 2 (Frontend & Mobile Apps Explorer).
Your Working Directory is: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/explorer_survey_2
The Project Root is: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE
The Authoritative Requirements file is: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/ORIGINAL_REQUEST.md

Task:
1. Read /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/ORIGINAL_REQUEST.md.
2. Investigate the project root to inspect any existing code, UI projects, configurations.
3. Conduct an in-depth technical analysis for:
   - Requirement 2: Desktop Offline-First application (Tauri / React):
     * Local storage / SQLite offline database schema.
     * Bidirectional sync engine: batch sync, idempotency keys, conflict resolution (timestamp/vector clock/server-wins).
     * ESC/POS 80mm thermal receipt generator (formatting, cut command, logo, receipt numbering).
     * USB biometric mock/hardware support.
     * Cashier shift balancing (ouverture de caisse, dépôts/retraits, arrêté de caisse, écarts).
   - Requirement 3: Mobile Banking & Field Collector application (Flutter):
     * Sociétaire UI: Solde réel vs solde gelé, relevé d'opérations, demandes de micro-crédits.
     * Mobile Money Gateways: TMoney, Flooz, Wave, MTN MoMo, Orange Money (mockable/integrated API layer).
     * Offline Tontine Field Collector mode: collecteur terrain, synchro par lot, reçus Bluetooth thermal printer.
4. Document component architecture, state management, offline sync protocols, hardware abstraction layers, and test strategy.
5. Write your complete findings to /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/explorer_survey_2/survey_apps.md and summarize in handoff.md.
6. Send a message to your parent when done.
