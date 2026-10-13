// Cumulative, per-page-load snapshots make retries and out-of-order delivery idempotent.
export const sources = ['direct', 'internal', 'threads', 'facebook', 'instagram', 'google', 'bing', 'chatgpt', 'perplexity', 'other'];
const dayMs = 86400000;
export const taipeiDay = (ms) => new Date(ms + 8 * 3600000).toISOString().slice(0, 10);

export function validSnapshot(e, now = Date.now()) {
  if (!e || typeof e !== 'object' || !/^[a-f0-9-]{36}$/.test(e.id ?? '')) return false;
  if (typeof e.path !== 'string' || !/^\/(?:[a-z0-9-]+\/)*$/.test(e.path) || e.path.length > 180) return false;
  if (typeof e.article !== 'boolean' || !sources.includes(e.source)) return false;
  if (!Number.isSafeInteger(e.started) || e.started < now - dayMs || e.started > now + 60000) return false;
  if (!Number.isSafeInteger(e.ms) || e.ms < 0 || e.ms > Math.min(3600000, Math.max(0, now - e.started) + 2000)) return false;
  if (!Number.isInteger(e.depth) || e.depth < 0 || e.depth > 100 || (!e.article && e.depth !== 0)) return false;
  return ['clinic', 'related'].every(k => Number.isInteger(e[k]) && e[k] >= 0 && e[k] <= 100);
}

export class ReadingStore {
  constructor(storage) {
    this.storage = storage;
    this.sql = storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS reading_meta (id INTEGER PRIMARY KEY, started TEXT NOT NULL)`);
    this.sql.exec('INSERT OR IGNORE INTO reading_meta VALUES (1, ?)', new Date().toISOString());
    this.sql.exec(`CREATE TABLE IF NOT EXISTS reading_loads (
      id TEXT PRIMARY KEY, started INTEGER NOT NULL, day TEXT NOT NULL, path TEXT NOT NULL,
      source TEXT NOT NULL, article INTEGER NOT NULL, ms INTEGER NOT NULL, depth INTEGER NOT NULL,
      clinic INTEGER NOT NULL, related INTEGER NOT NULL)`);
    this.sql.exec('CREATE INDEX IF NOT EXISTS reading_loads_started ON reading_loads(started)');
    this.sql.exec(`CREATE TABLE IF NOT EXISTS reading_daily (
      day TEXT NOT NULL, path TEXT NOT NULL, source TEXT NOT NULL, article INTEGER NOT NULL,
      views INTEGER NOT NULL DEFAULT 0, ms INTEGER NOT NULL DEFAULT 0,
      half INTEGER NOT NULL DEFAULT 0, deep INTEGER NOT NULL DEFAULT 0, engaged INTEGER NOT NULL DEFAULT 0,
      clinic INTEGER NOT NULL DEFAULT 0, related INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(day, path, source, article))`);
    this.cleanupDay = '';
  }

  record(e, now = Date.now()) {
    if (this.cleanupDay !== taipeiDay(now)) {
      this.sql.exec('DELETE FROM reading_loads WHERE started < ?', now - 2 * dayMs);
      this.sql.exec('DELETE FROM reading_daily WHERE day < ?', taipeiDay(now - 180 * dayMs));
      this.cleanupDay = taipeiDay(now);
    }
    return this.storage.transactionSync(() => {
      const old = [...this.sql.exec('SELECT * FROM reading_loads WHERE id = ?', e.id)][0];
      if (old && (old.path !== e.path || old.source !== e.source || old.started !== e.started || old.article !== +e.article)) return false;
      const next = {
        ...e, day: taipeiDay(e.started), article: +e.article,
        ms: Math.max(old?.ms ?? 0, e.ms), depth: Math.max(old?.depth ?? 0, e.depth),
        clinic: Math.max(old?.clinic ?? 0, e.clinic), related: Math.max(old?.related ?? 0, e.related),
      };
      const half = v => +(!!v?.article && v.depth >= 50);
      const deep = v => +(!!v?.article && v.depth >= 90);
      const engaged = v => +(!!v?.article && v.depth >= 50 && v.ms >= 30000);
      this.sql.exec(`INSERT INTO reading_daily (day,path,source,article,views,ms,half,deep,engaged,clinic,related)
        VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(day,path,source,article) DO UPDATE SET
        views=views+excluded.views, ms=ms+excluded.ms, half=half+excluded.half,
        deep=deep+excluded.deep, engaged=engaged+excluded.engaged,
        clinic=clinic+excluded.clinic, related=related+excluded.related`,
        next.day, next.path, next.source, next.article, old ? 0 : 1, next.ms - (old?.ms ?? 0),
        half(next)-half(old), deep(next)-deep(old), engaged(next)-engaged(old),
        next.clinic-(old?.clinic ?? 0), next.related-(old?.related ?? 0));
      this.sql.exec(`INSERT INTO reading_loads VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
        ms=excluded.ms, depth=excluded.depth, clinic=excluded.clinic, related=excluded.related`,
        next.id, next.started, next.day, next.path, next.source, next.article, next.ms, next.depth, next.clinic, next.related);
      return true;
    });
  }

  report(days = 30) {
    const from = taipeiDay(Date.now() - (days - 1) * dayMs);
    const rows = [...this.sql.exec('SELECT * FROM reading_daily WHERE day >= ? ORDER BY day, path', from)];
    return { startedAt: this.sql.exec('SELECT started FROM reading_meta WHERE id=1').one().started,
      generatedAt: new Date().toISOString(), from, through: taipeiDay(Date.now()), days, rows };
  }
}
