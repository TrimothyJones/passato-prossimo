# Prototype 0.5: Media Shell

Prototype 0.5 preserves the complete Breakdown reader and adds the first source-neutral media experiment. Local audio/video and direct media URLs can move between resting and active states, use custom playback controls, and synchronize against a small mock Italian transcript.

## Current loop

1. Choose or import a book, text file, EPUB, or supported public URL.
2. Open one readable section.
3. Select a word or sentence.
4. Breakdown composes local dictionary, lemma, frequency, accent, elision, conversational-context, phrase, emotion, and learner-history signals.
5. Read a short English explanation, followed by an Italian explanation and optional evidence.
6. Mark an individual word as known, still learning, or not yet known when useful.

## Media experiment

1. Open Media Shell from the shelf.
2. Choose a local audio/video file or connect a direct browser-playable media URL.
3. Inspect the lightweight resting object.
4. Activate the player.
5. Use the bubble toolbar or media surface to play and pause; seek, change volume or speed, and enter or exit fullscreen.
6. Select a mock transcript cue to jump to its generated timestamp.
7. Rest the media object when it is no longer active.

## Scope

This is a local Italian-first proof of concept. It does not claim perfect translation, parsing, emotional inference, or learner diagnosis. Confidence wording is intentionally visible wherever local rules could be ambiguous.

The language resources generated for Prototype 0.3 remain providers for this version instead of being duplicated. Prototype 0.4 is preserved as the stable Breakdown snapshot.

See [docs/breakdown-system.md](./docs/breakdown-system.md) for the layer design and current limitations.

See [docs/url-door.md](./docs/url-door.md) for the reviewed web-import workflow and its storage boundary.

See [docs/teacher-provider-experiment.md](./docs/teacher-provider-experiment.md) for the simulated teacher socket, privacy boundary, and path toward a real API.

See [docs/media-shell.md](./docs/media-shell.md) for the playback-provider contract, current limits, and path toward a YouTube adapter.

See [docs/build-log-step-1-provider-contract.md](./docs/build-log-step-1-provider-contract.md) for the plain-language decision record, evidence, code map, and collaboration history behind Provider Contract v2.

See [docs/youtube-adapter-roadmap.md](./docs/youtube-adapter-roadmap.md) for the checkpoint sequence. The official YouTube provider is implemented through Step 5 and awaits one live Electron playback check.

See [docs/build-log-step-3-desktop-identity.md](./docs/build-log-step-3-desktop-identity.md) for the WebView identity decision, error map, test evidence, and release limitation.

See [docs/build-log-step-4-resting-object.md](./docs/build-log-step-4-resting-object.md) for the thumbnail, source metadata, attribution, and no-iframe checkpoint.

See [docs/build-log-step-5-youtube-provider.md](./docs/build-log-step-5-youtube-provider.md) for the official player adapter, lifecycle, contract evidence, and live validation checklist.
