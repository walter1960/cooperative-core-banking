# Original User Request

## Initial Request — 2026-08-20T00:56:56Z

BANOLIA est une suite logicielle complète de microfinance et de finance digitale (concurrent moderne de PERFECT / CAGECFI) comprenant un Core Banking (Apache Fineract), une application d'agence Desktop 100% Offline-First, une application Mobile Banking avec passerelles Mobile Money, et un Assistant Vocal IA (Gemini).

Working directory: /home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE
Integrity mode: development

## Requirements

### R1. Core Banking & Paramétrage Réglementaire
Moteur financier basé sur Apache Fineract configuré pour la zone UMOA/BCEAO (en devises Francs CFA - XOF), avec gestion des sociétaires, parts sociales, épargne ordinaire, tontines, crédits avec échéanciers d'amortissement, et grand livre comptable automatique.

### R2. Logiciel d'Agence Desktop 100% Offline-First
Application de bureau (Tauri / React) permettant aux guichetiers d'exécuter des dépôts, retraits, ouvertures de comptes et arrêtés de caisse même sans connexion Internet, avec synchronisation bidirectionnelle automatique par lots et clés d'idempotence, ainsi que pilotage d'imprimantes thermiques ESC/POS et lecteurs biométriques USB.

### R3. Application Mobile Adhérent (M-Banking) & Collecte Terrain
Application mobile multiplateforme (Flutter) offrant aux sociétaires la consultation du solde réel/gelé, l'historique des opérations, les demandes de micro-prêt, et les dépôts/retraits autonomes via Mobile Money (TMoney, Flooz, Wave, MTN MoMo, Orange Money), ainsi qu'un mode collecteur de tontine hors-ligne avec reçus Bluetooth.

### R4. Assistant Vocal IA Multimodal (Gemini API)
Module d'intelligence artificielle vocale permettant l'exécution d'ordres de caisse au guichet par la voix ("Versement de 50 000 pour Tomrom"), la consultation vocale du solde sur mobile en français et langues locales (Éwé, Mina, etc.), et l'analyse de ratios financiers pour la direction.

## Acceptance Criteria

### Fonctionnalités & Résilience Hors-Ligne
- [ ] Le logiciel de bureau fonctionne à 100% sans coupure lors d'une déconnexion réseau et synchronise toutes les opérations dès le retour de la connexion sans aucun doublon.
- [ ] L'impression des reçus thermiques 80mm fonctionne instantanément après chaque opération de versement ou retrait.
- [ ] Le simulateur et l'échéancier de crédit calculent les mensualités exactes au centime près.

### Finance Digitale & IA
- [ ] Les passerelles Mobile Money permettent d'initier un dépôt ou retrait direct depuis l'application mobile.
- [ ] L'assistant vocal reconnaît et extrait avec précision l'adhérent, l'opération et le montant pour pré-remplir les formulaires en moins de 2 secondes.
- [ ] Les états financiers et grands livres sont conformes au plan comptable des SFD de la BCEAO.
