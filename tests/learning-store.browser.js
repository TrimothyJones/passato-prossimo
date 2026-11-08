async function runLearningStoreBrowserTests(){
 const assert=(value,label)=>{if(!value)throw Error(label);};
 const api=window.PASSATO_LEARNING_STORE;let tick=0;const now=()=>new Date(Date.UTC(2026,10,8,12,0,tick++)).toISOString();
 const store=api.create({indexedDB,now});
 await store.setStatus('fare','known');
 const first=await store.migrateLegacy({' CITTÀ ':{status:'shaky'},'fare':{status:'unknown'},'citta':{status:'known'},'bad':{status:'expert'}});
 assert(first.migrated===2,'Migration skips existing and invalid rows');assert((await store.getWord('fare')).status==='known','Migration preserves new data');
 assert((await store.migrateLegacy({nuovo:{status:'known'}})).alreadyMigrated,'Migration idempotent');assert(!(await store.getWord('nuovo')),'No repeat migration');
 const legacy=await store.getWord('città');assert(legacy.statusSource==='legacy'&&legacy.encounterCount===0&&legacy.reviewCount===0,'Migration creates no fake activity');
 const a=await store.recordEncounter('CITTÀ',{token:'Città',bookId:'test-book',sectionIndex:1,sentenceIndex:2,source:'word-lens',lemmaMethod:'exact'});
 const b=await store.recordEncounter('città',{token:'città',bookId:'test-book'});
 assert(a.firstSeenAt===b.firstSeenAt&&a.lastSeenAt!==b.lastSeenAt&&b.encounterCount===2,'Encounter timestamps and count');assert(b.status==='shaky','Lookup preserves status');
 const rated=await store.setStatus('città','known');assert(rated.encounterCount===2&&rated.reviewCount===1,'Review preserves encounters');
 const review=(await store.listReviews('città'))[0];assert(review.previousStatus==='shaky'&&review.kind==='self-assessment','Review history records transition');
 const fresh=await store.recordEncounter('vedere');assert(fresh.statusSource==='unassessed'&&fresh.reviewCount===0,'Unassessed encounter is not a learner rating');
 const second=api.create({indexedDB,now});await Promise.all(Array.from({length:12},(_,i)=>(i%2?store:second).recordEncounter('vedere')));assert((await store.getWord('vedere')).encounterCount===13,'Concurrent transactions lose no increments');
 const exported=await store.exportJSON();for(const w of exported.words){assert(w.encounterCount===exported.encounters.filter(e=>e.lemma===w.lemma).length,'Export encounter consistency');assert(w.reviewCount===exported.reviews.filter(r=>r.lemma===w.lemma).length,'Export review consistency');}
 await second.close();await store.close();const reopened=api.create({indexedDB,now});assert((await reopened.getWord('città')).status==='known','Reopen persists rating');assert((await reopened.listEncounters('città')).length===2,'Reopen persists history');await reopened.close();
 const failing=api.create({indexedDB,now:()=>{throw Error('injected transaction failure');}});let failed=false;try{await failing.setStatus('città','unknown');}catch(e){failed=/injected/.test(e.message);}assert(failed,'Transaction failure surfaced');await failing.close();
 const verify=api.create({indexedDB});assert((await verify.getWord('città')).status==='known'&&(await verify.listReviews('città')).length===1,'Aborted write changes neither rating nor review history');await verify.close();
 // Explicit null must not silently use the browser global.
 let unavailable=false;try{await api.create({indexedDB:null}).listWords();}catch(e){unavailable=/unavailable/.test(e.message);}assert(unavailable,'Explicit unavailable injection');
 return 'IndexedDB: migration, idempotence, accents, timestamps, review history, concurrency, atomic export, reopening and rollback PASS';
}
