import { describe, expect, it } from "vitest";
import { SAMPLE_GOALS, SAMPLE_TXS, goalProgress, inMonth, totals, validateTx } from "./finance";

describe("finance", () => {
  it("demo November totals match spec (450.000 / 185.000 / 265.000)", () => {
    const t = totals(inMonth(SAMPLE_TXS, new Date(2026, 10, 8)));
    expect(t).toEqual({ income: 450000, expenses: 185000, available: 265000 });
  });
  it("demo goal Viaje is at 30% with 350.000 remaining", () => {
    expect(goalProgress(SAMPLE_GOALS[0]!)).toEqual({ pct: 30, remaining: 350000 });
  });
  it("rejects amount of zero", () => {
    expect(validateTx({ amount: 0, description: "x", category: "Otros", date: "2026-11-01" })).not.toBeNull();
  });
});
