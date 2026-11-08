/* Passato Prossimo learning data, v1. Browser + Electron renderer. No server required. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PASSATO_LEARNING_STORE = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const DB_NAME = 'passato-prossimo-learning';
  const DB_VERSION = 1;
  const STATUSES = new Set(['known', 'shaky', 'unknown']);
  const confidenceFor = { known: 1, shaky: 0.55, unknown: 0 };
  const lemmaKey = value => String(value || '').normalize('NFC').trim().toLocaleLowerCase('it');
  const clean = value => String(value ?? '').slice(0, 1000);

  function normalizeStatus(value) {
    return STATUSES.has(value) ? value : 'unknown';
  }
  function toWord(lemma, status, at, prior) {
    return {
      lemma,
      status: normalizeStatus(status),
      confidence: confidenceFor[normalizeStatus(status)],
      firstSeenAt: prior?.firstSeenAt || null,
      lastSeenAt: prior?.lastSeenAt || null,
      encounterCount: prior?.encounterCount || 0,
      reviewCount: prior?.reviewCount || 0,
      statusSource: prior?.statusSource || 'unassessed',
      updatedAt: at
    };
  }
  function requestValue(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Learning storage request failed'));
    });
  }
  function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Learning storage transaction failed'));
      transaction.onabort = () => reject(transaction.error || new Error('Learning storage transaction aborted'));
    });
  }
  function openDatabase(indexedDB, onVersionChange) {
    if (!indexedDB) return Promise.reject(new Error('IndexedDB is unavailable; learning history cannot be persisted.'));
    return new Promise((resolve, reject) => {
      let settled = false;
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('words')) db.createObjectStore('words', { keyPath: 'lemma' });
        if (!db.objectStoreNames.contains('encounters')) {
          const store = db.createObjectStore('encounters', { keyPath: 'id', autoIncrement: true });
          store.createIndex('byLemma', 'lemma', { unique: false });
        }
        if (!db.objectStoreNames.contains('reviews')) {
          const store = db.createObjectStore('reviews', { keyPath: 'id', autoIncrement: true });
          store.createIndex('byLemma', 'lemma', { unique: false });
        }
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
      };
      request.onsuccess = () => {const database=request.result;if(settled){database.close();return;}settled=true;database.onversionchange=()=>{database.close();onVersionChange?.();};resolve(database);};
      request.onerror = () => {settled=true;reject(request.error || new Error('Could not open learning database'));};
      request.onblocked = () => {settled=true;reject(new Error('Close other Passato tabs to update learning storage.'));};
    });
  }
  function create(options = {}) {
    const idb = Object.hasOwn(options, 'indexedDB') ? options.indexedDB : (typeof indexedDB !== 'undefined' ? indexedDB : null);
    const now = options.now || (() => new Date().toISOString());
    let connection;
    async function db() {
      if (!connection) connection = openDatabase(idb,()=>{connection=null;}).catch(error => { connection = null; throw error; });
      return connection;
    }
    async function run(stores, mode, executor) {
      const database = await db();
      const tx = database.transaction(stores, mode);
      const done = transactionDone(tx); // attach transaction listeners before operations
      done.catch(() => {});
      let result;
      try { result = await executor(tx); }
      catch (error) { try { tx.abort(); } catch {} await done.catch(() => {}); throw error; }
      await done;
      return result;
    }
    async function migrateLegacy(legacyModel = {}) {
      if (!legacyModel || typeof legacyModel !== 'object' || Array.isArray(legacyModel)) return { migrated: 0, alreadyMigrated: false };
      return run(['words', 'meta'], 'readwrite', async tx => {
        const meta = tx.objectStore('meta');
        const marker = await requestValue(meta.get('legacy-lemma-model-v1'));
        if (marker) return { migrated: 0, alreadyMigrated: true };
        const words = tx.objectStore('words');
        let migrated = 0;
        for (const [rawLemma, entry] of Object.entries(legacyModel)) {
          const lemma = lemmaKey(rawLemma);
          if (!lemma || !STATUSES.has(entry?.status)) continue;
          const existing = await requestValue(words.get(lemma));
          if (existing) continue; // never replace data already collected in IndexedDB
          words.put({...toWord(lemma, entry.status, now()), statusSource:'legacy'});
          migrated++;
        }
        meta.put({ key: 'legacy-lemma-model-v1', at: now(), migrated });
        return { migrated, alreadyMigrated: false };
      });
    }
    async function setStatus(rawLemma, status, context = {}) {
      const lemma = lemmaKey(rawLemma);
      if (!lemma || !STATUSES.has(status)) throw new Error('Expected a lemma and known/shaky/unknown status');
      return run(['words', 'reviews'], 'readwrite', async tx => {
        const words = tx.objectStore('words');
        const prior = await requestValue(words.get(lemma));
        const at = now();
        const record = toWord(lemma, status, at, prior);
        record.statusSource = 'self-assessment';
        record.reviewCount += 1;
        words.put(record);
        tx.objectStore('reviews').add({ lemma, status, previousStatus: prior?.status || null, kind: 'self-assessment',
          at, bookId: clean(context.bookId || ''), token: clean(context.token || ''), lemmaMethod: clean(context.lemmaMethod || '') });
        return record;
      });
    }
    async function recordEncounter(rawLemma, context = {}) {
      const lemma = lemmaKey(rawLemma);
      if (!lemma) throw new Error('Expected a lemma');
      return run(['words', 'encounters'], 'readwrite', async tx => {
        const words = tx.objectStore('words');
        const prior = await requestValue(words.get(lemma));
        const at = now();
        const record = toWord(lemma, prior?.status || 'unknown', at, prior);
        record.encounterCount += 1;
        record.firstSeenAt ||= at;
        record.lastSeenAt = at;
        words.put(record);
        tx.objectStore('encounters').add({ lemma, token: clean(context.token || ''), bookId: clean(context.bookId || ''),
          sectionIndex: Number.isInteger(context.sectionIndex) ? context.sectionIndex : null,
          sentenceIndex: Number.isInteger(context.sentenceIndex) ? context.sentenceIndex : null,
          at, source: clean(context.source || 'word-lens'), lemmaMethod: clean(context.lemmaMethod || '') });
        return record;
      });
    }
    function getWord(rawLemma) { const lemma = lemmaKey(rawLemma); return lemma ? run(['words'], 'readonly', tx => requestValue(tx.objectStore('words').get(lemma))) : Promise.resolve(null); }
    function listWords() { return run(['words'], 'readonly', tx => requestValue(tx.objectStore('words').getAll())); }
    function listEncounters(rawLemma) {
      const lemma = lemmaKey(rawLemma);
      return run(['encounters'], 'readonly', tx => lemma
        ? requestValue(tx.objectStore('encounters').index('byLemma').getAll(lemma))
        : requestValue(tx.objectStore('encounters').getAll()));
    }
    function listReviews(rawLemma) {
      const lemma = lemmaKey(rawLemma);
      return run(['reviews'], 'readonly', tx => lemma
        ? requestValue(tx.objectStore('reviews').index('byLemma').getAll(lemma))
        : requestValue(tx.objectStore('reviews').getAll()));
    }
    async function exportJSON() {
      return run(['words','encounters','reviews'], 'readonly', async tx => {
        const [words,encounters,reviews]=await Promise.all(['words','encounters','reviews'].map(name=>requestValue(tx.objectStore(name).getAll())));
        return {schema:'passato-learning-export-v1',exportedAt:now(),words,encounters,reviews};
      });
    }
    async function close() { if (connection) { (await connection).close(); connection = null; } }
    return { migrateLegacy, setStatus, recordEncounter, getWord, listWords, listEncounters, listReviews, exportJSON, close };
  }
  return { create, lemmaKey, normalizeStatus, DB_NAME, DB_VERSION };
});
