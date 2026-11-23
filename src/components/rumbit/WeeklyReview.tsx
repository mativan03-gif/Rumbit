import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Panel } from "@/components/rumbit/AppShell";
import { Rumbi } from "@/components/rumbit/Rumbi";
import { Button } from "@/components/ui/button";
import { byCategory, formatDate, goalProgress, totals } from "@/lib/finance";
import { reviewWeek } from "@/lib/planning";
import { actions, useApp, useMoney } from "@/lib/store";

export function WeeklyReview() {
  const txs = useApp((s) => s.txs);
  const goals = useApp((s) => s.goals);
  const reviewedWeeks = useApp((s) => s.reviewedWeeks);
  const saving = useApp((s) => s.saving);
  const accessory = useApp((s) => s.accessory);
  const money = useMoney();
  const [previous, setPrevious] = useState(false);
  const { from, to } = reviewWeek(new Date(), previous);
  const expenses = txs.filter((tx) => tx.type === "expense" && tx.date >= from && tx.date <= to);
  const top = byCategory(expenses)[0];
  const goal = goals.find((item) => item.saved < item.target) ?? goals[0];
  const completed = reviewedWeeks.includes(from);

  return (
    <Panel className="mb-5 bg-primary-soft">
      <div className="flex items-start gap-3">
        <Rumbi scarf={accessory === "scarf"} className="h-16 w-16 shrink-0 animate-none" />
        <div className="min-w-0 space-y-3">
          <h2 className="text-xl font-semibold">Tu semana con Rumi</h2>
          <div className="flex flex-wrap gap-2" aria-label="Período de revisión">
            <Button
              variant="outline"
              size="sm"
              aria-pressed={!previous}
              onClick={() => setPrevious(false)}
            >
              Esta semana
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-pressed={previous}
              onClick={() => setPrevious(true)}
            >
              Semana anterior
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDate(from)} al {formatDate(to)}
          </p>
          {top ? (
            <p>
              Registraste {money(totals(expenses).expenses)} en gastos. {top.name} fue tu categoría
              con más gastos registrados ({money(top.value)}).
            </p>
          ) : (
            <p>En este período no hay gastos registrados.</p>
          )}
          {goal && (
            <p>
              Tu meta «{goal.name}» va por el {goalProgress(goal).pct}%.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/movimientos" search={top ? { from, to, type: "expense" } : {}}>
                {top ? "Ver gastos del período" : "Ir a Movimientos"}
              </Link>
            </Button>
            {goal && (
              <Button asChild variant="outline">
                <Link to="/metas">Ver metas</Link>
              </Button>
            )}
            {top && !completed && (
              <Button disabled={saving} onClick={() => void actions.completeReview(from)}>
                Completar revisión
              </Button>
            )}
          </div>
          {completed && (
            <p role="status" className="text-sm font-medium">
              ¡Revisión completada!
            </p>
          )}
          {reviewedWeeks.length > 0 && (
            <Button
              variant="outline"
              aria-pressed={accessory === "scarf"}
              disabled={saving}
              onClick={() => void actions.setAccessory(accessory ? null : "scarf")}
            >
              {accessory ? "Quitar bufanda" : "Equipar bufanda de Rumi"}
            </Button>
          )}
        </div>
      </div>
    </Panel>
  );
}
