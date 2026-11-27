import {
  calculateSavings,
  calculateEstimatedDate,
  generateSavingsTips,
  FREQUENCY_LABELS,
} from "@/lib/savings-simulator";

export async function exportSavingsPdf({
  name,
  result,
  startDate,
  money,
}: {
  name: string;
  result: ReturnType<typeof calculateSavings>;
  startDate: string;
  money: (amount: number) => string;
}) {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const purple = "#7941D5";
  const dark = "#252033";
  const muted = "#6B6475";
  const light = "#F3EEFC";

  const goalName = name.trim() || "Mi meta de ahorro";

  const progress = Math.min(
    100,
    result.initial / result.target * 100
  );

  const estimatedDate = calculateEstimatedDate(
    startDate,
    result.periods,
    result.frequency
  );

  const formatDate = (date: string) =>
    date.split("-").reverse().join("/");

  // Encabezado
  doc.setFillColor(purple);
  doc.rect(0, 0, 210, 35, "F");

  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(25);
  doc.text("RUMBIT", 15, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Informe de planificación de ahorro", 15, 25);

  // Nombre de la meta
  doc.setTextColor(dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  const titleLines = doc.splitTextToSize(goalName, 180);
  doc.text(titleLines, 15, 46);

  let y = 48 + titleLines.length * 7;

  function metric(
    label: string,
    value: string,
    x: number,
    top: number
  ) {
    doc.setFillColor(light);
    doc.roundedRect(x, top, 87, 21, 3, 3, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(muted);
    doc.text(label, x + 4, top + 7);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(dark);
    doc.text(value, x + 4, top + 15, {
      maxWidth: 79,
    });
  }

  metric("Objetivo", money(result.target), 15, y);
  metric("Ahorro actual", money(result.initial), 108, y);

  y += 25;

  metric("Dinero restante", money(result.remaining), 15, y);
  metric("Aporte previsto", money(result.contribution), 108, y);

  y += 29;

  // Progreso
  doc.setFontSize(11);
  doc.setTextColor(dark);
  doc.text(`Progreso actual: ${progress.toFixed(1)}%`, 15, y);

  doc.setFillColor("#E5E1EA");
  doc.roundedRect(15, y + 4, 180, 5, 2, 2, "F");

  if (progress > 0) {
    doc.setFillColor(purple);
    doc.rect(15, y + 4, 180 * progress / 100, 5, "F");
  }

  y += 17;

  const details = [
    `Frecuencia: ${FREQUENCY_LABELS[result.frequency]}`,
    `Cantidad de aportes: ${result.periods}`,
    `Tiempo estimado: ${result.estimatedMonths} meses`,
    `Fecha estimada: ${formatDate(estimatedDate)}`,
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  for (const detail of details) {
    doc.text(detail, 15, y);
    y += 6;
  }

  y += 4;

  // Grafico de ahorro
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Evolución proyectada del ahorro", 15, y);

  y += 7;

  const chartX = 15;
  const chartY = y;
  const chartWidth = 180;
  const chartHeight = 35;

  doc.setDrawColor("#E5E1EA");

  for (let i = 0; i <= 4; i++) {
    const lineY = chartY + chartHeight * i / 4;

    doc.line(
      chartX,
      lineY,
      chartX + chartWidth,
      lineY
    );
  }

  const points = result.projection.map((point) => ({
    x: chartX + chartWidth *
      point.period / Math.max(1, result.periods),
    y: chartY + chartHeight *
      (1 - Math.min(1, point.accumulated / result.target)),
  }));

  doc.setDrawColor(purple);
  doc.setLineWidth(0.8);

  for (let i = 1; i < points.length; i++) {
    const previous = points[i - 1];
    const current = points[i];

    if (previous && current) {
      doc.line(
        previous.x,
        previous.y,
        current.x,
        current.y
      );
    }
  }

  y += chartHeight + 5;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(muted);
  doc.text("Inicio", 15, y);
  doc.text("Meta", 195, y, { align: "right" });

  // Segunda pagina
  doc.addPage();

  doc.setTextColor(purple);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("Comparación de escenarios", 15, 20);

  y = 30;

  for (const scenario of [
    { name: "Tranquilo", factor: 0.5 },
    { name: "Intermedio", factor: 1 },
    { name: "Acelerado", factor: 1.5 },
  ]) {
    const contribution =
      Math.round(result.contribution * scenario.factor * 100) / 100;

    doc.setFillColor(light);
    doc.roundedRect(15, y, 180, 30, 3, 3, "F");

    doc.setTextColor(dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(scenario.name, 20, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Aporte: ${money(contribution)}`, 20, y + 16);

    try {
      const simulation = calculateSavings({
        target: result.target,
        initial: result.initial,
        contribution,
        frequency: result.frequency,
      });

      const date = calculateEstimatedDate(
        startDate,
        simulation.periods,
        result.frequency
      );

      doc.text(
        `Plazo: ${simulation.estimatedMonths} meses`,
        20,
        y + 23
      );

      doc.text(
        `Fecha: ${formatDate(date)}`,
        190,
        y + 23,
        { align: "right" }
      );
    } catch {
      doc.text("Plazo no disponible.", 20, y + 23);
    }

    y += 35;
  }

  y += 8;

  doc.setTextColor(purple);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Consejos de Rumi", 15, y);

  y += 10;

  doc.setTextColor(dark);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  for (const tip of generateSavingsTips(result)) {
    const lines = doc.splitTextToSize(tip.message, 175);

    if (y + lines.length * 5 > 265) {
      doc.addPage();
      y = 20;
    }

    doc.text(lines, 15, y);
    y += lines.length * 5 + 6;
  }

  // Pie de pagina
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(muted);

    doc.text(
      "Rumbit - Los resultados son estimaciones orientativas.",
      15,
      283
    );

    doc.text(
      `${page}/${pageCount}`,
      195,
      283,
      { align: "right" }
    );
  }

  const safeName = goalName
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 40);

  doc.save(`Rumbit_${safeName}.pdf`);
}
