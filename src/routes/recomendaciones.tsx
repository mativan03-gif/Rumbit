import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Lightbulb, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/rumbit/AppShell";
import { Rumbi } from "@/components/rumbit/Rumbi";
import { useApp, useMoney } from "@/lib/store";
import { buildTips } from "@/lib/tips";

export const Route = createFileRoute("/recomendaciones")({
  head: () => ({
    meta: [
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
      <div className="mb-6 flex items-center gap-4 rounded-2xl bg-gradient-primary p-5 text-primary-foreground shadow-glow">
        <Rumbi className="h-16 w-16 shrink-0" />
        <p className="text-sm md:text-base">Analicé tus movimientos registrados y preparé algunos consejos para vos.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {tips.map((t, i) => {
          const T = TONE[t.tone];
          return (
            <div key={i} className="animate-rise flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card" style={{ animationDelay: `${i * 70}ms` }}>
              <div className={`h-fit rounded-xl p-2.5 ${T.cls}`}><T.icon className="h-5 w-5" /></div>
              <div><h3 className="font-semibold">{t.title}</h3><p className="mt-1 text-sm text-muted-foreground">{t.text}</p></div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
