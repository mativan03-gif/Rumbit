import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Panel } from "@/components/rumbit/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney, inMonth } from "@/lib/finance";
import { localDateKey } from "@/lib/planning";
import { actions, useApp } from "@/lib/store";

function readAmount(form: FormData) {
  const amount = Number(form.get("amount"));
  return Number.isFinite(amount) && amount >= 1 ? amount : null;
}

export function Budgets() {
  const budgets = useApp((s) => s.budgets);
  const categories = useApp((s) => s.categories);
  const currency = useApp((s) => s.currency);
  const saving = useApp((s) => s.saving);
  const txs = useApp((s) => s.txs);
  const current = inMonth(txs, new Date());
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const activeCategory = categories.includes(category) ? category : "";

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const limit = readAmount(new FormData(event.currentTarget));
    if (!limit || !activeCategory) return;
    if (!(await actions.saveBudget({ category: activeCategory, limit, currency }))) return;
    setAmount("");
    toast.success("Presupuesto guardado");
  }

  return (
    <Panel title="Presupuestos mensuales">
      <form onSubmit={save} className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="budget-category">Categoría</Label>
          <select
            id="budget-category"
            required
            value={activeCategory}
            onChange={(event) => {
              const selected = event.target.value;
              setCategory(selected);
              const budget = budgets.find(
                (item) => item.currency === currency && item.category === selected,
              );
              setAmount(budget ? String(budget.limit) : "");
            }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Elegí una categoría</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="budget-limit">Límite mensual ({currency})</Label>
          <Input
            id="budget-limit"
            name="amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            type="number"
            min="1"
            step="1"
            required
          />
        </div>
        <Button type="submit" disabled={saving} className="justify-self-start">
          Guardar presupuesto
        </Button>
      </form>
      <ul className="mt-4 space-y-4">
        {budgets.map((budget) => {
          const matchesCurrency = budget.currency === currency;
          const spent = current.reduce(
            (sum, tx) =>
              tx.type === "expense" && tx.category === budget.category ? sum + tx.amount : sum,
            0,
          );
          const remaining = budget.limit - spent;
          const money = (value: number) => formatMoney(value, budget.currency);
          return (
            <li
              key={JSON.stringify([budget.currency, budget.category])}
              className="rounded-xl border border-border p-3"
            >
              <p className="font-semibold">
                {budget.category} · {budget.currency}
              </p>
              {matchesCurrency ? (
                <>
                  <p className="text-sm">
                    Registraste {money(spent)} de {money(budget.limit)}.{" "}
                    {remaining >= 0 ? "Quedan" : "Excedido por"} {money(Math.abs(remaining))}.
                  </p>
                  <progress
                    className="mt-2 w-full accent-primary"
                    max={budget.limit}
                    value={Math.min(spent, budget.limit)}
                    aria-label={`Uso del presupuesto de ${budget.category}`}
                  />
                </>
              ) : (
                <p className="text-sm">
                  Límite de {money(budget.limit)}. Elegí {budget.currency} en Configuración para ver
                  el avance.
                </p>
              )}
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Quitar presupuesto de ${budget.category} en ${budget.currency}`}
                disabled={saving}
                onClick={() => void actions.deleteBudget(budget)}
              >
                Quitar
              </Button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

export function Payments() {
  const payments = useApp((s) => s.payments);
  const currency = useApp((s) => s.currency);
  const saving = useApp((s) => s.saving);
  const today = localDateKey();
  const ordered = [...payments].sort(
    (a, b) => Number(a.paid) - Number(b.paid) || a.due.localeCompare(b.due),
  );

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const name = String(values.get("name") ?? "").trim();
    const amount = readAmount(values);
    const due = String(values.get("due") ?? "");
    if (!name || !amount || !due) {
      toast.error("Completá el nombre, el importe y la fecha del pago.");
      return;
    }
    if (!(await actions.addPayment({ name, amount, due, currency }))) return;
    form.reset();
    toast.success("Pago planificado");
  }

  return (
    <Panel title="Próximos pagos">
      <p className="mb-3 text-sm text-muted-foreground">
        Marcá lo que ya pagaste. Para incluirlo en tus gastos, registralo en Movimientos.
      </p>
      <form onSubmit={save} className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="payment-name">Nombre del pago</Label>
          <Input id="payment-name" name="name" placeholder="Ej: Internet" maxLength={60} required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="payment-amount">Importe ({currency})</Label>
          <Input id="payment-amount" name="amount" type="number" min="1" step="1" required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="payment-due">Vencimiento</Label>
          <Input id="payment-due" name="due" type="date" required />
        </div>
        <Button type="submit" disabled={saving} className="justify-self-start">
          Agregar pago
        </Button>
      </form>
      <ul className="mt-4 space-y-3">
        {ordered.map((payment) => (
          <li key={payment.id} className="rounded-xl border border-border p-3">
            <p className="font-semibold">{payment.name}</p>
            <p className="text-sm">
              {formatMoney(payment.amount, payment.currency)} ·{" "}
              {payment.due.split("-").reverse().join("/")} ·{" "}
              {payment.paid ? "Pagado" : payment.due < today ? "Vencido" : "Pendiente"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => void actions.togglePayment(payment.id)}
              >
                {payment.paid ? "Volver a pendiente" : "Marcar como pagado"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Quitar pago ${payment.name}`}
                disabled={saving}
                onClick={() => void actions.deletePayment(payment.id)}
              >
                Quitar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
