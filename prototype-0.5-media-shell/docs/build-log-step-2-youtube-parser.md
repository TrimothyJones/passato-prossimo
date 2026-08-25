# Build Log: YouTube URL Parser

**Date:** August 18, 2026  
**Prototype:** 0.5 Media Shell  
**Checkpoint:** YouTube adapter, Step 2

## Question

Can Media Shell reliably recognize that several differently shaped links refer to one YouTube video before any YouTube player or API behavior is introduced?

## Decision

Step 2 remains a pure local parser. It receives pasted text and either returns a normalized source record or explains why the link is not a supported single-video YouTube URL. It does not verify that the remote video exists.

## Normalized result

A recognized link becomes:

- Provider name: YouTube.
- One validated video ID.
- The recognized link format.
- One canonical watch URL.

## Supported shapes

- Standard watch links.
- Shortened `youtu.be` share links.
- Shorts links.
- Live-video links.
- Embed links from YouTube and YouTube's privacy-enhanced domain.

Tracking and sharing query parameters do not alter the extracted video ID.

## Guardrails

- Only HTTP and HTTPS links from an explicit YouTube hostname list are considered.
- A lookalike hostname such as `notyoutube.com` remains an ordinary non-YouTube URL.
- Playlist-only, channel, and home pages fail because they do not identify one video.
- Video IDs must match YouTube's expected 11-character identifier shape.
- URLs containing a username or password are rejected.

## Interface behavior

The existing Media Shell URL field accepts both direct media and YouTube links. A recognized YouTube link displays its normalized video ID in the provider status area. It does not activate the player, alter the resting media object, or generate transcript cues.

## Evidence

The automated test covers watch, shortened, Shorts, live, standard embed, and privacy-enhanced embed links. It also covers playlist-only links, malformed IDs, lookalike domains, and the boundary with direct media validation.

## Next checkpoint

Step 3 concerns desktop player identity and YouTube's embedded-player requirements. It remains unimplemented so identity and error behavior can be investigated independently from parsing.
