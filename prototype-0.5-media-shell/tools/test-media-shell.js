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
assert.match(mediaShellSource, /media-resting-thumbnail/);
assert.match(mediaShellSource, /Open on YouTube/);
assert.match(mediaShellSource, /Sources &amp; licenses/);
assert.match(mediaShellSource, /mik3ml\/italian-dictionary/);
assert.match(mediaShellSource, /CC BY-NC-SA 3\.0/);
assert.doesNotMatch(mediaShellSource, /<iframe\b/i);
