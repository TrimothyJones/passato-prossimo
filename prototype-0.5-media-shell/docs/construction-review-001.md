# Construction review 001 and expansion plan — 2026-10-11

The user accepted all six explanations and routing judgments presented in chat.
The record is `../data/research/construction-review-001.json`, bound to sentence
IDs, exact-text hashes, the source snapshot and observed v1 outputs. No source
sentence text is duplicated. This is an explanatory/routing review, separate
from the original sentence editorial batch and publication/attribution checks.
The runner does not yet consume this separate approval record; previous corpus
outputs remain historical and do not reflect this additional review.

| Sentence ID | Target | Accepted judgment | Follow-up |
| --- | --- | --- | --- |
| 1038430 | cercare | Attempt, without guaranteed success | Retain existing rule |
| 612812 | cercare | Seek help; current abstention is a coverage gap | Bounded object expansion |
| 1246711 | potere | Modal use; inability versus permission unresolved | Retain broad label |
| 626879 | potere | Noun meaning power; abstention avoids a wrong verb claim | POS evidence |
| 987588 | riuscire | Desired accomplishment, not achieved success | Preserve outer wish uncertainty |
| 610299 | riuscire | Succeed, activity unstated; confidence is not outcome | Absolute-use candidate |

## Proposed next increment

1. Split review routing more usefully. Record construction support, POS evidence,
   semantic uncertainty and rule coverage independently. Missing implementation
   must not be described as linguistic ambiguity. Preserve the original flags;
   add an explanatory gap category rather than silently relabeling old results.
2. Expand cercare's bounded object evidence starting with aiuto. Add different
   contexts and near-miss cases before generalizing to nouns or semantic classes.
   Object recognition alone must not select a sense for every transitive use;
   idioms and modifiers can change the interpretation.
3. Add a provisional noun-use rule for potere using corroborating local evidence.
   Do not use article + infinitive as sufficient proof: nominalized infinitives
   exist, and the accepted Ha potere assoluto example has no article. Treat this
   as a separately tested POS family, not a modification of its approved verb gloss.
4. Trial absolute riuscire with explicit uncertainty about the unstated activity.
   Sentence-final position alone is insufficient: quotations, ellipsis and clause
   boundaries need contrast cases. Keep outer modality and outcome unresolved.
5. After those families pass sample review, select another small family of
   infinitive complements from the reviewed inventory. Verify each verb's own
   preposition and sense against a primary Italian source before implementation.
   Share token/span/adjacency code; do not assume the same preposition means the
   same thing with every verb.

## Evaluation loop

For each candidate family, collect a small varied set of positives, near misses,
negation/modal contexts and ambiguous uses. Separate development cases from new
review cases, and avoid counting near-duplicate corpus sentences as independent
validation. Report recognized patterns, unresolved senses, abstentions and
incorrect confident labels separately. Coverage growth alone is not success.

Morphology expansion (conjugation, clitics, ambiguous forms) remains a distinct
later increment so changes in form recognition do not obscure rule performance.
No rules have been expanded by this review record or plan. No app behavior changed.
