import assert from 'node:assert/strict';

const base = new URL(process.argv[2] ?? 'http://127.0.0.1:8787');
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname), 'Counter checks must use local storage');
const endpoint = new URL('/api/visits', base);
const headers = { Origin: base.origin, 'Content-Type': 'application/json', 'User-Agent': 'Counter integration check' };
const body = '{"event":"pageview"}';
const read = async () => {
  const response = await fetch(endpoint);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  return response.json();
};
const post = (overrides = {}, event = body) => fetch(endpoint, { method: 'POST', headers: { ...headers, ...overrides }, body: event });

const before = await read();
assert.equal((await read()).total, before.total, 'Reading does not increase the count');
const responses = await Promise.all(Array.from({ length: 20 }, () => post()));
const totals = await Promise.all(responses.map(async response => {
  assert.equal(response.status, 200);
  return (await response.json()).total;
}));
assert.deepEqual(totals.sort((a, b) => a - b), Array.from({ length: 20 }, (_, i) => before.total + i + 1));
assert.equal((await read()).total, before.total + 20, 'Concurrent views are retained');
assert.equal((await post({ Origin: 'https://unrelated.example' })).status, 403);
assert.equal((await post({ 'Content-Type': 'text/plain' })).status, 415);
assert.equal((await post({}, '{"total":999999}')).status, 400);
assert.equal((await post({}, 'x'.repeat(200))).status, 413);
const chunked = new ReadableStream({
  start(controller) {
    controller.enqueue(new TextEncoder().encode('x'.repeat(200)));
    controller.close();
  },
});
assert.equal((await fetch(endpoint, { method: 'POST', headers: { ...headers, Connection: 'close' }, body: chunked, duplex: 'half' })).status, 413);
assert.equal((await fetch(endpoint, { method: 'DELETE' })).status, 405);
assert.equal((await post({ 'User-Agent': 'facebookexternalhit/1.1' })).status, 200);
const after = await read();
assert.equal(after.total, before.total + 20, 'Rejected requests and known crawlers do not count');
assert.equal(after.startedAt, before.startedAt);
assert.equal((await fetch(new URL('/about/', base))).status, 200, 'Static pages remain available');
assert.equal((await fetch(new URL('/counter-missing-test/', base))).status, 404, 'Unknown paths retain the 404 page');
const notFoundHtml = await (await fetch(new URL('/404.html', base))).text();
assert.ok(!notFoundHtml.match(/<body\b[^>]*>/)?.[0].includes('data-count-visits'), 'Noindex pages do not report visits');
console.log('Counter checks passed: concurrent increments, read-only GET, validation, crawler exclusion, static routing.');
