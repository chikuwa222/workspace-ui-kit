"use client";

import { useState } from "react";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";

import { type Member } from "@/lib/goal-schema";
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
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { AddItemDialog } from "@/components/workspace/AddItemDialog";
import { DeleteConfirmDialog } from "@/components/workspace/DeleteConfirmDialog";
import { Pane1Toggle } from "@/components/workspace/Pane1Toggle";

type MemberPaneProps = {
  workspaceName: string;
  members: Member[];
  selectedMemberId: string | null;
  onSelectMember: (id: string) => void;
  onAddMember: (name: string) => void;
  onDeleteMember: (id: string) => void;
};

export function MemberPane({
  workspaceName,
  members,
  selectedMemberId,
  onSelectMember,
  onAddMember,
  onDeleteMember,
}: MemberPaneProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
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
                  return (
                    <SidebarMenuItem key={member.id}>
                      <SidebarMenuButton
                        tooltip={member.name}
                        isActive={active}
                        aria-current={active ? "page" : undefined}
                        onClick={() => onSelectMember(member.id)}
                      >
                        <span className="truncate">{member.name}</span>
                      </SidebarMenuButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <SidebarMenuAction showOnHover>
                              <MoreHorizontal />
                              <span className="sr-only">操作</span>
                            </SidebarMenuAction>
                          }
                        />
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => setDeleteTarget(member)}
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
