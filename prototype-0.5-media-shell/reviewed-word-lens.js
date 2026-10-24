(function(root){
 'use strict';
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const key=value=>String(value||'').normalize('NFC').toLowerCase().trim();
 function lookup(provider,token){return provider?.entries?.find(e=>key(e.headword)===key(token)&&['human-accepted-wording','accepted-editorial-treatment'].includes(e.review.status))||null;}
 function meaning(entry){if(!entry)return '';if(entry.groups?.length)return '<div><dt>Meanings by use</dt><dd><ul>'+entry.groups.map(g=>'<li><strong>'+escape(g.pos+(g.label?.text?' · '+g.label.text:''))+':</strong> '+escape(g.definition.text)+'</li>').join('')+'</ul></dd></div>';return '<div><dt>Verb meaning</dt><dd>'+escape(entry.definition.text)+'</dd></div>';}
 function notes(entry){if(!entry)return '';return '<div><dt>Meaning guide</dt><dd>'+ (entry.groups?.length ? 'Reviewed meanings by grammatical use · no use has been selected for this sentence.' : 'Reviewed verb meaning · a general starting point, not a sentence-specific translation.') +'</dd></div>'+entry.notes.map(n=>`<div><dt>${escape(n.title)}</dt><dd>${escape(n.text)}${n.examples?.length?`<ul>${n.examples.map(e=>`<li><span lang="it">${escape(e.it)}</span> — ${escape(e.en)}</li>`).join('')}</ul>`:''}</dd></div>`).join('')+entry.annotations.map(a=>`<div><dt>${escape(a.label)}</dt><dd>${escape(a.englishMeaning)} · <span lang="it">${escape(a.italianMeaning)}</span>. ${escape(a.text)}</dd></div>`).join('');}
 const items=list=>`<ul>${list.map(i=>`<li>${escape(i.text)}${i.details?.length?`<details><summary>More detail</summary>${items(i.details)}</details>`:''}</li>`).join('')}</ul>`;
 function evidence(entry,legacy){if(!entry)return '';return `<details class="word-lens-dictionary"><summary>Original meanings and dictionary details</summary>
 <p>Learner treatments and notes have been accepted. Source definitions retain their provenance; not every source sense was individually reviewed.</p>
 <details><summary>Previous meaning and examples</summary><p>${escape(legacy.meaning)}</p>${legacy.example?`<p lang="it">${escape(legacy.example)}</p>`:''}${legacy.learnerExample?`<p lang="it">${escape(legacy.learnerExample)}</p>`:''}${legacy.englishExample?`<p>${escape(legacy.englishExample)}</p>`:''}${Object.entries(entry.legacy).filter(([k])=>['core','learner','overflow'].includes(k)).map(([name,data])=>`<p>${escape(name)}: ${escape(data.meaning)}</p>`).join('')}</details>
 <details><summary>Source verb senses · ${entry.senses.length}</summary>${items(entry.senses.map(s=>({text:s.definition.text,details:s.details})))}</details>
 <details><summary>Other sections and notes</summary>${entry.otherSections.map(s=>`<h3>${escape(s.headingText)}</h3>${items(s.items)}`).join('')}${entry.supplemental.map(t=>`<p>${escape(t)}</p>`).join('')}</details>
 ${(entry.supplementalSenses||[]).map(s=>`<p>${escape(s.source.attribution)} · ${escape(s.license.identifier)} · ${escape(s.changes)}<br><a href="${escape(s.source.url)}" target="_blank" rel="noopener noreferrer">Supplement source and revision</a></p>`).join('')}
 ${entry.aliases.length?`<details><summary>Separate alias candidates</summary><p>${entry.aliases.map(escape).join(', ')}</p><p>Aliases do not select the learner meaning.</p></details>`:''}
 <details><summary>Source and review</summary><p>reader.dict and Wiktionary contributors · CC BY-SA 4.0. Snapshot ${escape(entry.source.date)}. Adaptation: selected verb entries, plain-text conversion, reviewed learner glosses; original senses retained.</p><p>Reviewer: ${escape(entry.review.reviewer)}. Confidence: ${escape(entry.confidence)}. Register: ${escape(entry.register.value)}.</p><p>Archive SHA-256: <code>${escape(entry.source.sha256)}</code></p><button type="button" data-license-url="https://www.reader-dict.com">reader.dict</button><button type="button" data-license-url="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</button></details></details>`;}
 // One serializable evidence contract; matching does not imply contextual selection.
 function resolve(provider, token, fallbackMeaning = '') {
   const entry = lookup(provider, token);
   const reviewed = entry ? JSON.parse(JSON.stringify(entry)) : null;
   return {
     schemaVersion: 1,
     token,
     match: reviewed ? 'exact-surface' : 'legacy-fallback',
     generalMeaning: reviewed
       ? reviewed.groups?.length
         ? reviewed.groups.map(group => group.pos + (group.label?.text ? ' · ' + group.label.text : '') + ': ' + group.definition.text).join('; ')
         : reviewed.definition.text
       : fallbackMeaning,
     interpretation: { status: 'unresolved', selectedSenseId: null, selectedPos: null },
     reviewed,
     fallback: { meaning: fallbackMeaning, reviewStatus: 'not-established' }
   };
 }
 const api={lookup,resolve,meaning,notes,evidence};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PASSATO_REVIEWED_WORD_LENS=api;
})(typeof window==='undefined'?globalThis:window);
