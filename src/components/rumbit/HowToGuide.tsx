import { Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowRight, BookOpen, ChevronDown, Target, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Panel } from "@/components/rumbit/AppShell";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/**
 * Onboarding guide for /inicio. Starts closed, opens from its own trigger and can
 * be hidden again from the trigger or the "Ocultar guía" button. The two in-page
 * shortcuts reuse the dialogs already open on the screen.
 */
export function HowToGuide({ onRegisterExpense, onCreateGoal }: { onRegisterExpense: () => void; onCreateGoal: () => void }) {
  const [open, setOpen] = useState(false);

  const steps: { n: number; title: string; text: string; action: ReactNode }[] = [
    {
      n: 1,
      title: "Registrá un gasto",
      text: "Anotá lo que gastás y RUMBIT lo suma a tu resumen del mes.",
      action: (
        <Button variant="hero" className="w-full sm:w-auto" onClick={onRegisterExpense}>
          <ArrowDownRight />
          Registrar gasto
        </Button>
      ),
    },
    {
      n: 2,
      title: "Mirá tus estadísticas",
      text: "Vé en qué categorías se va tu plata y cómo cambia mes a mes.",
      action: (
        <Button asChild variant="soft" className="w-full sm:w-auto">
          <Link to="/estadisticas">
            Ver estadísticas
            <ArrowRight />
          </Link>
        </Button>
      ),
    },
    {
      n: 3,
      title: "Creá una meta de ahorro",
      text: "Definís un objetivo con fecha estimada y seguís su avance.",
      action: (
        <Button variant="soft" className="w-full sm:w-auto" onClick={onCreateGoal}>
          <Target />
          Crear meta
        </Button>
      ),
    },
  ];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <BookOpen />
          Cómo usar la app
          <ChevronDown className={cn("transition-transform duration-200", open && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="animate-rise mt-3">
        <Panel
          title="Guía rápida: 3 pasos"
          action={
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setOpen(false)}>
              <X />
              Ocultar guía
            </Button>
          }
        >
          <ol className="grid gap-4 sm:grid-cols-3">
            {steps.map((s) => (
              <li key={s.n} className="min-w-0 rounded-xl bg-muted/60 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-input bg-primary-soft text-sm font-bold text-accent-foreground">{s.n}</span>
                  <h3 className="min-w-0 font-semibold">{s.title}</h3>
                </div>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                {s.action}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-muted-foreground">Es una guía de la demo: RUMBIT no se conecta a tu banco ni mueve dinero.</p>
        </Panel>
      </CollapsibleContent>
    </Collapsible>
  );
}
