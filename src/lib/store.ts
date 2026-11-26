import { useSyncExternalStore } from "react";
import { DEFAULT_CATEGORIES, SAMPLE_GOALS, SAMPLE_TXS, type Goal, type Tx } from "./finance";
import { getAuthClient } from "./auth";
import { newAccountData, parseAccountData, type AccountData } from "./account-data";
import { toast } from "sonner";

import type { Budget, ExpenseShortcut, PlannedPayment } from "./planning";

export type Session =
  | { email: string; guest: true }
  | { email: string; guest: false; userId: string }
  | null;
export type State = {
  hydrated: boolean;
  recoveringPassword: boolean;
  authCallbackError: string | null;
  session: Session;
  accountStatus: "loading" | "ready" | "error";
  saving: boolean;
  onboardingPending: boolean;
  legalReviewPending: boolean;
  userName: string;
  currency: AccountData["currency"];
  categories: string[];
  txs: Tx[];
  goals: Goal[];
  budgets: Budget[];
  payments: PlannedPayment[];
  shortcuts: ExpenseShortcut[];
  reviewedWeeks: string[];
  accessory: "scarf" | null;
};

const DEMO_KEY = "rumbit-demo-state-v2";
const RECOVERY_KEY = "rumbit-password-recovery";
export const LEGAL_VERSION = "2026-11-26";
const DEMO_LEGAL_KEY = "rumbit-demo-legal-version";
let demoLegalVersion: string | null = null;
const initial: State = {
  hydrated: false,
  recoveringPassword: false,
  authCallbackError: null,
  session: null,
  accountStatus: "loading",
  saving: false,
  onboardingPending: false,
  legalReviewPending: false,
  userName: "Sofi",
  currency: "ARS",
  categories: DEFAULT_CATEGORIES,
  txs: SAMPLE_TXS,
  goals: SAMPLE_GOALS,
  budgets: newAccountData.budgets,
  payments: newAccountData.payments,
  shortcuts: newAccountData.shortcuts,
  reviewedWeeks: newAccountData.reviewedWeeks,
  accessory: newAccountData.accessory,
};

let state = initial;
const listeners = new Set<() => void>();

function set(patch: Partial<State> | ((s: State) => Partial<State>)) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  if (state.session?.guest) {
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify(parseAccountData(state)));
    } catch {
      // The demo still works for this visit if storage is unavailable.
    }
  }
  listeners.forEach((listener) => listener());
}

let accountGeneration = 0;
let accountRevision: number | null = null;

async function loadAccount(userId: string) {
  const generation = ++accountGeneration;
  accountRevision = null;
  set({ accountStatus: "loading", saving: false });

  try {
    const client = getAuthClient();
    if (!client) throw new Error("Supabase client unavailable");
    const { data, error } = await client.from("rumbit_account_data")
      .select("data,revision").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    if (generation !== accountGeneration) return;
    const snapshot = data ? parseAccountData(data.data) : newAccountData;
    accountRevision = data?.revision ?? null;
    set({ ...snapshot, accountStatus: "ready" });
  } catch {
    if (generation === accountGeneration) set({ accountStatus: "error" });
  }
}

function onboardingNeeded(user: { id: string; created_at?: string; user_metadata?: Record<string, unknown> }) {
  // Show the introduction once to every authenticated account, including existing users.
  if (user.user_metadata?.rumbit_onboarding_complete === true) return false;
  try { return localStorage.getItem(`rumbit-onboarding-${user.id}`) !== "done"; } catch { return true; }
}
function acceptAccount(user: { id: string; email?: string; created_at?: string; user_metadata?: Record<string, unknown> }, recoveringPassword: boolean) {
  const userId = user.id; const email = user.email ?? "";
  const session = { email, userId, guest: false } as const;
  const legalReviewPending = user.user_metadata?.["rumbit_legal_version"] !== LEGAL_VERSION;
  if (state.session?.guest === false && state.session.userId === userId &&
      state.recoveringPassword === recoveringPassword) {
    if (state.session.email !== email || state.legalReviewPending !== legalReviewPending) {
      set({ session, legalReviewPending });
    }
    return;
  }

  const generation = ++accountGeneration;
  accountRevision = null;
  set({ ...initial, ...newAccountData, hydrated: true, session, recoveringPassword, onboardingPending: !recoveringPassword && onboardingNeeded(user), legalReviewPending });
  // Schedule the database request outside the Supabase auth callback.
  if (!recoveringPassword) queueMicrotask(() => {
    if (generation === accountGeneration) void loadAccount(userId);
  });
}

