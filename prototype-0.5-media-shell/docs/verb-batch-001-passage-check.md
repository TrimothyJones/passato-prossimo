# Batch 001 passage check — 2026-09-26

## Result

The real reader tokenizer and Word Lens renderer successfully display all 49
accepted headwords in 11 passages (8 constructed passages and 3 authentic short
excerpts). Fourteen additional probes exercise secondary meanings, pronominal
forms, inflections, clitics, and a noun/verb homograph. Run:

`node prototype-0.5-media-shell/tools/test-media-shell.js`

This is a rendering pass and an AI linguistic assessment, not a human semantic
approval, corpus benchmark, or claim of 49 independently attested modern uses.
Constructed passages deliberately include infinitives to exercise the currently
supported exact-match overlay. They are not representative morphology coverage.
The fixture records authorship, sources, expectations, and known limitations.

## Findings for review

| Construction | Assessment |
| --- | --- |
| passare due ore | Short default is insufficient; accepted context note explicitly includes spending time. |
| rendere il libro / rendere più semplice | Return and resultative constructions are both represented by the accepted gloss and note. |
| realizzare quanto sia difficile | Awareness meaning is available in the accepted English-influence annotation, not the first gloss. |
| prendere il treno | General “take” is useful here. |
| partire con i lavori | Means start work; depart/leave is not sufficient. |
| seguire le lezioni | Attend/follow classes; English “follow” alone may need explanation. |
| conoscere una crisi | Experience/undergo, not know a person/place. |
| dare un esame | Take/sit an exam, not a literal give translation. |
| venire firmato | Passive auxiliary; come is not the contextual meaning. |
| Il potere comporta responsabilità | Confirmed limitation: exact matching displays the verb default for a noun. POS-aware selection is needed before calling this context-aware lookup. |
| fatto / Lasciami | Reviewed overlay does not match; legacy lookup remains. No claim that the entire dictionary lacks these forms. |

The tests deliberately record the current noun mismatch; that passing assertion
is a diagnostic baseline, not an endorsement. No new lexical wording has been
silently human-approved. Broader context selection and inflected-form support
remain unresolved; public release should account for these limitations.

## Ribellare: source check resolved; runtime mapping still held

The archive contains TWO direct entries, independently extracted in
`../data/research/ribellare-form-check.json`, with archive SHA-256 and original
HTML preserved:

- ribellare: transitive, archaic and rare; cause others to rebel.
- ribellarsi: rebel/revolt; pronominal form.

[Treccani](https://www.treccani.it/vocabolario/ribellare/) independently confirms
the distinction. It was used as a verification reference; its prose was not
imported into the dictionary. The already accepted human treatment remains valid.
This is not missing dictionary coverage: the source has the everyday form.

Recommended implementation: link the existing ribellare word family to an
explicit, separately sourced ribellarsi record. Match that record only to
ribellarsi initially. Retain the marked transitive meaning for bare ribellare.
Do not strip si generically or accept all StarDict alias candidates. Mi ribello,
si ribella, and ribellar require explicit morphological handling; this check
does not authorize treating them as identical surface forms.

The current 49-entry provider remains unchanged while that mapping is implemented.
This closes the meaning/source question, not the runtime form-mapping task.

## Authentic excerpt sources

- [Università di Bologna: Ho un diploma](https://www.unibo.it/it/ho-un-diploma)
  — two short excerpts, 24 words total, on housing and arrival in Italy.
- [Università di Bologna: Ti guidiamo nella scelta](https://www.unibo.it/it/studiare/guida-alla-scelta-del-corso/scegli-il-corso)
  — one short excerpt on attending lessons.

These excerpts are external reference material, not reader.dict data and not
relicensed under CC BY-SA. The other passages and English assessments are
original AI-authored test material, pending user review.

## Batch 002 handoff

The first ten remain proposals: cercare, tornare, continuare, costruire,
comprendere, sembrare, pensare, morire, tenere, produrre.
Pay particular attention to comprendere (understand and include), tenere
(hold/keep rather than the old military-specific default), and pensare (think,
with construction-specific meanings kept separate). No batch-002 approval or
runtime export was added by this diagnostic work.
