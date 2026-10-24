'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {classify}=require('./lib/cercare-patterns');
const {loadInfinitives,run}=require('./trial-cercare-patterns');
const {infinitives}=loadInfinitives();
const examples=[
 ['Devo cercare la mia penna.','seek',false],
 ['Preferisco cercare una soluzione ai problemi, non solo denunciarli.','seek',false],
 ['Questa parola è intraducibile, si può solo cercare di spiegarne il senso.','attempt',false],
 ['Cercare casa è stressante.','seek',false],
 // Authored counterexamples: development regression cases, not a held-out benchmark.
 ['Non voglio cercare di capire.','attempt',false],
 ['Voglio cercare di non perdere le chiavi.','attempt',false],
 ['Devo cercare di aiutare.','attempt',false],
 ['Voglio cercare di mare.','unresolved',true],
 ['Voglio cercare di blorfare.','unresolved',true],
 ['Voglio cercare di. Capire è difficile.','unresolved',true],
 ['Voglio cercare, di capire non se ne parla.','unresolved',true],
 ['Devo cercare di non, capire.','unresolved',true],
 ['Devo cercare di spiegarglielo.','unresolved',true],
 ['Devo cercare subito di capire.','unresolved',true],
 ['Devo cercare di nuovo le chiavi.','unresolved',true],
 ['Devo cercare tutta la casa.','unresolved',true],
 ['Non voglio cercare il pelo nell’uovo.','unresolved',true],
 ['Devo cercare.','unresolved',true],
 ['Il cercare casa mi stanca.','seek',true],
 ['La frase è «cercare di capire».','attempt',true],
 ["La frase è 'cercare di capire'.",'attempt',true]
];
for(const [text,sense,flagged] of examples){const r=classify(text,infinitives);assert.equal(r.occurrences.length,1,text);assert.equal(r.occurrences[0].provisionalSense,sense,text);assert.equal(r.closerReview,flagged,text);for(const e of r.occurrences[0].evidence)assert.equal(text.slice(e.start,e.end),e.text);}
for(const text of ['Cerco di capire.','Devo ricercare la causa.','Voglio cercarlo.'])assert.equal(classify(text,infinitives).applicable,false);
const both=classify('Devo cercare casa e cercare di capire.',infinitives);assert.deepEqual(both.groups,['seek','attempt']);assert.equal(both.occurrences.length,2);
const crossing=classify('Devo cercare; dopo devo cercare di capire.',infinitives);assert.equal(crossing.occurrences[0].provisionalSense,'unresolved');assert.equal(crossing.occurrences[1].provisionalSense,'attempt');assert(crossing.closerReview);
const file=path.resolve(__dirname,'../prototype-0.5-media-shell/data/research/tatoeba-review-001.json');const before=fs.readFileSync(file);const out=run();assert.equal(out.summary.routine,4);assert.equal(out.summary.groups.attempt,1);assert.equal(out.summary.groups.seek,3);assert(fs.readFileSync(file).equals(before),'Grammar must never edit editorial approval');assert(out.records.every(r=>r.editorial.status==='human-accepted'&&r.publication==='not-authorized-by-classification'));
console.log('PASS: four development examples, boundary/negation/unknown-form counterexamples, multi-occurrence grouping, exact spans, and review separation.');
