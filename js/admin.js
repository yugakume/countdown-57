/* 管理者ページ — トークンで認証して初めて編集画面を表示し、
   GitHub API 経由で data/messages.json を更新する */

const TOKEN_KEY = 'countdown57_gh_token';
const API = `https://api.github.com/repos/${REPO.owner}/${REPO.repo}/contents/${REPO.path}`;
const REPO_API = `https://api.github.com/repos/${REPO.owner}/${REPO.repo}`;
const WD = ['日', '月', '火', '水', '木', '金', '土'];

let messages = {};
let currentToken = '';

document.addEventListener('DOMContentLoaded', init);

function init() {
  document.getElementById('btn-unlock').addEventListener('click', () =>
    unlock(document.getElementById('token').value.trim(), false)
  );
  document.getElementById('token').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') unlock(document.getElementById('token').value.trim(), false);
  });
  document.getElementById('btn-logout').addEventListener('click', logout);

  // 記憶済みトークンがあれば自動でログインを試す
  const saved = localStorage.getItem(TOKEN_KEY);
  if (saved) {
    document.getElementById('token').value = saved;
    unlock(saved, true);
  }
}

function ghHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

/* トークンを検証 → 通れば編集画面を表示 */
async function unlock(token, silent) {
  if (!token) { loginStatus('トークンを入力してください', 'err'); return; }
  loginStatus('確認中…', '');
  try {
    const res = await fetch(`${API}?ref=${REPO.branch}&t=${Date.now()}`, {
      headers: ghHeaders(token), cache: 'no-store',
    });
    if (res.status === 401) throw new Error('トークンが無効です');
    if (res.status === 403) throw new Error('権限不足です（Contents: Read and write を確認）');
    if (res.status === 404) {
      // ファイル未作成の可能性。リポジトリ自体にアクセスできるか確認
      const r2 = await fetch(REPO_API, { headers: ghHeaders(token) });
      if (!r2.ok) throw new Error('リポジトリにアクセスできません');
      messages = {};
    } else if (!res.ok) {
      throw new Error(`確認に失敗しました (${res.status})`);
    } else {
      const json = await res.json();
      messages = JSON.parse(b64decode(json.content) || '{}');
    }

    currentToken = token;
    if (document.getElementById('remember').checked) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    revealApp();
    buildEditor();
  } catch (e) {
    currentToken = '';
    if (silent) {
      localStorage.removeItem(TOKEN_KEY);
      loginStatus('保存されたトークンが無効になりました。再入力してください。', 'err');
    } else {
      loginStatus('⚠ ' + e.message, 'err');
    }
  }
}

function revealApp() {
  document.getElementById('login').hidden = true;
  document.getElementById('app').hidden = false;
}

function logout() {
  currentToken = '';
  localStorage.removeItem(TOKEN_KEY);
  document.getElementById('token').value = '';
  document.getElementById('app').hidden = true;
  document.getElementById('login').hidden = false;
  loginStatus('ログアウトしました', '');
}

/* コミット（競合回避のため直前に最新を取得してマージ） */
async function commit(date, name, message) {
  const getRes = await fetch(`${API}?ref=${REPO.branch}&t=${Date.now()}`, {
    headers: ghHeaders(currentToken), cache: 'no-store',
  });
  let sha, data = {};
  if (getRes.ok) {
    const j = await getRes.json();
    sha = j.sha;
    data = JSON.parse(b64decode(j.content) || '{}');
  } else if (getRes.status !== 404) {
    throw new Error(`読み込み失敗 (${getRes.status})`);
  }

  const next = { ...data };
  if (!message.trim() && !name.trim()) {
    delete next[date];
  } else {
    next[date] = { name: name.trim(), message: message.trim(), updatedAt: new Date().toISOString() };
  }

  const body = {
    message: `メッセージ更新: ${date}${name ? ` (${name})` : ''}`,
    content: b64encode(JSON.stringify(next, null, 2) + '\n'),
    branch: REPO.branch,
  };
  if (sha) body.sha = sha;

  const res = await fetch(API, { method: 'PUT', headers: ghHeaders(currentToken), body: JSON.stringify(body) });
  if (res.status === 401 || res.status === 403) throw new Error('権限がありません。ログインし直してください。');
  if (!res.ok) throw new Error(`保存失敗 (${res.status}) ${(await res.text()).slice(0, 120)}`);
  messages = next;
}

/* 全担当日の編集フォーム */
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
function loginStatus(msg, kind) {
  const el = document.getElementById('login-status');
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
function b64encode(str) { return btoa(unescape(encodeURIComponent(str))); }
function b64decode(b64) { return decodeURIComponent(escape(atob((b64 || '').replace(/\s/g, '')))); }
