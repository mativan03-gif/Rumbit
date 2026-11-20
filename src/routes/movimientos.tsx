import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Camera, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell, Panel } from "@/components/rumbit/AppShell";
import { TxDialog } from "@/components/rumbit/Dialogs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, INCOME_CATEGORY, txTitle, type Tx, type TxType } from "@/lib/finance";
import { actions, useApp, useMoney } from "@/lib/store";

type MovementFilters = {
  type?: TxType | undefined;
  category?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
};

function readDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

export const Route = createFileRoute("/movimientos")({
  validateSearch: (search: Record<string, unknown>): MovementFilters => ({
    type: search["type"] === "expense" || search["type"] === "income" ? search["type"] : undefined,
    category: typeof search["category"] === "string" && search["category"] ? search["category"] : undefined,
    from: readDate(search["from"]),
    to: readDate(search["to"]),
  }),
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
  const [editing, setEditing] = useState<Tx | null>(null);
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState<Tx | null>(null);
  const { type, category: cat, from, to } = Route.useSearch();
  const navigate = Route.useNavigate();
  const categoryOptions = [...new Set([INCOME_CATEGORY, ...categories, ...(cat ? [cat] : [])])];

  const updateFilters = (patch: MovementFilters) => {
    void navigate({ search: (current) => ({ ...current, ...patch }), replace: true });
  };

  const list = useMemo(
    () =>
      txs
        .filter(
          (t) =>
            (!type || t.type === type) &&
            (!cat || t.category === cat) &&
            txTitle(t).toLowerCase().includes(q.toLowerCase()) &&
            (!from || t.date >= from) &&
            (!to || t.date <= to),
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [txs, q, type, cat, from, to],
  );

  return (
    <AppShell
      title="Mis movimientos"
      actions={
        <Button variant="hero" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus />Nuevo movimiento
        </Button>
      }
    >
      <Panel className="mb-5">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-1">
            <Search className="absolute left-4 top-4 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Buscar movimientos"
              placeholder="Buscar movimiento"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={cat ? `category:${cat}` : "all"}
            onValueChange={(value) =>
              updateFilters({ category: value === "all" ? undefined : value.slice("category:".length) })
            }
          >
            <SelectTrigger aria-label="Filtrar categoría"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category} value={`category:${category}`}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={from ?? ""}
            onChange={(e) => updateFilters({ from: e.target.value || undefined })}
            aria-label="Desde"
          />
          <Input
            type="date"
            value={to ?? ""}
            onChange={(e) => updateFilters({ to: e.target.value || undefined })}
            aria-label="Hasta"
          />
        </div>
        {(q || type || cat || from || to) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {type && (
              <span className="rounded-input bg-muted px-3 py-1 text-sm">
                Tipo: {type === "expense" ? "Gasto" : "Ingreso"}
              </span>
            )}
            {cat && <span className="rounded-input bg-muted px-3 py-1 text-sm">Categoría: {cat}</span>}
            {(from || to) && (
              <span className="rounded-input bg-muted px-3 py-1 text-sm">
                Fechas: {from ? formatDate(from) : "inicio"} – {to ? formatDate(to) : "hoy"}
              </span>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                setQ("");
                void navigate({ search: {}, replace: true });
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        )}
      </Panel>

      <Panel title={`Historial (${list.length})`}>
        <ul className="divide-y divide-border">
          {list.map((t) => (
            <li key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-4 sm:flex">
              <div className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-input sm:flex ${t.type === "income" ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>
                {t.type === "income" ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{txTitle(t)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.type === "income" ? "Ingreso" : "Gasto"} · {t.category} · {formatDate(t.date)}
                </p>
              </div>
              <span className={`finance-number text-sm font-semibold ${t.type === "income" ? "text-success" : ""}`}>
                {t.type === "income" ? "+" : "−"}{money(t.amount)}
              </span>
              <div className="col-span-2 flex justify-end sm:col-auto">
                <Button
                  size="icon"
                  variant="ghost"
                  title="Editar movimiento"
                  aria-label="Editar"
                  onClick={() => { setEditing(t); setOpen(true); }}
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  title="Eliminar movimiento"
                  aria-label="Eliminar"
                  onClick={() => setDel(t)}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            </li>
          ))}
          {!list.length && (
            <li className="py-10 text-center text-sm text-muted-foreground">
              No hay movimientos con esos filtros.
            </li>
          )}
        </ul>
      </Panel>

      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        <Camera className="h-5 w-5" /> Próximamente: cargá la foto de tu ticket para registrar gastos más rápido.
      </div>

      <TxDialog open={open} onOpenChange={setOpen} tx={editing} />
      <AlertDialog open={!!del} onOpenChange={(isOpen) => !isOpen && setDel(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar movimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar "{del ? txTitle(del) : ""}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (del && await actions.deleteTx(del.id)) toast.success("Movimiento eliminado"); }}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
