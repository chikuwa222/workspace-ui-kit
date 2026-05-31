# グループメンバー目標進捗管理ツール 仕様書

workspace-ui-kit の採用管理サンプルを改造して作成した、グループメンバーの目標進捗を管理するためのローカルツールです。

## ツール概要

| 項目 | 内容 |
|---|---|
| ツール名 | 目標管理 |
| 目的 | グループメンバー全員の今期目標とサブタスクの進捗を一画面で把握する |
| 使い手 | 自分一人（複数人が同時にアクセスする想定なし） |
| データ保存 | localStorage（キー: `goal-tracker`）。バックエンド・DB は使わない |
| 起動 | `npm run dev` → `http://localhost:3000` |

---

## 4ペイン構成

```
<SidebarProvider>
┌─ Pane 1 ──────┬─ SidebarInset ─────────────────────────────────┐
│ MemberPane    │ ┌─ GlobalHeader (h-12) ─────────────────────┐  │
│ 折りたたみ可  │ └───────────────────────────────────────────┘  │
│               │ ┌─ Pane 2 ──┬──── Pane 3 ────────┬─ Pane 4 ─┐ │
│               │ │ w-72      │   flex-1            │  w-72    │ │
└───────────────┴─┴───────────┴─────────────────────┴──────────┘
```

| ペイン | コンポーネント | 役割 |
|---|---|---|
| Pane 1 | `MemberPane` | メンバー一覧サイドバー。追加・削除。折りたたみ可（`collapsible="icon"`） |
| Pane 2 | `GoalListPane` | 選択メンバーの今期目標一覧。各行に進捗バー表示 |
| Pane 3 | `GoalDetailPane` | 選択目標の詳細。タイトル・期限のインライン編集 + チェックリスト |
| Pane 4 | `SummaryPane` | 全体サマリー。全メンバーの達成率バー + 遅延アラート。Pane4Toggle で開閉 |

---

## データ設計

型定義は [`lib/goal-schema.ts`](../lib/goal-schema.ts) に集約している。

```typescript
type Evaluation = {
  id: string;
  score: number;      // -5 / -3 / -1 / +1 / +3 / +5（重み付け）
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

Pane 4 および Pane 2 の遅延バッジで使用する。

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

[`hooks/use-goal-storage.ts`](../hooks/use-goal-storage.ts) が担当する。

| 項目 | 内容 |
|---|---|
| localStorage キー | `goal-tracker` |
| 保存形式 | `{ members: Member[], goals: Goal[] }` を JSON 文字列化 |
| 初回読み込み | マウント時に localStorage から読み込み、なければ `app/page.tsx` の初期 JSON を使用 |
| 書き込みタイミング | state 変更のたびに自動保存 |
| Hydration | SSR/CSR の mismatch を避けるため、初回レンダーはサーバー値を使い `useEffect` で差し替え |

---

## 主要ファイル一覧

| ファイル | 役割 |
|---|---|
| [`components/workspace/Workspace.tsx`](../components/workspace/Workspace.tsx) | 4ペイン親コンポーネント。全 state・ハンドラを集約する（SSoT） |
| [`components/workspace/MemberPane.tsx`](../components/workspace/MemberPane.tsx) | Pane 1 |
| [`components/workspace/GoalListPane.tsx`](../components/workspace/GoalListPane.tsx) | Pane 2 |
| [`components/workspace/GoalDetailPane.tsx`](../components/workspace/GoalDetailPane.tsx) | Pane 3 |
| [`components/workspace/SummaryPane.tsx`](../components/workspace/SummaryPane.tsx) | Pane 4 |
| [`components/workspace/EvaluationPopover.tsx`](../components/workspace/EvaluationPopover.tsx) | 行動評価入力ポップオーバー（Pane 3 内サブタスク行から呼び出す） |
| [`lib/goal-schema.ts`](../lib/goal-schema.ts) | 型定義・Zod スキーマ・派生計算ユーティリティ |
| [`lib/evaluation-master.ts`](../lib/evaluation-master.ts) | 行動評価マスターデータ（プロセス評価・行動指針評価の固定選択肢） |
| [`hooks/use-goal-storage.ts`](../hooks/use-goal-storage.ts) | localStorage 永続化フック |
| [`data/members.json`](../data/members.json) | メンバー初期データ |
| [`data/goals.json`](../data/goals.json) | 目標初期データ |
| [`app/page.tsx`](../app/page.tsx) | Next.js エントリ。JSON を読み込み `<Workspace>` に渡す |

---

## やらないこと

- メンバーの役職・チーム等のメタ情報管理
- 複数人の同時編集・バックエンド連携
- 認証・権限管理
- データのエクスポート・インポート（次フェーズ候補）
