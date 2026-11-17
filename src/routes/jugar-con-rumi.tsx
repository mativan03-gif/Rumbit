import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
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
  const gameFrame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let backLink: HTMLAnchorElement | null = null;
    const returnToRumbit = (click: MouseEvent) => {
      click.preventDefault();
      navigate({ to: "/inicio" });
    };
    // The HTML can be interactive before external fonts finish loading.
    const bindReturnLink = () => {
      const link = gameFrame.current?.contentDocument?.querySelector<HTMLAnchorElement>('a[href="index.html"]');
      if (!link || link === backLink) return;
      backLink?.removeEventListener("click", returnToRumbit);
      backLink = link;
      backLink.addEventListener("click", returnToRumbit);
    };
    bindReturnLink();
    const timer = window.setInterval(bindReturnLink, 100);
    return () => {
      window.clearInterval(timer);
      backLink?.removeEventListener("click", returnToRumbit);
    };
  }, [navigate]);

  return (
    <AppShell title="Jugar con Rumi">
      <p className="mb-4 text-sm text-muted-foreground">Cuidá a Rumi y disfrutá sus actividades. Por ahora, el progreso del juego es independiente de tus movimientos financieros y se guarda en este navegador.</p>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <iframe
          ref={gameFrame}
          title="Juego interactivo de Rumi"
          src="/juego_rumi.html"
          className="block h-[780px] w-full border-0 sm:h-[850px] lg:h-[920px]"
          loading="lazy"
        />
      </div>
    </AppShell>
  );
}
