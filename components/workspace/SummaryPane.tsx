"use client";

import { Fragment, useMemo } from "react";

import { type Goal, type Member } from "@/lib/goal-schema";
import { EVALUATION_MASTER, groupedEvaluationMaster } from "@/lib/evaluation-master";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pane4Toggle } from "@/components/workspace/Pane4Toggle";

type SummaryPaneProps = {
  members: Member[];
  goals: Goal[];
  open: boolean;
  onToggle: () => void;
};

export function SummaryPane({ members, goals, open, onToggle }: SummaryPaneProps) {
  const groups = useMemo(() => groupedEvaluationMaster(), []);

  /**
   * scoreMatrix[memberIndex][evaluationMasterIndex] = 合計スコア
   */
  const scoreMatrix = useMemo(() => {
    return members.map((member) => {
      const memberGoals = goals.filter((g) => g.memberId === member.id);
      const allEvaluations = memberGoals.flatMap((g) =>
        g.items.flatMap((item) => item.evaluations),
      );
      return EVALUATION_MASTER.map((master) =>
        allEvaluations
          .filter((e) => e.category === master.category && e.item === master.item)
          .reduce((sum, e) => sum + e.score, 0),
      );
    });
  }, [members, goals]);

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col min-h-0 border-l border-border bg-sidebar transition-all duration-200",
        open ? "w-[480px]" : "w-10",
      )}
    >
      {/* ヘッダー */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2">
        <Pane4Toggle open={open} onToggle={onToggle} />
        {open && (
          <h2 className="truncate text-sm font-semibold">行動評価</h2>
        )}
      </div>

      {/* テーブル */}
      {open && (
        <ScrollArea className="flex-1 overflow-hidden">
          {members.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              メンバーがいません
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="sticky left-0 z-10 bg-sidebar px-3 py-2 text-left font-medium text-muted-foreground">
                      評価項目
                    </th>
                    {members.map((m) => (
                      <th
                        key={m.id}
                        className="min-w-[64px] px-2 py-2 text-center font-medium whitespace-nowrap"
                      >
                        {m.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <Fragment key={group.category}>
                      {/* カテゴリ行 */}
                      <tr className="bg-muted/40">
                        <td
                          colSpan={members.length + 1}
                          className="px-3 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
                        >
                          {group.category}
                        </td>
                      </tr>
                      {/* 評価項目行 */}
                      {group.items.map(({ index, item }) => (
                        <tr
                          key={index}
                          className="border-b border-border/40 hover:bg-accent/30"
                        >
                          <td className="sticky left-0 z-10 max-w-[200px] truncate bg-sidebar px-3 py-1.5 text-muted-foreground">
                            {item}
                          </td>
                          {members.map((_, mi) => {
                            const score = scoreMatrix[mi]?.[index] ?? 0;
                            return (
                              <td
                                key={mi}
                                className={cn(
                                  "px-2 py-1.5 text-center tabular-nums font-medium",
                                  score === 0
                                    ? "text-muted-foreground/30"
                                    : score > 0
                                      ? "text-primary"
                                      : "text-destructive",
                                )}
                              >
                                {score === 0
                                  ? "—"
                                  : score > 0
                                    ? `+${score}`
                                    : score}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
}
