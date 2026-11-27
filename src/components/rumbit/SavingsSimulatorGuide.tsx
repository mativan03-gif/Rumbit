import { useEffect, useState } from "react";
import {
  BookOpen,
  Target,
  Wallet,
  CalendarDays,
  Calculator,
  BarChart3,
  Flag,
  ArrowLeft,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/rumbit/AppShell";

const STORAGE_KEY = "rumbit-savings-guide-seen-v1";

const steps = [
  {
    icon: Target,
    title: "Planificá tus sueños con Rumi",
    text: "Descubrí cuánto necesitás ahorrar y cuándo podrías alcanzar tus objetivos.",
  },
  {
    icon: Wallet,
    title: "Definí tu objetivo",
    text: "Ingresá el nombre de tu meta, cuánto cuesta y cuánto dinero ya tenés ahorrado.",
  },
  {
    icon: CalendarDays,
    title: "Elegí cómo ahorrar",
    text: "Indicá cuánto podés ahorrar por semana, cada 14 días o por mes. También podés elegir una fecha para alcanzar tu meta.",
  },
  {
    icon: Calculator,
    title: "Descubrí cuánto podés ahorrar",
    text: "Activá Calcular mi capacidad de ahorro. Rumbit puede utilizar tus movimientos registrados o permitirte ingresar manualmente tus ingresos y gastos mensuales. Reservá un porcentaje para imprevistos y utilizá el aporte sugerido.",
  },
  {
    icon: Wallet,
    title: "Veamos un ejemplo",
    text: "Si ganás $600.000 y gastás $450.000 por mes, te quedan $150.000. Si reservás un 20% para imprevistos ($30.000), podrías ahorrar $120.000 al mes, siempre que no tengas otras metas comprometidas.",
  },
  {
    icon: BarChart3,
    title: "Compará tus alternativas",
    text: "Explorá los escenarios Tranquilo, Intermedio y Acelerado. Revisá el gráfico y los consejos de Rumi para elegir el plan que mejor se adapte a vos.",
  },
  {
    icon: Flag,
    title: "Guardá tu planificación",
    text: "Guardá tu meta, seguí tus avances y descargá tu planificación en Excel o PDF. Recordá que los resultados son estimaciones y no modifican tu dinero real.",
  },
];

export function SavingsSimulatorGuide() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  function closeGuide() {
    setOpen(false);
    setStep(0);

    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // The guide remains available if storage is unavailable.
    }
  }

  const current = steps[step] ?? steps[0]!;
  const Icon = current.icon;
  const last = step === steps.length - 1;

  return (
    <div className="grid gap-3">
      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto sm:justify-self-start"
        onClick={() => {
          setStep(0);
          setOpen(true);
        }}
      >
        <BookOpen />
        ¿Cómo funciona?
      </Button>

      {open && (
        <Panel
          title="Guía del simulador"
          action={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={closeGuide}
              aria-label="Cerrar tutorial"
            >
              <X />
            </Button>
          }
        >
          <div className="mx-auto grid max-w-lg gap-4">
            <p className="text-center text-xs text-muted-foreground">
              Paso {step + 1} de {steps.length}
            </p>

            <progress
              className="h-2 w-full accent-primary"
              max={steps.length}
              value={step + 1}
              aria-label="Progreso del tutorial"
            />

            <div className="grid justify-items-center gap-3 rounded-xl bg-muted/60 p-5 text-center">
              <div className="rounded-full bg-primary-soft p-4 text-accent-foreground">
                <Icon className="h-8 w-8" />
              </div>

              <h3 className="text-lg font-bold">
                {current.title}
              </h3>

              <p className="text-sm leading-relaxed text-muted-foreground">
                {current.text}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={step === 0}
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft />
                Anterior
              </Button>

              <Button
                type="button"
                variant="hero"
                onClick={() => {
                  if (last) {
                    closeGuide();
                  } else {
                    setStep(step + 1);
                  }
                }}
              >
                {last ? "Comenzar" : "Siguiente"}
                <ArrowRight />
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={closeGuide}
            >
              Omitir tutorial
            </Button>
          </div>
        </Panel>
      )}
    </div>
  );
}
