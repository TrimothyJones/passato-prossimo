# Step 2 proposal: reviewed Italian foundation meanings

Date: 2026-09-24
Status: design proposal; no lexical entries imported, generated, or approved.
Follow-up: [Experiment 1](./foundation-experiment.md) now implements an isolated
two-word draft comparison; application integration remains proposed.
Baseline: [Italian lexical audit](./italian-lexical-audit-2026-09-24.md), committed in `0907b79`.

## Decision

Add one small, independently versioned foundation provider containing reviewed
senses. It serves both missing function-word meanings and preferred learner senses.
Keep every existing data export unchanged. Select a preferred sense in a shared
lookup result, rather than replacing the core dictionary's `meaning` field.

Start with the eight requested function forms and seven requested common lemmas.
Use readable JSON objects, a deterministic build, and review in Git. No database,
new dependency, generic plugin framework, or bulk source re-import is needed.
This proposal does not claim that its candidate glosses have passed lexical review.

## Architecture inspected

| Component | Current behavior | Consequence for Step 2 |
| --- | --- | --- |
| `prototype-0.5-media-shell/index.html` and `mobile/index.html` | Load the same dictionary/enrichment scripts before the shared `app.js` | A browser-readable provider can serve both platforms |
| `prototype-0.2-lexical-coverage/core-dictionary.js` | Objects with one meaning, POS, example, ranking, and source information | Treat existing objects as immutable source evidence |
| `prototype-0.2-lexical-coverage/tools/import-kaikki-italian.js` | `chooseSense` scores gloss hints, examples, topics, and length, then exports one sense | Improving the score alone cannot preserve or explain multiple senses |
| `prototype-0.3-assisted-reader/learner-enrichment.js` | Tuples containing English translation, paired examples, CEFR, POS, and rank | Adapt fields at lookup time; do not rewrite tuples |
| `prototype-0.3-assisted-reader/dictionary-overflow.js` | Tuples containing Italian definition, heading, and frequency | Explicitly label Italian; presence is not English coverage or reviewed quality |
| Seed and PAISA frequency scripts | Supply recognition and ranking | Do not use frequency as evidence of meaning, confidence, or preferred sense |
| `app.js`: initialization, `learnerInfoFor`, `overflowInfoFor` | Separate maps and lookups; learner/overflow have exact and loose paths | Add a small shared meaning selector, not another UI-specific fallback chain |
| `app.js`: `showWordLens` | Uses core entry meaning when present; learner gloss is separate | Preferred senses must reach the main Meaning field |
| `app.js`: `wordEvidenceForBreakdown` | Prefers learner translation, then entry meaning, then overflow | Unify with Word Lens; stop putting Italian into `englishMeaning` |
| `tools/audit-italian-lexicon.js` | Independently loads data and models form resolution | Eventually consume the same meaning selector to avoid measuring a different policy |

The existing exact-key helper does not normalize Unicode to NFC, and the core map
does not have the learner layer's exact/loose structure. The new provider must use
NFC, lowercase, and canonical apostrophes while retaining accents. Do not claim
the entire existing resolver is accent-safe merely because the new layer is.

The raw Kaikki source retains more senses than the runtime export. An additive
provider preserves currently shipped secondary senses and raw source data; it
does not recover all senses previously omitted by the importer.

## Smallest authoring contract

Proposed authoring location: `prototype-0.5-media-shell/data/italian-foundation.json`.
Proposed generated script: `prototype-0.5-media-shell/italian-foundation.js`, exposing
`window.ITALIAN_FOUNDATION`. Neither file is introduced by this proposal.

Use a versioned envelope and one record per sense. This avoids conflating a lemma,
part of speech, and definition, and allows each sense to be reviewed separately.
These are contract sketches, not approved records or a new TypeScript dependency:

```ts
type Foundation = {
  schemaVersion: 1;
  providerId: "italian-foundation";
  revision: string;                 // release/content revision
  entries: Sense[];
};

type Sense = {
  id: string;                       // stable, unique; never an array index
  headword: string;                 // exact NFC spelling used for lookup
  language: "it";
  pos: "article" | "preposition" | "conjunction" | "pronoun"
     | "verb" | "adjective" | "noun"; // extend explicitly when scope grows
  definition: { text: string; language: "en" };
  usageNote: string | null;         // English, construction/ambiguity limits
  preferred: boolean;              // general learner default, not contextual truth
  source: {
    kind: "original" | "adapted";
    author: string;
    references: {
      locator: string;              // stable URL/revision or repo path + hash
      senseLocator: string;         // upstream ID or unambiguous sense description
      relation: "evidence" | "adapted-from";
    }[];
    attribution: string;
  };
  license: {
    expression: string | null;      // verified SPDX expression or documented LicenseRef
    evidence: string | null;        // permission/terms record with version/date
    status: "pending" | "verified" | "blocked";
  };
  confidence: "unassessed" | "medium" | "high";
  register: "neutral" | "informal" | "formal" | "literary" | "archaic" | "unknown";
  review: {
    status: "draft" | "in-review" | "approved" | "rejected";
    reviewer: string | null;
    reviewedAt: string | null;      // ISO 8601
    note: string;                   // decision and unresolved issues
  };
};
```

