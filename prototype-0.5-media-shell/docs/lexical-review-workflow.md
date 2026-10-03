# Lexical review workflow

Adopted by the project user on 2026-10-03 during verb batch 002 review.

When a spelling has several grammatical roles or materially different contextual
meanings, present a small set of labeled alternatives. Group them for discovery;
keep the individual source records and senses distinct. Do not flatten noun,
adjective, and verb meanings into a single unlabeled default.

Within one part of speech, label important senses or constructions when a short
combined gloss would mislead. Use a brief note and original examples where useful
(e.g. cercare + object versus cercare di + infinitive). Simple words still use a
concise learner gloss; every source sense need not appear at the top level.

Prefer a contextual reading only when there is sufficient tested evidence. When
uncertain, show the alternatives rather than force a choice. This is the approved
product/review policy, not a claim that runtime context selection is implemented.
Existing single-default entries must be assessed incrementally; the policy does
not retroactively approve new wording or automatically rewrite source data.

Preserve definition language, source and locator, license, confidence, register,
and review status for each sense/group. Distinguish human wording acceptance from
unreviewed secondary senses and from runtime integration. Unknown metadata stays
unknown. Preserve accepted-content hashes and review identity when wording changes.

Militare is the first accepted grammatical grouping: military (adjective), service
member (noun), and serve as a soldier / be active in an organization (verb).
It is now exported as a grouped entry, with all three grammatical uses visible and none automatically selected. Potere's noun/verb mismatch remains a known runtime follow-up.

Batch 002 words 1–50 are reviewed: 49 accepted glosses and one accepted grouped
 treatment (militare). No batch-002 wording reviews remain pending. Ricordare's note and stare's
construction distinctions are accepted. No batch-002 runtime export or public
release is implied by this review milestone.

## Context research direction

User-proposed working idea, 2026-10-03: explore word endings, nearby wording,
sentence structure, and paragraph context as evidence for ranking reviewed
meanings. This is a research hypothesis, not approved matching rules or a claim
of runtime capability. Infer possible readings from the supplied text; do not
invent missing context. Endings alone do not establish part of speech or sense.
Test candidate rules with positive examples, counterexamples, and ambiguous
cases. Show alternatives whenever the evidence cannot distinguish meanings.

Batch-002 integration must include every accepted distinction, especially the
final-ten notes for registrare, giocare, occupare, and sentire. A gloss-only export
would not satisfy the user's conditional approval.

Local integration update: both batches are connected, including the required
notes and militare groups. Context research is expanded in
[word-lens-context-evidence-design.md](word-lens-context-evidence-design.md).
