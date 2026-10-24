// Build a small, unapproved review fixture from the user's local Tatoeba export.
// Run: node tools/prepare-tatoeba-review.js <path-to-ita_sentences.tsv>
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cheerio = require('cheerio');
const selected = {
 cercare: ['414475','388474','1038430','1086288'],
 sentire: ['409820','617242','672874','957892'],
 militare: ['380644','3432120','3376646','6374218'],
 stare: ['4443','607225','609530','671573'],
 potere: ['632192','671595','903016','4466']
};
function sentenceData(raw) {
 if (!raw) throw Error('Missing public sentence data');
 const start=raw.indexOf('{'); let depth=0,quoted=false,escaped=false;
 for(let i=start;i<raw.length;i++) {
  const c=raw[i];
  if(quoted) {if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;}
  else if(c==='"')quoted=true;
  else if(c==='{')depth++;
  else if(c==='}'&&--depth===0)return JSON.parse(raw.slice(start,i+1));
 }
 throw Error('Incomplete sentence JSON');
}
async function main() {
 if(!process.argv[2])throw Error('Provide the local Italian TSV path');
 const bytes=fs.readFileSync(process.argv[2]);
 const wanted=new Set(Object.values(selected).flat());const local=new Map();
 for(const line of bytes.toString('utf8').split(/\r?\n/)) {
  const [id,lang,text]=line.split('\t'); if(wanted.has(id)) {if(lang!=='ita'||local.has(id))throw Error('Invalid local row '+id);local.set(id,text);}
 }
 if(local.size!==20)throw Error('Expected all 20 selected IDs');
 const cases=[];
 for(const [target,ids] of Object.entries(selected))for(const id of ids) {
  const url='https://tatoeba.org/en/sentences/show/'+id;
  const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('Fetch '+id+': '+response.status);
  const $=cheerio.load(await response.text());
  const data=sentenceData($('[sentence-and-translations]').attr('ng-init'));
  if(String(data.id)!==id||data.lang!=='ita'||data.text!==local.get(id))throw Error('Live/export mismatch '+id);
  if(data.license!=='CC BY 2.0 FR')throw Error('Unexpected license '+id+': '+data.license);
  if(data.correctness<0)throw Error('Source marks sentence unreliable '+id);
  const history=$('body').text().split('\n').map(x=>x.trim()).filter(x=>/^(added|edited|adopted) by /.test(x));
  const contributors=[...new Set(history.map(x=>x.match(/^(?:added|edited|adopted) by (.*?), /)?.[1]).filter(Boolean))];
  if(!contributors.length)throw Error('No attribution history '+id);
  if(data.user?.username&&!contributors.includes(data.user.username))contributors.push(data.user.username);
  cases.push({id:'tatoeba-'+id,target,text:data.text,language:'it',source:{provider:'Tatoeba',sentenceId:Number(id),url,owner:data.user?.username||null,contributors,history,attributionStatus:contributors.includes("an unknown member")?"original-contributor-unidentified-hold-publication":"named-contributors-recorded",license:{identifier:'CC-BY-2.0-FR',url:'https://creativecommons.org/licenses/by/2.0/fr/'},checkedAt:new Date().toISOString(),liveTextMatchesExport:true,sourceCorrectness:data.correctness},changes:'None; original Italian preserved.',review:{status:'pending-human-review',naturalness:null,grammaticalUse:null,construction:null,meaningInContext:null,ambiguity:null,helpfulGuidance:null,decision:null},teacherEvaluation:null});
  console.log('Verified '+id+' ('+target+')');
 }
 const payload={schemaVersion:1,id:'tatoeba-review-001',status:'candidate-review-only',sourceSnapshot:{filename:path.basename(process.argv[2]),bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')},selection:{method:'Hand-selected exact-token examples; four per target, not a random or representative corpus sample.',targets:Object.keys(selected),coverageGaps:['No clear verb use found among the 69 exact militare rows; noun/adjective cases only in this batch.','Inflected forms and broader paragraph context are not covered.'],evaluationBoundary:'Teacher outputs have not been generated for this batch. Establish human judgments before evaluating it; these examples cease to be held-out if used to tune rules.'},cases};
 const root=path.resolve(__dirname,'../prototype-0.5-media-shell');
 const json=path.join(root,'data/research/tatoeba-review-001.json');
 const md=path.join(root,'docs/tatoeba-review-001.md');
 if(fs.existsSync(json)||fs.existsSync(md))throw Error('Refusing to overwrite an existing review batch');
 let guide='# Italian sentence review — batch 001\n\n20 Tatoeba candidates. Nothing is approved or connected to the app. Original Italian is unchanged; teacher outputs have not been generated.\n\nReview the Italian first: naturalness, grammatical use, construction, meaning in context, remaining ambiguity, and useful learner guidance. Record accept/revise/hold separately. English translations are intentionally omitted from this first review.\n\nEach live page matched the local export and reported CC BY 2.0 FR. Credits include named contributors found in the visible addition/edit/adoption history and current owner. The JSON preserves those history lines, per-page check times, source URLs and the source-file SHA-256.\n\nLicense: [CC BY 2.0 France](https://creativecommons.org/licenses/by/2.0/fr/). Source: [Tatoeba](https://tatoeba.org). [Reuse terms](https://tatoeba.org/en/terms_of_use).\n\nCoverage gap: the 69 exact militare matches did not yield a clear verb example. These four cases cover nouns/adjectives; a separately sourced verb case is still needed. Exact headwords also do not evaluate inflected-form coverage.\n';
 for(const [i,c] of cases.entries()) guide+='\n## '+(i+1)+'. '+c.target+' — #'+c.source.sentenceId+'\n\n'+c.text+'\n\nCredit: '+c.source.contributors.join(', ')+' via [Tatoeba sentence #'+c.source.sentenceId+']('+c.source.url+'). CC BY 2.0 FR. Unmodified.\n\nReview: pending.\n';
 guide+='\n## Attribution follow-up\n\nAny record with original-contributor-unidentified-hold-publication must remain unpublished until attribution is resolved or the sentence is replaced. Current ownership does not establish original authorship.\n\n## Review record\n\nThe companion JSON has empty fields for the Italian-first judgments, decision and later teacher evaluation. Keep the original text and attribution intact if proposing an adaptation. This is a targeted review set, not a completed benchmark. Built-in platform TTS remains an unimplemented idea; no audio was downloaded or licensed by this batch.\n';
 fs.writeFileSync(json,JSON.stringify(payload,null,2)+'\n');fs.writeFileSync(md,guide);
 console.log('Saved 20 verified candidates and review guide.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
