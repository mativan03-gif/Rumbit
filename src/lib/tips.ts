import { byCategory, goalProgress, inMonth, totals, type Goal, type Tx } from "./finance";

export type Tip = { title: string; text: string; tone: "info" | "warning" | "success" };

export function buildTips(txs: Tx[], goals: Goal[], money: (n: number) => string, now = new Date()): Tip[] {
  const cur = inMonth(txs, now);
  const prev = inMonth(txs, new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const tips: Tip[] = [];
  if (cur.filter((t) => t.type === "expense").length < 2) {
    return [
      { title: "Registrá todo", text: "Anotá cada gasto, por chico que sea. Así vas a ver tus hábitos reales.", tone: "info" },
      { title: "Regla 50/30/20", text: "Probá destinar 50% a necesidades, 30% a gustos y 20% al ahorro.", tone: "info" },
      { title: "Ahorrá primero", text: "Apenas cobres, separá una parte para tu meta antes de gastar.", tone: "success" },
    ];
  }
  const cats = byCategory(cur);
  const prevCats = new Map(byCategory(prev).map((c) => [c.name, c.value]));
  if (cats[0]) tips.push({ title: `Mayor gasto: ${cats[0].name}`, text: `Tus gastos de ${cats[0].name.toLowerCase()} representan el ${cats[0].pct}% de tus gastos del mes.`, tone: "warning" });
  for (const c of cats) {
    const p = prevCats.get(c.name) ?? 0;
    if (p > 0 && c.value > p) {
      tips.push({ title: "Comparado con el mes pasado", text: `Este mes gastaste más en ${c.name.toLowerCase()} que el mes anterior (${money(c.value)} vs ${money(p)}).`, tone: "warning" });
      break;
    }
  }
  const t = totals(cur);
  const tp = totals(prev);
  if (tp.expenses > 0) {
    const diff = Math.round(((t.expenses - tp.expenses) / tp.expenses) * 100);
    tips.push(diff <= 0
      ? { title: "¡Buen trabajo!", text: `Llevás ${Math.abs(diff)}% menos de gastos que el mes pasado.`, tone: "success" }
      : { title: "Ojo con el ritmo", text: `Tus gastos subieron ${diff}% respecto del mes pasado.`, tone: "warning" });
  }
  const g = goals.find((x) => goalProgress(x).pct < 100);
  if (g && cats[0]) {
    const cut = Math.round(cats[0].value * 0.15);
    tips.push({ title: `Acercate a "${g.name}"`, text: `Si reducís un 15% tus gastos de ${cats[0].name.toLowerCase()}, podrías sumar ${money(cut)} por mes a tu meta.`, tone: "success" });
  }
  if (t.available > 0) tips.push({ title: "Saldo", text: `Te quedan ${money(t.available)} estimados. Considerá apartar el 20% (${money(Math.round(t.available * 0.2))}).`, tone: "info" });
  return tips;
}

export function rumbiMessage(goals: Goal[]) {
  const g = goals[0];
  if (!g) return "¡Creá tu primera meta y empecemos a ahorrar juntos!";
  const { pct } = goalProgress(g);
  if (pct >= 100) return `¡Lo lograste! Completaste "${g.name}". 🎉`;
  if (pct >= 70) return `¡Ya casi! Te falta poco para "${g.name}".`;
  if (pct >= 30) return `Vas muy bien: llevás ${pct}% de "${g.name}".`;
  return `Cada peso cuenta. Empezá sumando un poco a "${g.name}".`;
}
