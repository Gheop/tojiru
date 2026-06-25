# Bench — tojiru

Mesures du 2026-06-25. Commande : `tojiru <fichier> --out <dossier>`.
Ratio = taille du bundle de sortie / taille du fichier d'entrée.

## Résultats (5 formats + contre-exemples PDF)

| Échantillon | Format | Pages | Entrée | Bundle | Ratio |
|---|---|---|---|---|---|
| Les non-humains (Ploum) | PDF texte vectoriel — Type1 | 9 | 202 Ko | 186 Ko | **×0,92** |
| Little Brother (Doctorow) | PDF texte vectoriel — TrueType | 134 | 1,9 Mo | 10,5 Mo | ×5,6 |
| Pepper&Carrot ép.1 | PDF (BD raster) | 4 | 163 Ko | 5,5 Mo | ×33,9 |
| NASA SP-4012 v2 | PDF scanné + OCR | 642 | 8,0 Mo | 80,7 Mo | ×10,1 |
| Pepper&Carrot ép.1 | CBZ | 4 | 1,0 Mo | 1,1 Mo | ×1,06 |
| Pepper&Carrot ép.1 | CB7 | 4 | 1,0 Mo | 1,1 Mo | ×1,06 |
| The Fanscient #03 | CBR | 32 | 6,5 Mo | 7,1 Mo | ×1,08 |
| Macaulay (essai) | DjVu | 163 | 2,6 Mo | 75,0 Mo | ×29,4 |

## Lecture

**PDF texte vectoriel — le cas où tojiru brille.** Sur « Les non-humains » (polices Type1 intégrées), le bundle est *plus petit* que le PDF source (×0,92), avec un texte SVG net et scalable à l'infini. Sur Little Brother (TrueType), c'est ×5,6 : toujours du vrai vectoriel, rendu impeccable, mais plus lourd. La différence vient de l'encodage des polices : pour du Type1, `pdftocairo` réutilise chaque glyphe via `<symbol>`/`<use>` ; pour du TrueType, il émet un `<path>` par occurrence de glyphe. Le rendu est identique, c'est le poids qui change.

**Archives BD (CBZ/CB7/CBR) — bundle ≈ entrée.** Les pages sont déjà des images : tojiru les copie et ajoute des miniatures. Pas de gonflement (×1,06 à ×1,08).

**PDF raster ou scanné — la limite.** Quand les pages d'un PDF sont des images (BD raster ×33,9 ; scan NASA ×10,1), `pdftocairo` enrobe chaque image dans du SVG, ce qui pèse plus que l'image d'origine. Le NASA SP-4012 illustre le piège : il a une couche OCR (texte extractible) mais l'affichage est un scan, donc il est traité comme du raster. tojiru n'est pas fait pour du scanné ; il est fait pour du texte vectoriel.

**DjVu ×29,4 — WebP implémenté, mais ce DjVu est bi-tonal.** L'extracteur sort désormais les pages en WebP q85 (implémenté). Résultat sur cet échantillon : ×29,4, contre ×15,8 en PNG lossless — WebP est *plus lourd* ici. La raison : Macaulay est un scan de texte bi-tonal (1 bit/pixel) ; PNG lossless excelle sur ce type de contenu, WebP lossy non. Pour des scans photo couleur ou niveaux de gris, WebP serait bien plus compact. L'amélioration attendue (×1,5) s'applique aux DjVu à contenu photo, pas aux DjVu texte bi-tonal.

## Méthode

Bench réel via le CLI sur le corpus de `fetch-samples.sh`. Pour reproduire :

```bash
bash examples/fetch-samples.sh
tojiru examples/samples/<fichier> --out /tmp/bench --force
du -sh /tmp/bench
```
