import { useSyncExternalStore } from "react";
import { DEFAULT_CATEGORIES, SAMPLE_GOALS, SAMPLE_TXS, type Goal, type Tx } from "./finance";

export type Session = { email: string; guest: boolean } | null;
export type State = {
  hydrated: boolean;
  session: Session;
  userName: string;
  currency: string;
  categories: string[];
  txs: Tx[];
  goals: Goal[];
};

const KEY = "rumbit-state-v1";
const initial: State = {
  hydrated: false,
  session: null,
  userName: "Sofi",
  currency: "ARS",
  categories: DEFAULT_CATEGORIES,
  txs: SAMPLE_TXS,
  goals: SAMPLE_GOALS,
};

let state = initial;
const listeners = new Set<() => void>();

function set(patch: Partial<State> | ((s: State) => Partial<State>)) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  if (state.hydrated) {
    const { hydrated: _h, ...rest } = state;
    localStorage.setItem(KEY, JSON.stringify(rest));
  }
  listeners.forEach((l) => l());
}

export function hydrate() {
  if (state.hydrated) return;
  let saved: Partial<State> = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {}
  set({ ...saved, hydrated: true });
}

export function useApp<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => sel(state),
    () => sel(initial),
  );
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const actions = {
  login: (email: string, guest = false) => set({ session: { email, guest } }),
  logout: () => set({ session: null }),
  setName: (userName: string) => set({ userName }),
  setCurrency: (currency: string) => set({ currency }),
  setCategories: (categories: string[]) => set({ categories }),
  saveTx: (t: Omit<Tx, "id"> & { id?: string }) =>
    set((s) => ({
      txs: t.id ? s.txs.map((x) => (x.id === t.id ? (t as Tx) : x)) : [{ ...t, id: uid() }, ...s.txs],
    })),
  deleteTx: (id: string) => set((s) => ({ txs: s.txs.filter((x) => x.id !== id) })),
  saveGoal: (g: Omit<Goal, "id"> & { id?: string }) =>
    set((s) => ({
      goals: g.id ? s.goals.map((x) => (x.id === g.id ? (g as Goal) : x)) : [...s.goals, { ...g, id: uid() }],
    })),
  addProgress: (id: string, amount: number) =>
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, saved: g.saved + amount } : g)) })),
  deleteGoal: (id: string) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
  resetDemo: () => set({ txs: SAMPLE_TXS, goals: SAMPLE_GOALS, categories: DEFAULT_CATEGORIES }),
};

export const useMoney = () => {
  const currency = useApp((s) => s.currency);
  return (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
};
