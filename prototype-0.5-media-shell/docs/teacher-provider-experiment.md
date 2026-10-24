# Teacher provider experiment

## Experiment note

> Testing to see if a teacher model can help with context. Fun experiment.

Recorded August 17, 2026.

## Question

Can an optional teacher-shaped explanation add useful context after Breakdown has already assembled local dictionary, lemma, phrase, accent, elision, frequency, learner-history, and tone evidence?

This experiment does not assume that an AI answer is automatically better. It tests whether the additional explanation reduces confusion without replacing inspectable local evidence.

## Current phase: simulation

The active prototype-0.5-media-shell app uses a controlled simulated provider. No external model is connected, no text leaves the computer, and no API costs are incurred. The simulation lets the project test:

- Whether learners understand and use `Ask Italian teacher`.
- Whether a second explanation adds anything beyond Breakdown.
- Whether English plus Italian support is the right response shape.
- Whether provider identity, confidence, and caution are visible enough.
- Whether cached notes remain useful when revisiting the same selection.

The simulated response is explicitly labeled in the interface and must never be presented as AI-generated analysis.

## Request contract

The teacher provider receives only the active selection and compact local evidence:

- Contract version and language pair.
- Selected word or sentence.
- The selected sentence, even for a word request.
- Lemma and local learner status when applicable.
- Local meaning currently available.
- Detected connected phrases.
- Local tone estimate.
- Relevant provider clues.

The request does not contain the whole section, whole book, reading history, book source URL, or unrelated learner data. Dictionary provenance URLs are included.

## Response contract

Every provider response must include:

- Provider ID, label, and kind.
- English explanation.
- Italian explanation.
- One point of focus.
- Confidence wording.
- A limitation or caution.
- Creation time.

Responses are cached locally by provider and request content. Repeating the same request should use the local note instead of making another future paid call.

## Path to a real API

A remote provider should replace the simulated `explain` function without changing Breakdown's interface. Before enabling one, the project must add explicit configuration, request timeouts, safe response validation, cost limits, a visible remote-data notice, and a local fallback.

A first real trial should remain manual and selection-scoped. It should never send an entire imported article or book automatically.

## Observations to record

- What selection triggered the request?
- What was unclear before asking?
- Did the note contribute new context or merely reword Breakdown?
- Was the Italian explanation understandable?
- Did the answer seem too certain?
- Would the learner ask again in a similar situation?

## Shared lexical evidence — October 8, 2026

Request contract version 2 adds localEvidence.lexical. Each item contains the selected token, a lemma candidate (not a confirmed interpretation), and evidence schema version 1. Word requests include one token; sentence requests include only rows from that sentence.

The shared resolver is used by Word Lens and Breakdown. It preserves the complete reviewed entry as a detached JSON record: definition language, grammatical groups, usage/construction notes, annotations, original senses and their review status, source references, license, confidence, register and accepted wording review. General meanings prefer reviewed wording; legacy meanings remain separately labeled fallback evidence. Missing providers and unmatched forms retain the old fallback.

Matching remains exact normalized surface matching. An accepted verb gloss does not confirm that a token is a verb in its sentence. interpretation.status is unresolved; selectedSenseId and selectedPos remain null, including potere and all three militare uses. No inflected or pronominal form mappings were added.

Breakdown exposes reviewed notes and source senses in an expandable guide. Its wording and the word-level simulation no longer claim to have selected a contextual meaning. The simulation still uses the general gloss; interpreting the structured notes, sentence evidence and alternatives is the next step. Response contract remains version 1. Requests and their evidence participate in the existing cache hash, isolating old request versions and changed evidence.

Validation: all 99 reviewed records traverse the actual Breakdown and teacher request functions unchanged; tests cover sentence scoping, legacy precedence, absent providers, held/unmapped forms, detached records, HTML escaping and cache invalidation. These are integration checks, not a contextual interpretation benchmark.

## Reviewed teacher guides — October 8, 2026

The local simulation now consumes the reviewed lexical records to produce lexicalGuides. Word requests lead with the reviewed guide; sentence requests include deduplicated reviewed tokens from the selected sentence. Existing phrase explanations can accompany the guides. Notes, their bilingual examples, English-influence annotations, labeled grammatical alternatives and original unreviewed senses are visible in the teacher response. The teacher does not promote secondary dictionary senses to reviewed learner wording.

Request contract v3 adds lemma-match label/confidence separately from the candidate lemma. Each guide records separate uncertainty for lemma (candidate-only), part of speech (unresolved), construction (not-assessed), and sense (unresolved). A guide uses unresolved response confidence rather than inheriting a tone score. The source confidence shown in details is explicitly not a confidence score for sentence interpretation. No morphology, construction detector, semantic ranking or contextual sense selector was added.

The simulation provider remains local and labeled, with revision 2 included in cache identity. The response contract retains version 1 with additive lexicalGuides and providerRevision fields. Prior cached responses are retained but no longer selected by the revised key.

Regression cases exercise cercare with and without di, stare, both hearing/feeling examples for sentire, noun potere, the three militare uses, realizzare annotations, request immutability, sentence isolation, deduplication, review gating, escaping, and provider-revision cache invalidation. These authored cases check guidance and abstention, not linguistic disambiguation accuracy. All existing project tests pass. Browser visual verification was attempted but blocked by the reported local runtime startup failure.

## Batch 003 connected locally — 2026-10-20

The shared lexical provider now exports 149 exact-headword entries. Batch 003's
50 entries feed Word Lens, Breakdown and the local simulated Teacher. Labeled
sense groups are shown as alternatives, including popolare's verb/adjective
uses. Approved situare/cercare examples and servire/sostituire role notes reach
the Teacher. No contextual sense or POS is automatically selected.

The first 99 retain human-accepted-wording status; batch 003 uses the separate
accepted-editorial-treatment status. Its last 20 source definitions remain
trusted-source-baseline-not-individually-human-verified. Original reader.dict
senses and source sections are unchanged. First-ten implementation labels retain
their source review record rather than being claimed as independently reviewed.

Sposare is resolved by a supplementary Italian Wiktionary sense, revision 3581697,
transitive sense 2, under CC BY-SA 4.0. Its Italian source text, accepted English
paraphrase, attribution, permanent link, license and adaptation notice are saved
in data/research/sposare-supplement.json and displayed in source details. No
Treccani definition is redistributed. Reader.dict's two original senses remain.

The adapter validates batch/proposal/content hashes and an integration manifest
binding every review and the supplementary source. Changed integration inputs
fail the build until intentionally reconciled. Historical corpus trials remain
scoped to their original 99 entries; their coverage numbers are not recomputed.

Validation: npm test; test:reviewed-verbs; test:constructions;
test:constructions:v2; git diff --check. Tests exercise all 149 entries through
the actual Teacher request/simulation, plus targeted rendered notes/groups,
source preservation, escaping, unresolved selection and stale-input rejection.
Browser smoke check confirmed the local Ask Italian teacher flow using cominciare;
new batch-specific rendered guidance was verified in the VM integration tests,
not exhaustively inspected visually. Mobile cache v7 and Teacher revision 3
invalidate stale local results. No external AI call, commit, push or deployment.