All fields are required, including explicit nulls for unresolved draft metadata.
An approved record requires nonempty definition, provenance, attribution, reviewer,
date, and review rationale; verified license evidence; known register; and high
lexical confidence. Confidence describes confidence in the gloss and scope, not a
probability that the sense fits the current sentence. It must remain separate from
the existing numeric lemma-match confidence.

References are required even for original editorial text: record the evidence used
to check it. `original` means the wording was independently authored; it does not
assign a license or establish reuse rights. Record adaptations as adaptations.
The repository's `UNLICENSED` package value and existing dataset notes must not be
silently inherited as permission for new records. Resolve the actual rights and
attribution before approval; this proposal makes no new licensing determination.

Require exactly one approved preferred sense per exact headword and definition
language in a publishable group, across POS. Other approved senses remain available.
A preferred sense must not be chosen by array order, corpus rank, or highest numeric
score. In-progress groups without an approved default remain unpublished. Duplicate
approved defaults are a build error. A change to text, POS, provenance, license,
register, usage note, or preference resets that record to draft and clears sign-off.
Use Git history for earlier reviewed revisions; do not build a second history store.

Keep `un` and `una` as separate headwords in this first set. Do not introduce generic
aliases, accent-stripped identity, preposition contractions, or morphological links
as a side effect. Multiple senses of `che` share its headword but have separate IDs
and POS. A default is a navigation aid, not a claim that every occurrence has that POS.

Examples are optional future work, not a prerequisite for this small provider.
When added, give each Italian/English pair its own source, license, and review
metadata (using the same structures). Do not borrow an existing example for a new
preferred sense without checking that it illustrates that sense.

## First review batch

The text below is editorial direction for human review, not importable data.
All candidates start unassessed. Reviewers must check gloss, grammatical scope,
ambiguity, and provenance before any runtime publication.

| Headword | Candidate learner direction | Required review focus |
| --- | --- | --- |
| di | of; from | Separate possession/relation and origin uses; explain context dependence |
| il | the | Masculine singular definite article; do not imply all English/Italian article uses align |
| in | in; into | Location versus movement; other English equivalents depend on construction |
| che | that (conjunction) as a provisional default | Separately review relative pronoun “who/which/that” and interrogative “what”; no single POS covers all uses |
| un | a/an | Masculine singular indefinite article; distinguish numeral/pronominal uses |
| una | a/an | Feminine singular indefinite article; distinguish “one”; do not collapse into `un` |
| per | for | Separately consider through/by and purpose uses; avoid a universal substitution rule |
| con | with | Accompaniment and instrument uses; review construction limits |

| Headword | Candidate preferred learner direction | Preserve as secondary evidence |
| --- | --- | --- |
| fare | to do; to make | Current time-expression sense; do/make may warrant separate reviewed senses |
| andare | to go | Current regular-attendance sense |
| vedere | to see | Current “make sure” construction, including its restrictions |
| venire | to come | Current passive-voice use and its restriction |
| grande | big; large (adjective) | Current noun sense “greatness, magnificence”; review “great” separately |
| tempo | time | Current musical sense; add weather as a separate reviewed candidate |
| trovare | to find | Current contact/get-hold-of sense; keep reflexive constructions out of this record |

Keep the first batch bounded to these 15 spellings. The number of senses can exceed
15 where distinctions need separate review. Other audit gaps, phrases, and inflected
forms remain separate queues. Do not describe legacy senses as newly approved merely
because they remain accessible.

## Lookup and display contract

Introduce one pure `selectLexicalMeaning({ token, lemma, lemmaMethod })` helper in a
small shared browser script. It returns:

```ts
{
  preferred: SenseView | null,
  alternatives: SenseView[],
  italianDefinitions: SenseView[],
  selectionReason: string
}
// SenseView retains ID, headword, POS, definition language, provider/source,
// license, review, register, confidence, and only sense-compatible examples.
```

1. Respect existing accent/elision disambiguation before applying a general gloss.
   The foundation supports exact token lookup, then a lemma reached by a known exact
   form or accent rule. Do not promote a foundation sense through suffix guesses or
   accent-stripped fallback in this first version. Elided prefixes stay in the
   existing elision explanation; the content word can use its validated lemma.