async function saveData(change: (current: State) => Partial<State>) {
  const session = state.session;
  if (!session || state.recoveringPassword) return false;
  if (session.guest) {
    set(change);
    return true;
  }
  if (state.saving || state.accountStatus !== "ready") {
    toast.error("Esperá a que termine la operación anterior.");
    return false;
  }

  const generation = accountGeneration;
  const revision = accountRevision;
  set({ saving: true });
  try {
    const snapshot = parseAccountData({ ...state, ...change(state) });
    const client = getAuthClient();
    if (!client) throw new Error("Supabase client unavailable");
    const table = client.from("rumbit_account_data");
    const result = revision === null
      ? await table.insert({ user_id: session.userId, data: snapshot }).select("revision").single()
      : await table.update({ data: snapshot, revision: revision + 1 }).eq("user_id", session.userId)
          .eq("revision", revision).select("revision").maybeSingle();

    if (generation !== accountGeneration) return false;
    if (result.error?.code === "23505" || (!result.error && !result.data)) {
      toast.error("Tus datos cambiaron en otra pestaña o dispositivo. Volvimos a cargarlos. Revisá el cambio y probá de nuevo.");
      void loadAccount(session.userId);
      return false;
    }
    if (result.error || !result.data) throw result.error ?? new Error("Missing save confirmation");

    accountRevision = result.data.revision;
    set(snapshot);
    return true;
  } catch {
    if (generation === accountGeneration) {
      toast.error("No pudimos confirmar el guardado. Volveremos a cargar tus datos para que puedas comprobarlo.");
      void loadAccount(session.userId);
    }
    return false;
  } finally {
    if (generation === accountGeneration) set({ saving: false });
  }
}

let authStarted = false;

export function hydrate() {
  if (authStarted) return;
  authStarted = true;
  const client = getAuthClient();
  if (!client) {
    set({ hydrated: true });
    return;
  }

  const url = new URL(window.location.href);
  const code = url.pathname === "/" ? url.searchParams.get("code") : null;
  let processingCallback = !!code;
  let recoveryCallback = false;

  client.auth.onAuthStateChange((event, session) => {
    if (processingCallback) {
      if (event === "PASSWORD_RECOVERY") recoveryCallback = true;
      return;
    }
    if (session) {
      let recoveringPassword = event === "PASSWORD_RECOVERY" ||
        (state.recoveringPassword && state.session?.guest === false && state.session.userId === session.user.id);
      try {
        if (event === "PASSWORD_RECOVERY") {
          sessionStorage.setItem(RECOVERY_KEY, session.user.id);
        }
        recoveringPassword ||= sessionStorage.getItem(RECOVERY_KEY) === session.user.id;
      } catch {
        // Recovery still works without storage while this page stays open.
      }
      acceptAccount(session.user, recoveringPassword);
    } else if (!state.session?.guest) {
      try {
        sessionStorage.removeItem(RECOVERY_KEY);
      } catch {
        // Storage may be unavailable.
      }
      accountGeneration++;
      accountRevision = null;
      set({ ...initial, hydrated: true });
    }
  });

  if (code) {
    void (async () => {
      try {
        const { data, error } = await client.auth.exchangeCodeForSession(code);
        if (error || !data.session) {
          set({ hydrated: true, authCallbackError: error?.code ?? "otp_expired" });
          return;
        }
        const { user } = data.session;
        const recoveringPassword = recoveryCallback;
        if (recoveringPassword) {
          try {
            sessionStorage.setItem(RECOVERY_KEY, user.id);
          } catch {
            // The current page can still complete recovery.
          }
        }
        acceptAccount(user, recoveringPassword);
      } catch {
        set({ hydrated: true, authCallbackError: "otp_expired" });
      } finally {
        processingCallback = false;
        url.searchParams.delete("code");
        window.history.replaceState(window.history.state, "", url);
      }
    })();
  }
}

function startDemo() {
  let saved = parseAccountData(initial);
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (raw) saved = parseAccountData(JSON.parse(raw));
  } catch {
    // An unavailable demo snapshot falls back to sample records.
  }
  try {
    demoLegalVersion = localStorage.getItem(DEMO_LEGAL_KEY);
  } catch {
    // Keep the acceptance in memory if browser storage is unavailable.
  }
  set({
    ...saved,
    legalReviewPending: demoLegalVersion !== LEGAL_VERSION,
    session: { email: "invitado@rumbit.app", guest: true },
  });
}

