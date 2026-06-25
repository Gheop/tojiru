#!/usr/bin/env bash
# Downloads the sample corpus and rebuilds the .cb7.
# Usage: bash examples/fetch-samples.sh
# Run from the repo root. Binaries are not versioned.

set -euo pipefail

SAMPLES_DIR="$(dirname "$0")/samples"
mkdir -p "$SAMPLES_DIR"

echo "==> Downloading sample files..."

# --- Vector-text PDF (tojiru's sweet spot) ---

# Little Brother — Cory Doctorow — born-digital PDF, vector text (English)
# License: CC BY-NC-SA (non-commercial use)
wget -q --show-progress \
  -O "$SAMPLES_DIR/littlebrother_doctorow.pdf" \
  "http://craphound.com/littlebrother/Cory_Doctorow_-_Little_Brother.pdf"

# --- Raster / scanned PDF (counter-examples) ---

# Pepper&Carrot episode 1 — PDF (raster comic), CC BY 4.0
wget -q --show-progress \
  -O "$SAMPLES_DIR/peppercarrot_episode01.pdf" \
  "https://archive.org/download/peppercarrot-en/peppercarrot_episode01.pdf"

# NASA SP-4012 v2 — scanned PDF + OCR layer (public domain, US government work)
# Counter-example: pages are scanned images, not real vector text.
wget -q --show-progress \
  -O "$SAMPLES_DIR/nasa-sp-4012v2.pdf" \
  "https://www.nasa.gov/wp-content/uploads/2023/04/sp-4012v2.pdf"

# --- Comic archives ---

# Pepper&Carrot episode 1 — CBZ, CC BY 4.0
wget -q --show-progress \
  -O "$SAMPLES_DIR/peppercarrot_episode01.cbz" \
  "https://archive.org/download/peppercarrot-en/peppercarrot_episode01.cbz"

# The Fanscient #03 (1948) — CBR, US public domain (EU/FR status uncertain, see README)
wget -q --show-progress \
  -O "$SAMPLES_DIR/TheFanscient03V02n011948Spring.cbr" \
  "https://archive.org/download/TheFanscient03V02n011948Spring/The%20Fanscient%20%2303%20v02n01%20%5B1948-Spring%5D.cbr"

# --- DjVu ---

# Macaulay's second essay on the Earl of Chatham (1891) — DjVu, worldwide public domain
wget -q --show-progress \
  -O "$SAMPLES_DIR/macaulayssecond00macagoog.djvu" \
  "https://archive.org/download/macaulayssecond00macagoog/macaulayssecond00macagoog.djvu"

# --- Rebuild CB7 from the CBZ (same images) ---
echo "==> Building CB7 from CBZ..."
TMPDIR_CB7="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_CB7"' EXIT
unzip -q "$SAMPLES_DIR/peppercarrot_episode01.cbz" -d "$TMPDIR_CB7"
7z a -t7z "$SAMPLES_DIR/peppercarrot_episode01.cb7" "$TMPDIR_CB7/"* > /dev/null

echo ""
echo "Note: 'Les non-humains' by Ploum (vector-text PDF, CC BY-SA, ploum.net)"
echo "      cannot be fetched automatically (published as HTML). Provide it manually if needed."
echo ""
echo "==> Corpus ready:"
ls -lh "$SAMPLES_DIR/"
