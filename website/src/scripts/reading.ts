// No cookies, persistent visitor IDs, raw referrers or query strings are collected.
export function startReading() {
  if (!document.body.hasAttribute('data-count-visits') || navigator.webdriver || navigator.doNotTrack === '1' ||
    localStorage.getItem('reading-stats-disabled') === '1') return;
  const prose = document.querySelector<HTMLElement>('.article__body .prose');
  const source = (() => {
    try {
      const host = new URL(document.referrer).hostname.toLowerCase();
      if (host === location.hostname) return 'internal';
      const groups: Record<string, string[]> = {
        threads: ['threads.com', 'threads.net'], facebook: ['facebook.com', 'fb.com'], instagram: ['instagram.com'],
        google: ['google.com', 'google.com.tw'], bing: ['bing.com'], chatgpt: ['chatgpt.com', 'chat.openai.com'], perplexity: ['perplexity.ai'],
      };
      return Object.entries(groups).find(([, domains]) => domains.some(d => host === d || host.endsWith('.' + d)))?.[0] ?? 'other';
    } catch { return 'direct'; }
  })();
  const event = { id: crypto.randomUUID(), started: Date.now(), path: location.pathname, source,
    article: !!prose, ms: 0, depth: 0, clinic: 0, related: 0 };
  let last = performance.now();
  let lastActivity = last;
  let visible = document.visibilityState === 'visible' && document.hasFocus();
  let seen = false;
  let sent = '';
  let pending = false;
  function tick() {
    const now = performance.now();
    if (visible) {
      seen = true;
      event.ms = Math.min(3600000, event.ms + Math.max(0, Math.min(now, lastActivity + 60000) - last));
      if (prose) {
        const rect = prose.getBoundingClientRect();
        if (rect.height > 0 && rect.top < innerHeight && rect.bottom > 0) {
          event.depth = Math.max(event.depth, Math.min(100, Math.max(0, Math.floor((innerHeight - rect.top) / rect.height * 100))));
        }
      }
    }
    last = now;
  }
  function activity() { tick(); lastActivity = performance.now(); }
  function flush(leaving = false) {
    tick();
    if (!seen || localStorage.getItem('reading-stats-disabled') === '1' || Date.now() - event.started > 86400000) return;
    const payload = JSON.stringify({ ...event, ms: Math.floor(event.ms) });
    if (payload === sent || (pending && !leaving)) return;
    pending = true;
    // Keepalive plus cumulative snapshots also handles final clicks and hidden tabs.
    void fetch('/api/reading', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload,
      credentials: 'omit', cache: 'no-store', keepalive: true }).then(r => { if (r.ok) sent = payload; })
      .catch(() => {}).finally(() => { pending = false; });
  }
  function visibility() {
    tick();
    visible = document.visibilityState === 'visible' && document.hasFocus();
    if (visible) lastActivity = performance.now();
    flush(true);
  }
  ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'].forEach(name => addEventListener(name, activity, { passive: true }));
  addEventListener('focus', visibility);
  addEventListener('blur', visibility);
  document.addEventListener('visibilitychange', visibility);
  addEventListener('pagehide', () => flush(true));
  document.addEventListener('click', e => {
    const link = (e.target as Element)?.closest<HTMLAnchorElement>('a[href]');
    if (!link) return;
    const url = new URL(link.href, location.href);
    if (url.pathname === '/clinic/' || /掛號|預約/.test(link.textContent ?? '') || url.protocol === 'tel:') event.clinic = Math.min(100, event.clinic + 1);
    if (prose && url.origin === location.origin && url.pathname.startsWith('/articles/') && url.pathname !== location.pathname) event.related = Math.min(100, event.related + 1);
    flush(true);
  });
  setInterval(tick, 1000);
  setInterval(() => flush(), 30000);
  flush();
}
try { startReading(); } catch { /* Analytics must never interrupt the page. */ }
