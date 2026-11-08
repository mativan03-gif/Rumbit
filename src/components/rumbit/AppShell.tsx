import { Link, useNavigate } from "@tanstack/react-router";
import { BarChart3, Home, Lightbulb, ListOrdered, PiggyBank, Settings } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useApp } from "@/lib/store";
import { Rumbi } from "./Rumbi";

const NAV = [
  { to: "/inicio", label: "Inicio", icon: Home },
  { to: "/movimientos", label: "Movimientos", icon: ListOrdered },
  { to: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { to: "/metas", label: "Metas de ahorro", short: "Metas", icon: PiggyBank },
  { to: "/recomendaciones", label: "Recomendaciones", short: "Consejos", icon: Lightbulb },
  { to: "/configuracion", label: "Configuración", short: "Ajustes", icon: Settings },
] as const;

export function AppShell({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  const hydrated = useApp((s) => s.hydrated);
  const session = useApp((s) => s.session);
  const navigate = useNavigate();
  useEffect(() => {
    if (hydrated && !session) navigate({ to: "/" });
  }, [hydrated, session, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar p-5 md:flex">
        <Link to="/inicio" className="mb-8 flex items-center gap-2">
          <Rumbi className="h-9 w-9 animate-none" />
          <span className="text-xl font-extrabold tracking-tight text-primary">RUMBIT</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "!bg-primary !text-primary-foreground shadow-glow" }}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <p className="mt-auto text-xs text-muted-foreground">Prototipo con datos ficticios.</p>
      </aside>

      <main className="pb-24 md:pb-10 md:pl-64">
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-6 md:px-10 md:pt-10">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          {actions}
        </header>
        <div className="animate-rise px-5 pt-6 md:px-10">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-border bg-card md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex flex-col items-center gap-1 py-2 text-[10px] font-medium text-muted-foreground"
            activeProps={{ className: "!text-primary" }}
          >
            <n.icon className="h-5 w-5" />
            {"short" in n ? n.short : n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function Panel({ title, children, className = "", action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-5 shadow-card ${className}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
