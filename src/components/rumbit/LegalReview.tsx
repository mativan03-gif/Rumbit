import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { actions } from "@/lib/store";
import { PrivacyPolicy } from "./PrivacyPolicy";
import { TermsAndConditions } from "./TermsAndConditions";

export function LegalReview() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function accept() {
    setBusy(true);
    setError("");
    try {
      await actions.acceptLegalTerms();
    } catch {
      setError("No pudimos guardar tu aceptación. Volvé a intentar.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setError("");
    try {
      if (await actions.logout()) {
        void navigate({ to: "/", replace: true });
      } else {
        setError("No pudimos cerrar tu sesión. Volvé a intentar.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">Política de privacidad de Rumbit</h1>
      <p className="mt-4 text-muted-foreground">
        Leé la política de privacidad y los términos antes de continuar.
      </p>
      <PrivacyPolicy />
      <TermsAndConditions />
      {error && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button disabled={busy} onClick={() => void accept()}>
          Aceptar los términos y condiciones
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => void logout()}>
          Cerrar sesión
        </Button>
      </div>
    </main>
  );
}
