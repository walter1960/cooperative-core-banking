# 🎨 Charte Graphique & Guide Technique — Logiciel de Gestion Coopérative (Desktop & Web)

Ce document est le guide de référence pour le collaborateur en charge du **Logiciel de Gestion Coopérative (Core Banking Desktop & Web)**.

---

## 🏛️ 1. Identité Visuelle & Principes de Design

* **Style :** Institutionnel, Haute Visibilité, Sobriété Bancaire (Executive Fintech).
* **Zéro Emoji :** Remplacés par des icônes vectorielles Lucide précises (`Landmark`, `Coins`, `ShieldCheck`, `FileSpreadsheet`).
* **Plein Écran Panoramique :** Utilisation de 100% de la largeur d'affichage (`w-full px-6 lg:px-8 py-6`).
* **Stabilité Visuelle :** Pas d'animations intempestives, aucun décalage au survol de la souris.

---

## 🎨 2. Palette de Couleurs Officielles

| Rôle | Nom / Code Hex | Classe Tailwind | Utilisation |
| :--- | :--- | :--- | :--- |
| **Fond Principal** | Gris Ardoise `#0f172a` / `#1e293b` | `bg-slate-900` | Entêtes, barres d'actions, cartes de crédit |
| **Fond Canevas** | Gris Doux `#f1f5f9` / `#ffffff` | `bg-slate-100` / `bg-white` | Arrière-plan de travail, cartes de formulaires |
| **Bordures & Séparateurs** | Ardoise Neutre `#e2e8f0` | `border-slate-200` | Séparation nette des tableaux et blocs |
| **Accent Financier Positif** | Vert Émeraude Institutionnel `#065f46` | `text-emerald-800` / `bg-emerald-800` | Épargne, versements, conformité 33% |
| **Alerte Risque & Retard** | Rouge Brique `#991b1b` | `text-rose-800` / `bg-rose-50` | Dépassement de quotité, prêts en retard |
| **Devise & Soldes** | Titane Foncé `#020617` | `text-slate-950 font-bold` | Montants monétaires, soldes comptables |

---

## 🔤 3. Typographie

* **Police Principale :** `'Plus Jakarta Sans', sans-serif`
* **Police Données Financières :** `'JetBrains Mono', monospace` (utilisée pour les numéros de comptes, matricules, soldes et montants en F.CFA).

### Échelle Typographique :
* **Titres de Modules :** `text-2xl font-bold tracking-tight text-slate-900`
* **Sous-titres Explicatifs :** `text-sm text-slate-500 font-medium`
* **En-têtes de Tableaux :** `text-xs uppercase font-bold text-slate-600 py-4 px-5`
* **Lignes de Données :** `text-sm font-medium py-3.5 px-5 text-slate-800`
* **Chiffres Clés (KPIs) :** `text-2xl font-black font-mono`

---

## 📊 4. Spécifications des Modules & Données

1. **Adhésion & Inscription :** Saisie de la date de naissance -> Âge calculé automatiquement en temps réel.
2. **Situation des Comptes Adhérent 360° :** 5 onglets réglementaires (Comptes, Remises de chèques, Crédits, DAT, Plan épargne).
3. **Prélèvements & Retenues :** Import de bordereaux de paie employeurs avec contrôle de la quotité (33.3%).
4. **Comptabilité & SYSCOA-SFD :** Balance à 6 colonnes, Grand Livre et éditions multi-formats (PDF, Excel, Word, HTML).
5. **Carte Virtuelle :** Format standard ISO/IEC 7810 ID-1 avec puce EMV, NFC et impression immédiate.

---

## 🚀 5. Commandes de Démarrage Rapide

```bash
# Installation des dépendances
npm install

# Lancement en mode développement
npm run dev

# Construction de la version de production
npm run build
```
