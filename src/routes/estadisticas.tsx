import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell, Panel } from "@/components/rumbit/AppShell";
import { byCategory, inMonth, totals } from "@/lib/finance";
import { useApp, useMoney } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/estadisticas")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Estadísticas de mis gastos · RUMBIT" },
      { name: "description", content: "Gráficos de gastos por categoría y comparación mensual." },
      { property: "og:title", content: "Estadísticas · RUMBIT" },
      { property: "og:description", content: "Entendé tus hábitos de consumo con gráficos claros." },
    ],
  }),
  component: Stats,
});

const COLORS = Array.from({ length: 9 }, (_, i) => `var(--chart-${i + 1})`);
const FILTERS = [
  { id: "week", label: "Esta semana" },
  { id: "month", label: "Este mes" },
  { id: "3m", label: "Últimos 3 meses" },
] as const;

function localDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function Stats() {
  const txs = useApp((s) => s.txs);
  const money = useMoney();
  const [f, setF] = useState<(typeof FILTERS)[number]["id"]>("month");
  const now = new Date();

  const start = f === "week"
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
    : new Date(now.getFullYear(), now.getMonth() - (f === "3m" ? 2 : 0), 1);
  const end = f === "month" ? new Date(now.getFullYear(), now.getMonth() + 1, 0) : now;
  const from = localDateKey(start);
  const to = localDateKey(end);
  const filtered = txs.filter((t) => t.date >= from && t.date <= to);

  const cats = byCategory(filtered);
  const monthly = [2, 1, 0].map((back) => {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const t = totals(inMonth(txs, d));
    return { mes: d.toLocaleDateString("es-AR", { month: "short" }), Ingresos: t.income, Gastos: t.expenses };
  });
  const prev = monthly[1];
  const cur = monthly[2];
  const diff = prev?.Gastos && cur ? Math.round(((cur.Gastos - prev.Gastos) / prev.Gastos) * 100) : 0;
  const t = totals(filtered);

  return (
    <AppShell title="Estadísticas de mis gastos">
      <div className="mb-6 flex flex-wrap gap-1 rounded-input bg-muted p-1 w-fit" role="group" aria-label="Período">
        {FILTERS.map((x) => (
          <Button variant="ghost" key={x.id} aria-pressed={f === x.id} onClick={() => setF(x.id)} className={cn("rounded-input px-3 text-sm font-medium", f === x.id ? "bg-card text-primary shadow-card hover:bg-card" : "text-muted-foreground")}>
            {x.label}
          </Button>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Gastos por categoría">
          {cats.length ? (
            <div className="grid items-center gap-4 sm:grid-cols-2">
              <div className="h-56">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={cats} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                      {cats.map((_, i) => <Cell key={i} fill={COLORS[i % 9]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => money(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2 text-sm">
                {cats.map((c, i) => (
                  <li key={c.name}>
                    <Link
                      to="/movimientos"
                      search={{ type: "expense", category: c.name, from, to }}
                      aria-label={`Ver gastos de ${c.name} (${c.pct} %)`}
                      className="flex items-center gap-2 rounded-md px-1 py-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: COLORS[i % 9] }} />
                      <span className="min-w-0 flex-1 break-words">{c.name}</span>
                      <span className="font-semibold">{c.pct}%</span>
                      <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : <p className="py-10 text-center text-sm text-muted-foreground">No hay gastos en este período.</p>}
        </Panel>
        <Panel title="Ingresos y gastos mensuales">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Legend />
                <Bar dataKey="Ingresos" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Gastos" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Resumen de hábitos" className="lg:col-span-2">
          <div className="grid gap-6 sm:grid-cols-3">
            <div><p className="text-sm text-muted-foreground">Gastos del período</p><p className="mt-2 text-xl font-semibold tabular-nums">{money(t.expenses)}</p></div>
            <div><p className="text-sm text-muted-foreground">Categoría principal</p><p className="mt-2 text-xl font-semibold">{cats[0]?.name ?? "—"}</p></div>
            <div><p className="text-sm text-muted-foreground">Vs. mes anterior</p><p className={cn("mt-2 text-xl font-semibold tabular-nums", diff > 0 ? "text-warning" : "text-success")}>{diff > 0 ? "+" : ""}{diff}% en gastos</p></div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
