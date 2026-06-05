/**
 * グループメンバー目標進捗管理ツールの Zod スキーマと派生型。
 * UI コンポーネントはここから型をインポートする。
 */

import { z } from "zod";

// ===== 評価レコード =====

export const evaluationSchema = z.object({
  id: z.string(),
  score: z.union([
    z.literal(-3),
    z.literal(-2),
    z.literal(-1),
    z.literal(1),
    z.literal(2),
    z.literal(3),
  ]),
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
  /** ISO 8601 (YYYY-MM-DD)。省略可。 */
  deadline: z.string().optional(),
  evaluations: z.array(evaluationSchema).default([]),
});
export type ChecklistItem = z.infer<typeof checklistItemSchema>;

// ===== 目標 =====

export const goalSchema = z.object({
  id: z.string(),
  memberId: z.string(),
  title: z.string(),
  /** ウェイト（0〜100）。0 のとき単純平均にフォールバック。 */
  weight: z.number().min(0).max(100).default(0),
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
 * メンバーの全目標を集約し加重平均進捗率を返す。
 * 全 weight が 0 のときは単純平均にフォールバック。
 */
export function calcWeightedMemberProgress(goals: Goal[]): number {
  if (goals.length === 0) return 0;
  const totalWeight = goals.reduce((s, g) => s + g.weight, 0);
  if (totalWeight === 0) {
    return Math.round(
      goals.reduce((s, g) => s + calcProgress(g.items), 0) / goals.length,
    );
  }
  return Math.round(
    goals.reduce((s, g) => s + g.weight * calcProgress(g.items), 0) /
      totalWeight,
  );
}

/**
 * タスク単位の期限超過判定。
 * 条件: item.deadline が今日より前 かつ 未完了。
 */
export function isItemOverdue(item: ChecklistItem): boolean {
  if (!item.deadline) return false;
  const today = new Date().toISOString().slice(0, 10);
  return item.deadline < today && !item.done;
}

/**
 * 目標単位の期限超過判定（後方互換維持）。
 * いずれかのタスクが期限超過していれば true。
 */
export function isOverdue(goal: Goal): boolean {
  return goal.items.some(isItemOverdue);
}
