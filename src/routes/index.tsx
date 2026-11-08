import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rumbi } from "@/components/rumbit/Rumbi";
import { actions } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bienvenido a RUMBIT · Iniciar sesión" },
      { name: "description", content: "Organizá tu dinero y alcanzá tus objetivos de ahorro con RUMBIT." },
      { property: "og:title", content: "Bienvenido a RUMBIT" },
      { property: "og:description", content: "Organizá tu dinero y alcanzá tus objetivos de ahorro." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const enter = (mode: "login" | "signup" | "guest") => {
    if (mode !== "guest") {
      if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error("Ingresá un email válido.");
      if (password.length < 6) return toast.error("La contraseña debe tener al menos 6 caracteres.");
    }
    actions.login(mode === "guest" ? "invitado@rumbit.app" : email, mode === "guest");
    toast.success(mode === "signup" ? "¡Cuenta demo creada!" : "¡Bienvenido!");
    navigate({ to: "/inicio" });
    return undefined;
  };

  return (
    <div className="grid min-h-screen bg-background md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-primary p-12 text-primary-foreground md:flex">
        <span className="text-2xl font-extrabold tracking-tight">RUMBIT</span>
        <div>
          <Rumbi className="h-40 w-40" />
          <p className="mt-8 max-w-sm text-3xl font-bold leading-tight">Tu dinero, ordenado. Tus metas, más cerca.</p>
        </div>
        <p className="text-sm opacity-80">Prototipo con datos ficticios. Sin conexión bancaria.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form className="animate-rise w-full max-w-sm space-y-5" onSubmit={(e) => { e.preventDefault(); enter("login"); }}>
          <Rumbi className="h-16 w-16 md:hidden" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bienvenido a RUMBIT</h1>
            <p className="mt-2 text-muted-foreground">Organizá tu dinero y alcanzá tus objetivos de ahorro.</p>
          </div>
          <div className="grid gap-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@email.com" className="h-11 rounded-xl" /></div>
          <div className="grid gap-1.5"><Label htmlFor="pass">Contraseña</Label><Input id="pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" className="h-11 rounded-xl" /></div>
          <Button type="submit" variant="hero" className="h-11 w-full">Iniciar sesión</Button>
          <Button type="button" variant="soft" className="h-11 w-full" onClick={() => enter("signup")}>Crear cuenta</Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => enter("guest")}>Continuar como invitado</Button>
        </form>
      </div>
    </div>
  );
}
