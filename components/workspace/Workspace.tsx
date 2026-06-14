"use client";

/**
 * Workspace: グループメンバー目標進捗管理ツールの 4 ペイン親コンポーネント。
 *
 * ペイン構成:
 *   Pane 1 (MemberPane)    — メンバー一覧サイドバー（折りたたみ可）
 *   Pane 2 (GoalListPane)  — 選択メンバーの目標一覧（進捗バー付き）
 *   Pane 3 (GoalDetailPane)— 選択目標の詳細（インライン編集 + チェックリスト）
 *   Pane 4 (SummaryPane)   — 全メンバー × 行動評価項目の合計点数テーブル
 *
 * レイアウト（Workspace.tsx を SSoT とする）:
 * ```
 * <SidebarProvider>
 * ┌─ MemberPane (Pane 1) ─┬─ SidebarInset ────────────────────────────┐
 * │ 折りたたみ可           │ ┌─ GlobalHeader (h-12) ─────────────────┐ │
 * │ collapsible="icon"     │ └──────────────────────────────────────── ┘ │
 * │                        │ ┌─ Pane 2 ─┬─────── Pane 3 ─────────┬ Pane 4 ┐ │
 * │                        │ │ w-72     │   flex-1               │ w-480  │ │
 * └───────────────────────┴─┴──────────┴─────────────────────────┴────────┘
 * ```
 */

import { useCallback, useMemo, useState } from "react";

import {
  type ChecklistItem,
  type Evaluation,
  type Goal,
  type Member,
} from "@/lib/goal-schema";
import { useGoalStorage } from "@/hooks/use-goal-storage";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { GlobalHeader } from "@/components/workspace/GlobalHeader";
import { GoalDetailPane } from "@/components/workspace/GoalDetailPane";
import { GoalListPane } from "@/components/workspace/GoalListPane";
import { MemberPane } from "@/components/workspace/MemberPane";
import { SummaryPane } from "@/components/workspace/SummaryPane";

type WorkspaceProps = {
  initialMembers: Member[];
  initialGoals: Goal[];
  workspace: { name: string; icon: string };
  activePeriod: string;
};

