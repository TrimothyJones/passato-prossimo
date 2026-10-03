const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../prototype-0.5-media-shell');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const cell = value => String(value || '—').replace(/\|/g, '\\|').replace(/\s+/g, ' ');
for (const number of ['001', '002']) {
  const bytes = fs.readFileSync(path.join(root, `data/research/verbs-${number}.json`));
  const batch = JSON.parse(bytes);
  const review = JSON.parse(fs.readFileSync(path.join(root, `data/research/verbs-${number}-review.json`), 'utf8'));
  assert.equal(review.batchSha256, digest(bytes), 'Source changed; review must be revisited');
  assert.equal(review.decisions.length, batch.entries.length);
  assert.equal(new Set(review.decisions.map(d => d.lemma)).size, batch.entries.length);
  for (const decision of review.decisions) {
    const entry = batch.entries.find(e => e.lemma === decision.lemma);
    assert(entry);
    assert(['propose', 'hold'].includes(decision.decision));
    assert.equal(decision.eligibleForExport, false);
    assert.equal(decision.review.approvedBy, null);
    assert.equal(decision.review.status, 'ai-reviewed-awaiting-human');
    assert.equal(decision.preserveSecondarySenses, true);
    if (decision.humanReview) {
      assert(['accepted', 'form-follow-up', 'accepted-treatment'].includes(decision.humanReview.status));
      assert(decision.humanReview.reviewer && decision.humanReview.scope);
      const payload = {lemma:decision.lemma,definition:decision.proposedDefinition,evidence:decision.evidence,contextNote:decision.contextNote};
      if (decision.humanReview.contentHashVersion === 2) Object.assign(payload, {clarification:decision.clarification,senseAnnotations:decision.senseAnnotationProposals,formTreatment:decision.followUpEvidence});
      assert.equal(decision.humanReview.contentHash, digest(JSON.stringify(payload)), 'Reviewed content changed');
      if (decision.humanReview.status === 'accepted-treatment') assert(decision.humanReview.acceptedTreatment && decision.followUpEvidence);
      if (decision.humanReview.status === 'accepted') {
        assert.equal(decision.humanReview.acceptedDefinition, decision.proposedDefinition.text);
        assert.equal(decision.decision, 'propose');
      }
    }
    assert(decision.rationale && decision.license && decision.register && decision.confidence);
    if (decision.proposedDefinition) assert.equal(decision.proposedDefinition.language, 'en');
    if (decision.contextNote) {
      assert.equal(decision.contextNote.language, 'en');
      assert(decision.contextNote.text && decision.contextNote.author && decision.contextNote.scope);
      assert(['proposed', 'accepted'].includes(decision.contextNote.status));
    }
    if (decision.decision === 'propose') assert(decision.proposedDefinition?.text && decision.evidence.length);
    for (const evidence of decision.evidence) {
      const sense = entry.senses.find(s => s.id === evidence.senseId);
      assert(sense, 'Missing source sense');
      assert.equal(evidence.sourceText, sense.definition.text);
      assert.deepEqual(evidence.source, sense.source);
    }
  }
  if (review.batchReview?.status === 'human-review-complete') {
    assert.equal(review.decisions.filter(d=>d.humanReview?.status==='accepted').length, review.batchReview.acceptedGlosses);
    assert.equal(review.decisions.filter(d=>d.humanReview?.status==='accepted-treatment').length, review.batchReview.acceptedFormTreatments);
    assert.equal(review.batchReview.acceptedGlosses + review.batchReview.acceptedFormTreatments, batch.entries.length);
  }
  const held = review.decisions.filter(d => d.decision === 'hold');
  const lines = [`# Verb batch ${number} — first review`, '',
    `${review.decisions.length - held.length} learner-gloss proposals; ${held.length} held from single-default export. Initial reviewer: Codex (AI). Human acceptance of wording is tracked separately below; no register verification or runtime export is implied.`, '',
    `Human wording review: ${review.decisions.filter(d=>d.humanReview?.status==='accepted').length} accepted; ${review.decisions.filter(d=>d.humanReview?.status==='accepted-treatment').length} accepted special treatment; ${review.decisions.filter(d=>d.humanReview?.status==='form-follow-up').length} form follow-up.`, '',
    'This pass compares top-level source meanings and proposes a general learner starting point. It does not certify all secondary definitions, establish corpus frequency by sense, or test performance on real modern passages. Combined display glosses cite each original sense without merging source records.', '',
    '## Cases needing attention', '', ...held.map(d => `- **${d.lemma}:** ${d.rationale}`), '',
    '## Proposed decisions, ten at a time', ''];
  if (review.batchReview) lines.splice(2, 0, `**Batch status: ${review.batchReview.status}.** ${review.batchReview.note}`, '');
  for (let start=0; start<review.decisions.length; start+=10) {
    lines.push(`### Words ${start+1}–${start+10}`, '', '| Word | Existing core meaning | Proposed learner gloss | Decision | Reason |', '| --- | --- | --- | --- | --- |');
    for (const d of review.decisions.slice(start,start+10)) {
      const entry=batch.entries.find(e=>e.lemma===d.lemma);
      lines.push(`| ${d.lemma} | ${cell(entry.local.core?.meaning)} | ${cell(d.proposedDefinition?.text)} | ${d.humanReview ? d.humanReview.status + ' (human wording review)' : d.decision} | ${cell(d.rationale)}${d.followUpEvidence ? ' [Form reference](' + d.followUpEvidence.url + ')' : ''} |`);
    }
    lines.push('');
  }
  for (const d of review.decisions.filter(d=>d.contextNote)) {
    lines.push(`## ${d.lemma}: ${d.contextNote.status} context section`, '', `**${d.proposedDefinition.text}**`, '', `**${d.contextNote.title}**`, '', d.contextNote.text, '',
      `Context note by ${d.contextNote.author}; status: ${d.contextNote.status}; runtime status: ${review.batchReview?.integrationStatus || "not-integrated"}. [Sense sanity check](${d.contextNote.verification.url}). Keep separate from individual source senses and sentence-specific interpretation.`, '');
  }
  for (const d of review.decisions.filter(d=>d.clarification)) {
    lines.push(`## ${d.lemma}: clarification ${d.clarification.status}`, '', d.clarification.note, '', `[Reference](${d.clarification.reference})`, '', ...(d.clarification.examples || []).map(e=>`- ${e.it} → ${e.en}`), '');
  }
  lines.push('## Review and integration boundary', '',
    'A human review should check sense choice, wording, register, and construction restrictions. Record amendments and the reviewer identity separately from these AI proposals. Held words must not receive a default automatically. Unverified register stays unknown. Approval requires an explicit decision, not merely a passing validation script.', '',
    'Batch 001 has 49 accepted glosses available locally in Word Lens through a dedicated reviewed-wording export; ribellare remains held. Batch 002 adds 49 accepted glosses and the grouped militare entry locally; all required distinctions are included. Exact headword matching only. Keep source meanings, licenses, hashes, and locators. Broader modern-passage evaluation remains a separate milestone.', '',
    `Machine-readable decisions: \`../data/research/verbs-${number}-review.json\`. They reference the immutable batch hash and exact source sense IDs. Rebuilding a batch cannot silently update these decisions.`, '',
    'Credit for adapted dictionary wording: reader.dict and Wiktionary contributors, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Existing-provider meanings retain their original provenance and terms.', '');
  if (process.argv.includes('--write')) fs.writeFileSync(path.join(root, `docs/verb-batch-${number}-review.md`), lines.join('\n'));
  console.log(`verbs-${number}: review evidence and export isolation PASS (${review.decisions.length-held.length} proposals, ${held.length} holds)`);
}
