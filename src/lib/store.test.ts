import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

const auth = vi.hoisted(() => ({
  onAuthStateChange: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  signOut: vi.fn(),
  updateUser: vi.fn(),
  from: vi.fn(),
}));
vi.mock("./auth", () => ({ getAuthClient: () => ({ auth, from: auth.from }) }));

const firstUser = { user: { id: "first", email: "first@example.com" } } as Session;
type AuthListener = (event: AuthChangeEvent, session: Session | null) => void;
const listener = (): AuthListener => auth.onAuthStateChange.mock.calls[0]?.[0] as AuthListener;

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState(null, "", "/");
});

test("requests a new legal acceptance per account and keeps it after reentry", async () => {
  const { actions, hydrate, LEGAL_VERSION, useApp } = await import("./store");
  const { result } = renderHook(() => useApp((state) => state));
  hydrate();

  act(() => listener()("INITIAL_SESSION", null));
  act(() => actions.startDemo());
  expect(result.current.legalReviewPending).toBe(false);

  await act(async () => listener()("SIGNED_IN", firstUser));
  expect(result.current.legalReviewPending).toBe(true);

  auth.updateUser.mockResolvedValueOnce({ error: new Error("offline") });
  await act(async () => {
    await expect(actions.acceptLegalTerms()).rejects.toThrow("offline");
  });
  expect(result.current.legalReviewPending).toBe(true);

  auth.updateUser.mockResolvedValueOnce({ error: null });
  await act(async () => actions.acceptLegalTerms());
  expect(auth.updateUser).toHaveBeenLastCalledWith({
    data: {
      rumbit_legal_version: LEGAL_VERSION,
      rumbit_legal_accepted_at: expect.any(String),
    },
  });
  expect(result.current.legalReviewPending).toBe(false);

  act(() => listener()("SIGNED_OUT", null));
  await act(async () => listener()("SIGNED_IN", {
    ...firstUser,
    user: { ...firstUser.user, user_metadata: { rumbit_legal_version: LEGAL_VERSION } },
  }));
  expect(result.current.legalReviewPending).toBe(false);
  await act(async () => listener()("SIGNED_IN", {
    ...firstUser,
    user: { ...firstUser.user, id: "second", user_metadata: { rumbit_legal_version: "previous" } },
  }));
  expect(result.current.legalReviewPending).toBe(true);
});

test("restores account identity without loading or modifying legacy demo data", async () => {
  const legacy = '{"userName":"Legacy visitor","txs":[{"id":"mixed"}]}';
  localStorage.setItem("rumbit-state-v1", legacy);
  const { actions, hydrate, useApp } = await import("./store");
  const { result } = renderHook(() => useApp((state) => state));
  hydrate();

  act(() => listener()("INITIAL_SESSION", null));
  act(() => {
    actions.startDemo();
    actions.setName("Demo visitor");
  });
  act(() => listener()("SIGNED_IN", firstUser));

  expect(result.current.session).toMatchObject({ userId: "first", guest: false });
  expect(result.current.userName).not.toBe("Demo visitor");
  expect(result.current.txs).toEqual([]);
  expect(result.current.goals).toEqual([]);
  expect(localStorage.getItem("rumbit-state-v1")).toBe(legacy);

  auth.signOut.mockImplementation(async () => {
    listener()("SIGNED_OUT", null);
    return { error: null };
  });
  await act(async () => {
    expect(await actions.logout()).toBe(true);
  });
  expect(result.current.session).toBeNull();
});

test("holds the panel while a recovery callback is exchanging its code", async () => {
  window.history.replaceState(null, "", "/?code=recovery-test");
  const { actions, hydrate, useApp } = await import("./store");
  const { result } = renderHook(() => useApp((state) => state));
  auth.exchangeCodeForSession.mockImplementation(async () => {
    listener()("INITIAL_SESSION", firstUser);
    expect(result.current.hydrated).toBe(false);
    listener()("PASSWORD_RECOVERY", firstUser);
    return { data: { session: firstUser }, error: null };
  });

  await act(async () => hydrate());
  expect(auth.exchangeCodeForSession).toHaveBeenCalledWith("recovery-test");
  expect(result.current.recoveringPassword).toBe(true);
  expect(window.location.search).toBe("");
  act(() => listener()("USER_UPDATED", firstUser));
  expect(result.current.recoveringPassword).toBe(true);
  act(() => actions.finishRecovery());
  expect(result.current.recoveringPassword).toBe(false);
});

test("saves account data, restores it on reentry, and starts a different account empty", async () => {
  const { actions, hydrate, useApp } = await import("./store");
  const { result } = renderHook(() => useApp((state) => state));
  const snapshots = new Map<string, unknown>();
  snapshots.set("first", {
    revision: 1,
    data: { userName: "Cuenta anterior", currency: "ARS", categories: ["Alimentación"], txs: [], goals: [] },
  });
  const table = {
    update: (row: { data: unknown; revision: number }) => ({
      eq: (_column: string, id: string) => ({
        eq: (_revisionColumn: string, revision: number) => ({
          select: () => ({
            maybeSingle: async () => {
              expect(row.revision).toBe(revision + 1);
              snapshots.set(id, row);
              return { error: null, data: { revision: row.revision } };
            },
          }),
        }),
      }),
    }),
    select: () => ({
      eq: (_column: string, id: string) => ({
        maybeSingle: async () => ({ error: null, data: snapshots.get(id) ?? null }),
      }),
    }),
    insert: (row: { user_id: string; data: unknown }) => ({
      select: () => ({
        single: async () => {
          snapshots.set(row.user_id, { data: row.data, revision: 1 });
          return { error: null, data: { revision: 1 } };
        },
      }),
    }),
  };
  auth.from.mockReturnValue(table);
  hydrate();

  await act(async () => listener()("INITIAL_SESSION", firstUser));
  expect(result.current.accountStatus).toBe("ready");
  expect(result.current.budgets).toEqual([]);
  await act(async () => {
    expect(await actions.saveBudget({ category: "Alimentación", limit: 1500, currency: "ARS" })).toBe(true);
  });
  expect(result.current.txs).toEqual([]);

  await act(async () => {
    expect(await actions.saveTx({
      type: "expense", amount: 1200, category: "Alimentación", description: "Almuerzo",
      date: "2026-11-18",
    })).toBe(true);
  });
  expect(result.current.txs).toHaveLength(1);

  await act(async () => listener()("TOKEN_REFRESHED", firstUser));
  expect(result.current.txs).toHaveLength(1);
  act(() => listener()("SIGNED_OUT", null));
  await act(async () => listener()("SIGNED_IN", firstUser));
  expect(result.current.txs[0]?.description).toBe("Almuerzo");
  expect(result.current.budgets[0]?.limit).toBe(1500);

  await act(async () => listener()("SIGNED_IN", {
    user: { id: "second", email: "second@example.com" },
  } as Session));
  expect(result.current.txs).toEqual([]);
  expect(result.current.goals).toEqual([]);
  expect(result.current.budgets).toEqual([]);
});
