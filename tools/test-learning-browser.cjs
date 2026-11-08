'use strict';
// Run with Node; uses Electron's real IndexedDB in an isolated temporary profile.
const path=require('node:path'),fs=require('node:fs');
if(!process.versions.electron){
 const {spawnSync}=require('node:child_process');const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 const result=spawnSync(require('electron'),[__filename],{stdio:'inherit',env,windowsHide:true});
 if(result.error)console.error(result.error);process.exit(result.status??1);
}else{
 const {app,BrowserWindow}=require('electron'),os=require('node:os');
 const root=path.resolve(__dirname,'..');const profile=fs.mkdtempSync(path.join(os.tmpdir(),'passato-learning-test-'));app.setPath('userData',profile);
 app.on('window-all-closed',()=>{});
 app.whenReady().then(async()=>{let server;try{
  server=require('./serve-mobile').createMobileServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
  const win=new BrowserWindow({show:false,webPreferences:{partition:'persist:store-tests'}});await win.loadURL(origin+'/learning/learning-store.js');
  await win.webContents.executeJavaScript(fs.readFileSync(path.join(root,'learning/learning-store.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'tests/learning-store.browser.js'),'utf8'));
  console.log(await win.webContents.executeJavaScript('runLearningStoreBrowserTests()'));win.destroy();
  const ui=new BrowserWindow({show:false,width:1360,height:900,webPreferences:{partition:'persist:integration-tests'}});await ui.loadURL(origin+'/learning/learning-store.js');
  await ui.webContents.executeJavaScript(`localStorage.setItem('prototype03LemmaModel',JSON.stringify({cercare:{status:'shaky',confidence:.55}}));localStorage.setItem('passato-practice-collection-v1',JSON.stringify([{sentence:'Cerco di capire.',title:'Keep me'}]));`);
  await ui.loadURL(origin+'/prototype-0.5-media-shell/index.html');
  await ui.webContents.executeJavaScript('ensureLearningReady()');await new Promise(r=>setTimeout(r,250));
  console.log(await ui.webContents.executeJavaScript(`(async()=>{
   const check=(v,m)=>{if(!v)throw Error(m)};await openBook('teacher-modern-trial');
   check(lemmaModel.cercare.status==='shaky','Legacy UI migration');check(loadPracticeCollection().length===1,'Practice collection preserved');
   const idx=activeAnalysis.rows.findIndex(r=>r.token==='cercare');const row=activeAnalysis.rows[idx];showWordLens(idx,document.querySelector('[data-row="'+idx+'"]'));
   // A later read transaction waits behind the actual lookup write.
   await new Promise(r=>setTimeout(r,100));check((await learningStore.getWord('cercare')).encounterCount===1,'Word Lens encounter');
   const paneCount=(await learningStore.listEncounters()).length;
   document.querySelector('#wordLens [data-study-view="teacher"]').click();
   check(!document.querySelector('#breakdownPanel').hidden,'Teacher tab opens');
   document.querySelector('#breakdownPanel [data-study-view="word"]').click();
   check(!document.querySelector('#wordLens').hidden,'Word Lens tab returns');
   check((await learningStore.listEncounters()).length===paneCount,'Tabs do not inflate encounters');
   const width=document.querySelector('#wordLens .study-pane-size input');width.value='500';width.dispatchEvent(new Event('input'));
   check(document.querySelector('.reader-layout').style.getPropertyValue('--study-pane-width')==='500px','Resize applied');
   check(!document.querySelector('#wordLens .study-word-details').open,'Details initially collapsed');
   const rating=document.querySelector('[data-status="known"]');rating.click();await new Promise(r=>setTimeout(r,150));check((await learningStore.getWord('cercare')).status==='known'&&lemmaModel.cercare.status==='known','Status UI committed');
   showBreakdown('word',idx,document.querySelector('[data-row="'+idx+'"]'));await new Promise(r=>setTimeout(r,100));document.querySelector('[data-breakdown-status="shaky"]').click();await new Promise(r=>setTimeout(r,150));
   check((await learningStore.listReviews('cercare')).length===2,'Both rating paths persisted');
   const before=(await learningStore.listEncounters()).length;showBreakdown('sentence',0,document.querySelector('.sentence-span'));await new Promise(r=>setTimeout(r,100));check((await learningStore.listEncounters()).length===before,'Sentence opening does not count all words');
   const inspector=[...document.querySelectorAll('[data-teacher-word]')].find(b=>b.textContent==='cercare');inspector.click();await new Promise(r=>setTimeout(r,100));check((await learningStore.listEncounters()).length===before+1,'Inspector encounter');
   const original=learningStore.setStatus;learningStore.setStatus=async()=>{throw Error('failure injection');};showWordLens(idx,document.querySelector('[data-row="'+idx+'"]'));await markLearningStatus(row,'unknown',document.querySelector('[data-status="unknown"]'));check(lemmaModel.cercare.status==='shaky','Failed save preserves rating');check(document.querySelector('.learning-storage-status').textContent.includes('not saved'),'Visible save failure');learningStore.setStatus=original;
   check((await learningStore.getWord('cercare')).status==='shaky','Failure leaves database unchanged');
   await recordLearningEncounter({token:'novissimotest',lemma:'novissimotest'},'test');check(!lemmaModel.novissimotest,'Unassessed lookup leaves model unchanged');
   return 'App: legacy migration, Word Lens/Teacher ratings, scoped encounters, saved practice preservation and visible failure PASS';
  })()`));
  await ui.loadURL(origin+'/prototype-0.5-media-shell/index.html');await ui.webContents.executeJavaScript('ensureLearningReady()');
  console.log(await ui.webContents.executeJavaScript(`(()=>{if(lemmaModel.cercare.status!=='shaky'||lemmaModel.novissimotest)throw Error('Reload hydration');return 'Reload: durable ratings restored; unassessed encounters excluded PASS';})()`));
  // The mobile entry point shares storage on this origin and loads the same provider.
  await ui.loadURL(origin+'/mobile/');await ui.webContents.executeJavaScript('ensureLearningReady()');console.log(await ui.webContents.executeJavaScript(`(()=>{if(!window.PASSATO_LEARNING_STORE||lemmaModel.cercare.status!=='shaky')throw Error('Mobile integration');return 'Mobile entry: provider and existing ratings PASS';})()`));
  if(process.env.PASSATO_STUDY_SCREENSHOT==='1') {
    ui.setSize(1360,900);await new Promise(r=>setTimeout(r,400));await ui.webContents.executeJavaScript('openBook("teacher-modern-trial")');
    await ui.webContents.executeJavaScript('showWordLens(activeAnalysis.rows.findIndex(r=>r.token==="cercare"));');
    await new Promise(r=>setTimeout(r,300));fs.mkdirSync(path.join(root,'tmp'),{recursive:true});fs.writeFileSync(path.join(root,'tmp/study-pane.png'),(await ui.webContents.capturePage()).toPNG());
  }
  ui.destroy();server.close();app.exit(0);
 }catch(error){console.error(error);server?.close();app.exit(1);}});
}
