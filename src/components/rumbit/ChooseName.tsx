import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actions, useApp } from "@/lib/store";
import { Rumbi } from "./Rumbi";

export function ChooseName({ status }: { status: "loading" | "ready" | "error" }) {
  const [name, setName] = useState("");
  const saving = useApp((state) => state.saving);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!saving && name.trim()) void actions.setName(name.trim());
  }

  return (
    <main className="flex min-h-dvh items-start justify-center bg-background px-4 py-6 sm:items-center sm:p-8">
      <section className="w-full max-w-md rounded-3xl border bg-card p-5 shadow-card sm:p-6">
        <Rumbi className="h-16 w-16 sm:h-20 sm:w-20" />
        <h1 className="mt-3 text-2xl font-bold">¿Cómo querés que te llamemos?</h1>
        {status === "loading" && <p role="status" className="mt-2">Cargando tu perfil…</p>}
        {status === "error" && (
          <div className="mt-3 space-y-3">
            <p role="alert">No pudimos cargar tu perfil.</p>
            <Button onClick={actions.retryAccount}>Reintentar</Button>
          </div>
        )}
        {status === "ready" && (
          <form className="mt-4 grid gap-3" onSubmit={submit}>
            <p className="text-sm text-muted-foreground">Vas a ver este nombre en el saludo de Inicio.</p>
            <Label htmlFor="profile-name">Tu nombre</Label>
            <Input id="profile-name" autoComplete="given-name" maxLength={30}
              value={name} onChange={(event) => setName(event.target.value)} />
            <Button type="submit" variant="hero" className="min-h-12 w-full" disabled={saving || !name.trim()}>
              {saving ? "Guardando…" : "Guardar y continuar"}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
