# Passato Prossimo public alpha data inventory

Status: first release audit, 2026-08-25

This inventory records what the packaged app contains and what must happen before
the first public alpha. It is an engineering release record, not legal advice.

## Status key

- **Ready**: original project material or public-domain material with a recorded source.
- **Conditional**: redistributable only while following attribution, license, or use conditions.
- **Blocked**: do not place in a public build until provenance and permission are resolved.
- **Decision needed**: the project owner must choose the release policy.

## Bundled language resources

| Packaged resource | Upstream source | Terms or status | Release action |
| --- | --- | --- | --- |
| `core-dictionary.js` | Kaikki Italian data derived from English Wiktionary | **Conditional.** Wiktionary entry text is CC BY-SA 4.0 and GFDL. | Attribute Wiktionary, Kaikki, and Wiktextract; identify modifications; include license links and make the transformed dictionary layer available under compatible terms. |
| Core dictionary frequency ranking | `franfranz/Word_Frequency_Lists_ITA`, calculated from ItWaC | **Conditional.** Repository is MIT licensed; underlying corpus should still be cited. | Include repository attribution, MIT notice, and ItWaC citation. |
| `paisa-frequency.js` | PAISÀ lemma frequency list | **Conditional.** CC BY-NC-SA 3.0. | Keep the public alpha noncommercial; attribute PAISÀ; identify the compact transformation; share the derived frequency layer under the same license. Replace or obtain permission before commercial use. |
| `learner-enrichment.js` | Language-Learning-decks Italian dataset | **Conditional.** Publisher says it may be used freely, but its frequency data comes from `wordfreq`, whose data is CC BY-SA 4.0. | Attribute Language-Learning-decks and `wordfreq`; retain CC BY-SA terms for the derived data layer. |
| `dictionary-overflow.js` | `mik3ml/italian-dictionary` on Hugging Face, derived from Wiktionary | **Conditional.** Exact upstream file verified by SHA-256; dataset card specifies CC BY-SA 4.0. | Attribute the dataset author and Wiktionary, link CC BY-SA 4.0, identify definition selection and shortening, and share the transformed layer under compatible terms. |
| `lexicon.js` | Early prototype seed list | **Decision needed.** No external source is recorded. | Confirm it was independently assembled for the project or replace it with a documented source. |
| `context-markers.js` | Project context list assembled with AI assistance | **Ready as project prototype material**, subject to human language review. | Describe it as experimental, project-created data; do not claim linguistic authority. |
| `accent-rules.js` | Project accent rules assembled with AI assistance | **Ready as project prototype material**, subject to human language review. | Describe it as experimental, project-created data. |
| `elision-rules.js` | Project elision rules | **Ready as project prototype material**, subject to human language review. | Describe it as experimental, project-created data. |

## Built-in reading samples

| Work | Source | Status | Release action |
| --- | --- | --- | --- |
| *Pinocchio*, Carlo Collodi | Project Gutenberg ebook 19517 | **Ready.** Public-domain text sample. | Keep title, author, public-domain label, and source link. |
| *I promessi sposi*, Alessandro Manzoni | Project Gutenberg ebook 45334 | **Ready.** Public-domain text sample. | Keep title, author, public-domain label, and source link. |
| *La Divina Commedia*, Dante Alighieri | Project Gutenberg ebook 1012 | **Ready.** Public-domain text sample. | Keep title, author, public-domain label, and source link. |

## Application and platform material

| Component | Status | Release action |
| --- | --- | --- |
| Original Passato Prossimo code and interface | **Decision needed.** Currently marked `UNLICENSED`. | Choose whether the source remains all-rights-reserved or receives an open-source license before publishing source code. |
| Electron and packaged JavaScript dependencies | **Conditional.** Open-source dependencies carry their own notices. | Generate and bundle a third-party software notice from the exact production package versions. |
| YouTube playback | **Conditional.** The app embeds YouTube's official player and does not redistribute video files. | Keep YouTube attribution/player behavior intact and document that videos remain hosted by YouTube. |
| User-imported books, pages, audio, and video | **Ready as user-controlled input.** No imported content is shipped in the installer. | Continue stating that users are responsible for content they choose to import. |

## Raw input fingerprints

These hashes identify the exact local inputs used to generate the current layers.
Raw inputs are excluded from the installer and must not be committed to a public repository.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `kaikki.org-dictionary-Italian.jsonl` | 761,177,438 | `30AF6E8098E20298738AC39E3B8A8369FD9F3E664B4B473950530C4D5F53BE7B` |
| `FQ List.json` | 6,425,819 | `E29CDA1444930CED293A77DF7AED20F52DC49AEE4FAFB340ECEB063252860B9B` |
| `dictionary_sorted.json` | 94,124,871 | `B22AF95B254E52160E30E7270F593D31F002FD9D6839BF855DFE58A6E9E90E56` |
| `lemma-frequencies-paisa.txt.gz` | 9,987,984 | `023A42811BDA618AC75594CCD89818602FE28256C736F3DDA4D7979BD983BF4C` |

## Source links

- Kaikki Italian dictionary: https://kaikki.org/dictionary/Italian/index.html
- English Wiktionary copyright terms: https://en.wiktionary.org/wiki/Wiktionary:Copyrights
- Wiktextract: https://github.com/tatuylonen/wiktextract
- ItWaC-derived frequency lists: https://github.com/franfranz/Word_Frequency_Lists_ITA
- PAISÀ corpus and frequency licensing: https://www.corpusitaliano.it/en/contents/description.html
- Language-Learning-decks attribution: https://github.com/vbvss199/Language-Learning-decks/blob/main/attributions.md
- `wordfreq`: https://github.com/rspeer/wordfreq
- Hugging Face Italian dictionary: https://huggingface.co/datasets/mik3ml/italian-dictionary
- Project Gutenberg: https://www.gutenberg.org/

## Step-two result

The overflow dictionary source is resolved. The local file SHA-256 exactly matches
the Hugging Face dataset file, and the dataset card identifies Wiktionary and CC
BY-SA 4.0. The layer can remain in the public alpha when its attribution, license,
and transformation notice ship with the app. The historical `0.6.0-alpha.0`
installer should not be uploaded because those notices were not bundled. The
notice-bearing public candidate begins at `0.6.0-alpha.1`.

## Step-three result

`THIRD-PARTY-NOTICES.txt` now records the language resources, transformations,
citations, production package versions, copyright notices, and full production
package license texts. The shelf exposes the same core record through a permanent
**Sources & licenses** dialog with safe links to upstream projects and license
terms. The packager includes the notice file and excludes the local `releases`
directory from the application archive.
