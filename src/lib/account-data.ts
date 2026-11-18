import { z } from "zod";
import { DEFAULT_CATEGORIES } from "./finance";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const accountData = z.object({
  userName: z.string(),
  currency: z.enum(["ARS", "USD", "EUR"]),
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
    date,
  })),
});

export type AccountData = z.infer<typeof accountData>;
export const newAccountData: AccountData = {
  userName: "Rumbit",
  currency: "ARS",
  categories: DEFAULT_CATEGORIES,
  txs: [],
  goals: [],
};

export function parseAccountData(data: unknown): AccountData {
  return accountData.parse(data);
}
