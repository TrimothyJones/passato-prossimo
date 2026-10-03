(async function () {
  "use strict";
  const { exactKey, createSelector } = window.PASSATO_LEXICAL;
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const status = document.querySelector("#status");
  try {
    const response = await fetch("/prototype-0.5-media-shell/data/italian-foundation.json");
    if (!response.ok) throw new Error("Could not load the local draft file.");
    const authored = await response.json();
    const trialResponse = await fetch('/prototype-0.5-media-shell/data/reader-dict-trial.json');
    if (!trialResponse.ok) throw new Error('Could not load reader.dict trial data.');
    const trial = await trialResponse.json();
    const englishResponse = await fetch('/prototype-0.5-media-shell/data/reader-dict-en-trial.json');
    if (!englishResponse.ok) throw new Error('Could not load English reader.dict trial data.');
    const englishTrial = await englishResponse.json();
    const select = createSelector(window.ITALIAN_FOUNDATION);
    const wordSelect = document.querySelector("#word");
    const preview = document.querySelector("#preview");
    const readerPreview = document.querySelector('#readerPreview');
    const englishPreview = document.querySelector('#englishPreview');
    const sourceItems = items => `<ul>${items.map(item => `<li>${escape(item.text)}${item.details.length ? `<details><summary>Nested source details · ${item.details.length}</summary>${sourceItems(item.details)}</details>` : ''}</li>`).join('')}</ul>`;

    function legacyFor(word) {
      const core = window.CORE_ITALIAN_DICTIONARY.find((entry) => exactKey(entry.lemma) === word);
      const learner = window.LEARNER_ITALIAN_ENTRIES.find((entry) => exactKey(entry[0]) === word);
      const overflow = window.DICTIONARY_OVERFLOW_ENTRIES.find((entry) => exactKey(entry[0]) === word);
      const view = (providerId, text, language, pos) => ({
        id: `${providerId}:${word}`, headword: word, providerId, definition: { text, language }, pos,
        source: { attribution: providerId }, review: { status: "unreviewed" },
        confidence: "unknown", register: "unknown", license: { status: "unknown" }
      });
      return [
        // Only these three inspected core headwords are in this bounded lab.
        core && view("core-dictionary", core.meaning, "en", core.pos),
        learner && view("learner-enrichment", learner[1], "en", learner[5]),
        overflow && view("dictionary-overflow", overflow[1], "it", overflow[2])
      ].filter(Boolean);
    }

    function list(senses) {
      return senses.length ? `<ul>${senses.map((sense) => `<li>${escape(sense.definition.text)}
        <div class="muted">${escape(sense.providerId || "italian-foundation")} · ${escape(sense.pos)} · ${escape(sense.definition.language)} · ${escape(sense.review.status)}</div></li>`).join("")}</ul>`
        : '<p class="muted">No additional local meanings.</p>';
    }

    function render() {
      const word = wordSelect.value;
      const legacy = legacyFor(word);
      const current = legacy.find((sense) => sense.providerId === "core-dictionary")
        || legacy.find((sense) => sense.providerId === "learner-enrichment") || legacy[0];
      const result = select({ token: word, lemma: word, lemmaMethod: "dictionary-direct", legacy });
      // Preview is deliberately separate from the approved-only selector/export.
      const draft = preview.checked ? authored.entries.find((entry) => entry.headword === word && entry.preferred) : null;
      const preferred = draft || result.preferred;
      const alternatives = draft ? legacy.filter((sense) => sense.definition.language === "en") : result.alternatives;
      status.textContent = `${window.ITALIAN_FOUNDATION.entries.length} approved foundation senses · ${draft ? "English draft preview on" : preview.checked ? "No English draft for this word — legacy fallback" : "English draft preview off — legacy fallback"}`;
      document.querySelector("#current").innerHTML = `<h2>Current Word Lens</h2><p class="word">${escape(word)}</p>
        <p class="gloss">${escape(current?.definition.text || "No local meaning")}</p>
        <p class="muted">${escape(current?.providerId || "No provider")} · ${current?.definition.language === "it" ? "Italian source text currently used as the meaning" : "Existing English meaning"}</p>
        <details><summary>Other existing source text</summary>${list(legacy.filter((sense) => sense !== current))}</details>`;
      document.querySelector("#proposed").innerHTML = `<h2>English learner meaning</h2><p class="word">${escape(word)}</p>
        ${draft ? '<p><span class="badge">Draft preview · not reviewed</span></p>' : ""}
        <p class="gloss">${escape(preferred?.definition.text || "English meaning not available yet.")}</p>
        <p class="muted">${escape(draft?.usageNote || result.selectionReason)}</p>
        <details><summary>Other meanings · ${alternatives.length}</summary>${list(alternatives)}</details>
        ${result.italianDefinitions.length ? `<details><summary>Italian source text</summary>${list(result.italianDefinitions)}</details>` : ""}
        ${preferred ? `<details><summary>Source and review details</summary><pre>${escape(JSON.stringify({ source: preferred.source, license: preferred.license, confidence: preferred.confidence, register: preferred.register, review: preferred.review }, null, 2))}</pre></details>` : ""}`;
      const readerPanel = document.querySelector('#readerDict');
      const englishPanel = document.querySelector('#readerEnglish');
      englishPanel.hidden = !englishPreview.checked;
      const en = englishTrial.entries.find(entry => entry.headword === word);
      englishPanel.innerHTML = `<h2>reader.dict · English definitions</h2>
        <p class="badge">Source evidence · not reviewed for learners</p>
        <p class="muted">${en.senses.length} top-level definitions. Nested text may contain subdefinitions, examples, or notes; it still needs review. No automatic pairing with Italian senses.</p>
        ${[...new Set(en.senses.map(s => s.sourceSection))].map(section => `<details open><summary>${escape(section)}</summary>${sourceItems(en.senses.filter(s => s.sourceSection === section).map(s => ({text:s.definition.text,details:s.details})))}</details>`).join('')}
        <details><summary>Usage notes and sections outside this trial</summary>${en.excludedSections.map(s => `<h3>${escape(s.headingText)}</h3>${sourceItems(s.items)}`).join('')}</details>
        <details><summary>Pronunciation and other source text</summary>${en.supplemental.map(text => `<p>${escape(text)}</p>`).join('')}</details>
        <details><summary>Alias candidates · ${en.aliases.length}</summary><p class="muted">Separate lookup matches; not approved meanings of ${escape(word)}.</p>${en.aliases.map(a => `<h3>${escape(a.headword)}</h3>${a.sections.map(s => `<details><summary>${escape(s.headingText)}</summary>${sourceItems(s.items)}</details>`).join('')}${a.supplemental.map(text => `<p>${escape(text)}</p>`).join('')}`).join('')}</details>
        <p class="muted">Credit: reader.dict and Wiktionary contributors · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a> · <a href="https://www.reader-dict.com">reader.dict</a><br>Adaptation: three-word subset, HTML converted to text, selected grammatical sections and retained source details. Snapshot: 2026-09-01.</p>`;
      readerPanel.hidden = !readerPreview.checked;
      const entry = trial.entries.find(entry => entry.headword === word);
      const sections = [...new Set(entry.senses.map(sense => sense.sourceSection))];
      const focus = word === 'fare' ? 'Verb' : sections[0];
      readerPanel.innerHTML = `<h2>reader.dict · Italian explanations</h2>
        <p class="badge">Source evidence · not reviewed for learners</p>
        <p class="muted">${entry.senses.length} definition items, grouped by part of speech. These are not automatically matched to the English gloss above.</p>
        ${sections.map(section => `<details ${section === focus ? 'open' : ''}><summary>${escape(section)} · ${entry.senses.filter(s => s.sourceSection === section).length}</summary>
          <ol>${entry.senses.filter(s => s.sourceSection === section).map(sense => `<li lang="it">${escape(sense.definition.text)}</li>`).join('')}</ol></details>`).join('')}
        <details><summary>Synonyms and other source text</summary>${entry.supplemental.map(item => `<p class="muted" lang="it">${escape(item.items ? item.items.join('; ') : item.text)}</p>`).join('')}</details>
        <p class="muted">Credit: reader.dict and Wiktionary contributors · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a> · <a href="https://www.reader-dict.com/download/it">Source download</a> · <a href="https://it.wiktionary.org/wiki/${encodeURIComponent(word)}">Wiktionary headword</a><br>Adaptation: three-word subset, HTML converted to text, grammatical sections retained. No English translation added.</p>`;
    }
    wordSelect.addEventListener("change", render);
    preview.addEventListener("change", render);
    readerPreview.addEventListener('change', render);
    englishPreview.addEventListener('change', render);
    render();
  } catch (error) {
    status.textContent = `Comparison unavailable: ${error.message}`;
  }
})();
