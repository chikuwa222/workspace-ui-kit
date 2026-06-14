import { describe, it, expect } from "vitest";

import {
  membersSchema,
  goalsSchema,
  workspaceSchema,
  calcProgress,
  isOverdue,
} from "@/lib/goal-schema";

import membersData from "@/data/members.json";
import goalsData from "@/data/goals.json";
import workspaceData from "@/data/workspace.json";

describe("data/*.json schema validation", () => {
  it("data/members.json は membersSchema を満たす", () => {
    const result = membersSchema.safeParse(membersData);
    expect(result.success).toBe(true);
  });

  it("data/goals.json は goalsSchema を満たす", () => {
    const result = goalsSchema.safeParse(goalsData);
    expect(result.success).toBe(true);
  });

  it("data/workspace.json は workspaceSchema を満たす", () => {
    const result = workspaceSchema.safeParse(workspaceData);
    expect(result.success).toBe(true);
  });
});

describe("schema rejects invalid data", () => {
  it("membersSchema は配列を期待する", () => {
    expect(membersSchema.safeParse({}).success).toBe(false);
    expect(membersSchema.safeParse(null).success).toBe(false);
  });

  it("member は id と name が必須", () => {
    expect(membersSchema.safeParse([{ id: "m1" }]).success).toBe(false);
    expect(membersSchema.safeParse([{ name: "田中" }]).success).toBe(false);
  });

  it("workspaceSchema は name と icon を要求する", () => {
    expect(workspaceSchema.safeParse({ name: "" }).success).toBe(false);
    expect(workspaceSchema.safeParse({ icon: "" }).success).toBe(false);
  });
});

describe("calcProgress", () => {
  it("項目なしは 0 を返す", () => {
    expect(calcProgress([])).toBe(0);
  });

  it("全件未完了は 0 を返す", () => {
    const items = [
      { id: "1", label: "a", memo: "", done: false, evaluations: [] },
      { id: "2", label: "b", memo: "", done: false, evaluations: [] },
    ];
    expect(calcProgress(items)).toBe(0);
  });

  it("全件完了は 100 を返す", () => {
    const items = [
      { id: "1", label: "a", memo: "", done: true, evaluations: [] },
      { id: "2", label: "b", memo: "", done: true, evaluations: [] },
    ];
    expect(calcProgress(items)).toBe(100);
  });

  it("半分完了は 50 を返す", () => {
    const items = [
      { id: "1", label: "a", memo: "", done: true, evaluations: [] },
      { id: "2", label: "b", memo: "", done: false, evaluations: [] },
    ];
    expect(calcProgress(items)).toBe(50);
  });
});

describe("isOverdue（目標単位）", () => {
  it("deadline なしは false", () => {
    expect(
      isOverdue({ id: "g1", memberId: "m1", title: "test", items: [] }),
    ).toBe(false);
  });

  it("未来 deadline・未完了でも false", () => {
    expect(
      isOverdue({
        id: "g1",
        memberId: "m1",
        title: "test",
        deadline: "2099-12-31",
        items: [{ id: "i1", label: "a", memo: "", done: false, evaluations: [] }],
      }),
    ).toBe(false);
  });

  it("過去 deadline・未完了は true", () => {
    expect(
      isOverdue({
        id: "g1",
        memberId: "m1",
        title: "test",
        deadline: "2020-01-01",
        items: [{ id: "i1", label: "a", memo: "", done: false, evaluations: [] }],
      }),
    ).toBe(true);
  });

  it("過去 deadline でもサブタスク全完了なら false", () => {
    expect(
      isOverdue({
        id: "g1",
        memberId: "m1",
        title: "test",
        deadline: "2020-01-01",
        items: [{ id: "i1", label: "a", memo: "", done: true, evaluations: [] }],
      }),
    ).toBe(false);
  });

  it("サブタスクなし・過去 deadline は true（進捗 0% のため）", () => {
    expect(
      isOverdue({
        id: "g1",
        memberId: "m1",
        title: "test",
        deadline: "2020-01-01",
        items: [],
      }),
    ).toBe(true);
  });
});
