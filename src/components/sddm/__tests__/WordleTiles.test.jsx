import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { WordleTiles } from "../WordleTiles";

const baseProps = {
  password: "",
  showPassword: false,
  status: "idle",
  isFocused: false,
};

const tilesOf = (container) => container.firstElementChild.firstElementChild.children;
const stripText = (container) => container.textContent;

describe("WordleTiles", () => {
  it("dibuja 8 casillas cuando la contraseña está vacía", () => {
    const { container } = render(<WordleTiles {...baseProps} />);
    expect(tilesOf(container)).toHaveLength(8);
    // The viewport is a fixed design constant: 8 tiles + 7 gaps.
    expect(container.firstElementChild).toHaveStyle({ width: "330px" });
  });

  it("muestra CORRECTO al resolver con éxito", () => {
    const { container } = render(
      <WordleTiles {...baseProps} password="12345678" status="success" />
    );
    expect(stripText(container)).toBe("CORRECTO");
    expect(container.querySelector(".wordle-cursor")).toBeNull();
  });

  it("muestra DENEGADO al fallar, sin palabras truncadas", () => {
    const { container } = render(
      <WordleTiles {...baseProps} password="1234" status="error" />
    );
    expect(stripText(container)).toBe("DENEGADO");
    expect(stripText(container)).not.toContain("INCORREC");
  });

  it("mantiene visibles el caret y el último carácter con una contraseña larga", () => {
    const { container } = render(
      <WordleTiles {...baseProps} password="1234567890" showPassword isFocused />
    );

    // 10 characters + one empty slot past the caret.
    expect(tilesOf(container)).toHaveLength(11);
    expect(container.querySelector(".wordle-cursor")).not.toBeNull();
    expect(stripText(container)).toContain("1234567890");
  });

  it("oculta los caracteres salvo que se pida mostrarlos", () => {
    const hidden = render(<WordleTiles {...baseProps} password="abc" />);
    expect(stripText(hidden.container)).toBe("•••");
    hidden.unmount();

    const shown = render(<WordleTiles {...baseProps} password="abc" showPassword />);
    expect(stripText(shown.container)).toBe("abc");
  });
});
