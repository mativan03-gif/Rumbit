import { createFileRoute, Link } from "@tanstack/react-router";
import { PrivacyPolicy } from "@/components/rumbit/PrivacyPolicy";
import { TermsAndConditions } from "@/components/rumbit/TermsAndConditions";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      { title: "Política de privacidad · Rumbit" },
      {
        name: "description",
        content: "Cómo Rumbit trata tus datos y cómo podés ejercer tus derechos.",
      },
    ],
  }),
  component: Privacidad,
});

function Privacidad() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/" className="text-sm font-medium text-primary underline">
        Volver a Rumbit
      </Link>

      <h1 className="mb-4 mt-6 text-3xl font-bold">
        Política de privacidad de Rumbit
      </h1>
      <PrivacyPolicy />
      <TermsAndConditions />
    </main>
  );
}
