import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Panel } from "@/components/rumbit/AppShell";
import { TxDialog } from "@/components/rumbit/Dialogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ExpenseShortcut } from "@/lib/planning";
import { actions, useApp } from "@/lib/store";

export function ExpenseShortcuts() {
  const shortcuts = useApp((s) => s.shortcuts);
  const saving = useApp((s) => s.saving);
  const categories = useApp((s) => s.categories);
  const [selected, setSelected] = useState<ExpenseShortcut | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const category = String(values.get("category") ?? "");
    const description = String(values.get("description") ?? "").trim();
    if (!description || !categories.includes(category)) {
      toast.error("Completá la descripción y elegí una categoría.");
      return;
    }
    if (!(await actions.addShortcut({ category, description }))) return;
    form.reset();
  }

  return (
    <Panel title="Gastos frecuentes" className="mb-5">
      <ul className="flex flex-wrap gap-2">
        {shortcuts.map((shortcut) => (
          <li
            key={JSON.stringify([shortcut.category, shortcut.description])}
            className="flex items-center gap-1"
          >
            <Button variant="outline" onClick={() => setSelected(shortcut)}>
              {shortcut.description} · {shortcut.category}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Quitar acceso ${shortcut.description} de ${shortcut.category}`}
              disabled={saving}
              onClick={() => void actions.deleteShortcut(shortcut)}
            >
              ×
            </Button>
          </li>
        ))}
      </ul>
      <details className={shortcuts.length ? "mt-3" : ""}>
        <summary className="cursor-pointer text-sm font-medium">Crear acceso rápido</summary>
        <form onSubmit={save} className="mt-3 grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div className="grid gap-1.5">
            <Label htmlFor="shortcut-description">Descripción del gasto</Label>
            <Input
              id="shortcut-description"
              name="description"
              placeholder="Ej: SUBE"
              maxLength={60}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="shortcut-category">Categoría del gasto</Label>
            <select
              id="shortcut-category"
              name="category"
              required
              defaultValue=""
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Elegí una categoría</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={saving}>
            Guardar acceso
          </Button>
        </form>
      </details>
      {selected && (
        <TxDialog open shortcut={selected} onOpenChange={(open) => !open && setSelected(null)} />
      )}
    </Panel>
  );
}
