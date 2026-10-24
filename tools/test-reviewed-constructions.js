'use strict';
const assert=require('node:assert/strict');
const {read}=require('./build-reviewed-verbs');
const {loadInfinitives}=require('./trial-cercare-patterns');
const {classify}=require('./lib/reviewed-constructions');
const provider=read(),before=JSON.stringify(provider),targets=new Set(provider.entries.filter(e=>e.review.status==='human-accepted-wording').map(e=>e.headword));
const {infinitives}=loadInfinitives();
function one(text,lemma){return classify(text,targets,infinitives).find(o=>o.lemma===lemma);}
assert.equal(targets.size,99);
for(const [text,lemma,label] of [
 ['Vorrei potere andare.','potere','modal-possibility'],
 ['Temo di dovere partire.','dovere','modal-necessity'],
 ['Dice di volere capire.','volere','volition'],
 ['Spero di riuscire a capire.','riuscire','manage-to'],
 ['Voglio continuare a non parlare.','continuare','continue-action'],
 ['Credo di stare per partire.','stare','prospective-action'],
 ['Voglio cercare di capire.','cercare','attempt']
]){const o=one(text,lemma);assert.equal(o.provisionalSense,label,text);assert.equal(o.closerReview,false,text);assert.equal(o.labelStatus,'provisional');}
for(const [text,lemma] of [
 ['Il potere cambia.','potere'],['Sento il dovere di partire.','dovere'],
 ['Volere è potere.','volere'],['Voglio stare per strada.','stare'],
 ['Voglio continuare a. Parlare aiuta.','continuare'],
 ['Spero di riuscire a blorfare.','riuscire'],['Voglio potere, andare.','potere'],
 ['Voglio riuscire a farlo.','riuscire'],['Devo sentire qualcosa.','sentire']
]){const o=one(text,lemma);assert.equal(o.provisionalSense,'unresolved',text);assert.equal(o.closerReview,true,text);}
assert(one('Dice "potere andare".','potere').closerReview);
assert(one('Il volere capire è utile.','volere').closerReview);
assert.equal(classify('Ricercare e ribellare.',targets,infinitives).length,0);
assert.equal(classify('Cerco e posso.',targets,infinitives).length,0);
const text='Potere andare e potere partire.';
assert.equal(classify(text,targets,infinitives).filter(o=>o.lemma==='potere').length,2);
for(const o of classify(text,targets,infinitives))assert.equal(text.slice(o.span.start,o.span.end).toLowerCase(),o.lemma);
assert.equal(JSON.stringify(provider),before);
console.log('Reviewed construction routing: positive, abstention, punctuation, multi-occurrence and approval-boundary checks passed.');
