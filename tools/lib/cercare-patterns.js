'use strict';
const VERSION='cercare-patterns-v1';
const LABELS={attempt:'try / attempt an action',seek:'look for / seek something',unresolved:'unresolved'};
const OBJECTS=new Set(['penna','soluzione','casa','chiavi']);
const ARTICLES=new Set(['il','lo','la','i','gli','le','un','uno','una']);
const POSSESSIVES=new Set(['mio','mia','miei','mie','tuo','tua','tuoi','tue','suo','sua','suoi','sue','nostro','nostra','vostro','vostra','loro']);
// Offline trial only: grammar routing never edits editorial review records.
function classify(text,infinitives){
 const tokens=[...text.matchAll(/\p{L}+/gu)].map(m=>({word:m[0].toLowerCase().normalize('NFC'),start:m.index,end:m.index+m[0].length}));
 const adjacent=(a,b)=>a&&b&&/^\s+$/u.test(text.slice(a.end,b.start));
 const occurrences=[];
 for(let index=0;index<tokens.length;index++){
  const token=tokens[index];if(token.word!=='cercare')continue;
  const result={ruleVersion:VERSION,span:{start:token.start,end:token.end},form:{lemma:'cercare',mood:'infinitive',match:'exact-surface'},construction:'unresolved',provisionalSense:'unresolved',labelStatus:'provisional',closerReview:true,flags:[],evidence:[]};
  const flag=reason=>result.flags.push(reason),next=tokens[index+1];
  if(!next||!adjacent(token,next))flag('missing-or-separated-complement');
  else if(next.word==='di'){
   let endIndex=index+2;
   if(tokens[endIndex]?.word==='non'&&adjacent(next,tokens[endIndex]))endIndex++;
   const verb=tokens[endIndex];
   // Explicit approved-example mapping, not general clitic stripping.
   const lemma=verb?.word==='spiegarne'?'spiegare':verb?.word;
   if(verb&&adjacent(tokens[endIndex-1],verb)&&infinitives.has(lemma)){
    result.construction='cercare-di-infinitive';result.provisionalSense='attempt';
    result.evidence.push({start:token.start,end:verb.end,text:text.slice(token.start,verb.end),complementLemma:lemma,formMatch:verb.word===lemma?'lexicon-headword':'explicit-spiegarne-mapping',embeddedNegation:endIndex===index+3});
   }else flag('di-without-supported-infinitive');
  }else{
   let endIndex=index+1;
   if(ARTICLES.has(tokens[endIndex]?.word))endIndex++;
   if(POSSESSIVES.has(tokens[endIndex]?.word))endIndex++;
   const object=tokens[endIndex];
   const connected=tokens.slice(index,endIndex).every((t,offset)=>adjacent(t,tokens[index+offset+1]));
   if(object&&connected&&OBJECTS.has(object.word)){
    result.construction='cercare-object';result.provisionalSense='seek';
    result.evidence.push({start:token.start,end:object.end,text:text.slice(token.start,object.end),object:object.word});
   }else flag('unsupported-object-or-structure');
  }
  if(/["“”«»‘’]|(^|[^\p{L}])'|'($|[^\p{L}])/u.test(text))flag('quotation-or-unresolved-punctuation');
  if(tokens[index-1]&&adjacent(tokens[index-1],token)&&ARTICLES.has(tokens[index-1].word))flag('possible-nominalized-or-mentioned-infinitive');
  result.closerReview=result.flags.length>0;occurrences.push(result);
 }
 return {ruleVersion:VERSION,occurrences,groups:[...new Set(occurrences.map(o=>o.provisionalSense))],closerReview:occurrences.some(o=>o.closerReview),applicable:occurrences.length>0};
}
module.exports={VERSION,LABELS,classify};
