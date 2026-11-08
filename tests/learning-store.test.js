'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const learning = require('../learning/learning-store');

test('Italian normalization preserves accented distinction', () => {
  assert.equal(learning.lemmaKey('  CITTÀ  '), 'città');
  assert.equal(learning.lemmaKey('PERCHÉ'), 'perché');
  assert.notEqual(learning.lemmaKey('e'), learning.lemmaKey('è'));
});

test('status normalization only permits defined states', () => {
  assert.equal(learning.normalizeStatus('shaky'), 'shaky');
  assert.equal(learning.normalizeStatus('expert'), 'unknown');
});

test('unsupported environment errors clearly rather than losing data silently', async () => {
  const store = learning.create({indexedDB: null});
  await assert.rejects(store.listWords(), /IndexedDB is unavailable/);
});
