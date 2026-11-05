import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SystemButtons } from "../SystemButtons";

// jsdom no implementa ResizeObserver; HoldButton lo usa para medir el tamaño
// del clip de onda. Stub mínimo para poder renderizarlo en tests.
beforeEach(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("SystemButtons", () => {
  it("renderiza los tres botones de sistema con su nombre accesible", () => {
    render(
      <SystemButtons
        onPowerOff={vi.fn()}
        onRestart={vi.fn()}
        onSuspend={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Apagar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reiniciar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Suspender" })).toBeInTheDocument();
  });

  it("cada botón explica que hay que mantener presionado", () => {
    render(<SystemButtons />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      expect(button).toHaveAccessibleDescription(/manten[eé] presionado/i);
    }
  });

  it("los botones son hold-to-confirm: arrancan en idle y al hacer click simple no disparan la acción", () => {
    const onPowerOff = vi.fn();
    render(<SystemButtons onPowerOff={onPowerOff} />);

    const power = screen.getByRole("button", { name: "Apagar" });
    expect(power.dataset.phase).toBe("idle");

    // Click simple (pointerdown + pointerup sin mantener) es un tap, no dispara.
    power.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    power.dispatchEvent(new Event("pointerup", { bubbles: true }));
    expect(onPowerOff).not.toHaveBeenCalled();
  });
});