/* 管理者ページ — GitHub API 経由で data/messages.json を更新 */

const TOKEN_KEY = 'countdown57_gh_token';
const API = `https://api.github.com/repos/${REPO.owner}/${REPO.repo}/contents/${REPO.path}`;
const WD = ['日', '月', '火', '水', '木', '金', '土'];

let messages = {};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const saved = localStorage.getItem(TOKEN_KEY);
  if (saved) document.getElementById('token').value = saved;

  document.getElementById('btn-save-token').addEventListener('click', () => {
    const t = document.getElementById('token').value.trim();
    if (!t) { localStorage.removeItem(TOKEN_KEY); setTokenStatus('トークンを削除しました', ''); return; }
    localStorage.setItem(TOKEN_KEY, t);
    setTokenStatus('トークンをこの端末に記憶しました', 'ok');
  });

  await loadMessages();
  buildEditor();
}

function getToken() {
  return document.getElementById('token').value.trim() || localStorage.getItem(TOKEN_KEY) || '';
}
function ghHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

/* 公開ファイルから現在のメッセージを読み込み（トークン不要） */
async function loadMessages() {
  try {
    const res = await fetch(`data/messages.json?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) messages = await res.json();
  } catch (e) {
    console.warn(e);
  }
}

/* GitHub API から最新の sha と中身を取得（トークン必要・コミット直前に使用） */
async function fetchLatest() {
  const res = await fetch(`${API}?ref=${REPO.branch}&t=${Date.now()}`, { headers: ghHeaders(), cache: 'no-store' });
  if (res.status === 404) return { sha: undefined, data: {} };
  if (res.status === 401) throw new Error('認証エラー：トークンが正しくありません');
  if (!res.ok) throw new Error(`読み込み失敗 (${res.status})`);
  const json = await res.json();
  const data = JSON.parse(b64decode(json.content));
  return { sha: json.sha, data };
}

async function commit(date, name, message) {
  if (!getToken()) throw new Error('先にアクセストークンを入力してください');
  // 競合を避けるため、コミット直前に最新を取得してマージ
  const { sha, data } = await fetchLatest();
  const next = { ...data };
  if (!message.trim() && !name.trim()) {
    delete next[date]; // 空なら削除
  } else {
    next[date] = { name: name.trim(), message: message.trim(), updatedAt: new Date().toISOString() };
  }
  const body = {
    message: `メッセージ更新: ${date}${name ? ` (${name})` : ''}`,
    content: b64encode(JSON.stringify(next, null, 2) + '\n'),
    branch: REPO.branch,
  };
  if (sha) body.sha = sha;

  const res = await fetch(API, { method: 'PUT', headers: ghHeaders(), body: JSON.stringify(body) });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`保存失敗 (${res.status}) ${txt.slice(0, 120)}`);
  }
  messages = next;
  return true;
}

/* 全担当日の編集フォームを生成 */
function buildEditor() {
  const today = jstToday();
  const root = document.getElementById('editor');
  root.innerHTML = SCHEDULE.map((entry) => {
    const saved = messages[entry.date] || {};
    const name = saved.name ?? entry.name ?? '';
    const msg = saved.message ?? '';
    const filled = msg.trim().length > 0;
    const cls = ['row'];
    if (entry.date === today) cls.push('is-today');
    if (filled) cls.push('is-filled');
    return `
      <div class="${cls.join(' ')}" data-date="${entry.date}">
        <div class="row__head">
          <span class="row__date">${formatDay(entry.date)}</span>
          ${entry.badge ? `<span class="cell__badge ${entry.group}">${esc(entry.badge)}</span>` : ''}
          <span class="row__rem">残り${remainingDaysFor(entry.date)}日</span>
          ${entry.date === today ? '<span class="row__today-tag">今日</span>' : ''}
          ${filled ? '<span class="row__filled-tag">✓ 入力済み</span>' : ''}
        </div>
        <div class="row__fields">
          <label>担当者名</label>
          <input class="row__name" type="text" value="${esc(name)}" placeholder="${esc(entry.badge || '担当者名')}" />
          <label>メッセージ</label>
          <textarea class="row__msg" placeholder="本日のメッセージを入力…">${esc(msg)}</textarea>
        </div>
        <div class="row__actions">
          <button class="btn btn--primary row__save">保存して公開</button>
          <span class="row__status"></span>
        </div>
      </div>`;
  }).join('');

  root.querySelectorAll('.row').forEach((row) => {
    row.querySelector('.row__save').addEventListener('click', () => saveRow(row));
  });

  // 今日の行へスクロール
  const todayRow = root.querySelector('.row.is-today');
  if (todayRow) todayRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function saveRow(row) {
  const date = row.dataset.date;
  const name = row.querySelector('.row__name').value;
  const message = row.querySelector('.row__msg').value;
  const btn = row.querySelector('.row__save');
  const status = row.querySelector('.row__status');
  btn.disabled = true;
  status.textContent = '保存中…';
  status.style.color = '';
  try {
    await commit(date, name, message);
    status.textContent = '✓ 保存しました（公開ページへ約1分で反映）';
    status.style.color = '#2e8b57';
    row.classList.toggle('is-filled', message.trim().length > 0);
    toast('保存しました！');
  } catch (e) {
    status.textContent = '⚠ ' + e.message;
    status.style.color = '#d2476a';
    toast(e.message, true);
  } finally {
    btn.disabled = false;
  }
}

/* ---- helpers ---- */
function setTokenStatus(msg, kind) {
  const el = document.getElementById('token-status');
  el.textContent = msg;
  el.className = 'admin__status ' + (kind || '');
}
function toast(msg, isErr) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast' + (isErr ? ' err' : '');
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (el.hidden = true), 3000);
}
function formatDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${m}月${d}日(${WD[new Date(y, m - 1, d).getDay()]})`;
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}
// UTF-8 対応 base64
function b64encode(str) { return btoa(unescape(encodeURIComponent(str))); }
function b64decode(b64) { return decodeURIComponent(escape(atob(b64.replace(/\n/g, '')))); }
