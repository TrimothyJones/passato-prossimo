'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const report=JSON.parse(fs.readFileSync(path.join(root,'prototype-0.5-media-shell/data/research/source-lexicon-import-report.json')));
assert(report.complete&&report.validation==='all-records-replayed-against-archive','Validate the import before publishing assets');
const manifest=JSON.parse(fs.readFileSync(path.join(report.directory,'manifest.json')));assert.deepEqual(manifest.identity,report.identity);
const output=path.join(root,'prototype-0.5-media-shell/data/source-lexicon',report.buildId);fs.mkdirSync(output,{recursive:true});
const index={},files=[];let count=0;
for(const chunk of manifest.chunks){const bytes=fs.readFileSync(path.join(report.directory,chunk.file));assert.equal(sha(bytes),chunk.sha256);const rows=JSON.parse(bytes).rows.filter(r=>r.status==='imported').map(r=>({key:r.key,headword:r.source.headword,review:r.review,languageStatus:r.languageStatus,sections:r.sections,supplemental:r.supplemental}));
 const name=chunk.file.replace('.json','.js');for(const [i,row] of rows.entries()){assert(!Object.hasOwn(index,row.key));index[row.key]=[name,i];count++;}
 const content='window.PASSATO_SOURCE_LEXICON.receive('+JSON.stringify(report.buildId)+','+JSON.stringify(name)+','+JSON.stringify(rows).replace(/</g,'\\u003c')+');\n';fs.writeFileSync(path.join(output,name),content);files.push(name);
}
assert.equal(count,report.summary.imported);
const data={version:report.buildId,source:manifest.source,count,index,files};
fs.writeFileSync(path.join(root,'prototype-0.5-media-shell/source-lexicon-index.js'),'window.PASSATO_SOURCE_INDEX='+JSON.stringify(data).replace(/</g,'\\u003c')+';\n');
console.log('Built '+count+' source entries in '+files.length+' lazy chunks; raw HTML excluded.');
