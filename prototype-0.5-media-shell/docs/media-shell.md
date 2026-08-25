# Source-neutral Media Shell

## Experiment question

Can one learner-facing media experience control multiple future playback sources without allowing any source to define the transcript, Breakdown, or workspace interface?

Prototype 0.5 begins with an HTML media provider for local audio/video files and direct browser-playable media URLs. YouTube and other webpage-based media sources are not connected yet.

## Current workflow

1. The learner opens Media Shell from the shelf.
2. Local audio/video is selected through the operating-system file picker, or a direct media URL is connected.
3. The source appears as a resting media object.
4. Activating it enables the player and custom bubble toolbar.
5. Five mock Italian transcript cues are distributed across the video's duration.
6. Playback time highlights the current cue.
7. Selecting a cue seeks through the provider and resumes playback.
8. `Rest media` pauses the source and returns it to the lightweight visual state.
9. Clicking the active media surface toggles play and pause.
10. Fullscreen mode exposes an in-player `Exit fullscreen` control in addition to the operating system's normal Escape behavior.

The mock transcript is intentionally unrelated to the selected video's real audio. It tests timing and interaction only.

## Playback-provider contract v2

The Media Shell controls a provider object instead of directly depending on one video source. Step 1 of the YouTube adapter work upgraded this boundary so commands, events, and optional abilities all pass through the provider.

Provider commands:

- Provider ID and kind.
- Contract version.
- Load source.
- Play and pause.
- Seek to seconds.
- Set volume.
- Set playback rate.
- Read current time and duration.
- Read paused state.
- Request fullscreen.

Normalized provider events:

- `ready`, including duration.
- `time`, including current time and duration.
- `state`: playing, paused, buffering, or ended.
- `error`, including a provider-neutral code and message.
- `surface-interaction`, used when the visible player surface requests a play/pause toggle.

Capability flags tell the shell whether the active provider supports volume, playback rate, fullscreen, surface interaction, and specific playback speeds. Unsupported controls can therefore be disabled without source-specific conditions in the interface.

The `html-media-v1` provider translates native HTML media events into this normalized vocabulary. The Media Shell no longer listens for native media events itself. A future YouTube provider can translate IFrame Player API events into the same vocabulary while leaving the shell and transcript interface intact.

The provider also exposes cleanup so its native listeners can be removed when an active provider is replaced.

## Direct media URLs

The direct URL field is for resources that resolve to audio or video the browser can play, such as an MP3 or MP4 file. It is not a general webpage importer.

- Only public HTTP and HTTPS URLs are accepted.
- Localhost, private-network addresses, and credential-bearing URLs are rejected.
- Recognized YouTube hostnames are redirected conceptually to the future YouTube adapter rather than loaded as raw media.
- A remote server can still reject streaming, omit byte-range support, require authentication, or provide a codec unavailable on the current computer.
- Direct remote sources are not downloaded or copied into local storage by this prototype.

## Resting and active states

The first prototype proves the visible state transition and pauses resting media. A production board should go further:

- Resting remote objects should use thumbnails rather than live embedded players.
- Offscreen players should unload instead of continuing to decode.
- Only one player should autoplay at a time.
- Playback position should survive provider unloading.
- A selected local file needs a durable permission or import strategy before it can survive an app restart.

## Current limits

- Local-file selections and direct URLs exist only for the current Media Shell session.
- The transcript is generated test data, not speech recognition or captions.
- Resting pauses the current local player but does not fully release its decoder.
- No transcript editing or import format exists yet.
- Breakdown is not connected to transcript cues yet.
- No YouTube iframe, metadata request, caption request, or API credential is used.

## YouTube boundary

The future YouTube adapter should use the official embedded player rather than extracting or restreaming YouTube video. YouTube branding, controls, attribution, playback rules, and minimum player dimensions must remain intact. Passato Prossimo's tools should live beside or below the embedded player rather than obscuring it.

Official references:

- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
- [YouTube embedded-player requirements](https://developers.google.com/youtube/terms/required-minimum-functionality)
- [YouTube developer-policy guidance](https://developers.google.com/youtube/terms/developer-policies-guide)

## Next evidence

The shell is ready to answer these questions with real use:

- Are the custom controls comfortable for ordinary listening?
- Does the resting state communicate that the heavy player is inactive?
- Are transcript timestamps easy to scan and select?
- Should selecting a cue automatically play, or only seek?
- Where should Breakdown open when a transcript sentence is selected?

## YouTube adapter checkpoint

Step 1 is complete: Provider Contract v2 is implemented and covered by an automated contract test.

Step 2 is also complete: the URL field recognizes these single-video YouTube link shapes and normalizes them to one validated video ID:

- Standard `watch?v=` links.
- `youtu.be` share links.
- Shorts links.
- Live-video links.
- Standard and privacy-enhanced embed links.

Playlist-only pages, channel pages, malformed IDs, credential-bearing links, and lookalike domains are not accepted as YouTube videos. Parsing is local and makes no network request. The interface reports the normalized ID for testing but does not create a player; that remains a later checkpoint.

Step 3 is complete at the architecture and automated-test level. The Electron desktop shell identifies official YouTube embed requests with the development app ID `com.passatoprossimo.immersion`. Header changes are limited to `youtube.com/embed` and `youtube-nocookie.com/embed` requests.

The player-error layer recognizes YouTube's documented errors for invalid requests, HTML5 playback failure, unavailable videos, owner-disabled embedding, and missing client identity. Error 153 receives a specific app-identity explanation rather than a generic playback failure.

Because no YouTube iframe exists yet, Step 3 cannot be confirmed against a live player until the later provider checkpoint. The current evidence proves header construction, request-hook installation, hostname scope, and error translation. A distributable build must register the same app ID with Windows during installation; the present value is a development identity.

Step 4 is complete. A recognized YouTube link now becomes a resting media object inside the existing stage. It includes a lightweight thumbnail, normalized video ID, pasted link type, canonical source action, and an explicit disconnected-transcript state.

The resting object does not create an iframe, initialize the IFrame Player API, autoplay media, or generate transcript cues. Rich title and channel metadata are also not guessed. Those fields belong to a future metadata provider, such as the official YouTube Data API, which has its own key and quota boundary.

If the thumbnail cannot load, the source remains usable as a recognized resting object and reports that the image is unavailable. Switching from local media unloads the previous HTML media source before preparing the YouTube card.

Step 5 is implemented and awaiting live validation. Selecting **Activate YouTube player** loads the official IFrame Player API once and creates a `youtube-iframe-v1` provider inside the existing media stage.

The provider translates YouTube behavior into Provider Contract v2:

- Ready and quarter-second timing updates.
- Playing, paused, buffering, and ended states.
- Play, pause, seek, volume, playback speed, and fullscreen commands.
- Documented player errors, including identity error 153.
- Autoplay-blocked feedback that asks for a direct playback click.

YouTube's native player controls, branding, settings, ads, and playback behavior remain available. Passato Prossimo's toolbar sits outside the player and does not cover it. Surface-interaction capability is disabled because clicks inside the cross-origin iframe belong to YouTube's player.

Returning the video to rest destroys the iframe, stops the timing clock, clears temporary mock transcript cues, and restores the lightweight thumbnail. Leaving Media Shell performs the same provider cleanup.

No API key, Data API request, caption request, video extraction, or restreaming is used. The transcript beside a live YouTube video remains clearly labeled mock timing data until Step 6 defines real transcript sources.
