
export type SavingsFrequency = "weekly" | "biweekly" | "monthly";

export type SavingsInput = {
  target: number;
  initial: number;
  contribution: number;
  frequency: SavingsFrequency;
};

export type SavingsProjection = {
  period: number;
  contribution: number;
  accumulated: number;
  progress: number;
};

export const FREQUENCY_LABELS: Record<SavingsFrequency, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
};

const MAX_AMOUNT = 1_000_000_000_000;
const MAX_PERIODS = 1200;

function validateAmount(value: number, label: string, allowZero = false) {
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    (!allowZero && value === 0) ||
    value > MAX_AMOUNT
  ) {
    throw new Error(`${label}: ingresá un monto válido.`);
  }
}

function validateFrequency(frequency: SavingsFrequency) {
  if (!Object.prototype.hasOwnProperty.call(FREQUENCY_LABELS, frequency)) {
    throw new Error("Elegí una frecuencia válida.");
  }
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateSavings(input: SavingsInput) {
  validateAmount(input.target, "Monto objetivo");
  validateAmount(input.initial, "Ahorro inicial", true);
  validateAmount(input.contribution, "Aporte periódico");
  validateFrequency(input.frequency);

  const target = roundMoney(input.target);
  const initial = roundMoney(input.initial);
  const contribution = roundMoney(input.contribution);

  if (target <= 0 || contribution <= 0) {
    throw new Error("El monto mínimo es 0,01.");
  }

  const remaining = roundMoney(Math.max(0, target - initial));

  const periods = Math.ceil(
    Math.round(remaining * 100) /
    Math.round(contribution * 100)
  );

  if (periods > MAX_PERIODS) {
    throw new Error("El plazo es demasiado largo. Aumentá el aporte.");
  }

  const months =
    input.frequency === "weekly"
      ? (periods * 7) / 30.4375
      : input.frequency === "biweekly"
        ? (periods * 14) / 30.4375
        : periods;

  const progress = Math.min(100, (initial / target) * 100);

  const projection: SavingsProjection[] = [
    {
      period: 0,
      contribution: 0,
      accumulated: initial,
      progress: roundMoney(progress),
    },
  ];

  let accumulated = initial;

  for (let period = 1; period <= periods; period++) {
    const payment = roundMoney(
      Math.min(contribution, Math.max(0, target - accumulated))
    );

    accumulated = roundMoney(accumulated + payment);

    projection.push({
      period,
      contribution: payment,
      accumulated,
      progress: roundMoney(
        Math.min(100, (accumulated / target) * 100)
      ),
    });
  }

  return {
    target,
    initial,
    contribution,
    frequency: input.frequency,
    remaining,
    periods,
    estimatedMonths: roundMoney(months),
    progress: roundMoney(progress),
    completed: remaining === 0,
    projection,
  };
}

export function calculateRequiredContribution(
  target: number,
  initial: number,
  periods: number
) {
  validateAmount(target, "Monto objetivo");
  validateAmount(initial, "Ahorro inicial", true);

  if (
    !Number.isInteger(periods) ||
    periods <= 0 ||
    periods > MAX_PERIODS
  ) {
    throw new Error("Ingresá una cantidad válida de períodos.");
  }

  const remaining = Math.max(
    0,
    Math.round(target * 100) - Math.round(initial * 100)
  );

  return Math.ceil(remaining / periods) / 100;
}

function parseSavingsDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Ingresá una fecha válida.");
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error("Ingresá una fecha válida.");
  }

  return date;
}

function savingsDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function calculateEstimatedDate(
  startDate: string,
  periods: number,
  frequency: SavingsFrequency
): string {
  const start = parseSavingsDate(startDate);
  validateFrequency(frequency);

  if (
    !Number.isInteger(periods) ||
    periods < 0 ||
    periods > MAX_PERIODS
  ) {
    throw new Error("Cantidad de períodos inválida.");
  }

  const result = new Date(start);

  if (frequency === "weekly") {
    result.setDate(start.getDate() + periods * 7);
  } else if (frequency === "biweekly") {
    result.setDate(start.getDate() + periods * 14);
  } else {
    const originalDay = start.getDate();

    result.setDate(1);
    result.setMonth(start.getMonth() + periods);

    const lastDay = new Date(
      result.getFullYear(),
      result.getMonth() + 1,
      0
    ).getDate();

    result.setDate(Math.min(originalDay, lastDay));
  }

  return savingsDateString(result);
}

