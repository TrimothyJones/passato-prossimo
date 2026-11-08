# Passato Prossimo

Passato Prossimo is an experimental, Italian-first assisted reader exploring one
question: can language support stay close enough to the text to help without
turning every page into a lesson dashboard?

This repository contains the source-visible **0.6 public alpha**. The current
reading loop supports local TXT and EPUB books, article URLs, word and sentence
Breakdown, text-to-speech, local audio/video, early YouTube playback, and manual
export of a sanitized local testing report.

## Streamlined Word Lens

Word selection opens Word Lens by default. The shared study pane switches between
Word Lens and Teacher, with desktop sizing under **Adjust pane**. Meanings appear
first; **Explore this word** preserves usage guidance, source details, and nested
diagnostics. Switching views does not add duplicate encounters. Mobile retains
its sheet layout. This update changes presentation, not morphological analysis.

## Current development checkpoint — 2026-11-08

The web app and source now include the redesigned lab navigation, Teacher/practice
workspace, and local learning history. Word Lens and Teacher record explicit word
encounters and self-assessments without treating a lookup as proof of knowledge.
Existing ratings migrate automatically; saved practice remains intact.

Learning history stays in the current browser/profile. **Export learning history**
produces a personal JSON file containing selected words and book identifiers; this
is separate from the sanitized testing report described below. It is not device
sync or an import/restore feature. See [learning store notes](learning/README.md).

This is a source/web checkpoint toward the next milestone, not a 0.7 release.
The downloadable Windows installer remains the previously published Alpha 3.

## Word Lens update — 0.6.0-alpha.3

Windows and the mobile/web reader now include 149 reviewed learner entries and
19,712 source dictionary entries matched to the existing vocabulary. Reviewed
guidance takes priority. Additional dictionary senses retain their grammatical
groups and attribution; they are not individually reviewed learner explanations.
The Teacher experiment can show the accepted usage guides; it remains a local
simulation and does not select a sentence meaning automatically.

Matching uses exact normalized headwords. Missing or ambiguous source matches
retain the existing lookup. This is not complete inflection coverage.
Mobile loads dictionary chunks on demand and caches opened chunks for offline
use. Desktop includes all chunks locally. Download the Windows alpha from
[Releases](https://github.com/TrimothyJones/passato-prossimo/releases/tag/v0.6.0-alpha.3).

## Alpha Status

This is unfinished research software for noncommercial testing. The installable
web app runs on modern mobile and desktop browsers. A separate unsigned Windows
x64 build remains available and has no automatic updates. Neither version should
be trusted with the only copy of an important file.

Open the official web alpha at
**https://trimothyjones.github.io/passato-prossimo/** and choose **Open the reader**.
The reader is also available directly at **https://trimothyjones.github.io/passato-prossimo/mobile/**.
On iPhone, open the reader in Safari, use **Share**, and choose **Add to Home Screen**. After the first
successful load, the reader shell and locally imported books can reopen offline;
URL imports and online media still require a connection.

Download compiled builds from the repository's **Releases** page. Do not download
an installer copied to an unrelated mirror. The SHA-256 checksum published beside
each release identifies the official artifact.

## Privacy

Interaction events remain local unless the user manually exports a testing
report. Exported reports exclude reading text, book titles, selected words, URLs,
YouTube video IDs, and stable device identifiers. Reports can be opened in a text
editor before sharing.

Books imported in the web app are stored in that browser's IndexedDB storage and
are not uploaded to the Passato Prossimo host. Browser or operating-system storage
cleanup can remove them, so keep the original files.

## Development

Requirements:

- Windows 10 or 11 x64
- Node.js and npm

```powershell
npm install
npm test
npm start
```

Create a local Windows package with:

```powershell
npm run notices
npm run make
```

Raw dictionary dumps and corpora are intentionally excluded. The compact runtime
layers needed by the alpha are included with their licenses and provenance.

## Project Structure

- `prototype-0.5-media-shell/`: active reader, Breakdown, URL Door, and media UI.
- `mobile/`: installable browser entry point, local importer, and offline shell.
- `prototype-0.3-assisted-reader/`: compact language and context layers.
- `prototype-0.2-lexical-coverage/`: core dictionary and lexical seed.
- `src/`: Electron desktop boundary, importer, privacy-safe reporting, and books.
- `tools/`: release notices and focused verification.

## Development Disclosure

The project is directed and tested by its creator and developed collaboratively
with AI coding assistants. The repository documents product decisions, source
provenance, experiments, limitations, and verification rather than claiming that
the creator manually authored every line of code.

## Licensing

The original application source is visible for portfolio review and transparency
but is **not open-source yet**. The temporary alpha license permits personal,
noncommercial use of compiled builds. See `LICENSE`.

Language data and third-party software are excluded from that license and retain
their own terms. See `DATA-LICENSES.md` and `THIRD-PARTY-NOTICES.txt`.

## Feedback

Use the GitHub issue forms for bugs and alpha feedback. Do not paste private or
copyrighted reading material into a public issue. Describing the behavior is enough.
