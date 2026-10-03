# Context evidence design for Word Lens

Status: research design, 2026-10-03. The runtime currently matches reviewed
headwords exactly and displays approved meanings and notes. It does not implement
the contextual selection system proposed below.

## What we would infer

Given a selected token and its surrounding text, identify candidate lexical
entries, grammatical uses, constructions, and senses. Keep these as separate
questions: recognizing a lemma does not establish a part of speech or a sense.
Use evidence in the text rather than generating missing context.

## Evidence to investigate

| Layer | Potential evidence | Limits and counterexamples to test |
| --- | --- | --- |
| Morphology | Lemma candidates, inflection features, irregular forms, attached pronouns, agreement | Endings are ambiguous; -are does not prove a verb (militare). Do not strip si indiscriminately. |
| Syntax | Determiners, auxiliaries, subject/object relations, modifiers, prepositions and complement structure | Adjacency does not guarantee a relation. Il can introduce a noun or a nominalized infinitive. Handle punctuation and intervening words. |
| Constructions | cercare di + infinitive, stare + gerund, pronominal occuparsi di | Verify the participating forms and links; do not apply a rule just because both words occur in the paragraph. |
| Lexical connections | Frequent word combinations, predicate–object pairs, idioms, reviewed synonym relations | Archive aliases are not necessarily semantic equivalents. Keep idioms and literal readings available. |
| Semantic categories | Person, organization, location, physical object, event, sensation; candidate argument types | These would be reviewed annotations with provenance. Metaphor and polysemy defeat hard category rules. |
| Sentence scope | Negation, coordination, quotations, modality, who performs an action | “Not hearing” still uses the hearing sense. Quoted language need not share the surrounding speaker's intent. |
| Discourse and paragraph | Referents, topic continuity, preceding sentences, domain cues | Topic is supporting evidence, not permission to override local syntax; paragraphs can change topic. |
| Register and domain | Conversational, formal, technical, regional, historical labels | Keep unknown labels unknown. A document's genre cannot certify every word's register. |

## Candidate record and evidence trace

Keep the source lexicon immutable. A proposed analysis record references token
spans, lexical entry IDs, sense IDs and construction IDs. Each evidence item has
its span, rule ID/version, observation, and whether it supports, contradicts, or
leaves a candidate unresolved. Record the lexicon/provider snapshot used.

Possible result states: unresolved, suggested, or selected by a tested rule.
These are proposed UI states, not calibrated confidence percentages. A rule score
is not a probability. Preserve competing candidates and the reason for any
ranking; never overwrite a dictionary sense with a sentence interpretation.

## Small first experiment

1. Establish an ambiguity baseline: potere as noun versus verb, and all three
   grammatical uses of militare. Show labels even when no selection is possible.
2. Add one reviewed construction, cercare di + infinitive, with explicit form
   handling and positive, negative, and ambiguous test passages.
3. Add a second construction only after error analysis. Compare against the
   existing unranked alternatives instead of assuming ranking is an improvement.
4. Investigate semantic categories and paragraph evidence after local syntax
   and construction boundaries are reliable enough to expose their remaining errors.

Review examples separately from evaluation examples. Include negation, inserted
adverbs, coordinated clauses, irregular forms, pronominal forms and homographs.
Measure correct sense selection, wrong selection, abstention/coverage, and whether
the intended meaning remains available among alternatives. Report morphology,
POS, construction and sense errors separately. Test author-reviewed passages and
legitimately usable real modern text; do not describe synthetic examples as a corpus.

## Integration boundary

This design adds no runtime model, parser dependency, generated semantic labels,
or automatic rule today. A deterministic, inspectable prototype is a viable next
experiment; its accuracy must be measured rather than inferred from the design.
AI remains an optional future component, not a prerequisite or a hidden fallback.