export function calculatePeriodsUntilDate(
  startDate: string,
  targetDate: string,
  frequency: SavingsFrequency
): number {
  const start = parseSavingsDate(startDate);
  const target = parseSavingsDate(targetDate);

  validateFrequency(frequency);

  if (target <= start) {
    throw new Error("La fecha objetivo debe ser posterior al inicio.");
  }

  let periods = 0;

  for (let i = 1; i <= MAX_PERIODS + 1; i++) {
    if (i > MAX_PERIODS) {
      throw new Error("El plazo supera el máximo permitido.");
    }

    const next = calculateEstimatedDate(
      startDate,
      i,
      frequency
    );

    if (next > targetDate) break;

    periods = i;

    if (next === targetDate) break;
  }

  if (periods === 0) {
    throw new Error(
      "El plazo es demasiado corto para la frecuencia elegida."
    );
  }

  return periods;
}

export type SavingsScenario = {
  id: "conservative" | "moderate" | "accelerated";
  name: string;
  factor: number;
  contribution: number;
  result: ReturnType<typeof calculateSavings> | null;
  error: string | null;
};

export function calculateSavingsScenarios(
  input: SavingsInput
): SavingsScenario[] {
  calculateSavings(input);

  const scenarios = [
    {
      id: "conservative",
      name: "Conservador",
      factor: 0.8,
    },
    {
      id: "moderate",
      name: "Moderado",
      factor: 1,
    },
    {
      id: "accelerated",
      name: "Acelerado",
      factor: 1.2,
    },
  ] as const;

  return scenarios.map((scenario) => {
    const contribution = roundMoney(
      input.contribution * scenario.factor
    );

    try {
      const result = calculateSavings({
        ...input,
        contribution,
      });

      return {
        ...scenario,
        contribution,
        result,
        error: null,
      };
    } catch (error) {
      return {
        ...scenario,
        contribution,
        result: null,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo calcular este escenario.",
      };
    }
  });
}

export type InflationInput = {
  target: number;
  monthlyRate: number;
  months: number;
};

export function calculateInflation(input: InflationInput) {
  validateAmount(input.target, "Monto objetivo");

  if (
    !Number.isFinite(input.monthlyRate) ||
    input.monthlyRate < 0 ||
    input.monthlyRate > 100
  ) {
    throw new Error(
      "Ingresá una inflación mensual entre 0 y 100%."
    );
  }

  if (
    !Number.isInteger(input.months) ||
    input.months < 0 ||
    input.months > 120
  ) {
    throw new Error(
      "Ingresá un plazo válido de hasta 120 meses."
    );
  }

  const target = roundMoney(input.target);

  if (target <= 0) {
    throw new Error("El monto mínimo es 0,01.");
  }

  const rate = input.monthlyRate / 100;
  const factor = Math.pow(1 + rate, input.months);
  const futureTarget = roundMoney(target * factor);

  if (
    !Number.isFinite(futureTarget) ||
    futureTarget > MAX_AMOUNT
  ) {
    throw new Error(
      "La proyección supera el monto máximo permitido."
    );
  }

  const projection = Array.from(
    { length: input.months + 1 },
    (_, month) => ({
      month,
      estimatedPrice: roundMoney(
        target * Math.pow(1 + rate, month)
      ),
    })
  );

  return {
    target,
    monthlyRate: input.monthlyRate,
    months: input.months,
    futureTarget,
    additionalSavings: roundMoney(futureTarget - target),
    accumulatedInflation: roundMoney((factor - 1) * 100),
    projection,
  };
}

export type SavingsCapacityInput = {
  averageIncome: number;
  averageExpenses: number;
  committedSavings: number;
  reservePercent?: number;
};

