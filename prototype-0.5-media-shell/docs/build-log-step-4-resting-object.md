# Build Log: YouTube Resting Object

**Date:** August 23, 2026  
**Prototype:** 0.5 Media Shell  
**Checkpoint:** YouTube adapter, Step 4

## Question

Can a pasted YouTube video become a recognizable, useful media object before the heavier embedded player is created?

## Decision

The existing 16:9 media stage becomes the resting object. This keeps source selection and playback in one stable location and avoids adding a separate preview panel.

The resting object includes:

- A lightweight video thumbnail.
- Provider name.
- Validated video ID.
- Recognized link type.
- Canonical YouTube source URL.
- An **Open on YouTube** action.
- An explicit disconnected-transcript state.

## Honest metadata boundary

Step 4 does not invent a title, channel, duration, language, or caption status. Rich metadata belongs to a later provider backed by an official source such as the YouTube Data API. The current title therefore remains the neutral label `YouTube video`.

The thumbnail uses YouTube's lightweight image host and has a graceful failure state. A missing image does not invalidate the parsed source.

## Resource behavior

No iframe or IFrame Player API script is created. Pasting a link cannot start playback or autoplay. The Activate button remains hidden until the real provider exists.

When the learner switches from a local MP3 or MP4 to a YouTube resting object, the previous HTML media source is paused, detached, and reloaded empty so its decoder is not silently retained.

## Evidence

Automated checks verify:

- Resting-source data is derived only from an already validated parser result.
- The canonical URL and thumbnail URL contain the same validated video ID.
- HTML media unloads cleanly when the source changes.
- Resting thumbnail and attribution controls exist in the interface source.
- Prototype 0.5 contains no iframe markup.
- Existing Media Shell behavior remains covered by the provider contract test.

The local page could not be opened by the automated visual browser because its security policy blocks `file://` navigation. Final layout confirmation is therefore a manual refresh checkpoint rather than an automated claim.

## Next checkpoint

Step 5 creates the official YouTube provider, activates the iframe only on request, translates player events into Provider Contract v2, and tests the desktop identity against live playback.
