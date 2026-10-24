'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const lens=require('../prototype-0.5-media-shell/reviewed-word-lens');
const {key}=require('./plan-lexical-batch');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function openStore(directory){
 const manifest=JSON.parse(fs.readFileSync(path.join(directory,'manifest.json')));assert(manifest.complete,'Incomplete source build');
 const bytes=fs.readFileSync(path.join(directory,'lookup.json'));assert.equal(sha(bytes),manifest.artifacts['lookup.json'],'Corrupt lookup index');const index=JSON.parse(bytes);
 let cachedName,cachedRows;
 return {lookup(token){const k=key(token);if(!Object.hasOwn(index,k))return null;const ref=index[k],chunk=manifest.chunks.find(c=>c.file===ref.chunk);assert(chunk&&/^chunk-\d{4}\.json$/.test(ref.chunk),'Invalid chunk reference');
  if(cachedName!==ref.chunk){const bytes=fs.readFileSync(path.join(directory,ref.chunk));assert.equal(sha(bytes),chunk.sha256,'Corrupt source chunk');cachedRows=JSON.parse(bytes).rows;cachedName=ref.chunk;}
  const row=cachedRows[ref.row];assert(row?.key===k&&row.status==='imported','Invalid row reference');return structuredClone({row,source:manifest.source});
 }};
}
function resolve(store,reviewed,token,fallback=''){
 const accepted=lens.resolve(reviewed,token,fallback);if(accepted.reviewed)return {layer:'reviewed',evidence:accepted};
 const entry=store.lookup(token);if(entry)return {layer:'source-dictionary',...entry,interpretation:{status:'unresolved',selectedSenseId:null},notice:'Dictionary meanings; not a sentence-specific interpretation.'};
 return {layer:'legacy-fallback',evidence:accepted};
}
module.exports={openStore,resolve};
