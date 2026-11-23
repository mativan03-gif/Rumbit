import { expect, it } from "vitest";
import { reviewWeek } from "./planning";
import { actions } from "./store";

it("reviews local calendar weeks across a month boundary", () => {
  const monday = new Date(2026, 10, 2, 22);
  expect(reviewWeek(monday)).toEqual({ from: "2026-11-02", to: "2026-11-02" });
  expect(reviewWeek(monday, true)).toEqual({ from: "2026-10-26", to: "2026-11-01" });
});

it("adds planning data to an existing demo without replacing movements", async () => {
  const key = "rumbit-demo-state-v2";
  const tx = {
    id: "test",
    type: "expense",
    amount: 500,
    description: "Ejemplo",
    category: "Transporte",
    date: "2026-11-02",
  };
  localStorage.setItem(
    key,
    JSON.stringify({
      userName: "Sofi",
      currency: "ARS",
      categories: ["Transporte"],
      txs: [tx],
      goals: [],
    }),
  );
  actions.startDemo();

  actions.saveBudget({ category: "Transporte", limit: 1000, currency: "ARS" });
  actions.saveBudget({ category: "Transporte", limit: 2000, currency: "ARS" });
  actions.addPayment({ name: "Internet", amount: 500, due: "2026-11-03", currency: "ARS" });
  const saved = () => JSON.parse(localStorage.getItem(key) ?? "{}");
  actions.togglePayment(saved().payments[0].id);
  expect(await actions.addShortcut({ category: "Transporte", description: "SUBE" })).toBe(true);
  expect(await actions.addShortcut({ category: "Transporte", description: "sube" })).toBe(false);

  actions.setAccessory("scarf");
  expect(saved().accessory).toBeNull();
  actions.completeReview("2026-11-02");
  actions.completeReview("2026-11-02");
  actions.setAccessory("scarf");

  expect(saved()).toMatchObject({
    txs: [tx],
    budgets: [{ category: "Transporte", limit: 2000, currency: "ARS" }],
    payments: [{ name: "Internet", paid: true }],
    shortcuts: [{ category: "Transporte", description: "SUBE" }],
    reviewedWeeks: ["2026-11-02"],
    accessory: "scarf",
  });
});
