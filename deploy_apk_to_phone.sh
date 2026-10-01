#!/bin/bash
set -e

APK_PATH="/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/banolia-mobile/build/app/outputs/flutter-apk/app-release.apk"

echo "========================================================="
echo "   DÉPLOIEMENT MOBILE BANOLIA / COOPECTAT SUR SMARTPHONE"
echo "========================================================="

echo "1. Vérification des périphériques Android connectés..."
DEVICES=$(adb devices | grep -v "List of devices attached" | grep "device" | awk '{print $1}')

if [ -z "$DEVICES" ]; then
  echo ""
  echo "⚠️  AUCUN TÉLÉPHONE DÉTECTÉ EN DÉBOGAGE USB !"
  echo ""
  echo "Pour que votre smartphone soit détecté par l'ordinateur :"
  echo "  a) Allez dans Paramètres > À propos du téléphone."
  echo "  b) Appuyez 7 fois de suite sur 'Numéro de build' pour activer le mode Développeur."
  echo "  c) Allez dans Options pour les développeurs > Activez 'Débogage USB'."
  echo "  d) Rebranchez le câble USB et appuyez sur 'Autoriser' sur l'écran du téléphone."
  echo ""
  echo "Fichier APK disponible pour installation manuelle directe ou copie :"
  echo "  -> $APK_PATH"
  echo "========================================================="
  exit 1
fi

echo "✅ Périphérique détecté : $DEVICES"
echo "2. Installation de l'APK Release sur le téléphone..."
adb install -r "$APK_PATH"

echo ""
echo "🎉 APPLICATION INSTALLÉE AVEC SUCCÈS SUR LE TÉLÉPHONE !"
