# Italian Lexical Stack Audit

Generated: 2026-09-24T12:44:18.954Z

## Executive Summary

The current runtime recognizes **28,769 normalized lexical keys**, but only **17,010** have an English meaning in the core or learner layers. Adding the Italian-only overflow raises definition-bearing coverage to **19,924** keys. Recognition, translation, and explanation coverage are therefore not interchangeable metrics.

The stack is already broad enough to support useful reading, but its next bottleneck is richer and better-aligned meanings rather than frequency data alone. The 25,000-entry PAISA layer recognizes many lemmas that still have no learner-facing English meaning. Core sense selection also needs quality work: a present entry can still choose a narrow or misleading sense.

## Runtime Layers

| Layer | Entries | Primary job | Definition language |
| --- | --- | --- | --- |
| Core Kaikki dictionary | 5,000 | Lemma, meaning, example, POS, ranking | Mostly English |
| Learner enrichment | 16,887 | Translation, paired examples, CEFR/POS | English translation |
| Dictionary overflow | 12,000 | Additional local definitions and POS headings | Italian |
| PAISA frequency | 25,000 | Lemma recognition, rank, corpus count | None |
| Prototype seed frequency | 110 | Very common learner-oriented seed | None |

## Provider Overlap

| Comparison | Shared normalized keys |
| --- | --- |
| Core and learner | 4,855 |
| Core and overflow | 3,672 |
| Learner and overflow | 9,017 |
| English meaning union | 17,010 |
| Any definition union | 19,924 |
| Recognition union including PAISA | 28,769 |

## Coverage By PAISA Frequency Rank

| Top lemmas | English meaning | Any definition | Example | POS | Token-weighted English | Token-weighted any |
| --- | --- | --- | --- | --- | --- | --- |
| 100 | 70 (70.0%) | 92 (92.0%) | 69 (69.0%) | 92 (92.0%) | 32.8% | 93.5% |
| 500 | 431 (86.2%) | 477 (95.4%) | 427 (85.4%) | 477 (95.4%) | 46.6% | 94.3% |
| 1,000 | 880 (88.0%) | 938 (93.8%) | 874 (87.4%) | 938 (93.8%) | 51.6% | 94.1% |
| 5,000 | 4,142 (82.8%) | 4,360 (87.2%) | 4,099 (82.0%) | 4,360 (87.2%) | 58.1% | 92.8% |
| 10,000 | 7,434 (74.3%) | 8,006 (80.1%) | 7,366 (73.7%) | 8,005 (80.0%) | 58.6% | 91.7% |
| 25,000 | 13,241 (53.0%) | 16,155 (64.6%) | 13,142 (52.6%) | 16,152 (64.6%) | 57.8% | 90.1% |

Token-weighted figures use PAISA corpus counts. They estimate how often covered lemmas occur inside the selected frequency layer; they do not measure inflection handling, contextual sense accuracy, proper nouns, phrases, or learner knowledge.

## Built-In Reading Samples

| Sample | Tokens | Recognized | English meaning | Any definition | Example |
| --- | --- | --- | --- | --- | --- |
| Pinocchio | 191 | 156 (81.7%) | 98 (51.3%) | 141 (73.8%) | 97 (50.8%) |
| I promessi sposi | 217 | 174 (80.2%) | 106 (48.8%) | 159 (73.3%) | 102 (47.0%) |
| La Divina Commedia | 124 | 85 (68.5%) | 48 (38.7%) | 79 (63.7%) | 48 (38.7%) |

- **Pinocchio top English-meaning gaps:** di (8, Italian definition only), per (6, Italian definition only), un (6), una (6), che (5, Italian definition only), a (4), il (3, Italian definition only), ma (3, Italian definition only), nella (2, Italian definition only), questo (2, Italian definition only), andasse (1), antonio (1)
- **I promessi sposi top English-meaning gaps:** a (11), di (10, Italian definition only), il (7, Italian definition only), in (5, Italian definition only), che (4, Italian definition only), del (3, Italian definition only), per (3, Italian definition only), questa (3, Italian definition only), tra (3), un (3), una (3), le (2, Italian definition only)
- **La Divina Commedia top English-meaning gaps:** che (6, Italian definition only), i (4), del (3, Italian definition only), di (3, Italian definition only), per (3, Italian definition only), a (2), ben (2, Italian definition only), de (2, Italian definition only), ma (2, Italian definition only), nel (2), abbandonai (1), ahi (1)

