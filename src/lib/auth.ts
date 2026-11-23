import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

export function getAuthClient() {
  if (typeof window === "undefined") return undefined;

  const url = import.meta.env["VITE_SUPABASE_URL"];
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key?.startsWith("sb_publishable_")) return undefined;

  try {
    client ??= createClient(url, key, { auth: { flowType: "pkce", detectSessionInUrl: false } });
    return client;
  } catch {
    return undefined;
  }
}

export function authErrorMessage(code?: string) {
  switch (code) {
    case "invalid_credentials":
      return "Revisá el correo y la contraseña e intentá de nuevo.";
    case "email_not_confirmed":
      return "Confirmá tu correo antes de iniciar sesión.";
    case "weak_password":
      return "Usá una contraseña más larga y difícil de adivinar.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Hubo demasiados intentos. Esperá unos minutos y volvé a probar.";
    case "otp_expired":
    case "flow_state_not_found":
      return "El enlace venció o ya se usó. Solicitá uno nuevo.";
    default:
      return "No pudimos completar la solicitud. Intentá de nuevo.";
  }
}
