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
| Macaulay (essai) | DjVu | 163 | 2,6 Mo | 15,0 Mo | ×6,0 |

## Lecture

**PDF texte vectoriel — le cas où tojiru brille.** Sur « Les non-humains » (polices Type1 intégrées), le bundle est *plus petit* que le PDF source (×0,92), avec un texte SVG net et scalable à l'infini. Sur Little Brother (TrueType), c'est ×5,6 : toujours du vrai vectoriel, rendu impeccable, mais plus lourd. La différence vient de l'encodage des polices : pour du Type1, `pdftocairo` réutilise chaque glyphe via `<symbol>`/`<use>` ; pour du TrueType, il émet un `<path>` par occurrence de glyphe. Le rendu est identique, c'est le poids qui change.

**Archives BD (CBZ/CB7/CBR) — bundle ≈ entrée.** Les pages sont déjà des images : tojiru les copie et ajoute des miniatures. Pas de gonflement (×1,06 à ×1,08).

**PDF raster ou scanné — la limite.** Quand les pages d'un PDF sont des images (BD raster ×33,9 ; scan NASA ×10,1), `pdftocairo` enrobe chaque image dans du SVG, ce qui pèse plus que l'image d'origine. Le NASA SP-4012 illustre le piège : il a une couche OCR (texte extractible) mais l'affichage est un scan, donc il est traité comme du raster. tojiru n'est pas fait pour du scanné ; il est fait pour du texte vectoriel.

**DjVu ×6,0 — WebP lossless, après un détour instructif.** `ddjvu` rend chaque page en raster RGB. Premier essai en WebP *lossy* (q82) : ×29,4, soit pire que le PNG (×15,8) **et** dégradé. Macaulay est un scan de texte bi-tonal (1 bit/pixel) ; le WebP lossy ajoute du bruit JPEG sur les bords de texte et gonfle. La bonne réponse, mesurée : **WebP lossless** (effort 6), qui fait ~50 % du PNG → ×6,0, sans aucune perte. Le bundle reste plus gros que la source parce que la compression bi-tonale JB2 du DjVu bat n'importe quel format raster généraliste ; rastériser a un coût. Un DjVu à contenu photo descendrait bien plus bas.

## Méthode

Bench réel via le CLI sur le corpus de `fetch-samples.sh`. Pour reproduire :

```bash
bash examples/fetch-samples.sh
tojiru examples/samples/<fichier> --out /tmp/bench --force
du -sh /tmp/bench
```
