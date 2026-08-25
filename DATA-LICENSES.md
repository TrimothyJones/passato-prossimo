# Data Licenses

The Passato Prossimo code license does not cover the generated language layers
listed below. Each layer retains the terms of its upstream data.

| Files | Source | Terms | Changes made for Passato Prossimo |
| --- | --- | --- | --- |
| `prototype-0.2-lexical-coverage/core-dictionary.js` | [Kaikki Italian](https://kaikki.org/dictionary/Italian/index.html), derived from English Wiktionary with Wiktextract | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | Selected and ranked a compact subset; omitted unused fields; added learner-facing ranking and gloss hints. |
| `prototype-0.3-assisted-reader/dictionary-overflow.js` | [mik3ml/italian-dictionary](https://huggingface.co/datasets/mik3ml/italian-dictionary), derived from Wiktionary | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | Selected 12,000 entries and one definition line per entry; removed markup; shortened long definitions; attached local frequency fields. |
| `prototype-0.3-assisted-reader/paisa-frequency.js` | [PAISA Italian corpus](https://www.corpusitaliano.it/en/contents/description.html) | [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/) | Converted the source list into a 25,000-entry JavaScript layer with rank, corpus count, and reader-oriented Zipf values. This alpha is noncommercial. |
| `prototype-0.3-assisted-reader/learner-enrichment.js` | [Language-Learning-decks](https://github.com/vbvss199/Language-Learning-decks) and [wordfreq](https://github.com/rspeer/wordfreq) data | Dataset permission plus CC BY-SA 4.0 for `wordfreq` data | Selected learner-facing fields and converted them into a compact local lookup layer. |
| Frequency ranking embedded in the core dictionary | [franfranz/Word_Frequency_Lists_ITA](https://github.com/franfranz/Word_Frequency_Lists_ITA), calculated from ItWaC | MIT; retain corpus citation | Used to rank and connect dictionary entries. Raw lists are not included. |

The project-created accent, elision, and conversational-context seed layers are
experimental teaching material assembled with AI assistance and human review.
They are not presented as an authoritative linguistic reference.

Short built-in excerpts from *Pinocchio*, *I promessi sposi*, and *La Divina
Commedia* are public-domain reading samples linked to their Project Gutenberg
editions in `src/books.js`.

See `THIRD-PARTY-NOTICES.txt` for detailed attribution, citations, dependency
versions, copyright notices, and complete production package license texts.
