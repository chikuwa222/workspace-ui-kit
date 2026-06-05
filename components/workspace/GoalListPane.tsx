"use client";

import { useState } from "react";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";

import { type Goal, type Member, calcBehaviorScore, calcProgress } from "@/lib/goal-schema";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddItemDialog } from "@/components/workspace/AddItemDialog";
import { DeleteConfirmDialog } from "@/components/workspace/DeleteConfirmDialog";

type GoalListPaneProps = {
  member: Member | null;
  goals: Goal[];
  selectedGoalId: string | null;
  onSelectGoal: (id: string) => void;
  onAddGoal: (title: string) => void;
  onDeleteGoal: (id: string) => void;
};

export function GoalListPane({
  member,
  goals,
  selectedGoalId,
  onSelectGoal,
  onAddGoal,
  onDeleteGoal,
}: GoalListPaneProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null);

  return (
    <>
      <div className="flex w-72 min-h-0 shrink-0 flex-col border-r border-border bg-sidebar">
        {/* ヘッダー */}
        <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
          <h2 className="min-w-0 truncate text-sm font-semibold text-foreground">
            {member ? `${member.name} の目標` : "メンバーを選択"}
          </h2>
          {member && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setAddDialogOpen(true)}
              aria-label="目標を追加"
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <Plus />
            </Button>
          )}
        </div>

        {/* 目標一覧 */}
        <ScrollArea className="flex-1 overflow-hidden">
          {!member ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              左のサイドバーから
              <br />
              メンバーを選択してください
            </p>
          ) : goals.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              目標がありません
              <br />
              ＋ ボタンで追加できます
            </p>
          ) : (
            <div className="flex flex-col py-1">
              {goals.map((goal) => {
                const progress = calcProgress(goal.items);
                const doneCount = goal.items.filter((i) => i.done).length;
                const isSelected = goal.id === selectedGoalId;

                const behaviorScore = calcBehaviorScore(goal.items);

                return (
                  <div
                    key={goal.id}
                    className={cn(
                      "group relative flex cursor-pointer flex-col gap-2 px-3 py-3 transition-colors hover:bg-accent/50",
                      isSelected && "bg-accent",
                    )}
                    onClick={() => onSelectGoal(goal.id)}
                  >
                    {/* タイトル + メニュー */}
                    <div className="flex items-start gap-1">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium leading-tight">
                        {goal.title}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                              aria-label="目標の操作"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal />
                            </Button>
                          }
                        />
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(goal);
                              }}
                            >
                              <Trash2 />
                              削除
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* 進捗バー */}
                    <div className="flex flex-col gap-1">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          {doneCount}/{goal.items.length} 完了
                        </span>
                        <div className="flex items-center gap-1.5">
                          {behaviorScore !== 0 && (
                            <span
                              className={cn(
                                "text-[10px] tabular-nums font-medium",
                                behaviorScore > 0
                                  ? "text-primary"
                                  : "text-destructive",
                              )}
                            >
                              行動: {behaviorScore > 0 ? `+${behaviorScore}` : behaviorScore}
                            </span>
                          )}
                          <Badge
                            variant={progress === 100 ? "default" : "outline"}
                            className="h-4 px-1.5 text-[10px]"
                          >
                            {progress}%
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* ウェイト */}
                    {goal.weight > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ウェイト: {goal.weight}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {member && (
        <AddItemDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          title="目標を追加"
          description={`${member.name} に新しい目標を追加します`}
          fieldLabel="目標名"
          fieldId="goal-title"
          placeholder="例: 売上目標1,200万円達成"
          onAdd={onAddGoal}
        />
      )}

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="目標を削除しますか？"
        itemName={deleteTarget?.title ?? ""}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteGoal(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </>
  );
}
