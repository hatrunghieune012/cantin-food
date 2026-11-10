const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

function load(file, imports, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(js, { exports, require: name => {
    if (!(name in imports)) throw new Error('Unexpected import ' + name);
    return imports[name];
  }, process: { env: {} }, setTimeout, clearTimeout, Headers, AbortController, ...globals });
  return exports;
}
const clone = value => value == null ? null : JSON.parse(JSON.stringify(value));
function memory() {
  const data = new Map();
  return {
    data,
    readLocal: async key => clone(data.get(key)),
    saveLocal: async (key, value) => { data.set(key, clone(value)); },
  };
}
class ApiError extends Error { constructor(message, status = 0) { super(message); this.status = status; } }
const payload = { orderType: 'online', expectedTotal: 25000, pickupAt: '2026-11-04T03:00:00Z', items: [{ foodId: 1, quantity: 1 }] };

test('birth date validation agrees across client/server and password bytes match UTF-8', () => {
  const client = load('accountValidation.ts', {});
  const backend = require('../backend/accountValidation');
  for (const [date, valid] of [['2000-02-29', true], ['2024-02-29', true], ['1900-02-29', false], ['2025-02-29', false], ['2000-04-31', false], ['2999-01-01', false], ['2000-2-01', false], ['', false], ['0000-01-01', false]]) {
    assert.equal(client.validBirthDate(date), valid, date);
    assert.equal(backend.validBirthDate(date), valid, date);
  }
  assert.equal(client.validBirthDate(client.todayVietnam()), true);
  for (const value of ['password', 'Mật khẩu', '🍜'.repeat(19), '\ud800']) assert.equal(client.passwordBytes(value), Buffer.byteLength(value));
});

test('lost response survives module restart; retry uses exact original payload and key', async () => {
  const storage = memory(); const sent = []; let calls = 0;
  const api = { ApiError, requestKey: () => 'stable-request-key', request: async (url, token, options) => {
    sent.push(options.body);
    if (++calls === 1) throw new ApiError('lost response');
    return { order: { id: 42, total_amount: 25000 } };
  } };
  const first = load('orderJournal.ts', { './api': api, './storage': storage });
  await assert.rejects(first.submitOrder(1, 'old-token', payload));
  assert.ok(await first.pendingOrder(1, 'online'));
  const restarted = load('orderJournal.ts', { './api': api, './storage': storage });
  const result = await restarted.submitOrder(1, 'new-token', { ...payload, expectedTotal: 999 });
  assert.equal(result.order.id, 42); assert.equal(sent[0], sent[1]);
  await restarted.submitOrder(1, 'new-token', payload);
  assert.equal(calls, 2, 'persisted receipt does not send another request');
  await restarted.acknowledgeOrder(1, 'online');
  assert.equal(await restarted.pendingOrder(1, 'online'), null);
});

test('double submit shares one network request; user journals stay isolated', async () => {
  const storage = memory(); let calls = 0;
  const api = { ApiError, requestKey: () => 'key', request: async () => { calls++; await new Promise(r => setTimeout(r, 10)); return { order: { id: 1 } }; } };
  const journal = load('orderJournal.ts', { './api': api, './storage': storage });
  const [a, b] = await Promise.all([journal.submitOrder(1, 'token', payload), journal.submitOrder(1, 'token', payload)]);
  assert.equal(calls, 1); assert.equal(a.order.id, b.order.id);
  assert.equal(await journal.pendingOrder(2, 'online'), null);
});

test('401 and server failures retain journal; definite price rejection releases it', async () => {
  for (const status of [0, 401, 403, 500, 400, 409]) {
    const storage = memory();
    const api = { ApiError, requestKey: () => 'key', request: async () => { throw new ApiError('failure', status); } };
    const journal = load('orderJournal.ts', { './api': api, './storage': storage });
    await assert.rejects(journal.submitOrder(1, 'token', payload));
    assert.equal(Boolean(await journal.pendingOrder(1, 'online')), ![400, 409].includes(status));
  }
});

test('storage failure prevents order from being sent', async () => {
  let calls = 0;
  const storage = { readLocal: async () => null, saveLocal: async () => { throw new Error('disk full'); } };
  const api = { ApiError, requestKey: () => 'key', request: async () => { calls++; } };
  const journal = load('orderJournal.ts', { './api': api, './storage': storage });
  await assert.rejects(journal.submitOrder(1, 'token', payload), /disk full/);
  assert.equal(calls, 0);
});

test('HTTP GETs coalesce; 401 notifies with the request token', async () => {
  let calls = 0; const expired = [];
  const api = load('api.ts', { 'react-native': { Platform: { OS: 'android' } } }, {
    fetch: async () => { calls++; await new Promise(r => setTimeout(r, 10)); return new Response(JSON.stringify({ message: 'expired' }), { status: 401 }); },
  });
  const unsubscribe = api.onUnauthorized(token => expired.push(token));
  const responses = await Promise.allSettled([api.request('/api/me', 'old-token'), api.request('/api/me', 'old-token')]);
  assert.equal(calls, 1); assert.deepEqual(expired, ['old-token']);
  assert.ok(responses.every(r => r.status === 'rejected' && r.reason.status === 401));
  unsubscribe();
});

test('timeout covers response body; network and invalid JSON errors are recoverable', async () => {
  const api = load('api.ts', { 'react-native': { Platform: { OS: 'android' } } }, {
    setTimeout: fn => setTimeout(fn, 10),
    fetch: async (url, options) => ({ ok: true, status: 200, text: () => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('abort')))) }),
  });
  await assert.rejects(api.request('/api/foods', ''), e => e.status === 0 && /thời gian/.test(e.message));
  const invalid = load('api.ts', { 'react-native': { Platform: { OS: 'android' } } }, { fetch: async () => new Response('not json') });
  await assert.rejects(invalid.request('/api/foods', ''), e => e.status === 0);
});

test('native session uses SecureStore, persists across reload and clears on logout', async () => {
  const secure = new Map(); const plain = new Map();
  const imports = {
    'react-native': { Platform: { OS: 'android' } }, './api': { API_BASE: 'http://test:3000' },
    'expo-secure-store': { getItemAsync: async key => secure.get(key), setItemAsync: async (key, value) => secure.set(key, value) },
    '@react-native-async-storage/async-storage': { default: { getItem: async key => plain.get(key), setItem: async (key, value) => plain.set(key, value) } },
  };
  const storage = load('storage.ts', imports);
  const user = { id: 1, role: 'user', token: 'private-token' };
  await storage.saveSession(user);
  const restarted = load('storage.ts', imports);
  assert.equal((await restarted.readSession()).token, 'private-token'); assert.equal(plain.size, 0);
  await Promise.all([storage.saveLocal('cart:1', [1]), storage.saveLocal('cart:1', [2])]);
  assert.deepEqual(clone(await storage.readLocal('cart:1')), [2]);
  await storage.saveSession(null); assert.equal(await restarted.readSession(), null);
});
