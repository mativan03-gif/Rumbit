import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Rumbi } from "@/components/rumbit/Rumbi";
import { finishOnboarding, useApp } from "@/lib/store";
export const Route = createFileRoute("/bienvenida")({ component: Welcome });
const steps = [
  { title: "Registrá tus ingresos y gastos", body: "Desde Inicio elegí Registrar ingreso o Registrar gasto. Anotá el monto y la categoría de tu primer movimiento.", example: "Ejemplo: ingreso $100.000" },
  { title: "Entendé tu saldo", body: "Saldo es la diferencia entre ingresos y gastos que registraste este mes. No representa tu saldo bancario.", example: "Ejemplo ficticio: $100.000 − $15.000 de gastos = $85.000 de saldo" },
  { title: "Organizá lo que viene", body: "Creá un presupuesto, anotá un próximo pago y seguí una meta de ahorro. En Tu semana con Rumi podés revisar tus avances.", example: "Ejemplo: presupuesto $50.000 · pago el viernes · meta de ahorro $200.000" },
];
export function Welcome({ replay = false }: { replay?: boolean }) {
  const navigate = useNavigate(); const session = useApp(s => s.session); const hydrated = useApp(s => s.hydrated); const pending = useApp(s => s.onboardingPending);
  const [step, setStep] = useState(0); const [busy, setBusy] = useState(false);
  useEffect(() => { if (hydrated && (!session || (!replay && !pending))) void navigate({to: session ? "/inicio" : "/", replace:true}); }, [hydrated,session,pending,navigate,replay]);
  const finish = async () => { setBusy(true); try { if (!replay) await finishOnboarding(); void navigate({to:"/inicio",replace:true}); } catch { toast.error("No pudimos guardar la bienvenida. Intentá otra vez."); } finally {setBusy(false);} };
  if (!hydrated || !session || (!replay && !pending)) return null;
  return <main className="flex min-h-screen items-center justify-center bg-[#FFF8E1] p-4 sm:p-8"><section className="w-full max-w-xl rounded-3xl border border-[#DCCBFF] bg-white p-5 shadow-xl sm:p-9">
    <div className="flex items-center gap-4"><Rumbi className="h-20 w-20 sm:h-28 sm:w-28"/><div><p className="text-sm font-semibold text-primary">{replay ? "Repasá con Rumi" : "Rumi te acompaña"}</p><h1 className="text-2xl font-bold sm:text-3xl">{replay ? "¡Repasemos cómo usar Rumbit!" : "¡Te damos la bienvenida a Rumbit!"}</h1></div></div>
    <p className="mt-5 text-sm text-muted-foreground">Paso {step+1} de 3 · Una guía rápida para empezar</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{width:`${(step+1)/3*100}%`}}/></div>
    <h2 className="mt-7 text-xl font-bold">{(steps[step] ?? steps[0]!).title}</h2><p className="mt-3 leading-relaxed">{(steps[step] ?? steps[0]!).body}</p><div className="mt-5 rounded-2xl bg-[#F0E9FF] p-4 text-sm text-[#2E1A47]"><strong>Solo demostración</strong><p className="mt-1">{(steps[step] ?? steps[0]!).example}</p></div>
    <p className="mt-4 text-xs text-muted-foreground">Estos ejemplos no crean movimientos ni modifican tus datos.</p>
    <div className="mt-7 flex flex-wrap items-center justify-between gap-2"><Button variant="ghost" disabled={busy} onClick={() => void finish()}>Omitir por ahora</Button><div className="flex gap-2"><Button variant="outline" disabled={step===0 || busy} onClick={()=>setStep(s=>s-1)}>Volver</Button>{step<2 ? <Button disabled={busy} onClick={()=>setStep(s=>s+1)}>Siguiente</Button> : <Button disabled={busy} onClick={() => void finish()}>Ir a Inicio</Button>}</div></div>
  </section></main>;
}
