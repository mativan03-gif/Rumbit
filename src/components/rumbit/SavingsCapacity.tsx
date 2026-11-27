import { useState } from "react";
import { useApp, useMoney } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SavingsCapacity({
  goalId,
  onApply,
}: {
  goalId?: string;
  onApply: (amount: number) => void;
}) {
  const money = useMoney();
  const txs = useApp((s) => s.txs);
  const goals = useApp((s) => s.goals);

  const [enabled, setEnabled] = useState(false);
  const [manual, setManual] = useState(false);
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [reserve, setReserve] = useState("20");

  const now = new Date();

  const months = [1, 2, 3].map((offset) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - offset,
      1
    );

    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
  });

  const history = txs.filter((tx) =>
    months.includes(tx.date.slice(0, 7))
  );

  const enoughHistory = months.every((month) =>
    history.some(
      (tx) =>
        tx.date.startsWith(month) &&
        tx.type === "income"
    ) &&
    history.some(
      (tx) =>
        tx.date.startsWith(month) &&
        tx.type === "expense"
    )
  );

  const averageIncome =
    history
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amount, 0) / 3;

  const averageExpenses =
    history
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + tx.amount, 0) / 3;

  const useManual = manual || !enoughHistory;

  const monthlyIncome = useManual
    ? Number(income)
    : averageIncome;

  const monthlyExpenses = useManual
    ? Number(expenses)
    : averageExpenses;

  const committed = goals.reduce((sum, goal) => {
    if (
      goal.id === goalId ||
      goal.saved >= goal.target ||
      !goal.plan
    ) {
      return sum;
    }

    const factor =
      goal.plan.frequency === "weekly"
        ? 52 / 12
        : goal.plan.frequency === "biweekly"
          ? 26 / 12
          : 1;

    return sum + goal.plan.contribution * factor;
  }, 0);

  const valid =
    Number.isFinite(monthlyIncome) &&
    Number.isFinite(monthlyExpenses) &&
    monthlyIncome >= 0 &&
    monthlyExpenses >= 0 &&
    reserve.trim() !== "" &&
    Number(reserve) >= 0 &&
    Number(reserve) <= 100 &&
    (!useManual ||
      (income.trim() !== "" && expenses.trim() !== ""));

  const balance = monthlyIncome - monthlyExpenses;

  const emergencyReserve =
    Math.max(0, balance) * Number(reserve) / 100;

  const suggested = Math.floor(
    Math.max(0, balance - emergencyReserve - committed) * 100
  ) / 100;

  return (
    <div className="mt-6 space-y-4 rounded-xl border border-border p-4">
      <div>
        <h3 className="font-semibold">
          Descubrí cuánto podés ahorrar
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Calculá un aporte mensual según tus ingresos y gastos.
        </p>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-5 w-5 accent-primary"
        />
        <span className="text-sm font-medium">
          Calcular mi capacidad de ahorro
        </span>
      </label>

      {enabled && (
        <>
          {!enoughHistory && (
            <p className="rounded-lg bg-muted p-3 text-sm">
              Todavía no tenés suficiente historial.
              Podés ingresar tus ingresos y gastos mensuales.
            </p>
          )}

          {enoughHistory && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={manual}
                onChange={(e) => setManual(e.target.checked)}
              />
              Ingresar valores manualmente
            </label>
          )}

          {useManual && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Ingresos mensuales</Label>
                <Input
                  type="number"
                  min="0"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Gastos mensuales</Label>
                <Input
                  type="number"
                  min="0"
                  value={expenses}
                  onChange={(e) => setExpenses(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Reserva para imprevistos (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={reserve}
              onChange={(e) => setReserve(e.target.value)}
            />
          </div>

          {valid && (
            <>
              <div className="space-y-3 rounded-xl bg-muted p-4 text-sm">
                <div className="flex justify-between gap-2">
                  <span>Ingresos mensuales</span>
                  <strong>{money(monthlyIncome)}</strong>
                </div>

                <div className="flex justify-between gap-2">
                  <span>Gastos mensuales</span>
                  <strong>{money(monthlyExpenses)}</strong>
                </div>

                <div className="flex justify-between gap-2">
                  <span>Dinero disponible</span>
                  <strong>{money(balance)}</strong>
                </div>

                <div className="flex justify-between gap-2">
                  <span>Reserva para imprevistos</span>
                  <strong>{money(emergencyReserve)}</strong>
                </div>

                <div className="flex justify-between gap-2">
                  <span>Otras metas</span>
                  <strong>{money(committed)}</strong>
                </div>
              </div>

              <div className="rounded-xl bg-primary-soft p-4">
                <p className="text-sm text-muted-foreground">
                  Capacidad de ahorro mensual sugerida
                </p>
                <p className="mt-1 text-2xl font-bold text-primary">
                  {money(suggested)}
                </p>
              </div>

              {suggested > 0 ? (
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => onApply(suggested)}
                >
                  Usar aporte mensual sugerido
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Por ahora no hay margen de ahorro según estos datos.
                  Revisá tus gastos antes de asumir nuevos compromisos.
                </p>
              )}
            </>
          )}

          <p className="text-xs text-muted-foreground">
            Este aporte es opcional. Podés utilizarlo como referencia
            o elegir cuánto querés ahorrar según tus necesidades.
            Esta estimación es orientativa y depende de los datos
            registrados. No modifica tu saldo ni registra movimientos.
          </p>
        </>
      )}
    </div>
  );
}
