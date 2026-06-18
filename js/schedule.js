/* =========================================================
   設定 — 必要ならここだけ編集すればOK
   ========================================================= */

// カウントダウンの終了時刻（6/30 終日 = 翌7/1 0時にちょうど0になる）
const COUNTDOWN_TARGET = '2026-07-01T00:00:00+09:00';

// 集客期間（進捗ゲージ「○%終了！」の計算に使用）4/1〜6/30 の3ヶ月間
const PERIOD_START = '2026-04-01T00:00:00+09:00';
const PERIOD_END   = '2026-07-01T00:00:00+09:00';

// 管理画面のコミット先リポジトリ
const REPO = {
  owner: 'yugakume',
  repo: 'countdown-57',
  path: 'data/messages.json',
  branch: 'main',
};

// 担当スケジュール（順番は LINE_NOTE_260618_1.jpg より）
// group: 色分け用キー（'g1' | 'g2' | 'g3' | 'g4' | 'kanagawa' | ''）
// badge: カレンダーに表示する色タグの文字（空ならタグなし）
// name : 既定の担当者名（管理画面で上書き可）
const SCHEDULE = [
  { date: '2026-06-05', group: '',         badge: '',         name: '鈴木' },
  { date: '2026-06-06', group: '',         badge: '',         name: '遠藤' },
  { date: '2026-06-07', group: '',         badge: '',         name: '大城' },
  { date: '2026-06-08', group: '',         badge: '',         name: '山田' },
  { date: '2026-06-09', group: 'g1',       badge: 'G1',       name: '酒井' },
  { date: '2026-06-10', group: 'g2',       badge: 'G2',       name: '谷田部' },
  { date: '2026-06-11', group: 'g3',       badge: 'G3',       name: '櫻井' },
  { date: '2026-06-12', group: 'g4',       badge: 'G4',       name: '湯澤' },
  { date: '2026-06-13', group: 'kanagawa', badge: '神奈川',   name: '三浦' },
  { date: '2026-06-14', group: 'g1',       badge: 'G1',       name: '石井' },
  { date: '2026-06-15', group: 'g2',       badge: 'G2',       name: '桑田' },
  { date: '2026-06-16', group: 'g3',       badge: 'G3',       name: '臼井' },
  { date: '2026-06-17', group: 'g4',       badge: 'G4',       name: '松浦' },
  { date: '2026-06-18', group: 'kanagawa', badge: '神奈川',   name: '園田' },
  { date: '2026-06-19', group: '',         badge: '',         name: '宮川さん' },
  { date: '2026-06-20', group: 'g1',       badge: 'G1',       name: '市原' },
  { date: '2026-06-21', group: 'g2',       badge: 'G2',       name: '宮内' },
  { date: '2026-06-22', group: 'g3',       badge: 'G3',       name: '久米' },
  { date: '2026-06-23', group: 'g4',       badge: 'G4',       name: '鈴木(かなえ)' },
  { date: '2026-06-24', group: 'kanagawa', badge: '神奈川',   name: '谷山' },
  { date: '2026-06-25', group: 'g1',       badge: 'G1代表',   name: '' },
  { date: '2026-06-26', group: 'g2',       badge: 'G2代表',   name: '' },
  { date: '2026-06-27', group: 'g3',       badge: 'G3代表',   name: '' },
  { date: '2026-06-28', group: 'g4',       badge: 'G4代表',   name: '' },
  { date: '2026-06-29', group: 'kanagawa', badge: '神奈川代表', name: '' },
  { date: '2026-06-30', group: '',         badge: '🎉',       name: '久保田響', finale: true },
];

// date文字列から SCHEDULE を引く
const SCHEDULE_BY_DATE = Object.fromEntries(SCHEDULE.map((s) => [s.date, s]));

// 残り日数（6/30 を 0 とする）
function remainingDaysFor(dateStr) {
  const day = Number(dateStr.slice(8, 10));
  return Math.max(0, 30 - day);
}

// 今日の日付（日本時間） 例: "2026-06-18"
function jstToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}
