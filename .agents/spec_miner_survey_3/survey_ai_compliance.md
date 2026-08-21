# Spécification Technique & Réglementaire : Assistant IA Vocal Multimodal & Stratégie de Test E2E (Banolia Core)

**Système :** BANOLIA Microfinance Suite  
**Périmètre :** R4 (Assistant Vocal Multimodal & Analyseur Financier Réglementaire BCEAO) & Stratégie de Test Globale E2E (Tiers 1 à 4)  
**Auteur :** Spec Miner 3 (AI & Regulatory Compliance Spec Miner)  
**Date :** 2026-08-20  
**Statut :** Spécification de Référence Validée  

---

## 1. Vue d'Ensemble & Contexte Réglementaire UMOA/BCEAO

La plateforme BANOLIA est conçue pour les Systèmes Financiers Décentralisés (SFD) et Coopératives d'Épargne et de Crédit (COOPEC/MUTUELLES) de l'Union Monétaire Ouest-Africaine (UMOA : Bénin, Burkina Faso, Côte d'Ivoire, Guinée-Bissau, Mali, Niger, Sénégal, Togo).

Ce document formalise :
1. **L'Assistant Vocal IA Multimodal (Gemini API)** : Architecture temps-réel, extraction structurée d'ordres de caisse en <2s, gestion trilingue (Français, Éwé, Mina) et analyse prédictive des ratios prudentiels.
2. **Le Moteur de Calcul des Ratios Prudentiels BCEAO** : Formulations mathématiques exactes, tables de correspondance avec le plan comptable SYSCOA-SFD, et règles de provisionnement réglementaires.
3. **La Matrice de Test E2E Exhaustive (Tiers 1 à 4)** : Protocoles de qualification de la résilience offline-first, de l'idempotence des transactions, et des scénarios métier complexes.

---

## 2. R4.1 : Moteur d'Extraction Vocale d'Ordres de Caisse (Gemini API)

### 2.1 Architecture & Budget de Latence (< 2.000 ms)

Le système capture le flux audio au niveau du poste guichetier ou de l'application mobile et effectue une inférence structurée via l'API Gemini 1.5/2.0 Flash.

| Étape | Composant | Latence Max Allouée | Description Technique |
|---|---|---|---|
| **1. Capture & VAD** | Client Web/Desktop/Mobile | 250 ms | Voice Activity Detection (silence 400ms), encodage Opus / PCM 16kHz mono |
| **2. Transport Réseau** | HTTP/2 / WebRTC / gRPC | 150 ms | Streaming direct vers le proxy backend ou endpoint Google Cloud |
| **3. Inférence Gemini** | Gemini Flash (JSON Mode) | 850 ms | Parsing multimodal (Audio/Text -> Schema JSON structuré) |
| **4. Validation & Résolution** | Banolia Core Engine | 150 ms | Résolution fuzzy de l'adhérent, vérification du solde et règles de gestion |
| **5. Feedback Vocal (TTS)** | Synthèse vocale locale/cloud | 500 ms | Synthèse audio de confirmation ("Versement de 50 000 F validé") |
| **TOTAL** | **Pipeline Global** | **1 900 ms (< 2s)** | **Objectif de performance atteint** |

### 2.2 Schéma JSON Strict d'Extraction d'Ordre de Caisse (Draft-07)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "VoiceCashierOrder",
  "description": "Représentation structurée d'une instruction financière extraite de la voix",
  "type": "object",
  "properties": {
    "intent": {
      "type": "string",
      "enum": [
        "CASH_DEPOSIT",
        "CASH_WITHDRAWAL",
        "LOAN_REPAYMENT",
        "TONTINE_COLLECTION",
        "SHARE_SUBSCRIPTION",
        "BALANCE_INQUIRY",
        "ACCOUNT_STATEMENT",
        "UNKNOWN"
      ]
    },
    "confidence_score": {
      "type": "number",
      "minimum": 0.0,
      "maximum": 1.0,
      "description": "Indice de confiance du modèle sur l'extraction globale"
    },
    "member_identifier": {
      "type": "object",
      "properties": {
        "raw_spoken_text": { "type": "string" },
        "matched_member_code": { "type": ["string", "null"] },
        "matched_manual_number": { "type": ["string", "null"] },
        "matched_full_name": { "type": ["string", "null"] },
        "resolution_confidence": { "type": "number", "minimum": 0.0, "maximum": 1.0 }
      },
      "required": ["raw_spoken_text"]
    },
    "financial_data": {
      "type": "object",
      "properties": {
        "amount": {
          "type": ["integer", "null"],
          "minimum": 1,
          "description": "Montant exprimé en Francs CFA (XOF), strictement entier"
        },
        "currency": {
          "type": "string",
          "default": "XOF",
          "enum": ["XOF"]
        },
        "spoken_amount_words": { "type": ["string", "null"] }
      },
      "required": ["amount", "currency"]
    },
    "target_account": {
      "type": "object",
      "properties": {
        "account_type": {
          "type": "string",
          "enum": ["SAVINGS", "CURRENT", "LOAN", "TONTINE", "PROJECT_PLAN", "CAREER_PLAN", "SHARES", "DEFAULT"]
        },
        "account_number": { "type": ["string", "null"] }
      },
      "required": ["account_type"]
    },
    "language_detected": {
      "type": "string",
      "enum": ["fr-FR", "ee-TG", "gej-TG", "mixed"]
    },
    "requires_cashier_confirmation": {
      "type": "boolean",
      "default": true
    },
    "clarification_prompt": {
      "type": ["string", "null"],
      "description": "Question de confirmation ou de clarification générée pour le guichetier"
    }
  },
  "required": [
    "intent",
    "confidence_score",
    "member_identifier",
    "financial_data",
    "target_account",
    "language_detected",
    "requires_cashier_confirmation"
  ],
  "additionalProperties": false
}
```

### 2.3 Prompt Système & Instructions Gemini (System Prompt)

```markdown
Vous êtes BANOLIA Voice Core, l'intelligence artificielle financière spécialisée dans la reconnaissance et l'extraction d'ordres de caisse et opérations de microfinance pour les agences d'Afrique de l'Ouest (zone UMOA : Togo, Bénin, Côte d'Ivoire, Sénégal, etc.).

