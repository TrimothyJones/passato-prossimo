# Teacher provider experiment

## Experiment note

> Testing to see if a teacher model can help with context. Fun experiment.

Recorded August 17, 2026.

## Question

Can an optional teacher-shaped explanation add useful context after Breakdown has already assembled local dictionary, lemma, phrase, accent, elision, frequency, learner-history, and tone evidence?

This experiment does not assume that an AI answer is automatically better. It tests whether the additional explanation reduces confusion without replacing inspectable local evidence.

## Current phase: simulation

Prototype 0.4 uses a controlled simulated provider. No external model is connected, no text leaves the computer, and no API costs are incurred. The simulation lets the project test:

- Whether learners understand and use `Ask Italian teacher`.
- Whether a second explanation adds anything beyond Breakdown.
- Whether English plus Italian support is the right response shape.
- Whether provider identity, confidence, and caution are visible enough.
- Whether cached notes remain useful when revisiting the same selection.

The simulated response is explicitly labeled in the interface and must never be presented as AI-generated analysis.

## Request contract

The teacher provider receives only the active selection and compact local evidence:

- Contract version and language pair.
- Selected word or sentence.
- The selected sentence, even for a word request.
- Lemma and local learner status when applicable.
- Local meaning currently available.
- Detected connected phrases.
- Local tone estimate.
- Relevant provider clues.

The request does not contain the whole section, whole book, reading history, source URL, or unrelated learner data.

## Response contract

Every provider response must include:

- Provider ID, label, and kind.
- English explanation.
- Italian explanation.
- One point of focus.
- Confidence wording.
- A limitation or caution.
- Creation time.

Responses are cached locally by provider and request content. Repeating the same request should use the local note instead of making another future paid call.

## Path to a real API

A remote provider should replace the simulated `explain` function without changing Breakdown's interface. Before enabling one, the project must add explicit configuration, request timeouts, safe response validation, cost limits, a visible remote-data notice, and a local fallback.

A first real trial should remain manual and selection-scoped. It should never send an entire imported article or book automatically.

## Observations to record

- What selection triggered the request?
- What was unclear before asking?
- Did the note contribute new context or merely reword Breakdown?
- Was the Italian explanation understandable?
- Did the answer seem too certain?
- Would the learner ask again in a similar situation?
