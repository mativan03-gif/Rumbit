import { useMoney } from "@/lib/store";
import {
  calculateEstimatedDate,
  type SavingsFrequency,
} from "@/lib/savings-simulator";

export function SavingsTracking({
  target,
  saved,
  plan,
}: {
  target: number;
  saved: number;
  plan: {
    contribution: number;
    frequency: SavingsFrequency;
    startDate: string;
    initialSaved: number;
  };
}) {
  const money = useMoney();
  const now = new Date();

  const today = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;

  let periods = 0;

  try {
    while (
      periods < 1200 &&
      calculateEstimatedDate(
        plan.startDate,
        periods + 1,
        plan.frequency
      ) <= today
    ) {
      periods++;
    }
  } catch {
    return null;
  }

  const expected = Math.min(
    target,
    plan.initialSaved + periods * plan.contribution
  );

  const difference = Math.round(
    (saved - expected) * 100
  ) / 100;

  const expectedProgress = Math.min(
    100,
    Math.max(0, expected / target * 100)
  );

  const actualProgress = Math.min(
    100,
    Math.max(0, saved / target * 100)
  );

  const status =
    saved >= target
      ? "Meta alcanzada"
      : difference > 0
        ? "Adelantado"
        : difference < 0
          ? "Atrasado"
          : "Al día";

  const message =
    saved >= target
      ? "¡Felicitaciones! Alcanzaste tu objetivo."
      : difference > 0
        ? "Vas mejor de lo previsto. ¡Seguí así!"
        : difference < 0
          ? "Cada aporte cuenta. Podés ajustar tu plan si lo necesitas."
          : "Estás siguiendo tu plan de ahorro. Mantené la constancia.";

  return (
    <div className="mt-6 space-y-4 rounded-xl border border-border p-4">
      <div>
        <h3 className="font-semibold">
          ¿Cómo va tu planificación?
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Compará tu ahorro real con tu plan original.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between gap-2 text-sm">
          <span>Ahorro esperado hasta hoy</span>
          <strong>{money(expected)}</strong>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary/60"
            style={{ width: `${expectedProgress}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between gap-2 text-sm">
          <span>Ahorro real acumulado</span>
          <strong>{money(saved)}</strong>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${actualProgress}%` }}
          />
        </div>
      </div>

      <div className="rounded-xl bg-primary-soft p-4">
        <p className="text-sm text-muted-foreground">
          Diferencia respecto al plan
        </p>

        <p className="text-xl font-bold">
          {difference > 0 ? "+" : ""}
          {money(difference)}
        </p>

        <p className="mt-2 font-semibold text-primary">
          {status}
        </p>
      </div>

      <div className="rounded-xl bg-muted p-3">
        <p className="font-semibold">Consejo de Rumi</p>
        <p className="mt-1 text-sm">{message}</p>
      </div>

      <p className="text-xs text-muted-foreground">
        La comparación utiliza tu plan guardado y tu ahorro
        acumulado. No representa un historial individual de aportes.
      </p>
    </div>
  );
}