2. Within an eligible exact headword, select the approved foundation default first.
   Retain every other approved foundation sense and all available core/learner
   meanings as alternatives, each with its own provenance and POS. Preserve
   separate provenance even when two glosses have identical text.
3. If there is no eligible foundation default, use learner English then core English
   as the shared general fallback. This deliberately aligns Word Lens with the
   existing Breakdown preference; it changes Word Lens behavior outside the initial
   15 words and requires a representative fallback regression check.
4. Keep Italian overflow definitions in `italianDefinitions`. If no English meaning
   exists, return `preferred: null` and show “English meaning not available yet,”
   with the Italian definition labeled separately. Never count that fallback as
   English coverage. Keep any contextual explanation visibly distinct from the
   general learner gloss.
5. Render a compact preferred meaning and expandable “Other meanings” with source
   attribution. Both Word Lens and Breakdown consume the same result, including
   teacher evidence, so the old core meaning cannot silently reappear downstream.

Legacy adapters add explicit definition-language labels based on provider role:
learner English and overflow Italian. Core is mostly English according to the audit;
exceptions must remain unknown until identified, not be relabeled merely to raise
coverage. Missing legacy metadata stays unknown/unreviewed. Do not fabricate verified
licenses, high confidence, or neutral register. Source arrays and raw files remain
immutable; adapted views are new objects. A selector's preference never mutates them.

## Review and publication workflow

1. Prepare a small Git diff with a few draft senses from this queue. Inspect the
   underlying source senses and record exact evidence, not just the audit's selected
   gloss. Keep adapted wording and original wording distinguishable.
2. Have a named Italian/English reviewer check meaning, POS, register, scope, and
   ambiguous constructions. Have a human verify the recorded reuse evidence and
   attribution. One qualified person can do both; neither automatic validation nor
   generated prose constitutes approval.
3. Mark each accepted sense approved, with reviewer/date/rationale. Leave unresolved
   records in review or reject them with a reason. Review the default choice across
   the headword's senses, not just the correctness of individual glosses.
4. Validate the entire authoring file, then deterministically export only publishable
   groups and their approved senses. Reject malformed records and conflicting
   defaults. Print included/excluded counts and reasons; draft/rejected records must
   never leak into the shipped provider. Preserve attribution in the runtime export.
5. Review the generated diff alongside the authoring diff and notices. Semantic or
   rights changes require renewed sign-off. Roll back with a versioned provider
   revision; no source-dictionary restoration should be necessary.

## Implementation boundaries and acceptance checks

After this design is accepted, implement the schema validator/build and selector
with synthetic fixtures before authoring the bounded reviewed batch. Proposed
scripts: `validate:foundation` and `build:foundation`. They are not present yet.

Wire the provider and selector before `app.js` in desktop and mobile entry points.
Update `mobile/sw.js` assets/cache revision, `tools/serve-mobile.js` allowlist,
`tools/build-public-source.js`, applicable packaging lists, and attribution/notices
generation. Inspect packaging rules at that time while preserving unrelated edits.

Required evidence for that later implementation:

- Each of the eight function forms gets reviewed English coverage once published;
  each of the seven common words gets the agreed learner default and correct POS.
- Old core/learner meanings remain retrievable, unchanged, as alternatives; raw and
  generated legacy source files have no diff. Do not count unavailable raw senses
  as shipped alternatives.
- Drafts, rejected senses, unresolved rights, empty provenance, unknown register,
  conflicting defaults, and edited approvals cannot publish accidentally.
- NFC and curly-apostrophe inputs work; `e/è`, `da/dà`, and `casino/casinò` remain
  distinct. A suffix guess cannot acquire reviewed-sense confidence.
- Italian-only results stay Italian; Word Lens, Breakdown, and their evidence agree
  on preferred meaning and provenance. General defaults remain distinct from
  contextual interpretations and unrelated legacy examples.
- Provider absence preserves usable legacy lookup; both surfaces use the documented
  English fallback and Italian labeling. Desktop/mobile offline assets load.
- Extend the audit with foundation-only added English coverage, preferred-sense
  replacements (which are not coverage gains), review eligibility, and sense counts.
  Keep the existing baseline report intact and generate a separate comparison.
  Manually check modern sentences for these words alongside the literary samples.
- Run the relevant selector/build fixtures and existing application tests, then
  visually inspect Word Lens and Breakdown on desktop and mobile.

This design uses the committed audit measurements without rerunning its report-
writing command. No coverage gain is claimed until reviewed records are shipped.
