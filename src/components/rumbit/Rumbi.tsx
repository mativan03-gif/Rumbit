import { cn } from "@/lib/utils";

export function Rumbi({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={cn("animate-float", className)} aria-label="Rumbi, la mascota de RUMBIT" role="img">
      <line x1="60" y1="14" x2="60" y2="28" className="stroke-secondary" strokeWidth="4" strokeLinecap="round" />
      <circle cx="60" cy="12" r="6" className="fill-warning" />
      <rect x="22" y="28" width="76" height="60" rx="22" className="fill-primary" />
      <rect x="32" y="40" width="56" height="32" rx="14" className="fill-card" />
      <circle cx="48" cy="56" r="5" className="fill-foreground" />
      <circle cx="72" cy="56" r="5" className="fill-foreground" />
      <path d="M52 64 Q60 70 68 64" className="stroke-foreground" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="50" y="30" width="20" height="4" rx="2" className="fill-secondary" />
      <rect x="36" y="88" width="48" height="18" rx="8" className="fill-secondary" />
      <circle cx="60" cy="97" r="5" className="fill-warning" />
      <rect x="12" y="50" width="10" height="20" rx="5" className="fill-secondary" />
      <rect x="98" y="50" width="10" height="20" rx="5" className="fill-secondary" />
    </svg>
  );
}

export function RumbiTip({ message, title = "Consejo de Rumbi" }: { message: string; title?: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-primary-soft p-4">
      <Rumbi className="h-16 w-16 shrink-0" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-foreground">{title}</p>
        <p className="mt-1 text-sm text-foreground">{message}</p>
      </div>
    </div>
  );
}
