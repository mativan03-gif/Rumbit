import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Lightbulb, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/rumbit/AppShell";
import { WeeklyReview } from "@/components/rumbit/WeeklyReview";
import { Budgets, Payments } from "@/components/rumbit/PlanningPanels";
import { useApp, useMoney } from "@/lib/store";
import { buildTips } from "@/lib/tips";

export const Route = createFileRoute("/recomendaciones")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Consejos para organizar tu dinero · RUMBIT" },
      { name: "description", content: "Recomendaciones simples basadas en tus movimientos." },
      { property: "og:title", content: "Recomendaciones · RUMBIT" },
      { property: "og:description", content: "Consejos simples para organizar tu dinero." },
    ],
  }),
  component: Tips,
});

const TONE = {
  info: { icon: Lightbulb, cls: "bg-primary-soft text-primary" },
  warning: { icon: AlertTriangle, cls: "bg-warning-soft text-warning" },
  success: { icon: TrendingUp, cls: "bg-success-soft text-success" },
};

function Tips() {
  const txs = useApp((s) => s.txs);
  const goals = useApp((s) => s.goals);
  const money = useMoney();
  const tips = buildTips(txs, goals, money);
  return (
    <AppShell title="Consejos para organizar tu dinero">
      <WeeklyReview />
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <Budgets />
        <Payments />
      </div>
      <h2 className="mb-3 text-lg font-semibold">Más consejos</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {tips.map((t, i) => {
          const T = TONE[t.tone];
          return (
            <div key={i} className="flex min-w-0 gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className={`h-fit shrink-0 rounded-input p-2.5 ${T.cls}`}><T.icon className="h-5 w-5" /></div>
              <div className="min-w-0"><h3 className="font-semibold">{t.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.text}</p></div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
