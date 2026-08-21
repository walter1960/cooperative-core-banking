# Comprehensive Technical Survey & Domain Specification: Core Banking Engine & BCEAO/UMOA (XOF) Configuration

**Date**: 2026-08-20T01:00:00Z  
**Author**: Explorer 1 (Core Banking Explorer)  
**Agent ID**: `explorer_survey_1`  
**Working Directory**: `/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/.agents/explorer_survey_1`  
**Target Project**: BANOLIA Microfinance Suite (Concurrent modern of PERFECT / CAGECFI)

---

## 1. Executive Summary & Scope

The BANOLIA platform is designed as an enterprise-grade, modern, and resilient Microfinance and Digital Finance software suite tailored specifically to the regulatory, accounting, and operational requirements of the **UMOA/BCEAO zone** (Union Monétaire Ouest-Africaine / Banque Centrale des États de l'Afrique de l'Ouest) operating in West African CFA Francs (**XOF**).

The system serves as a next-generation successor to legacy monolithic microfinance systems (such as PERFECT, CAGECFI, SAF/FIDA, or DELPHIX), combining:
1. **Core Banking Engine**: Fully configured for SFDs (Systèmes Financiers Décentralisés / Microfinance Institutions) under BCEAO regulations, supporting Member Share Capital (*Parts Sociales*), Ordinary Savings (*Dépôts à vue / Dépôts à terme*), Traditional & Group Tontine Savings (*Cotisations journalières de marché*), Multi-mode Credit Amortization Engine, and an automated double-entry General Ledger.
2. **Offline-First Desktop Agency App** (Tauri/React) with thermal receipt printing and biometric authentication.
3. **Mobile Banking & Field Collector App** (Flutter) with mobile money integrations (TMoney, Flooz, Wave, Orange Money, MTN MoMo).
4. **Multimodal Voice AI Assistant** (Gemini API) supporting French and regional languages (Éwé, Mina, etc.).

This technical survey provides the exhaustive analysis, regulatory specification, mathematical formulations, database architecture, API interface contracts, and testing roadmap for **Requirement 1 (Core Banking Engine & BCEAO/UMOA XOF Configuration)**.

---

## 2. Current State & Codebase Topology

### 2.1 Project Directory Structure Analysis

A comprehensive audit of the workspace reveals the following component layout:

```
/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/
├── ORIGINAL_REQUEST.md         # Authoritative requirements document
├── docker-compose.yml          # Container topology (MariaDB 11.4, Apache Fineract, Mifos Web App)
├── banolia-desktop/            # React 19 + TypeScript + Vite + Tailwind CSS desktop app
│   ├── src/
│   │   ├── components/         # UI components (CashierDesk, AccountingView, CreditManager, etc.)
│   │   ├── services/           # storage.ts (Local storage and offline queue mock)
│   │   ├── types/              # index.ts (Domain TypeScript interfaces)
│   │   └── mockData.ts         # Mock datasets for members, accounts, loans, cash registers
├── banolia-mobile/             # Dedicated workspace for Flutter/Mobile Banking client (currently initialized directory)
└── banolia-server/             # Dedicated workspace for the Core Banking backend & Gateway service
```

### 2.2 Existing Infrastructure in `docker-compose.yml`

The `docker-compose.yml` orchestrates three foundational services:
1. `mifos-db`: MariaDB 11.4 on port `3306` with default database `fineract_tenants` and persistent volume `db_data`.
2. `fineract-server`: Apache Fineract (Spring Boot microfinance engine) on port `8443` configured with HikariCP JDBC connections to `mifos-db`.
3. `mifos-web`: OpenMF Web App Back-Office on port `8080` communicating with Fineract API on `https://localhost:8443/fineract-provider/api/v1`.

### 2.3 Gap Analysis: Current Prototype vs. Full Production BCEAO Engine

| Dimension | Current Prototype State | Target Production Requirements (BCEAO Compliant) |
|---|---|---|
| **Accounting Chart** | 4 sample accounts hardcoded in `AccountingView.tsx` (`571100`, `251211`, `204121`, `101100`) | Complete 9-class BCEAO SFD Chart of Accounts with hierarchical general/subsidiary ledgers |
| **Share Capital (*Parts Sociales*)** | Basic scalar fields in `Member` (`sharesPurchased`, `sharesAvailable`) | Dedicated Share Capital Ledger, subscription contracts, gradual liberation, transfers, dividend distribution |
| **Savings & Deposits** | Simple balance addition/subtraction in `storage.ts` | Ordinary savings, term deposits (*DAT*), 15-day interest accrual (*Règle des quinzaines*), frozen collateral locks |
| **Tontine Savings** | UI card mockup in `SavingsManager.tsx` | 31-day cyclical tontines, daily collector route tracking, 1-day commission auto-deduction, settlement routines |
| **Loan Engine** | Constant annuity formula in `CreditManager.tsx` | Constant annuity, constant principal, in fine, flat rate, penalty engine, PAR30/PAR90 classification & provisioning, usury rate ceiling (24%-27%) |
| **General Ledger & Reports** | Static HTML preview table | Automated double-entry event listeners, Day-End Closure (*EOD*), Bilan Actif/Passif, Compte de Résultat, 5 BCEAO Prudential Ratios |
| **Data Layer & Storage** | Browser `localStorage` mock in `storage.ts` | Production relational SQL schema (MariaDB/PostgreSQL), ACID transactions, idempotency ledger, migration scripts |
| **API & Gateway** | Direct component state bindings | RESTful API gateway with JWT/OAuth2, HMAC signatures, `X-Idempotency-Key` processing, WebSocket sync push |

---

## 3. BCEAO/UMOA Regulatory & Accounting Framework for SFDs