export function Workspace({
  initialMembers,
  initialGoals,
  workspace,
  activePeriod,
}: WorkspaceProps) {
  const [{ members, goals }, setGoalState] = useGoalStorage(
    initialMembers,
    initialGoals,
    activePeriod,
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    initialMembers[0]?.id ?? null,
  );
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [pane4Open, setPane4Open] = useState(true);

  // ===== 派生値 =====
  const selectedMember =
    members.find((m) => m.id === selectedMemberId) ?? null;
  const selectedGoal = goals.find((g) => g.id === selectedGoalId) ?? null;
  const memberGoals = useMemo(
    () => goals.filter((g) => g.memberId === selectedMemberId),
    [goals, selectedMemberId],
  );

  // ===== メンバー操作 =====

  const addMember = useCallback(
    (name: string) => {
      const newMember: Member = { id: `m-${Date.now()}`, name };
      setGoalState((s) => ({ ...s, members: [...s.members, newMember] }));
      setSelectedMemberId(newMember.id);
      setSelectedGoalId(null);
    },
    [setGoalState],
  );

  const editMember = useCallback(
    (id: string, name: string) => {
      setGoalState((s) => ({
        ...s,
        members: s.members.map((m) => (m.id === id ? { ...m, name } : m)),
      }));
    },
    [setGoalState],
  );

  const deleteMember = useCallback(
    (id: string) => {
      setGoalState((s) => ({
        members: s.members.filter((m) => m.id !== id),
        goals: s.goals.filter((g) => g.memberId !== id),
      }));
      setSelectedMemberId((prev) => {
        if (prev !== id) return prev;
        const remaining = members.filter((m) => m.id !== id);
        return remaining[0]?.id ?? null;
      });
      setSelectedGoalId((prev) => {
        const surviving = goals
          .filter((g) => g.memberId !== id)
          .map((g) => g.id);
        return surviving.includes(prev ?? "") ? prev : null;
      });
    },
    [setGoalState, members, goals],
  );

  const selectMember = useCallback((id: string) => {
    setSelectedMemberId(id);
    setSelectedGoalId(null);
  }, []);

  // ===== 目標操作 =====

  const addGoal = useCallback(
    (memberId: string, title: string) => {
      const newGoal: Goal = {
        id: `g-${Date.now()}`,
        memberId,
        title,
        items: [],
      };
      setGoalState((s) => ({ ...s, goals: [...s.goals, newGoal] }));
      setSelectedGoalId(newGoal.id);
    },
    [setGoalState],
  );

  const deleteGoal = useCallback(
    (id: string) => {
      setGoalState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));
      setSelectedGoalId((prev) => (prev === id ? null : prev));
    },
    [setGoalState],
  );

  const updateGoal = useCallback(
    (goalId: string, patch: Partial<Pick<Goal, "title" | "deadline">>) => {
      setGoalState((s) => ({
        ...s,
        goals: s.goals.map((g) =>
          g.id === goalId ? { ...g, ...patch } : g,
        ),
      }));
    },
    [setGoalState],
  );

  // ===== チェックリスト操作 =====

  const toggleItem = useCallback(
    (goalId: string, itemId: string) => {
      setGoalState((s) => ({
        ...s,
        goals: s.goals.map((g) =>
          g.id === goalId
            ? {
                ...g,
                items: g.items.map((i) =>
                  i.id === itemId ? { ...i, done: !i.done } : i,
                ),
              }
            : g,
        ),
      }));
    },
    [setGoalState],
  );

  const addItem = useCallback(
    (goalId: string, label: string) => {
      const newItem: ChecklistItem = {
        id: `i-${Date.now()}`,
        label,
        memo: "",
        done: false,
        evaluations: [],
      };
      setGoalState((s) => ({
        ...s,
        goals: s.goals.map((g) =>
          g.id === goalId ? { ...g, items: [...g.items, newItem] } : g,
        ),
      }));
    },
    [setGoalState],
  );

  const deleteItem = useCallback(
    (goalId: string, itemId: string) => {
      setGoalState((s) => ({
        ...s,
        goals: s.goals.map((g) =>
          g.id === goalId
            ? { ...g, items: g.items.filter((i) => i.id !== itemId) }
            : g,
        ),
      }));
    },
    [setGoalState],
  );

  const updateItem = useCallback(
    (
      goalId: string,
      itemId: string,
      patch: Partial<Pick<ChecklistItem, "label" | "memo">>,
    ) => {
      setGoalState((s) => ({
        ...s,
        goals: s.goals.map((g) =>
          g.id === goalId
            ? {
                ...g,
                items: g.items.map((i) =>
                  i.id === itemId ? { ...i, ...patch } : i,
                ),
              }
            : g,
        ),
      }));
    },
    [setGoalState],
  );

  const addEvaluation = useCallback(
    (itemId: string, ev: Omit<Evaluation, "id">) => {
      const newEv: Evaluation = { ...ev, id: `ev-${Date.now()}` };
      setGoalState((s) => ({
        ...s,
        goals: s.goals.map((g) => ({
          ...g,
          items: g.items.map((i) =>
            i.id === itemId
              ? { ...i, evaluations: [...i.evaluations, newEv] }
              : i,
          ),
        })),
      }));
    },
    [setGoalState],
  );

  const deleteEvaluation = useCallback(
    (itemId: string, evalId: string) => {
      setGoalState((s) => ({
        ...s,
        goals: s.goals.map((g) => ({
          ...g,
          items: g.items.map((i) =>
            i.id === itemId
              ? { ...i, evaluations: i.evaluations.filter((e) => e.id !== evalId) }
              : i,
          ),
        })),
      }));
    },
    [setGoalState],
  );

  const togglePane4 = useCallback(() => setPane4Open((v) => !v), []);

  return (
    <SidebarProvider
      defaultOpen
      className="h-screen w-full overflow-hidden bg-background text-foreground"
    >
      <MemberPane
        workspaceName={workspace.name}
        members={members}
        goals={goals}
        selectedMemberId={selectedMemberId}
        onSelectMember={selectMember}
        onAddMember={addMember}
        onEditMember={editMember}
        onDeleteMember={deleteMember}
      />
      <SidebarInset className="flex min-w-0 flex-col bg-background">
        <GlobalHeader
          crumb1={workspace.name}
          crumb2={selectedMember?.name ?? "—"}
          crumb3={selectedGoal?.title ?? "—"}
        />
        <div className="flex min-h-0 flex-1">
          <GoalListPane
            member={selectedMember}
            goals={memberGoals}
            selectedGoalId={selectedGoalId}
            onSelectGoal={setSelectedGoalId}
            onAddGoal={(title) => {
              if (selectedMemberId) addGoal(selectedMemberId, title);
            }}
            onDeleteGoal={deleteGoal}
          />
          <GoalDetailPane
            goal={selectedGoal}
            onUpdateGoal={(patch) => {
              if (selectedGoal) updateGoal(selectedGoal.id, patch);
            }}
            onToggleItem={(itemId) => {
              if (selectedGoal) toggleItem(selectedGoal.id, itemId);
            }}
            onAddItem={(label) => {
              if (selectedGoal) addItem(selectedGoal.id, label);
            }}
            onDeleteItem={(itemId) => {
              if (selectedGoal) deleteItem(selectedGoal.id, itemId);
            }}
            onUpdateItem={(itemId, patch) => {
              if (selectedGoal) updateItem(selectedGoal.id, itemId, patch);
            }}
            onAddEvaluation={addEvaluation}
            onDeleteEvaluation={deleteEvaluation}
          />
          <SummaryPane
            members={members}
            goals={goals}
            open={pane4Open}
            onToggle={togglePane4}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
