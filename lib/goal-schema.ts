/**
 * グループメンバー目標進捗管理ツールの Zod スキーマと派生型。
 * UI コンポーネントはここから型をインポートする。
 */

import { z } from "zod";

// ===== 評価レコード =====

export const evaluationSchema = z.object({
  id: z.string(),
  score: z.number(),          // -5 / -3 / -1 / +1 / +3 / +5
  category: z.string(),       // マスターデータのカテゴリ名
  item: z.string(),           // マスターデータの評価項目名
  comment: z.string().default(""),
  date: z.string(),           // YYYY-MM-DD
});
export type Evaluation = z.infer<typeof evaluationSchema>;

// ===== チェックリスト項目 =====

export const checklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  memo: z.string().default(""),
  done: z.boolean().default(false),
  evaluations: z.array(evaluationSchema).default([]),
});
export type ChecklistItem = z.infer<typeof checklistItemSchema>;

// ===== 目標 =====

export const goalSchema = z.object({
  id: z.string(),
  memberId: z.string(),
  title: z.string(),
  /** ISO 8601 (YYYY-MM-DD)。省略可。 */
  deadline: z.string().optional(),
  items: z.array(checklistItemSchema),
});
export type Goal = z.infer<typeof goalSchema>;

// ===== メンバー =====

export const memberSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type Member = z.infer<typeof memberSchema>;

// ===== JSON 全体用スキーマ =====

export const membersSchema = z.array(memberSchema);
export const goalsSchema = z.array(goalSchema);
export const workspaceSchema = z.object({
  name: z.string(),
  icon: z.string(),
});

// ===== 派生計算ユーティリティ =====

/** チェックリストの完了数から進捗率（0〜100）を計算する。項目なしは 0。 */
export function calcProgress(items: ChecklistItem[]): number {
  if (items.length === 0) return 0;
  return Math.round((items.filter((i) => i.done).length / items.length) * 100);
}

/** チェックリスト全体の評価スコアを合算する。評価なしは 0。 */
export function calcBehaviorScore(items: ChecklistItem[]): number {
  return items.flatMap((i) => i.evaluations).reduce((sum, e) => sum + e.score, 0);
}

/**
 * 期限超過かどうかを判定する。
 * 条件: deadline が今日より前 かつ 進捗率が 100% 未満。
 */
export function isOverdue(goal: Goal): boolean {
  if (!goal.deadline) return false;
  const today = new Date().toISOString().slice(0, 10);
  return goal.deadline < today && calcProgress(goal.items) < 100;
}
