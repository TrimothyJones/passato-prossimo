const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const prototypeDir = path.resolve(__dirname, "..");
const projectDir = path.resolve(prototypeDir, "..");
const languageDir = path.join(projectDir, "prototype-0.3-assisted-reader");

const elementStub = {
  innerHTML: "",
  hidden: false,
  textContent: "",
  value: "",
  style: { setProperty() {} },
  classList: { add() {}, remove() {}, toggle() {} },
  addEventListener() {},
  querySelector() { return elementStub; },
  querySelectorAll() { return []; },
  removeAttribute() {},
  setAttribute() {},
  scrollIntoView() {},
  getBoundingClientRect() {
    return { top: 0, right: 900, bottom: 700, left: 200, width: 700, height: 700 };
  }
};

const storage = new Map();
const context = vm.createContext({
  console,
  URL,
  Intl,
  document: { querySelector() { return elementStub; } },
  localStorage: {
    getItem(key) { return storage.get(key) ?? null; },
    setItem(key, value) { storage.set(key, String(value)); }
  },
  window: {
    addEventListener() {},
    setInterval,
    clearInterval,
    setTimeout,
    clearTimeout,
    innerHeight: 800,
    innerWidth: 1280,
    scrollX: 0,
    scrollY: 0,
    speechSynthesis: { getVoices() { return []; }, addEventListener() {}, cancel() {} },
    SpeechSynthesisUtterance: class {}
  }
});

context.window.window = context.window;
context.window.document = context.document;
context.window.localStorage = context.localStorage;

for (const script of [
  path.join(projectDir, "src", "books.js"),
  path.join(projectDir, "prototype-0.2-lexical-coverage", "lexicon.js"),
  path.join(languageDir, "paisa-frequency.js"),
  path.join(languageDir, "learner-enrichment.js"),
  path.join(languageDir, "dictionary-overflow.js"),
  path.join(languageDir, "context-markers.js"),
  path.join(languageDir, "accent-rules.js"),
  path.join(languageDir, "elision-rules.js"),
  path.join(projectDir, "prototype-0.2-lexical-coverage", "core-dictionary.js"),
  path.join(prototypeDir, "platform-adapter.js"),
  path.join(prototypeDir, "reader-dict-en-trial.js"),
  path.join(prototypeDir, "word-lens-trial.js"),
  path.join(prototypeDir, "app.js")
]) {
  vm.runInContext(fs.readFileSync(script, "utf8"), context, { filename: script });
}

