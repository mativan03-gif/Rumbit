import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, Panel } from "@/components/rumbit/AppShell";
import { GoalDialog, ProgressDialog } from "@/components/rumbit/Dialogs";
import { RumbiTip } from "@/components/rumbit/Rumbi";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDate, goalProgress, type Goal } from "@/lib/finance";
import { actions, useApp, useMoney } from "@/lib/store";
import { rumbiMessage } from "@/lib/tips";

export const Route = createFileRoute("/metas")({
  head: () => ({
    meta: [
      { title: "Mis metas de ahorro · RUMBIT" },
      { name: "description", content: "Creá metas de ahorro y seguí tu progreso." },
      { property: "og:title", content: "Metas de ahorro · RUMBIT" },
      { property: "og:description", content: "Seguí el progreso de tus objetivos de ahorro." },
    ],
  }),
  component: Goals,
});

function Goals() {
  const goals = useApp((s) => s.goals);
  const money = useMoney();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [adding, setAdding] = useState<Goal | null>(null);
  const [del, setDel] = useState<Goal | null>(null);

  return (
    <AppShell title="Mis metas de ahorro" actions={<Button variant="hero" onClick={() => { setEditing(null); setOpen(true); }}><Plus />Crear meta</Button>}>
      <div className="mb-5"><RumbiTip title="Rumbi dice" message={rumbiMessage(goals)} /></div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {goals.map((g) => {
          const { pct, remaining } = goalProgress(g);
          return (
            <Panel key={g.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold">{g.name}</h3>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3 w-3" />{g.date ? formatDate(g.date) + " " + g.date.slice(0, 4) : "Sin fecha"}</p>
                </div>
                <div className="flex shrink-0">
                  <Button size="icon" variant="ghost" title="Editar meta" aria-label="Editar meta" onClick={() => { setEditing(g); setOpen(true); }}><Pencil /></Button>
                  <Button size="icon" variant="ghost" title="Eliminar meta" aria-label="Eliminar meta" onClick={() => setDel(g)}><Trash2 className="text-destructive" /></Button>
                </div>
              </div>
              <p className="mt-6 text-4xl font-semibold tabular-nums text-accent-foreground">{pct}%</p>
              <Progress value={pct} className="mt-2 h-3" />
              <div className="mt-4 flex justify-between text-sm tabular-nums">
                <span>{money(g.saved)} <span className="text-muted-foreground">de {money(g.target)}</span></span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{remaining ? `Te faltan ${money(remaining)}` : "¡Meta cumplida! 🎉"}</p>
              <Button variant="soft" className="mt-4 w-full" onClick={() => setAdding(g)}>Registrar avance</Button>
            </Panel>
          );
        })}
        {!goals.length && <Panel><p className="text-sm text-muted-foreground">Todavía no tenés metas. ¡Creá la primera!</p></Panel>}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">El progreso es un seguimiento manual del ahorro. No se guarda ni transfiere dinero dentro de RUMBIT.</p>

      <GoalDialog open={open} onOpenChange={setOpen} goal={editing} />
      <ProgressDialog goal={adding} onOpenChange={(o) => !o && setAdding(null)} />
      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar la meta "{del?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>Se perderá el seguimiento registrado.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (del) actions.deleteGoal(del.id); toast.success("Meta eliminada"); }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
