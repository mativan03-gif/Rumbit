import { createFileRoute } from "@tanstack/react-router";
import { Camera, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell, Panel } from "@/components/rumbit/AppShell";
import { TxDialog } from "@/components/rumbit/Dialogs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, INCOME_CATEGORY, type Tx } from "@/lib/finance";
import { actions, useApp, useMoney } from "@/lib/store";

export const Route = createFileRoute("/movimientos")({
  head: () => ({
    meta: [
      { title: "Mis movimientos · RUMBIT" },
      { name: "description", content: "Registrá, buscá y filtrá tus ingresos y gastos." },
      { property: "og:title", content: "Mis movimientos · RUMBIT" },
      { property: "og:description", content: "Historial de ingresos y gastos en RUMBIT." },
    ],
  }),
  component: Movements,
});

function Movements() {
  const txs = useApp((s) => s.txs);
  const categories = useApp((s) => s.categories);
  const money = useMoney();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [editing, setEditing] = useState<Tx | null>(null);
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState<Tx | null>(null);

  const list = useMemo(
    () =>
      [...txs]
        .filter((t) => (cat === "all" || t.category === cat) && t.description.toLowerCase().includes(q.toLowerCase()) && (!from || t.date >= from) && (!to || t.date <= to))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [txs, q, cat, from, to],
  );

  return (
    <AppShell title="Mis movimientos" actions={<Button variant="hero" onClick={() => { setEditing(null); setOpen(true); }}><Plus />Nuevo movimiento</Button>}>
      <Panel className="mb-5">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {[INCOME_CATEGORY, ...categories].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Desde" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Hasta" />
        </div>
      </Panel>

      <Panel title={`Historial (${list.length})`}>
        <ul className="divide-y divide-border">
          {list.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-3">
              <div className={`h-10 w-1.5 rounded-full ${t.type === "income" ? "bg-success" : "bg-secondary"}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{t.description}</p>
                <p className="text-xs text-muted-foreground">{t.category} · {formatDate(t.date)}</p>
              </div>
              <span className={`font-semibold ${t.type === "income" ? "text-success" : ""}`}>{t.type === "income" ? "+" : "−"}{money(t.amount)}</span>
              <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => { setEditing(t); setOpen(true); }}><Pencil /></Button>
              <Button size="icon" variant="ghost" aria-label="Eliminar" onClick={() => setDel(t)}><Trash2 className="text-destructive" /></Button>
            </li>
          ))}
          {!list.length && <li className="py-10 text-center text-sm text-muted-foreground">No hay movimientos con esos filtros.</li>}
        </ul>
      </Panel>

      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        <Camera className="h-5 w-5" /> Próximamente: cargá la foto de tu ticket para registrar gastos más rápido.
      </div>

      <TxDialog open={open} onOpenChange={setOpen} tx={editing} />
      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar movimiento?</AlertDialogTitle>
            <AlertDialogDescription>Vas a eliminar "{del?.description}". Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (del) actions.deleteTx(del.id); toast.success("Movimiento eliminado"); }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
