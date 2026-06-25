#!/usr/bin/env bash
# Télécharge le corpus d'exemples et reconstruit le .cb7.
# Usage : bash examples/fetch-samples.sh
# Exécuter depuis la racine du dépôt. Les binaires ne sont pas versionnés.

set -euo pipefail

SAMPLES_DIR="$(dirname "$0")/samples"
mkdir -p "$SAMPLES_DIR"

echo "==> Téléchargement des fichiers d'exemples..."

# --- PDF texte vectoriel (le sweet spot de tojiru) ---

# Little Brother — Cory Doctorow — PDF né numérique, texte vectoriel (anglais)
# Licence : CC BY-NC-SA (usage non commercial)
wget -q --show-progress \
  -O "$SAMPLES_DIR/littlebrother_doctorow.pdf" \
  "http://craphound.com/littlebrother/Cory_Doctorow_-_Little_Brother.pdf"

# --- PDF raster / scanné (contre-exemples) ---

# Pepper&Carrot épisode 1 — PDF (BD raster), CC BY 4.0
wget -q --show-progress \
  -O "$SAMPLES_DIR/peppercarrot_episode01.pdf" \
  "https://archive.org/download/peppercarrot-en/peppercarrot_episode01.pdf"

# NASA SP-4012 v2 — PDF scanné + couche OCR (domaine public, œuvre du gouvernement US)
# Sert de contre-exemple : pages = images scannées, pas du vrai texte vectoriel.
wget -q --show-progress \
  -O "$SAMPLES_DIR/nasa-sp-4012v2.pdf" \
  "https://www.nasa.gov/wp-content/uploads/2023/04/sp-4012v2.pdf"

# --- Archives BD ---

# Pepper&Carrot épisode 1 — CBZ, CC BY 4.0
wget -q --show-progress \
  -O "$SAMPLES_DIR/peppercarrot_episode01.cbz" \
  "https://archive.org/download/peppercarrot-en/peppercarrot_episode01.cbz"

# The Fanscient #03 (1948) — CBR, domaine public US (statut EU/FR incertain, voir README)
wget -q --show-progress \
  -O "$SAMPLES_DIR/TheFanscient03V02n011948Spring.cbr" \
  "https://archive.org/download/TheFanscient03V02n011948Spring/The%20Fanscient%20%2303%20v02n01%20%5B1948-Spring%5D.cbr"

# --- DjVu ---

# Macaulay's second essay on the Earl of Chatham (1891) — DjVu, domaine public mondial
wget -q --show-progress \
  -O "$SAMPLES_DIR/macaulayssecond00macagoog.djvu" \
  "https://archive.org/download/macaulayssecond00macagoog/macaulayssecond00macagoog.djvu"

# --- Reconstruction du CB7 depuis le CBZ (mêmes images) ---
echo "==> Construction du CB7 depuis le CBZ..."
TMPDIR_CB7="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_CB7"' EXIT
unzip -q "$SAMPLES_DIR/peppercarrot_episode01.cbz" -d "$TMPDIR_CB7"
7z a -t7z "$SAMPLES_DIR/peppercarrot_episode01.cb7" "$TMPDIR_CB7/"* > /dev/null

echo ""
echo "Note : 'Les non-humains' de Ploum (PDF texte vectoriel, CC BY-SA, ploum.net)"
echo "       n'est pas récupérable automatiquement (publié en HTML). À fournir à la main si besoin."
echo ""
echo "==> Corpus prêt :"
ls -lh "$SAMPLES_DIR/"
