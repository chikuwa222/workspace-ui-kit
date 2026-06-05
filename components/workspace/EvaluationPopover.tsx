"use client";

import { useState } from "react";
import { PenLine } from "lucide-react";

import { type Evaluation } from "@/lib/goal-schema";
import { EVALUATION_MASTER, groupedEvaluationMaster } from "@/lib/evaluation-master";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type EvaluationPopoverProps = {
  onSave: (ev: Omit<Evaluation, "id">) => void;
};

const SCORE_PRESETS = [-3, -2, -1, 1, 2, 3] as const;

const GROUPED_MASTER = groupedEvaluationMaster();

export function EvaluationPopover({ onSave }: EvaluationPopoverProps) {
  const [open, setOpen] = useState(false);
  const [masterIndexStr, setMasterIndexStr] = useState<string | undefined>(undefined);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  const canSave = masterIndexStr !== undefined && score !== null;

  const handleSave = () => {
    if (!canSave) return;
    const master = EVALUATION_MASTER[parseInt(masterIndexStr)];
    onSave({
      score,
      category: master.category,
      item: master.item,
      comment,
      date: new Date().toISOString().slice(0, 10),
    });
    setOpen(false);
    setMasterIndexStr(undefined);
    setScore(null);
    setComment("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="行動評価を追加"
          >
            <PenLine />
          </Button>
        }
      />
      <PopoverContent side="bottom" align="end" className="w-80 gap-3">
        <PopoverTitle className="text-sm font-semibold">行動評価を追加</PopoverTitle>

        {/* 評価項目 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">評価項目</span>
          <Select value={masterIndexStr} onValueChange={(v) => setMasterIndexStr(v ?? undefined)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="項目を選択..." />
            </SelectTrigger>
            <SelectContent>
              {GROUPED_MASTER.map(({ category, items }) => (
                <SelectGroup key={category}>
                  <SelectLabel>{category}</SelectLabel>
                  {items.map(({ index, item }) => (
                    <SelectItem key={index} value={String(index)}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* スコア（重み付け） */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">スコア（重み付け）</span>
          <div className="flex gap-1">
            {SCORE_PRESETS.map((preset) => (
              <Button
                key={preset}
                variant={score === preset ? "default" : "outline"}
                size="sm"
                onClick={() => setScore(preset)}
                className="flex-1 px-0 tabular-nums"
              >
                {preset > 0 ? `+${preset}` : preset}
              </Button>
            ))}
          </div>
        </div>

        {/* 補足コメント */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">補足コメント（任意）</span>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="なぜその評価にしたかの事実をメモ..."
            className="min-h-[68px] resize-none text-sm"
          />
        </div>

        {/* 保存 */}
        <Button size="sm" onClick={handleSave} disabled={!canSave}>
          保存
        </Button>
      </PopoverContent>
    </Popover>
  );
}
