"use client";

import { useMemo } from "react";
import { AlertCircle } from "lucide-react";

import { type Goal, type Member, calcBehaviorScore, calcProgress, isOverdue } from "@/lib/goal-schema";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Pane4Toggle } from "@/components/workspace/Pane4Toggle";

type SummaryPaneProps = {
  members: Member[];
  goals: Goal[];
  open: boolean;
  onToggle: () => void;
};

export function SummaryPane({ members, goals, open, onToggle }: SummaryPaneProps) {
  const memberStats = useMemo(() => {
    return members.map((member) => {
      const memberGoals = goals.filter((g) => g.memberId === member.id);
      const overallProgress =
        memberGoals.length === 0
          ? 0
          : Math.round(
              memberGoals.reduce((sum, g) => sum + calcProgress(g.items), 0) /
                memberGoals.length,
            );
      const overdueGoals = memberGoals.filter(isOverdue);
      const totalBehaviorScore = calcBehaviorScore(memberGoals.flatMap((g) => g.items));
      return { member, goals: memberGoals, overallProgress, overdueGoals, totalBehaviorScore };
    });
  }, [members, goals]);

  // 全体の遅延件数（アラートバッジ用）
  const totalOverdue = memberStats.reduce((n, s) => n + s.overdueGoals.length, 0);

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col border-l border-border bg-sidebar transition-all duration-200",
        open ? "w-72" : "w-10",
      )}
    >
      {/* ヘッダー */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2">
        <Pane4Toggle open={open} onToggle={onToggle} />
        {open && (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h2 className="truncate text-sm font-semibold">全体サマリー</h2>
            {totalOverdue > 0 && (
              <Badge variant="destructive" className="h-5 shrink-0 px-1.5 text-xs">
                {totalOverdue}件遅延
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* コンテンツ */}
      {open && (
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-1 p-3">
            {memberStats.map((stat, i) => (
              <div key={stat.member.id}>
                {i > 0 && <Separator className="my-2" />}
                <MemberSummaryCard {...stat} />
              </div>
            ))}
            {members.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                メンバーがいません
              </p>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

// ===== メンバーサマリーカード =====

type MemberSummaryCardProps = {
  member: Member;
  goals: Goal[];
  overallProgress: number;
  overdueGoals: Goal[];
  totalBehaviorScore: number;
};

function MemberSummaryCard({
  member,
  goals,
  overallProgress,
  overdueGoals,
  totalBehaviorScore,
}: MemberSummaryCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg p-2 hover:bg-accent/40">
      {/* メンバー名 + 全体進捗 + 行動スコア */}
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">{member.name}</span>
        <div className="flex shrink-0 items-center gap-2">
          {totalBehaviorScore !== 0 && (
            <span
              className={cn(
                "text-xs tabular-nums font-medium",
                totalBehaviorScore > 0 ? "text-primary" : "text-destructive",
              )}
            >
              {totalBehaviorScore > 0 ? `+${totalBehaviorScore}` : totalBehaviorScore}
            </span>
          )}
          <span className="text-xs tabular-nums text-muted-foreground">
            {overallProgress}%
          </span>
        </div>
      </div>

      {/* 全体進捗バー */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            overallProgress === 100 ? "bg-primary" : "bg-primary/70",
          )}
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* 目標数 */}
      <span className="text-xs text-muted-foreground">
        目標 {goals.length} 件
      </span>

      {/* 遅延アラート */}
      {overdueGoals.length > 0 && (
        <div className="flex flex-col gap-1 rounded-md border border-destructive/30 bg-destructive/5 p-2">
          <div className="flex items-center gap-1 text-xs font-medium text-destructive">
            <AlertCircle className="size-3 shrink-0" />
            期限超過 {overdueGoals.length} 件
          </div>
          <ul className="flex flex-col gap-0.5">
            {overdueGoals.map((g) => (
              <li key={g.id} className="truncate text-xs text-destructive/80">
                · {g.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
