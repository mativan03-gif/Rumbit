import { z } from "zod";
import { DEFAULT_CATEGORIES, NEW_EXPENSE_CATEGORIES } from "./finance";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const currency = z.enum(["ARS", "USD", "EUR"]);
const amount = z.number().finite().positive();
const accountData = z.object({
  userName: z.string(),
  nameConfigured: z.boolean().optional(),
  newCategoriesAdded: z.boolean().optional(),
  currency,
  categories: z.array(z.string()).min(1),
  txs: z.array(z.object({
    id: z.string(),
    type: z.enum(["income", "expense"]),
    amount: z.number().finite().positive(),
    description: z.string(),
    category: z.string(),
    date,
  })),
  goals: z.array(z.object({
    id: z.string(),
    name: z.string(),
    target: z.number().finite().positive(),
    saved: z.number().finite().nonnegative(),
    plan: z.object({
      contribution: z.number().finite().positive().max(1000000000000),
      frequency: z.enum(["weekly", "biweekly", "monthly"]),
      startDate: date,
      initialSaved: z.number().finite().nonnegative(),
    }).optional(),
    date,
  })),
  budgets: z.array(z.object({ category: z.string(), limit: amount, currency })).default([]),
  payments: z.array(z.object({
    id: z.string(), name: z.string(), amount, currency, due: date, paid: z.boolean(),
  })).default([]),
  shortcuts: z.array(z.object({ category: z.string(), description: z.string() })).default([]),
  reviewedWeeks: z.array(date).default([]),
  accessory: z.literal("scarf").nullable().default(null),
});

export type AccountData = z.infer<typeof accountData>;
export const newAccountData: AccountData = {
  userName: "Rumbit",
  nameConfigured: false,
  newCategoriesAdded: true,
  currency: "ARS",
  categories: DEFAULT_CATEGORIES,
  txs: [],
  goals: [],
  budgets: [],
  payments: [],
  shortcuts: [],
  reviewedWeeks: [],
  accessory: null,
};

export function parseAccountData(data: unknown, defaultName = newAccountData.userName): AccountData {
  const snapshot = accountData.parse(data);
  if (!snapshot.newCategoriesAdded) {
    const existing = new Set(snapshot.categories.map((name) => name.trim().toLowerCase()));
    snapshot.categories = [
      ...snapshot.categories,
      ...NEW_EXPENSE_CATEGORIES.filter((name) => !existing.has(name.toLowerCase())),
    ];
  }
  return {
    ...snapshot,
    nameConfigured: snapshot.nameConfigured ?? Boolean(snapshot.userName.trim() && snapshot.userName.trim() !== defaultName),
    newCategoriesAdded: true,
  };
}
