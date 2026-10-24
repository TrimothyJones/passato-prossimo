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

## Proposed lighter review trial — 2026-10-17

The user proposed trusting source definitions as a working baseline rather than
individually rechecking every unchanged definition. Treat this as the next workflow
experiment, not retroactive human validation of all source senses or authorization
for bulk runtime import. Preserve source attribution, license and original wording.

Focus editorial review on changed learner wording, preferred sense selection,
grammatical grouping, register/archaic labels, source conflicts, teacher explanations
and contextual matching rules. Distinguish source-backed unchanged content from
human-reviewed adaptations. Sample unchanged records for extraction/formatting errors;
expand checks when a sample or source conflict exposes a problem. Do not invent
accuracy or confidence scores. The existing approval/export gate remains unchanged
until the experiment has a concrete implementation.

## Adopted experimental workflow — 2026-10-18

The user confirmed reader.dict as the trusted working definition baseline for
this experiment. Unchanged source definitions no longer need individual user
reconfirmation. Continue background review, but concentrate it on extraction
integrity, relevant distinctions and suspicious cases rather than automatically
re-researching every definition. This supersedes the tentative workflow wording
above; it does not rewrite the historical review records.

Proposed combined flow using existing components:

1. Select existing vocabulary keys with the batch planner and retain source senses,
   grammatical sections, labels, attribution, license and source hashes.
2. Check extraction and sense references automatically. Record unchanged content
   as source-backed, not human-reviewed. Unknown register/confidence stays unknown.
3. Prepare labeled learner alternatives and teacher notes separately. Log AI checks
   as AI checks; do not imply independent human validation or guaranteed correctness.
4. Use the offline construction flagger to gather provisional contextual evidence.
   Keep missing-rule coverage, morphological/POS uncertainty and competing senses
   distinct. A match does not validate a definition or establish sentence meaning.
5. Bring the user a compact exception queue: conflicting sources, misleading default
   choices, consequential grouping decisions, uncertain context and newly authored
   teaching guidance. Routine unchanged definitions need not fill the review table.
6. Spot-check routine cases as well as flagged ones. Evaluate the trial by review
   effort and errors found in fresh samples, not raw routing coverage alone. Retain
   source and rule versions so decisions can be revisited.

The remaining 20 candidates in batch 003 are the next bounded pilot. Existing
planner, source data, review records and flagging tools are available, but the
combined pipeline and new source-backed export handling are not yet implemented.
The current runtime remains unchanged. This workflow agreement is not a claim
that unreviewed entries were individually accepted by the user.