const result = vm.runInContext(`
  (() => {
    const calls = [];
    const nativeListeners = new Map();
    const normalizedEvents = [];
    const media = {
      src: "",
      currentTime: 12,
      duration: 100,
      volume: 1,
      playbackRate: 1,
      paused: true,
      error: null,
      addEventListener(name, handler) {
        if (!nativeListeners.has(name)) nativeListeners.set(name, new Set());
        nativeListeners.get(name).add(handler);
      },
      removeEventListener(name, handler) { nativeListeners.get(name)?.delete(handler); },
      removeAttribute(name) { if (name === "src") this.src = ""; },
      fire(name) { for (const handler of nativeListeners.get(name) || []) handler({ target: this }); },
      load() { calls.push("load"); },
      play() { calls.push("play"); this.paused = false; return Promise.resolve(); },
      pause() { calls.push("pause"); this.paused = true; }
    };
    const stage = { requestFullscreen() { calls.push("fullscreen"); } };
    const provider = createHtmlMediaProvider(media, stage);
    for (const eventName of ["ready", "time", "state", "error", "surface-interaction"]) {
      provider.on(eventName, detail => normalizedEvents.push({ eventName, detail }));
    }
    provider.load("blob:local-video");
    media.fire("loadedmetadata");
    media.currentTime = 25;
    media.fire("timeupdate");
    media.fire("play");
    media.fire("waiting");
    media.fire("pause");
    media.fire("ended");
    media.fire("click");
    media.error = { code: 4, message: "Unsupported media test" };
    media.fire("error");
    provider.seekTo(150);
    provider.setVolume(0.45);
    provider.setPlaybackRate(1.25);
    provider.pause();
    provider.requestFullscreen();
    const sourceBeforeUnload = media.src;
    provider.unload();
    const cues = buildMockTranscript(100);
    const youtubeRestingSource = buildYouTubeRestingSource(parseYouTubeVideoUrl("https://youtu.be/M7lc1UVf-VE"));
    return {
      providerId: provider.id,
      providerKind: provider.kind,
      contractVersion: provider.contractVersion,
      capabilities: provider.capabilities,
      source: sourceBeforeUnload,
      sourceAfterUnload: media.src,
      currentTime: provider.currentTime(),
      volume: media.volume,
      rate: media.playbackRate,
      calls,
      cues,
      activeCue: activeTranscriptCue(cues, 50),
      markup: renderMediaTranscript(cues),
      longTime: formatMediaTime(3661),
      directUrl: validateDirectMediaUrl("https://media.example.com/audio/lezione.mp3#time").toString(),
      directName: mediaNameFromUrl(new URL("https://media.example.com/audio/lezione%20uno.mp3")),
      audioMatch: looksLikeAudioSource("lezione.MP3"),
      youtubeRestingSource,
      youtubeUrls: [
        "https://www.youtube.com/watch?v=M7lc1UVf-VE",
        "https://youtu.be/M7lc1UVf-VE?si=share-token",
        "https://www.youtube.com/shorts/M7lc1UVf-VE",
        "https://www.youtube.com/live/M7lc1UVf-VE?feature=share",
        "https://www.youtube.com/embed/M7lc1UVf-VE",
        "https://www.youtube-nocookie.com/embed/M7lc1UVf-VE"
      ].map(parseYouTubeVideoUrl),
      nonYoutubeUrl: parseYouTubeVideoUrl("https://notyoutube.com/watch?v=M7lc1UVf-VE"),
      playlistError: (() => {
        try { parseYouTubeVideoUrl("https://www.youtube.com/playlist?list=PL123"); }
        catch (error) { return error.message; }
        return "";
      })(),
      malformedYoutubeError: (() => {
        try { parseYouTubeVideoUrl("https://youtu.be/too-short"); }
        catch (error) { return error.message; }
        return "";
      })(),
      youtubePlayerErrors: [2, 5, 100, 101, 150, 153, 999].map(normalizeYouTubePlayerError),
      youtubeError: (() => {
        try { validateDirectMediaUrl("https://www.youtube.com/watch?v=abc"); }
        catch (error) { return error.message; }
        return "";
      })(),
      privateError: (() => {
        try { validateDirectMediaUrl("http://127.0.0.1/audio.mp3"); }
        catch (error) { return error.message; }
        return "";
      })(),
      normalizedEvents,
      eventCountBeforeDestroy: normalizedEvents.length,
      eventCountAfterDestroy: (() => {
        provider.destroy();
        media.fire("timeupdate");
        media.fire("play");
        return normalizedEvents.length;
      })()
    };
  })();
`, context);

