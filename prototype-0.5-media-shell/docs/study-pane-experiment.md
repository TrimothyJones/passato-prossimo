# Word Lens study pane — 2026-11-08

Approved Step 2 interface: shared Word Lens/Teacher navigation, desktop width slider (320–560px, constrained by viewport), and simpler initial dictionary view. Existing mobile sheets remain in use. Source dictionary first definitions are general anchors, not automatic contextual sense selection. Full senses, examples, provenance, and diagnostics remain available in expandable sections.

Tab switches reuse the selected word without recording additional encounters. Selecting a sentence in Teacher and then opening Word Lens uses its first word. Width is retained during the running session, not persisted across reloads. Floating windows, dragging, pinned sentences, and quick-peek cards are deferred until this layout is reviewed.

Validation: npm test; npm run test:learning:browser. Browser checks cover tab navigation, width changes, collapsed details, and unchanged encounter counts as well as existing learning-store behavior. Optional PASSATO_STUDY_SCREENSHOT=1 captures tmp/study-pane.png from an isolated profile.

Promoted after user review. Word clicks default to Word Lens; Explore this word contains additional guidance and sources, with diagnostics nested under How this lookup works. Pane sizing lives under Adjust pane. Step 3 morphology work is deferred.
