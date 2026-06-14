import { promises as fs } from "fs";
import path from "path";

import { periodDataSchema } from "@/lib/goal-schema";

const PERIODS_DIR = path.join(process.cwd(), "data", "periods");

function escape(value: string | boolean | number | undefined): string {
  const s = String(value ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period");

  if (!period) {
    return Response.json({ error: "period クエリパラメータが必要です" }, { status: 400 });
  }

  try {
    const raw = await fs.readFile(
      path.join(PERIODS_DIR, `${period}.json`),
      "utf-8",
    );
    const { members, goals } = periodDataSchema.parse(JSON.parse(raw));

    const memberMap = new Map(members.map((m) => [m.id, m.name]));

    const header = [
      "メンバーID",
      "メンバー名",
      "目標ID",
      "目標タイトル",
      "期限",
      "サブタスクID",
      "サブタスク名",
      "完了",
      "メモ",
    ].join(",");

    const rows = goals.flatMap((goal) => {
      if (goal.items.length === 0) {
        return [
          [
            goal.memberId,
            memberMap.get(goal.memberId) ?? "",
            goal.id,
            goal.title,
            goal.deadline ?? "",
            "",
            "",
            "",
            "",
          ]
            .map(escape)
            .join(","),
        ];
      }
      return goal.items.map((item) =>
        [
          goal.memberId,
          memberMap.get(goal.memberId) ?? "",
          goal.id,
          goal.title,
          goal.deadline ?? "",
          item.id,
          item.label,
          item.done ? "完了" : "未完了",
          item.memo,
        ]
          .map(escape)
          .join(","),
      );
    });

    const csv = [header, ...rows].join("\r\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="goals-${period}.csv"`,
      },
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return Response.json({ error: "期が見つかりません" }, { status: 404 });
    }
    return Response.json({ error: "データの読み込みに失敗しました" }, { status: 500 });
  }
}
