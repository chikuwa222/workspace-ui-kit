# グループメンバー目標進捗管理ツール 仕様書

workspace-ui-kit の採用管理サンプルを改造して作成した、グループメンバーの目標進捗を管理するためのローカルツールです。

## ツール概要

| 項目 | 内容 |
|---|---|
| ツール名 | 目標管理 |
| 目的 | ① 会社配布の目標管理シートを基に、一次評価者が評価を行い、二次評価者に引き継いで最終評価を決める流れを支援する |
| | ② グループメンバー全員の今期目標とサブタスクの進捗をいつでも把握できるようにする |
| | ③ 評価プロセスに公平性を持たせ、メンバーの成長と目標達成を促進する |
| 使い手 | 自分一人（複数人が同時にアクセスする想定なし） |
| データ保存 | JSON ファイル（`data/periods/` 配下）。Next.js API Route 経由で読み書き。バックエンド DB は使わない |
| 起動 | `npm run dev` → `http://localhost:3000` |

---

## 4ペイン構成

```
<SidebarProvider>
┌─ Pane 1 ──────┬─ SidebarInset ──────────────────────────────────────┐
│ MemberPane    │ ┌─ GlobalHeader (h-12) ─────────────────────────┐   │
│ 折りたたみ可  │ └───────────────────────────────────────────────┘   │
│               │ ┌─ Pane 2 ──┬──── Pane 3 ──────────┬─ Pane 4 ────┐ │
│               │ │ リサイズ可 │   リサイズ可          │ 折りたたみ可 │ │
└───────────────┴─┴───────────┴──────────────────────┴─────────────┘
```

| ペイン | コンポーネント | 役割 |
|---|---|---|
| Pane 1 | `MemberPane` | メンバー一覧サイドバー。追加・削除。折りたたみ可（`collapsible="icon"`） |
| Pane 2 | `GoalListPane` | 選択メンバーの今期目標一覧。各行に進捗バーと遅延バッジを表示。幅調整可（リサイズハンドル） |
| Pane 3 | `GoalDetailPane` | 選択目標の詳細。タイトル・期限のインライン編集 + チェックリスト。幅調整可（リサイズハンドル） |
| Pane 4 | `EvaluationScorePane` | 選択メンバーのプロセス評価・行動指針評価スコア表示。大分類合計 + ホバーで小分類内訳表示。折りたたみ可 |

---

## 機能詳細

### 1. メンバーを管理する（Pane 1）

- メンバーの追加・削除
- サイドバー折りたたみでメイン画面を広く使う

### 2. 目標を一覧で把握する（Pane 2）

- 選択したメンバーの目標一覧を表示
- 各目標に進捗バー（完了サブタスク数 ÷ 総サブタスク数）を表示
- 期限切れ・未達成の目標に遅延バッジを表示
- 幅調整可（リサイズハンドル）で他のペインを広く使う

### 3. 目標の中身を確認・編集する（Pane 3）

- 目標タイトル・期限をインラインで編集
- サブタスク（チェックリスト）の追加・完了チェック・メモ編集
- サブタスクごとに行動評価（スコア）を記録（カテゴリ・項目・コメント・日付）
- 幅調整可（リサイズハンドル）で他のペインを広く使う

### 4. 選択メンバーの評価スコアを表示する（Pane 4）

- プロセス評価・行動指針評価の各大分類合計スコアを表示
- 大分類（例：業務遂行力）にカーソルを合わせると、各小分類（例：専門知識、顧客対応力 …）の点数を表示
- サイドバー折りたたみでメイン画面を広く使う

### 5. データを永続化する

- state 変更のたびに API Route 経由で `data/periods/<期>.json` へ自動保存
- 次回起動時も状態を引き継ぐ
- 「新しい期を開始」で現在期のデータをコピーして次期ファイルを生成（目標・サブタスク引き継ぎ、行動評価はリセット）
- CSV エクスポートボタンで任意の期のデータをダウンロード

---

## データ設計

型定義は [`lib/goal-schema.ts`](../lib/goal-schema.ts) に集約している。

```typescript
type Evaluation = {
  id: string;
  score: number;      // -3 / -2 / -1 / +1 / +2 / +3
  category: string;   // マスターデータのカテゴリ名（例: "理念", "業務遂行力"）
  item: string;       // マスターデータの評価項目名
  comment: string;    // 補足コメント（空文字可）
  date: string;       // YYYY-MM-DD
};

type ChecklistItem = {
  id: string;
  label: string;            // タスク名
  memo: string;             // 補足メモ（空文字可）
  done: boolean;            // 完了フラグ
  evaluations: Evaluation[]; // 行動評価の履歴
};

type Goal = {
  id: string;
  memberId: string;          // 紐づくメンバーの id
  title: string;             // 目標タイトル
  deadline?: string;         // 任意の期限（ISO 8601 / YYYY-MM-DD）
  items: ChecklistItem[];    // サブタスク一覧
};

type Member = {
  id: string;
  name: string;   // 名前のみ（役職・チーム等のフィールドは持たない）
};
```

評価マスターデータ（固定）: [`lib/evaluation-master.ts`](../lib/evaluation-master.ts)
初期モックデータ: [`data/members.json`](../data/members.json) / [`data/goals.json`](../data/goals.json)

---

## 進捗の計算ルール

- **計算式**: `完了サブタスク数 ÷ 総サブタスク数 × 100`（%、0〜100 の整数）
- サブタスクが 0 件のときは **0%**
- 進捗率は **state に持たない**。レンダー時に毎回派生計算する（`calcProgress` ユーティリティ）