assert.equal(result.providerId, "html-media-v1");
assert.equal(result.providerKind, "direct-or-local-media");
assert.equal(result.contractVersion, 2);
assert.equal(result.capabilities.volume, true);
assert.equal(result.capabilities.playbackRate, true);
assert.equal(result.capabilities.fullscreen, true);
assert.equal(result.capabilities.surfaceInteraction, true);
assert.deepEqual([...result.capabilities.playbackRates], [0.75, 1, 1.25, 1.5]);
assert.equal(result.source, "blob:local-video");
assert.equal(result.sourceAfterUnload, "");
assert.equal(result.currentTime, 100);
assert.equal(result.volume, 0.45);
assert.equal(result.rate, 1.25);
assert.deepEqual([...result.calls], ["load", "pause", "fullscreen", "pause", "load"]);
assert.equal(result.cues.length, 5);
assert.equal(result.activeCue.id, "mock-cue-3");
assert.match(result.markup, /media-transcript-cue/);
assert.match(result.markup, /Oggi proviamo/);
assert.equal(result.longTime, "1:01:01");
assert.equal(result.directUrl, "https://media.example.com/audio/lezione.mp3");
assert.equal(result.directName, "lezione uno.mp3");
assert.equal(result.audioMatch, true);
assert.equal(result.youtubeRestingSource.title, "YouTube video");
assert.equal(result.youtubeRestingSource.videoId, "M7lc1UVf-VE");
assert.equal(result.youtubeRestingSource.format, "short-link");
assert.equal(result.youtubeRestingSource.canonicalUrl, "https://www.youtube.com/watch?v=M7lc1UVf-VE");
assert.equal(result.youtubeRestingSource.thumbnailUrl, "https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg");
assert.equal(result.youtubeUrls.length, 6);
assert.deepEqual([...result.youtubeUrls].map(source => source.videoId), Array(6).fill("M7lc1UVf-VE"));
assert.deepEqual([...result.youtubeUrls].map(source => source.format), ["watch", "short-link", "shorts", "live", "embed", "embed"]);
assert.ok([...result.youtubeUrls].every(source => source.canonicalUrl === "https://www.youtube.com/watch?v=M7lc1UVf-VE"));
assert.equal(result.nonYoutubeUrl, null);
assert.match(result.playlistError, /does not point to one video/);
assert.match(result.malformedYoutubeError, /malformed or incomplete/);
assert.deepEqual([...result.youtubePlayerErrors].map(error => error.kind), [
  "invalid-request",
  "playback-failed",
  "video-unavailable",
  "embedding-blocked",
  "embedding-blocked",
  "client-identity-missing",
  "unknown-player-error"
]);
assert.match(result.youtubePlayerErrors[5].message, /verify this desktop app/);
assert.match(result.youtubeError, /YouTube provider/);
assert.match(result.privateError, /private-network/);
assert.deepEqual([...result.normalizedEvents].map(event => event.eventName), [
  "ready", "time", "state", "state", "state", "state", "surface-interaction", "error"
]);
assert.deepEqual([...result.normalizedEvents].filter(event => event.eventName === "state").map(event => event.detail.state), [
  "playing", "buffering", "paused", "ended"
]);
assert.equal(result.normalizedEvents[0].detail.duration, 100);
assert.equal(result.normalizedEvents[1].detail.currentTime, 25);
assert.equal(result.normalizedEvents.at(-1).detail.code, 4);
assert.equal(result.normalizedEvents.at(-1).detail.message, "Unsupported media test");
assert.equal(result.eventCountAfterDestroy, result.eventCountBeforeDestroy);

const youtubeProviderResult = vm.runInContext(`
  (() => {
    const calls = [];
    const events = [];
    let playerOptions = null;
    const fakePlayer = {
      currentTime: 12,
      duration: 120,
      playVideo() { calls.push("play"); },
      pauseVideo() { calls.push("pause"); },
      stopVideo() { calls.push("stop"); },
      cueVideoById(id) { calls.push(["cue", id]); },
      seekTo(seconds, allowSeekAhead) { this.currentTime = seconds; calls.push(["seek", seconds, allowSeekAhead]); },
      setVolume(value) { calls.push(["volume", value]); },
      setPlaybackRate(value) { calls.push(["rate", value]); },
      getCurrentTime() { return this.currentTime; },
      getDuration() { return this.duration; },
      destroy() { calls.push("destroy"); }
    };
    function FakePlayer(_mount, options) {
      playerOptions = options;
      return fakePlayer;
    }
    const stage = { requestFullscreen() { calls.push("fullscreen"); } };
    const provider = createYouTubeMediaProvider({
      mount: {},
      stage,
      videoId: "M7lc1UVf-VE",
      youtubeApi: { Player: FakePlayer }
    });
    for (const eventName of ["ready", "time", "state", "error"]) {
      provider.on(eventName, detail => events.push({ eventName, detail }));
    }
    playerOptions.events.onReady({ target: fakePlayer });
    playerOptions.events.onStateChange({ data: 1 });
    provider.seekTo(200);
    provider.setVolume(0.42);
    provider.setPlaybackRate(1.25);
    provider.play();
    provider.pause();
    provider.requestFullscreen();
    provider.load("dQw4w9WgXcQ");
    playerOptions.events.onStateChange({ data: 3 });
    playerOptions.events.onStateChange({ data: 0 });
    playerOptions.events.onError({ data: 153 });
    playerOptions.events.onAutoplayBlocked();
    const snapshot = {
      id: provider.id,
      kind: provider.kind,
      contractVersion: provider.contractVersion,
      capabilities: provider.capabilities,
      currentTime: provider.currentTime(),
      duration: provider.duration(),
      paused: provider.isPaused(),
      playerVars: playerOptions.playerVars,
      stateMap: [-1, 0, 1, 2, 3, 5, 99].map(normalizeYouTubePlayerState),
      events: events.slice(),
      calls: calls.slice()
    };
    provider.unload();
    provider.destroy();
    snapshot.finalCalls = calls.slice();
    return snapshot;
  })();
`, context);

