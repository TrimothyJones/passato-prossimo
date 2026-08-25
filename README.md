# Passato Prossimo

Passato Prossimo is an experimental, Italian-first assisted reader exploring one
question: can language support stay close enough to the text to help without
turning every page into a lesson dashboard?

This repository contains the source-visible **0.6 public alpha**. The current
reading loop supports local TXT and EPUB books, article URLs, word and sentence
Breakdown, Windows text-to-speech, local audio/video, early YouTube playback, and
manual export of a sanitized local testing report.

## Alpha Status

This is unfinished research software, currently available for Windows x64 and
noncommercial testing. It is unsigned, has no automatic updates, and should not
be trusted with the only copy of an important file.

Download compiled builds from the repository's **Releases** page. Do not download
an installer copied to an unrelated mirror. The SHA-256 checksum published beside
each release identifies the official artifact.

## Privacy

Interaction events remain local unless the user manually exports a testing
report. Exported reports exclude reading text, book titles, selected words, URLs,
YouTube video IDs, and stable device identifiers. Reports can be opened in a text
editor before sharing.

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
