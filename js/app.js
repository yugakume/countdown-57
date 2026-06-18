/* 公開ページ（カウントダウン + ゲージ + カレンダー） */

const DAY = 86400000, HOUR = 3600000, MIN = 60000, SEC = 1000;
const WD = ['日', '月', '火', '水', '木', '金', '土'];

// 開くたびにランダムで選ばれるテーマ（色・浮遊する絵文字）
const THEMES = [
  { name: 'sakura', emojis: ['🌸','✨','💕','🎀'], vars: {
    '--pink':'#e8709a','--pink-soft':'#fbe3ec','--pink-deep':'#c84e7a',
    '--bg':'#fff6f9','--bg-accent-1':'#ffe0ec','--bg-accent-2':'#efe9ff',
    '--cd-grad':'linear-gradient(135deg,#ff9bbb,#e8709a)',
    '--gauge-grad':'linear-gradient(90deg,#ffc36b,#ff8db1,#e8709a)' } },
  { name: 'ocean', emojis: ['🌊','💧','🐳','✨'], vars: {
    '--pink':'#2f8fc7','--pink-soft':'#d8eefb','--pink-deep':'#1f6fa3',
    '--bg':'#f3fafe','--bg-accent-1':'#d6f0ff','--bg-accent-2':'#e2f7ee',
    '--cd-grad':'linear-gradient(135deg,#5bc6e8,#2f8fc7)',
    '--gauge-grad':'linear-gradient(90deg,#7fe3c0,#5bc6e8,#2f8fc7)' } },
  { name: 'sunset', emojis: ['🌅','🔥','🧡','✨'], vars: {
    '--pink':'#e8654e','--pink-soft':'#ffe0d6','--pink-deep':'#c1452f',
    '--bg':'#fff7f2','--bg-accent-1':'#ffe0cf','--bg-accent-2':'#ffd9e6',
    '--cd-grad':'linear-gradient(135deg,#ffae6b,#ef6f8e)',
    '--gauge-grad':'linear-gradient(90deg,#ffd36b,#ff8f6b,#ef6f8e)' } },
  { name: 'mint', emojis: ['🌿','🍀','🫧','✨'], vars: {
    '--pink':'#2bb38a','--pink-soft':'#d6f3e7','--pink-deep':'#1d8a69',
    '--bg':'#f2fcf8','--bg-accent-1':'#d2f5e6','--bg-accent-2':'#e6f6d6',
    '--cd-grad':'linear-gradient(135deg,#7fe0a8,#2bb38a)',
    '--gauge-grad':'linear-gradient(90deg,#cfe87a,#7fe0a8,#2bb38a)' } },
  { name: 'grape', emojis: ['🍇','🔮','💜','✨'], vars: {
    '--pink':'#8b5cd6','--pink-soft':'#ebe0fb','--pink-deep':'#6c3fb5',
    '--bg':'#f8f5ff','--bg-accent-1':'#e8dcff','--bg-accent-2':'#fbdcf0',
    '--cd-grad':'linear-gradient(135deg,#b98cf0,#8b5cd6)',
    '--gauge-grad':'linear-gradient(90deg,#f0a6d6,#b98cf0,#8b5cd6)' } },
  { name: 'lemon', emojis: ['🍋','⭐','🌟','✨'], vars: {
    '--pink':'#d99320','--pink-soft':'#fcefcf','--pink-deep':'#b5760f',
    '--bg':'#fffcf2','--bg-accent-1':'#fdeec2','--bg-accent-2':'#ffe6cf',
    '--cd-grad':'linear-gradient(135deg,#ffd35e,#f59e3b)',
    '--gauge-grad':'linear-gradient(90deg,#ffe07a,#ffc14d,#f59e3b)' } },
  { name: 'indigo', emojis: ['☁️','💫','🌟','✨'], vars: {
    '--pink':'#5a6fe0','--pink-soft':'#e0e5fb','--pink-deep':'#3f51c0',
    '--bg':'#f5f7ff','--bg-accent-1':'#dce4ff','--bg-accent-2':'#e6dcff',
    '--cd-grad':'linear-gradient(135deg,#7e9bf0,#5a6fe0)',
    '--gauge-grad':'linear-gradient(90deg,#9ad6f0,#7e9bf0,#5a6fe0)' } },
  { name: 'berry', emojis: ['🍓','💖','🌸','✨'], vars: {
    '--pink':'#d6489a','--pink-soft':'#fbdcee','--pink-deep':'#ad2f78',
    '--bg':'#fff5fb','--bg-accent-1':'#ffd6ee','--bg-accent-2':'#ecd6ff',
    '--cd-grad':'linear-gradient(135deg,#ff84c6,#d6489a)',
    '--gauge-grad':'linear-gradient(90deg,#ffb36b,#ff84c6,#d6489a)' } },
];
let themeEmojis = ['✨'];

let messages = {};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  applyRandomTheme();
  createParticles();
  await loadMessages();
  buildCalendar(true);
  updateSpotlight();
  tick();
  setInterval(tick, 1000);
  setInterval(refresh, 60000); // 1分ごとに最新メッセージを取得
  setupModal();
}

async function refresh() {
  await loadMessages();
  buildCalendar(false);
  updateSpotlight();
}

/* 開くたびにランダムなテーマを適用 */
function applyRandomTheme() {
  const t = THEMES[Math.floor(Math.random() * THEMES.length)];
  const root = document.documentElement;
  for (const [k, v] of Object.entries(t.vars)) root.style.setProperty(k, v);
  themeEmojis = t.emojis;
  document.documentElement.dataset.theme = t.name;
}

/* 背景にふわふわ浮かぶ装飾を生成 */
function createParticles() {
  const fx = document.createElement('div');
  fx.className = 'fx';
  fx.setAttribute('aria-hidden', 'true');
  document.body.appendChild(fx);
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('span');
    s.textContent = themeEmojis[Math.floor(Math.random() * themeEmojis.length)];
    const dur = 10 + Math.random() * 14;
    s.style.left = Math.random() * 100 + '%';
    s.style.fontSize = (12 + Math.random() * 18) + 'px';
    s.style.animationDuration = dur + 's';
    s.style.animationDelay = (-Math.random() * dur) + 's';
    s.style.setProperty('--fx-op', (0.22 + Math.random() * 0.33).toFixed(2));
    fx.appendChild(s);
  }
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

  setTextBump('cd-days', d);
  setTextBump('cd-h', pad(h));
  setTextBump('cd-m', pad(m));
  setTextBump('cd-s', pad(s));
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
function buildCalendar(firstLoad) {
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
  grid.classList.toggle('animate-in', !!firstLoad); // 初回だけポップイン
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
// 値が変わったときだけ数字をポンッと弾ませる
function setTextBump(id, v) {
  const el = document.getElementById(id);
  if (!el || el.textContent === String(v)) return;
  el.textContent = v;
  el.classList.remove('bump');
  void el.offsetWidth; // アニメ再生のためリフロー
  el.classList.add('bump');
}
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
