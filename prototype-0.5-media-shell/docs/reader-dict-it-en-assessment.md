# Purchased reader.dict IT–EN: first inspection

Date: 2026-09-25. Scope: read the supplied archive and inspect the original 15
target headwords, including matching alias records. No production import or
approved foundation changes. The user's archive and immersion-hub files were
read only. Only `dict-it-en.zip` was found among dictionary archives in the named
folder during this inspection; no assumptions are made about other downloads.

## Snapshot

Source file: `immersion-hub/dict-it-en.zip`.
Archive SHA-256:
`0355bcad784a57f47a0fea4a10ebbe1b09ffc018651de5ae12316cf737124bbf`

| Measurement | Observed value |
| --- | --- |
| Archive size | 12,917,473 bytes |
| Book name | reader.dict IT-EN |
| Internal date | 2026-09-01 |
| Main index records | 217,167 |
| Alias records | 735,997 |
| Sum, also stated in archive description | 953,164 |
| Unique exact lookup strings across both indexes | 806,011 |
| Decompressed definition HTML | 40,163,115 bytes |
| Direct matches for the 15 requested spellings | 15/15 |
| Direct entries containing expected Italian lexical sections | 14/15; una requires further form/alias handling |

The archive's 953,164 figure differs from the 1,065,830 figure the user previously
saw on the website. This is a snapshot observation, not evidence of an incorrect
purchase. Possible product/date/count differences have not been established.
Neither number is a count of distinct, reviewed Italian lemmas or bilingual senses.

Members are `reader.dict-it-en.ifo`, `.idx`, `.dict.dz`, and `.syn`.
The IFO specifies HTML (`sametypesequence=h`). No per-sense source language field,
stable upstream sense identifier, or revision link was found in the inspected
entries. All sampled HTML entries have zero anchor links.

The local cache `tmp/reader-dict-it-en/` contains `inspect.cjs` and `sample.json`;
it is excluded from Git. The script reads the ZIP members in memory, validates
index ranges, decompresses the dictionary, and saves only target matches, including
aliases. It does not extract archive paths to disk, execute dictionary HTML, or
modify the original archive. The sample includes unchanged source HTML alongside
plain text for inspection. These are research artifacts, not an app provider.

## Results by target

The gloss descriptions below summarize the relevant section, not necessarily the
first definition in the entry. Presence is not a complete linguistic review.

| Target | Useful direct-entry evidence | Selection issue |
| --- | --- | --- |
| di | Preposition uses for possession, origin, comparison, topic, material, infinitive and partitive constructions | Roman numeral section comes first; alias also points to dovere |
| il | Article meaning “the” | Roman numeral section precedes article; aliases point to gli and lo |
| in | Prepositional English equivalents and usage note | Obsolete language-code symbol comes first |
| che | Interrogative and relative pronouns, conjunction and determiner uses | Language-code symbol comes first; accented ché is also an alias target |
| un | Article, numeral and literary pronoun uses | Distinguish grammatical roles instead of flattening all to one |
| una | Direct entry contains a language-code symbol and etymology, no article section | Alias targets un' and uno contain related grammatical entries; not a safe direct article result |
| per | Prepositional equivalents and construction note | Language-code symbol comes first |
| con | Accompaniment preposition and contraction usage note | Language-code symbol comes first; com alias has obsolete senses |
| fare | Verb starts with do/make, then many additional constructions and restrictions | Reflexive farsi alias is not interchangeable with fare |
| andare | General motion first, followed by desire/attendance/passive and other uses | andarne and andarsene are separate alias targets |
| vedere | Seeing, looking, meeting, visiting, understanding, and restricted make-sure construction | Keep vedersi alias distinct |
| venire | Coming/arrival first, followed by other senses and labels | General learner default still needs editorial approval |
| grande | Size adjective before additional adjective/adverb/interjection/noun meanings | Multiple noun sections; do not key senses solely by POS ordinal without section identity |
| tempo | Time, historical period, film/show part, weather, music, grammatical tense | Nested synonym commentary is not an independent definition |
| trovare | Finding first, then visiting/contact/discovery/opinion/composition and usage note | Separate synonym/usage sections and trovarsi alias |

This directly addresses several narrow defaults in our current core export.
It also contains the relative-pronoun section missing from the free IT–IT `che`
sample. There is useful grammatical context: construction restrictions, register
labels, auxiliary information, and usage notes. That does not establish complete
example-sentence coverage or a ready-made alignment with the IT–IT archive.

## Important adapter findings

1. **Headword presence can mislead.** una is a direct lookup hit but not a usable
   direct article definition. Report lexical coverage separately from key coverage.
2. **First-match selection is unsafe.** Numerals and language-code symbols share
   records with Italian vocabulary. The inspected HTML does not retain enough
   explicit language identity to assume every section is an Italian lexical sense.
3. **Aliases need relationship evidence.** StarDict aliases map a string to a target
   record index, not a typed morphological relationship. Preserve all candidates
   and their match method; do not let an alias displace a useful exact lexical match.
   Do not infer that every alias is a synonym, inflection, or accent variant.
4. **The IT–IT trial parser cannot simply be reused.** This export has English POS
   labels, repeated POS sections, Usage Note lists, and nested synonym commentary.
   Counting every list item as a definition would be wrong. Unsupported structures
   must remain inspectable rather than silently disappearing.
5. **Usage notes may refer to missing structures.** Some notes refer to combined-form
   tables, but the sampled HTML does not include those tables. Verify upstream before
   promising complete conjugation or contraction support.
6. **Source overlap remains.** This is another Wiktionary-derived export, not an
   independent second lexical authority. Its immediate value is fuller exported
   senses, English wording, and lookup/form handling.

## Recommendation

Proceed with a separate three-word IT–EN comparison for di, fare, tempo, keeping
the existing IT–IT evidence and legacy meanings visible. Implement explicit POS
section parsing and retain source notes. Use una, che/ché, and fare/farsi as
regression cases before extending beyond the trial. Do not automatically pair
IT–IT and IT–EN sense positions: their inventories and ordering differ.

Keep source attribution/license information attached to each adapted record;
the previously recorded reader.dict licensing statement and the user's permission
email remain provenance evidence. No new license interpretation or publication
approval is made in this inspection. New records still need definition language,
source, license, confidence, register, and review status. Machine-extracted content
is unreviewed, even where it looks much more useful than the current default.

## Bounded cleanup trial — 2026-09-25

The comparison page now includes a separate English evidence panel for di, fare,
tempo. It shows 11, 46, and 6 top-level definitions respectively. Only Preposition
is selected for di, Verb/Noun for fare, and Noun for tempo. This is a trial-specific
selection, not a general rule to discard numerals or other parts of speech.

Original HTML is retained in a three-lookup research fixture, including alias
candidates. Usage notes, excluded sections, pronunciation, and etymology remain
inspectable. Nested lists retain their parent context and are labeled source
details: they may contain subdefinitions, examples, or synonym notes. They are
not counted as independent learner senses. Repeated section headings receive
distinct snapshot-local positions. All extracted definitions remain unreviewed,
nonpreferred, with unknown register and unassessed confidence; inline source
labels remain in the text. No source data or production providers were overwritten.

Run `npm run build:reader-trial` and `npm run test:reader-trial` to reproduce and
check the trial. Before broadening it, review una's alias-only article evidence,
che/ché, repeated POS sections, and update behavior. Do not align languages by
array position. A human review should select a learner sense and record its
source locator, reviewer, and decision in the foundation workflow; changed source
snapshots need fresh comparison before reusing that decision.