Votre rôle est d'analyser l'instruction vocale ou textuelle prononcée par le guichetier ou le sociétaire (en français, éwé ou mina) et de produire EXCLUSIVEMENT un objet JSON conforme au schéma spécifié, avec une précision absolue sur les montants et les adhérents.

### Règles de conversion des montants (XOF) :
1. "50 mille" / "cinquante mille" -> 50000
2. "1 million" / "un million" -> 1000000
3. "deux cent cinquante mille" -> 250000
4. "kplé blaetɔ̃" (Éwé : 30 000) -> 30000
5. "kotoku ɖeka" (Éwé / Mina : 1 sac / 1 million) -> 1000000
6. "akpe blaeve vɔ atɔ̃" (Éwé : 25 000) -> 25000
7. Les montants en Francs CFA sont TOUJOURS des nombres entiers sans décimales.

### Règles d'identification des opérations :
- Dépôt / Versement / Mettre de l'argent / "ga dodo" / "ga kɔkɔɖo" -> intent: "CASH_DEPOSIT"
- Retrait / Sortie / Tirer de l'argent / "ga ɖeɖe" / "ga yiyi" -> intent: "CASH_WITHDRAWAL"
- Remboursement prêt / Payer mensualité / "fe ququ" -> intent: "LOAN_REPAYMENT"
- Cotisation tontine / Mettre ma mise / "asusu" / "tontine" -> intent: "TONTINE_COLLECTION"
- Consultation de solde / "nénie le nye akɔnti me" / "mon compte est à combien" -> intent: "BALANCE_INQUIRY"