Under the **Loi Cadre portant réglementation des SFD** and **Instruction N° 01/2010/RB/SFD de la BCEAO**, all microfinance institutions in the UMOA zone (Benin, Burkina Faso, Côte d'Ivoire, Guinea-Bissau, Mali, Niger, Senegal, Togo) must comply with the standardized **Plan Comptable des Systèmes Financiers Décentralisés (PC-SFD)**.

### 3.1 Currency Configuration
- **Currency Code**: `XOF` (Franc CFA de l'Afrique de l'Ouest).
- **Currency Symbol**: `F.CFA` or `FCFA`.
- **Decimal Places**:
  - Cash/Transaction Level: `0` decimals (smallest physical denomination is 1 F.CFA; cash coins are 1, 5, 10, 25, 50, 100, 200, 250, 500 F.CFA).
  - Internal Accounting & Interest Accrual Level: `2` to `4` decimal precision with banker's rounding (*round half to even*) before posting whole integers.

### 3.2 SFD BCEAO Chart of Accounts (Classes 1 through 9)

```
====================================================================================================
CLASSE 1 : COMPTES DE RESSOURCES PERMANENTES (Capitaux Propres, Réserves et Dettes à Long Terme)
====================================================================================================
101000  Capital Social / Dotations
  101100  Parts Sociales Souscrites Libérées (Adhérents Individuels)
  101200  Parts Sociales Souscrites Libérées (Personnes Morales / Groupements)
  101300  Parts Sociales Souscrites Non Libérées (Compte Débiteur Régulateur)
102000  Fonds de dotation et subventions d'équipement
111000  Réserves Légales (Obligation BCEAO : 15% du résultat net jusqu'à concurrence du capital)
112000  Réserves Statutaires et Libres
118000  Report à nouveau (Solde créditeur ou débiteur)
121000  Résultat net de l'exercice (Bénéfice ou Perte)
131000  Provisions pour risques et charges (Garanties données, litiges)
161000  Emprunts et dettes financières à plus d'un an (Lignes de refinancement bancaire / BIDC / BOAD)

====================================================================================================
CLASSE 2 : COMPTES D'OPERATIONS AVEC LES MEMBRES ET LES TIERS (Crédits et Dépôts)
====================================================================================================
201000  Crédits à court terme aux membres (< 12 mois)
  201100  Crédits ordinaires à court terme (Commerce, Artisanat)
  201200  Crédits de campagne agricole
  201300  Crédits de tontine / Avances sur tontine
202000  Crédits à moyen terme aux membres (12 à 36 mois)
  202100  Crédits d'équipement et d'investissement
  202200  Crédits à l'habitat social
203000  Crédits à long terme aux membres (> 36 mois)
204000  Crédits aux dirigeants et au personnel du SFD (Plafond prudentiel strict)
208000  Créances rattachées (Intérêts courus non échus sur crédits)
291000  Créances en souffrance (Crédits Déclassés)
  291100  Créances douteuses (Impayés de 31 à 90 jours - PAR 30)
  291200  Créances très douteuses (Impayés de 91 à 180 jours - PAR 90)
  291300  Créances compromises / Contentieux (Impayés > 180 jours)
299000  Provisions pour dépréciation des crédits aux membres (Comptes correcteurs d'actif)
  299100  Provisions sur créances douteuses (20% à 40%)
  299200  Provisions sur créances très douteuses (50% à 80%)
  299300  Provisions sur créances compromises (100%)
251000  Dépôts à vue des membres (Comptes Courants d'Épargne)
  251100  Dépôts à vue des particuliers
  251200  Dépôts à vue des groupements et personnes morales
252000  Comptes d'épargne sur livret (Épargne rémunérée)
253000  Dépôts à terme des membres (DAT - 3, 6, 12, 24 mois)
254000  Dépôts de garantie et nantissements (Garanties financières bloquées pour prêts)
258000  Comptes d'attente d'épargne tontine (Cotisations de tontine en cours de cycle)

====================================================================================================
CLASSE 3 : COMPTES D'OPERATIONS AVEC LES INSTITUTIONS FINANCIERES & TRESORERIE BANCAIRE
====================================================================================================
311000  Banques locales (Comptes courants bancaires - Ecobank, Coris, BOA, etc.)
312000  Comptes auprès du Trésor Public / Chèques Postaux
318000  Intérêts courus à recevoir sur avoirs bancaires
321000  Comptes de refinancement auprès des Banques et Caisses Centrales de SFD

====================================================================================================
CLASSE 4 : COMPTES DE TIERS (Débiteurs, Créditeurs, Fournisseurs et Personnel)
====================================================================================================
401000  Fournisseurs d'exploitation et prestataires
421000  Personnel - Rémunérations dues
431000  Organismes sociaux (CNSS / Caisse de Retraite)
441000  État - Impôts, taxes et retenues à la source
471000  Comptes transitoires et d'attente de régularisation (Virements Mobile Money en attente)

====================================================================================================
CLASSE 5 : COMPTES DE TRESORERIE (Caisses et Monnaie Électronique)
====================================================================================================
571000  Caisses physiques du SFD
  571100  Caisse Principale Siège (Vault / Coffre-fort)
  571200  Caisses Guichets Agences (Tellers 1..N)
  571300  Caisses Auxiliaires Collecteurs Terrain (Mobile Field Tellers)
578000  Portefeuilles de Monnaie Électronique (Mobile Money Wallets)
  578100  Compte Marchand TMoney (Togo / UMOA)
  578200  Compte Marchand Flooz / Moov Money
  578300  Compte Marchand Wave
  578400  Compte Marchand Orange Money
  578500  Compte Marchand MTN Mobile Money
581000  Virements internes et transferts de fonds (Fonds en transit entre caisses/banques)

====================================================================================================
CLASSE 6 : COMPTES DE CHARGES (Charges d'Exploitation Financière et Générale)
====================================================================================================
601000  Charges d'intérêts sur dépôts à terme (DAT)
602000  Charges d'intérêts sur livrets d'épargne
603000  Charges d'intérêts sur emprunts et dettes financières
611000  Frais et commissions bancaires & frais de passerelles Mobile Money
621000  Achats de fournitures, imprimés, reçus thermiques et petits matériels
631000  Services extérieurs (Loyers agences, électricité, télécoms, maintenance logicielle)
641000  Charges de personnel (Salaires, primes des guichetiers et collecteurs)
651000  Dotations aux amortissements des immobilisations
661000  Dotations aux provisions pour créances douteuses (Pertes sur crédits)
681000  Charges exceptionnelles et pertes sur créances irrécouvrables

====================================================================================================
CLASSE 7 : COMPTES DE PRODUITS (Produits d'Exploitation Financière et Produits Divers)
====================================================================================================
701000  Intérêts perçus sur crédits aux membres
  701100  Intérêts sur crédits à court terme
  701200  Intérêts sur crédits à moyen et long terme
702000  Commissions perçues sur opérations de crédit (Frais de dossier, décaissement)
703000  Pénalités et intérêts de retard sur crédits
704000  Commissions perçues sur la gestion des tontines (1 mise par carnet)
705000  Frais de tenue de compte et commissions sur opérations de caisse / retraits
706000  Droits d'adhésion et frais de souscription de carnets
711000  Intérêts perçus sur placements bancaires
761000  Reprises de provisions sur créances douteuses
781000  Produits exceptionnels

====================================================================================================
CLASSE 8 : COMPTES DE SOLDE ET RESULTATS INTERMEDIAIRES DE GESTION
====================================================================================================
801000  Solde Brut d'Intermédiation Financière (Produits financiers - Charges financières)
811000  Résultat d'Exploitation
821000  Résultat Net de l'Exercice

====================================================================================================
CLASSE 9 : ENGAGEMENTS HORS-BILAN & SECURITE
====================================================================================================
901000  Engagements de financement donnés en faveur des membres (Crédits accordés non décaissés)
911000  Garanties et cautions reçues des membres (Hypothèques, gages matériels, cautions solidaires)
991000  Créances amorties / radiées sorties du bilan mais maintenues sous surveillance
```

---

## 4. Core Banking Engine Domain Modeling

### 4.1 Member Management & Share Capital (*Parts Sociales*)

#### Member Lifecycle & KYC
- **Member Identification**: Automatic unique Member Number formatted as `[AgencyCode][Year][6-digit sequential number]` (e.g. `A02-2026-001429`) and optional legacy/paper manual number (`manualNumber`).
- **KYC Attributes**: Legal status (`INDIVIDUAL`, `LEGAL_ENTITY`, `INFORMAL_GROUP`), Title, Full Name, Birth Date, Nationality, National ID (CNI/Passport/Voter Card), Primary Phone, Alternate Phone, Physical Address, Occupation, Marital Status, Spouse/Guarantor Name, Next of Kin, Facial Photo, ISO 19794-2 Fingerprint Template.
- **Member Status**: `PENDING_APPROVAL`, `ACTIVE`, `DORMANT`, `SUSPENDED`, `EXPELLED` (*Radié*), `DECEASED`.

#### Share Capital Mechanics
1. **Nominal Share Value**: Configured at cooperative creation (e.g. `10 000 XOF` per share).
2. **Minimum Qualifying Shares**: Minimum shares required for voting rights in the General Assembly (typically 1 to 5 shares, e.g. `50 000 XOF`).
3. **Double-entry on Share Subscription & Payment**:
   - *Adhérent souscrit et libère 5 parts de 10 000 XOF en espèces à la caisse + 5 000 XOF de droits d'adhésion*:
     - **Débit** `571200` (Caisse Guichet) : `55 000 XOF`
     - **Crédit** `101100` (Parts Sociales Souscrites Libérées) : `50 000 XOF`
     - **Crédit** `706000` (Droits d'adhésion SFD) : `5 000 XOF`
4. **Share Transfer & Buyback (*Rachat de Parts Sociales*)**: In case of voluntary exit or death, shares can be repurchased by the cooperative or transferred to another member after approval of the Board of Directors (*Conseil d'Administration*), deducting any outstanding debt obligations.

---

### 4.2 Ordinary Savings & Term Deposits (*Dépôts à Vue & DAT*)

#### Account Types & Properties
1. **Dépôt à Vue (DAV) / Compte Épargne Libre**:
   - Transaction fee configuration (e.g. 0 XOF for deposit, 0 or 100 XOF for withdrawal).
   - Real Balance ($B_{real}$), Frozen Collateral Balance ($B_{frozen}$), and Available Balance ($B_{avail} = B_{real} - B_{frozen}$).
   - Overdraft limit ($B_{avail} \ge 0$). No unapproved debit balance allowed for standard members.
2. **Compte sur Livret Rémunéré (Épargne Rémunérée)**:
   - Interest calculation according to the **BCEAO 15-Day Rule (*Règle des quinzaines*)**:
     - A month is split into two halves: Quinzaine 1 (from 1st to 15th) and Quinzaine 2 (from 16th to end of month).
     - Deposits made between 1st and 15th generate interest starting on the 16th.
     - Deposits made between 16th and end of month generate interest starting on the 1st of next month.
     - Withdrawals made between 1st and 15th stop generating interest on the last day of the previous month.
     - Withdrawals made between 16th and end of month stop generating interest on the 15th of the current month.
     - Formula per quinzaine $k$: $I_k = \text{Solde Minimum de la Quinzaine} \times \frac{Taux Annuel}{24}$.
3. **Dépôt à Terme (DAT - Fixed Term Deposit)**:
   - Term: 3, 6, 12, 24, 36 months.
   - Contractual annual interest rate (e.g. 5.0% to 7.5%).
   - Interest payout mode: at maturity (*in fine*) or monthly/quarterly into DAV.
   - Early penalty: forfeiture of partial/total accrued interest.
   - Accounting on DAT subscription:
     - **Débit** `251100` (Compte DAV Adhérent) : `1 000 000 XOF`
     - **Crédit** `253000` (Dépôts à Terme) : `1 000 000 XOF`
   - Monthly Accrued Interest Accounting (*Intérêts courus non échus*):
     - **Débit** `601000` (Charges d'intérêts sur DAT) : `5 000 XOF`
     - **Crédit** `253800` (Intérêts courus sur DAT) : `5 000 XOF`

---

### 4.3 Tontine Savings (*Cotisations Journalières de Marché*)

The traditional West African market tontine (*Tontine journalière / Carnet de tontine*) is a vital financial instrument for informal traders. BANOLIA digitizes this process completely:

```
+-------------------------------------------------------------------------------+
|                        CYCLE DE TONTINE JOURNALIERE (31 JOURS)                |
+-------------------------------------------------------------------------------+
| 1. Souscription du carnet avec mise unitaire choisie (ex: 1 000 XOF / jour)   |
| 2. Collecte quotidienne sur le terrain (Jours 1 à 31)                         |
|    - Collecteur enregistre la mise sur mobile (reçu Bluetooth + SMS/Push)     |
|    - Caisse Collecteur débitée, Compte d'Attente Tontine 258000 crédité       |
| 3. Clôture de cycle (Jour 31) :                                               |
|    - Total cotisé = 31 x 1 000 = 31 000 XOF                                   |
|    - Prélèvement commission SFD (1 mise = 1 000 XOF) -> Crédit Compte 704000  |
|    - Reversement adhérent (30 mises = 30 000 XOF) -> Crédit DAV 251100        |
+-------------------------------------------------------------------------------+
```

#### Tontine Accounting Double-Entry Flows

1. **Daily collection on field by collector ($Mise = 1\ 000\text{ XOF}$)**:
   - **Débit** `571300` (Caisse Auxiliaire Collecteur) : `1 000 XOF`
   - **Crédit** `258000` (Comptes d'attente d'épargne tontine - Carnet #TK44) : `1 000 XOF`

2. **Collector evening shift balance & cash drop at main agency cashier**:
   - **Débit** `571200` (Caisse Guichet Agence) : `31 000 XOF`
   - **Crédit** `571300` (Caisse Auxiliaire Collecteur) : `31 000 XOF`

3. **Cycle maturity settlement (Reversement du carnet)**:
   - **Débit** `258000` (Comptes d'attente d'épargne tontine) : `31 000 XOF`
   - **Crédit** `251100` (Compte Dépôt à Vue de l'Adhérent) : `30 000 XOF`
   - **Crédit** `704000` (Commissions de tontine perçues par le SFD) : `1 000 XOF`

---

### 4.4 Loan Lifecycle & Amortization Mechanics

#### Loan Calculation Models

Let:
- $C_0$ = Principal amount granted (*Capital initial*).
- $n$ = Number of repayment periods (e.g. 12 months).
- $r = \frac{\text{Taux d'intérêt annuel}}{\text{Fréquence par an}}$ (Periodic interest rate).
- $k \in [1, n]$ = Repayment installment index.
- $C_{k-1}$ = Remaining principal balance before period $k$ (*Capital restant dû*).

##### 1. Constant Annuity / Amortissement Dégressif à Mensualité Constante (`CONSTANT_ANNUITY`)
Used for commercial micro-loans and SME credits:
$$\text{Échéance Constante } A = C_0 \times \frac{r}{1 - (1+r)^{-n}}$$
For each period $k$:
- Interest portion: $I_k = \text{round}(C_{k-1} \times r)$
- Principal portion: $P_k = A - I_k$
- New remaining balance: $C_k = C_{k-1} - P_k$ ($C_n = 0$)

##### 2. Constant Principal / Amortissement Constant (`CONSTANT_PRINCIPAL`)
Used for agricultural and asset finance:
- Principal portion constant each period: $P_k = \frac{C_0}{n}$
- Interest portion: $I_k = \text{round}(C_{k-1} \times r)$
- Total installment decreases each period: $A_k = P_k + I_k$

##### 3. Bullet Loan / Crédit In Fine (`IN_FINE`)
Used for short-term seasonal crop storage / inventory trading:
- Periods $1$ to $n-1$: $P_k = 0$, $I_k = \text{round}(C_0 \times r)$, $A_k = I_k$.
- Period $n$: $P_n = C_0$, $I_n = \text{round}(C_0 \times r)$, $A_n = C_0 + I_n$.

##### 4. Flat Rate Interest (`FLAT`)
- Total Interest: $I_{total} = \text{round}\left(C_0 \times Taux_{annuel} \times \frac{n}{12}\right)$
- Installment: $A = \frac{C_0 + I_{total}}{n}$, with $P_k = \frac{C_0}{n}$ and $I_k = \frac{I_{total}}{n}$.

#### BCEAO Usury Rate Ceiling Check (*Contrôle du Taux d'Usure*)
Under BCEAO regulations for SFDs, the Maximum Usury Rate is strictly capped between **24.0%** and **27.0%** annual effective rate (TEG - *Taux Effectif Global*), inclusive of all mandatory insurance, processing fees, and interest.
The BANOLIA calculation engine enforces:
$$\text{TEG} \le \text{USURY\_RATE\_CEILING} \quad (\text{Default } 24.0\%)$$
Any loan product or simulation exceeding this rate is rejected at API validation.

#### Portfolio at Risk (PAR) & Regulatory Provisioning Rules

The core engine runs a nightly batch job evaluating overdue loans:

| Overdue Bucket | BCEAO Classification | PC-SFD Account | Minimum Required Provision |
|---|---|---|---|
| **0 to 30 days** | Crédits Sains / Vigilance | `201100` / `202100` | 0% (or general provision 1%) |
| **31 to 90 days** | Crédits Douteux (PAR 30) | `291100` | 20% to 40% (Default 25%) |
| **91 to 180 days** | Crédits Très Douteux (PAR 90) | `291200` | 50% to 80% (Default 50%) |
| **> 180 days** | Crédits Compromis / Contentieux | `291300` | 100% |

**Automated Accounting for Provisioning**:
- **Débit** `661000` (Dotations aux provisions pour créances douteuses) : `XOF Amount`
- **Crédit** `299100` / `299200` / `299300` (Provisions pour dépréciation) : `XOF Amount`

---

### 4.5 Financial Statements & BCEAO Prudential Ratios

#### 1. Bilan Réglementaire SFD (Actif / Passif)

```
===================================================================================
ACTIF                                              | PASSIF & CAPITAUX PROPRES
===================================================================================
I. DISPONIBILITES                                  | I. DETTES FINANCIERES
- Caisse Principale & Guichets (571)               | - Emprunts bancaires et refinancements (161)
- Banques locales (311)                            | - Autres emprunts & dépôts reçus
- Portefeuilles Mobile Money (578)                 | 
                                                   | II. DEPOTS DES MEMBRES
II. CREANCES SUR LES MEMBRES                       | - Dépôts à vue (251)
- Crédits à court terme (201)                      | - Comptes sur livrets (252)
- Crédits à moyen et long terme (202, 203)         | - Dépôts à terme - DAT (253)
- Créances en souffrance (291)                     | - Dépôts de garantie & nantissements (254)
- Moins : Provisions pour dépréciation (299)       | - Comptes d'attente tontine (258)
                                                   | 
III. AUTRES ACTIFS & COMPTES DE REGULARISATION     | III. AUTRES DETTES & REGULARISATION
- Débiteurs divers (40, 42, 44, 47)                | - Fournisseurs, personnel, État (401, 421, 441)
                                                   | 
IV. IMMOBILISATIONS                                | IV. CAPITAUX PROPRES & FONDS DE RESERVE
- Immobilisations corporelles & incorporelles      | - Parts sociales libérées (1011)
- Moins : Amortissements cumulés (28/65)           | - Réserves légales (111) & statutaires (112)
                                                   | - Report à nouveau (118)
                                                   | - Résultat net de l'exercice (121)
===================================================================================
TOTAL ACTIF                                        | TOTAL PASSIF
===================================================================================
```

#### 2. Compte de Résultat (P&L)

$$\text{Marge d'Intermédiation Financière} = \sum \text{Produits Financiers (701, 702, 703)} - \sum \text{Charges Financières (601, 602, 603, 611)}$$
$$\text{Produit Net Bancaire / SFD (PNB)} = \text{Marge d'Intermédiation} + \text{Commissions Tontines (704)} + \text{Frais de tenue de compte (705)} + \text{Droits d'adhésion (706)}$$
$$\text{Résultat d'Exploitation} = \text{PNB} - \text{Charges Générales (621, 631, 641)} - \text{Dotations Amortissements & Provisions (651, 661)} + \text{Reprises (761)}$$
$$\text{Résultat Net} = \text{Résultat d'Exploitation} + \text{Produits Exceptionnels (781)} - \text{Charges Exceptionnelles (681)} - \text{Impôts}$$

#### 3. Standard BCEAO Prudential Ratios

1. **Ratio de Liquidité Immédiate**:
   $$R_{liquidite} = \frac{\text{Caisse (571) + Banques (311) + Mobile Money (578)}}{\text{Dépôts à vue (251) + Dépôts exigibles < 30j}} \ge 100\%$$

2. **Ratio de Couverture des Emplois par les Ressources Stables**:
   $$R_{couverture} = \frac{\text{Fonds Propres Net (Classe 1) + Dettes à LMT (161) + DAT > 1 an (253)}}{\text{Immobilisations Nettes + Crédits à LMT (202, 203)}} \ge 100\%$$

3. **Ratio d'Adéquation des Fonds Propres (Fonds Propres / Total Actif)**:
   $$R_{solvabilite} = \frac{\text{Capitaux Propres Effectifs (1011 + 111 + 112 + 118 \pm 121)}}{\text{Total Actif Risqué Pondéré}} \ge 15\%$$

4. **Taux de Dégradation du Portefeuille (PAR 30 & PAR 90)**:
   $$\text{PAR 30} = \frac{\text{Encours des crédits ayant un impayé > 30 jours (2911 + 2912 + 2913)}}{\text{Portefeuille de crédit brut total}} \le 5.0\%$$
   $$\text{PAR 90} = \frac{\text{Encours des crédits ayant un impayé > 90 jours (2912 + 2913)}}{\text{Portefeuille de crédit brut total}} \le 3.0\%$$

5. **Ratio de Division des Risques (Plafond par Emprunteur)**:
   $$R_{division} = \frac{\text{Engagement maximal sur un seul adhérent ou groupe lié}}{\text{Fonds Propres Effectifs}} \le 10.0\%$$

---

## 5. Technical Architecture & Database Schema

### 5.1 Architecture Topology

```
+----------------------------------------------------------------------------------------------------+
|                                    BANOLIA DISTRIBUTED ARCHITECTURE                                |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|    +--------------------------+                         +-----------------------------------+      |
|    |  Desktop Agency Client   |                         |   Mobile Banking / Collector App  |      |
|    |  (Tauri / React / SQLite)|                         |   (Flutter / SQLite / Bluetooth)  |      |
|    +------------+-------------+                         +-----------------+-----------------+      |
|                 |                                                         |                        |
|                 |  HTTPS / REST / Idempotent Batch Sync                   |                        |
|                 +----------------------------+----------------------------+                        |
|                                              |                                                     |
|                                              v                                                     |
|                      +-----------------------------------------------+                             |
|                      |         BANOLIA CORE GATEWAY & API SERVER     |                             |
|                      |         (Node.js / Express / TypeScript)      |                             |
|                      |  - JWT / RBAC Authentication                  |                             |
|                      |  - Idempotency & Batch Sync Engine            |                             |
|                      |  - BCEAO Accounting & Double-Entry Engine     |                             |
|                      |  - Mobile Money Webhook Handlers              |                             |
|                      |  - Gemini AI Multimodal Proxy Router          |                             |
|                      +-----------------------+-----------------------+                             |
|                                              |                                                     |
|                      +-----------------------+-----------------------+                             |
|                      |                                               |                             |
|                      v                                               v                             |
|       +------------------------------+             +----------------------------------+            |
|       |    Relational Database       |             |  Apache Fineract 1.9+ Microcore  |            |
|       |    (MariaDB 11.4 / MySQL)    |             |  (Spring Boot / Java 17 Engine)  |            |
|       |  - Banolia Schema            |             |  - Default Tenant Database       |            |
|       |  - Transactional Ledgers     |             |  - Interest & Payment Calculator |            |
|       +------------------------------+             +----------------------------------+            |
+----------------------------------------------------------------------------------------------------+
```

### 5.2 Comprehensive Relational Database Schema (`banolia-server`)

```sql
-- 1. Agencies and Branches
CREATE TABLE agencies (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,          -- e.g. 'A01', 'A02'
    name VARCHAR(100) NOT NULL,
    address TEXT,
    city VARCHAR(50) NOT NULL,
    country VARCHAR(10) DEFAULT 'TG',           -- Togo, Benin, Senegal, etc.
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users & Cashiers
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    agency_id VARCHAR(36) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('SUPER_ADMIN', 'AGENCY_MANAGER', 'CREDIT_OFFICER', 'CASHIER', 'COLLECTOR', 'AUDITOR') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id)
);

-- 3. Members & KYC
CREATE TABLE members (
    id VARCHAR(36) PRIMARY KEY,
    agency_id VARCHAR(36) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,          -- e.g. 'A0200225'
    manual_number VARCHAR(30),
    full_name VARCHAR(120) NOT NULL,
    gender ENUM('M', 'F', 'OTHER'),
    birth_date DATE NOT NULL,
    nationality VARCHAR(50) DEFAULT 'Togolaise',
    id_type ENUM('CNI', 'PASSPORT', 'VOTER_CARD', 'DRIVING_LICENSE') NOT NULL,
    id_number VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(50) NOT NULL,
    phone VARCHAR(25) NOT NULL UNIQUE,
    spouse_name VARCHAR(100),
    shares_purchased INT NOT NULL DEFAULT 0,
    shares_sold INT NOT NULL DEFAULT 0,
    share_unit_price DECIMAL(15, 2) NOT NULL DEFAULT 10000.00,
    status ENUM('PENDING', 'ACTIF', 'SUSPENDU', 'RADIE', 'DECEDE') NOT NULL DEFAULT 'ACTIF',
    avatar_url TEXT,
    fingerprint_template TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id)
);

-- 4. Accounts (Savings, DAT, Guarantees)
CREATE TABLE accounts (
    id VARCHAR(36) PRIMARY KEY,
    member_id VARCHAR(36) NOT NULL,
    agency_id VARCHAR(36) NOT NULL,
    account_number VARCHAR(30) NOT NULL UNIQUE, -- e.g. '01-251-00225-01'
    product_type ENUM('SAVINGS_ORD', 'SAVINGS_LIVRET', 'DAT', 'TONTINE', 'CAREER_PLAN', 'PROJECT_PLAN', 'LOAN') NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    real_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    frozen_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(5) NOT NULL DEFAULT 'XOF',
    interest_rate DECIMAL(5, 2) DEFAULT 0.00,
    status ENUM('ACTIF', 'BLOQUE', 'SOLDE', 'DORMANT') NOT NULL DEFAULT 'ACTIF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (agency_id) REFERENCES agencies(id)
);

-- 5. Tontine Cycles and Subscriptions
CREATE TABLE tontine_subscriptions (
    id VARCHAR(36) PRIMARY KEY,
    member_id VARCHAR(36) NOT NULL,
    collector_id VARCHAR(36) NOT NULL,
    account_id VARCHAR(36) NOT NULL,
    carnet_number VARCHAR(30) NOT NULL UNIQUE,  -- e.g. 'TK-2026-0089'
    daily_amount DECIMAL(15, 2) NOT NULL,       -- e.g. 1000.00 XOF
    cycle_days INT NOT NULL DEFAULT 31,
    paid_days INT NOT NULL DEFAULT 0,
    total_collected DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    commission_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    status ENUM('OPEN', 'MATURED', 'SETTLED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (collector_id) REFERENCES users(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- 6. Loan Products and Files
CREATE TABLE loan_products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    min_amount DECIMAL(15, 2) NOT NULL,
    max_amount DECIMAL(15, 2) NOT NULL,
    annual_interest_rate DECIMAL(5, 2) NOT NULL, -- Max 24-27% (Usury cap)
    amortization_type ENUM('CONSTANT_ANNUITY', 'CONSTANT_PRINCIPAL', 'IN_FINE', 'FLAT') NOT NULL,
    min_duration_months INT NOT NULL,
    max_duration_months INT NOT NULL,
    required_collateral_percent DECIMAL(5, 2) DEFAULT 20.00
);

CREATE TABLE loan_files (
    id VARCHAR(36) PRIMARY KEY,
    member_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    agency_id VARCHAR(36) NOT NULL,
    loan_number VARCHAR(30) NOT NULL UNIQUE,
    amount_granted DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    duration_months INT NOT NULL,
    amortization_type ENUM('CONSTANT_ANNUITY', 'CONSTANT_PRINCIPAL', 'IN_FINE', 'FLAT') NOT NULL,
    disbursement_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    monthly_payment DECIMAL(15, 2) NOT NULL,
    remaining_principal DECIMAL(15, 2) NOT NULL,
    overdue_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    overdue_days INT NOT NULL DEFAULT 0,
    status ENUM('PENDING', 'APPROVED', 'DISBURSED', 'EN_COURS', 'EN_RETARD', 'CLOTURE', 'CONTENTIEUX') NOT NULL DEFAULT 'EN_COURS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (product_id) REFERENCES loan_products(id),
    FOREIGN KEY (agency_id) REFERENCES agencies(id)
);

CREATE TABLE loan_schedules (
    id VARCHAR(36) PRIMARY KEY,
    loan_id VARCHAR(36) NOT NULL,
    installment_number INT NOT NULL,
    due_date DATE NOT NULL,
    principal_due DECIMAL(15, 2) NOT NULL,
    interest_due DECIMAL(15, 2) NOT NULL,
    fees_due DECIMAL(15, 2) DEFAULT 0.00,
    total_due DECIMAL(15, 2) NOT NULL,
    principal_paid DECIMAL(15, 2) DEFAULT 0.00,
    interest_paid DECIMAL(15, 2) DEFAULT 0.00,
    penalties_paid DECIMAL(15, 2) DEFAULT 0.00,
    remaining_principal DECIMAL(15, 2) NOT NULL,
    status ENUM('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
    paid_at TIMESTAMP NULL,
    FOREIGN KEY (loan_id) REFERENCES loan_files(id)
);

-- 7. Cash Registers & Shifts (Arrêtés de caisse)
CREATE TABLE cash_registers (
    id VARCHAR(36) PRIMARY KEY,
    agency_id VARCHAR(36) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,          -- 'CAISSE-01'
    name VARCHAR(100) NOT NULL,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    gl_account VARCHAR(10) NOT NULL DEFAULT '571200',
    status ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'CLOSED',
    current_cashier_id VARCHAR(36),
    last_opened_at TIMESTAMP NULL,
    last_closed_at TIMESTAMP NULL,
    FOREIGN KEY (agency_id) REFERENCES agencies(id),
    FOREIGN KEY (current_cashier_id) REFERENCES users(id)
);

CREATE TABLE cash_shifts (
    id VARCHAR(36) PRIMARY KEY,
    cash_register_id VARCHAR(36) NOT NULL,
    cashier_id VARCHAR(36) NOT NULL,
    opening_balance DECIMAL(15, 2) NOT NULL,
    closing_balance_theoretical DECIMAL(15, 2),
    closing_balance_physical DECIMAL(15, 2),
    difference DECIMAL(15, 2),                 -- physical - theoretical
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    status ENUM('OPEN', 'CLOSED_BALANCED', 'CLOSED_DISCREPANCY') NOT NULL DEFAULT 'OPEN',
    FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id),
    FOREIGN KEY (cashier_id) REFERENCES users(id)
);

-- 8. General Ledger & Double-Entry Accounting
CREATE TABLE gl_accounts (
    account_number VARCHAR(10) PRIMARY KEY,    -- e.g. '571100', '251211'
    name VARCHAR(150) NOT NULL,
    account_class INT NOT NULL,                -- 1 to 9
    parent_account VARCHAR(10),
    type ENUM('ASSET', 'LIABILITY', 'EQUITY', 'EXPENSE', 'INCOME', 'OFF_BALANCE') NOT NULL,
    is_leaf BOOLEAN NOT NULL DEFAULT TRUE,
    current_debit DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    current_credit DECIMAL(15, 2) NOT NULL DEFAULT 0.00
);

CREATE TABLE gl_journal_entries (
    id VARCHAR(36) PRIMARY KEY,
    agency_id VARCHAR(36) NOT NULL,
    entry_number VARCHAR(30) NOT NULL UNIQUE,  -- 'JRN-20260820-0001'
    transaction_id VARCHAR(36),
    date_accounting DATE NOT NULL,
    description TEXT NOT NULL,
    created_by VARCHAR(36) NOT NULL,
    is_posted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE gl_journal_lines (
    id VARCHAR(36) PRIMARY KEY,
    entry_id VARCHAR(36) NOT NULL,
    gl_account VARCHAR(10) NOT NULL,
    debit DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    credit DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    line_description VARCHAR(255),
    FOREIGN KEY (entry_id) REFERENCES gl_journal_entries(id),
    FOREIGN KEY (gl_account) REFERENCES gl_accounts(account_number)
);

-- 9. Transactions & Idempotent Sync Logs
CREATE TABLE transactions (
    id VARCHAR(36) PRIMARY KEY,
    idempotency_key VARCHAR(100) NOT NULL UNIQUE,
    receipt_number VARCHAR(40) NOT NULL UNIQUE,
    agency_id VARCHAR(36) NOT NULL,
    cashier_id VARCHAR(36) NOT NULL,
    member_id VARCHAR(36) NOT NULL,
    account_id VARCHAR(36) NOT NULL,
    type ENUM('DEPOSIT', 'WITHDRAWAL', 'SHARE_PURCHASE', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'TONTINE_COLLECTION', 'TONTINE_SETTLEMENT', 'FEE_PAYMENT', 'TRANSFER') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    fee_amount DECIMAL(15, 2) DEFAULT 0.00,
    payment_method ENUM('CASH', 'TMONEY', 'FLOOZ', 'WAVE', 'ORANGE_MONEY', 'MTN_MOMO', 'INTERNAL_TRANSFER') NOT NULL,
    momo_reference VARCHAR(100),
    sync_status ENUM('SYNCED', 'PENDING_OFFLINE', 'CONFLICT_RESOLVED') NOT NULL DEFAULT 'SYNCED',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id),
    FOREIGN KEY (cashier_id) REFERENCES users(id),
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);
```

---

## 6. API Specification & Integration Contracts

The Core Banking Gateway exposes a high-throughput, low-latency REST and JSON API protected by Bearer Tokens (JWT) and signed idempotency headers.

### 6.1 Standard Headers

```http
Authorization: Bearer <JWT_TOKEN>
X-Agency-Code: A02
X-Cashier-Id: usr-cashier-44
X-Idempotency-Key: idemp-desk-1724115468000-84920
Content-Type: application/json
```

### 6.2 Key Endpoint Specifications

#### 1. POST `/api/v1/transactions/process` (Core Financial Transaction)
Executes a deposit, withdrawal, share purchase, loan repayment, or tontine collection with atomic double-entry ledger posting and cash balance updating.

**Request Payload**:
```json
{
  "idempotencyKey": "idemp-desk-1724115468000-84920",
  "memberCode": "A0200225",
  "accountNumber": "01-251-00225-01",
  "type": "DEPOSIT",
  "amount": 50000,
  "paymentMethod": "CASH",
  "notes": "Versement espèces guichet",
  "offlineCreatedTimestamp": "2026-08-20T10:15:30Z"
}
```

**Response Payload (`200 OK`)**:
```json
{
  "success": true,
  "transactionId": "tx-88941-2026",
  "receiptNumber": "REC-20260820-0042",
  "idempotencyKey": "idemp-desk-1724115468000-84920",
  "status": "SYNCED",
  "account": {
    "accountNumber": "01-251-00225-01",
    "realBalance": 650424,
    "frozenBalance": 0,
    "availableBalance": 650424
  },
  "cashRegister": {
    "code": "CAISSE-01",
    "newBalance": 283243
  },
  "glJournalEntryNumber": "JRN-20260820-0104",
  "timestamp": "2026-08-20T10:15:31Z"
}
```

#### 2. POST `/api/v1/sync/batch` (Offline-First Bi-Directional Synchronization)
Enables Desktop and Mobile clients returning from offline mode to replay queued local transactions and pull updated snapshots of accounts and members.

**Request Payload**:
```json
{
  "agencyCode": "A02",
  "cashierId": "usr-cashier-44",
  "lastSyncedTimestamp": "2026-08-20T08:00:00Z",
  "offlineTransactions": [
    {
      "idempotencyKey": "idemp-tx-1001",
      "memberCode": "A0200225",
      "accountNumber": "01-251-00225-01",
      "type": "DEPOSIT",
      "amount": 25000,
      "paymentMethod": "CASH",
      "offlineTimestamp": "2026-08-20T09:12:00Z"
    },
    {
      "idempotencyKey": "idemp-tx-1002",
      "memberCode": "A0200840",
      "accountNumber": "01-251-00840-01",
      "type": "WITHDRAWAL",
      "amount": 10000,
      "paymentMethod": "CASH",
      "offlineTimestamp": "2026-08-20T09:30:00Z"
    }
  ]
}
```

**Response Payload (`200 OK`)**:
```json
{
  "success": true,
  "processedCount": 2,
  "results": [
    { "idempotencyKey": "idemp-tx-1001", "status": "COMMITTED", "receiptNumber": "REC-20260820-0043" },
    { "idempotencyKey": "idemp-tx-1002", "status": "COMMITTED", "receiptNumber": "REC-20260820-0044" }
  ],
  "deltaUpdates": {
    "updatedMembers": [],
    "updatedAccounts": [
      { "accountNumber": "01-251-00225-01", "realBalance": 675424, "availableBalance": 675424 },
      { "accountNumber": "01-251-00840-01", "realBalance": 45000, "availableBalance": 45000 }
    ]
  },
  "serverSyncTimestamp": "2026-08-20T10:30:00Z"
}
```

#### 3. POST `/api/v1/loans/simulate` (Credit Simulator & Schedule Generator)
Calculates exact periodic installments, interest splits, and checks regulatory usury rate limits.

**Request Payload**:
```json
{
  "amount": 1000000,
  "annualInterestRate": 9.5,
  "durationMonths": 12,
  "amortizationType": "CONSTANT_ANNUITY",
  "disbursementDate": "2026-09-01"
}
```

**Response Payload (`200 OK`)**:
```json
{
  "amount": 1000000,
  "annualInterestRate": 9.5,
  "tegRate": 9.5,
  "isUsuryCompliant": true,
  "monthlyPayment": 87684,
  "totalInterest": 52208,
  "totalRepayment": 1052208,
  "schedule": [
    { "installmentNumber": 1, "dueDate": "2026-10-01", "principal": 79767, "interest": 7917, "total": 87684, "remainingPrincipal": 920233 },
    { "installmentNumber": 2, "dueDate": "2026-11-01", "principal": 80399, "interest": 7285, "total": 87684, "remainingPrincipal": 839834 },
    { "installmentNumber": 12, "dueDate": "2027-09-01", "principal": 86996, "interest": 688, "total": 87684, "remainingPrincipal": 0 }
  ]
}
```

#### 4. GET `/api/v1/reports/bceao-ratios` (Prudential Ratios Engine)
Generates real-time compliance metrics for auditors, management, and regulatory reporting.

**Response Payload (`200 OK`)**:
```json
{
  "asOfDate": "2026-08-20",
  "currency": "XOF",
  "ratios": {
    "liquidityRatio": {
      "value": 142.5,
      "regulatoryMin": 100.0,
      "status": "COMPLIANT",
      "details": { "liquidAssets": 85500000, "shortTermLiabilities": 60000000 }
    },
    "capitalAdequacyRatio": {
      "value": 18.2,
      "regulatoryMin": 15.0,
      "status": "COMPLIANT",
      "details": { "netEquity": 36400000, "riskWeightedAssets": 200000000 }
    },
    "par30": {
      "value": 3.1,
      "regulatoryMax": 5.0,
      "status": "COMPLIANT",
      "details": { "overdue30Portfolio": 6200000, "grossPortfolio": 200000000 }
    },
    "par90": {
      "value": 1.4,
      "regulatoryMax": 3.0,
      "status": "COMPLIANT",
      "details": { "overdue90Portfolio": 2800000, "grossPortfolio": 200000000 }
    }
  }
}
```

---

## 7. Testing & Verification Methodology

To guarantee complete financial correctness and compliance with BCEAO standards, the Core Banking implementation must adhere to a multi-tiered automated test suite:

### 7.1 Tier 1: Unit Tests (Mathematical & Calculation Invariants)
- **Amortization Exactness**: Verifies that $\sum_{k=1}^n P_k == C_0$ to the exact zero-centime level across all amortization types (`CONSTANT_ANNUITY`, `CONSTANT_PRINCIPAL`, `IN_FINE`, `FLAT`).
- **Usury Rate Barrier**: Asserts that any loan with interest > 27.0% or effective TEG > 27% throws a strict `RegulatoryUsuryException`.
- **BCEAO Quinzaine Rule**: Verifies interest accrual on livret savings based on 1st/16th value dates with mock transactions.
- **Tontine Commission Calculation**: Asserts that a 31-day cycle precisely allocates 30 mises to member and 1 mise to account `704000`.

### 7.2 Tier 2: Double-Entry Ledger Invariants
- **Accounting Equilibrium Assertion**: In every single financial transaction and batch posting:
  $$\sum \text{Debit} - \sum \text{Credit} \equiv 0.00$$
- **Account Class Preservation**: Asserts that asset accounts increase on Debit and liability/equity accounts increase on Credit.
- **Vault/Cash Desk Integrity**: Asserts that cashier desk balance matches physical billettage during shift close.

### 7.3 Tier 3: Concurrency & Idempotent Sync Tests
- **Idempotency Replay**: Replaying the same `X-Idempotency-Key` 10 times in parallel returns the exact same receipt and account balance without double-crediting/debiting.
- **Concurrent Offline Batch Playback**: Injects 50 offline transactions executed simultaneously across 3 simulated offline cashiers; asserts zero deadlocks, accurate sequential ledger journal numbering, and consistent member balances.

---

## 8. Summary of Recommendations for Implementation Phase

1. **Service Realization (`banolia-server`)**:
   - Implement an Express + TypeScript microservice in `/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/banolia-server` exposing the REST/JSON API specified above.
   - Implement an in-memory or MariaDB backed storage engine implementing the complete SQL schema and BCEAO PC-SFD ledger.
   - Integrate with Apache Fineract on port 8443 for optional deep core banking synchronization.
2. **Desktop Client Enhancement (`banolia-desktop`)**:
   - Connect the existing UI views (`AccountingView`, `CreditManager`, `SavingsManager`, `CashierDesk`, `MemberProfile`) to live REST endpoints on `banolia-server` while retaining SQLite/IndexedDB fallback for 100% offline-first operation.
3. **Mobile Banking & Tontine Collector (`banolia-mobile`)**:
   - Build out the Flutter client interfacing with the tontine collection and member account query APIs.

---
