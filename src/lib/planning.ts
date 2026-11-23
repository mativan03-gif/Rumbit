import type { AccountData } from "./account-data";

export type Budget = AccountData["budgets"][number];
export type PlannedPayment = AccountData["payments"][number];
export type ExpenseShortcut = AccountData["shortcuts"][number];

export function localDateKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function reviewWeek(date = new Date(), previous = false) {
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  const end = new Date(date);
  if (previous) {
    end.setTime(monday.getTime());
    end.setDate(monday.getDate() - 1);
    monday.setDate(monday.getDate() - 7);
  }
  return { from: localDateKey(monday), to: localDateKey(end) };
}