### Format de Réponse :
Vous devez retourner STRICTEMENT du JSON valide, sans balises de code Markdown (` ```json `), sans commentaire ni texte périphérique.
```

---

## 3. R4.2 : Spécification Multilingue & Traitement NLP (Français, Éwé, Mina)

### 3.1 Matrice Linguistique & Codes Locales

| Langue | Code BCP 47 | Zone Géographique Principale | Usage Principal dans Banolia |
|---|---|---|---|
| **Français** | `fr-FR` / `fr-TG` | Afrique Francophone / UMOA | Écrans administratifs, reçus officiels, comptabilité, guichet formel |
| **Éwé (Evegbe)** | `ee-TG` / `ee-GH` | Togo (Maritime, Plateaux), Ghana Volta | Application Mobile Sociétaire, Assistant Vocal, Guichet Rural |
| **Mina (Gen-Gbe)** | `gej-TG` / `gej-BJ` | Lomé Urbain, Région Côtière Togo, Aného, Ouidah (Bénin) | Collecte Tontine Marché, Vocaux Commerçants, Synthèse Mobile |

### 3.2 Dictionnaire Terminologique de Microfinance & Numération

#### A. Lexique des Opérations

| Notion Microfinance | Français (`fr-FR`) | Éwé (`ee-TG`) | Mina (`gej-TG`) |
|---|---|---|---|
| **Versement / Dépôt** | Dépôt / Versement / Mettre sur compte | Ga dodo ɖe akɔnta me / Ga kɔkɔɖo | Ga dido / Ga sɔ do akɔnti me |
| **Retrait** | Retrait d'argent / Tirer | Ga ɖeɖe le akɔnta me | Ga ɖeɖe / Ga yiyi |
| **Solde du compte** | Solde disponible / Situation de compte | Ga si le akɔnta me / Ga susɔe | Ga ci le akɔnti me |
| **Remboursement de prêt** | Remboursement crédit / Mensualité | Fe ququ / Ga didi qu | Fe ququ / Efe dodo |
| **Cotisation Tontine** | Mise quotidienne / Tontine | Asusu dodo / Gbesiagbe gakɔkɔɖo | Tontine dido / Asusu |
| **Part Sociale** | Parts sociales de membre | Habɔbɔ gomekpɔkpɔ ga | Hɛnnu ga / Gomekpɔkpɔ ga |
| **Intérêts** | Intérêts d'épargne / Intérêts de prêt | Ga dzi dzidzi / Ga dzi vi | Ga dzi vidodo |
| **Garantie / Caution** | Caution financière / Nantissement | Ga si wotsɔ ɖo teƒe / Kpeɖodzi | Awobado ga / Apanu |

#### B. Numération Financière (XOF)

| Montant XOF | Français | Éwé | Mina |
|---|---|---|---|
| **1 000 F** | Mille francs | Akpe ɖeka | Akpe ɖeka |
| **5 000 F** | Cinq mille francs | Akpe atɔ̃ | Akpe atɔ̃ |
| **10 000 F** | Dix mille francs | Akpe ewo | Akpe ewo |
| **25 000 F** | Vingt-cinq mille francs | Akpe blaeve vɔ atɔ̃ | Akpe blaeve vɔ atɔ̃ |
| **50 000 F** | Cinquante mille francs | Akpe blaatɔ̃ (ou kotoku afã) | Akpe blaatɔ̃ |
| **100 000 F** | Cent mille francs | Akpe alafa ɖeka | Akpe lafa ɖeka |
| **500 000 F** | Cinq cent mille francs | Akpe alafa atɔ̃ | Akpe lafa atɔ̃ |
| **1 000 000 F** | Un million de francs | Kotoku ɖeka / Miliyɔn ɖeka | Kotoku ɖeka / Lafa ewo |

### 3.3 Exemples Few-Shot Multilingues pour le Moteur IA

```json
[
  {
    "input_transcript": "Fais un versement de cinquante mille francs pour MILDZINA Tomrom sur son épargne",
    "expected_output": {
      "intent": "CASH_DEPOSIT",
      "confidence_score": 0.98,
      "member_identifier": {
        "raw_spoken_text": "MILDZINA Tomrom",
        "matched_member_code": "A0200225",
        "matched_manual_number": "610",
        "matched_full_name": "MILDZINA Tomrom",
        "resolution_confidence": 0.99
      },
      "financial_data": {
        "amount": 50000,
        "currency": "XOF",
        "spoken_amount_words": "cinquante mille francs"
      },
      "target_account": {
        "account_type": "SAVINGS",
        "account_number": "25121100A020022501"
      },
      "language_detected": "fr-FR",
      "requires_cashier_confirmation": true,
      "clarification_prompt": "Confirmez-vous le versement de 50 000 F.CFA sur le compte Épargne de MILDZINA Tomrom ?"
    }
  },
  {
    "input_transcript": "Médi be maɖo akpe blaeve vɔ atɔ̃ ɖe Ablavi Amouzou ƒe asusu me",
    "expected_output": {
      "intent": "TONTINE_COLLECTION",
      "confidence_score": 0.95,
      "member_identifier": {
        "raw_spoken_text": "Ablavi Amouzou",
        "matched_member_code": "A0200227",
        "matched_manual_number": "612",
        "matched_full_name": "AMOUZOU Ablavi",
        "resolution_confidence": 0.97
      },
      "financial_data": {
        "amount": 25000,
        "currency": "XOF",
        "spoken_amount_words": "akpe blaeve vɔ atɔ̃"
      },
      "target_account": {
        "account_type": "TONTINE",
        "account_number": null
      },
      "language_detected": "ee-TG",
      "requires_cashier_confirmation": true,
      "clarification_prompt": "Èɖo kpe edzi be yeado 25.000 F.CFA ɖe AMOUZOU Ablavi ƒe asusu me a?"
    }
  },
  {
    "input_transcript": "Nénie le nye akɔnti me kpoo?",
    "expected_output": {
      "intent": "BALANCE_INQUIRY",
      "confidence_score": 0.94,
      "member_identifier": {
        "raw_spoken_text": "nye",
        "matched_member_code": null,
        "matched_manual_number": null,
        "matched_full_name": null,
        "resolution_confidence": 0.80
      },
      "financial_data": {
        "amount": null,
        "currency": "XOF",
        "spoken_amount_words": null
      },
      "target_account": {
        "account_type": "SAVINGS",
        "account_number": null
      },
      "language_detected": "gej-TG",
      "requires_cashier_confirmation": false,
      "clarification_prompt": "Ga ci le o kɔnti me yia?"
    }
  }
]
```

---

## 4. R4.3 : Analyseur Financier & Ratios Prudentiels BCEAO (Instructions SFD)

### 4.1 Référentiel Réglementaire BCEAO / UMOA

Les institutions de microfinance (SFD) doivent calculer et transmettre périodiquement leurs états financiers et ratios conformément aux directives :
- **Loi Portant Réglementation des Systèmes Financiers Décentralisés** (Loi Uniforme SFD)
- **Instruction N° 02/2012/RB** relative aux ratios prudentiels applicables aux SFD
- **Plan Comptable des SFD (SYSCOA-SFD)**

### 4.2 Formules Mathématiques Exactes & Seuils Réglementaires

#### Ratio 1 : Ratio de Liquidité Globale ($R_{LIQ}$)
- **Formule :**
  $$R_{LIQ} = \frac{\text{Actifs Disponibles et Réalisables à Court Terme (< 1 an)}}{\text{Passifs Exigibles à Court Terme (< 1 an)}} \times 100$$
- **Comptes SYSCOA-SFD :**
  - **Numérateur :** Classe 5 (Disponibilités en caisse `57`, Banque `52`, Trésor `53`) + Créances à court terme recouvrables (`201` + `202` échéance < 1 an)
  - **Dénominateur :** Dépôts d'épargne à vue (`251`), Dépôts à terme échus (`252`), Dettes financières court terme (`16` à < 1 an)
- **Norme Prudentielle BCEAO :** $\ge 100\%$
- **Sanction si infraction :** Blocage de l'octroi de nouveaux crédits par la commission bancaire.

#### Ratio 2 : Portefeuille à Risque à 30 jours ($PAR_{30}$) et 90 jours ($PAR_{90}$)
- **Formule :**
  $$PAR_{X} = \frac{\text{Encours Total des Crédits ayant au moins une échéance impayée depuis plus de } X \text{ jours}}{\text{Encours Brut Total du Portefeuille de Crédit}} \times 100$$
- **Comptes SYSCOA-SFD :**
  - **Numérateur ($PAR_{30}$) :** Compte `2081` (Créances en souffrance 31-90j) + `2082` (91-180j) + `2083` (181-360j) + `2084` (> 360j)
  - **Numérateur ($PAR_{90}$) :** Compte `2082` + `2083` + `2084`
  - **Dénominateur :** Compte `20` (Total Brut des Concours et Prêts aux Sociétaires)
- **Norme Prudentielle BCEAO :**
  - $PAR_{30} \le 5.00\%$
  - $PAR_{90} \le 3.00\%$

#### Ratio 3 : Taux d'Autosuffisance Opérationnelle ($OSS$)
- **Formule :**
  $$OSS = \frac{\text{Produits Financiers} + \text{Autres Produits d'Exploitation}}{\text{Charges Financières} + \text{Charges Générales d'Exploitation} + \text{Dotations aux Provisions sur Crédits}} \times 100$$
- **Comptes SYSCOA-SFD :**
  - **Numérateur :** Classe 7 (`70` Produits financiers sur crédits + `71` Commissions + `75` Autres produits)
  - **Dénominateur :** Classe 6 (`60` Charges financières sur épargne + `62`/`63` Services extérieurs + `64` Impôts + `66` Charges de personnel + `69` Dotations aux provisions sur créances)
- **Norme de Viabilité :** $\ge 100\%$ (Viabilité pérenne visée : $\ge 115\%$)

#### Ratio 4 : Taux d'Autosuffisance Financière ($FSS$)
- **Formule :**
  $$FSS = \frac{\text{Produits d'Exploitation Ajustés}}{\text{Charges d'Exploitation Ajustées} + \text{Coût d'Opportunité du Capital} + \text{Ajustement d'Inflation sur Fonds Propres}} \times 100$$
- **Norme de Viabilité :** $\ge 100\%$

#### Ratio 5 : Ratio de Couverture des Risques / Adéquation des Fonds Propres ($CAR$)
- **Formule :**
  $$CAR = \frac{\text{Fonds Propres Prudentiels Nets}}{\text{Total des Actifs Pondérés par les Risques}} \times 100$$
- **Comptes SYSCOA-SFD :**
  - **Numérateur :** Classe 10 (`101` Capital social / Parts sociales + `11` Réserves légales et statutaires + `12` Report à nouveau - Pertes de l'exercice)
  - **Dénominateur :** Actifs pondérés (Caisse: 0%, Dépôts bancaires: 20%, Crédits garantis: 50%, Crédits ordinaires: 100%, Immobilisations: 100%)
- **Norme Prudentielle BCEAO :** $\ge 15.00\%$

#### Ratio 6 : Norme de Division des Risques (Risque Individuel Maximum)
- **Formule :**
  $$\text{Engagement Max par Adhérent} = \frac{\text{Encours Net de Crédits accordés à un seul Sociétaire/Groupe}}{\text{Fonds Propres Prudentiels Nets}} \times 100$$
- **Norme Prudentielle BCEAO :** $\le 10.00\%$ des Fonds Propres

### 4.3 Barème Réglementaire de Provisionnement Obligatoire des Créances (BCEAO)

| Catégorie de Créance | Durée de l'Impayé | Taux de Provisionnement Obligatoire | Compte de Charge | Compte de Provision |
|---|---|---|---|---|
| **Créance Saine** | 0 à 30 jours | **0%** (ou 1% provision générale) | `6911` | `2901` |
| **Créance Pré-douteuse** | 31 à 90 jours | **20%** | `6912` | `2902` |
| **Créance Douteuse** | 91 à 180 jours | **50%** | `6913` | `2903` |
| **Créance Litigieuse / Compromise** | 181 à 360 jours | **100%** | `6914` | `2904` |
| **Créance Irrécouvrable** | > 360 jours | **100%** + Passage en perte | `6711` | `2084` |

### 4.4 Prompt Système Gemini : Diagnostic & Analyseur Financier pour la Direction

```markdown
Vous êtes BANOLIA Executive Financial Auditor, un expert-comptable spécialisé dans la réglementation bancaire et prudentielle des SFD de la zone UMOA (BCEAO / SYSCOA-SFD).

Votre mission est d'analyser les balances comptables, encours de crédits et états de trésorerie d'un SFD pour générer :
1. Les ratios prudentiels calculés avec une précision à 2 décimales.
2. L'évaluation de la conformité réglementaire (CONFORME, ATTENTION, EN_INFRACTION).
3. Les risques de liquidité, de crédit (PAR30/90) et de solvabilité.
4. Une synthèse narrative en français exécutif destinée au Conseil d'Administration et au Directeur Général, mettant en évidence les actions correctives urgentes.

### Schéma de Sortie Attendu :
{
  "period": "string (ex: 2026-Q3)",
  "currency": "XOF",
  "prudential_ratios": {
    "liquidity_ratio": { "value": number, "regulatory_min": 100.0, "status": "CONFORME|INFRACTION", "delta": number },
    "par_30": { "value": number, "regulatory_max": 5.0, "status": "CONFORME|INFRACTION", "delta": number },
    "par_90": { "value": number, "regulatory_max": 3.0, "status": "CONFORME|INFRACTION", "delta": number },
    "operational_self_sufficiency": { "value": number, "benchmark_min": 100.0, "status": "VIABLE|NON_VIABLE", "delta": number },
    "capital_adequacy_ratio": { "value": number, "regulatory_min": 15.0, "status": "CONFORME|INFRACTION", "delta": number }
  },
  "provisioning_audit": {
    "total_required_provisions": number,
    "actual_booked_provisions": number,
    "provision_gap": number
  },
  "executive_summary": "string",
  "top_risks_identified": ["string"],
  "recommended_actions": ["string"]
}
```

---

## 5. Stratégie Exhaustive de Test E2E (Tiers 1 à 4)

La validation de BANOLIA repose sur une architecture de test rigoureuse à 4 niveaux :

```
       ▲
      / \
     /   \     TIER 4 : Scénarios Réels & Journée Bancaire Complète
    /     \
   /-------\   TIER 3 : Concurrence, Sync Race Conditions & Multi-Terminaux
  /         \
 /-----------\ TIER 2 : Cas Limites, Frontières & Robustesse Linguistique
/-------------\TIER 1 : Couverture Fonctionnelle Nominale (>= 5 par domaine)
```

---

### 5.1 TIER 1 : Couverture Fonctionnelle Nominale (>= 5 tests par domaine)

#### Domaine A : Core Banking & Paramétrage Réglementaire (Fineract/SYSCOA)
| ID Test | Cas de Test | Préconditions | Données d'Entrée | Comportement Attendu |
|---|---|---|---|---|
| **T1-CB-01** | Création sociétaire avec parts sociales obligatoires | Agence ouverte, produit parts sociales configuré à 5 000 F | Nom: "KODJO Afi", Parts: 1 (5 000 XOF), Frais adhésion: 2 000 XOF | Sociétaire créé au statut `ACTIF`, compte capital `1011` crédité de 5 000 F, compte produits `71` crédité de 2 000 F |
| **T1-CB-02** | Dépôt sur compte d'épargne ordinaire | Compte épargne actif (solde: 50 000 F) | Montant: 25 000 XOF, Mode: CASH | Solde réel et disponible passent à 75 000 F, écriture Débit Caisse `571` / Crédit Épargne `2512` |
| **T1-CB-03** | Retrait espèces autorisé dans la limite du disponible | Compte épargne (solde dispo: 100 000 F, gelé: 10 000 F) | Montant retrait: 40 000 XOF | Retrait accepté, solde dispo = 60 000 F, solde gelé inchangé (10 000 F), reçu généré |
| **T1-CB-04** | Calcul échéancier prêt amortissement constant | Produit crédit validé | Montant: 1 200 000 F, Taux: 12% an, Durée: 12 mois | Mensualité calculée = 106 619 F.CFA, tableau généré avec 12 lignes exactes au centime près |
| **T1-CB-05** | Remboursement mensualité prêt par caisse | Prêt en cours, mensualité échue de 106 619 F | Versement caisse: 106 619 XOF | Ventilation automatique : Capital restant réduit de 94 619 F, Intérêts perçus `701` = 12 000 F |

#### Domaine B : Logiciel d'Agence Desktop Offline-First (Tauri/React)
| ID Test | Cas de Test | Préconditions | Données d'Entrée | Comportement Attendu |
|---|---|---|---|---|
| **T1-DK-01** | Opération de versement en mode déconnecté complet | Mode réseau forcé à `OFFLINE`, caisse ouverte (solde: 200 000 F) | Versement: 50 000 F sur compte A0200225 | Solde local mis à jour immédiatement (250 000 F), transaction injectée en `PENDING_OFFLINE` avec clé idempotente |
| **T1-DK-02** | Rétablissement réseau & synchronisation automatique | 3 transactions en attente dans la queue IndexedDB/LocalStorage | Connexion réseau rétablie (`isOnline: true`), clic synchroniser | Les 3 transactions basculent en statut `SYNCED`, queue vidée, zéro duplication sur le serveur |
| **T1-DK-03** | Impression thermique de reçu 80mm ESC/POS | Imprimante connectée / simulateur print | Validation transaction versement 50 000 F | Ticket formaté à 80mm généré avec N° reçu, date, heure, nom caissier, code adhérent et ref idempotence |
| **T1-DK-04** | Clôture et arrêté de caisse journalier | Caisse ouverte, 10 opérations effectuées | Clic "Clôturer caisse", comptage physique saisi | Bilan caisse calculé (Solde théorique vs réel), journal de caisse figé, export PDF disponible |
| **T1-DK-05** | Recherche fuzzy d'adhérent offline | Base locale contenant 1 000 membres synchronisés | Recherche: "mildz" ou "610" | Résultat instantané < 50ms renvoyant "MILDZINA Tomrom (Code: A0200225)" |

#### Domaine C : Mobile Banking & Passerelles Mobile Money (Flutter)
| ID Test | Cas de Test | Préconditions | Données d'Entrée | Comportement Attendu |
|---|---|---|---|---|
| **T1-MB-01** | Consultation solde sécurisée biométrie | Compte mobile authentifié | Authentification FaceID/Empreinte réussie | Affichage solde réel, solde disponible, solde tontine et derniers mouvements en < 500ms |
| **T1-MB-02** | Dépôt autonome via TMoney (Togo) | Solde TMoney sociétaire suffisant | Montant: 10 000 XOF, Téléphone: 90123456 | Requête API TMoney Push USSD initiée, callback webhook `SUCCESS`, compte épargne crédité de 10 000 F |
| **T1-MB-03** | Dépôt autonome via Flooz (Moov Togo/Bénin) | Solde Flooz suffisant | Montant: 20 000 XOF, Téléphone: 98765432 | Push Flooz validé par OTP, compte crédité instantanément |
| **T1-MB-04** | Dépôt autonome via Wave (Sénégal/CI/Togo) | Application Wave installée | Montant: 15 000 XOF | Redirection deep-link Wave, paiement validé, webhook Banolia crédite le compte |
| **T1-MB-05** | Collecte tontine terrain hors-ligne par agent | Agent connecté sur mobile terrain sans 4G | Scan QR Code membre, saisie mise: 1 000 F | Reçu Bluetooth ESC/POS 58mm imprimé sur imprimante portable, transaction stockée en SQLite local |

#### Domaine D : Assistant Vocal IA Multimodal (Gemini API)
| ID Test | Cas de Test | Préconditions | Données d'Entrée | Comportement Attendu |
|---|---|---|---|---|
| **T1-AI-01** | Extraction ordre dépôt en français standard | Micro activé, modal assistant ouvert | Audio: "Versement de cinquante mille francs pour Tomrom" | JSON extrait : `intent: CASH_DEPOSIT`, `amount: 50000`, `member: A0200225`, latence < 2s |
| **T1-AI-02** | Extraction ordre retrait en Éwé | Micro activé | Audio: "Médi be maɖe akpe ewo le nye ga me" | JSON extrait : `intent: CASH_WITHDRAWAL`, `amount: 10000`, confirmation générée en Éwé |
| **T1-AI-03** | Extraction collecte tontine en Mina | Micro activé | Audio: "Sɔ asusu gbeɖeka tɔ 1000 F do na Ablavi" | JSON extrait : `intent: TONTINE_COLLECTION`, `amount: 1000`, membre résolu: AMOUZOU Ablavi |
| **T1-AI-04** | Consultation vocale de solde | Micro activé | Audio: "Donne-moi la situation de l'adhérent 610" | JSON extrait : `intent: BALANCE_INQUIRY`, fiche financière affichée, synthèse vocale du solde |
| **T1-AI-05** | Calcul des ratios prudentiels BCEAO | Données comptables du trimestre injectées | Déclenchement "Analyser ratios" | Ratios $R_{LIQ}$, $PAR_{30}$, $PAR_{90}$, $OSS$, $CAR$ calculés avec diagnostic d'infraction exact |

---

### 5.2 TIER 2 : Cas Limites, Frontières & Robustesse (>= 5 tests par domaine)

#### Domaine A : Cas Limites Financiers & Règles de Gestion
| ID Test | Cas Limite Testé | Données d'Entrée | Comportement Attendu / Protection |
|---|---|---|---|
| **T2-FIN-01** | Retrait supérieur au solde disponible (fonds gelés) | Solde réel: 50 000 F, Gelé: 40 000 F (Dispo: 10 000 F). Tentative retrait: 15 000 F | Rejet strict avec message : "Solde disponible insuffisant (10 000 F disponibles, 40 000 F gelés pour garantie prêt)" |
| **T2-FIN-02** | Montant négatif ou nul | Saisie montant: `-5000` ou `0` | Blocage au niveau formulaire (validation HTML5/Zod) et rejet backend HTTP 400 |
| **T2-FIN-03** | Dépassement du plafond de caisse guichetier | Solde caisse actuel: 4 900 000 F, Plafond max assurance: 5 000 000 F. Dépôt: 200 000 F | Avertissement bloquant : "Plafond d'encaisse guichet dépassé (5 100 000 F > 5 000 000 F). Effectuer un versement de délestage vers le coffre-fort." |
| **T2-FIN-04** | Taux d'intérêt de crédit supérieur au taux d'usure BCEAO | Saisie prêt avec taux d'intérêt annuel = 28.5% (Seuil max BCEAO SFD = 24% - 27%) | Rejet réglementaire automatique : "Taux usuraire non conforme aux instructions BCEAO (Max autorisé: 24.0%)" |
| **T2-FIN-05** | Division par zéro dans l'analyseur financier | SFD en phase de démarrage avec 0 F de crédits octroyés ($Dénominateur PAR = 0$) | Le moteur gère le cas avec valeur $PAR = 0.00\%$ et flag `"NO_LOAN_PORTFOLIO"`, sans crash ni `NaN` |

#### Domaine B : Cas Limites Linguistiques & Phonétiques IA
| ID Test | Cas Limite Testé | Données d'Entrée | Comportement Attendu / Protection |
|---|---|---|---|
| **T2-LNG-01** | Homophonie des montants oraux en français | Audio: "Verser cent sous" vs "Verser cinq sous" vs "Verser 500" | Le moteur applique le filtre monétaire XOF : interprète 500 F.CFA et demande confirmation explicite |
| **T2-LNG-02** | Adhérents homonymes dans la même agence | Audio: "Dépôt de 25 000 pour Koffi Mensah" (Deux adhérents "AGBODJAN Koffi Mensah" et "MENSAH Koffi") | `requires_cashier_confirmation: true`, `resolution_confidence: 0.50`, modal affiche les deux fiches avec photos pour désambiguïsation manuelle |
| **T2-LNG-03** | Bruit de fond ambiant élevé de marché (75 dB) | Audio enregistré avec brouhaha de marché d'Adawlato + klaxons | Filtre VAD spectral + Gemini Flash maintient un indice de confiance >= 0.85 ou émet `clarification_prompt` |
| **T2-LNG-04** | Mélange de langues (Code-switching Français / Mina) | Audio: "Fais-moi un dépôt de akpe blaeve pour tonton Koffi sur son épargne" | Détection `language_detected: "mixed"`, extraction exacte : 20 000 XOF sur compte épargne |
| **T2-LNG-05** | Audio muet ou coupure réseau en plein enregistrement | Silence absolu de 3s ou socket WebRTC interrompu | Timeout propre à 2s, réinitialisation de l'état microphone sans bloquer l'UI guichet |

---

### 5.3 TIER 3 : Concurrence, Synchronisation & Race Conditions

| ID Test | Scénario de Concurrence | Déroulement & Conflit Potentiel | Résolution & Invariant Garanti |
|---|---|---|---|
| **T3-RAC-01** | **Retrait Mobile vs Retrait Guichet Déconnecté** | 1. Solde compte: 50 000 F.<br>2. Guichet offline exécute un retrait de 40 000 F.<br>3. Simultanément sur l'application mobile en ligne, le sociétaire retire 40 000 F via Wave.<br>4. Le guichet se reconnecte et synchronise. | **Résolution déterministe :** La transaction mobile en ligne est validée en premier (solde = 10 000 F). Lors de la synchronisation du guichet, la transaction locale offline est appliquée avec horodatage certifié, le compte bascule en découvert technique contrôlé (solde = -30 000 F), une alerte d'audit est envoyée au Directeur d'Agence et un blocage préventif des retraits ultérieurs est activé sur le membre. |
| **T3-RAC-02** | **Double Synchronisation Concurrentielle (Idempotence)** | L'agent de caisse clique frénétiquement 5 fois de suite sur "Synchroniser Maintenant" avec 15 opérations en attente. | Les 15 requêtes possèdent des `idempotencyKey` uniques (`idemp-tx-XXXX`). Le serveur Fineract/Banolia ignore les 4 requêtes en doublon (HTTP 409 / Return Cached Result) et n'écrit les écritures comptables qu'une seule et unique fois. |
| **T3-RAC-03** | **Collecte Tontine Multi-Collecteurs sur le même membre** | Deux collecteurs de tontine sur le marché collectent chacun 1 000 F auprès d'AMOUZOU Ablavi à 10h15 et 10h20 en mode déconnecté. | Les deux carnets sont uploadés le soir : le grand livre tontine enregistre 2 mises distinctes (total = 2 000 F sur le mois), les 2 reçus imprimés sont rattachés aux deux collecteurs respectifs. |
| **T3-RAC-04** | **Coupure Réseau en Pleine Écriture de Synchronisation par Lot (Chunk Split)** | Un lot de 100 transactions est en cours d'envoi. Le réseau coupe à la 47ème transaction. | Transaction SQL atomique côté serveur : soit le lot complet est validé, soit la transaction est annulée. Côté client, seules les transactions ayant reçu un accusé de réception serveur passent à `SYNCED`. Les transactions 48 à 100 restent en `PENDING_OFFLINE` pour la prochaine tentative. |
| **T3-RAC-05** | **Modification Simultanée du Profil Membre en Offline et Online** | L'agence modifie l'adresse du membre hors-ligne, tandis que le back-office central met à jour son numéro de téléphone en ligne. | Algorithme CRDT / Last-Write-Wins par champ : le numéro de téléphone et la nouvelle adresse sont fusionnés sans écraser les champs non conflictuels. |

---

### 5.4 TIER 4 : Scénarios Réels & Journée Bancaire Complète (Day-in-the-Life)

#### Scénario T4-SC-01 : Simulation d'une Journée Bancaire Complète en Agence
1. **07h30 (Ouverture) :** Le caissier ouvre sa caisse avec un fond de roulement physique de 250 000 F.CFA. Le système vérifie l'intégrité de la base locale.
2. **08h30 - 11h30 (Heure de pointe guichet) :** Traitement de 45 opérations (30 dépôts, 10 retraits, 5 remboursements de crédit) dont 12 initiées par l'Assistant Vocal IA. Reçus 80mm imprimés à la volée.
3. **11h30 (Coupure Générale Fibre & Électricité) :** Bascule sur onduleur. L'application continue à 100% en mode déconnecté pendant 3 heures. 25 opérations de caisse sont enregistrées localement.
4. **14h30 (Retour Réseau) :** Détection automatique du cloud Fineract. Synchronisation silencieuse en tâche de fond des 25 opérations en 1,4 seconde.
5. **16h30 (Arrêté de Caisse) :** Comptage physique des billets et pièces par coupures (10 000, 5 000, 2 000, 1 000, 500, 100). Écart de caisse = 0 F.CFA. Clôture validée avec signature électronique.
6. **17h00 (Rapport de Direction) :** L'Analyseur IA génère le diagnostic des ratios BCEAO de la journée et transmet l'alerte de liquidité au Directeur Général.

#### Scénario T4-SC-02 : Tournée Complète Collecteur de Tontine de Marché
1. **06h00 :** Le collecteur synchronise 150 fiches de tontiniers sur son smartphone Flutter avant de partir au Grand Marché de Lomé.
2. **07h00 - 13h00 (Tournée Marché sans réseau) :** 120 commerçantes versent leur mise quotidienne de 1 000 F ou 2 000 F. Le collecteur saisit au doigt ou dicte en Mina ("Asusu 1000 na Da Afiwa"). Impression immédiate de 120 mini-tickets thermiques Bluetooth 58mm.
3. **14h00 (Retour Agence) :** Connexion au Wi-Fi de l'agence. Upload en un clic du lot de 120 collectes (Montant total collecté : 145 000 F.CFA). Versement des espèces au caissier principal qui valide le bordereau de collecte.

---

## 6. Schémas d'API & Contrats d'Interface

### 6.1 Endpoint API Assistant Vocal (`POST /api/v1/voice/process-command`)

```typescript
// Request Payload (Multipart ou JSON Base64)
export interface VoiceProcessRequest {
  audio_base64?: string;          // PCM 16kHz Mono ou WebM/Opus
  audio_format?: 'pcm16' | 'webm' | 'mp3' | 'wav';
  transcript_text?: string;       // Si STT effectué côté client
  current_agency_code: string;    // Ex: "A02"
  cashier_id: string;             // Ex: "MINDIZINA TOMROM"
  preferred_locale?: 'fr-FR' | 'ee-TG' | 'gej-TG';
}

// Response Payload (< 2000ms)
export interface VoiceProcessResponse {
  success: boolean;
  latency_ms: number;
  extracted_order: {
    intent: 'CASH_DEPOSIT' | 'CASH_WITHDRAWAL' | 'LOAN_REPAYMENT' | 'TONTINE_COLLECTION' | 'BALANCE_INQUIRY' | 'UNKNOWN';
    confidence_score: number;
    member: {
      code: string;
      fullName: string;
      manualNumber: string;
      phone: string;
      avatarUrl?: string;
    } | null;
    target_account: {
      accountNumber: string;
      productName: string;
      availableBalance: number;
    } | null;
    amount: number | null;
    currency: 'XOF';
  };
  speech_feedback: {
    locale: string;
    text_to_speak: string;
    audio_base64_tts?: string;
  };
  validation_errors: string[];
}
```

### 6.2 Endpoint Calcul Ratios Prudentiels BCEAO (`POST /api/v1/compliance/prudential-ratios`)

```typescript
export interface PrudentialRatiosRequest {
  period_end_date: string;        // "2026-08-20"
  agency_code?: string;           // "ALL" ou "A02"
  include_ai_diagnostic: boolean; // true
}

export interface PrudentialRatiosResponse {
  calculated_at: string;
  compliance_status: 'GLOBAL_COMPLIANT' | 'WARNING_OBSERVED' | 'CRITICAL_BREACH';
  ratios: {
    liquidity_ratio: {
      code: 'R_LIQ';
      name: 'Ratio de Liquidité Globale';
      value: number;            // Ex: 118.42 (%)
      threshold_bceao: 100.0;
      compliant: boolean;
      numerator_xof: number;    // Actifs disponibles
      denominator_xof: number;  // Passifs exigibles
    };
    par_30: {
      code: 'PAR_30';
      name: 'Portefeuille à Risque à 30 jours';
      value: number;            // Ex: 3.12 (%)
      threshold_bceao: 5.0;
      compliant: boolean;
    };
    par_90: {
      code: 'PAR_90';
      name: 'Portefeuille à Risque à 90 jours';
      value: number;            // Ex: 1.45 (%)
      threshold_bceao: 3.0;
      compliant: boolean;
    };
    operational_self_sufficiency: {
      code: 'OSS';
      name: 'Autosuffisance Opérationnelle';
      value: number;            // Ex: 124.80 (%)
      threshold_min: 100.0;
      compliant: boolean;
    };
    capital_adequacy_ratio: {
      code: 'CAR';
      name: 'Couverture des Risques (Fonds Propres)';
      value: number;            // Ex: 18.50 (%)
      threshold_bceao: 15.0;
      compliant: boolean;
    };
  };
  ai_executive_diagnostic: {
    summary: string;
    vulnerability_points: string[];
    action_plan_priorities: string[];
  };
}
```

---

## 7. Tableau de Synthèse des Fonctionnalités Découvertes

| # | Catégorie | Fonctionnalité | Description | Entrées | Sorties | Comportement sur Erreur | Découvert Via |
|---|---|---|---|---|---|---|---|
| 1 | **Voice AI** | Extraction Ordre Caisse Vocal | Conversion voix guichetier/sociétaire en JSON structuré | Flux audio PCM / Transcription | Objet JSON `VoiceCashierOrder` | Demande clarification vocale | R4 / ORIGINAL_REQUEST |
| 2 | **Voice AI** | Support Trilingue (FR, Éwé, Mina) | Compréhension et synthèse en langues locales d'Afrique de l'Ouest | Audio FR/Éwé/Mina | Texte et synthèse TTS | Fallback français + texte | R4 / ORIGINAL_REQUEST |
| 3 | **Regulatory** | Ratio de Liquidité BCEAO ($R_{LIQ}$) | Calcul de la couverture des passifs exigibles par les actifs liquides | Balances comptes Classe 5, 2, 1 | Ratio % + Alerte si < 100% | Alerte rouge + blocage crédits | Normes BCEAO / R1 |
| 4 | **Regulatory** | Portefeuille à Risque ($PAR_{30}/PAR_{90}$) | Mesure des impayés sur encours brut total de crédit | Échéances impayées > 30j/90j | Ratios % ($PAR_{30} \le 5\%$, $PAR_{90} \le 3\%$) | Déclenchement provisionnement | Normes BCEAO / R1 |
| 5 | **Regulatory** | Autosuffisance ($OSS / FSS$) | Mesure de la couverture des charges par les produits | Produits Cl. 7 vs Charges Cl. 6 | Taux % (Seuil $\ge 100\%$) | Flag de non-viabilité | Normes BCEAO / R1 |
| 6 | **Regulatory** | Barème de Provisionnement BCEAO | Calcul des dotations aux provisions obligatoires (0%, 20%, 50%, 100%) | Âge des créances impayées | Montants de provision SYSCOA | Écart de provisionnement | Instruction N° 02/2012 |
| 7 | **Offline Core** | File d'Attente Idempotente | Stockage et synchronisation sans doublon d'opérations hors-ligne | Transaction locale | Statut `SYNCED` / Hash ID | Reprise automatique | R2 / ORIGINAL_REQUEST |
| 8 | **Mobile** | Passerelles Mobile Money | Dépôt/retrait automatisé via TMoney, Flooz, Wave | Numéro + Montant XOF | Webhook de validation | Annulation & Notification | R3 / ORIGINAL_REQUEST |
| 9 | **Printing** | Reçu Thermique 80mm ESC/POS | Impression instantanée après opération avec mentions légales | Objet Transaction | Flux ESC/POS 80mm | Impression locale différée | R2 / ORIGINAL_REQUEST |

---

## 8. Tableau des Cas Limites et Comportements Observés

| # | Fonctionnalité | Donnée d'Entrée / Condition | Comportement Observé & Spécifié |
|---|---|---|---|
| 1 | **Extraction Vocale** | Phrase mixte "Versement de akpe blaeve pour Tomrom" | Extraction exacte de 20 000 XOF, membre Tomrom, compte Épargne |
| 2 | **Extraction Vocale** | Homonymie sur nom d'adhérent parlé | `requires_cashier_confirmation: true`, affichage des fiches candidates |
| 3 | **Ratio Liquidité** | Passifs exigibles = 0 (Nouvelle agence) | Ratio fixé à $100.00\%$ avec indicateur `"INITIAL_STAGE"` |
| 4 | **Retrait Hors-Ligne** | Retrait supérieur au solde disponible local | Rejet immédiat au guichet avec calcul du solde gelé |
| 5 | **Synchronisation** | Reconnexion après 500 transactions offline | Synchronisation par lots de 50 avec barre de progression sans freeze UI |
| 6 | **Taux d'Usure** | Prêt saisi à 28% annuel | Blocage de validation avec rappel du seuil légal BCEAO (24%) |
| 7 | **Mobile Money** | Échec de paiement TMoney (solde client insuffisant) | Rollback de la transaction, notification push d'échec sur le smartphone |