These samples are historical literature and intentionally stress archaic forms. They are useful regression material but should not be the only corpus used to judge modern Italian coverage.

## Highest-Ranked English-Meaning Gaps

| PAISA rank | Lemma | Corpus count | Current POS | Italian overflow definition |
| --- | --- | --- | --- | --- |
| 1 | `di` | 16,530,518 | Preposizione | yes |
| 2 | `il` | 15,593,185 | Articolo | yes |
| 3 | `in` | 6,668,420 | Preposizione | yes |
| 5 | `che` | 3,355,882 | Congiunzione | yes |
| 6 | `al` | 3,299,825 | Congiunzione | yes |
| 7 | `da` | 3,255,128 | Suffisso | yes |
| 8 | `un` | 2,443,238 | unknown | no |
| 9 | `per` | 2,426,330 | Preposizione | yes |
| 11 | `una` | 2,074,445 | unknown | no |
| 12 | `con` | 1,829,248 | Preposizione | yes |
| 17 | `questo` | 894,868 | Aggettivo dimostrativo | yes |
| 21 | `ma` | 698,083 | Congiunzione | yes |
| 24 | `ad` | 616,891 | Preposizione | yes |
| 25 | `quello` | 612,027 | Aggettivo dimostrativo | yes |
| 29 | `ed` | 552,814 | Congiunzione | yes |
| 32 | `tra` | 448,821 | unknown | no |
| 33 | `cui` | 436,337 | Pronome | yes |
| 35 | `se` | 414,869 | unknown | no |
| 37 | `d'` | 399,051 | unknown | no |
| 40 | `lo` | 355,355 | Articolo | yes |
| 42 | `ci` | 326,101 | Sostantivo | yes |
| 44 | `loro` | 308,297 | Aggettivo possessivo | yes |
| 51 | `ne` | 250,840 | Pronome | yes |
| 63 | `mentre` | 196,808 | Congiunzione | yes |
| 68 | `italia` | 188,010 | unknown | no |
| 70 | `perche` | 185,701 | Sostantivo | yes |
| 72 | `durante` | 178,729 | Preposizione | yes |
| 78 | `de` | 173,475 | Sostantivo, forma flessa | yes |
| 91 | `senza` | 156,585 | unknown | no |
| 100 | `vi` | 147,677 | unknown | no |
| 113 | `gli` | 136,581 | Articolo | yes |
| 122 | `mi` | 127,278 | Pronome | yes |
| 135 | `fra` | 117,720 | Preposizione | yes |
| 144 | `lui` | 114,004 | Pronome | yes |
| 171 | `chi` | 102,531 | Sostantivo | yes |
| 179 | `roma` | 96,496 | unknown | no |
| 184 | `grazie` | 94,560 | Avverbio | yes |
| 186 | `of` | 94,371 | unknown | no |
| 188 | `sia` | 93,800 | unknown | no |
| 209 | `nostro` | 88,477 | Pronome possessivo | yes |

This is a triage list, not an automatic import queue. It contains names, abbreviations, malformed corpus tokens, and function forms alongside useful lemmas. Each candidate needs lexical and licensing review.

## Data Quality Signals

| Layer | Signal | Count |
| --- | --- | --- |
| Core | Missing meaning | 0 |
| Core | Missing example | 4,304 |
| Core | Missing POS | 0 |
| Core | Meaning looks like an inflected-form cross-reference | 13 |
| Core | Meaning longer than 180 characters | 0 |
| Learner | Missing English translation | 0 |
| Learner | Missing Italian example | 0 |
| Learner | Missing English example | 0 |
| Learner | Missing POS | 1 |
| Combined learner/overflow | Accent-collision groups | 43 |

Accent-sensitive collision examples: `abilità` / `abilita`, `agorà` / `agora`, `bebè` / `bebe`, `calamità` / `calamita`, `capacità` / `capacita`, `casino` / `casinò`, `cliché` / `cliche`, `così` / `cosi`, `coupé` / `coupe`, `disabilità` / `disabilita`, `dopodiché` / `dopodichè`, `elite` / `élite`, `equipe` / `équipe`, `equità` / `equita`, `eredità` / `eredita`, `età` / `eta`, `facilità` / `facilita`, `felicità` / `felicita`, `gala` / `galà`, `gravità` / `gravita`. These must remain separate during lookup; accent-stripped merging would erase meaning contrasts.

