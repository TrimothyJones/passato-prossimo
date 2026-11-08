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

## Teacher workspace trial — 2026-10-25 (local only)

Teacher is the reader's primary sentence/word-help panel for this experiment.
It groups the existing local simulation, a sentence-scoped Word Lens picker,
Breakdown clues, Emoji Lens tone estimates, and optional original-word recall.
Reviewed entries take priority in the picker; source dictionary chunks load on
request with stale-selection protection and existing guidance on failure.
The practice has no automatic correctness judgment, persistence or score.

The new built-in Una giornata qualunque sample contains six original modern
Italian sentences for comparing everyday constructions. It is trial material,
not corpus evidence or an independently reviewed teaching benchmark.

Existing direct Word Lens and Emoji Lens paths remain available. No new sense
selection, grammatical recognition or translation capability is claimed. No
external model is called. The release version and public deployment are unchanged.

Validation: full npm test suite; real browser checks of the Teacher response,
reviewed picker and source dictionary picker; screenshots at 1280 and 390 pixels.
Local mobile cache revision v9 refreshes the trial assets. Preview: port 4186.

## Simplified Teacher — 2026-10-25 (local only)

The primary panel now has Understand and Practice views. Understand shows the
selected sentence, one existing reviewed usage note (or an explicit fallback
when no checked guide exists), a prominent practice action, and compact word
meanings. This note is general usage guidance, not contextual sense selection.
Full meanings, original alternatives, provenance, tone estimates and the local
simulated response remain under Details & sources.

Practice offers original-word recall with Hint, Reveal and Try again. Switching
to Practice hides the Understand pane; retry clears input and hides hint/answer.
No correctness scoring, learner-data persistence or external AI was introduced.
All exercise/source content is escaped. Mobile cache revision is v10.

Validation: npm test passed; isolated real-browser checks passed for view switching,
hint/reveal/reset, reviewed-word lookup and full source dictionary access.
Desktop 1280px and mobile 390px screenshots inspected. Preview remains port 4186.

## Personal laboratory styling and collection — 2026-10-25 (local)

Adapted the supplied visual reference into the existing Teacher rather than
importing its broken external scripts. Selected sentences have a CSS fluted-column
frame in Passato's brass/olive palette. Word inspection has a dedicated inset card.
Save for practice stores sentence text, book title, source URL and saved date under
passato-practice-collection-v1 in localStorage. Exact duplicate sentences are not
added twice. Practice lists saved sentences, opens their recall exercise and permits
individual removal. No paywall, artificial quota or automatic grading was added.
Storage errors are reported; clearing browser data removes this local collection.
Mobile cache revision v11. Public deployment unchanged.

Validation: app suite passed; isolated browser exercised save, duplicate handling,
reopen, hint/reveal/retry, source lookup and removal. Desktop and mobile screenshots
inspected. Original user files and unrelated workspace changes preserved.

## Reader scrolling and help placement — 2026-10-26 (local)

Replaced horizontal overflow:hidden with overflow:clip on reading/layout containers
to avoid incidental vertical scroll containers. Hidden-browser wheel input over
reading text now moves the document by 350px in the diagnostic, compared with
17px before the change. Teacher/Word Lens desktop placement is raised and height
is constrained above the fixed player controls (verified panel bottom603px,
controls top615px at 1280px width). Compact help sheets start near the top with
independent content scrolling. Mobile cache v13. npm test passed.

Possible future left-side reading insights: coverage, familiar words, and learning
status. No new counts or proficiency claims were added in this layout fix.

## Desktop dock — 2026-10-26 (local)

At widths >=981px Teacher and Word Lens occupy the reserved right-hand rail.
The rail sticks below the reader header; panel content scrolls independently and
its height stops above the player controls. Quiet compatibility/friction cards
are hidden while either help panel is open and return on close. Selected text is
highlighted. Existing compact-width floating/sheet behavior remains available;
mobile sheet behavior is unchanged. Cache revision v14.

Validation: npm test; real browser assertions for Teacher/Word Lens docking,
non-overlap with the page, header/player clearance after document scroll, and
resize back to a mobile sheet. Desktop screenshot inspected. No publication.

## Sphere navigation trial — 2026-10-28 (local)

The library home now introduces three keyboard-accessible destinations: Bookshelf
(warm gold), Media (sea-green), Practice (lavender). CSS gradients and inline SVG
provide the spheres without external image/font/script dependencies. Desktop uses
three columns; compact screens use stacked sphere-and-label rows. Motion respects
prefers-reduced-motion. Counts reflect loaded texts and locally saved sentences.

Bookshelf scrolls/focuses the shelf heading, Media opens the existing media shell,
and Practice opens a dedicated saved-sentence room with the existing recall
exercise, hint/reveal/retry, individual removal, and a reading-sample entry point.
The reader and desktop Teacher dock retain their existing design. No publication.

Validation: npm test passed. Isolated browser checked shelf focus, media route,
practice navigation, saved recall/hint/reveal/reset/remove, and return to the lab.
Screenshots inspected at 1280px and 390px; no mobile horizontal overflow. Cache v15.

## Context laboratory 01 — 2026-10-28 (local)

Practice now includes a controlled contrast: Cerco le chiavi / Cerco di capire.
Switching between two authored situations changes the displayed complement while
holding Cerco constant. Learners can reflect, reveal the written clue, compare
both constructions, or reset. Switching scenes hides the previous explanation;
the scratchpad survives scene switches but is neither stored nor graded.
The accepted cercare guide and original source details remain available.

This pair illustrates a construction contrast, not inference from arbitrary text
or a claim that inserting di alone changes any sentence's meaning. Scenes and
instructional copy are authored trial material; the underlying usage distinction
comes from the existing reviewed guide. Learning effectiveness remains to be tested.
No AI integration, new paywall or public deployment. Cache v16.

Validation: app suite and targeted evidence/markup checks passed. Real-browser
checks covered both scene states, distinct clues, compare/reveal/reset and retained
reflection. Desktop/mobile screenshots inspected; no horizontal phone overflow.

## Translucent bubble refinement — 2026-10-29 (local)

Home destinations now use low-opacity color washes, curved rim highlights and
transparent centers. Each bubble floats vertically over a staggered 7–8 second
cycle; independent scale transitions add a small spring response on hover/press.
The full button hit area stays stationary. Pause floating stops the ambient
animation. Reduced-motion preference disables floating and scale animation.
Cache v17; no deployment. Browser checks passed for pause/resume, emulated reduced
motion, navigation and practice controls; desktop/mobile screenshots inspected.