assert.equal(youtubeProviderResult.id, "youtube-iframe-v1");
assert.equal(youtubeProviderResult.kind, "youtube-video");
assert.equal(youtubeProviderResult.contractVersion, 2);
assert.equal(youtubeProviderResult.capabilities.surfaceInteraction, false);
assert.equal(youtubeProviderResult.currentTime, 120);
assert.equal(youtubeProviderResult.duration, 120);
assert.equal(youtubeProviderResult.paused, true);
assert.equal(youtubeProviderResult.playerVars.controls, 1);
assert.equal(youtubeProviderResult.playerVars.playsinline, 1);
assert.equal(youtubeProviderResult.playerVars.enablejsapi, 1);
assert.equal(youtubeProviderResult.playerVars.widget_referrer, "https://com.passatoprossimo.immersion/");
assert.deepEqual([...youtubeProviderResult.events].filter(event => event.eventName === "state").map(event => event.detail.state), [
  "paused", "playing", "buffering", "ended", "paused"
]);
assert.equal([...youtubeProviderResult.events].find(event => event.eventName === "error")?.detail.kind, "client-identity-missing");
assert.equal([...youtubeProviderResult.events].filter(event => event.eventName === "error").at(-1)?.detail.kind, "autoplay-blocked");
assert.deepEqual(JSON.parse(JSON.stringify(youtubeProviderResult.calls)), [
  ["seek", 120, true],
  ["volume", 42],
  ["rate", 1.25],
  "play",
  "pause",
  "fullscreen",
  ["cue", "dQw4w9WgXcQ"]
]);
assert.deepEqual(JSON.parse(JSON.stringify(youtubeProviderResult.finalCalls)).slice(-2), ["stop", "destroy"]);
assert.deepEqual([...youtubeProviderResult.stateMap], [
  "paused", "ended", "playing", "paused", "buffering", "paused", null
]);

console.table([{
  provider: result.providerId,
  duration: 100,
  cues: result.cues.length,
  activeAt50Seconds: result.activeCue.id,
  formattedHour: result.longTime
}]);

const mediaShellSource = fs.readFileSync(path.join(prototypeDir, "app.js"), "utf8");
vm.runInContext(`activeBook = {id:'trial-test'}; activeAnalysis = analyzeSection('di fare tempo casa'); showWordLens(0);`, context);
assert.match(elementStub.innerHTML, /More dictionary meanings · 11/);
assert.match(elementStub.innerHTML, /CC BY-SA 4.0/);
vm.runInContext('showWordLens(1)', context);
assert.match(elementStub.innerHTML, /More dictionary meanings · 46/);
vm.runInContext('showWordLens(2)', context);
assert.match(elementStub.innerHTML, /More dictionary meanings · 6/);
vm.runInContext('showWordLens(3)', context);
assert.doesNotMatch(elementStub.innerHTML, /More dictionary meanings/);
vm.runInContext('window.PASSATO_WORD_LENS_TRIAL = undefined; showWordLens(0)', context);
assert.doesNotMatch(elementStub.innerHTML, /More dictionary meanings/);
assert.match(mediaShellSource, /media-resting-thumbnail/);
assert.match(mediaShellSource, /Open on YouTube/);
assert.match(mediaShellSource, /Sources &amp; licenses/);
assert.match(mediaShellSource, /mik3ml\/italian-dictionary/);
assert.match(mediaShellSource, /CC BY-NC-SA 3\.0/);
assert.doesNotMatch(mediaShellSource, /<iframe\b/i);