```typescript
// lib/goal-schema.ts
export function calcProgress(items: ChecklistItem[]): number {
  if (items.length === 0) return 0;
  return Math.round((items.filter((i) => i.done).length / items.length) * 100);
}
```

## 行動スコアの計算ルール

- サブタスク内の全 `Evaluation.score` を合算する（`calcBehaviorScore` ユーティリティ）
- 目標単位: `calcBehaviorScore(goal.items)`
- メンバー単位: `calcBehaviorScore(memberGoals.flatMap(g => g.items))`
- スコアが **0** の場合は UI 上に表示しない

```typescript
// lib/goal-schema.ts
export function calcBehaviorScore(items: ChecklistItem[]): number {
  return items.flatMap((i) => i.evaluations).reduce((sum, e) => sum + e.score, 0);
}
```

---

## 遅延アラートの条件

Pane 2 の遅延バッジで使用する。

- **条件**: `deadline < 今日の日付` かつ `進捗率 < 100%`
- 期限が設定されていない目標は対象外

```typescript
// lib/goal-schema.ts
export function isOverdue(goal: Goal): boolean {
  if (!goal.deadline) return false;
  const today = new Date().toISOString().slice(0, 10);
  return goal.deadline < today && calcProgress(goal.items) < 100;
}
```

---

## データ永続化

データはプロジェクトフォルダ内の JSON ファイルとして保存する。ブラウザキャッシュとは独立しているため、キャッシュ削除によるデータ消失が起きない。

### ファイル構成

```
data/
  config.json          # アクティブな期のキー（例: "2025-H2"）
  periods/
    2025-H1.json       # 過去期（アーカイブ。読み取り専用）
    2025-H2.json       # 現在期（読み書き）
```

### 各ファイルの形式

```typescript
// config.json
{ "activePeriod": "2025-H2" }

// periods/<period>.json
{
  "members": Member[],
  "goals": Goal[]
}
```

### 読み書きの仕組み

| 項目 | 内容 |
|---|---|
| 読み込み | 起動時に `GET /api/periods/[period]` で現在期の JSON を取得 |
| 書き込み | state 変更のたびに `PUT /api/periods/[period]` で自動保存 |
| 期の切り替え | `PATCH /api/config` でアクティブ期を更新 |
| 新期作成 | 「新しい期を開始」操作で現在期データをコピーして新ファイルを生成。目標・サブタスクは引き継がれ、行動評価（`evaluations`）はリセットされる |
| 過去期参照 | `GET /api/periods/[period]` で過去期ファイルを読み取り専用で取得。評価入力時に前期スコアを参照するために使用 |

### CSV エクスポート

`GET /api/export/csv?period=<period>` で指定期のデータを CSV 形式でダウンロード。

---

## 主要ファイル一覧

| ファイル | 役割 |
|---|---|
| [`components/workspace/Workspace.tsx`](../components/workspace/Workspace.tsx) | 4ペイン親コンポーネント。全 state・ハンドラを集約する（SSoT） |
| [`components/workspace/MemberPane.tsx`](../components/workspace/MemberPane.tsx) | Pane 1 |
| [`components/workspace/GoalListPane.tsx`](../components/workspace/GoalListPane.tsx) | Pane 2 |
| [`components/workspace/GoalDetailPane.tsx`](../components/workspace/GoalDetailPane.tsx) | Pane 3 |
| [`components/workspace/EvaluationScorePane.tsx`](../components/workspace/EvaluationScorePane.tsx) | Pane 4 |
| [`components/workspace/EvaluationPopover.tsx`](../components/workspace/EvaluationPopover.tsx) | 行動評価入力ポップオーバー（Pane 3 内サブタスク行から呼び出す） |
| [`lib/goal-schema.ts`](../lib/goal-schema.ts) | 型定義・Zod スキーマ・派生計算ユーティリティ |
| [`lib/evaluation-master.ts`](../lib/evaluation-master.ts) | 行動評価マスターデータ（プロセス評価・行動指針評価の固定選択肢） |
| [`app/api/periods/[period]/route.ts`](../app/api/periods/) | 期データの GET / PUT API Route |
| [`app/api/config/route.ts`](../app/api/config/route.ts) | アクティブ期の取得・切り替え API Route |
| [`app/api/export/csv/route.ts`](../app/api/export/csv/route.ts) | CSV エクスポート API Route |
| [`hooks/use-goal-storage.ts`](../hooks/use-goal-storage.ts) | API Route を呼び出す永続化フック（localStorage は使わない） |
| [`data/config.json`](../data/config.json) | アクティブ期の設定ファイル |
| [`data/periods/`](../data/periods/) | 期ごとの JSON データフォルダ |
| [`app/page.tsx`](../app/page.tsx) | Next.js エントリ。JSON を読み込み `<Workspace>` に渡す |

---

## 追加機能

### 6. PDF レポート出力

各メンバーの目標ごとに、以下の内容を含む PDF レポートを出力する。

- 目標タイトル・期限・達成率（進捗バーと数値）
- 評価項目の大分類別合計点数
- 各サブタスクの行動評価（カテゴリ・項目・スコア・コメント）

---

## 追加検討中の機能

以下は将来候補。現時点では実装しない。

| 機能 | 概要 |
|---|---|
| Excel 目標シート取り込み | 期初にメンバーが記入した Excel 目標管理シートを取り込み、目標・サブタスクを自動生成する |
| Excel 評価コメント案出力 | Excel 評価シートのコメント欄に記入する内容案を、蓄積した行動評価データを基に生成・出力する |

---

## やらないこと

- メンバーの役職・チーム等のメタ情報管理
- 複数人の同時編集・リアルタイム同期
- 認証・権限管理
- Excel 目標シート取り込み・Excel 評価コメント案出力（追加検討中。現時点では実装しない）
