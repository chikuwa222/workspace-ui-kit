"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { type ChecklistItem, type Evaluation, type Goal } from "@/lib/goal-schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  InlineDateField,
  InlineFieldRow,
  InlineTextareaField,
  InlineTextField,
  SectionLabel,
} from "@/components/primitives";
import { EvaluationPopover } from "@/components/workspace/EvaluationPopover";

type GoalDetailPaneProps = {
  goal: Goal | null;
  onUpdateGoal: (patch: Partial<Pick<Goal, "title" | "deadline">>) => void;
  onToggleItem: (itemId: string) => void;
  onAddItem: (label: string) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, patch: Partial<Pick<ChecklistItem, "label" | "memo">>) => void;
  onAddEvaluation: (itemId: string, ev: Omit<Evaluation, "id">) => void;
};

export function GoalDetailPane({
  goal,
  onUpdateGoal,
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onUpdateItem,
  onAddEvaluation,
}: GoalDetailPaneProps) {
  const [newItemLabel, setNewItemLabel] = useState("");

  const handleAddItem = () => {
    const trimmed = newItemLabel.trim();
    if (!trimmed) return;
    onAddItem(trimmed);
    setNewItemLabel("");
  };

  if (!goal) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">
          左のリストから目標を選択してください
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-6 p-6">
          {/* 目標情報 */}
          <section className="flex flex-col gap-4">
            <SectionLabel>目標</SectionLabel>
            <dl className="flex flex-col gap-3 text-sm">
              <InlineFieldRow label="目標名">
                <InlineTextField
                  key={goal.id}
                  value={goal.title}
                  onSave={(v) => onUpdateGoal({ title: v })}
                  ariaLabel="目標名"
                  placeholder="目標名を入力"
                />
              </InlineFieldRow>
              <InlineFieldRow label="期限">
                <InlineDateField
                  key={goal.id}
                  value={goal.deadline ?? ""}
                  onSave={(v) => onUpdateGoal({ deadline: v || undefined })}
                  ariaLabel="期限"
                />
              </InlineFieldRow>
            </dl>
          </section>

          <Separator />

          {/* チェックリスト */}
          <section className="flex flex-col gap-4">
            <SectionLabel>チェックリスト</SectionLabel>

            {goal.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                サブタスクがありません。下の入力欄から追加してください。
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {goal.items.map((item) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    onToggle={() => onToggleItem(item.id)}
                    onDelete={() => onDeleteItem(item.id)}
                    onUpdateLabel={(label) => onUpdateItem(item.id, { label })}
                    onUpdateMemo={(memo) => onUpdateItem(item.id, { memo })}
                    onAddEvaluation={(ev) => onAddEvaluation(item.id, ev)}
                  />
                ))}
              </div>
            )}

            {/* サブタスク追加 */}
            <div className="flex gap-2">
              <Input
                value={newItemLabel}
                onChange={(e) => setNewItemLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddItem();
                }}
                placeholder="サブタスクを追加..."
                className="h-8 flex-1 bg-card"
                aria-label="新しいサブタスク名"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                disabled={!newItemLabel.trim()}
                aria-label="サブタスクを追加"
              >
                <Plus />
                追加
              </Button>
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}

// ===== チェックリスト 1 行 =====

type ChecklistItemRowProps = {
  item: ChecklistItem;
  onToggle: () => void;
  onDelete: () => void;
  onUpdateLabel: (label: string) => void;
  onUpdateMemo: (memo: string) => void;
  onAddEvaluation: (ev: Omit<Evaluation, "id">) => void;
};

function ChecklistItemRow({
  item,
  onToggle,
  onDelete,
  onUpdateLabel,
  onUpdateMemo,
  onAddEvaluation,
}: ChecklistItemRowProps) {
  const totalScore = item.evaluations.reduce((sum, e) => sum + e.score, 0);
  const hasEvaluations = item.evaluations.length > 0;

  return (
    <div className="group flex items-start gap-3">
      <Checkbox
        checked={item.done}
        onCheckedChange={onToggle}
        aria-label={`${item.label} の完了状態`}
        className="mt-1 shrink-0"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <InlineTextField
            key={`${item.id}-label`}
            value={item.label}
            onSave={onUpdateLabel}
            ariaLabel="サブタスク名"
            placeholder="サブタスク名"
            className={item.done ? "text-muted-foreground line-through" : ""}
          />
          {hasEvaluations && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant={totalScore >= 0 ? "default" : "destructive"}
                    className="shrink-0 cursor-default tabular-nums"
                  >
                    {totalScore > 0 ? `+${totalScore}` : totalScore}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-64 flex flex-col gap-1 text-left">
                  {item.evaluations.map((ev) => (
                    <div key={ev.id} className="flex flex-col gap-0.5">
                      <span className="font-medium">
                        [{ev.category}] {ev.score > 0 ? `+${ev.score}` : ev.score}
                      </span>
                      <span className="opacity-80">{ev.item}</span>
                      {ev.comment && (
                        <span className="opacity-70">{ev.comment}</span>
                      )}
                      <span className="opacity-50 text-[10px]">{ev.date}</span>
                    </div>
                  ))}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <InlineTextareaField
          key={`${item.id}-memo`}
          value={item.memo}
          onSave={onUpdateMemo}
          ariaLabel="メモ"
          placeholder="メモを追加..."
        />
      </div>

      {/* アクションボタン群（ホバーで表示） */}
      <div className="mt-0.5 flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <EvaluationPopover onSave={onAddEvaluation} />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          aria-label="サブタスクを削除"
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}
