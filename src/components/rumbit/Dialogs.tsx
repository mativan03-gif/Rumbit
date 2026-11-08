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

const today = () => new Date().toISOString().slice(0, 10);

export function TxDialog({ open, onOpenChange, tx, defaultType = "expense" }: { open: boolean; onOpenChange: (o: boolean) => void; tx?: Tx | null; defaultType?: TxType }) {
  const categories = useApp((s) => s.categories);
  const [type, setType] = useState<TxType>(defaultType);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(today());

  useEffect(() => {
    if (!open) return;
    setType(tx?.type ?? defaultType);
    setAmount(tx ? String(tx.amount) : "");
    setDescription(tx?.description ?? "");
    setCategory(tx?.category ?? "");
    setDate(tx?.date ?? today());
  }, [open, tx, defaultType]);

  const cats = type === "income" ? [INCOME_CATEGORY, ...categories] : categories;

  const save = () => {
    const data = { type, amount: Number(amount), description, category: category || (type === "income" ? INCOME_CATEGORY : ""), date };
    const err = validateTx(data);
    if (err) { toast.error(err); return; }
    actions.saveTx({ ...data, id: tx?.id });
    toast.success(tx ? "Movimiento actualizado" : "Movimiento guardado");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{tx ? "Editar movimiento" : "Nuevo movimiento"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            {(["income", "expense"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn("rounded-lg py-2 text-sm font-medium transition-all", type === t ? (t === "income" ? "bg-success text-primary-foreground" : "bg-primary text-primary-foreground") : "text-muted-foreground")}
              >
                {t === "income" ? "Ingreso" : "Gasto"}
              </button>
            ))}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="amount">Monto *</Label>
            <Input id="amount" type="number" min="0" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="desc">Descripción *</Label>
            <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Supermercado" maxLength={60} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Categoría *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Elegí" /></SelectTrigger>
                <SelectContent>{cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="date">Fecha *</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="hero" onClick={save}>Guardar movimiento</Button>
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

  const save = () => {
    if (!name.trim()) { toast.error("Poné un nombre a tu meta."); return; }
    if (!(Number(target) > 0)) { toast.error("El monto objetivo debe ser mayor a cero."); return; }
    if (Number(saved) < 0) { toast.error("El monto inicial no puede ser negativo."); return; }
    if (!date) { toast.error("Elegí una fecha estimada."); return; }
    actions.saveGoal({ id: goal?.id, name: name.trim(), target: Number(target), saved: Number(saved) || 0, date });
    toast.success(goal ? "Meta actualizada" : "¡Meta creada! Rumbi te acompaña.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle>{goal ? "Editar meta" : "Crear meta"}</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5"><Label htmlFor="gname">Nombre de la meta</Label><Input id="gname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Notebook nueva" maxLength={40} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label htmlFor="gtarget">Monto objetivo</Label><Input id="gtarget" type="number" min="0" value={target} onChange={(e) => setTarget(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="gsaved">Monto inicial ahorrado</Label><Input id="gsaved" type="number" min="0" value={saved} onChange={(e) => setSaved(e.target.value)} /></div>
          </div>
          <div className="grid gap-1.5"><Label htmlFor="gdate">Fecha estimada</Label><Input id="gdate" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="hero" onClick={save}>{goal ? "Guardar cambios" : "Crear meta"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProgressDialog({ goal, onOpenChange }: { goal: Goal | null; onOpenChange: (o: boolean) => void }) {
  const [amount, setAmount] = useState("");
  useEffect(() => setAmount(""), [goal]);
  const save = () => {
    if (!goal) return;
    if (!(Number(amount) > 0)) { toast.error("El monto debe ser mayor a cero."); return; }
    actions.addProgress(goal.id, Number(amount));
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
          <Button variant="hero" onClick={save}>Registrar avance</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
