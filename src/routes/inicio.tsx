import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Info, Target, Wallet } from "lucide-react";
import { useState } from "react";
import { AppShell, Panel } from "@/components/rumbit/AppShell";
import { GoalDialog, TxDialog } from "@/components/rumbit/Dialogs";
import { RumbiTip, Rumbi } from "@/components/rumbit/Rumbi";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDate, goalProgress, inMonth, totals, type TxType } from "@/lib/finance";
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
  const recent = [...txs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const goal = goals[0];
  const tip = buildTips(txs, goals, money)[0];

  const cards = [
    { label: "Ingresos del mes", value: t.income, icon: ArrowUpRight, cls: "bg-success-soft text-success" },
    { label: "Gastos del mes", value: t.expenses, icon: ArrowDownRight, cls: "bg-warning-soft text-warning" },
    { label: "Disponible estimado", value: t.available, icon: Wallet, cls: "bg-primary-soft text-primary" },
  ];

  return (
    <AppShell title={`¡Hola, ${name}! Bienvenido a RUMBIT`}>
      <div className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-3">
          {cards.map((c) => (
            <Panel key={c.label}>
              <div className={`mb-3 inline-flex rounded-xl p-2 ${c.cls}`}><c.icon className="h-5 w-5" /></div>
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight">{money(c.value)}</p>
            </Panel>
          ))}
        </div>
        <p className="flex items-start gap-2 text-xs text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Los valores financieros son estimaciones calculadas a partir de tus registros, no saldos bancarios reales.</p>

        <Panel title="Acciones rápidas">
          <div className="grid gap-3 sm:grid-cols-3">
            <Button variant="hero" className="h-12" onClick={() => setTxType("income")}><ArrowUpRight />Registrar ingreso</Button>
            <Button variant="hero" className="h-12" onClick={() => setTxType("expense")}><ArrowDownRight />Registrar gasto</Button>
            <Button variant="soft" className="h-12" onClick={() => setGoalOpen(true)}><Target />Crear meta</Button>
          </div>
        </Panel>

        <div className="grid gap-5 lg:grid-cols-5">
          <Panel title="Últimos movimientos" className="lg:col-span-3" action={<Link to="/movimientos" className="text-sm font-medium text-primary">Ver todos</Link>}>
            <ul className="divide-y divide-border">
              {recent.map((x) => (
                <li key={x.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{x.description}</p>
                    <p className="text-xs text-muted-foreground">{x.category} · {formatDate(x.date)}</p>
                  </div>
                  <span className={`font-semibold ${x.type === "income" ? "text-success" : "text-foreground"}`}>{x.type === "income" ? "+" : "−"}{money(x.amount)}</span>
                </li>
              ))}
              {!recent.length && <li className="py-6 text-center text-sm text-muted-foreground">Todavía no registraste movimientos.</li>}
            </ul>
          </Panel>
          <div className="grid gap-5 lg:col-span-2">
            <Panel title="Meta de ahorro" action={<Link to="/metas" className="text-sm font-medium text-primary">Ver metas</Link>}>
              {goal ? (
                <div className="flex items-center gap-4">
                  <Rumbi className="h-14 w-14 shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between"><span className="font-semibold">{goal.name}</span><span className="font-bold text-primary">{goalProgress(goal).pct}%</span></div>
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
