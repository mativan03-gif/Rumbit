import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, expect, it } from "vitest";
import { ExpenseShortcuts } from "@/components/rumbit/ExpenseShortcuts";
import { Payments } from "@/components/rumbit/PlanningPanels";

import { actions } from "@/lib/store";

beforeAll(() => actions.startDemo());
afterEach(cleanup);

it("adds a payment and lets the user mark it paid and undo", () => {
  render(<Payments />);
  fireEvent.change(screen.getByLabelText("Nombre del pago"), { target: { value: "Internet" } });
  fireEvent.change(screen.getByLabelText("Importe (ARS)"), { target: { value: "5000" } });
  fireEvent.change(screen.getByLabelText("Vencimiento"), { target: { value: "2030-12-03" } });
  fireEvent.click(screen.getByRole("button", { name: "Agregar pago" }));

  expect(screen.getByText("Internet")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Marcar como pagado" }));
  expect(screen.getByText(/· Pagado$/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Volver a pendiente" }));
  expect(screen.getByText(/· Pendiente$/)).toBeInTheDocument();
});

it("opens a new movement from a shortcut with a blank amount", () => {
  render(<ExpenseShortcuts />);
  fireEvent.click(screen.getByText("Crear acceso rápido"));
  fireEvent.change(screen.getByLabelText("Descripción del gasto"), { target: { value: "SUBE" } });
  fireEvent.change(screen.getByLabelText("Categoría del gasto"), {
    target: { value: "Transporte" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar acceso" }));
  fireEvent.click(screen.getByRole("button", { name: "SUBE · Transporte" }));

  expect(screen.getByRole("dialog", { name: "Nuevo movimiento" })).toBeInTheDocument();
  expect(screen.getByLabelText("Descripción (opcional)")).toHaveValue("SUBE");
  expect(screen.getByRole("combobox", { name: "Categoría" })).toHaveTextContent("Transporte");
  expect(screen.getByLabelText("Monto *")).toHaveValue(null);
});
