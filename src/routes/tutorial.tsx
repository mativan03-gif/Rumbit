import { createFileRoute } from "@tanstack/react-router";
import { Welcome } from "./bienvenida";

// Reabre la guía sin alterar el indicador de bienvenida ya completada.
export const Route = createFileRoute("/tutorial")({ component: () => <Welcome replay /> });
