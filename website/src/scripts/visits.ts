// Count one visible page load, including other site pages; only the homepage displays the total.
let recorded = false;

async function recordPageView() {
  if (recorded || document.visibilityState !== 'visible' || !document.body.hasAttribute('data-count-visits')) return;
  recorded = true;
  document.removeEventListener('visibilitychange', recordPageView);

  const totalElement = document.querySelector<HTMLElement>('[data-visit-total]');
  const noteElement = document.querySelector<HTMLElement>('[data-visit-since]');
  try {
    const response = await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"event":"pageview"}',
      credentials: 'omit',
      cache: 'no-store',
      keepalive: true,
    });
    if (!response.ok) throw new Error('Counter unavailable');
    const { total, startedAt } = await response.json();
    if (!Number.isSafeInteger(total) || total < 0 || typeof startedAt !== 'string' || !Number.isFinite(Date.parse(startedAt))) {
      throw new Error('Invalid counter');
    }
    if (totalElement) totalElement.textContent = new Intl.NumberFormat('zh-TW').format(total);
    if (noteElement) {
      const date = new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei' }).format(new Date(startedAt));
      noteElement.textContent = `自 ${date} 起累計瀏覽 · 感謝您的來訪`;
    }
  } catch {
    if (noteElement) noteElement.textContent = '瀏覽人次暫時無法讀取';
  }
}

document.addEventListener('visibilitychange', recordPageView);
void recordPageView();
