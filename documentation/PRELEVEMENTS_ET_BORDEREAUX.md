# Module Officiel des Prélèvements & Bordereaux de Paie
**Gestion des Flux de Prélèvement (ASECNA TOGO / COOPECTAT)**
*Norme Comptable SYSCOHADA SFD & Traitement Mensuel des Paies*

---

## 1. Terminologie Officielle Exclusive : « Prélèvement »

Conformément aux instructions de gouvernance, l'ensemble des écrans, rapports, bordereaux et modèles de données emploient **exclusivement et strictement** le terme **« Prélèvement »** (sans aucune mention de *retenues*, *à la source*, *à la base*, etc.).

---

## 2. Flux Opérationnel des Prélèvements

```
               ┌────────────────────────────────────────────────────────┐
               │       ADHÉSION SOCIÉTAIRE / ACCORD D'OCTROI DE PRÊT    │
               │         (Autorisation formelle signée par l'agent)     │
               └──────────────────────────┬─────────────────────────────┘
                                          │
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │       GÉNÉRATION MENSUELLE DU BORDEREAU DE PRÉLÈVEMENT │
               │   • Total Épargne Mensuelle programmée                 │
               │   • Échéances de Prêt (Capital + Intérêts)             │
               │   • Cotisations Tontine & Parts Sociales               │
               └──────────────────────────┬─────────────────────────────┘
                                          │
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │         TRANSMISSION ET VALIDATION DU PRÉLÈVEMENT      │
               │             (Traitement direct sur paie ASECNA)        │
               └──────────────────────────┬─────────────────────────────┘
                                          │
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │       VENTILATION COMPTABLE AUTOMATIQUE (CORE BANKING) │
               │   • Crédit du compte Livret Épargne Sociétaire         │
               │   • Amortissement du compte de Prêt (Capital + Intérêt)│
               │   • Reçu numérique & Notification sociétaire instantanée│
               └────────────────────────────────────────────────────────┘
```

---

## 3. Structure d'un Enregistrement de Prélèvement

Chaque ligne de prélèvement est liée au matricule professionnel officiel de l'adhérent (ex. matricule `130049`) :

```json
{
  "matriculeAsecna": "130049",
  "nomComplet": "KODJO Mawuli",
  "compteEpargne": "2512110013004901",
  "prelevementEpargne": 50000,
  "prelevementPret": 131250,
  "prelevementTontine": 0,
  "totalPrelevement": 181250,
  "statut": "EXECUTE",
  "dateValeur": "2026-09-30"
}
```

---

## 4. Fonctionnalités Implémentées dans le Core Banking

1. **Bordereau Récapitulatif Mensuel** :
   - Export au format PDF officiel et tableur Excel/CSV pour le service de paie.
   - Totalisation automatique avec contrôle de cohérence entre le montant global mandaté et la somme des débits unitaires.
2. **Réconciliation et Lettrage Automatique** :
   - Rapprochement en 1 clic lors de la réception du virement global de salaire.
   - Enregistrement des écritures de journal SYSCOHADA (Compte 521 Banque / Compte 251 Dépôts d'épargne / Compte 204 Crédits).
3. **Notification et Reçu Électronique** :
   - Émission immédiate d'un accusé de réception dans l'espace sociétaire mobile (`Remboursement par prélèvement effectué`).
