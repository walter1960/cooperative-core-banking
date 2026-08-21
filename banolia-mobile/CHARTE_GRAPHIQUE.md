# 📱 Charte Graphique & Spécifications — Application Mobile Sociétaires & Collecteurs

Ce document est le guide de référence pour le collaborateur en charge du développement de l'**Application Mobile (Flutter / React Native)**.

---

## 🎯 1. Rôles de l'Application Mobile

1. **Espace Sociétaire Adhérent :**
   * Consultation du solde du livret d'épargne en temps réel.
   * Carte de sociétaire virtuelle avec QR Code dynamique pour identification au guichet.
   * Demande de crédit et suivi des échéances restantes.
   * Dépôt d'épargne via passerelles Mobile Money (T-Money, Moov Money, Wave, Orange Money).

2. **Espace Collecteur Terrain (Tontinier) :**
   * Collecte d'épargne journalière sur les marchés et auprès des commerçants.
   * Mode 100% Hors-Ligne (Offline-First) avec synchronisation différée.
   * Génération de reçus numériques par SMS ou impression via imprimante thermique Bluetooth 58mm.

---

## 🎨 2. Palette Graphique Mobile

* **Couleur Primaire :** Vert Forêt Profond (`#065F46` / `Color(0xFF065F46)`)
* **Couleur Secondaire :** Ardoise Sombre (`#0F172A` / `Color(0xFF0F172A)`)
* **Fond Écran Clair :** Blanc Neige (`#F8FAFC` / `Color(0xFFF8FAFC)`)
* **Fond Écran Sombre :** Nuit Noire (`#020617` / `Color(0xFF020617)`)
* **Boutons d'Action :** Coins arrondis (`BorderRadius.circular(16)`), hauteur minimale 52dp pour un confort tactile optimal.

---

## 🔤 3. Typographie

* **Police :** `Plus Jakarta Sans`
* **Nombres & Soldes :** `JetBrains Mono` ou `Roboto Mono`

---

## 🚀 4. Lancement du Projet

```bash
# Récupération des packages Flutter
flutter pub get

# Lancement sur émulateur ou appareil connecté
flutter run
```
