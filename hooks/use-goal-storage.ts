"use client";

import { useEffect, useRef, useState } from "react";

import { type Goal, type Member, goalsSchema, membersSchema } from "@/lib/goal-schema";

const STORAGE_KEY = "goal-tracker";

type GoalState = { members: Member[]; goals: Goal[] };

/**
 * localStorage に `{ members, goals }` を永続化するフック。
 *
 * - 初回マウント時に localStorage から読み込み、なければ初期値を使用する
 * - state 変更のたびに localStorage へ書き込む
 * - SSR/CSR の hydration mismatch を避けるため、初回レンダーはサーバー値を使い、
 *   useEffect で localStorage の値に差し替える（use-mobile.ts と同じパターン）
 *
 * 定義順の注意: 保存 Effect を先に定義することで、初回マウント時に保存 Effect が
 * 先に実行され loaded.current = false により書き込みをスキップできる。
 */
export function useGoalStorage(initialMembers: Member[], initialGoals: Goal[]) {
  const [state, setState] = useState<GoalState>({
    members: initialMembers,
    goals: initialGoals,
  });
  const loaded = useRef(false);

  // 保存 Effect（先に定義 → 初回は loaded.current = false でスキップ）
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage が使えない環境では無視する
    }
  }, [state]);

  // 読み込み Effect（後に定義 → 初回マウント時に localStorage を読み込む）
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Zod スキーマを通すことで、スキーマ追加後の default 値（evaluations: [] など）を補完する
        const members = membersSchema.catch(initialMembers).parse(parsed?.members);
        const goals = goalsSchema.catch(initialGoals).parse(parsed?.goals);
        setState({ members, goals });
      }
    } catch {
      // パース失敗時は初期値を維持
    }
    loaded.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [state, setState] as const;
}