// Exercise the actual reader with the reviewed provider, not only its renderer.
for (const name of ['reviewed-verbs-data.js', 'reviewed-word-lens.js']) {
  vm.runInContext(fs.readFileSync(path.join(prototypeDir,name),'utf8'),context,{filename:name});
}
const beforeCore=JSON.stringify(context.window.CORE_ITALIAN_DICTIONARY);
for (const entry of context.window.PASSATO_REVIEWED_VERBS.entries) {
  vm.runInContext(`activeAnalysis = analyzeSection(${JSON.stringify(entry.headword)}); showWordLens(0);`,context);
  for(const definition of entry.groups?.length?entry.groups.map(g=>g.definition):[entry.definition]) assert(elementStub.innerHTML.includes(definition.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')));
  assert.match(elementStub.innerHTML,/Original meanings and dictionary details/);
}
vm.runInContext("activeAnalysis = analyzeSection('Voglio fare una pizza.'); showWordLens(1);",context);
assert.match(elementStub.innerHTML,/<dt>Verb meaning<\/dt><dd>to do; to make<\/dd>/);
assert.match(elementStub.innerHTML,/Source verb senses · 45/);
vm.runInContext("activeAnalysis = analyzeSection('cercare'); showWordLens(0);",context);
assert.match(elementStub.innerHTML,/Reviewed verb meaning/);
vm.runInContext("activeAnalysis = analyzeSection('ribellare'); showWordLens(0);",context);
assert.doesNotMatch(elementStub.innerHTML,/Reviewed verb meaning/);
vm.runInContext("window.PASSATO_REVIEWED_VERBS = undefined; activeAnalysis = analyzeSection('fare'); showWordLens(0);",context);
assert.doesNotMatch(elementStub.innerHTML,/Reviewed verb meaning/);
assert.equal(JSON.stringify(context.window.CORE_ITALIAN_DICTIONARY),beforeCore);
console.log('Word Lens reviewed-provider integration: PASS');

// Passage diagnostics exercise the real tokenizer and Word Lens rendering.
vm.runInContext(fs.readFileSync(path.join(prototypeDir,'reviewed-verbs-data.js'),'utf8'),context);
const passageFixtures=JSON.parse(fs.readFileSync(path.join(prototypeDir,'data/research/verbs-001-passages.json'),'utf8'));
const passageCoverage=new Set();
const passageResults=[];
for(const passage of passageFixtures.cases){
  context.passageText=passage.text;
  vm.runInContext('activeAnalysis=analyzeSection(passageText)',context);
  for(const target of passage.targets){
    context.targetToken=target;
    const index=vm.runInContext('activeAnalysis.rows.findIndex(r=>r.token.toLowerCase()===targetToken.toLowerCase())',context);
    assert(index>=0,passage.id+': missing token '+target);
    vm.runInContext('showWordLens('+index+')',context);
    const accepted=context.window.PASSATO_REVIEWED_VERBS.entries.find(e=>e.headword===target);
    assert(accepted,target);
    assert(elementStub.innerHTML.includes(accepted.definition.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')),passage.id+': gloss missing');
    assert.match(elementStub.innerHTML,/Original meanings and dictionary details/);
    passageCoverage.add(target);
  }
}
assert.equal(passageCoverage.size,49,'All accepted headwords must occur in a passage');
for(const probe of passageFixtures.probes){
  context.passageText=probe.text; context.targetToken=probe.token;
  const index=vm.runInContext('activeAnalysis=analyzeSection(passageText); activeAnalysis.rows.findIndex(r=>r.token.toLowerCase()===targetToken.toLowerCase())',context);
  assert(index>=0,probe.id);
  vm.runInContext('showWordLens('+index+')',context);
  const reviewed=elementStub.innerHTML.includes('Reviewed verb meaning');
  assert.equal(reviewed,!['held','form-gap'].includes(probe.assessment),probe.id);
  if(probe.id==='passare-time')assert.match(elementStub.innerHTML,/spend \(time\)/);
  if(probe.id==='realizzare-awareness')assert.match(elementStub.innerHTML,/English-influenced meaning/);
  passageResults.push({case:probe.id,reviewedOverlay:reviewed,assessment:probe.assessment});
}
console.table(passageResults);
console.log('Passage diagnostics: 49 headwords across '+passageFixtures.cases.length+' passages; '+passageFixtures.probes.length+' context/form probes. Rendering PASS; semantic limitations remain explicitly recorded.');

// New batch: exercise both constructions and all grouped uses in sentences.
for(const [text,word,expected] of [
 ['Devo cercare le chiavi.','cercare','Two common constructions'],
 ['Voglio cercare di capire.','cercare','trying to understand'],
 ['Devo registrare il pagamento.','registrare','Written records'],
 ['Voglio registrare un video.','registrare','Audio/video'],
 ['Preferisco giocare a calcio.','giocare','musical instrument'],
 ['Non voglio occupare tutto lo spazio.','occupare','Occuparsi di'],
 ['Posso sentire un rumore.','sentire','Hearing:'],
 ['Comincio a sentire freddo.','sentire','Feeling:'],
 ['Il servizio militare dura un anno.','militare','adjective'],
 ['Un militare aspetta fuori.','militare','noun'],
 ['Vuole militare in un partito.','militare','verb']
]){
 context.passageText=text;context.targetToken=word;
 const idx=vm.runInContext('activeAnalysis=analyzeSection(passageText);activeAnalysis.rows.findIndex(r=>r.token===targetToken)',context);assert(idx>=0);
 vm.runInContext('showWordLens('+idx+')',context);assert(elementStub.innerHTML.includes(expected),word);
 if(word==='militare'){assert.match(elementStub.innerHTML,/Meanings by use/);assert.match(elementStub.innerHTML,/no use has been selected/);assert.match(elementStub.innerHTML,/service member/);}
}
console.log('Batch two sentence integration: required notes and unranked grammatical alternatives PASS');

// Shared evidence must preserve reviewed records through Breakdown and teacher requests.
const originalReviewed = JSON.stringify(context.window.PASSATO_REVIEWED_VERBS);
for (const entry of context.window.PASSATO_REVIEWED_VERBS.entries) {
  context.targetToken = entry.headword;
  const actual = vm.runInContext(`(() => {
    activeAnalysis = analyzeSection(targetToken);
    const row = activeAnalysis.rows[0];
    row.entry = {...row.entry, meaning: 'STALE CORE MEANING'};
    const evidence = wordEvidenceForBreakdown(row);
    const sentence = activeAnalysis.sentences[0];
    const request = buildTeacherRequest({scope:'word', row, sentence, sentenceIndex:0,
      phrases:[], emotion:sentence.emotion, wordEvidence:evidence});
    showBreakdown('word', 0);
    return {evidence, request, simulated:simulateTeacherResponse(request)};
  })()`,context);
  const expected = entry.groups.length ? entry.groups.map(g=>g.pos+(g.label?.text?' · '+g.label.text:'')+': '+g.definition.text).join('; ') : entry.definition.text;
  assert.equal(actual.evidence.englishMeaning,expected,entry.headword);
  assert.equal(actual.request.contractVersion,3);
  assert.equal(actual.request.localEvidence.meaning,expected);
  assert.equal(JSON.stringify(actual.request.localEvidence.lexical[0].evidence.reviewed),JSON.stringify(entry));
  assert.equal(actual.evidence.lexical.interpretation.selectedSenseId,null);
  assert.equal(actual.evidence.lexical.interpretation.selectedPos,null);
  assert.match(elementStub.innerHTML,/Reviewed meaning guide and sources/);
  assert.doesNotMatch(elementStub.innerHTML,/Here it most likely means|STALE CORE MEANING/);
  assert.match(actual.simulated.english,/does not select/);
}
assert.equal(JSON.stringify(context.window.PASSATO_REVIEWED_VERBS),originalReviewed);
const scoped = vm.runInContext(`(() => {
  activeAnalysis = analyzeSection('Voglio cercare di capire. Posso sentire un rumore.');
  const sentence=activeAnalysis.sentences[0];
  const request=buildTeacherRequest({scope:'sentence',sentence,sentenceIndex:0,phrases:[],emotion:sentence.emotion});
  const oldRequest={...request,contractVersion:1};
  const before=teacherCacheKey(request);
  const accepted=request.localEvidence.lexical.find(e=>e.token==='cercare');
  accepted.evidence.reviewed.notes[0].text='Changed only in request';
  return {request, oldKey:teacherCacheKey(oldRequest), before, after:teacherCacheKey(request)};
})()`,context);
assert(scoped.request.localEvidence.lexical.some(e=>e.token==='cercare'));
assert(!scoped.request.localEvidence.lexical.some(e=>e.token==='sentire'));
assert.notEqual(scoped.before,scoped.after,'Evidence updates must invalidate teacher cache');
assert.notEqual(scoped.before,scoped.oldKey,'Old contract cache must not win');
assert.equal(JSON.stringify(context.window.PASSATO_REVIEWED_VERBS),originalReviewed,'Request must not mutate provider');
for(const token of ['ribellare','ribellarsi','faccio']) {
 context.targetToken=token;
 const evidence=vm.runInContext('activeAnalysis=analyzeSection(targetToken);wordEvidenceForBreakdown(activeAnalysis.rows[0])',context);
 assert.equal(evidence.lexical.reviewed,null,token);
 assert.equal(evidence.englishMeaning,evidence.lexical.fallback.meaning);
}
const fallback=vm.runInContext(`(() => {
 const api=window.PASSATO_REVIEWED_WORD_LENS;
 try {
   window.PASSATO_REVIEWED_WORD_LENS=undefined;
   activeAnalysis=analyzeSection('fare');
   return wordEvidenceForBreakdown(activeAnalysis.rows[0]);
 } finally {window.PASSATO_REVIEWED_WORD_LENS=api;}
})()`,context);
assert.equal(fallback.lexical.reviewed,null);
assert(fallback.englishMeaning);
const hostile=vm.runInContext(`(() => {
 const lexical=lexicalEvidenceForRow({token:'fare'});
 lexical.reviewed.source.attribution='<img src=x onerror=alert(1)>';
 lexical.reviewed.notes[0]={title:'<script>',text:'<img src=x>',examples:[]};
 return renderBreakdownLexicalEvidence(lexical);
})()`,context);
assert.doesNotMatch(hostile,/<img|<script>/);
assert.match(hostile,/&lt;img/);
console.log('Shared lexical evidence: all 149 entries, provenance, unresolved senses, sentence scope, cache invalidation, fallback and escaping PASS');

// Teacher guides use reviewed distinctions without inventing a contextual choice.
const teacherCases = [
 ['Voglio cercare di capire.', 'cercare', 'trying to understand'],
 ['Devo cercare le chiavi.', 'cercare', 'Two common constructions'],
 ['Voglio stare a casa.', 'stare', 'stare'],
 ['Posso sentire un rumore.', 'sentire', 'Hearing:'],
 ['Comincio a sentire freddo.', 'sentire', 'Feeling:'],
 ['Il potere cambia.', 'potere', 'potere'],
 ['Il servizio militare dura un anno.', 'militare', 'adjective'],
 ['Un militare aspetta fuori.', 'militare', 'noun'],
 ['Vuole militare in un partito.', 'militare', 'verb'],
 ['Voglio realizzare il progetto.', 'realizzare', 'English-influenced meaning'],
 ['Devo situare il museo.', 'situare', 'Cerco il museo.'],
 ['Il libro è popolare.', 'popolare', 'adjective'],
 ['Vorrei sposare Anna.', 'sposare', 'Wikizionario contributors'],
 ['Può servire una penna.', 'servire', 'grammatical subject'],
 ['Devo sostituire il filtro.', 'sostituire', 'Y replaces X'],
 ['Voglio rivelare il segreto.', 'rivelare', 'source details']
];
for (const [text, token, expected] of teacherCases) {
 context.passageText=text;context.targetToken=token;
 const outcome=vm.runInContext(`(() => {
  activeAnalysis=analyzeSection(passageText);
  const row=activeAnalysis.rows.find(r=>r.token===targetToken);
  const sentence=activeAnalysis.sentences[row.sentenceIndex];
  const request=buildTeacherRequest({scope:'word',row,sentence,sentenceIndex:row.sentenceIndex,
   phrases:[],emotion:sentence.emotion,wordEvidence:wordEvidenceForBreakdown(row)});
  const original=JSON.stringify(request);
  const note=simulateTeacherResponse(request);
  return {note,markup:renderTeacherNote(note),unchanged:original===JSON.stringify(request)};
 })()`,context);
 assert(outcome.unchanged);
 assert(outcome.markup.includes(expected),token);
 assert.equal(outcome.note.confidence,'unresolved');
 assert.equal(outcome.note.lexicalGuides.length,1);
 assert.equal(outcome.note.lexicalGuides[0].uncertainty.partOfSpeech,'unresolved');
 assert.equal(outcome.note.lexicalGuides[0].uncertainty.construction,'not-assessed');
 assert.equal(outcome.note.lexicalGuides[0].uncertainty.sense,'unresolved');
 assert.match(outcome.markup,/source definitions are not all individually human-reviewed/);
 assert.match(outcome.markup,/not confidence in a sentence interpretation/);
 if(token==='militare') for(const pos of ['noun:','adjective:','verb:']) assert(outcome.markup.includes(pos));
}
const teacherSentence=vm.runInContext(`(() => {
 activeAnalysis=analyzeSection('Voglio cercare di capire e cercare le chiavi. Posso sentire un rumore.');
 const sentence=activeAnalysis.sentences[0];
 const request=buildTeacherRequest({scope:'sentence',sentence,sentenceIndex:0,phrases:[],emotion:sentence.emotion});
 const note=simulateTeacherResponse(request);
 const key=teacherCacheKey(request);
 simulatedTeacherProvider.revision++;
 const changedKey=teacherCacheKey(request);
 simulatedTeacherProvider.revision--;
 return {note,key,changedKey};
})()`,context);
assert.equal(teacherSentence.note.lexicalGuides.filter(g=>g.token==='cercare').length,1);
assert(!teacherSentence.note.lexicalGuides.some(g=>g.token==='sentire'));
assert.notEqual(teacherSentence.key,teacherSentence.changedKey);
assert.match(teacherSentence.note.english,/do not combine into a sentence translation/);
const hostileGuide=vm.runInContext(`(() => {
 const evidence=lexicalEvidenceForRow({token:'fare'});
 const item={token:'<img src=x>',lemmaCandidate:'<script>',evidence};
 evidence.reviewed.notes=[{title:'<img>',text:'<script>',examples:[{it:'<img>',en:'<script>'}]}];
 const request={localEvidence:{lexical:[item]}};
 const guide=teacherLexicalGuides(request)[0];
 const markup=renderTeacherLexicalGuide(guide);
 evidence.reviewed.review.status='unreviewed';
 return {markup,rejected:teacherLexicalGuides(request).length};
})()`,context);
assert.doesNotMatch(hostileGuide.markup,/<img|<script>/);
assert.match(hostileGuide.markup,/&lt;img/);
assert.equal(hostileGuide.rejected,0);
console.log('Teacher usage guides: constructions, grammatical alternatives, abstention, sentence scope, revision cache, review gate and escaping PASS');
async function testSourceIntegration(){
 const originalQuery=elementStub.querySelector;let slot={innerHTML:'',textContent:''},legacy={hidden:false};
 elementStub.querySelector=function(selector){if(selector==='#sourceDictionaryMeanings')return slot;if(selector==='[data-legacy-meaning]')return legacy;return elementStub;};
 const requests=[];context.window.PASSATO_SOURCE_LEXICON={lookup(token){return new Promise((resolve,reject)=>requests.push({token,resolve,reject}));},render(result){return 'SOURCE:'+result;}};
 const show=word=>{slot={innerHTML:'',textContent:''};legacy={hidden:false};vm.runInContext(`activeBook={id:"source-test"};activeAnalysis=analyzeSection(${JSON.stringify(word)});showWordLens(0);`,context);};
 const flush=async()=>{await Promise.resolve();await Promise.resolve();};
 show('casa');const oldSlot=slot;show('libro');requests[0].resolve('old');await flush();assert.equal(oldSlot.innerHTML,'');assert.equal(slot.innerHTML,'');requests[1].resolve('book');await flush();assert.equal(slot.innerHTML,'SOURCE:book');assert.equal(legacy.hidden,true);
 show('casa');requests[2].reject(Error('offline'));await flush();assert.match(slot.textContent,/existing guidance remains available/);assert.equal(legacy.hidden,false);
 show('casa');elementStub.hidden=true;requests[3].resolve('closed');await flush();assert.equal(slot.innerHTML,'');
 show('fare');assert.equal(requests.length,4,'Reviewed words must not request the source fallback');
 elementStub.querySelector=originalQuery;console.log('Word Lens async source integration: precedence, stale requests, close and offline fallback PASS');
}
testSourceIntegration().catch(error=>{console.error(error);process.exitCode=1;});
