import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { BarChart3, Home, Lightbulb, ListOrdered, PiggyBank, Settings, ShieldCheck, Gamepad2, LogOut } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { actions as sessionActions, useApp } from "@/lib/store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Rumbi } from "./Rumbi";

const NAV = [
  { to: "/inicio", label: "Inicio", icon: Home },
  { to: "/movimientos", label: "Movimientos", icon: ListOrdered },
  { to: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { to: "/metas", label: "Metas de ahorro", short: "Metas", icon: PiggyBank },
  { to: "/jugar-con-rumi", label: "Jugar con Rumi", short: "Jugar", icon: Gamepad2 },
  { to: "/recomendaciones", label: "Recomendaciones", short: "Consejos", icon: Lightbulb },
  { to: "/configuracion", label: "Configuración", short: "Ajustes", icon: Settings },
] as const;

export function AppShell({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  const hydrated = useApp((s) => s.hydrated);
  const session = useApp((s) => s.session);
  const navigate = useNavigate();
  const pathname = useLocation({ select: (location) => location.pathname });
  const accountStatus = useApp((s) => s.accountStatus);
  const saving = useApp((s) => s.saving);
  const recovering = useApp((s) => s.recoveringPassword);
  useEffect(() => {
    if (hydrated && (!session || recovering)) void navigate({ to: "/", replace: true });
  }, [hydrated, recovering, session, navigate]);

  if (!hydrated || !session || recovering) return null;
  const financePending = !session.guest && accountStatus !== "ready" &&
    pathname !== "/jugar-con-rumi" && pathname !== "/recomendaciones";

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-8 md:flex">
        <Link to="/inicio" className="mb-10 flex min-h-11 items-center gap-2 px-3">
          <Rumbi className="h-10 w-10 animate-none" />
          <span className="text-2xl font-bold text-foreground">RUMBIT<span className="text-primary">.</span></span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
               className="flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
               activeProps={{ className: "!bg-primary-soft !text-primary font-semibold" }}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
         
<div className="mt-auto border-t border-border pt-6">
  <div className="flex items-start gap-2 px-3 text-xs leading-relaxed text-muted-foreground">
    <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
    <p>
      {session.guest && <>Modo de demostración.<br /></>}
      Sin conexión bancaria.
    </p>
  </div>

  <Button
    variant="outline"
    className="mt-4 w-full justify-start gap-2"
    disabled={saving}
    onClick={async () => {
      if (await sessionActions.logout()) {
        toast.success("Sesión cerrada");
        void navigate({ to: "/", replace: true });
      } else {
        toast.error("No pudimos cerrar la sesión. Volvé a intentar.");
      }
    }}
  >
    <LogOut className="h-4 w-4" />
    Cerrar sesión
  </Button>
</div>
      </aside>

       <main className="min-w-0 pb-24 md:pb-12 md:pl-64">
         <div className="mx-auto max-w-[1440px]">
         <div className="flex items-center gap-2 border-b border-border px-5 py-4 md:hidden"><Rumbi className="h-8 w-8 animate-none" /><span className="font-bold">RUMBIT<span className="text-primary">.</span></span></div>
         <header className="flex flex-wrap items-center justify-between gap-4 px-5 pt-8 md:px-8 md:pt-10 lg:px-10">
           <h1 className="min-w-0 text-2xl font-bold leading-tight md:text-3xl">{financePending ? "Cuenta Rumbit" : title}</h1>
          {financePending ? null : actions}
        </header>
         {saving && <p role="status" className="px-5 pt-2 text-sm text-muted-foreground md:px-8 lg:px-10">Guardando…</p>}
         <div className="animate-rise px-5 pt-6 md:px-8 lg:px-10">{financePending ? (
           <Panel title={accountStatus === "error" ? "No pudimos cargar tu cuenta" : "Cargando tu cuenta"}>
             <p className="mb-4 text-sm text-muted-foreground" role="status">
               {accountStatus === "error"
                 ? "Comprobá la conexión o la configuración de Supabase y volvé a intentar."
                 : "Estamos recuperando tus datos."}
             </p>
             <div className="flex flex-wrap gap-2">
               {accountStatus === "error" && <Button onClick={sessionActions.retryAccount}>Reintentar</Button>}
               <Button variant="outline" onClick={async () => {
                 if (!(await sessionActions.logout())) toast.error("No pudimos cerrar la sesión. Volvé a intentar.");
               }}>Cerrar sesión</Button>
             </div>
           </Panel>
         ) : children}</div>
         </div>
      </main>

       <nav aria-label="Navegación principal" className="mobile-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-7 border-t border-border bg-card md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
             className="flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 py-2 text-[9px] font-medium text-muted-foreground sm:text-[10px]"
             activeProps={{ className: "!text-primary bg-primary-soft" }}
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
     <section className={`min-w-0 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6 ${className}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-2">
           <h2 className="min-w-0 font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
