# Corpus d'exemples — tojiru

Scripts et provenance du corpus de test. Les binaires ne sont pas versionnés (`samples/` est dans `.gitignore`). Pour les récupérer :

```bash
bash examples/fetch-samples.sh
```

Le corpus couvre les 5 formats supportés, plus quelques contre-exemples qui montrent quand tojiru gonfle (PDF raster/scanné). Les mesures sont dans [BENCH.md](BENCH.md).

## Fichiers

| Fichier | Format | Profil | Source | Licence |
|---|---|---|---|---|
| `littlebrother_doctorow.pdf` | PDF | texte vectoriel (anglais) | craphound.com | CC BY-NC-SA |
| `les-non-humains_ploum.pdf` | PDF | texte vectoriel (français, compact) | ploum.net | CC BY-SA |
| `peppercarrot_episode01.pdf` | PDF | BD raster | archive.org · peppercarrot-en | CC BY 4.0 |
| `nasa-sp-4012v2.pdf` | PDF | scanné + OCR (contre-exemple) | nasa.gov | domaine public (gouv. US) |
| `peppercarrot_episode01.cbz` | CBZ | BD | archive.org · peppercarrot-en | CC BY 4.0 |
| `peppercarrot_episode01.cb7` | CB7 | BD (repackagé) | repackaging du CBZ | CC BY 4.0 |
| `TheFanscient03V02n011948Spring.cbr` | CBR | BD | archive.org | domaine public US (voir ci-dessous) |
| `macaulayssecond00macagoog.djvu` | DjVu | livre scanné | archive.org | domaine public mondial |

## Licence / juridiction

### Pepper&Carrot épisode 1 (PDF, CBZ, CB7)
- **Licence :** CC BY 4.0. **Auteur :** David Revoy — [peppercarrot.com](https://www.peppercarrot.com)
- **Source :** [archive.org/details/peppercarrot-en](https://archive.org/details/peppercarrot-en)
- Libre dans toutes les juridictions, attribution obligatoire.

### Little Brother — Cory Doctorow (PDF texte, anglais)
- **Licence :** CC BY-NC-SA. **Clause NC :** usage non commercial uniquement.
- **Source :** [craphound.com/littlebrother](https://craphound.com/littlebrother/download/)
- Redistribuable avec attribution et partage à l'identique, hors usage commercial.

### Les non-humains — Ploum (PDF texte, français)
- **Licence :** CC BY-SA. **Auteur :** Ploum (Lionel Dricot) — [ploum.net/212-les-nons-humains](https://ploum.net/212-les-nons-humains/)
- Publié en HTML sur le blog de l'auteur ; le PDF de ce corpus est un rendu typographié. Non récupérable automatiquement.

### NASA SP-4012 v2 (PDF, contre-exemple)
- **Source :** [nasa.gov · sp-4012v2.pdf](https://www.nasa.gov/wp-content/uploads/2023/04/sp-4012v2.pdf)
- **Statut :** domaine public (œuvre du gouvernement US, 17 USC §105).
- **Pourquoi ici :** c'est un **scan + couche OCR**, pas du texte né numérique. Les pages sont des images, donc tojiru les traite comme du raster (voir BENCH.md). Sert à montrer la limite du modèle SVG sur du scanné.

### The Fanscient #03 (1948) — CBR
- **Identifiant :** `TheFanscient03V02n011948Spring` — [archive.org](https://archive.org/details/TheFanscient03V02n011948Spring)
- **États-Unis :** fanzine de 1948, sans renouvellement de copyright → domaine public américain.
- **EU/FR :** incertain (durée = vie de l'auteur + 70 ans ; auteur non identifié). **À ne pas redistribuer commercialement hors des États-Unis sans vérification.** Ici, usage de test technique uniquement.

### Macaulay's second essay on the Earl of Chatham (1891) — DjVu
- **Identifiant :** `macaulayssecond00macagoog` — [archive.org](https://archive.org/details/macaulayssecond00macagoog)
- **Auteur :** Thomas Babington Macaulay (1800–1859). **Statut :** domaine public mondial (auteur mort depuis plus de 70 ans).
