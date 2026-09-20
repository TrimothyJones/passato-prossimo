# Mobile Step 3: Installable Web App

## Physical Import Acceptance Test

On September 20, 2026, the mobile importer passed its first physical-device test
on an iPhone. A user-selected book appeared on the mobile shelf and opened in the
shared reader. The test confirmed the intended source-neutral behavior: the app
did not need to know where the book came from, only that it was a supported TXT
or EPUB file.

The main friction observed was outside the reader: iOS makes downloading and
locating compatible files less direct than desktop Windows. That discovery will
inform later onboarding and Files-app guidance; it does not change the importer
architecture.

## PWA Milestone

- Added a web app manifest with standalone display settings.
- Added iPhone and general PWA home-screen icons.
- Added a service worker that caches the complete reading app shell.
- Kept imported books in IndexedDB, separate from the application cache.
- Added a GitHub Pages workflow for HTTPS hosting.
- Added a root redirect so the public project URL opens the mobile reader.

## Offline Boundary

The installed app can reopen its cached interface and locally imported books
without contacting the host. Features that inherently require a network, such as
fetching a new URL or opening YouTube content, still require a connection. The
first visit and installation also require internet access.

## iPhone Installation

1. Open the hosted project URL in Safari.
2. Open Safari's Share menu.
3. Choose **Add to Home Screen**.
4. Launch Passato Prossimo from its new icon.

This is a PWA installation, not an App Store build. A later native iOS wrapper
can reuse the shared browser core while adding Apple-specific storage and media
adapters.
