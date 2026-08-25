# Prototype 0.3 - Assisted Reader

This prototype merges the reader loop from 0.1 with the lexical coverage and dictionary work from 0.2.

The intended loop is:

1. Choose a book.
2. Open a section.
3. Analyze only the visible passage.
4. Show a quiet compatibility estimate.
5. Keep potential friction words available when needed.
6. Let Word Lens interactions refine later estimates.
7. Let Emoji Lens offer sentence-level emotional intent when useful.
8. Continue reading.

## Audio Reader

The first audio-reader layer uses Italian voices available through the operating system and browser speech interface. It reads one analyzed sentence at a time, follows the current sentence with a quiet highlight, and provides voice, speed, pause, and stop controls. Selecting a sentence while audio is idle sets the next reading position.

Reading places are stored locally per book. Reopening a book restores its section and sentence for both visual reading and audio playback.

The current interface consolidates Previous, Next, direct page selection, audio, place saving, voice and speed selection, and typography controls into one bottom command bar so the two Lenses retain their surrounding space.

## URL Import

Public HTML and plain-text URLs can enter the same local reading pipeline as EPUB and TXT books. The desktop importer extracts article-like content, removes common page furniture, records the source, estimates whether the text looks Italian, and saves it locally. The browser-only path attempts the same workflow where website CORS policy permits it.

See `docs/url-import.md` for security boundaries, expected website limitations, and the future transcript-provider connection.

This is an audio orchestration layer, not a custom TTS model. See `docs/audio-reader.md` for its local boundary, design reasoning, and future provider path.

## How To Open

Open `index.html` in a browser for the static prototype.

No server or install step is required.

To import EPUB or TXT books, launch the desktop shell from the project root. The Electron app now opens this prototype and exposes the native importer.

For quick importer checks without using the file picker, run:

```bash
node tools/diagnose-import-samples.js path/to/book.txt path/to/book.epub
```

To rebuild the PAISA frequency layer after replacing `lemma-frequencies-paisa.txt.gz`, run:

```bash
node prototype-0.3-assisted-reader/tools/build-paisa-frequency.js
```

To rebuild the learner enrichment layer from `prototype-0.2-lexical-coverage/data/FQ List.json`, run:

```bash
node prototype-0.3-assisted-reader/tools/build-learner-enrichment.js
```

To rebuild the compact overflow dictionary from `prototype-0.2-lexical-coverage/data/dictionary_sorted.json`, run:

```bash
node prototype-0.3-assisted-reader/tools/build-dictionary-overflow.js
```

To rebuild the context marker layer from a pasted marker JSON file, run:

```bash
node prototype-0.3-assisted-reader/tools/build-context-markers.js
```

To rebuild the accent-sensitive rule layer from a pasted accent rule file, run:

```bash
node prototype-0.3-assisted-reader/tools/build-accent-rules.js
```

## What It Reuses

- Built-in book samples from `src/books.js`.
- EPUB/TXT importing and section loading from the 0.1 desktop shell.
- Seed frequency list from `prototype-0.2-lexical-coverage/lexicon.js`.
- PAISA lemma frequency layer from `paisa-frequency.js`.
- Learner-friendly FQ enrichment from `learner-enrichment.js`.
- Compact local overflow definitions from `dictionary-overflow.js`.
- Pragmatic/context marker notes from `context-markers.js`.
- Accent-sensitive form rules from `accent-rules.js`.
- Italian elision and contraction rules from `elision-rules.js`.
- Generated core dictionary from `prototype-0.2-lexical-coverage/core-dictionary.js`.

Note: the PAISA frequency source is marked Creative Commons Attribution-NonCommercial-ShareAlike 3.0. Keep that in mind before any public or commercial release.
The FQ, overflow dictionary, context marker, and accent rule layers are also prototype data layers until their upstream provenance and release licenses are verified.

## Prototype Intent

This is intentionally not a dashboard. The reader surface leads; the compatibility estimate and Word Lens stay quiet until useful.
Emoji Lens follows the same rule: it is a sentence-level emotional-context aid, not a replacement for reading tone, genre, or wider passage context.

## Word Lens Provider Door

Word Lens now has a small local provider shape:

```js
{
  id: "local-context",
  label: "Local context layer",
  getNotes(row, sources) {
    return [];
  }
}
```

The first providers power context marker notes, accent-sensitive notes, and elision/contraction explanations. They split literal meaning from conversation job, separate accent changes from loose lookup, and expose forms such as `dell'amico` as grammar plus a content lemma. Future providers can use the same door for transcript notes, clickable subtitle context, translation, or AI-assisted explanations without making Word Lens depend on live APIs first.

## Emoji Lens

Emoji Lens is a first local pass at sentence-level emotional context. It uses small rule-based cues such as `che schifo`, `ma dai`, `che bello`, `basta`, `boh`, `vabbè`, questions, exclamation marks, and intensifiers to suggest a likely emotional signal with an emoji. It is intentionally labeled as an estimate, because intent depends on wider context and tone.

## Dual-Lens Layout

- Word Lens opens from word clicks and floats to the right of the reader on desktop.
- Emoji Lens opens from sentence clicks and floats to the left of the reader on desktop.
- Both lenses can stay open at the same time and follow their selected text while the page scrolls.
- On narrow screens, each lens falls back to a bottom-sheet style panel.

See `docs/lens-system.md` for the working notes on lens behavior, design rules, and future provider layers.

## Visual Direction

The first 0.3 refinements introduce the `Passato Prossimo` visual direction: retro studyware, pixel arches, pastel highway signage, marble-by-the-sea colors, and a quiet reader surface around the more expressive Word Lens.
