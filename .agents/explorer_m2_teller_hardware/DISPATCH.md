## 2026-08-20T01:01:48Z
You are Explorer 2 for Milestone 2: Desktop Offline-First Agency App (`banolia-desktop`).
Working Directory: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/explorer_m2_teller_hardware
Parent Conversation ID: 81c1836d-6cdf-4446-bf1c-2b845b0ff1eb

Your Mission:
Investigate and design the technical blueprint for Teller Desk Operations, ESC/POS Thermal Printing, and USB Biometrics (ISO 19794-2) in `banolia-desktop/`.
Required reading:
- /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/ORIGINAL_REQUEST.md
- /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/PROJECT.md
- /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/sub_orch_m2_desktop/SCOPE.md
- /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/explorer_survey_2/survey_apps.md
- Inspect the existing codebase in /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/banolia-desktop

Focus Areas:
1. Teller Desk UI/UX & operations: deposit, withdrawal, internal transfer, account opening, quick cash buttons, change calculator.
2. ESC/POS Receipt Engine: 80mm & 58mm thermal receipt generation, ESC/POS command sequences (cut, bold, align, barcode/QR), auto-print trigger, ticket sequencing.
3. USB Biometric Authentication: ISO 19794-2 minutiae template extraction/matching standard, hardware driver bridge (Tauri/native) + robust mock driver fallback for simulation & CI testing.
4. Member identification flow (fingerprint match -> account lookup -> KYC check).
5. Provide actionable implementation steps, component structure, and test verification strategies for the Worker.
