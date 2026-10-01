# Documentation Générale du Système Core Banking Coopératif
**COOPECTAT - ASECNA TOGO (Plateforme Banolia)**
*Version 2.4 - Conforme BCEAO / UMOA & OHADA AUDSCOOP*

---

## 1. Sommaire des Guides et Manuels de Référence

Le présent dossier rassemble l'ensemble des spécifications techniques, financières, actuarielles et juridiques de la plateforme :

| Document | Objet & Description |
| :--- | :--- |
| **[`REGLES_METIER_ET_CALCULS.md`](./REGLES_METIER_ET_CALCULS.md)** | **Guide exhaustif de tous les calculs mathématiques et financiers** : Formules Linéaire vs Dégressif, Échéanciers, Retrait Maximum, Quotité cessible (DSTI), Tontines, Parts sociales, Épargne. |
| **[`STATUT_SOCIETAIRE_VS_CLIENT.md`](./STATUT_SOCIETAIRE_VS_CLIENT.md)** | **Définition juridique et mutualiste du « Sociétaire »** par rapport à un simple « Client » bancaire, philosophie « 1 Personne = 1 Voix », et spécification de la **Carte Sociétaire en Gris Titane**. |
| **[`PRELEVEMENTS_ET_BORDEREAUX.md`](./PRELEVEMENTS_ET_BORDEREAUX.md)** | **Module officiel des Prélèvements** : Bordereaux de paie ASECNA, imputation comptable SYSCOHADA, matricules et règle de terminologie stricte. |
| **[`FORMULAIRES_ET_GUICHET.md`](./FORMULAIRES_ET_GUICHET.md)** | **Procédures de Guichet & Formulaires Officiels** : Fiche de Retrait Partiel N° R, demande de prêt en ligne avec écrit/pièce jointe, et **Obligation formelle de déplacement physique en agence**. |

---

## 2. Vue d'Ensemble de l'Architecture Multi-Plateformes

```
                        ┌────────────────────────────────────────────────────────┐
                        │              SERVEUR CORE BANKING BANOLIA              │
                        │            Node.js / Express / SQLite / JWT            │
                        └───────────────┬────────────────────────┬───────────────┘
                                        │                        │
                   ┌────────────────────┴────────┐      ┌────────┴────────────────────┐
                   ▼                             ▼      ▼                             ▼
    ┌──────────────────────────────┐ ┌──────────────────────────────┐ ┌──────────────────────────────┐
    │     BANOLIA DESKTOP WEB      │ │    BANOLIA MOBILE FLUTTER    │ │     SITE PORTAIL VITRINE     │
    │  Gestion, Caisse & Gérance   │ │  Application Sociétaires     │ │    Informations & Adhésion   │
    │  React 19, TypeScript, Vite  │ │  iOS, Android, PWA, Offline  │ │  React 19, Tailwind, Lucide  │
    └──────────────────────────────┘ └──────────────────────────────┘ └──────────────────────────────┘
```

1. **banolia-server** : Moteur transactionnel, grand livre comptable SYSCOHADA, gestion des matricules et sécurisation des jetons QR.
2. **banolia-desktop** : Station de travail pour la gérante, le caissier, les membres du Comité de Crédit et le Conseil d'Administration.
3. **banolia-mobile** : Application mobile et PWA pour les sociétaires de l'ASECNA (consultation épargne, suivi dettes/prêts, simulateur, demande de crédit, émission de fiches de retrait, carte sociétaire grise).
4. **cooperative-site-vitrine** : Portail public institutionnel de présentation de la coopérative COOPECTAT.

---

## 3. Synthèse des Règles Métier Majeures

### A. Grille des Prêts & Taux d'Intérêt (Plafond 15 000 000 F CFA)
- **Court Terme (0 à 12 mois)** : **5,00 %** en mode **Linéaire Constant**.
- **Moyen Terme (13 à 36 mois)** : **10,00 %** en mode **Linéaire Constant**.
- **Long Terme (37 à 60 mois)** : **9,00 %** en mode **Dégressif (sur Capital Restant Dû)**.

### B. Règle Prudentielle du Retrait Maximum
- **Sans engagement long terme** : Retrait basé directement sur le solde disponible.
- **Avec crédit long terme actif** : $\text{Retrait Max} = \text{Épargne Actuelle} - 50\,000\text{ F (Garantie)} - \text{Crédit Long Terme (CRD)}$.

### C. Présence Physique Obligatoire en Agence
- Toute fiche de retrait générée via le mobile exige formellement la comparution physique du sociétaire au guichet pour émarger la quittance et percevoir les espèces.

### D. Carte du Sociétaire
- La carte sociétaire est habillée en **dégradé de Gris Titane et Acier Métallisé** (`#64748B`, `#475569`, `#334155`, `#1E293B`), symbolisant l'ancrage institutionnel et aéronautique du personnel ASECNA.
