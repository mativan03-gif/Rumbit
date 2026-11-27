import { describe, expect, it } from "vitest";
import {
  calculateSavings,
  calculateRequiredContribution,
} from "./savings-simulator";

describe("Savings simulator", () => {
  const base = {
    target: 500000,
    initial: 150000,
    contribution: 50000,
    frequency: "monthly" as const,
  };

  it("calculates the remaining amount", () => {
    expect(calculateSavings(base).remaining).toBe(350000);
  });

  it("calculates the required periods", () => {
    expect(calculateSavings(base).periods).toBe(7);
  });

  it("calculates initial progress", () => {
    expect(calculateSavings(base).progress).toBe(30);
  });

  it("generates the complete projection", () => {
    const result = calculateSavings(base);
    expect(result.projection).toHaveLength(8);
    expect(result.projection[7]?.accumulated).toBe(500000);
  });

  it("adjusts the final contribution", () => {
    const result = calculateSavings({
      ...base,
      contribution: 100000,
    });
    expect(result.projection[4]?.contribution).toBe(50000);
  });

  it("recognizes completed goals", () => {
    const result = calculateSavings({
      ...base,
      initial: 500000,
    });
    expect(result.completed).toBe(true);
    expect(result.periods).toBe(0);
  });

  it("rejects zero contributions", () => {
    expect(() =>
      calculateSavings({ ...base, contribution: 0 })
    ).toThrow();
  });

  it("rejects negative amounts", () => {
    expect(() =>
      calculateSavings({ ...base, target: -100 })
    ).toThrow();
  });

  it("rejects non-finite amounts", () => {
    expect(() =>
      calculateSavings({ ...base, target: Infinity })
    ).toThrow();
  });

  it("calculates the required contribution", () => {
    expect(
      calculateRequiredContribution(500000, 150000, 7)
    ).toBe(50000);
  });

  it("rounds the required contribution upward", () => {
    expect(
      calculateRequiredContribution(100, 0, 3)
    ).toBe(33.34);
  });
});

import {
  calculateEstimatedDate,
  calculatePeriodsUntilDate,
} from "./savings-simulator";

describe("Savings dates", () => {
  it("calculates weekly dates", () => {
    expect(
      calculateEstimatedDate("2026-11-26", 4, "weekly")
    ).toBe("2026-12-24");
  });

  it("calculates biweekly dates", () => {
    expect(
      calculateEstimatedDate("2026-11-26", 2, "biweekly")
    ).toBe("2026-12-24");
  });

  it("calculates monthly dates", () => {
    expect(
      calculateEstimatedDate("2026-11-26", 10, "monthly")
    ).toBe("2027-09-26");
  });

  it("handles short months", () => {
    expect(
      calculateEstimatedDate("2027-01-31", 1, "monthly")
    ).toBe("2027-02-28");
  });

  it("handles leap years", () => {
    expect(
      calculateEstimatedDate("2028-01-31", 1, "monthly")
    ).toBe("2028-02-29");
  });

  it("handles completed goals", () => {
    expect(
      calculateEstimatedDate("2026-11-26", 0, "monthly")
    ).toBe("2026-11-26");
  });

  it("calculates periods until a target date", () => {
    expect(
      calculatePeriodsUntilDate(
        "2026-11-26", "2027-09-26", "monthly"
      )
    ).toBe(10);
  });

  it("rejects past target dates", () => {
    expect(() =>
      calculatePeriodsUntilDate(
        "2026-11-26", "2026-10-26", "monthly"
      )
    ).toThrow();
  });

  it("rejects invalid calendar dates", () => {
    expect(() =>
      calculateEstimatedDate("2027-02-30", 1, "monthly")
    ).toThrow();
  });

  it("rejects insufficient saving periods", () => {
    expect(() =>
      calculatePeriodsUntilDate(
        "2026-11-26", "2026-11-28", "monthly"
      )
    ).toThrow();
  });

  it("counts only complete contribution periods", () => {
    expect(
      calculatePeriodsUntilDate(
        "2026-11-26", "2027-02-15", "monthly"
      )
    ).toBe(2);
  });
});

import { calculateSavingsScenarios } from "./savings-simulator";

