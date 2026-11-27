import {
  calculateSavings,
  calculateEstimatedDate,
  FREQUENCY_LABELS,
} from "@/lib/savings-simulator";

export async function exportSavingsExcel({
  name,
  result,
  startDate,
}: {
  name: string;
  result: ReturnType<typeof calculateSavings>;
  startDate: string;
}) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Rumbit";
  workbook.created = new Date();

  const summary = workbook.addWorksheet("Resumen");
  const projection = workbook.addWorksheet("Plan de ahorro");
  const scenarios = workbook.addWorksheet("Escenarios");

  const moneyFormat = '#,##0.00';

  function styleHeader(row: import("exceljs").Row) {
    row.height = 28;
    row.eachCell((cell) => {
      cell.font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF7941D5" },
      };

      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
    });
  }

  summary.columns = [
    { header: "Concepto", width: 36 },
    { header: "Resultado", width: 32 },
  ];

  summary.addRows([
    ["Meta", name.trim() || "Mi meta de ahorro"],
    ["Objetivo", result.target],
    ["Ahorro actual", result.initial],
    ["Dinero restante", {
      formula: "MAX(0,B3-B4)",
      result: result.remaining,
    }],
    ["Aporte por periodo", result.contribution],
    ["Frecuencia", FREQUENCY_LABELS[result.frequency]],
    ["Cantidad de aportes", result.periods],
    ["Meses estimados", result.estimatedMonths],
    ["Fecha de inicio", startDate],
    ["Fecha estimada", calculateEstimatedDate(
      startDate,
      result.periods,
      result.frequency
    )],
    ["Progreso actual", {
      formula: "MIN(1,B4/B3)",
      result: Math.min(1, result.initial / result.target),
    }],
    ["Nota", "Los resultados son estimaciones."],
  ]);

  for (const row of [3, 4, 5, 6]) {
    summary.getCell(`B${row}`).numFmt = moneyFormat;
  }

  summary.getCell("B12").numFmt = "0.0%";
  styleHeader(summary.getRow(1));

  projection.columns = [
    { header: "Periodo", width: 15 },
    { header: "Fecha", width: 18 },
    { header: "Aporte previsto", width: 22 },
    { header: "Ahorro acumulado", width: 24 },
    { header: "Dinero restante", width: 22 },
    { header: "Progreso", width: 16 },
  ];

  for (const point of result.projection) {
    const rowNumber = projection.rowCount + 1;

    projection.addRow([
      point.period,
      calculateEstimatedDate(
        startDate,
        point.period,
        result.frequency
      ),
      point.period === 0
        ? 0
        : {
            formula: `MIN(Resumen!$B$6,MAX(0,Resumen!$B$3-D${rowNumber - 1}))`,
            result: point.contribution,
          },
      point.period === 0
        ? {
            formula: "Resumen!B4",
            result: result.initial,
          }
        : {
            formula: `D${rowNumber - 1}+C${rowNumber}`,
            result: point.accumulated,
          },
      {
        formula: `MAX(0,Resumen!$B$3-D${rowNumber})`,
        result: Math.max(0, result.target - point.accumulated),
      },
      {
        formula: `MIN(1,D${rowNumber}/Resumen!$B$3)`,
        result: Math.min(1, point.accumulated / result.target),
      },
    ]);
  }

  for (const column of [3, 4, 5]) {
    projection.getColumn(column).numFmt = moneyFormat;
  }

  projection.getColumn(6).numFmt = "0.0%";
  projection.views = [{ state: "frozen", ySplit: 1 }];
  styleHeader(projection.getRow(1));

  scenarios.columns = [
    { header: "Escenario", width: 22 },
    { header: "Aporte", width: 22 },
    { header: "Cantidad de aportes", width: 24 },
    { header: "Meses estimados", width: 22 },
    { header: "Fecha estimada", width: 22 },
  ];

  for (const scenario of [
    { name: "Tranquilo", factor: 0.5 },
    { name: "Intermedio", factor: 1 },
    { name: "Acelerado", factor: 1.5 },
  ]) {
    const contribution =
      Math.round(result.contribution * scenario.factor * 100) / 100;

    try {
      const simulation = calculateSavings({
        target: result.target,
        initial: result.initial,
        contribution,
        frequency: result.frequency,
      });

      scenarios.addRow([
        scenario.name,
        contribution,
        simulation.periods,
        simulation.estimatedMonths,
        calculateEstimatedDate(
          startDate,
          simulation.periods,
          result.frequency
        ),
      ]);
    } catch {
      scenarios.addRow([
        scenario.name,
        contribution,
        "No disponible",
        "-",
        "-",
      ]);
    }
  }

  scenarios.getColumn(2).numFmt = moneyFormat;
  styleHeader(scenarios.getRow(1));

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob(
    [new Uint8Array(buffer)],
    {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const safeName = (name.trim() || "Meta")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 40);

  link.href = url;
  link.download = `Rumbit_${safeName}.xlsx`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
