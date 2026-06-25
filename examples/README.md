# Corpus d'exemples — tojiru

Ce dossier contient les scripts pour reproduire le corpus de test. Les fichiers binaires eux-mêmes ne sont pas versionnés (`samples/` est dans `.gitignore`).

Pour télécharger le corpus :

```bash
bash examples/fetch-samples.sh
```

---

## Fichiers

| Fichier | Format | Source | Taille |
|---|---|---|---|
| `peppercarrot_episode01.pdf` | PDF (raster, comic) | archive.org · peppercarrot-en | 164 KB |
| `peppercarrot_episode01.cbz` | CBZ | archive.org · peppercarrot-en | 1,1 MB |
| `peppercarrot_episode01.cb7` | CB7 (généré) | Repackaging du CBZ ci-dessus | 1,1 MB |
| `TheFanscient03V02n011948Spring.cbr` | CBR | archive.org · TheFanscient03V02n011948Spring | 6,6 MB |
| `macaulayssecond00macagoog.djvu` | DjVu | archive.org · macaulayssecond00macagoog | 2,6 MB |
| `generated-text.pdf` | PDF (texte vectoriel, fixture) | Généré par `test/helpers/fixtures.ts` | 8 KB |

---

## Licence / juridiction

### Pepper&Carrot épisode 1 (PDF, CBZ, CB7)

- **Licence :** Creative Commons Attribution 4.0 International (CC-BY 4.0)
- **Auteur :** David Revoy — [peppercarrot.com](https://www.peppercarrot.com)
- **Source :** [archive.org/details/peppercarrot-en](https://archive.org/details/peppercarrot-en)
- **Juridiction :** Libre dans toutes les juridictions. Attribution obligatoire.

### The Fanscient #03 v02n01 (1948-Spring) — CBR

- **Identifiant archive.org :** `TheFanscient03V02n011948Spring`
- **Source :** [archive.org/details/TheFanscient03V02n011948Spring](https://archive.org/details/TheFanscient03V02n011948Spring)
- **Statut aux États-Unis :** Fanzine de science-fiction de 1948. Aucun renouvellement de copyright enregistré → domaine public américain (Loi Sonny Bono : œuvres publiées avant 1978 non renouvelées).
- **Statut EU/FR :** Incertain. La durée de protection dépend du droit moral et des règles de pays d'origine. En France, la durée standard est vie de l'auteur + 70 ans. L'auteur n'est pas identifié dans les métadonnées. **À ne pas redistribuer commercialement hors des États-Unis sans vérification.**
- **Usage dans ce corpus :** uniquement à des fins de test technique, non redistribué.

### Macaulay's second essay on the Earl of Chatham (1891) — DjVu

- **Identifiant archive.org :** `macaulayssecond00macagoog`
- **Source :** [archive.org/details/macaulayssecond00macagoog](https://archive.org/details/macaulayssecond00macagoog)
- **Auteur :** Thomas Babington Macaulay (1800–1859)
- **Date de publication :** 1891 (édition posthume)
- **Statut :** Domaine public mondial. L'auteur est décédé depuis plus de 70 ans (mort en 1859 → PD depuis 1930 au plus tard dans toutes les juridictions).

### generated-text.pdf — PDF texte vectoriel (fixture)

- **Source :** Généré par `test/helpers/fixtures.ts` via `pdf-lib`
- **Statut :** Créé pour ce projet, aucune restriction.
- **Contenu :** 40 pages numérotées, texte Helvetica sur fond blanc, sans contenu tiers.
