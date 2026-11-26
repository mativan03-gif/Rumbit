import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INCOME_CATEGORY, validateTx, type Goal, type Tx, type TxType } from "@/lib/finance";
import { actions, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

import { localDateKey, type ExpenseShortcut } from "@/lib/planning";

const CATEGORY_SUGGESTIONS = ["Mascotas", "Suscripciones", "Regalos"];

export function TxDialog({ open, onOpenChange, tx, defaultType = "expense", shortcut }: { open: boolean; onOpenChange: (o: boolean) => void; tx?: Tx | null; defaultType?: TxType; shortcut?: ExpenseShortcut | null }) {
  const categories = useApp((s) => s.categories);
  const [type, setType] = useState<TxType>(defaultType);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(localDateKey);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    if (!open) return;
    setType(tx?.type ?? defaultType);
    setAmount(tx ? String(tx.amount) : "");
    setDescription(tx?.description ?? shortcut?.description ?? "");
    setCategory(tx?.category ?? shortcut?.category ?? "");
    setDate(tx?.date ?? localDateKey());
    setAddingCategory(false);
    setNewCategory("");
  }, [open, tx, defaultType, shortcut]);

  const cats = [...new Set([
    ...(type === "income" ? [INCOME_CATEGORY] : []),
    ...categories,
    ...(tx?.type === type ? [tx.category] : []),
    ...(type === "expense" && shortcut ? [shortcut.category] : []),
  ])];

  const addCategory = async (value: string) => {
    const name = value.trim();
    if (!name) return;
    if ([INCOME_CATEGORY, ...categories].some((item) => item.trim().toLowerCase() === name.toLowerCase())) {
      toast.error("Esa categoría ya existe.");
      return;
    }
    if (!(await actions.setCategories([...categories, name]))) return;
    setCategory(name);
    setNewCategory("");
    setAddingCategory(false);
    toast.success("Categoría agregada");
  };

  const suggestions = CATEGORY_SUGGESTIONS.filter((name) =>
    !categories.some((item) => item.trim().toLowerCase() === name.toLowerCase()),
  );
  const saving = useApp((s) => s.saving);
  const save = async () => {
    const data = { type, amount: Number(amount), description: description.trim(), category: category || (type === "income" ? INCOME_CATEGORY : ""), date };
    const err = validateTx(data);
    if (err) { toast.error(err); return; }
    if (!(await actions.saveTx({ ...data, id: tx?.id }))) return;
    toast.success(tx ? "Movimiento actualizado" : "Movimiento guardado");
    onOpenChange(false);
  };

  const descField = (
    <div className="grid gap-1.5">
      <Label htmlFor="desc">{type === "expense" ? "Descripción (opcional)" : "Descripción *"}</Label>
      <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Supermercado" maxLength={60} />
    </div>
  );
  const categoryField = (
    <div className="grid gap-1.5">
      <Label>Categoría *</Label>
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="min-h-11 min-w-0" aria-label="Categoría"><SelectValue placeholder="Elegí" /></SelectTrigger>
        <SelectContent>{cats.map((c) => <SelectItem className="min-h-11 sm:min-h-0" key={c} value={c}>{c}</SelectItem>)}</SelectContent>
      </Select>
      {type === "expense" && (
        addingCategory ? (
          <div className="grid min-w-0 gap-2 rounded-xl bg-muted/50 p-3">
            <Input aria-label="Nombre de la nueva categoría"
              placeholder="Ej. Mascotas" value={newCategory} maxLength={24}
              onChange={(event) => setNewCategory(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter" && !saving) void addCategory(newCategory); }} />
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="soft" className="min-h-11" disabled={saving || !newCategory.trim()}
                onClick={() => void addCategory(newCategory)}>Agregar</Button>
              <Button type="button" variant="ghost" className="min-h-11" disabled={saving}
                onClick={() => setAddingCategory(false)}>Cancelar</Button>
            </div>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-full text-sm text-muted-foreground">Sugerencias</span>
                {suggestions.map((name) => (
                  <Button key={name} type="button" size="sm" variant="outline" className="min-h-11 sm:min-h-9" disabled={saving}
                    onClick={() => void addCategory(name)}>{name}</Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Button type="button" variant="link" className="min-h-11 justify-self-start px-0"
            onClick={() => setAddingCategory(true)}>Crear categoría</Button>
        )
      )}
    </div>
  );
  const dateField = (
    <div className="grid gap-1.5">
      <Label htmlFor="date">Fecha *</Label>
      <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 overscroll-contain p-4 sm:gap-6 sm:p-6">
        <DialogHeader className="py-2 pe-10 text-left sm:py-0">
          <DialogTitle>{tx ? "Editar movimiento" : "Nuevo movimiento"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            {(["income", "expense"] as const).map((t) => (
              <Button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  if (t === "expense" && category === INCOME_CATEGORY) setCategory("");
                }}
                variant="ghost"
                aria-pressed={type === t}
                className={cn("rounded-input text-sm font-medium", type === t ? "bg-card text-primary shadow-card hover:bg-card" : "text-muted-foreground")}
              >
                {t === "income" ? "Ingreso" : "Gasto"}
              </Button>
            ))}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="amount">Monto *</Label>
            <Input id="amount" type="number" min="0" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          </div>
          {type === "expense" ? (
            <>
              {categoryField}
              {dateField}
              {descField}
            </>
          ) : (
            <>
              {descField}
              <div className="grid gap-4 sm:grid-cols-2">
                {categoryField}
                {dateField}
              </div>
            </>
          )}
        </div>
        <DialogFooter className="gap-2 [&>button]:min-h-11">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="hero" onClick={save} disabled={saving}>Guardar movimiento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function GoalDialog({ open, onOpenChange, goal }: { open: boolean; onOpenChange: (o: boolean) => void; goal?: Goal | null }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [date, setDate] = useState("");
  const [saved, setSaved] = useState("");
  useEffect(() => {
    if (!open) return;
    setName(goal?.name ?? "");
    setTarget(goal ? String(goal.target) : "");
    setDate(goal?.date ?? "");
    setSaved(goal ? String(goal.saved) : "0");
  }, [open, goal]);

  const saving = useApp((s) => s.saving);
  const save = async () => {
    if (!name.trim()) { toast.error("Poné un nombre a tu meta."); return; }
    if (!(Number(target) > 0)) { toast.error("El monto objetivo debe ser mayor a cero."); return; }
    if (Number(saved) < 0) { toast.error("El monto inicial no puede ser negativo."); return; }
    if (!date) { toast.error("Elegí una fecha estimada."); return; }
    if (!(await actions.saveGoal({ id: goal?.id, name: name.trim(), target: Number(target), saved: Number(saved) || 0, date }))) return;
    toast.success(goal ? "Meta actualizada" : "¡Meta creada! Rumbi te acompaña.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle>{goal ? "Editar meta" : "Crear meta"}</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5"><Label htmlFor="gname">Nombre de la meta</Label><Input id="gname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Notebook nueva" maxLength={40} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label htmlFor="gtarget">Monto objetivo</Label><Input id="gtarget" type="number" min="0" value={target} onChange={(e) => setTarget(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="gsaved">Monto inicial ahorrado</Label><Input id="gsaved" type="number" min="0" value={saved} onChange={(e) => setSaved(e.target.value)} /></div>
          </div>
          <div className="grid gap-1.5"><Label htmlFor="gdate">Fecha estimada</Label><Input id="gdate" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="hero" onClick={save} disabled={saving}>{goal ? "Guardar cambios" : "Crear meta"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProgressDialog({ goal, onOpenChange }: { goal: Goal | null; onOpenChange: (o: boolean) => void }) {
  const [amount, setAmount] = useState("");
  useEffect(() => setAmount(""), [goal]);
  const saving = useApp((s) => s.saving);
  const save = async () => {
    if (!goal) return;
    if (!(Number(amount) > 0)) { toast.error("El monto debe ser mayor a cero."); return; }
    if (!(await actions.addProgress(goal.id, Number(amount)))) return;
    toast.success("¡Avance registrado! Seguí así.");
    onOpenChange(false);
  };
  return (
    <Dialog open={!!goal} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle>Registrar avance · {goal?.name}</DialogTitle></DialogHeader>
        <div className="grid gap-1.5"><Label htmlFor="pamount">¿Cuánto ahorraste?</Label><Input id="pamount" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus /></div>
        <p className="text-xs text-muted-foreground">Es un seguimiento manual: RUMBIT no guarda ni transfiere dinero.</p>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="hero" onClick={save} disabled={saving}>Registrar avance</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
