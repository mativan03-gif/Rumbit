import { QueryClient } from "@tanstack/react-query";
import { RouterContextProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HowToGuide } from "@/components/rumbit/HowToGuide";
import { routeTree } from "@/routeTree.gen";

// The guide lives on /inicio and its statistics shortcut is a router Link, so it is
// rendered inside the real route tree with a memory history instead of a full mount.
function renderGuide() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/inicio"] }),
    context: { queryClient: new QueryClient() },
  });
  const onRegisterExpense = vi.fn();
  const onCreateGoal = vi.fn();

  render(
    <RouterContextProvider router={router}>
      <HowToGuide onRegisterExpense={onRegisterExpense} onCreateGoal={onCreateGoal} />
    </RouterContextProvider>,
  );

  return { onRegisterExpense, onCreateGoal };
}

const trigger = () => screen.getByRole("button", { name: "Cómo usar la app" });

describe("Guía «Cómo usar la app»", () => {
  it("arranca cerrada: el botón está visible y los pasos no", () => {
    renderGuide();

    expect(trigger()).toBeInTheDocument();
    expect(screen.queryByText("Registrá un gasto")).not.toBeInTheDocument();
    expect(screen.queryByText("Creá una meta de ahorro")).not.toBeInTheDocument();
  });

  it("al tocar el botón muestra los tres pasos con sus accesos directos", () => {
    renderGuide();

    fireEvent.click(trigger());

    expect(screen.getByText("Registrá un gasto")).toBeInTheDocument();
    expect(screen.getByText("Mirá tus estadísticas")).toBeInTheDocument();
    expect(screen.getByText("Creá una meta de ahorro")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Registrar gasto" })).toBeInTheDocument();
    const stats = screen.getByRole("link", { name: /Ver estadísticas/ });
    expect(stats).toHaveAttribute("href", "/estadisticas");
    expect(screen.getByRole("button", { name: "Crear meta" })).toBeInTheDocument();
  });

  it("se puede ocultar después de abrirla, desde el botón de ocultar y desde el propio disparador", () => {
    renderGuide();

    fireEvent.click(trigger());
    expect(screen.getByText("Registrá un gasto")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ocultar guía" }));
    expect(screen.queryByText("Registrá un gasto")).not.toBeInTheDocument();

    fireEvent.click(trigger());
    expect(screen.getByText("Registrá un gasto")).toBeInTheDocument();
    fireEvent.click(trigger());
    expect(screen.queryByText("Registrá un gasto")).not.toBeInTheDocument();
  });

  it("los accesos directos de la guía abren el formulario de gasto y el de meta", () => {
    const { onRegisterExpense, onCreateGoal } = renderGuide();

    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole("button", { name: "Registrar gasto" }));
    fireEvent.click(screen.getByRole("button", { name: "Crear meta" }));

    expect(onRegisterExpense).toHaveBeenCalledTimes(1);
    expect(onCreateGoal).toHaveBeenCalledTimes(1);
  });
});
