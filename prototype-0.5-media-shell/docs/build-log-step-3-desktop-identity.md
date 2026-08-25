# Build Log: YouTube Desktop Identity

**Date:** August 23, 2026  
**Prototype:** 0.5 Media Shell  
**Checkpoint:** YouTube adapter, Step 3

## Question

How can a future official YouTube embed identify this Electron desktop app when the surrounding interface is loaded from a local HTML file?

## Why this matters

Desktop WebViews can omit the HTTP `Referer` that normally identifies an embedding website. YouTube documents player error 153 for requests without a `Referer` or equivalent API client identification.

This identity is attribution and playback context. It is not an API key, login, user identifier, or secret.

## Decision

The prototype uses the reverse-DNS development app ID:

`com.passatoprossimo.immersion`

Electron uses that value as its Windows application model ID. Requests to official YouTube embed paths receive this HTTPS-formatted identity:

`https://com.passatoprossimo.immersion/`

The request hook is restricted to:

- `https://www.youtube.com/embed/*`
- `https://www.youtube-nocookie.com/embed/*`

It does not modify article imports, direct audio/video streams, ordinary web links, or other YouTube pages.

## Error vocabulary

The local error translator now distinguishes:

- Invalid video requests, code 2.
- HTML5 playback failure, code 5.
- Missing, private, or removed videos, code 100.
- Owner-disabled embedding, codes 101 and 150.
- Missing API client identity, code 153.
- Unknown future player errors.

These messages are ready for the future YouTube provider to emit through Provider Contract v2.

## Evidence

Automated checks verify:

- The app ID and HTTPS `Referer` remain consistent.
- Only official embed URL filters are registered.
- A stale local-file referrer is removed before the app identity is added.
- Existing request headers survive unchanged.
- The Electron request hook installs the filter and returns the identity header.
- All documented YouTube error codes map to stable internal categories.
- Existing media, URL Door, and Breakdown checks still pass.

## Honest limitation

The prototype is not packaged or installed, so this is currently a development identity. A shared installer must register the same app ID with Windows. Live verification of error 153 also requires the YouTube iframe that belongs to a later checkpoint.

## Next checkpoint

Step 4 creates a lightweight resting object with source metadata and a thumbnail before any iframe becomes active.

Separately, preparing outside testing should define a consent-based usage event list before remote tracking is introduced. Imported text, reading content, URLs, and learner vocabulary should remain local unless a tester explicitly chooses to share them.
