'use strict';
const {classify: cercare}=require('./cercare-patterns');
const VERSION='reviewed-constructions-v1';
// Source-backed construction hypotheses; never editorial or sentence-truth judgments.
const RULES={
 potere:{link:null,sense:'modal-possibility',source:'https://www.treccani.it/enciclopedia/verbi-servili_%28La-grammatica-italiana%29/'},
 dovere:{link:null,sense:'modal-necessity',source:'https://www.treccani.it/enciclopedia/verbi-servili_%28La-grammatica-italiana%29/'},
 volere:{link:null,sense:'volition',source:'https://www.treccani.it/enciclopedia/verbi-servili_%28La-grammatica-italiana%29/'},
 riuscire:{link:'a',sense:'manage-to',source:'https://www.treccani.it/vocabolario/riuscire/'},
 continuare:{link:'a',sense:'continue-action',source:'https://www.treccani.it/vocabolario/continuare/'},
 stare:{link:'per',sense:'prospective-action',source:'https://www.treccani.it/vocabolario/stare/'}
};
function classify(text,targets,infinitives){
 const tokens=[...text.matchAll(/\p{L}+/gu)].map(m=>({word:m[0].toLowerCase().normalize('NFC'),start:m.index,end:m.index+m[0].length}));
 const adjacent=(a,b)=>a&&b&&/^\s+$/u.test(text.slice(a.end,b.start));
 let old;
 return tokens.flatMap((t,i)=>{
  if(!targets.has(t.word))return [];
  const o={lemma:t.word,span:{start:t.start,end:t.end},match:'exact-surface',construction:'unresolved',provisionalSense:'unresolved',labelStatus:'provisional',confidence:'unassessed',flags:[],evidence:[],closerReview:true};
  if(t.word==='cercare'){
   old??=cercare(text,infinitives);
   const c=old.occurrences.find(x=>x.span.start===t.start);
   Object.assign(o,{construction:c.construction,provisionalSense:c.provisionalSense,flags:[...c.flags],evidence:c.evidence.map(({text,...e})=>e),source:'https://www.treccani.it/vocabolario/cercare/'});
  }else if(RULES[t.word]){
   const rule=RULES[t.word];let j=i+1;
   if(rule.link){if(tokens[j]?.word!==rule.link){o.flags.push('unsupported-complement');return [o];}j++;}
   if(tokens[j]?.word==='non')j++;
   const v=tokens[j];
   if(v&&infinitives.has(v.word)&&tokens.slice(i,j).every((x,k)=>adjacent(x,tokens[i+k+1]))){
    o.construction=[t.word,rule.link,'infinitive'].filter(Boolean).join('-');o.provisionalSense=rule.sense;o.source=rule.source;
    o.evidence.push({start:t.start,end:v.end,complementLemma:v.word,formMatch:'lexicon-headword',embeddedNegation:tokens[j-1]?.word==='non'});
   }else o.flags.push('unsupported-complement');
  }else o.flags.push('no-supported-rule');
  if(/["“”«»‘’]|(^|[^\p{L}])'|'($|[^\p{L}])/u.test(text))o.flags.push('quotation-or-unresolved-punctuation');
  if(adjacent(tokens[i-1],t)&&['il','lo','la','i','gli','le','un','uno','una'].includes(tokens[i-1].word))o.flags.push('possible-nominalized-or-mentioned-form');
  o.flags=[...new Set(o.flags)];o.closerReview=o.flags.length>0;
  o.confidence=o.construction==='unresolved'?'unassessed':'rule-supported-hypothesis';
  return [o];
 });
}
module.exports={VERSION,RULES,classify};
