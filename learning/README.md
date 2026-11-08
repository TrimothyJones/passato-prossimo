# Learning store — Step 1

Integrated 2026-11-08 from the user-supplied learning-store implementation and tests.

## Behavior

Word Lens, Teacher word view, and explicit Teacher inspector selections record encounters. Opening a whole sentence does not count every word. Known/shaky/unknown buttons record self-assessments; the interface changes only after the database transaction commits. Practice answers do not automatically change knowledge ratings.

The IndexedDB database passato-prossimo-learning (version 1) contains words, encounters, reviews, and migration metadata. Word keys use Italian lowercase and NFC normalization; accents remain significant. Encounter records retain selected token, book identifier, section/sentence indices, source, and lemma-method provenance. Existing heuristic lemma selection remains a limitation, not proof of linguistic identity.

statusSource distinguishes unassessed encounters, legacy ratings, and self-assessments. An unassessed row's default unknown status is not loaded into the learner model. Numeric confidence reflects the existing self-report mapping, not measured mastery or lexical confidence.

## Compatibility and boundaries

The stored prototype03LemmaModel migrates once, without overwriting existing database records or inventing encounters/reviews. Seed defaults are not migrated as user ratings. The legacy data remains and committed ratings are mirrored for compatibility. Saved practice sentences remain in their existing separate collection.

Storage failures surface a status message and preserve the previous rating. Data remains local to the browser origin/profile: desktop, different ports, and other devices do not automatically share it. Other tabs see rating changes after reload; this is not a live sync system. Clearing browser storage removes history.

Export learning history downloads a personal JSON snapshot, including tokens and book identifiers. It is separate from the sanitized testing report. Export is not yet an import/restore or synchronization feature.

## Verification

- npm run test:learning — supplied normalization and unavailable-storage tests.
- npm run test:learning:browser — real Electron IndexedDB in a fresh temporary profile: migration, idempotence, accented keys, encounter timestamps, self-assessment history, concurrent transactions, export consistency, reopen persistence, transaction rollback, desktop/Teacher integration, failure messaging, saved-practice preservation, and mobile loading.
- npm test — full application regression suite, including the supplied tests.

The browser test may require execution outside the Windows sandbox so Electron can start its subprocesses. It does not use the user's application profile. Step 2, adaptive teaching, deployment, and automatic mastery inference are outside this change.
