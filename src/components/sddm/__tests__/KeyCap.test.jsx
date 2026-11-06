import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KeyCap } from "../KeyCap";

describe("KeyCap", () => {
  it("renderiza la tecla Enter con su etiqueta accesible", () => {
    render(<KeyCap variant="enter" />);
    expect(screen.getByRole("img", { name: "Tecla Enter" })).toBeInTheDocument();
    expect(document.querySelector(".keycap--enter")).toBeTruthy();
  });

  it("renderiza la tecla Esc", () => {
    render(<KeyCap variant="esc" />);
    expect(screen.getByRole("img", { name: "Tecla Esc" })).toBeInTheDocument();
    expect(document.querySelector(".keycap--esc")).toHaveTextContent("esc");
  });

  it("renderiza la barra de espacio ancha para el prompt", () => {
    render(<KeyCap variant="space" />);
    expect(
      screen.getByRole("img", { name: "Tecla Espacio" })
    ).toBeInTheDocument();
    expect(document.querySelector(".keycap--space")).toHaveTextContent("space");
  });

  it("por defecto renderiza la tecla Enter", () => {
    render(<KeyCap />);
    expect(screen.getByRole("img", { name: "Tecla Enter" })).toBeInTheDocument();
  });
});