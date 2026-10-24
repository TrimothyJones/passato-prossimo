# Passato workstack — 2026-10-04

Current direction: shift from lexical review toward the teacher layer.
This snapshot reflects repository code and completed release work, not a new
coverage audit or a claim that contextual interpretation has been implemented.

## Delivered

- Repeatable lexical audit (baseline 2026-09-24); recognition and English meaning
  coverage distinguished. No fresh whole-stack measurement is claimed.
- Two 50-word verb batches reviewed: 99 entries connected to Word Lens;
  ribellare remains excluded pending pronominal form mapping.
- Accepted usage notes, labeled alternatives and grouped militare uses; original
  senses, source references, licensing and review metadata preserved.
- Word Lens web/source release 0.6.0-alpha.2 and public landing page deployed.
  Existing Windows installer was not rebuilt.

## Existing teacher experiment

The active media-shell app contains Ask Italian teacher, a local simulated
provider, a selection-scoped request, English/Italian explanations, a focus point,
confidence/caution wording and a local cache. It does not call an external model.
The older experiment document refers to prototype 0.4; the implementation is also
present in the active prototype-0.5-media-shell/app.js.

## Step 1 completed locally — October 8, 2026

Word Lens and Breakdown now share structured lexical evidence. Teacher request v2 receives reviewed wording, groups, notes, source senses and provenance with explicit unresolved interpretation. All 99 records pass integration tests. Legacy fallback is preserved. Changes are local and unpublished; the simulation now presents reviewed notes and alternatives as usage guides, without selecting a contextual meaning.

## Recommended next sequence

1. Completed locally: share a structured lexical-evidence result across Word Lens, Breakdown and
   the teacher request: reviewed wording, distinct alternatives and constructions,
   source/review metadata, and explicit unresolved interpretation. Preserve
   fallback. Test that old narrow meanings cannot silently win downstream.
2. Completed locally: extend the teacher simulation around that evidence. Separate what the source
   says from what the sentence supports; distinguish lemma, POS, construction and
   sense uncertainty. Keep selected text local and keep the simulation label.
3. Evaluate a small held-out passage set, including potere as a noun, all three
   militare uses, cercare constructions, stare, and hearing/feeling with sentire.
   Existing passage tests validate display plus recorded limitations; they are
   not a completed modern-Italian sense-selection benchmark.
4. Build the first optional practice action from a learner-selected sentence.
   Candidate: choose a supported meaning or notice a construction, with a way to
   defer when evidence is insufficient. This remains a product choice, not an
   implemented exercise.
5. If useful, trial a real teacher provider later. The existing design calls for
   explicit configuration, selection-scoped disclosure, validation, timeouts,
   cost limits and fallback. No provider or API connection is selected here.

## Parallel research, not blockers for all teacher work

Context evidence design covers morphology, syntax, constructions, lexical
connections, semantic categories, sentence scope, discourse and register.
Start with a small inspectable rule and counterexamples; do not claim automatic
sense selection based on a general gloss or lemma confidence.

Broader lemma merging, inflected/pronominal form handling, foundation function
words, additional lexical batches, and wider corpus evaluation remain unfinished.
The small foundation lab is not a completed general function-word provider.

## References

- [Teacher experiment](teacher-provider-experiment.md)
- [Context evidence design](word-lens-context-evidence-design.md)
- [Lexical review workflow](lexical-review-workflow.md)
- [Batch-one passage findings](verb-batch-001-passage-check.md)

Preserve unrelated forge.config.js and immersion-hub changes. This workstack
snapshot has not been published or pushed.

## Current handoff

Step 2 is implemented locally: reviewed teacher usage guides, separate uncertainty fields, sentence-scoped guides and versioned cache identity. Existing tests plus authored guidance/abstention regression cases pass. No publication yet. Browser visual checking remains blocked by the local runtime issue. Next: manually review the guides, then evaluate a separate held-out passage set (step 3) before adding context-selection rules.

## Cercare flagging experiment — October 10, 2026