describe("Savings scenarios", () => {
  const base = {
    target: 1200000,
    initial: 200000,
    contribution: 100000,
    frequency: "monthly" as const,
  };

  it("generates three scenarios", () => {
    expect(calculateSavingsScenarios(base)).toHaveLength(3);
  });

  it("calculates the conservative scenario", () => {
    const result = calculateSavingsScenarios(base)[0];
    expect(result?.contribution).toBe(80000);
    expect(result?.result?.periods).toBe(13);
  });

  it("calculates the moderate scenario", () => {
    const result = calculateSavingsScenarios(base)[1];
    expect(result?.contribution).toBe(100000);
    expect(result?.result?.periods).toBe(10);
  });

  it("calculates the accelerated scenario", () => {
    const result = calculateSavingsScenarios(base)[2];
    expect(result?.contribution).toBe(120000);
    expect(result?.result?.periods).toBe(9);
  });

  it("does not modify the original simulation", () => {
    const input = { ...base };
    calculateSavingsScenarios(input);
    expect(input).toEqual(base);
  });

  it("handles completed goals", () => {
    const results = calculateSavingsScenarios({
      ...base,
      initial: 1200000,
    });

    expect(
      results.every((s) => s.result?.completed === true)
    ).toBe(true);
  });

  it("handles scenarios exceeding the maximum duration", () => {
    const results = calculateSavingsScenarios({
      ...base,
      target: 1200,
      initial: 0,
      contribution: 1,
    });

    expect(results[0]?.result).toBeNull();
    expect(results[0]?.error).not.toBeNull();
    expect(results[1]?.result?.periods).toBe(1200);
    expect(results[2]?.result?.periods).toBe(1000);
  });

  it("rejects invalid contributions", () => {
    expect(() =>
      calculateSavingsScenarios({
        ...base,
        contribution: 0,
      })
    ).toThrow();
  });
});

import { calculateInflation } from "./savings-simulator";

describe("Savings inflation", () => {
  const base = {
    target: 1000000,
    monthlyRate: 3,
    months: 6,
  };

  it("calculates the future target", () => {
    expect(calculateInflation(base).futureTarget)
      .toBe(1194052.3);
  });

  it("calculates additional savings", () => {
    expect(calculateInflation(base).additionalSavings)
      .toBe(194052.3);
  });

  it("calculates accumulated inflation", () => {
    expect(calculateInflation(base).accumulatedInflation)
      .toBe(19.41);
  });

  it("handles zero inflation", () => {
    const result = calculateInflation({
      ...base,
      monthlyRate: 0,
    });

    expect(result.futureTarget).toBe(1000000);
    expect(result.additionalSavings).toBe(0);
  });

  it("handles zero months", () => {
    expect(
      calculateInflation({ ...base, months: 0 }).futureTarget
    ).toBe(1000000);
  });

  it("generates the monthly projection", () => {
    const result = calculateInflation(base);

    expect(result.projection).toHaveLength(7);
    expect(result.projection[0]?.estimatedPrice).toBe(1000000);
    expect(result.projection[6]?.estimatedPrice).toBe(1194052.3);
  });

  it("rejects negative inflation", () => {
    expect(() =>
      calculateInflation({ ...base, monthlyRate: -5 })
    ).toThrow();
  });

  it("rejects excessive inflation", () => {
    expect(() =>
      calculateInflation({ ...base, monthlyRate: 101 })
    ).toThrow();
  });

  it("rejects invalid durations", () => {
    expect(() =>
      calculateInflation({ ...base, months: 121 })
    ).toThrow();
  });

  it("rejects excessive projected amounts", () => {
    expect(() =>
      calculateInflation({
        target: 1000000000000,
        monthlyRate: 100,
        months: 12,
      })
    ).toThrow();
  });
});

import { calculateSavingsCapacity } from "./savings-simulator";

