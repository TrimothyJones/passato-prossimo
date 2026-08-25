# Prototype 0.6 Tester Build

## Purpose

This build packages the working Italian reader, Breakdown, local TTS, URL Door, local media shell, and official YouTube provider for a small group of trusted Windows testers.

It is an alpha proof of concept, not a public release. Transcript generation, accounts, cloud AI, automatic updates, and remote telemetry are intentionally absent.

## Installer

Build command:

`npm run make`

Windows installer:

`out/make/squirrel.windows/x64/Passato-Prossimo-Setup.exe`

The installer is unsigned. Windows may display a SmartScreen warning. Code signing should be addressed before broad public distribution.

## Runtime boundary

The packaged `app.asar` is approximately 16 MB. Packaging excludes:

- The 726 MB raw Kaikki dictionary dump.
- Raw frequency corpora and research files.
- Previous Prototype 0.4.
- Automated tests and developer tools.
- Documentation, screenshots, backups, and helper scripts.

Only the active app, generated runtime language resources, and production dependencies are included.

## Local evidence

Interaction events remain on the tester's computer. The main log retains at most 5,000 recent events and labels new events with a random per-launch session ID and app version.

The shelf includes **Export testing report**. Selecting it opens a normal save dialog and produces a new sanitized JSON summary.

The exported report contains:

- App, Electron, Windows, and processor architecture versions.
- Total recorded events and sessions.
- Counts by interaction type.
- Broad media source counts: local file, direct URL, YouTube, or other.
- Provider error categories.
- First and last recorded timestamps.

The report excludes:

- Reading text and imported passages.
- Book titles and IDs.
- Clicked words and vocabulary.
- Article URLs and host history.
- YouTube video IDs.
- Stable device or user identifiers.

No report is uploaded automatically. The tester chooses where to save it and whether to send it.

## Suggested test loop

1. Install and launch Passato Prossimo.
2. Open a bundled reading sample and use both lenses.
3. Import one small TXT or EPUB file.
4. Preview and save one Italian article through URL Door.
5. Test local TTS and save a reading position.
6. Play one local audio or video file in Media Shell.
7. Paste, activate, rest, and reactivate one public YouTube video.
8. Export the testing report.
9. Describe one confusing moment and one unexpectedly useful moment separately from the report.

## Known limits

- The YouTube transcript rail contains mock synchronization cues, not the video's speech.
- Windows voices vary by machine and installed language packs.
- The installer has no custom icon or code signature yet.
- There is no automatic update path.
- Language-resource licensing still needs a final audit before public publication.
- Dependency audit warnings exist in the development-only packaging toolchain and should be reviewed before a wider release. The packaged production dependency audit reports zero known vulnerabilities.

## EPUB safety boundary

The previous archive extractor was replaced before release after a production audit identified an unpatched path-traversal advisory. The tester build now uses a guarded ZIP reader that rejects traversal paths, symbolic links, unsupported entry types, duplicate output targets, excessive file counts, oversized entries, and excessive total expansion.

Automated tests cover normal miniature EPUB extraction and malicious path/type rejection. `npm audit --omit=dev` reports zero known vulnerabilities in the production dependency set.
