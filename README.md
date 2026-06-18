# 首都圏！集客カウントダウン

ドットジェイピー首都圏の集客期間（〜2026/6/30）カウントダウンサイトです。
GitHub Pages でホストする静的サイトで、サーバーは不要です。

- **公開ページ** … カウントダウン（毎秒）＋進捗ゲージ（○%終了）＋6月カレンダー＋本日のメッセージ
- **管理者ページ（`admin.html`）** … 管理者がブラウザから毎日のメッセージを入力 → リポジトリに自動コミット → 約1分で公開ページに反映

## 公開URL

https://yugakume.github.io/countdown-57/

## 仕組み

メッセージは `data/messages.json` に `{ "2026-06-18": { "name": "園田", "message": "..." } }` の形で保存されます。
管理者ページからの保存は、GitHub API でこのファイルをコミットすることで行われます（Pages が再ビルドして全員に反映）。

```
index.html        公開ページ
admin.html        管理者ページ
css/              スタイル
js/schedule.js    担当スケジュール・各種設定（ここを編集すれば調整可）
js/app.js         公開ページのロジック
js/admin.js       管理者ページのロジック
data/messages.json メッセージ保存先
```

## 管理者の使い方（メッセージ入力）

1. **アクセストークンを1度だけ作成**
   - GitHub → Settings → Developer settings → **Personal access tokens → Fine-grained tokens** → *Generate new token*
   - Repository access: **Only select repositories → `countdown-57`**
   - Permissions: **Contents → Read and write**
   - 生成された `github_pat_...` をコピー
   - （クラシックトークンの場合は `repo` スコープでも可）
2. `admin.html`（公開URL＋`/admin.html`）を開き、トークン欄に貼り付けて「記憶」
   - トークンはその端末のブラウザにのみ保存されます
3. 各日の「担当者名」「メッセージ」を入力 →「保存して公開」
4. 約1分後、公開ページに反映されます

> 代表（6/25〜6/29）の担当者名は未定なので、決まったら管理者ページで名前を入れてください。

## 設定の変更

`js/schedule.js` 先頭の定数を編集してコミットすれば反映されます。

- `COUNTDOWN_TARGET` … カウントダウンの終了時刻
- `PERIOD_START` / `PERIOD_END` … 進捗ゲージの集客期間
- `SCHEDULE` … 担当者・グループ・日付

## ローカルで確認

```bash
cd countdown-57
python3 -m http.server 8000
# → http://localhost:8000 を開く
```
（`file://` で直接開くと `fetch` がブロックされるため、簡易サーバー経由で開いてください）
