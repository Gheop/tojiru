# Sample corpus — tojiru

Scripts and provenance for the test corpus. Binaries are not versioned (`samples/` is in `.gitignore`). To fetch them:

```bash
bash examples/fetch-samples.sh
```

The corpus covers all 5 supported formats, plus a few counter-examples that show when tojiru bloats (raster/scanned PDF). Measurements are in [BENCH.md](BENCH.md).

## Files

| File | Format | Profile | Source | License |
|---|---|---|---|---|
| `littlebrother_doctorow.pdf` | PDF | vector text (English) | craphound.com | CC BY-NC-SA |
| `les-non-humains_ploum.pdf` | PDF | vector text (French, compact) | ploum.net | CC BY-SA |
| `peppercarrot_episode01.pdf` | PDF | raster comic | archive.org · peppercarrot-en | CC BY 4.0 |
| `nasa-sp-4012v2.pdf` | PDF | scanned + OCR (counter-example) | nasa.gov | public domain (US gov.) |
| `peppercarrot_episode01.cbz` | CBZ | comic | archive.org · peppercarrot-en | CC BY 4.0 |
| `peppercarrot_episode01.cb7` | CB7 | comic (repackaged) | repackaging of the CBZ | CC BY 4.0 |
| `TheFanscient03V02n011948Spring.cbr` | CBR | comic | archive.org | US public domain (see below) |
| `macaulayssecond00macagoog.djvu` | DjVu | scanned book | archive.org | worldwide public domain |

## License / jurisdiction

### Pepper&Carrot episode 1 (PDF, CBZ, CB7)
- **License:** CC BY 4.0. **Author:** David Revoy — [peppercarrot.com](https://www.peppercarrot.com)
- **Source:** [archive.org/details/peppercarrot-en](https://archive.org/details/peppercarrot-en)
- Free in all jurisdictions, attribution required.

### Little Brother — Cory Doctorow (PDF text, English)
- **License:** CC BY-NC-SA. **NC clause:** non-commercial use only.
- **Source:** [craphound.com/littlebrother](https://craphound.com/littlebrother/download/)
- Redistributable with attribution and share-alike, outside commercial use.

### Les non-humains — Ploum (PDF text, French)
- **License:** CC BY-SA. **Author:** Ploum (Lionel Dricot) — [ploum.net/212-les-nons-humains](https://ploum.net/212-les-nons-humains/)
- Published as HTML on the author's blog; the PDF in this corpus is a typeset render. Not fetchable automatically.

### NASA SP-4012 v2 (PDF, counter-example)
- **Source:** [nasa.gov · sp-4012v2.pdf](https://www.nasa.gov/wp-content/uploads/2023/04/sp-4012v2.pdf)
- **Status:** public domain (US government work, 17 USC §105).
- **Why it's here:** this is a **scan + OCR layer**, not born-digital text. Pages are images, so tojiru treats them as raster (see BENCH.md). Demonstrates the SVG model's limit on scanned content.

### The Fanscient #03 (1948) — CBR
- **Identifier:** `TheFanscient03V02n011948Spring` — [archive.org](https://archive.org/details/TheFanscient03V02n011948Spring)
- **United States:** 1948 fanzine, no copyright renewal → US public domain.
- **EU/FR:** uncertain (duration = author's life + 70 years; author unidentified). **Do not redistribute commercially outside the United States without verification.** Used here for technical testing only.

### Macaulay's second essay on the Earl of Chatham (1891) — DjVu
- **Identifier:** `macaulayssecond00macagoog` — [archive.org](https://archive.org/details/macaulayssecond00macagoog)
- **Author:** Thomas Babington Macaulay (1800–1859). **Status:** worldwide public domain (author dead more than 70 years).