describe("Savings capacity", () => {
  const base = {
    averageIncome: 900000,
    averageExpenses: 650000,
    committedSavings: 50000,
  };

  it("calculates monthly balance", () => {
    expect(calculateSavingsCapacity(base).balance)
      .toBe(250000);
  });

  it("subtracts existing savings commitments", () => {
    expect(calculateSavingsCapacity(base).available)
      .toBe(200000);
  });

  it("applies the default safety reserve", () => {
    expect(calculateSavingsCapacity(base).reserve)
      .toBe(40000);
  });

  it("calculates the suggested contribution", () => {
    expect(calculateSavingsCapacity(base).suggestedContribution)
      .toBe(160000);
  });

  it("calculates the savings rate", () => {
    expect(calculateSavingsCapacity(base).savingsRate)
      .toBe(17.78);
  });

  it("handles financial deficits", () => {
    const result = calculateSavingsCapacity({
      ...base,
      averageExpenses: 1000000,
    });

    expect(result.hasDeficit).toBe(true);
    expect(result.suggestedContribution).toBe(0);
  });

  it("handles excessive commitments", () => {
    const result = calculateSavingsCapacity({
      ...base,
      committedSavings: 300000,
    });

    expect(result.hasOvercommitment).toBe(true);
    expect(result.suggestedContribution).toBe(0);
  });

  it("handles zero income", () => {
    const result = calculateSavingsCapacity({
      averageIncome: 0,
      averageExpenses: 0,
      committedSavings: 0,
    });

    expect(result.suggestedContribution).toBe(0);
    expect(result.savingsRate).toBe(0);
  });

  it("allows a custom safety reserve", () => {
    expect(
      calculateSavingsCapacity({
        ...base,
        reservePercent: 30,
      }).suggestedContribution
    ).toBe(140000);
  });

  it("rejects invalid reserve percentages", () => {
    expect(() =>
      calculateSavingsCapacity({
        ...base,
        reservePercent: 110,
      })
    ).toThrow();
  });

  it("rejects negative financial amounts", () => {
    expect(() =>
      calculateSavingsCapacity({
        ...base,
        averageIncome: -1000,
      })
    ).toThrow();
  });

  it("rejects non-finite financial amounts", () => {
    expect(() =>
      calculateSavingsCapacity({
        ...base,
        averageIncome: Infinity,
      })
    ).toThrow();
  });
});

import { generateSavingsTips } from "./savings-simulator";

describe("Savings tips", () => {
  const base = {
    target: 1000000,
    initial: 200000,
    contribution: 100000,
    frequency: "monthly" as const,
  };

  it("celebrates completed goals", () => {
    const simulation = calculateSavings({
      ...base,
      initial: 1000000,
    });

    expect(generateSavingsTips(simulation)[0]?.id)
      .toBe("completed");
  });

  it("warns about financial deficits", () => {
    const capacity = calculateSavingsCapacity({
      averageIncome: 500000,
      averageExpenses: 600000,
      committedSavings: 0,
    });

    const tips = generateSavingsTips(
      calculateSavings(base),
      capacity
    );

    expect(tips.some(t => t.id === "deficit")).toBe(true);
  });

  it("warns about excessive contributions", () => {
    const capacity = calculateSavingsCapacity({
      averageIncome: 500000,
      averageExpenses: 450000,
      committedSavings: 0,
    });

    const tips = generateSavingsTips(
      calculateSavings(base),
      capacity
    );

    expect(tips.some(t => t.id === "high-contribution"))
      .toBe(true);
  });

  it("recognizes sustainable contributions", () => {
    const capacity = calculateSavingsCapacity({
      averageIncome: 900000,
      averageExpenses: 600000,
      committedSavings: 0,
    });

    const tips = generateSavingsTips(
      calculateSavings(base),
      capacity
    );

    expect(tips.some(t => t.id === "sustainable"))
      .toBe(true);
  });

  it("recognizes halfway progress", () => {
    const simulation = calculateSavings({
      ...base,
      initial: 500000,
    });

    expect(
      generateSavingsTips(simulation)
        .some(t => t.id === "halfway")
    ).toBe(true);
  });

  it("recognizes goals near completion", () => {
    const simulation = calculateSavings({
      ...base,
      initial: 800000,
    });

    expect(
      generateSavingsTips(simulation)
        .some(t => t.id === "almost-complete")
    ).toBe(true);
  });

  it("provides inflation warnings", () => {
    const inflation = calculateInflation({
      target: 1000000,
      monthlyRate: 3,
      months: 8,
    });

    const tips = generateSavingsTips(
      calculateSavings(base),
      undefined,
      inflation
    );

    expect(tips.some(t => t.id === "inflation"))
      .toBe(true);
  });

  it("recognizes long-term goals", () => {
    const simulation = calculateSavings({
      ...base,
      contribution: 20000,
    });

    expect(
      generateSavingsTips(simulation)
        .some(t => t.id === "long-term")
    ).toBe(true);
  });

  it("provides a default motivational tip", () => {
    const tips = generateSavingsTips(
      calculateSavings(base)
    );

    expect(tips[0]?.id).toBe("keep-going");
  });

  it("converts weekly contributions to monthly amounts", () => {
    const capacity = calculateSavingsCapacity({
      averageIncome: 500000,
      averageExpenses: 250000,
      committedSavings: 0,
    });

    const simulation = calculateSavings({
      ...base,
      contribution: 60000,
      frequency: "weekly",
    });

    expect(
      generateSavingsTips(simulation, capacity)
        .some(t => t.id === "high-contribution")
    ).toBe(true);
  });
});
