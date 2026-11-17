import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/rumbit/AppShell";

export const Route = createFileRoute("/jugar-con-rumi")({
  head: () => ({ meta: [{ title: "Jugar con Rumi · RUMBIT" }, { name: "description", content: "Jugá y cuidá a Rumi." }] }),
  component: RumiGame,
});

function RumiGame() {
  return (
    <AppShell title="Jugar con Rumi">
      <p className="mb-4 text-sm text-muted-foreground">Cuidá a Rumi y disfrutá sus actividades. Por ahora, el progreso del juego es independiente de tus movimientos financieros y se guarda en este navegador.</p>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <iframe
          title="Juego interactivo de Rumi"
          src="/juego_rumi.html"
          className="block h-[780px] w-full border-0 sm:h-[850px] lg:h-[920px]"
          loading="lazy"
        />
      </div>
    </AppShell>
  );
}