## Frequent Core Senses Requiring Review

| PAISA rank | Lemma | Selected core meaning | POS |
| --- | --- | --- | --- |
| 22 | `venire` | to get, be (strictly for passive voice, see usage notes) | verb |
| 23 | `fare` | to do until (a time, typically at night) | verb |
| 31 | `primo` | prime | adjective |
| 41 | `solo` | the only one, the only man | noun |
| 50 | `grande` | greatness, magnificence | noun |
| 56 | `vedere` | to make sure [with di (+ infinitive) ‘to do something’] (otherwise, there will be a negative consequence) | verb |
| 59 | `trovare` | to contact or get hold of (someone) | verb |
| 61 | `tempo` | time, tempo, rhythm, beat, pulse | noun |
| 65 | `ultimo` | recent, current | adjective |
| 67 | `nome` | noun | noun |
| 75 | `gruppo` | pack | noun |
| 76 | `andare` | to attend (school, church regularly) | verb |
| 85 | `diverso` | homosexual, gay | noun |
| 89 | `opera` | opus | noun |
| 90 | `the` | misspelling of tè | noun |

These entries are not necessarily false dictionary senses. The problem is ordering: a valid specialist, secondary, or malformed sense is being presented as the default learner meaning. This list is a small confirmed sample, not a complete quality count.

## Local Source Inventory

| Source | Local size | Current license note |
| --- | --- | --- |
| Kaikki Italian JSONL | 725.9 MB | CC BY-SA / Wiktionary attribution |
| FQ learner list | 6.1 MB | Dataset reuse permission; embedded wordfreq fields CC BY-SA 4.0 |
| mik3ml dictionary | 89.8 MB | CC BY-SA 4.0 |
| PAISA frequencies | 9.5 MB | CC BY-NC-SA 3.0 |
| ItWaC-derived lists | 12.2 MB | MIT list code; retain corpus citation |

The raw local sources total far more material than the runtime exports. Increasing a numeric limit is possible, but it would also enlarge the PWA download and reproduce current sense-selection problems at greater scale. Expansion should go through a compact provider build rather than shipping raw dumps.

## Findings

1. **The frequency layer is ahead of the meaning layer.** PAISA already supplies broad recognition and ranking, so the immediate gain comes from enriching high-frequency gaps with dependable meanings and examples.
2. **Italian and English definitions need explicit roles.** The overflow layer is useful, but the UI currently sometimes treats its Italian definition as though it were an English meaning. Provider records should carry a language field.
3. **Presence is not quality.** The core importer chooses one sense per lemma. Common words can receive a valid but narrow sense, so core entries need multi-sense ranking or a learner-facing preferred-sense layer. Blindly raising the 5,000-entry limit would scale this problem.
4. **Accent preservation is mandatory.** Normalized keys are useful for retrieval, but exact accented forms must win before loose matching.
5. **Literary and modern benchmarks should be separated.** Dante, Manzoni, and Collodi expose historical gaps; a balanced modern test set is needed before judging everyday coverage.
6. **The commercial path has a known constraint.** PAISA is CC BY-NC-SA 3.0. It is suitable for the noncommercial alpha, but a commercial release needs a replaceable frequency provider or separate licensing review.

## Recommended Step 2 Sourcing Targets

- A small reviewed foundation provider for missing function words such as `di`, `il`, `in`, `che`, `un`, `una`, `per`, and `con`.
- English glosses for high-frequency lemmas currently known only by PAISA or Italian overflow.
- Better preferred senses for common polysemous words already present in the core, beginning with the confirmed review table above.
- Provider metadata for definition language, source, license, confidence, register, and whether a meaning is preferred or merely available.
- Natural modern examples with clear reuse rights and source metadata.
- Morphological links for frequent inflected forms that still fall through to surface-form guesses.
- Phrase and collocation data kept separate from single-lemma definitions.
- A commercially replaceable frequency list before monetization decisions become implementation work.

## Audit Boundary

This audit measures local runtime data and the current reader's lightweight form resolver. It does not claim semantic correctness, complete dictionary coverage, or learner comprehension. Automated counts identify where human review and better sources are likely to matter most.
