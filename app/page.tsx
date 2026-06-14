import { promises as fs } from "fs";
import path from "path";

import { Workspace } from "@/components/workspace/Workspace";
import workspaceData from "@/data/workspace.json";
import {
  configSchema,
  periodDataSchema,
  workspaceSchema,
} from "@/lib/goal-schema";

const DATA_DIR = path.join(process.cwd(), "data");

export default async function Page() {
  const wsResult = workspaceSchema.safeParse(workspaceData);
  if (!wsResult.success) {
    throw new Error(
      `workspace.json: ${wsResult.error.issues[0]?.message}`,
    );
  }

  const configRaw = await fs.readFile(
    path.join(DATA_DIR, "config.json"),
    "utf-8",
  );
  const config = configSchema.parse(JSON.parse(configRaw));

  const periodRaw = await fs.readFile(
    path.join(DATA_DIR, "periods", `${config.activePeriod}.json`),
    "utf-8",
  );
  const period = periodDataSchema.parse(JSON.parse(periodRaw));

  return (
    <Workspace
      initialMembers={period.members}
      initialGoals={period.goals}
      workspace={wsResult.data}
      activePeriod={config.activePeriod}
    />
  );
}
