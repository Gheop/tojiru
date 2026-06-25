# Rapport corpus — tojiru (2026-06-25)

## Fichiers téléchargés

| Fichier | Taille exacte | Source |
|---|---|---|
| `peppercarrot_episode01.pdf` | 167 718 octets (164 KB) | archive.org/download/peppercarrot-en/peppercarrot_episode01.pdf |
| `peppercarrot_episode01.cbz` | 1 063 458 octets (1 039 KB) | archive.org/download/peppercarrot-en/peppercarrot_episode01.cbz |
| `peppercarrot_episode01.cb7` | 1 079 784 octets (1 055 KB) | généré : unzip cbz + 7z a -t7z |
| `TheFanscient03V02n011948Spring.cbr` | 6 859 040 octets (6 700 KB) | archive.org/download/TheFanscient03V02n011948Spring/... |
| `macaulayssecond00macagoog.djvu` | 2 678 089 octets (2 615 KB) | archive.org/download/macaulayssecond00macagoog/... |
| `generated-text.pdf` | 8 274 octets (8 KB) | généré via test/helpers/fixtures.ts (40 pages) |

## Bench PDF

| Fichier | Pages | Entrée | Bundle total | pages/*.svgz | thumbs/*.webp | Ratio | Temps |
|---|---|---|---|---|---|---|---|
| peppercarrot_episode01.pdf | 4 | 164 KB | 5 554 KB | 5 531 KB | 17 KB | ×33,9 | 3,2 s |
| generated-text.pdf | 40 | 8 KB | 89 KB | 59 KB | 20 KB | ×10,9 | 4,0 s |

## Notes de licence

**Pepper&Carrot** : CC-BY 4.0, David Revoy. Libre dans toutes les juridictions avec attribution.

**The Fanscient #03 (1948)** : Fanzine SF américain de 1948. Domaine public américain (pas de renouvellement de copyright). Statut EU/FR incertain — aucun auteur identifié, durée de protection standard vie+70 ans. Utilisé uniquement pour test technique, non redistribué.

**Macaulay (1891)** : Thomas Babington Macaulay (mort 1859). Domaine public mondial sans ambiguïté.

**generated-text.pdf** : Fixture interne, aucune restriction.

## Candidats qui ont échoué

### CBR : Henry-Aldrich-Comics-009-1952
- Identifiant : `Henry-Aldrich-Comics-009-1952`
- Taille : 14,4 MB
- Raison d'échec : HTTP 401 Unauthorized lors du téléchargement — fichier protégé sur archive.org malgré présence dans les métadonnées publiques.
- Solution : TheFanscient03V02n011948Spring (6,6 MB, RAR v4, téléchargeable).

### CBR : x-1pics
- Identifiant : `x-1pics`
- Taille annoncée : 7,9 MB
- Raison d'échec : HTTP 500 Internal Server Error.
- Solution : même fallback TheFanscient.

### DjVu : chemicalnewsand41unkngoog (1892)
- Pas de fichier `.djvu` réel — seulement `_djvu.xml` (format dérivé, pas DjVu natif).
- Solution : macaulayssecond00macagoog (2,6 MB, DjVu natif confirmé).

### PDF texte vectoriel : ASPC0001926100 (1856, archive.org)
- Taille : 3,5 MB, format "Text PDF"
- Raison d'échec : HTTP 500 Internal Server Error.
- Solution : fixture générée via `test/helpers/fixtures.ts` (pdf-lib, 40 pages, 8 KB). Labelée comme fixture de test.

### PDF texte vectoriel : Project Gutenberg (pg74-pdf.pdf)
- URL testée : https://www.gutenberg.org/files/74/74-pdf.pdf
- Raison d'échec : HTTP 404 — Gutenberg ne fournit plus de PDF directement à cette URL.

## Observations bench

Le ratio ×34 sur Pepper&Carrot est attendu : le PDF source est une recompression JPEG déjà dégradée, que pdftocairo re-rastérise avant d'encapsuler dans des SVG gzip. Un JPEG de page pleine couleur pèse bien moins que son équivalent SVG+bitmap.

Le ratio ×11 sur la fixture texte est artificiel : 8 KB pour 40 pages (une ligne de texte par page) gonfle mécaniquement le ratio. En usage réel, un PDF texte normal (200-300 KB pour 40 pages) devrait donner un ratio de ×2 à ×5.
