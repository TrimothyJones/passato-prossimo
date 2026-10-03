# Shared Core Step 1: Platform Adapter

Date: 2026-09-19

## Question

Can the current reader ask one shared interface for library data instead of knowing
whether Electron or a browser is supplying it?

## Change

`platform-adapter.js` now creates `window.PASSATO_PLATFORM` before the main reader
starts. It identifies the current environment and exposes a small library contract:

- `library.loadBooks()`
- `library.loadSection(request)`
- `capabilities.nativeBookImport`
- `capabilities.storedBookSections`

In Electron, the adapter forwards those operations to the existing secure preload
bridge. In a browser, it loads the existing browser-only shelf from local storage
and reports that disk-backed stored sections are not available yet.

The reader no longer calls Electron directly when it loads the shelf or opens a
stored book section. Built-in books continue to open from their bundled text.

## Why This Matters

The adapter is a translator between the shared reader and each operating
environment. The reader can eventually ask for a book without caring whether the
answer comes from Windows disk storage, browser storage, or a future mobile native
container.

This first step is intentionally narrow. Importing, URL preview, report export,
external links, and interaction logging still use their existing paths.

## User-Visible Effect

None intended. The desktop shelf, imported books, built-in books, and reading
interface should behave exactly as they did at the protected alpha baseline.

## Verification

- Browser adapter test: passed.
- Electron adapter forwarding test: passed.
- Existing media-provider tests: passed.
- Existing Breakdown and teacher-provider tests: passed.
- Existing URL importer tests: passed.
- Electron Forge Windows package: passed.
- Packaged Windows application smoke launch: passed.
- Packaged ASAR inspection confirmed `platform-adapter.js` is included.

## Next Boundary

Move one more platform concern behind the adapter, preferably interaction logging
and small preference storage, before extracting the language engine itself. This
keeps each step reviewable and leaves the desktop alpha runnable.
