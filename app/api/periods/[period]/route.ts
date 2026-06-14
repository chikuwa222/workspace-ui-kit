import { promises as fs } from "fs";
import path from "path";

import { periodDataSchema } from "@/lib/goal-schema";

const PERIODS_DIR = path.join(process.cwd(), "data", "periods");

function periodPath(period: string) {
  return path.join(PERIODS_DIR, `${period}.json`);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ period: string }> },
) {
  const { period } = await params;
  try {
    const raw = await fs.readFile(periodPath(period), "utf-8");
    const data = periodDataSchema.parse(JSON.parse(raw));
    return Response.json(data);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return Response.json({ error: "期が見つかりません" }, { status: 404 });
    }
    return Response.json({ error: "データの読み込みに失敗しました" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ period: string }> },
) {
  const { period } = await params;
  try {
    const body = await request.json();
    const data = periodDataSchema.parse(body);
    await fs.mkdir(PERIODS_DIR, { recursive: true });
    await fs.writeFile(periodPath(period), JSON.stringify(data, null, 2), "utf-8");
    return Response.json(data);
  } catch {
    return Response.json({ error: "不正なリクエストボディです" }, { status: 400 });
  }
}
