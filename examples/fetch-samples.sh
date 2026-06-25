#!/usr/bin/env bash
# Télécharge tous les fichiers du corpus d'exemples et reconstruit le .cb7.
# Usage : bash examples/fetch-samples.sh
# Exécuter depuis la racine du dépôt.

set -euo pipefail

SAMPLES_DIR="$(dirname "$0")/samples"
mkdir -p "$SAMPLES_DIR"

echo "==> Téléchargement des fichiers d'exemples..."

# Pepper&Carrot épisode 1 — PDF (raster, comic), CC-BY 4.0
wget -q --show-progress \
  -O "$SAMPLES_DIR/peppercarrot_episode01.pdf" \
  "https://archive.org/download/peppercarrot-en/peppercarrot_episode01.pdf"

# Pepper&Carrot épisode 1 — CBZ, CC-BY 4.0
wget -q --show-progress \
  -O "$SAMPLES_DIR/peppercarrot_episode01.cbz" \
  "https://archive.org/download/peppercarrot-en/peppercarrot_episode01.cbz"

# The Fanscient #03 (1948) — CBR, domaine public US
wget -q --show-progress \
  -O "$SAMPLES_DIR/TheFanscient03V02n011948Spring.cbr" \
  "https://archive.org/download/TheFanscient03V02n011948Spring/The%20Fanscient%20%2303%20v02n01%20%5B1948-Spring%5D.cbr"

# Macaulay's second essay on the Earl of Chatham (1891) — DjVu, domaine public mondial
wget -q --show-progress \
  -O "$SAMPLES_DIR/macaulayssecond00macagoog.djvu" \
  "https://archive.org/download/macaulayssecond00macagoog/macaulayssecond00macagoog.djvu"

# PDF texte généré (fixture) — aucune dépendance réseau requise
echo "==> Génération du PDF texte de référence..."
node --import tsx -e \
  "import('./test/helpers/fixtures.js').then(m=>m.makePdf('$SAMPLES_DIR/generated-text.pdf',40))"

# Reconstruction du CB7 depuis le CBZ
echo "==> Construction du CB7 depuis le CBZ..."
TMPDIR_CB7="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_CB7"' EXIT

unzip -q "$SAMPLES_DIR/peppercarrot_episode01.cbz" -d "$TMPDIR_CB7"
7z a -t7z "$SAMPLES_DIR/peppercarrot_episode01.cb7" "$TMPDIR_CB7/"* > /dev/null

echo ""
echo "==> Corpus prêt :"
ls -lh "$SAMPLES_DIR/"
