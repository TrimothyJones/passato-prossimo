'use strict';
const baseline=require('./reviewed-constructions');
const VERSION='reviewed-constructions-v2';
const RULES={...baseline.RULES,
 smettere:{link:'di',sense:'stop-action',source:'https://www.treccani.it/vocabolario/smettere_%28Sinonimi-e-Contrari%29/'},
 cominciare:{link:'a',sense:'begin-action',source:'https://www.treccani.it/vocabolario/cominciare_%28Sinonimi-e-Contrari%29/'},
 provare:{link:'a',sense:'attempt',source:'https://www.treccani.it/vocabolario/provare/'}
};
const CERCAR_FORMS=new Set('cerco cerchi cerca cerchiamo cercate cercano cercavo cercavi cercava cercavamo cercavate cercavano cercato'.split(' '));
const AUXILIARIES=new Set('ho hai ha abbiamo avete hanno avevo avevi aveva avevamo avevate avevano avrò avrai avrà avremo avrete avranno abbia abbiano avessi avesse avessimo aveste avessero avrei avresti avrebbe avremmo avreste avrebbero avere'.split(' '));
function classify(text,targets,infinitives){
 const result=baseline.classify(text,targets,infinitives);
 const tokens=[...text.matchAll(/\p{L}+/gu)].map(m=>({word:m[0].toLowerCase().normalize('NFC'),start:m.index,end:m.index+m[0].length}));
 const adjacent=(a,b)=>a&&b&&/^\s+$/u.test(text.slice(a.end,b.start));
 for(let i=0;i<tokens.length;i++){
  const t=tokens[i],morph=CERCAR_FORMS.has(t.word)&&targets.has('cercare');
  const fresh=['smettere','cominciare','provare'].includes(t.word)&&targets.has(t.word);
  if(!morph&&!fresh)continue;
  const lemma=morph?'cercare':t.word,link=morph?'di':RULES[lemma].link;
  let o=result.find(o=>o.span.start===t.start);
  if(!o){o={lemma,span:{start:t.start,end:t.end},match:'explicit-form-candidate',construction:'unresolved',provisionalSense:'unresolved',labelStatus:'provisional',confidence:'unassessed',flags:[],evidence:[],closerReview:true};result.push(o);}
  o.flags=[];
  let j=i+1;
  if((tokens[j]?.word===link||(link==='a'&&tokens[j]?.word==='ad'))){j++;if(tokens[j]?.word==='non')j++;}
  else j=-1;
  const v=tokens[j];
  if(j>i&&v&&infinitives.has(v.word)&&tokens.slice(i,j).every((x,k)=>adjacent(x,tokens[i+k+1]))){
   o.construction=lemma+'-'+link+'-infinitive';o.provisionalSense=morph?'attempt':RULES[lemma].sense;
   o.evidence=[{start:t.start,end:v.end,complementLemma:v.word,formMatch:'lexicon-headword',embeddedNegation:tokens[j-1]?.word==='non'}];
   o.source=morph?'https://www.treccani.it/vocabolario/cercare/':RULES[lemma].source;
   o.confidence='rule-supported-hypothesis';
  }else o.flags.push('unsupported-complement');
  if(morph){
   o.morphology={lemmaCandidate:'cercare',surface:t.word,method:'explicit-form-table',tenseAndMood:'not-disambiguated',source:'https://it.wiktionary.org/wiki/Appendice:Coniugazioni/Italiano/cercare'};
   const prev=tokens[i-1];
   if(t.word==='cercato'){
    if(adjacent(prev,t)&&AUXILIARIES.has(prev.word))o.morphology.auxiliaryEvidence={surface:prev.word,start:prev.start,end:prev.end};
    else o.flags.push('participle-without-adjacent-supported-auxiliary');
   }
   if(adjacent(prev,t)&&['in','alla','la','una','della','di','il','un','i','dei','gli'].includes(prev.word))o.flags.push('possible-noun-or-mentioned-form');
  }
  if(/["“”«»‘’]|(^|[^\p{L}])'|'($|[^\p{L}])/u.test(text))o.flags.push('quotation-or-unresolved-punctuation');
  if(adjacent(tokens[i-1],t)&&['il','lo','la','i','gli','le','un','uno','una'].includes(tokens[i-1].word))o.flags.push('possible-nominalized-or-mentioned-form');
  o.flags=[...new Set(o.flags)];o.closerReview=o.flags.length>0;
 }
 for(const o of result){o.uncertainty={construction:o.construction==='unresolved'?'unresolved':'provisional',contextualSense:'not-fully-disambiguated',negationScope:'not-assessed',eventOutcome:'not-inferred',editorialValidation:'separate'};}
 return result.sort((a,b)=>a.span.start-b.span.start);
}
module.exports={VERSION,RULES,CERCAR_FORMS,classify};
