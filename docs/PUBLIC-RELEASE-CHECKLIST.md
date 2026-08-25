# Passato Prossimo public release checklist

The historical `0.6.0-alpha.0` ZIP was prepared for a small, trusted testing round.
The public candidate begins at `0.6.0-alpha.1`; complete this checklist before upload.

## Identity and expectations

- Choose the public project description and contact channel.
- State clearly that this is an Italian-first experimental alpha.
- Decide whether testers may redistribute the installer.
- Add a visible version number and a simple way to report problems.

## Licensing and attribution

- [x] Apply a temporary source-visible, noncommercial alpha license to original code; defer the permanent open-source decision.
- [x] Audit every bundled lexical resource and generated data file.
- [x] Record source URLs, authors, versions, and required attribution.
- [x] Confirm the current noncommercial alpha conditions for every resource shipped in the app.
- [x] Add generated third-party software notices and an in-app source panel.

## Privacy and safety

- Review the exported testing report one more time with deliberately sensitive test data.
- Publish the plain-language privacy explanation beside the download.
- Keep report sharing voluntary and manual.
- Avoid collecting names, email addresses, reading content, or stable device IDs unless a later test truly requires them.

## Distribution

- Test the installer on a second Windows x64 computer or a clean Windows account.
- Test install, first launch, report export, closing, reopening, and uninstalling.
- Decide where the canonical download and checksum will live.
- Add code signing when broader distribution makes the cost worthwhile.
- Keep an untouched archive of every shared build and its checksum.

## Feedback round

- Start with one to three trusted testers.
- Give each tester the same short test loop.
- Collect exported reports separately from conversational feedback.
- Fix crashes, data loss, installation failures, and major confusion before expanding the group.
- Write a brief decision log after the round: what changed, what stayed, and why.
