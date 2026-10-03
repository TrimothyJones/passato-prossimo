(function (root) {
  'use strict';
  const key = value => String(value || '').normalize('NFC').toLowerCase().trim();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function lookup(provider, token) {
    // This trial accepts exact surface forms only. Alias and guessed lemma
    // matches need a separate review before they can drive dictionary display.
    return provider?.entries?.find(entry => key(entry.headword) === key(token)) || null;
  }
  const items = list => `<ul>${list.map(item => `<li>${escape(item.text)}${item.details?.length ? `<details><summary>More detail</summary>${items(item.details)}</details>` : ''}</li>`).join('')}</ul>`;
  function render(provider, token) {
    const entry = lookup(provider, token);
    if (!entry) return '';
    const groups = [...new Set(entry.senses.map(s => s.sourceSection))];
    return `<details class="word-lens-dictionary"><summary>More dictionary meanings · ${entry.senses.length}</summary>
      <p>English definitions from reader.dict. These have not yet been reviewed for learners or selected for this sentence.</p>
      ${groups.map(group => `<details><summary>${escape(group)}</summary>${items(entry.senses.filter(s=>s.sourceSection === group).map(s=>({text:s.definition.text,details:s.details})))}</details>`).join('')}
      <details><summary>Usage notes and other sections</summary>${entry.excludedSections.map(section=>`<h3>${escape(section.headingText)}</h3>${items(section.items)}`).join('')}${entry.supplemental.map(text=>`<p>${escape(text)}</p>`).join('')}</details>
      ${entry.aliases.length ? `<details><summary>Related lookup candidates</summary><p>These archive aliases are separate matches, not confirmed meanings of this word.</p>${entry.aliases.map(alias=>`<details><summary>${escape(alias.headword)}</summary>${alias.sections.map(section=>`<h3>${escape(section.headingText)}</h3>${items(section.items)}`).join('')}${alias.supplemental.map(text=>`<p>${escape(text)}</p>`).join('')}</details>`).join('')}</details>` : ''}
      <details><summary>Source and review</summary><p>reader.dict and Wiktionary contributors · CC BY-SA 4.0. Snapshot ${escape(provider.source.date)}. Three-word subset adapted from HTML to text; sections and nested details retained.</p><p>Review: unreviewed. Confidence: unassessed. Register: not assessed; source labels remain in the definitions.</p><p>Archive SHA-256: <code>${escape(provider.source.sha256)}</code></p>
      <button type="button" data-license-url="https://www.reader-dict.com">reader.dict</button>
      <button type="button" data-license-url="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</button></details>
    </details>`;
  }
  const api = { lookup, render };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PASSATO_WORD_LENS_TRIAL = api;
})(typeof window === 'undefined' ? globalThis : window);
