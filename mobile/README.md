# Passato Prossimo Mobile Shell

This folder is the first mobile entry point for Passato Prossimo. It reuses the
desktop alpha's books, language resources, Breakdown system, media providers, and
platform adapter while adding a mobile-only presentation layer.

## Run On The Local Network

From the project root:

```powershell
npm run mobile:serve
```

Open the printed `iPhone on the same Wi-Fi` address in Safari. The preview server
serves only the files required by the mobile shell; it does not expose the whole
project directory.

## Current Milestone

- Separate mobile HTML entry point.
- Shared language and reader logic with the desktop application.
- Browser platform adapter and browser-local reading progress.
- On-device EPUB and TXT importing with books stored in IndexedDB.
- Installable PWA metadata, home-screen artwork, and an offline app-shell cache.
- Responsive shelf and reader at an iPhone-sized viewport.
- Breakdown displayed as a scrollable mobile bottom sheet.
- Built-in books, browser speech synthesis, local media selection, and early
  YouTube behavior remain available through shared code.

## Intentional Limits

- This is not yet a native iOS application. Installation uses Safari's
  **Add to Home Screen** action from the hosted HTTPS version.
- Mobile imports currently accept TXT files up to 10 MB and EPUB files up to
  30 MB. These safety limits can be revisited after physical-device testing.
- Browser URL import depends on each source website's CORS policy.
- Imported book text is stored in IndexedDB. URL-imported browser books still
  use the existing small local-storage fallback.
- TXT and EPUB importing have passed their first physical-iPhone test.
- The current interface is a responsive version of the desktop experience, not
  the final mobile reading design.

The purpose of this milestone is to prove that one project core can support a
desktop entry point and a mobile entry point before either interface is redesigned.
