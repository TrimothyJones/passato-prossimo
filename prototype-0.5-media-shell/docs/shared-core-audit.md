# Shared Core Audit

Date: 2026-09-19

## Goal

Keep the working Windows desktop alpha while preparing one shared application core
for a desktop interface and a mobile interface. This phase does not add product
features. It separates responsibilities so the two versions can reuse the same
reading and Italian-language behavior.

## Current Result

The project is closer to a shared core than its folder structure suggests.

- The active interface is ordinary HTML, CSS, and browser JavaScript.
- The Italian dictionary, frequency, accent, elision, context, lemma, emotion,
  Breakdown, and teacher-simulation layers run in the renderer without Node.js.
- Reader preferences, reading positions, learner state, and teacher notes already
  use browser storage.
- Browser speech synthesis, local audio/video object URLs, and the YouTube iframe
  provider are web technologies rather than Electron-only features.
- The lenses already switch to bottom-sheet positioning below 760 pixels, and
  several layouts already have mobile media queries.
- A browser-only URL preview and local-storage shelf already exist as fallbacks.

The main obstacle is not the language engine. It is that reusable logic, UI
rendering, storage decisions, and desktop bridge calls currently live together in
one large `app.js` file.

## Reusable Today

These responsibilities can become shared modules with little or no platform
specific behavior:

1. Italian text normalization and tokenization.
2. Sentence boundaries and visible-section analysis.
3. Lemma resolution and confidence clues.
4. Dictionary, learner, frequency, accent, elision, and context lookups.
5. Lexical coverage and friction summaries.
6. Sentence emotion estimates.
7. Breakdown request construction and local provider responses.
8. Section chunking for browser-resident text.
9. YouTube URL parsing and media-provider contracts.
10. Reader settings and reading-position data shapes.

The compact language resources are also browser-readable. They currently attach
arrays to `window`, so they are portable but not yet clean modules.

## Desktop Responsibilities

Electron currently supplies the capabilities that a normal web page cannot safely
or consistently provide:

- Native TXT and EPUB file selection.
- EPUB extraction and safety limits.
- Large imported-book storage on disk.
- Loading one stored book section at a time.
- URL fetching and article extraction without ordinary browser CORS restrictions.
- Sanitized testing-report export through a native save dialog.
- Opening external links through the operating system.
- Windows application lifecycle, context menus, packaging, and YouTube embed
  request identity.

These should remain available through a desktop adapter instead of being called
directly by the shared reader.

## Mobile Responsibilities

The first mobile web adapter will need to provide equivalent contracts using web
capabilities where possible:

- IndexedDB for books, sections, learner state, and reading positions.
- The browser file picker for TXT and EPUB input.
- A browser-compatible EPUB parser or a deliberately limited TXT-first importer.
- Web Share and ordinary external links.
- Downloadable report files instead of a native save dialog.
- Browser speech synthesis and mobile media playback with capability checks.
- A clear message when an article blocks browser-side URL extraction.

URL import cannot be guaranteed from a mobile-only web page because many sites do
not permit cross-origin browser requests. A future trusted service, native mobile
bridge, or share-extension route can provide broader article importing. That is a
platform capability decision, not a language-engine problem.

## Proposed Boundary

```text
Shared core
  language/
    normalize, tokenize, sentences, lemma, providers, breakdown
  reading/
    sections, progress shapes, analysis orchestration
  media/
    provider contract, YouTube parsing, transcript timing
  contracts/
    library, storage, import, links, reports, speech

Desktop adapter
  Electron IPC, disk storage, EPUB extraction, unrestricted URL fetch,
  native dialogs, Windows packaging

Mobile web adapter
  IndexedDB, browser file input, browser speech/media, downloads,
  installable web-app lifecycle

Interfaces
  desktop workspace
  mobile reader
```

The interfaces should ask a platform object for capabilities instead of checking
`window.immersion` throughout the application. For example, both platforms should
offer a `library.loadBooks()` operation even though desktop reads disk files and
mobile reads IndexedDB.

## Extraction Order

1. Freeze the current desktop behavior with baseline tests.
2. Introduce a small platform contract that wraps the existing Electron bridge and
   the existing browser fallbacks without changing visible behavior.
3. Extract pure language analysis from `app.js` and test it directly.
4. Extract reading-section and progress logic.
5. Move browser persistence from scattered `localStorage` calls behind a storage
   adapter; keep `localStorage` as the first implementation.
6. Create a separate mobile entry page that consumes the same core and adapter.
7. Test the mobile page on the iPhone over the local network.
8. Replace temporary mobile storage/import implementations only where real testing
   shows a limitation.

Each step leaves the Windows alpha runnable. A mobile failure must not require a
desktop rollback.

## Existing Strengths To Preserve

- Visible-section-only analysis keeps large books responsive.
- Breakdown appears on demand rather than making every page a dashboard.
- User reading material remains local by default.
- The desktop URL importer validates remote addresses and limits response sizes.
- EPUB extraction includes path and archive-size protections.
- The media shell already uses a provider contract.
- The mobile lens bottom-sheet behavior is already conceptually correct.

## Risks Found

1. `app.js` mixes domain logic, state, rendering, and platform access. Editing it
   during extraction has a wide regression surface.
2. Current tests exercise important pure functions but do not render a real desktop
   or mobile browser workflow.
3. Browser URL import will fail on sites with restrictive CORS policies.
4. `localStorage` is too small and synchronous for a real mobile book library.
5. Mobile Safari speech, fullscreen, background audio, storage eviction, and file
   handling must be tested on a real iPhone rather than inferred from desktop
   responsive mode.
6. The current responsive CSS makes the existing screen fit, but it is not yet a
   purpose-built mobile reading flow.
7. The full development workspace is not currently a Git repository. The public
   source release is a recovery snapshot, but shared-core refactoring should begin
   only after the working source is protected by local version history.

## First Implementation Step

Protect the working development source with local version history. Then add a
platform adapter in front of the current Electron bridge and browser fallbacks and
update one narrow vertical path to use it: loading the library and opening a
built-in book. This proves the boundary without changing imports, Breakdown,
media, or the visual design.

## Verification Baseline

On 2026-09-19, the existing automated test command passed for:

- HTML media and YouTube provider behavior.
- Breakdown phrases, emotion cues, and teacher simulation.
- URL extraction and section loading helpers.

Real-device mobile behavior has not yet been tested in this phase.
