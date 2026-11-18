import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Info, Target, Wallet, ArrowRight } from "lucide-react";
import { useState } from "react";
import { AppShell, Panel } from "@/components/rumbit/AppShell";
import { GoalDialog, TxDialog } from "@/components/rumbit/Dialogs";
import { RumbiTip, Rumbi } from "@/components/rumbit/Rumbi";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { byCategory, formatDate, goalProgress, inMonth, totals, txTitle, type TxType } from "@/lib/finance";
import { useApp, useMoney } from "@/lib/store";
import { buildTips, rumbiMessage } from "@/lib/tips";

export const Route = createFileRoute("/inicio")({
  head: () => ({
    meta: [
      { title: "Inicio · RUMBIT" },
      { name: "description", content: "Resumen de ingresos, gastos y metas de ahorro del mes." },
      { property: "og:title", content: "Inicio · RUMBIT" },
      { property: "og:description", content: "Tu resumen financiero del mes en RUMBIT." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const txs = useApp((s) => s.txs);
  const goals = useApp((s) => s.goals);
  const name = useApp((s) => s.userName);
  const money = useMoney();
  const [txType, setTxType] = useState<TxType | null>(null);
  const [goalOpen, setGoalOpen] = useState(false);
  const t = totals(inMonth(txs, new Date()));
  const categories = byCategory(inMonth(txs, new Date()));
  const recent = [...txs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const goal = goals[0];
  const tip = buildTips(txs, goals, money)[0];

  const cards = [
    { label: "Ingresos del mes", value: t.income, icon: ArrowUpRight, cls: "bg-success-soft text-success" },
    { label: "Gastos del mes", value: t.expenses, icon: ArrowDownRight, cls: "bg-warning-soft text-warning" },
    { label: "Disponible estimado", value: t.available, icon: Wallet, cls: "bg-primary-soft text-primary" },
  ];

  return (
    <AppShell title={`¡Hola, ${name}!`}>
      <p className="mb-6 text-sm text-muted-foreground">Tu resumen de {new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" })}</p>
      <div className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {cards.map((c) => (
            <Panel key={c.label} className={c.icon === Wallet ? "border-primary/20 bg-primary-soft sm:order-first" : ""}>
              <div className="mb-5 flex items-center justify-between gap-2"><p className="text-sm font-medium text-muted-foreground">{c.label}</p><div className={`inline-flex shrink-0 rounded-input p-2 ${c.cls}`}><c.icon className="h-5 w-5" /></div></div>
              <p className={`finance-number text-2xl font-semibold xl:text-3xl ${c.icon === Wallet ? "text-accent-foreground" : ""}`}>{money(c.value)}</p>
            </Panel>
          ))}
        </div>
        <p className="flex items-start gap-2 text-xs text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Los valores financieros son estimaciones calculadas a partir de tus registros, no saldos bancarios reales.</p>

        <section aria-label="Acciones rápidas">
          <div className="grid gap-3 sm:grid-cols-3">
            <Button variant="hero" className="h-12" onClick={() => setTxType("expense")}><ArrowDownRight />Registrar gasto</Button>
            <Button variant="secondary" className="h-12" onClick={() => setTxType("income")}><ArrowUpRight />Registrar ingreso</Button>
            <Button variant="soft" className="h-12" onClick={() => setGoalOpen(true)}><Target />Crear meta</Button>
          </div>
        </section>

        <Panel title="Gastos por categoría" action={<Button asChild variant="link" className="px-0"><Link to="/estadisticas">Ver detalle<ArrowRight /></Link></Button>}>
          <div className="grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => (
              <div key={c.name} className="min-w-0">
                <div className="mb-2 flex items-center justify-between gap-2 text-sm"><span className="font-medium">{c.name}</span><span className="tabular-nums text-muted-foreground">{c.pct}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${c.pct}%`, backgroundColor: `var(--chart-${i % 9 + 1})` }} /></div>
                <p className="mt-2 text-sm font-semibold tabular-nums">{money(c.value)}</p>
              </div>
            ))}
            {!categories.length && <p className="text-sm text-muted-foreground">No hay gastos en este período.</p>}
          </div>
        </Panel>

        <div className="grid gap-5 lg:grid-cols-5">
          <Panel title="Últimos movimientos" className="lg:col-span-3" action={<Button asChild variant="link" className="px-0"><Link to="/movimientos">Ver todos<ArrowRight className="h-4 w-4" /></Link></Button>}>
            <ul className="divide-y divide-border">
              {recent.map((x) => (
                <li key={x.id} className="flex flex-wrap items-center gap-3 py-4">
                  <div className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-input sm:flex ${x.type === "income" ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>{x.type === "income" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{txTitle(x)}</p>
                    <p className="text-xs text-muted-foreground">{x.category} · {formatDate(x.date)}</p>
                  </div>
                  <span className={`ml-auto finance-number text-sm font-semibold ${x.type === "income" ? "text-success" : "text-foreground"}`}>{x.type === "income" ? "+" : "−"}{money(x.amount)}</span>
                </li>
              ))}
              {!recent.length && <li className="py-6 text-center text-sm text-muted-foreground">Todavía no registraste movimientos.</li>}
            </ul>
          </Panel>
          <div className="grid gap-5 lg:col-span-2">
            <Panel title="Meta de ahorro" action={<Button asChild variant="link" className="px-0"><Link to="/metas">Ver metas</Link></Button>}>
              {goal ? (
                <div className="flex items-center gap-4">
                  <Rumbi className="h-12 w-12 shrink-0 animate-none" />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2"><span className="font-semibold">{goal.name}</span><span className="font-semibold tabular-nums text-accent-foreground">{goalProgress(goal).pct}%</span></div>
                    <Progress value={goalProgress(goal).pct} className="mt-2 h-2.5" />
                    <p className="mt-2 text-xs text-muted-foreground">{money(goal.saved)} de {money(goal.target)}</p>
                  </div>
                </div>
              ) : <Button variant="soft" onClick={() => setGoalOpen(true)}>Crear tu primera meta</Button>}
              <p className="mt-3 text-sm text-accent-foreground">{rumbiMessage(goals)}</p>
            </Panel>
            {tip && <RumbiTip message={tip.text} />}
          </div>
        </div>
      </div>
      <TxDialog open={!!txType} onOpenChange={(o) => !o && setTxType(null)} defaultType={txType ?? "expense"} />
      <GoalDialog open={goalOpen} onOpenChange={setGoalOpen} />
    </AppShell>
  );
}
