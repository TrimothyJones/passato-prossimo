# Source trial: Dizionario della lingua italiana (1827), volume II

Assessment date: 2026-09-24. Status: useful historical evidence; no runtime import
and no new approved learner senses. This is a two-headword source trial.

## Identity and scope

- [User-supplied item](https://archive.org/details/bub_gb_ppwppU038v8C/page/50/mode/2up)
- [Machine-readable metadata](https://archive.org/metadata/bub_gb_ppwppU038v8C)
- Identifier: `bub_gb_ppwppU038v8C`; Google Books ID: `ppwppU038v8C`.
- Catalog title: *Dizionario Della Lingua Italiana*; date: 1827.
- Publisher: Padova, Tipografia della Minerva.
- Contributing collection: National Central Library of Florence; scanner: Google.
- OCR title page identifies **VOLUME II**, dated **MDCCCXXVII**. The opening
  dictionary section is C; the closing publisher notice explicitly says this
  volume completes the letter C. It is not an A–Z dictionary in one file.
- Metadata lists 708 images, not 708 numbered dictionary pages.
- Definitions are Italian, with Latin/Greek equivalents and literary citations.
  This is not an Italian–English dictionary.

Of our initial 15 spellings, `che` and `con` belong in this volume. Hits for `di`,
`fare`, and other letters in this OCR are often citations or cross-references;
they are not evidence of a corresponding headword entry. Other volumes would
be needed to examine those entries.

## Rights evidence

The Archive metadata and item page identify the item with
[Public Domain Mark 1.0](https://creativecommons.org/publicdomain/mark/1.0/).
That mark identifies material believed free of known copyright restrictions;
it is not a new copyright license or a warranty. Record it as a source rights
statement, not as CC0 or CC BY-SA. The 1827 publication date supports investigating
this as public-domain source material. No independent worldwide rights conclusion
or modern editorial-translation license has been assigned by this assessment.

Keep bibliographic attribution and exact page references even when permission is
not required. Distinguish original historical text, OCR, corrected transcription,
and our proposed modern English glosses. Do not inherit a foundation record's
approved status merely from a public-domain source mark.

## Small local cache

Downloaded into `tmp/italian-dictionary-1827/`, excluded from Git with a scoped rule:

| File | Purpose |
| --- | --- |
| `metadata.json` | Archive metadata and downloadable-file inventory |
| `ocr.txt` | Full 4,523,929-byte OCR file, used for targeted searches only |
| `page-numbers.json` | Map printed page numbers to scan leaf indices |
| `page-246.jpg` | Neighboring page inspected while locating the start of CHE |
| `page-247.jpg` | Visually checked CHE page, scan leaf 254 |
| `page-429.jpg` | Visually checked CON page, scan leaf 436 |

The PDF is 51,583,873 bytes; the JP2 image archive is 312,795,648 bytes. Neither
was downloaded. The plain OCR plus three page images are sufficient for this trial.
No full-book extraction into lexical records was performed.

OCR URL:
<https://archive.org/download/bub_gb_ppwppU038v8C/bub_gb_ppwppU038v8C_djvu.txt>

OCR SHA-256:
`16b0ed7ac8f746c107b282b45271dc461afd695d162edeaa0864a0112fbf974b`

Reproduce the sample by downloading that OCR file, verifying its hash, locating
the passages below, and checking the linked scans. OCR line numbers are locators
for this exact file, not stable bibliographic page identifiers.

## Visually checked sample

Short transcriptions below were read against the scans. They are excerpts, not
complete entries. English directions are AI-assisted editorial candidates, not
translations supplied by the dictionary or approved foundation records.

| Headword/use | Printed source text | Proposed learner direction | Locator |
| --- | --- | --- | --- |
| che, relative | “Relativo di sustanza, e riferisce tutti i generi e tutti i numeri. Il quale.” | who / which / that, in a relative clause | p. 247, left column under CH |
| che, interrogative | “Interrogativo, o tacito o espresso” and “Qual cosa, Che cosa” | what, in direct or indirect questions | p. 247, lower left column |
| che, conjunction | “Congiunzione dependente da verbo.” | that, introducing a clause dependent on a verb | p. 247, right column |
| con, instrument | “Preposizione strumentale.” | with, indicating an instrument or means | p. 429, right column, CON opening |
| con, companionship | “Talora denota Compagnia.” | with, indicating accompaniment | p. 429, right column, CON § I |

Source pages:

- [CHE, printed p. 247 / leaf 254](https://archive.org/details/bub_gb_ppwppU038v8C/page/n254/mode/1up)
- [CON, printed p. 429 / leaf 436](https://archive.org/details/bub_gb_ppwppU038v8C/page/n436/mode/1up)

These support separate senses and usage notes, rather than one undifferentiated
translation per spelling. This sample does not establish which sense should be
the general learner default, modern register, or the correct sense in a sentence.

## Quality findings

1. **Headword OCR can fail.** The opening CHE is rendered `CiHR.` in the plain text
   around line 41949. Searching only for exact uppercase `CHE.` would miss its
   first relative sense. Printed running headers also look like headwords.
2. **Pages and columns need visual checking.** Printed p. 246 ends the preceding
   entry; CHE starts on p. 247 after continuation text. The OCR page header
   `C HE 047` appears between columns of that page, so it cannot reliably delimit
   an entire entry. Page-number metadata identifies leaf 254 correctly.
3. **Historical usage is not a modern prescription.** CON § VI on p. 429 says
   “CON IL regolarmente non si adopera,” continuing onto p. 430. Preserve that as
   historical evidence; do not publish it as present-day learner guidance without
   checking a modern source. This assessment does not review the full continuation.
4. **Definitions and citations are mixed.** Latin/Greek equivalents, author
   abbreviations, examples, sub-senses, and neighboring entries need separating.
   OCR contains corrupted names, accents, punctuation, and line-break hyphenation.
5. **Frequency and register remain unestablished.** Entry order in an 1827 volume
   is not evidence of the best default for today's learners. Its examples are
   heavily literary, and even a clear transcription needs modern usage review.

## Decision and next bounded step

Keep this as a historical evidence source. It is especially useful for interpreting
older reading material and exposing distinct constructions. It does not replace
modern English learner glosses or the existing providers.

Next, review these five candidate senses across two words against a modern source,
then prepare a small draft provider diff if useful. Each eventual record must
carry definition language `en`, the historical source page, adaptation provenance,
rights evidence, assessed confidence, register, and review status. Keep the Italian
transcription separately identified as source language `it`. Any original source
sense remains available as historical evidence; it must not be overwritten by the
modern editorial gloss.

The current `di`/`fare` experiment and approved provider export remain unchanged.
No bulk import, new runtime examples, or usage-reset action was performed.
