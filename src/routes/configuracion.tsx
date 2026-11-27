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
  const saving = useApp((s) => s.saving);
  const session = useApp((s) => s.session);
  const [name, setName] = useState(userName);
  const [newCat, setNewCat] = useState("");
  useEffect(() => setName(userName), [userName]);

  const addCat = async () => {
    const c = newCat.trim();
    if (!c) { toast.error("Escribí un nombre de categoría."); return; }
    if (categories.some((x) => x.toLowerCase() === c.toLowerCase())) { toast.error("Esa categoría ya existe."); return; }
    if (!(await actions.setCategories([...categories, c]))) return;
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
            <Button variant="hero" disabled={saving} onClick={async () => { if (!name.trim()) { toast.error("El nombre no puede estar vacío."); return; } if (await actions.setName(name.trim())) toast.success("Nombre actualizado"); }}>Guardar</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{session?.guest ? "Sesión de invitado" : session?.email}</p>
          <Label className="mt-5 block">Moneda</Label>
          <Select disabled={saving} value={currency} onValueChange={async (v) => { if (await actions.setCurrency(v)) toast.success(`Moneda cambiada a ${v}`); }}>
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
              <span key={c} className="inline-flex max-w-full items-center gap-1 rounded-input bg-muted pl-3 text-sm text-foreground">
                {c}
                <Button size="icon" variant="ghost" title={`Quitar ${c}`} aria-label={`Quitar ${c}`} disabled={saving} onClick={async () => { if (categories.length <= 1) { toast.error("Necesitás al menos una categoría."); return; } if (await actions.setCategories(categories.filter((x) => x !== c))) toast.success("Categoría eliminada"); }}><X className="h-3.5 w-3.5" /></Button>
              </span>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Input aria-label="Nueva categoría" placeholder="Nueva categoría" value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCat()} maxLength={24} />
            <Button variant="soft" disabled={saving} onClick={addCat}>Agregar</Button>
          </div>
        </Panel>

        <Panel>
          <div className="flex gap-4">
            <div className="h-fit rounded-xl bg-success-soft p-2.5 text-success"><ShieldCheck className="h-6 w-6" /></div>
            <div>
              <h2 className="font-semibold">Tu dinero, tu control</h2>
              <a href="/privacidad" className="mt-2 inline-block text-sm text-primary underline">
                Política de privacidad
              </a>
              <p className="mt-1 text-sm text-muted-foreground">RUMBIT organiza la información que registrás. No necesita acceder a tus cuentas bancarias ni realizar operaciones financieras.</p>
            </div>
          </div>
        </Panel>

        <Panel title="Sesión">
          <div className="flex flex-wrap gap-2">
            {session?.guest && <Button variant="outline" onClick={() => { actions.resetDemo(); toast.success("Datos demostrativos restaurados"); }}>Restaurar datos demo</Button>}
            <Button variant="destructive" disabled={saving} onClick={async () => { if (await actions.logout()) { toast.success("Sesión cerrada"); void navigate({ to: "/", replace: true }); } else { toast.error("No pudimos cerrar la sesión. Volvé a intentar."); } }}><LogOut />Cerrar sesión</Button>
          </div>
        </Panel>
        <Panel className="lg:col-span-2">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <img
              src="/rumi-oficial.png"
              alt="Rumi, mascota de Rumbit"
              className="h-28 w-28 shrink-0 object-contain"
            />
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-semibold">
                ¡Ayudame a mejorar Rumbit!
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Tu opinión me ayuda a crecer. Contame qué te gustó,
                qué podemos mejorar y qué nuevas funciones te gustaría encontrar.
              </p>
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLScj114G5wyTzgZOlsbw0mfjTV9dTNz0WBmyudLBhFRgtHEpmw/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Completar encuesta
              </a>
              <p className="mt-2 text-xs text-muted-foreground">
                Solo te llevará unos minutos.
              </p>
            </div>
          </div>
        </Panel>

      </div>
    </AppShell>
  );
}
