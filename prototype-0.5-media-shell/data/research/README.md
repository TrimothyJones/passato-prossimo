# reader.dict trial data attribution

`verbs-001-review.json` and `verbs-002-review.json` hold AI-assisted default-gloss
proposals and explicit holds, separately from their source batches. Adapted
dictionary wording credits reader.dict and Wiktionary contributors under
CC BY-SA 4.0. Each proposal cites its source sense IDs and batch hash. These
records track human wording acceptance separately from the initial AI proposals.
Batch 001 now authorizes 49 glosses and accepted explanations for local Word Lens.
The dedicated `build:reviewed-verbs` export checks approval content hashes and keeps
secondary source senses unreviewed. The generic `eligibleForExport: false` flag
continues to block blanket source approval; register and confidence are not upgraded.
Batch 002 now contributes 49 approved glosses and one grouped entry (militare). Both batches are exported locally with their required notes; no sentence-specific selection is implied. Validate with `npm run test:verb-reviews`; render the two review
reports with `node tools/check-verb-reviews.js --write`.

`verbs-001-source.json` and `verbs-002-source.json` each contain 50 unchanged HTML headword entries selected from
the user-supplied reader.dict IT–EN archive. `verbs-001.json` and `verbs-002.json` are review-only
adaptation: verb senses extracted as plain text, nested details and other sections
retained, alias targets listed separately. Credit: reader.dict and Wiktionary
contributors; the copied/adapted archive content is CC BY-SA 4.0 as linked below.
The files record the source snapshot hash and section/item locators. They are not
loaded by the application. Existing core/learner/overflow glosses included for
comparison retain their original provider provenance and terms.

`reader-dict-it-en-sample.json` also contains the unchanged HTML for the three
IT–EN lookups di, fare, tempo and their separate alias candidates, from the
user-supplied `dict-it-en.zip`. Its hash and snapshot date are in the JSON.
Credit: reader.dict and Wiktionary contributors. This copied subset and its
adaptation `../reader-dict-en-trial.json` carry the same CC BY-SA 4.0 license
linked below. Changes: plain-text conversion, selected grammatical sections,
separate aliases and excluded sections, and nested details kept with their
parent. No translation, cross-language alignment, or learner review was added.
The full archive is not part of the trial export. Upstream revision URLs and
sense IDs were not supplied; snapshot-local locators are not stable update IDs.

`reader-dict-it-sample.json` contains three unchanged HTML entries selected from
[reader.dict's Italian StarDict archive](https://www.reader-dict.com/file/it/dict-it-it.zip).
Credit: reader.dict and Wiktionary contributors. Archive SHA-256 and date are in
the JSON. The source is [Italian Wiktionary](https://it.wiktionary.org/).

The copied dictionary content and the adapted data in `../reader-dict-trial.json`
are distributed under [Creative Commons Attribution-ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/),
consistent with [reader.dict's licensing statement](https://www.reader-dict.com/legal-mentions).
Changes: a subset of di, fare, tempo; the generated trial separates grammatical
definition lists from synonyms and converts HTML into plain text. English
translations and cross-language sense mappings have not been added. Attribution
does not imply endorsement. The license applies to this dictionary data, not a
relicensing declaration for unrelated application files.

Entry references: [di](https://it.wiktionary.org/wiki/di),
[fare](https://it.wiktionary.org/wiki/fare), [tempo](https://it.wiktionary.org/wiki/tempo).
These are current headword links, not claims of the exact revision used in the
archive. The archive hash identifies the inspected snapshot; the export did not
supply stable upstream sense IDs or revision URLs.

`verbs-001-passages.json` contains diagnostic passages, separately labeled as
original constructed text or short attributed external excerpts. It is not a
lexical provider and carries no blanket dictionary-data license or human approval.
See `../../docs/verb-batch-001-passage-check.md` for findings and limitations.
`ribellare-form-check.json` preserves two direct archive entries and their parsed
sections to verify the pronominal distinction. Archive text credits reader.dict
and Wiktionary contributors under CC BY-SA 4.0; it is not a runtime export.

Standing review policy: [labeled meanings and grammatical uses](../../docs/lexical-review-workflow.md).
Apply it to future reviews; approval of a grouped treatment does not enable the
current single-verb-default exporter for that word.

### Sposare supplemental sense — 2026-10-20

Wikizionario contributors, “sposare”, Italian transitive sense 2:
https://it.wiktionary.org/w/index.php?title=sposare&oldid=3581697
History: https://it.wiktionary.org/w/index.php?title=sposare&action=history
CC BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0/
Changes: one Italian sense extracted, English learner paraphrase and grouping.
The adapted dictionary data remains CC BY-SA 4.0. No endorsement is implied.
See sposare-supplement.json. Original reader.dict senses are unchanged;
Treccani was a cross-check, not the redistributed source for this addition.
