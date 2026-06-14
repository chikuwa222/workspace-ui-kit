import { promises as fs } from "fs";
import path from "path";

import { configSchema } from "@/lib/goal-schema";

const CONFIG_PATH = path.join(process.cwd(), "data", "config.json");

export async function GET() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const config = configSchema.parse(JSON.parse(raw));
    return Response.json(config);
  } catch {
    return Response.json({ error: "config.json が見つかりません" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const config = configSchema.parse(body);
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
    return Response.json(config);
  } catch {
    return Response.json({ error: "不正なリクエストボディです" }, { status: 400 });
  }
}