export async function finishOnboarding() {
  const session = state.session;
  if (!session || session.guest) return;
  // Persist on the account itself, so it also works on a new device.
  const client = getAuthClient();
  if (!client) throw new Error("Autenticación no disponible");
  const { error } = await client.auth.updateUser({ data: { rumbit_onboarding_complete: true } });
  if (error) throw error;
  try { localStorage.setItem(`rumbit-onboarding-${session.userId}`, "done"); } catch { /* Account metadata is authoritative. */ }
  set({ onboardingPending: false });
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
  startDemo,
  acceptLegalTerms: async () => {
    const session = state.session;
    if (!session || state.recoveringPassword) {
      throw new Error("No hay una sesión disponible");
    }
    if (!state.legalReviewPending) return;
    if (session.guest) {
      demoLegalVersion = LEGAL_VERSION;
      try {
        localStorage.setItem(DEMO_LEGAL_KEY, LEGAL_VERSION);
      } catch {
        // Keep the acceptance in memory for this visit.
      }
      set({ legalReviewPending: false });
      return;
    }

    const client = getAuthClient();
    if (!client) throw new Error("Autenticación no disponible");
    const { error } = await client.auth.updateUser({
      data: {
        rumbit_legal_version: LEGAL_VERSION,
        rumbit_legal_accepted_at: new Date().toISOString(),
      },
    });
    if (error) throw error;
    if (state.session?.guest === false && state.session.userId === session.userId) {
      set({ legalReviewPending: false });
    }
  },
  retryAccount: () => {
    if (state.session?.guest === false && !state.recoveringPassword && !state.saving) {
      void loadAccount(state.session.userId);
    }
  },
  finishRecovery: () => {
    try {
      sessionStorage.removeItem(RECOVERY_KEY);
    } catch {
      // Storage may be unavailable.
    }
    set({ recoveringPassword: false });
    if (state.session?.guest === false) void loadAccount(state.session.userId);
  },
  logout: async () => {
    if (state.saving) return false;
    if (state.session?.guest) {
      set({ ...initial, hydrated: true });
      return true;
    }

    try {
      const client = getAuthClient();
      if (!client) return false;
      const { error } = await client.auth.signOut({ scope: "local" });
      return !error;
    } catch {
      return false;
    }
  },
  setName: (userName: string) => saveData(() => ({ userName })),
  setCurrency: (currency: string) => {
    if (currency !== "ARS" && currency !== "USD" && currency !== "EUR") return Promise.resolve(false);
    return saveData(() => ({ currency }));
  },
  setCategories: (categories: string[]) => saveData(() => ({ categories })),
  saveTx: (t: Omit<Tx, "id"> & { id?: string | undefined }) =>
    saveData((s) => ({
      txs: t.id ? s.txs.map((x) => (x.id === t.id ? (t as Tx) : x)) : [{ ...t, id: uid() }, ...s.txs],
    })),
  deleteTx: (id: string) => saveData((s) => ({ txs: s.txs.filter((x) => x.id !== id) })),
  saveGoal: (g: Omit<Goal, "id"> & { id?: string | undefined }) =>
    saveData((s) => ({
      goals: g.id ? s.goals.map((x) => (x.id === g.id ? (g as Goal) : x)) : [...s.goals, { ...g, id: uid() }],
    })),
  addProgress: (id: string, amount: number) =>
    saveData((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, saved: g.saved + amount } : g)) })),
  deleteGoal: (id: string) => saveData((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
  resetDemo: () => {
    if (state.session?.guest) set({ txs: SAMPLE_TXS, goals: SAMPLE_GOALS, categories: DEFAULT_CATEGORIES });
  },
  saveBudget: (budget: Budget) => saveData((s) => ({
    budgets: [...s.budgets.filter((item) =>
      item.category !== budget.category || item.currency !== budget.currency), budget],
  })),
  deleteBudget: (budget: Budget) => saveData((s) => ({
    budgets: s.budgets.filter((item) =>
      item.category !== budget.category || item.currency !== budget.currency),
  })),
  addPayment: (payment: Omit<PlannedPayment, "id" | "paid">) => saveData((s) => ({
    payments: [...s.payments, { ...payment, id: uid(), paid: false }],
  })),
  togglePayment: (id: string) => saveData((s) => ({
    payments: s.payments.map((payment) =>
      payment.id === id ? { ...payment, paid: !payment.paid } : payment),
  })),
  deletePayment: (id: string) => saveData((s) => ({
    payments: s.payments.filter((payment) => payment.id !== id),
  })),
  addShortcut: (shortcut: ExpenseShortcut) => {
    const exists = state.shortcuts.some((item) =>
      item.category === shortcut.category &&
      item.description.toLocaleLowerCase("es-AR") === shortcut.description.toLocaleLowerCase("es-AR"));
    if (exists) {
      toast.error("Ese acceso rápido ya existe.");
      return Promise.resolve(false);
    }
    return saveData((s) => ({ shortcuts: [...s.shortcuts, shortcut] }));
  },
  deleteShortcut: (shortcut: ExpenseShortcut) => saveData((s) => ({
    shortcuts: s.shortcuts.filter((item) => item.category !== shortcut.category || item.description !== shortcut.description),
  })),
  completeReview: (week: string) => {
    if (!state.reviewedWeeks.includes(week)) {
      return saveData((s) => ({ reviewedWeeks: [...s.reviewedWeeks, week] }));
    }
    return Promise.resolve(true);
  },
  setAccessory: (accessory: State["accessory"]) => {
    if (accessory !== null && state.reviewedWeeks.length === 0) return Promise.resolve(false);
    return saveData(() => ({ accessory }));
  },

};

export const useMoney = () => {
  const currency = useApp((s) => s.currency);
  return (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
};
