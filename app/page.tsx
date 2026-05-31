import { Workspace } from "@/components/workspace/Workspace";
import membersData from "@/data/members.json";
import goalsData from "@/data/goals.json";
import workspaceData from "@/data/workspace.json";
import {
  membersSchema,
  goalsSchema,
  workspaceSchema,
} from "@/lib/goal-schema";

export default function Page() {
  const membersResult = membersSchema.safeParse(membersData);
  const goalsResult = goalsSchema.safeParse(goalsData);
  const wsResult = workspaceSchema.safeParse(workspaceData);

  if (!membersResult.success || !goalsResult.success || !wsResult.success) {
    const errors = [
      !membersResult.success &&
        `members.json: ${membersResult.error.issues[0]?.message}`,
      !goalsResult.success &&
        `goals.json: ${goalsResult.error.issues[0]?.message}`,
      !wsResult.success &&
        `workspace.json: ${wsResult.error.issues[0]?.message}`,
    ].filter(Boolean);
    throw new Error(`データの形式が正しくありません:\n${errors.join("\n")}`);
  }

  return (
    <Workspace
      initialMembers={membersResult.data}
      initialGoals={goalsResult.data}
      workspace={wsResult.data}
    />
  );
}
