/* 公開ページ（カウントダウン + ゲージ + カレンダー） */

const DAY = 86400000, HOUR = 3600000, MIN = 60000, SEC = 1000;
const WD = ['日', '月', '火', '水', '木', '金', '土'];

let messages = {};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadMessages();
  buildCalendar();
  updateSpotlight();
  tick();
  setInterval(tick, 1000);
  setInterval(refresh, 60000); // 1分ごとに最新メッセージを取得
  setupModal();
}

async function refresh() {
  await loadMessages();
  buildCalendar();
  updateSpotlight();
}

async function loadMessages() {
  try {
    const res = await fetch(`data/messages.json?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) messages = await res.json();
  } catch (e) {
    console.warn('messages.json の取得に失敗', e);
  }
}

/* ---- カウントダウン & ゲージ（毎秒）---- */
function tick() {
  const now = Date.now();
  const target = new Date(COUNTDOWN_TARGET).getTime();
  let diff = Math.max(0, target - now);

  const d = Math.floor(diff / DAY);
  const h = Math.floor((diff % DAY) / HOUR);
  const m = Math.floor((diff % HOUR) / MIN);
  const s = Math.floor((diff % MIN) / SEC);

  setText('cd-days', d);
  setText('cd-h', pad(h));
  setText('cd-m', pad(m));
  setText('cd-s', pad(s));
  setText('cd-caption', diff <= 0 ? '集客期間、終了！おつかれさまでした🎉' : '6/30 のゴールまで…');

  // 進捗ゲージ
  const start = new Date(PERIOD_START).getTime();
  const end = new Date(PERIOD_END).getTime();
  let pct = ((now - start) / (end - start)) * 100;
  pct = Math.min(100, Math.max(0, pct));
  document.getElementById('gauge-fill').style.width = pct.toFixed(2) + '%';
  setText('gauge-text', `集客期間のうち ${pct.toFixed(1)}% 終了！`);
}

/* ---- 今日のスポットライト ---- */
function updateSpotlight() {
  const today = jstToday();
  const el = document.getElementById('spotlight');
  const entry = SCHEDULE_BY_DATE[today];

  if (!entry) {
    const first = SCHEDULE[0].date, last = SCHEDULE[SCHEDULE.length - 1].date;
    const msg = today < first
      ? '集客カウントダウン、まもなくスタート！📣'
      : 'みんなおつかれさま！集客期間、ありがとうございました🎉';
    el.innerHTML = `<div class="spot-card spot-card--info">${msg}</div>`;
    return;
  }

  const saved = messages[today] || {};
  const name = saved.name || entry.name || entry.badge || '本日の担当';
  const rem = remainingDaysFor(today);
  const hasMsg = saved.message && saved.message.trim();
  el.innerHTML = `
    <div class="spot-card">
      <div class="spot-card__top">
        <span class="spot-card__label">📣 本日の宣言担当</span>
        ${entry.badge ? `<span class="cell__badge ${entry.group}">${esc(entry.badge)}</span>` : ''}
      </div>
      <p class="spot-card__name">${esc(name)}</p>
      <p class="spot-card__meta">${formatDay(today)}・残り ${rem} 日</p>
      <p class="spot-card__msg ${hasMsg ? '' : 'empty'}">${hasMsg ? esc(saved.message) : 'まだ今日のメッセージが届いていません。おたのしみに！'}</p>
    </div>`;
}

/* ---- カレンダー ---- */
function buildCalendar() {
  const grid = document.getElementById('calendar-grid');
  const today = jstToday();
  // 2026/6/1 は月曜。月曜始まりなので先頭の空白は0。
  let html = '';
  for (let day = 1; day <= 30; day++) {
    const date = `2026-06-${pad(day)}`;
    const entry = SCHEDULE_BY_DATE[date];
    const isToday = date === today;

    if (!entry) {
      html += `<div class="cell is-empty"><span class="cell__date">${day}</span></div>`;
      continue;
    }
    const saved = messages[date] || {};
    const name = saved.name || entry.name || '';
    const hasMsg = saved.message && saved.message.trim();
    const classes = ['cell', 'has-member'];
    if (isToday) classes.push('is-today');
    if (entry.finale) classes.push('is-finale');
    html += `
      <div class="${classes.join(' ')}" data-date="${date}">
        <span class="cell__date">${day}</span>
        ${entry.badge ? `<span class="cell__badge ${entry.group}">${esc(entry.badge)}</span>` : ''}
        ${name ? `<span class="cell__name">${esc(name)}</span>` : ''}
        <span class="cell__rem">残り${remainingDaysFor(date)}日</span>
        ${hasMsg ? '<span class="cell__dot">💬</span>' : ''}
      </div>`;
  }
  grid.innerHTML = html;
  grid.querySelectorAll('.cell.has-member').forEach((c) => {
    c.addEventListener('click', () => openModal(c.dataset.date));
  });
}

/* ---- モーダル ---- */
function setupModal() {
  document.querySelectorAll('#modal [data-close]').forEach((el) =>
    el.addEventListener('click', closeModal)
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}
function openModal(date) {
  const entry = SCHEDULE_BY_DATE[date];
  if (!entry) return;
  const saved = messages[date] || {};
  const name = saved.name || entry.name || entry.badge || '担当';
  const hasMsg = saved.message && saved.message.trim();
  document.getElementById('modal-body').innerHTML = `
    <p class="modal__day">${formatDay(date)}・残り ${remainingDaysFor(date)} 日
      ${entry.badge ? `<span class="cell__badge ${entry.group}">${esc(entry.badge)}</span>` : ''}</p>
    <p class="modal__name">${esc(name)}</p>
    <p class="modal__msg ${hasMsg ? '' : 'empty'}">${hasMsg ? esc(saved.message) : 'まだメッセージがありません。'}</p>`;
  document.getElementById('modal').hidden = false;
}
function closeModal() {
  document.getElementById('modal').hidden = true;
}

/* ---- helpers ---- */
function pad(n) { return String(n).padStart(2, '0'); }
function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function formatDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const wd = WD[new Date(y, m - 1, d).getDay()];
  return `${m}月${d}日(${wd})`;
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}
