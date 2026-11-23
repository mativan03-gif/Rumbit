import { cn } from "@/lib/utils";
export function Rumbi({ className, scarf = false }: { className?: string; scarf?: boolean }) {
  return <span className={cn("relative inline-block shrink-0 overflow-hidden rounded-full bg-[#EEE6FF]", className)} role="img" aria-label="Rumi, el gatito robótico oficial de Rumbit">
    <img src="/rumi-personaje.svg" alt="" className="h-full w-full object-contain p-[5%]" />
    {scarf && <span aria-label="Bufanda equipada" className="absolute bottom-[16%] left-[25%] right-[25%] rounded-full bg-[#FF8A65] py-[2%] text-center text-[8px] font-bold text-[#2E1A47]">🧣</span>}
  </span>;
}
export function RumbiTip({ message, title = "Consejo de Rumi" }: { message: string; title?: string }) {
  return <div className="flex items-start gap-3 rounded-2xl bg-primary-soft p-4 sm:p-5"><Rumbi className="h-14 w-14" /><div className="min-w-0"><p className="text-sm font-semibold text-accent-foreground">{title}</p><p className="mt-1 text-sm leading-relaxed text-foreground">{message}</p></div></div>;
}
