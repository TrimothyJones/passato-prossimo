# Build Log: Media Provider Contract v2

**Date:** August 18, 2026  
**Prototype:** 0.5 Media Shell  
**Checkpoint:** YouTube adapter, Step 1

## Why this step came first

The Media Shell already played local MP3 and MP4 files and direct browser-playable media URLs. The next proposed source was YouTube, but adding it immediately would have mixed YouTube-specific behavior into an interface that still understood native browser media events.

We chose to stop and define the shared boundary first. Accuracy and inspectable progress mattered more than implementing the entire adapter at once.

## The decision

Every playback source should behave like a provider. The Media Shell asks a provider to perform actions and listens to one normalized set of responses. It should not need to know whether playback comes from an HTML media element, YouTube, or a future source.

In everyday terms, each source may speak differently behind the scenes, but its provider translates that behavior into the Media Shell's language.

## What changed

Provider Contract v2 now includes:

- Commands for loading, playing, pausing, seeking, volume, playback speed, and fullscreen.
- `ready` and `time` events with normalized timing information.
- A shared playback state vocabulary: `playing`, `paused`, `buffering`, and `ended`.
- Provider-neutral errors with a code and learner-readable message.
- A `surface-interaction` event for clicks on the visible playback surface.
- Capability flags for volume, playback speed, fullscreen, surface interaction, and available rates.
- Cleanup that removes native event listeners when a provider is discarded.

The HTML provider now owns all native HTML media events. The Media Shell consumes only the normalized events above.

## Why capabilities matter

Different playback systems do not always expose the same controls. Instead of scattering source checks through the interface, each provider declares what it can do. The shell can quietly disable an unsupported control while keeping the rest of the experience stable.

This is especially useful for YouTube because an embedded YouTube player has different rules and technical limits from a local video element.

## What we proved

The automated contract test verifies:

- Commands still reach the existing HTML media source.
- Native events become the correct normalized events.
- Timing data reaches the shell in one shape.
- All four playback states are distinguishable.
- Errors preserve a code and useful message.
- Capability flags are available before controls are enabled.
- Destroying the provider stops future event delivery.
- Existing Breakdown and URL-import behavior still passes its tests.

## What we did not build

This checkpoint does not parse YouTube URLs, create an iframe, request YouTube metadata or captions, or use a YouTube API credential. Those concerns remain separate so they can be evaluated one at a time.

## Code map

- `app.js`, `createHtmlMediaProvider`: translates native media behavior into Provider Contract v2.
- `app.js`, `renderMediaShell`: subscribes to normalized provider events and reads capability flags.
- `tools/test-media-shell.js`: simulates native media events and verifies the provider contract and cleanup.
- `docs/youtube-adapter-roadmap.md`: records the remaining adapter checkpoints.

## Collaboration record

The project owner chose the source-neutral Media Shell direction, requested a careful step-by-step build, and set the checkpoint requirement before YouTube work continued. Codex implemented the contract, moved event translation into the provider, added automated checks, and documented the resulting architecture. The behavior was reviewed as a shared product and engineering decision rather than presented as unaided manual coding.

## Next checkpoint

Step 2 was subsequently completed as a pure parser. It recognizes common single-video YouTube URL formats and reduces them to a validated video ID without creating a player, making a network request, or adding transcript behavior.