The four cercare sentences and agreed explanations are human-approved. An offline construction trial now produces provisional sense groups and a separate closer-review queue, preserving editorial status. See [trial report](cercare-pattern-trial.md). The archive run routes 90 of 3,326 exact-token sentences without closer grammatical review and flags 3,236. These are routing counts, not validated accuracy. No app integration or additional editorial approval is implied.


## Full reviewed inventory routing — October 10, 2026

The offline construction trial now takes all 99 live reviewed entries. Seven targets have narrow sourced construction rules; the remaining targets form a separate rule backlog. The corpus run finds 95 exact headwords in 146,413 sentences, with 608 routine provisional occurrences, 5,549 closer-review occurrences and 144,354 rule-backlog occurrences. No lexical or sentence approval changed; no app integration. See [full trial report](reviewed-construction-trial.md).

## First construction sample accepted — October 11, 2026

The user approved six specific explanations and routing judgments for cercare, potere and riuscire. These are recorded separately from sentence publication/editorial approval. See [review and next rule plan](construction-review-001.md). Next: distinguish coverage gaps from ambiguity, then trial bounded object evidence, noun-use evidence and absolute riuscire. No new rules or automatic approvals are implemented by this plan.

## Construction v2 offline trial — October 11, 2026

Added bounded cercare form recognition and three sourced construction families. Same-corpus routing grew from 608 to 1,803 provisional occurrences (718 additional within the original 99, plus 477 for two research-only targets). Twenty examples received AI inspection; a/ad omission fixed. No new human approvals or Teacher integration. See [v2 report](construction-trial-v2.md).

## Verb batch 003 — first ten accepted, October 11, 2026

The first ten words have conditional human acceptance requiring labeled alternatives. Source-linked sense groups are drafted separately; new group labels and contextual selection are not validated by that acceptance. Forty candidates remain. See [batch review](verb-batch-003-review.md).

Verb batch 003 update, October 11: words 11–20 accepted with required grammatical groups for popolare, separate trasferirsi handling and the situare/cercare distinction. Batch progress 20/50; 119 accepted overall, 99 live. No runtime selection or integration change.

October 17: batch 003 words 21–30 accepted, including servire/sostituire teacher notes. Now 30/50 reviewed, 129 accepted overall, 99 live. Next workflow experiment: source definitions as baseline, with review concentrated on learner adaptations and context distinctions; see lexical-review-workflow.md. No bulk approval or runtime change.

October 18: user adopted the lighter review experiment. Reader.dict definitions are the trusted working baseline; routine unchanged definitions need no individual reconfirmation. Background checks, source metadata and sample review remain, with user attention focused on exceptions and teacher/context adaptations. Next pilot: batch 003 remaining 20. Combined pipeline not yet implemented; counts and runtime unchanged.

October 20: final 20 of batch 003 prepared as source-backed baseline, with learner groups and three exceptions recorded separately. Batch preparation complete; editorial exceptions remain. 129 individually accepted, 99 live. See verb-batch-003-final-twenty.md; Teacher integration remains next work.

October 20 completion: all batch 003 learner treatments accepted, including final 20 exceptions. 149 entries with accepted learner treatments overall; 99 live. Next focus: Teacher presentation/integration of labeled alternatives and approved notes, preserving source-backed versus human-reviewed provenance and uncertainty. Resolve recorded sposare export concern during integration.

October 20 integration complete locally: shared provider and simulated Teacher now receive 149 entries, including labeled batch 003 alternatives and approved contrast/role notes. Sposare supplemented from Italian Wiktionary revision 3581697 under CC BY-SA 4.0; original reader.dict source intact. Tests pass; local Teacher UI smoke-tested. No public deployment; contextual selectors remain offline experiments.

October 20: resumable source import pipeline built and fully replay-validated. 29,127 local keys processed in 59 chunks: 19,712 source entries, 2,537 exceptions, 6,878 missing exact matches. Node indexed lookup verifies reviewed precedence. No source-layer app integration yet; see source-lexicon-import.md.
