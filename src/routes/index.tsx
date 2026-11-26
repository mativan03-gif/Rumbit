import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rumbi } from "@/components/rumbit/Rumbi";
import { actions, useApp } from "@/lib/store";
import { authErrorMessage, getAuthClient } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const [signup, setSignup] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const hydrated = useApp((state) => state.hydrated);
  const session = useApp((state) => state.session);
  const recovering = useApp((state) => state.recoveringPassword);
  const onboardingPending = useApp((state) => state.onboardingPending);
  const callbackError = useApp((state) => state.authCallbackError);

  useEffect(() => {
    if (callbackError) toast.error(authErrorMessage(callbackError));
  }, [callbackError]);

  useEffect(() => {
    if (hydrated && session && !recovering) {
      void navigate({
        to: onboardingPending && !session.guest ? "/bienvenida" : "/inicio",
        replace: true,
      });
    }
  }, [hydrated, session, recovering, onboardingPending, navigate]);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    const code = hash.get("error_code") ?? query.get("error_code");
    if (code) {
      toast.error(authErrorMessage(code));
      window.history.replaceState(window.history.state, "", window.location.pathname);
    }
  }, []);

  const signInWithGoogle = async () => {
    const client = getAuthClient();
    if (!client) {
      toast.error("El acceso con Google no está disponible.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: new URL("/", window.location.origin).href },
      });
      if (error) toast.error(authErrorMessage(error.code));
    } catch {
      toast.error(authErrorMessage());
    } finally {
      setBusy(false);
    }
  };

  const enter = async (mode: "login" | "signup" | "reset" | "update") => {
    const client = getAuthClient();
    if (!client) {
      toast.error("Supabase todavía no está configurado. Podés usar el modo invitado.");
      return;
    }

    const address = email.trim();
    if (mode !== "update" && !/^\S+@\S+\.\S+$/.test(address)) {
      toast.error("Ingresá un email válido.");
      return;
    }
    if (mode === "login" && !password) {
      toast.error("Ingresá tu contraseña.");
      return;
    }
    if ((mode === "signup" || mode === "update") && password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setBusy(true);
    const redirectTo = new URL("/", window.location.origin).href;

    try {
      if (mode === "login") {
        const { error } = await client.auth.signInWithPassword({ email: address, password });
        if (error) {
          toast.error(authErrorMessage(error.code));
          return;
        }
      } else if (mode === "signup") {
        const { data, error } = await client.auth.signUp({
          email: address,
          password,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) {
          toast.error(authErrorMessage(error.code));
          return;
        }
        if (!data.session) setVerificationEmail(address);
      } else if (mode === "reset") {
        const { error } = await client.auth.resetPasswordForEmail(address, { redirectTo });
        if (error) {
          toast.error(authErrorMessage(error.code));
          return;
        }
        toast.success("Si el correo está registrado, vas a recibir un enlace de recuperación.");
      } else {
        const { error } = await client.auth.updateUser({ password });
        if (error) {
          toast.error(authErrorMessage(error.code));
          return;
        }
        actions.finishRecovery();
        toast.success("Contraseña actualizada.");
      }
      setPassword("");
    } catch {
      toast.error(authErrorMessage());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2">
          <Rumbi className="h-10 w-10 animate-none" />
          <span className="text-2xl font-bold">RUMBIT<span className="text-primary">.</span></span>
        </div>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />Sin conexión bancaria
        </span>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        {verificationEmail && !recovering ? (
          <section className="w-full max-w-sm space-y-4" aria-live="polite">
            <h1 className="text-3xl font-bold">Revisá tu correo</h1>
            <p>
              Si corresponde verificar tu dirección, vas a recibir un enlace de Rumbit en{" "}
              <strong className="wrap-anywhere">{verificationEmail}</strong>.{" "}
              Abrí el enlace en este mismo navegador para confirmar tu cuenta.
            </p>
            <p className="text-sm text-muted-foreground">
              Si ya tenés una cuenta, iniciá sesión o usá «Recuperar contraseña».
              Si estás esperando el enlace, revisá también el correo no deseado.
            </p>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full"
              onClick={() => {
                setVerificationEmail("");
                setSignup(false);
              }}
            >
              Volver a iniciar sesión
            </Button>
          </section>
        ) : (
          <form
            className="animate-rise w-full max-w-sm space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              void enter(recovering ? "update" : signup ? "signup" : "login");
            }}
          >
            <div className="flex items-center gap-3">
              <Rumbi className="h-14 w-14 animate-none" />
              <span className="text-sm font-medium text-primary">
                ¡Hola! Soy Rumi. Te doy la bienvenida a Rumbit.
              </span>
            </div>

            <div>
              <h1 className="text-3xl font-bold leading-tight">
                {recovering ? "Elegí una nueva contraseña" : signup ? "Creá tu cuenta" : "Bienvenido a RUMBIT"}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {signup && !recovering
                  ? "Ingresá tu correo y elegí una contraseña de al menos 8 caracteres."
                  : "Organizá tu dinero y alcanzá tus objetivos de ahorro."}
              </p>
            </div>

            <fieldset disabled={!hydrated || busy || (!!session && !recovering)} className="space-y-6">
              {!recovering && (
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="vos@email.com"
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="pass">{recovering ? "Nueva contraseña" : "Contraseña"}</Label>
                <Input
                  id="pass"
                  type="password"
                  autoComplete={recovering || signup ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" variant="hero" className="h-12 w-full">
                {recovering ? "Guardar contraseña" : signup ? "Enviar correo de verificación" : "Iniciar sesión"}
                <ArrowRight />
              </Button>

              {!recovering && signup && (
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11 w-full"
                  onClick={() => {
                    setSignup(false);
                    setPassword("");
                  }}
                >
                  Volver a iniciar sesión
                </Button>
              )}

              {!recovering && !signup && (
                <>
                  <Button type="button" variant="outline" className="h-11 w-full" onClick={() => void signInWithGoogle()}>
                    Continuar con Google
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => void enter("reset")}>
                    Recuperar contraseña
                  </Button>
                  <Button
                    type="button"
                    variant="soft"
                    className="h-11 w-full"
                    onClick={() => {
                      setSignup(true);
                      setPassword("");
                    }}
                  >
                    Crear cuenta
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={actions.startDemo}>
                    Continuar como invitado
                  </Button>
                </>
              )}
            </fieldset>
          </form>
        )}
      </div>

      <footer className="px-6 pb-8 text-center text-xs leading-relaxed text-muted-foreground">
        <p>Prototipo con datos ficticios. Sin conexión bancaria.</p>
        <a href="/privacidad" className="mt-2 inline-block underline">
          Política de privacidad
        </a>
      </footer>
    </div>
  );
}