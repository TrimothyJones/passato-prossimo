# Mobile Step 1: Browser Shell

Date: 2026-09-19

## Question

Can Passato Prossimo run as a distinct phone-sized experience while reusing the
current reader and Italian-language system?

## Result

Yes. The new `mobile/index.html` loads the same compact language resources,
platform adapter, and application logic as the desktop alpha. `mobile/mobile.css`
adds phone-specific safe-area handling, touch sizing, a compact reader header,
full-width reading text, and mobile lens sheets.

A restricted local preview server makes the mobile entry reachable from an iPhone
on the same Wi-Fi network. It serves an explicit allowlist of required application
assets rather than exposing the project directory.

## Verification

- Mobile entry and restricted-server tests: passed.
- Full existing automated test suite: passed.
- Shelf inspected at a 390 by 844 viewport: passed.
- Built-in book opened at the same viewport: passed.
- Breakdown opened and scrolled as a mobile sheet: passed.
- Browser console errors and warnings: none.
- Desktop assets and behavior were not replaced.

## Deliberate Boundary

This milestone proves the shared browser path. It does not yet provide native iOS
packaging, home-screen installation, offline caching, IndexedDB book storage, or
mobile EPUB extraction. Those decisions should follow physical iPhone testing.
