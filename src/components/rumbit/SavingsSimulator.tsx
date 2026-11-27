import { FileText } from "lucide-react";
import { exportSavingsPdf } from "@/lib/savings-pdf";
import { FileSpreadsheet } from "lucide-react";
import { exportSavingsExcel } from "@/lib/savings-export";
import { SavingsTracking } from "@/components/rumbit/SavingsTracking";
import { generateSavingsTips } from "@/lib/savings-simulator";
import { SavingsCapacity } from "@/components/rumbit/SavingsCapacity";
import { toast } from "sonner";
import type { Goal } from "@/lib/finance";
import { useEffect, useState } from "react";
import { Calculator, Target, CalendarDays } from "lucide-react";
import { Panel } from "@/components/rumbit/AppShell";
import { SavingsSimulatorGuide } from "@/components/rumbit/SavingsSimulatorGuide";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { actions, useApp, useMoney } from "@/lib/store";
import { localDateKey } from "@/lib/planning";
import {
  calculateSavings,
  calculateEstimatedDate,
  calculatePeriodsUntilDate,
  calculateRequiredContribution,
  FREQUENCY_LABELS,
  type SavingsFrequency,
} from "@/lib/savings-simulator";

export function SavingsSimulator({ goal }: { goal?: Goal | undefined }) {
  const money = useMoney();
  const saving = useApp((s) => s.saving);
  const [simulationSaved, setSimulationSaved] = useState(false);

  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(goal ? String(goal.target) : "");
  const [initial, setInitial] = useState(goal ? String(goal.saved) : "");
  const [contribution, setContribution] = useState(goal?.plan ? String(goal.plan.contribution) : "");
  const [frequency, setFrequency] =
    useState<SavingsFrequency>(goal?.plan?.frequency ?? "monthly");

  const [mode, setMode] =
    useState<"contribution" | "date">("contribution");

  const [startDate, setStartDate] = useState(goal?.plan?.startDate ?? localDateKey());
  const [targetDate, setTargetDate] = useState(goal?.date ?? "");
  useEffect(() => {
    if (!goal) return;

    setInitial(String(goal.saved));
    setSimulationSaved(false);
  }, [goal?.id, goal?.saved]);

  let result: ReturnType<typeof calculateSavings> | null = null;
  let estimatedDate = "";
  let error = "";
  let completed = false;

  const ready =
    target.trim() !== "" &&
    startDate !== "" &&
    (mode === "contribution"
      ? contribution.trim() !== ""
      : targetDate !== "");

  if (ready) {
    try {
      const targetAmount = Number(target);
      const initialAmount = Number(initial || 0);

      if (
        !Number.isFinite(targetAmount) ||
        targetAmount < 0.01 ||
        targetAmount > 1_000_000_000_000 ||
        !Number.isFinite(initialAmount) ||
        initialAmount < 0 ||
        initialAmount > 1_000_000_000_000
      ) {
        throw new Error("Ingresá montos válidos.");
      }

      calculateEstimatedDate(startDate, 0, frequency);

      completed = initialAmount >= targetAmount;

      if (!completed) {
        const periodicContribution =
          mode === "contribution"
            ? Number(contribution)
            : calculateRequiredContribution(
                targetAmount,
                initialAmount,
                calculatePeriodsUntilDate(
                  startDate,
                  targetDate,
                  frequency
                )
              );

        result = calculateSavings({
          target: targetAmount,
          initial: initialAmount,
          contribution: periodicContribution,
          frequency,
        });

        estimatedDate = calculateEstimatedDate(
          startDate,
          result.periods,
          frequency
        );
      }
    } catch (err) {
      result = null;
      completed = false;
      error = err instanceof Error
        ? err.message
        : "No se pudo calcular la planificación.";
    }
  }

    async function saveSimulation() {
    if (!result || saving || simulationSaved) return;

    const goalName = name.trim();

    if (!goalName || goalName.length > 40) {
      toast.error("Ingresá un nombre de hasta 40 caracteres.");
      return;
    }

    if (goal && (result.initial !== goal.saved || result.target !== goal.target)) {
      toast.error("Para cambiar el monto o el ahorro real, editá primero la meta original.");
      return;
    }

    const success = await actions.saveGoal({
      ...(goal ? { id: goal.id } : {}),
      name: goalName,
      target: result.target,
      saved: goal ? goal.saved : result.initial,
      date: estimatedDate,
      plan: {
        contribution: result.contribution,
        frequency,
        startDate,
        initialSaved: result.initial,
      },
    });

    if (!success) return;

    setSimulationSaved(true);

    toast.success(
      goal ? "¡Planificación actualizada!" : "¡Tu nueva meta fue guardada!"
    );
  }
return (
    <div className="grid min-w-0 gap-4">
      <SavingsSimulatorGuide />

      <Panel title="Simulador de ahorro">
        <p className="mb-4 text-sm text-muted-foreground">
          Planificá tus objetivos y descubrí cuánto necesitás ahorrar.
        </p>

        <div className="grid gap-5">

          <section className="grid gap-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <Target className="h-5 w-5 text-primary" />
              1. Definí tu objetivo
            </h3>

            <div className="grid gap-1.5">
              <Label htmlFor="sim-name">Nombre de la meta</Label>
              <Input
                id="sim-name"
                value={name}
                maxLength={80}
                placeholder="Ej: Comprar una computadora"
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="sim-target">¿Cuánto dinero necesitás?</Label>
                <Input
                  id="sim-target"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="sim-initial">
                  ¿Cuánto tenés ahorrado? (Opcional)
                </Label>
                <Input
                  id="sim-initial"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={initial}
                  placeholder="0"
                  onChange={e => setInitial(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-3 border-t pt-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <Calculator className="h-5 w-5 text-primary" />
              2. Elegí cómo planificar
            </h3>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant={mode === "contribution" ? "hero" : "outline"}
                className="h-auto min-h-11 whitespace-normal py-3"
                aria-pressed={mode === "contribution"}
                onClick={() => setMode("contribution")}
              >
                Según cuánto puedo ahorrar
              </Button>

              <Button
                type="button"
                variant={mode === "date" ? "hero" : "outline"}
                className="h-auto min-h-11 whitespace-normal py-3"
                aria-pressed={mode === "date"}
                onClick={() => setMode("date")}
              >
                Según una fecha objetivo
              </Button>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="sim-frequency">
                ¿Cada cuánto vas a ahorrar?
              </Label>

              <select
                id="sim-frequency"
                value={frequency}
                onChange={e =>
                  setFrequency(e.target.value as SavingsFrequency)
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {Object.entries(FREQUENCY_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="sim-start">¿Cuándo empezás a ahorrar?</Label>
              <Input
                id="sim-start"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>

            {mode === "contribution" ? (
              <div className="grid gap-1.5">
                <Label htmlFor="sim-contribution">
                  {frequency === "weekly" ? "¿Cuánto podés ahorrar por semana?" : frequency === "biweekly" ? "¿Cuánto podés ahorrar cada 14 días?" : "¿Cuánto podés ahorrar por mes?"}
                </Label>
                <Input
                  id="sim-contribution"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={contribution}
                  onChange={e => setContribution(e.target.value)}
                />
              </div>
            ) : (
              <div className="grid gap-1.5">
                <Label htmlFor="sim-date">¿Cuándo querés alcanzar tu meta?</Label>
                <Input
                  id="sim-date"
                  type="date"
                  value={targetDate}
                  min={startDate}
                  onChange={e => setTargetDate(e.target.value)}
                />
              </div>
            )}
          </section>

          {goal?.plan && (
            <SavingsTracking
              target={goal.target}
              saved={goal.saved}
              plan={goal.plan}
            />
          )}

          <SavingsCapacity
            {...(goal ? { goalId: goal.id } : {})}
            onApply={(amount) => {
              setMode("contribution");
              setFrequency("monthly");
              setContribution(String(amount));
              setSimulationSaved(false);
            }}
          />

          {error && (
            <p role="alert" className="rounded-xl bg-muted p-3 text-sm text-destructive">
              {error}
            </p>
          )}

          {completed && (
            <div className="rounded-xl bg-success-soft p-4">
              <p className="font-semibold text-success">
                ¡Ya alcanzaste el monto de tu objetivo!
              </p>
            </div>
          )}

          {result && (
            <section className="grid gap-3 border-t pt-4">
              <h3 className="flex items-center gap-2 font-semibold">
                <CalendarDays className="h-5 w-5 text-primary" />
                3. Tu planificación
              </h3>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Objetivo", money(result.target)],
                  ["Dinero que te falta", money(result.remaining)],
                  [frequency === "weekly" ? "Ahorro semanal" : frequency === "biweekly" ? "Ahorro cada 14 días" : "Ahorro mensual", money(result.contribution)],
                  ["Tiempo que necesitás", `${result.estimatedMonths} meses`],
                  ["Veces que necesitás ahorrar", String(result.periods)],
                  ["Cuándo alcanzarías tu meta", estimatedDate.split("-").reverse().join("/")],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="min-w-0 rounded-xl bg-primary-soft p-4"
                  >
                    <p className="text-sm text-muted-foreground">
                      {label}
                    </p>
                    <p className="break-words text-lg font-bold text-accent-foreground">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <p className="text-sm">
                Lo que ya tenés ahorrado: {result.progress}%
              </p>

              <div
  className="h-3 w-full overflow-hidden rounded-full bg-primary-soft"
  role="progressbar"
  aria-label="Progreso de tu meta"
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={result.progress}
>
  <div
    className="h-full rounded-full bg-primary transition-all duration-500"
    style={{ width: `${Math.min(100, Math.max(0, result.progress))}%` }}
  />
</div>

<div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
  <span>{money(result.initial)} ahorrados</span>
  <span>Meta: {money(result.target)}</span>
</div>

<div className="mt-6 rounded-xl border border-border p-3 sm:p-4">
  <div className="mb-4">
    <h3 className="font-semibold">Evolución de tu ahorro</h3>
    <p className="text-sm text-muted-foreground">
      Cómo crecería tu ahorro hasta alcanzar tu objetivo.
    </p>
  </div>

  <div className="h-64 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={[
          {
            periodo: "Inicio",
            ahorro: result.initial,
          },
          ...result.projection
  .filter((point) => point.period > 0)
  .map((point) => ({
    periodo: `${point.period}`,
    ahorro: point.accumulated,
  })),
 ]}
        margin={{ top: 12, right: 12, bottom: 4, left: 4 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          vertical={false}
        />
        <XAxis
          dataKey="periodo" minTickGap={28} interval="preserveStartEnd"
          stroke="var(--muted-foreground)"
          fontSize={11}
          tickLine={false}
        />
        <YAxis
          stroke="var(--muted-foreground)"
          fontSize={11}
          tickFormatter={(value: number) =>
            new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 }).format(value)
          }
          width={58}
        />
        <Tooltip
          formatter={(value) => money(Number(value))}
          labelFormatter={(label) => `Período: ${label}`}
        />
        <ReferenceLine
          y={result.target}
          stroke="var(--chart-2)"
          strokeDasharray="5 5"
          label={{
            value: "Objetivo",
            fill: "var(--muted-foreground)",
            fontSize: 11,
          }}
        />
        <Line
          type="monotone"
          dataKey="ahorro"
          name="Ahorro proyectado"
          stroke="var(--primary)"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>

  <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
    <span className="text-muted-foreground">
      Ahorro actual: {money(result.initial)}
    </span>
    <span className="font-semibold text-accent-foreground">
      Objetivo: {money(result.target)}
    </span>
  </div>
</div>

<div className="mt-6 rounded-xl border border-border p-4">
  <div className="mb-4">
    <h3 className="font-semibold">Compará tus posibilidades de ahorro</h3>
    <p className="mt-1 text-sm text-muted-foreground">
      Descubrí cuánto tardarías si ahorraras más o menos dinero.
    </p>
  </div>

  <div className="grid gap-3 sm:grid-cols-3">
    {[
      { label: "Tranquilo", multiplier: 0.5 },
      { label: "Intermedio", multiplier: 1 },
      { label: "Acelerado", multiplier: 1.5 },
    ].map((scenario) => {

const scenarioContribution =
  Math.round(result.contribution * scenario.multiplier * 100) / 100;

let simulation: ReturnType<typeof calculateSavings> | null = null;
let date = "";

try {
  simulation = calculateSavings({
    target: result.target,
    initial: result.initial,
    contribution: scenarioContribution,
    frequency,
  });

  date = calculateEstimatedDate(
    startDate,
    simulation.periods,
    frequency
  );
} catch {
  simulation = null;
}

return (
  <div
    key={scenario.label}
    className="rounded-xl bg-primary-soft p-3"
  >
    <p className="font-semibold text-accent-foreground">
      {scenario.label}
    </p>

    <p className="mt-2 text-sm text-muted-foreground">
      Aporte por período
    </p>

    <p className="text-lg font-bold">
      {money(scenarioContribution)}
    </p>

    {simulation ? (
      <>
        <p className="mt-3 text-sm text-muted-foreground">
          Tiempo estimado
        </p>
        <p className="font-semibold">
          {simulation.estimatedMonths} meses
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Fecha estimada: {date.split("-").reverse().join("/")}
        </p>
      </>
    ) : (
      <p className="mt-3 text-sm text-muted-foreground">
        El plazo supera los 100 años. Probá aumentando el aporte.
      </p>
    )}
  </div>
);
    })}
  </div>

  <p className="mt-3 text-xs text-muted-foreground">
    Son escenarios hipotéticos. No modifican tu meta ni registran ahorros.
  </p>
</div>



              <div className="mt-6 space-y-3 rounded-xl border border-border bg-primary-soft p-4">
                <h3 className="font-semibold text-primary">
                  Consejos de Rumi
                </h3>
                <p className="text-sm text-muted-foreground">
                  Pequeños pasos para alcanzar tu meta.
                </p>
                {generateSavingsTips(result).map((tip) => (
                  <div
                    key={tip.id}
                    className="rounded-lg bg-background p-3 text-sm"
                  >
                    {tip.message}
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full gap-2"
                onClick={async () => {
                  try {
                    await exportSavingsExcel({
                      name,
                      result,
                      startDate,
                    });
                    toast.success("Excel descargado correctamente.");
                  } catch {
                    toast.error("No se pudo descargar el Excel.");
                  }
                }}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Descargar Excel
              </Button>

              <Button
                type="button"
                variant="outline"
                className="mt-2 w-full gap-2"
                onClick={async () => {
                  try {
                    await exportSavingsPdf({
                      name,
                      result,
                      startDate,
                      money,
                    });
                    toast.success("PDF generado correctamente.");
                  } catch {
                    toast.error("No se pudo descargar el PDF.");
                  }
                }}
              >
                <FileText className="h-4 w-4" />
                Descargar PDF
              </Button>

              <p className="text-xs text-muted-foreground">
                Los resultados son estimaciones. Esta simulación
                no registra movimientos ni transfiere dinero.
              </p>
              <Button
                type="button"
                variant="hero"
                className="mt-2 min-h-11 w-full whitespace-normal"
                onClick={saveSimulation}
                disabled={saving || simulationSaved}
              >
                {saving
                  ? "Guardando..."
                  : simulationSaved
                    ? "Guardado correctamente"
                    : goal
                      ? "Guardar planificación"
                      : "Guardar como meta de ahorro"}
              </Button>



              <p className="text-xs text-muted-foreground">
                {goal
                  ? "Se actualizará la planificación sin modificar tu ahorro registrado."
                  : "Se creará una nueva meta con los datos de esta simulación."}
              </p>
            </section>
          )}
        </div>
      </Panel>
    </div>
  );
}
