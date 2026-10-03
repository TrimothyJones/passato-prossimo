# Reviewed batches in Word Lens

Local integration updated 2026-10-03: 99 exact headwords from two reviewed batches.
Batch 001 contributes 49 glosses; batch 002 contributes 49 glosses and militare's
three grammatical groups. Ribellare remains excluded pending its form mapping.

All approved notes and distinctions are included, including cercare, ricordare,
stare, porre, prevedere, comporre, svolgere, registrare, giocare, occupare, sentire.
Militare shows adjective, noun and verb meanings together with no automatic
selection. Other entries explicitly say “Verb meaning”; their general gloss is
not presented as an inferred sentence translation. This clarifies scope but does
not solve the known potere noun/verb matching limitation.

Original source senses, legacy meanings/examples, grammatical sections, aliases,
licenses, hashes and review metadata remain available. No source senses are
rewritten or blanket-approved. Grouped meanings carry individual definition
language, source references, license, confidence, register and review status.

Both desktop and mobile load the shared data and renderer. Cache v4 refreshes the
mobile bundle. Exact case-insensitive NFC surface matching remains unchanged:
conjugations, clitics and ambiguous context receive no new inferred mappings.
Missing provider scripts preserve legacy fallback. Breakdown and Emoji Lens
remain unchanged. The older three-word trial still handles di and tempo.

Rebuild: `npm run build:reviewed-verbs`.
Checks: `npm run test:reviewed-verbs`, `npm test`, and
`node tools/check-verb-reviews.js --write`.

Tests cover all 99 entries through the actual Word Lens function, all mandatory
notes, three militare sentence contexts, opposite uses of registrare and sentire,
source preservation, stale-review rejection, escaping, fallback, mobile asset
delivery and cache inclusion. Sentence fixtures test display contracts; they do
not establish general contextual understanding. Batch-001 passage diagnostics
remain available, with their known semantic gaps explicitly recorded.

See [context evidence design](word-lens-context-evidence-design.md) for morphology,
syntax, lexical connections, semantic categories and discourse research.
No contextual selector is implemented by that document.

This update is local, not committed, pushed or deployed. Release preparation and
broader modern-passage evaluation remain separate work. Source attribution is in
../data/research/README.md. Unrelated forge.config.js and immersion-hub work must
remain separate from release staging.
