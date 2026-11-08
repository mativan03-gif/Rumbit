import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, Panel } from "@/components/rumbit/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { actions, useApp } from "@/lib/store";

export const Route = createFileRoute("/configuracion")({
  head: () => ({
    meta: [
      { title: "Configuración · RUMBIT" },
      { name: "description", content: "Ajustá tu nombre, moneda, categorías y privacidad." },
      { property: "og:title", content: "Configuración · RUMBIT" },
      { property: "og:description", content: "Preferencias de tu cuenta RUMBIT." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const navigate = useNavigate();
  const userName = useApp((s) => s.userName);
  const currency = useApp((s) => s.currency);
  const categories = useApp((s) => s.categories);
  const session = useApp((s) => s.session);
  const [name, setName] = useState(userName);
  const [newCat, setNewCat] = useState("");
  useEffect(() => setName(userName), [userName]);

  const addCat = () => {
    const c = newCat.trim();
    if (!c) { toast.error("Escribí un nombre de categoría."); return; }
    if (categories.some((x) => x.toLowerCase() === c.toLowerCase())) { toast.error("Esa categoría ya existe."); return; }
    actions.setCategories([...categories, c]);
    setNewCat("");
    toast.success("Categoría agregada");
  };

  return (
    <AppShell title="Configuración">
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Perfil">
          <Label htmlFor="uname">Nombre de usuario</Label>
          <div className="mt-1.5 flex gap-2">
            <Input id="uname" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
            <Button variant="hero" onClick={() => { if (!name.trim()) { toast.error("El nombre no puede estar vacío."); return; } actions.setName(name.trim()); toast.success("Nombre actualizado"); }}>Guardar</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{session?.guest ? "Sesión de invitado" : session?.email}</p>
          <Label className="mt-5 block">Moneda</Label>
          <Select value={currency} onValueChange={(v) => { actions.setCurrency(v); toast.success(`Moneda cambiada a ${v}`); }}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ARS">Peso argentino (ARS)</SelectItem>
              <SelectItem value="USD">Dólar (USD)</SelectItem>
              <SelectItem value="EUR">Euro (EUR)</SelectItem>
            </SelectContent>
          </Select>
        </Panel>

        <Panel title="Categorías de gastos">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-sm text-accent-foreground">
                {c}
                <button aria-label={`Quitar ${c}`} onClick={() => { if (categories.length <= 1) { toast.error("Necesitás al menos una categoría."); return; } actions.setCategories(categories.filter((x) => x !== c)); toast.success("Categoría eliminada"); }}><X className="h-3.5 w-3.5" /></button>
              </span>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Input placeholder="Nueva categoría" value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCat()} maxLength={24} />
            <Button variant="soft" onClick={addCat}>Agregar</Button>
          </div>
        </Panel>

        <Panel>
          <div className="flex gap-4">
            <div className="h-fit rounded-xl bg-success-soft p-2.5 text-success"><ShieldCheck className="h-6 w-6" /></div>
            <div>
              <h2 className="font-semibold">Tu dinero, tu control</h2>
              <p className="mt-1 text-sm text-muted-foreground">RUMBIT organiza la información que registrás. No necesita acceder a tus cuentas bancarias ni realizar operaciones financieras.</p>
            </div>
          </div>
        </Panel>

        <Panel title="Sesión">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => { actions.resetDemo(); toast.success("Datos demostrativos restaurados"); }}>Restaurar datos demo</Button>
            <Button variant="destructive" onClick={() => { actions.logout(); toast.success("Sesión cerrada"); navigate({ to: "/" }); }}><LogOut />Cerrar sesión</Button>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
