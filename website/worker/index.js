import { DurableObject } from 'cloudflare:workers';

const apiPath = '/api/visits';
const automatedAgent = /bot|crawler|spider|slurp|facebookexternalhit|meta-external|headless|lighthouse|pagespeed/i;

function json(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
}

async function readEvent(request) {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const bytes = new Uint8Array(128);
  let length = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return new TextDecoder().decode(bytes.subarray(0, length)).trim();
    if (length + value.length > bytes.length) {
      await reader.cancel();
      return null;
    }
    bytes.set(value, length);
    length += value.length;
  }
}

export class VisitCounter extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      total INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL
    )`);
    this.sql.exec('INSERT OR IGNORE INTO visits (id, total, started_at) VALUES (1, 0, ?)', new Date().toISOString());
  }

  read() {
    const row = this.sql.exec('SELECT total, started_at FROM visits WHERE id = 1').one();
    return { total: row.total, startedAt: row.started_at };
  }

  increment() {
    // A single SQL update serializes simultaneous page views without lost increments.
    const row = this.sql.exec('UPDATE visits SET total = total + 1 WHERE id = 1 RETURNING total, started_at').one();
    return { total: row.total, startedAt: row.started_at };
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== apiPath) return env.ASSETS.fetch(request);

    if (request.method !== 'GET' && request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, { Allow: 'GET, POST' });
    }

    if (request.method === 'POST') {
      if (request.headers.get('Origin') !== url.origin || request.headers.get('Sec-Fetch-Site') === 'cross-site') {
        return json({ error: 'Forbidden' }, 403);
      }
      if (!request.headers.get('Content-Type')?.startsWith('application/json')) {
        return json({ error: 'Expected JSON' }, 415);
      }
      if (Number(request.headers.get('Content-Length')) > 128) {
        return json({ error: 'Request too large' }, 413);
      }
      // The client sends only this fixed event; no IP, identity, or browsing path is stored.
      const event = await readEvent(request);
      if (event === null) return json({ error: 'Request too large' }, 413);
      if (event !== '{"event":"pageview"}') {
        return json({ error: 'Invalid event' }, 400);
      }
    }

    try {
      const counter = env.VISIT_COUNTER.get(env.VISIT_COUNTER.idFromName('website'));
      const shouldCount = request.method === 'POST' && !automatedAgent.test(request.headers.get('User-Agent') ?? '');
      const value = shouldCount ? await counter.increment() : await counter.read();
      return json(value);
    } catch {
      return json({ error: 'Counter temporarily unavailable' }, 503);
    }
  },
};
