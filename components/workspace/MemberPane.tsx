"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

import { type Goal, type Member, calcWeightedMemberProgress } from "@/lib/goal-schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { AddItemDialog } from "@/components/workspace/AddItemDialog";
import { DeleteConfirmDialog } from "@/components/workspace/DeleteConfirmDialog";
import { Pane1Toggle } from "@/components/workspace/Pane1Toggle";

type MemberPaneProps = {
  workspaceName: string;
  members: Member[];
  goals: Goal[];
  selectedMemberId: string | null;
  onSelectMember: (id: string) => void;
  onAddMember: (name: string) => void;
  onEditMember: (id: string, name: string) => void;
  onDeleteMember: (id: string) => void;
};

export function MemberPane({
  workspaceName,
  members,
  goals,
  selectedMemberId,
  onSelectMember,
  onAddMember,
  onEditMember,
  onDeleteMember,
}: MemberPaneProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  return (
    <>
      <Sidebar
        collapsible="icon"
        className="border-r border-sidebar-border [&_[data-slot=sidebar-container]]:bg-sidebar"
      >
        <SidebarHeader className="border-b border-sidebar-border p-0">
          <div className="flex h-12 items-center justify-between gap-2 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[state=expanded]:px-5">
            <h2 className="truncate text-sm font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              {workspaceName}
            </h2>
            <Pane1Toggle />
          </div>
        </SidebarHeader>

        <SidebarContent className="px-1 py-3 group-data-[collapsible=icon]:hidden">
          <SidebarGroup className="px-1">
            <SidebarGroupLabel className="px-2 text-xs font-semibold tracking-wide text-sidebar-foreground/70 uppercase">
              メンバー
            </SidebarGroupLabel>
            <SidebarGroupAction
              title="メンバーを追加"
              onClick={() => setAddDialogOpen(true)}
              className="w-6 rounded-[min(var(--radius-md),10px)] text-muted-foreground hover:bg-muted hover:text-foreground [&>svg]:size-3"
            >
              <Plus />
              <span className="sr-only">メンバーを追加</span>
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu>
                {members.map((member) => {
                  const active = member.id === selectedMemberId;
                  const memberGoals = goals.filter((g) => g.memberId === member.id);
                  const progress = calcWeightedMemberProgress(memberGoals);
                  return (
                    <SidebarMenuItem key={member.id} className="group/menu-item relative">
                      <SidebarMenuButton
                        tooltip={member.name}
                        isActive={active}
                        aria-current={active ? "page" : undefined}
                        onClick={() => onSelectMember(member.id)}
                        className="h-auto py-1.5 pr-8"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="truncate">{member.name}</span>
                          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] tabular-nums text-sidebar-foreground/50">
                            進捗 {progress}%
                          </span>
                        </div>
                      </SidebarMenuButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="操作"
                              className="absolute top-1.5 right-1 size-5 opacity-0 group-hover/menu-item:opacity-100 aria-expanded:opacity-100 focus-visible:opacity-100"
                            >
                              <MoreHorizontal />
                            </Button>
                          }
                        />
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              onClick={() => setEditTarget(member)}
                            >
                              <Pencil />
                              名前を変更
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(member)}
                            >
                              <Trash2 />
                              削除
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <AddItemDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        title="メンバーを追加"
        description="新しいメンバーを追加します"
        fieldLabel="メンバー名"
        fieldId="member-name"
        placeholder="例: 山田 太郎"
        onAdd={onAddMember}
      />

      <AddItemDialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        title="名前を変更"
        description={`「${editTarget?.name ?? ""}」の名前を変更します`}
        fieldLabel="新しい名前"
        fieldId="member-name-edit"
        placeholder="例: 山田 太郎"
        initialValue={editTarget?.name ?? ""}
        submitLabel="保存"
        onAdd={(name) => {
          if (editTarget) {
            onEditMember(editTarget.id, name);
            setEditTarget(null);
          }
        }}
      />

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="メンバーを削除しますか？"
        itemName={deleteTarget?.name ?? ""}
        description={`「${deleteTarget?.name ?? ""}」とその目標データをすべて削除します。この操作は取り消せません。`}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteMember(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </>
  );
}
