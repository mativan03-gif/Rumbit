import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/rumbit/AppShell";

export const Route = createFileRoute("/jugar-con-rumi")({
  head: () => ({
    meta: [
      { title: "Jugar con Rumi · RUMBIT" },
      { name: "description", content: "Jugá y cuidá a Rumi. El progreso del juego es independiente de tus finanzas." },
      { property: "og:title", content: "Jugar con Rumi · RUMBIT" },
      { property: "og:description", content: "Jugá y cuidá a Rumi. El progreso del juego es independiente de tus finanzas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RumiGame,
});

function RumiGame() {
  const navigate = useNavigate();

  return (
    <AppShell title="Jugar con Rumi">
      <p className="mb-4 text-sm text-muted-foreground">Cuidá a Rumi y disfrutá sus actividades. Por ahora, el progreso del juego es independiente de tus movimientos financieros y se guarda en este navegador.</p>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <iframe
          title="Juego interactivo de Rumi"
          src="/juego_rumi.html"
          className="block h-[780px] w-full border-0 sm:h-[850px] lg:h-[920px]"
          loading="lazy"
          onLoad={(event) => {
            const backLink = event.currentTarget.contentDocument?.querySelector<HTMLAnchorElement>('a[href="index.html"]');
            if (!backLink) return;
            backLink.onclick = (click) => {
              click.preventDefault();
              navigate({ to: "/inicio" });
            };
          }}
        />
      </div>
    </AppShell>
  );
}
