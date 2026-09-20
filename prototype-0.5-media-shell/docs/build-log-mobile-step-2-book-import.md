# Mobile Step 2: Local Book Import

## Goal

Give the shared mobile browser shell the same first doorway into reading as the
desktop alpha: select a local Italian TXT or EPUB, place it on the shelf, and
open only the current section in the reader.

## What Changed

- Added a mobile file picker for `.txt` and `.epub` files.
- Added a browser-side EPUB parser using the vendored `fflate` 0.8.3 library.
- Stored imported metadata and chapter text locally in IndexedDB.
- Routed import, shelf loading, and section loading through the existing
  platform adapter.
- Kept the shared reader, Breakdown system, progress tracking, and desktop
  Electron importer unchanged.
- Added size, archive-entry, extracted-text, and unsafe-path checks before an
  EPUB is accepted.

## Current Safety Limits

- TXT: 10 MB maximum file size.
- EPUB: 30 MB maximum file size.
- EPUB archive: 5,000 entries maximum.
- EPUB readable content: 80 MB maximum after extraction.
- Reader sections: approximately 10,000 characters, split near paragraph or
  sentence boundaries when possible.

These are prototype limits chosen to protect responsiveness on a phone. They
are not claims about the final product's capacity.

## Storage And Privacy

Imported books remain in the browser's IndexedDB storage on the device. The
mobile importer does not upload book contents to a server. Safari may remove
site storage under its own storage-management rules, so this is not yet a
substitute for a native library or backup system.

## Verification

- The importer has a synthetic EPUB regression test.
- The platform adapter test covers mobile imports and stored section loading.
- The restricted mobile preview server test confirms the new scripts are
  available in the required load order.
- Physical iPhone import and persistence tests are the acceptance test for this
  milestone.

## Dependency Note

`fflate` 0.8.3 is distributed under the MIT License. Its browser build and
license text are vendored in `mobile/vendor` so the mobile preview does not need
an internet connection to open EPUB files.
