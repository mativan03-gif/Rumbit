export type TxType = "income" | "expense";
export type Tx = {
  id: string;
  type: TxType;
  amount: number;
  description: string;
  category: string;
  date: string; // YYYY-MM-DD
};
export type Goal = { id: string; name: string; target: number; saved: number; date: string };

export const DEFAULT_CATEGORIES = [
  "Alimentación",
  "Transporte",
  "Educación",
  "Entretenimiento",
  "Vivienda",
  "Salud",
  "Compras",
  "Servicios",
  "Otros",
];
export const INCOME_CATEGORY = "Ingresos";

export function totals(txs: Tx[]) {
  let income = 0;
  let expenses = 0;
  for (const t of txs) {
    if (t.type === "income") income += t.amount;
    else expenses += t.amount;
  }
  return { income, expenses, available: income - expenses };
}

export function monthKey(date: string) {
  return date.slice(0, 7);
}

export function inMonth(txs: Tx[], ref: Date) {
  const key = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;
  return txs.filter((t) => monthKey(t.date) === key);
}

export function byCategory(txs: Tx[]) {
  const map = new Map<string, number>();
  for (const t of txs) if (t.type === "expense") map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  const total = [...map.values()].reduce((a, b) => a + b, 0);
  return [...map.entries()]
    .map(([name, value]) => ({ name, value, pct: total ? Math.round((value / total) * 100) : 0 }))
    .sort((a, b) => b.value - a.value);
}

export function goalProgress(g: Goal) {
  const pct = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
  return { pct, remaining: Math.max(0, g.target - g.saved) };
}

export function validateTx(t: Partial<Tx>): string | null {
  if (!t.amount || !(t.amount > 0)) return "El monto debe ser mayor a cero.";
  if (t.type !== "expense" && !t.description?.trim()) return "Completá la descripción.";
  if (!t.category) return "Elegí una categoría.";
  if (!t.date) return "Elegí una fecha.";
  return null;
}

/** Título visible: la descripción, o la categoría si un gasto no tiene descripción. */
export function txTitle(t: Pick<Tx, "description" | "category">) {
  return t.description?.trim() || t.category;
}

export function formatMoney(n: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

export function formatDate(d: string) {
  const [y = 2026, m = 1, day = 1] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

export const SAMPLE_TXS: Tx[] = [
  { id: "t1", description: "Sueldo", type: "income", amount: 450000, category: INCOME_CATEGORY, date: "2026-11-01" },
  { id: "t2", description: "Supermercado", type: "expense", amount: 65000, category: "Alimentación", date: "2026-11-03" },
  { id: "t3", description: "Transporte", type: "expense", amount: 20000, category: "Transporte", date: "2026-11-05" },
  { id: "t4", description: "Salida con amigos", type: "expense", amount: 35000, category: "Entretenimiento", date: "2026-11-06" },
  { id: "t5", description: "Servicios", type: "expense", amount: 65000, category: "Servicios", date: "2026-11-07" },
  { id: "o1", description: "Sueldo", type: "income", amount: 430000, category: INCOME_CATEGORY, date: "2026-10-01" },
  { id: "o2", description: "Supermercado", type: "expense", amount: 72000, category: "Alimentación", date: "2026-10-04" },
  { id: "o3", description: "Cine", type: "expense", amount: 18000, category: "Entretenimiento", date: "2026-10-12" },
  { id: "o4", description: "Servicios", type: "expense", amount: 61000, category: "Servicios", date: "2026-10-08" },
  { id: "o5", description: "SUBE", type: "expense", amount: 22000, category: "Transporte", date: "2026-10-15" },
  { id: "s1", description: "Sueldo", type: "income", amount: 420000, category: INCOME_CATEGORY, date: "2026-09-01" },
  { id: "s2", description: "Supermercado", type: "expense", amount: 68000, category: "Alimentación", date: "2026-09-05" },
  { id: "s3", description: "Curso online", type: "expense", amount: 40000, category: "Educación", date: "2026-09-10" },
  { id: "s4", description: "Servicios", type: "expense", amount: 58000, category: "Servicios", date: "2026-09-09" },
];

export const SAMPLE_GOALS: Goal[] = [{ id: "g1", name: "Viaje", target: 500000, saved: 150000, date: "2027-03-01" }];
