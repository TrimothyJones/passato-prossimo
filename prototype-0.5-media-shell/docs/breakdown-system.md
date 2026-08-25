# Breakdown system

## Purpose

Breakdown is the learner-facing composer for Prototype 0.4. Word Lens and Emoji Lens are now evidence providers rather than two separate decisions the learner must make.

## Selection behavior

- A word selection begins with its lemma, likely meaning, and local sentence.
- A sentence selection begins with connected expressions, tone cues, and the few unfamiliar words carrying the most meaning.
- The same sentence evidence is available in both paths.
- Breakdown opens beside the reading page on desktop and as a bottom sheet on narrow screens.

## Provider stack

- Core and overflow dictionary entries supply meanings and examples.
- The lemma layer groups related forms and reports match confidence.
- Frequency and learner history estimate likely friction.
- Accent rules preserve meaning-changing diacritics.
- Elision rules unpack forms such as `l'albero` and `dell'amico`.
- Conversational markers describe discourse jobs such as hesitation or contrast.
- The starter phrase layer recognizes multiword units whose meaning is not reliably found word by word.
- Emoji Lens rules provide a cautious sentence-level tone estimate.

## Explanation order

1. Short English support.
2. A short Italian explanation for immersion.
3. Connected phrase details when found.
4. Likely friction words.
5. Expandable language clues and confidence.

## Current limits

- Phrase coverage is deliberately small and rule-based.
- Tone is inferred from wording and punctuation, not voice, facial expression, or wider narrative context.
- English meanings depend on the current local dictionary stack and can be missing or imperfect.
- Sentence-level grammar is not a full syntactic parse.
- The learner model only knows local interaction history; it does not diagnose proficiency.

These limits are part of the interface contract. Prototype 0.4 favors useful, inspectable evidence over a falsely certain answer.
