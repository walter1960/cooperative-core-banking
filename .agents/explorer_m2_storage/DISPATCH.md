## 2026-08-20T01:01:47Z
Investigate and design the technical blueprint for the Local Offline-First Database and Storage layer in `banolia-desktop/`.
Required reading:
- /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/ORIGINAL_REQUEST.md
- /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/PROJECT.md
- /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/sub_orch_m2_desktop/SCOPE.md
- /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/explorer_survey_2/survey_apps.md
- Inspect the existing codebase in /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/banolia-desktop

Focus Areas:
1. Local Database architecture (SQLite / Tauri SQLite plugin / IndexedDB / RxDB / Dexie / custom local store) for offline resilience.
2. Complete schema design for: members, accounts, loan files, cash shifts, transactions, audit logs, sync queue.
3. State management, migration strategy, reactivity in React 19 / TypeScript / Vite.
4. Offline data integrity, encryption at rest for sensitive member & biometric data.
5. Provide actionable implementation steps, component structure, and test verification strategies for the Worker.
