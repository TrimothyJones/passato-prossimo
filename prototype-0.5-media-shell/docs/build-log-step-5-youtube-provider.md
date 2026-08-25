# Build Log: Official YouTube Provider

**Date:** August 23, 2026  
**Prototype:** 0.5 Media Shell  
**Checkpoint:** YouTube adapter, Step 5

## Question

Can the official YouTube embedded player behave like the existing local-media provider without taking ownership of Media Shell's interface?

## Decision

The official YouTube IFrame Player API is wrapped in a `youtube-iframe-v1` implementation of Provider Contract v2. The iframe is created only after the learner selects **Activate YouTube player** from a validated resting object.

No second media interface is introduced. The YouTube provider occupies the same 16:9 stage used by local audio and video.

## Provider translation

The adapter translates:

- IFrame `onReady` into provider `ready`.
- Player state values into playing, paused, buffering, and ended.
- A local 250-millisecond clock into normalized time updates.
- YouTube player errors into the Step 3 error vocabulary.
- Autoplay blocking into an understandable direct-click message.

Media Shell sends the same play, pause, seek, volume, playback-rate, and fullscreen commands it sends to HTML media. It does not inspect `YT.Player` directly.

## Interface and policy boundary

YouTube's native controls and branding remain visible and interactive. Passato Prossimo does not cover settings, ads, captions, playback controls, or attribution. The custom bubble toolbar remains outside the iframe.

Clicks inside the cross-origin iframe are owned by YouTube, so the provider reports `surfaceInteraction: false`. The native player still responds normally to direct clicks.

## Resource lifecycle

- The IFrame API script is loaded at most once.
- The iframe does not exist while the object is resting.
- Returning to rest pauses and destroys the player.
- The timing interval is cleared when the provider is destroyed.
- Leaving Media Shell destroys the provider before rendering the shelf.
- Switching back to local media creates a fresh HTML provider.

## Transcript boundary

Prototype 0.5 continues to create five visibly labeled mock cues from the reported duration. They test synchronization only and do not represent the video's speech. Caption retrieval, imported subtitles, and generated transcripts remain Step 6 concerns.

## Automated evidence

A simulated `YT.Player` verifies:

- Provider identity, contract version, and capabilities.
- IFrame configuration and desktop identity parameter.
- Ready, time, state, error, and autoplay-blocked events.
- Clamped seek, volume conversion, playback speed, fullscreen, and video loading.
- Error 153 translation.
- Stop, destroy, and clock cleanup.
- Continued local-media, Breakdown, and URL Door behavior.

## Live validation checklist

1. Restart the Electron desktop app so the Step 3 request hook is active.
2. Open Media Shell and paste a public YouTube video link.
3. Confirm the resting thumbnail appears before any player.
4. Select **Activate YouTube player**.
5. Confirm native YouTube controls and branding appear inside the media stage.
6. Test play, pause, seek, volume, speed, fullscreen, and the mock cue jumps.
7. Select **Rest media** and confirm the thumbnail returns and playback stops.
8. Re-activate the video to prove the iframe can be rebuilt.

If the status reports the identity message associated with error 153, the provider is working but the development app identity is not being accepted. That result should be recorded before changing the packaging strategy.

## Status

Implementation and automated contract verification are complete. Live YouTube and desktop-identity validation are pending.

Official references:

- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
- [YouTube embedded player requirements](https://developers.google.com/youtube/terms/required-minimum-functionality)
- [YouTube developer policy guidance](https://developers.google.com/youtube/terms/developer-policies-guide)
