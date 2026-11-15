import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
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
      if (!/^\S+@\S+\.\S+$/.test(email)) { toast.error("Ingresá un email válido."); return; }
      if (password.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres."); return; }
    }
    actions.login(mode === "guest" ? "invitado@rumbit.app" : email, mode === "guest");
    toast.success(mode === "signup" ? "¡Cuenta demo creada!" : "¡Bienvenido!");
    navigate({ to: "/inicio" });
    return undefined;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2"><Rumbi className="h-10 w-10 animate-none" /><span className="text-2xl font-bold">RUMBIT<span className="text-primary">.</span></span></div>
        <span className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" />Modo demo</span>
      </header>
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <form className="animate-rise w-full max-w-sm space-y-6" onSubmit={(e) => { e.preventDefault(); enter("login"); }}>
          <div className="flex items-center gap-3"><Rumbi className="h-14 w-14 animate-none" /><span className="text-sm font-medium text-primary">Tu dinero, tu rumbo.</span></div>
          <div>
            <h1 className="text-3xl font-bold leading-tight">Bienvenido a RUMBIT</h1>
            <p className="mt-2 text-muted-foreground">Organizá tu dinero y alcanzá tus objetivos de ahorro.</p>
          </div>
          <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@email.com" /></div>
          <div className="grid gap-2"><Label htmlFor="pass">Contraseña</Label><Input id="pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" /></div>
          <Button type="submit" variant="hero" className="h-12 w-full">Iniciar sesión<ArrowRight /></Button>
          <Button type="button" variant="soft" className="h-11 w-full" onClick={() => enter("signup")}>Crear cuenta</Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => enter("guest")}>Continuar como invitado</Button>
        </form>
      </div>
      <footer className="px-6 pb-8 text-center text-xs leading-relaxed text-muted-foreground">Prototipo con datos ficticios. Sin conexión bancaria.</footer>
    </div>
  );
}
