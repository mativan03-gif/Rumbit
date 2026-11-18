import { describe, expect, it } from "vitest";
import { SAMPLE_GOALS, SAMPLE_TXS, goalProgress, inMonth, totals, validateTx, txTitle } from "./finance";

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

describe("gastos sin descripción", () => {
  it("permite guardar un gasto sin descripción", () => {
    expect(validateTx({ type: "expense", amount: 1500, description: "", category: "Alimentación", date: "2026-11-18" })).toBeNull();
  });
  it("sigue exigiendo descripción en ingresos", () => {
    expect(validateTx({ type: "income", amount: 1500, description: "", category: "Ingreso", date: "2026-11-18" })).toBe("Completá la descripción.");
  });
  it("bloquea monto inválido o falta de categoría", () => {
    expect(validateTx({ type: "expense", amount: 0, description: "", category: "Alimentación", date: "2026-11-18" })).not.toBeNull();
    expect(validateTx({ type: "expense", amount: 1500, description: "", category: "", date: "2026-11-18" })).not.toBeNull();
  });
  it("usa la categoría como título cuando falta descripción", () => {
    expect(txTitle({ description: "", category: "Alimentación" })).toBe("Alimentación");
  });
});
