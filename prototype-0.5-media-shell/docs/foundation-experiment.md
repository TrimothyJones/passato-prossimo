# Foundation experiment 1

Current extension: [reader.dict three-word trial](./reader-dict-trial.md) adds
Italian evidence for di, fare, and tempo. The description below records the
original two-word foundation experiment; its approval boundary is unchanged.

The browser-readable route is implemented as a separate local comparison page for
`di` and `fare`. It does not modify the main reader, desktop/mobile entry points,
service-worker cache, or legacy dictionaries. No approved lexical entries exist
yet. The authoring file has two explicitly unreviewed, AI-assisted drafts; the
generated runtime provider has zero entries.

A later [1827 dictionary source trial](./dictionary-1827-source-assessment.md)
checks CHE and CON against two scanned pages. It adds source evidence only;
the comparison's draft records and runtime export remain unchanged.

The [reader.dict assessment](./reader-dict-source-assessment.md) inspects all 15
target words in a modern Wiktionary-derived Italian-to-Italian archive. It is a
candidate explanation source, not an English foundation replacement.

This deliberately narrows the [Step 2 proposal](./italian-foundation-provider-step-2.md)
to a reversible trial before application integration or the full 15-word batch.

## Try it

From the repository root:

```sh
npm run foundation:lab
```

Open `http://127.0.0.1:4174`. Choose `di` or `fare`, switch draft preview on/off,
and expand the other meanings and source details. The server binds only to this
computer and serves an explicit list of experiment assets. It does not modify
data or accept edits. Stop it with Ctrl+C.

The left column reproduces Word Lens's existing general-meaning precedence for
these two exact words. It is not a full sentence/context resolver. The right column
shows a draft when enabled; with preview disabled it uses the approved-only
selector. Its English fallback prefers learner over core, so switching preview
off is not the same as reverting to the left column. Italian overflow is shown
separately and never treated as English on the right.

Evaluate whether the short gloss provides a useful starting point, whether the
secondary senses are easy to find, and whether the draft/source labels are clear.
This trial establishes the display and data boundary, not learning effectiveness
or contextual sense accuracy. No telemetry or learner-state writes are added.

## Files and boundaries

| File | Role |
| --- | --- |
| `data/italian-foundation.json` | Two manually authored draft records with explicit metadata placeholders |
| `italian-foundation.js` | Deterministic generated browser provider; approved publishable groups only |
| `lexical-provider.js` | Dependency-free, pure selector exposed to browser and Node tests |
| `foundation-lab.html`, `foundation-lab.js` | Responsive comparison UI; draft preview is a separate display path |
| `../../tools/build-italian-foundation.js` | Validation, content review binding, filtering, deterministic export |
| `../../tools/serve-foundation-lab.js` | Local-only restricted preview server |
| `../../tools/test-italian-foundation.js` | Synthetic review fixtures and behavioral regression tests |

The selector accepts adapted legacy views instead of reaching into source globals.
That makes it replaceable and independently testable. It preserves alternatives
and unknown-language definitions, checks exact NFC keys without stripping accents,
and does not promote guessed lemmas into reviewed senses. Direct exact forms win;
only explicitly trusted lemma methods can supply a lemma fallback. Elision-aware
mapping remains future integration work.

The lab's adapter labels the inspected `fare` core sense English. It does not
claim a language audit of all core entries. Legacy confidence, register, review,
and license verification remain unknown; draft provenance points to editorial
direction, with independent lexical evidence explicitly still outstanding.

## Validation and review

```sh
npm run validate:foundation
npm run build:foundation
npm run test:foundation
npm test
```

Validation enforces the proposed required metadata and allowed values, rejects
duplicate IDs/defaults and incomplete approvals, and excludes nonapproved records.
An approved secondary sense without an approved group default remains unpublished.
The build reports each exclusion. It does not verify the truth of human sign-off
or interpret license terms; a reviewer must establish that evidence.

One addition to the proposal is `review.contentHash`: null for drafts, or a SHA-256
digest of the canonical record excluding `review` at approval. The exported
`contentHash(entry)` function computes it. A reviewer records the digest after
checking the exact content, their name, timestamp, and rationale. Do not treat
computing this hash as approval. Content changes invalidate an old digest and
fail validation until renewed review; reset the record to draft while editing.
This is a change detector, not a signature or proof of reviewer identity.

Current checks cover deterministic browser exports, draft exclusion, stale reviews,
metadata/default failures, source preservation, fallback ordering, Italian-only
results, accent distinctions, guessed forms, and preview-server asset boundaries.
The existing application test suite also passes. Browser checks confirmed both
word choices, preserved `fare` source senses, and preview-off English absence for
`di`; the narrow viewport layout was visually inspected.

## Keep, change, or remove

No reader migration or source rewrite is needed to abandon this trial. Stop the
server and leave the page unused, or remove the experiment's files and npm/public-
source entries in a scoped follow-up. Existing reader behavior is independent.

If the comparison is useful, the next increment is lexical/reuse review for these
two words, followed by a small application integration. Only then add the remaining
review candidates, actual Word Lens/Breakdown wiring, desktop packaging entries,
offline/mobile assets, source notices, and a separate audit comparison. The
committed lexical audit has not been regenerated and no coverage gain is claimed.