export function calculateSavingsCapacity(
  input: SavingsCapacityInput
) {
  validateAmount(input.averageIncome, "Ingresos", true);
  validateAmount(input.averageExpenses, "Gastos", true);
  validateAmount(input.committedSavings, "Otras metas", true);

  const reservePercent = input.reservePercent ?? 20;

  if (
    !Number.isFinite(reservePercent) ||
    reservePercent < 0 ||
    reservePercent > 100
  ) {
    throw new Error("Ingresá un margen de seguridad válido.");
  }

  const balance = roundMoney(
    input.averageIncome - input.averageExpenses
  );

  const available = roundMoney(
    Math.max(0, balance - input.committedSavings)
  );

  const reserve = roundMoney(
    available * reservePercent / 100
  );

  const suggestedContribution = roundMoney(
    Math.max(0, available - reserve)
  );

  const savingsRate = input.averageIncome > 0
    ? roundMoney(
        suggestedContribution / input.averageIncome * 100
      )
    : 0;

  return {
    averageIncome: input.averageIncome,
    averageExpenses: input.averageExpenses,
    committedSavings: input.committedSavings,
    balance,
    available,
    reservePercent,
    reserve,
    suggestedContribution,
    savingsRate,
    hasDeficit: balance < 0,
    hasOvercommitment: input.committedSavings > Math.max(0, balance),
  };
}

export type SavingsTip = {
  id: string;
  type: "success" | "warning" | "info";
  message: string;
};

export function generateSavingsTips(
  simulation: ReturnType<typeof calculateSavings>,
  capacity?: ReturnType<typeof calculateSavingsCapacity>,
  inflation?: ReturnType<typeof calculateInflation>
): SavingsTip[] {
  const tips: SavingsTip[] = [];

  if (simulation.completed) {
    return [{
      id: "completed",
      type: "success",
      message: "¡Felicitaciones! Alcanzaste tu objetivo de ahorro.",
    }];
  }

  if (capacity) {
    const monthlyContribution =
      simulation.frequency === "weekly"
        ? simulation.contribution * 52 / 12
        : simulation.frequency === "biweekly"
          ? simulation.contribution * 26 / 12
          : simulation.contribution;

    if (capacity.hasDeficit) {
      tips.push({
        id: "deficit",
        type: "warning",
        message: "Priorizá equilibrar tus ingresos y gastos antes de aumentar tus aportes.",
      });
    } else if (
      monthlyContribution > capacity.suggestedContribution
    ) {
      tips.push({
        id: "high-contribution",
        type: "warning",
        message: "Tu aporte supera la capacidad de ahorro estimada. Considerá reducirlo o ampliar el plazo.",
      });
    } else {
      tips.push({
        id: "sustainable",
        type: "success",
        message: "Tu aporte está dentro de tu capacidad de ahorro estimada. ¡Mantené la constancia!",
      });
    }
  }

  if (simulation.progress >= 75) {
    tips.push({
      id: "almost-complete",
      type: "success",
      message: "¡Estás muy cerca de alcanzar tu objetivo!",
    });
  } else if (simulation.progress >= 50) {
    tips.push({
      id: "halfway",
      type: "success",
      message: "¡Ya superaste o alcanzaste la mitad de tu objetivo!",
    });
  }

  if (inflation && inflation.additionalSavings > 0) {
    tips.push({
      id: "inflation",
      type: "info",
      message: "El precio de tu objetivo podría aumentar. Revisá su valor periódicamente y ajustá tu planificación.",
    });
  }

  if (simulation.estimatedMonths > 12) {
    tips.push({
      id: "long-term",
      type: "info",
      message: "Tu meta es de largo plazo. Podés dividirla en pequeños objetivos para mantener la motivación.",
    });
  }

  if (tips.length === 0) {
    tips.push({
      id: "keep-going",
      type: "info",
      message: "Cada pequeño aporte cuenta. ¡Lo importante es mantener la constancia!",
    });
  }

  return tips;
}
