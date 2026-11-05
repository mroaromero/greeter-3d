import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FlameWrap, supportsHtmlInCanvas } from "../FlameWrap";

describe("FlameWrap", () => {
  it("detecta que jsdom no tiene html-in-canvas (fallback por diseño)", () => {
    expect(supportsHtmlInCanvas()).toBe(false);
  });

  it("sin WebGL2 ni html-in-canvas renderiza los children sin crash", () => {
    const { container } = render(
      <FlameWrap className="flame-test" radius={32}>
        <p>contenido de la card</p>
      </FlameWrap>
    );

    // Los children viven en el árbol de fallback (HTML normal).
    expect(screen.getByText("contenido de la card")).toBeInTheDocument();
    expect(container.querySelector("div.flame-test")).not.toBeNull();

    // El canvas de salida WebGL existe aunque el efecto no pueda capturar
    // el DOM: en navegadores sin la API las llamas se dibujan igual alrededor.
    const output = container.querySelector('canvas[aria-hidden="true"]');
    expect(output).not.toBeNull();
  });

  it("acepta opciones sin romper el render", () => {
    render(
      <FlameWrap intensity={2} height={120} sparks={0} smoke={0} scorch={1} colorCycle={0.5}>
        <span>opciones</span>
      </FlameWrap>
    );
    expect(screen.getByText("opciones")).toBeInTheDocument();
  });
});