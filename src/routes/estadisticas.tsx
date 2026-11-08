import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell, Panel } from "@/components/rumbit/AppShell";
import { byCategory, inMonth, totals } from "@/lib/finance";
import { useApp, useMoney } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/estadisticas")({
  head: () => ({
    meta: [
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

function Stats() {
  const txs = useApp((s) => s.txs);
  const money = useMoney();
  const [f, setF] = useState<(typeof FILTERS)[number]["id"]>("month");
  const now = new Date();

  const filtered = useMemo(() => {
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    if (f === "month") return inMonth(txs, now);
    const start = f === "week" ? new Date(now.getTime() - 6 * 864e5) : new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return txs.filter((t) => t.date >= iso(start) && t.date <= iso(now));
  }, [txs, f]);

  const cats = byCategory(filtered);
  const monthly = [2, 1, 0].map((back) => {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const t = totals(inMonth(txs, d));
    return { mes: d.toLocaleDateString("es-AR", { month: "short" }), Ingresos: t.income, Gastos: t.expenses };
  });
  const prev = monthly[1]!;
  const cur = monthly[2]!;
  const diff = prev.Gastos ? Math.round(((cur.Gastos - prev.Gastos) / prev.Gastos) * 100) : 0;
  const t = totals(filtered);

  return (
    <AppShell title="Estadísticas de mis gastos">
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((x) => (
          <button key={x.id} onClick={() => setF(x.id)} className={cn("rounded-full px-4 py-2 text-sm font-medium transition-all", f === x.id ? "bg-primary text-primary-foreground shadow-glow" : "bg-card text-muted-foreground shadow-card")}>
            {x.label}
          </button>
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
                  <li key={c.name} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ background: COLORS[i % 9] }} />
                    <span className="flex-1">{c.name}</span>
                    <span className="font-semibold">{c.pct}%</span>
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
                <Bar dataKey="Ingresos" fill="var(--success)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Gastos" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Resumen de hábitos" className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-muted p-4"><p className="text-sm text-muted-foreground">Gastos del período</p><p className="text-xl font-bold">{money(t.expenses)}</p></div>
            <div className="rounded-xl bg-muted p-4"><p className="text-sm text-muted-foreground">Categoría principal</p><p className="text-xl font-bold">{cats[0]?.name ?? "—"}</p></div>
            <div className="rounded-xl bg-muted p-4"><p className="text-sm text-muted-foreground">Vs. mes anterior</p><p className={cn("text-xl font-bold", diff > 0 ? "text-warning" : "text-success")}>{diff > 0 ? "+" : ""}{diff}% en gastos</p></div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
