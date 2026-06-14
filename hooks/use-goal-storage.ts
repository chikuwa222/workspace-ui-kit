"use client";

import { useEffect, useRef, useState } from "react";

import { type Goal, type Member } from "@/lib/goal-schema";

type GoalState = { members: Member[]; goals: Goal[] };

/**
 * API Route 経由で `data/periods/<activePeriod>.json` に永続化するフック。
 *
 * - 初期値は SSR（page.tsx）から props として受け取るため、マウント時の GET fetch は不要
 * - state 変更のたびに PUT /api/periods/[period] で自動保存する
 * - 保存失敗は console.error のみ（UI ブロックしない）
 * - 初回マウント時の保存スキップは loaded ref で制御する（旧 localStorage 版と同パターン）
 */
export function useGoalStorage(
  initialMembers: Member[],
  initialGoals: Goal[],
  activePeriod: string,
) {
  const [state, setState] = useState<GoalState>({
    members: initialMembers,
    goals: initialGoals,
  });
  const loaded = useRef(false);

  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      return;
    }
    fetch(`/api/periods/${activePeriod}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    }).catch((err) => {
      console.error("[use-goal-storage] 保存に失敗しました:", err);
    });
  }, [state, activePeriod]);

  return [state, setState] as const;
}
