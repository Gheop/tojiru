# Bench PDF — tojiru

Mesures effectuées le 2026-06-25.
Commande : `npx tsx src/cli.ts <fichier> --out /tmp/bench-<nom> --force`
Machine : Linux, 22 threads, Node 20+.

---

## Résultats

| Fichier | Pages | Entrée | Bundle total | pages/*.svgz | thumbs/*.webp | Ratio | Temps |
|---|---|---|---|---|---|---|---|
| `peppercarrot_episode01.pdf` (raster comic, 4 pages) | 4 | 164 KB | 5 554 KB | 5 531 KB | 17 KB | ×33,9 | 3,2 s |
| `generated-text.pdf` (texte vectoriel, 40 pages) | 40 | 8 KB | 89 KB | 59 KB | 20 KB | ×10,9 | 4,0 s |

---

## Formats non encore benchmarkés

| Fichier | Format | Taille entrée | Statut |
|---|---|---|---|
| `peppercarrot_episode01.cbz` | CBZ | 1 136 KB | extracteur à venir |
| `peppercarrot_episode01.cb7` | CB7 | 1 055 KB | extracteur à venir |
| `TheFanscient03V02n011948Spring.cbr` | CBR | 6 700 KB | extracteur à venir |
| `macaulayssecond00macagoog.djvu` | DjVu | 2 616 KB | extracteur à venir |

---

## Observations

Le cas raster comic (Pepper&Carrot) produit un bundle **34 fois plus lourd** que l'entrée. L'explication est directe : le PDF source est une recompression JPEG déjà lossy, que pdftocairo redessine page par page avant de produire des SVG encapsulant des bitmaps, eux-mêmes compressés en gzip (`.svgz`). Un SVG de page pleine couleur haute résolution pèse naturellement plus qu'un JPEG équivalent.

Le cas texte vectoriel (fixture générée) produit un ratio ×11, mais le fichier source est artificiel (8 KB pour 40 pages) : chaque page ne contient qu'une ligne de texte, ce qui gonfle le ratio mécaniquement.

En usage réel, un PDF texte de 40 pages bien rempli devrait produire un ratio plus proche de ×2 à ×5. Ces chiffres sont à prendre comme valeurs de référence, pas comme indicateur de performance cible.
