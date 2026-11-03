import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { PasswordLoginCard } from "../PasswordLoginCard";

const DEMO_PASSWORD = "1111111111";

function setup(props = {}) {
  return render(
    <PasswordLoginCard
      onClose={vi.fn()}
      onLoginSuccess={vi.fn()}
      userName="Manuel Roa"
      userHandle="lad-manu"
      {...props}
    />
  );
}

const input = () => screen.getByLabelText("Contraseña");
const form = (container) => container.querySelector("form");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 3, 15, 49, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("PasswordLoginCard", () => {
  it("monta con el input enfocado", () => {
    setup();
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(input()).toHaveFocus();
  });

  it("no muestra el conteo de caracteres ni los literales Enter/Esc", () => {
    setup();
    fireEvent.change(input(), { target: { value: "abcdef" } });

    expect(screen.queryByText(/car[aá]cter/i)).toBeNull();
    expect(screen.queryByText(/^Enter$/)).toBeNull();
    expect(screen.queryByText(/^Esc$/)).toBeNull();

    // The hints are keycaps, not words.
    expect(screen.getByRole("img", { name: "Tecla Enter" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Tecla Esc" })).toBeInTheDocument();
  });

  it("autentica con la contraseña demo y llama onLoginSuccess una sola vez", () => {
    const onLoginSuccess = vi.fn();
    const { container } = setup({ onLoginSuccess });

    fireEvent.change(input(), { target: { value: DEMO_PASSWORD } });
    fireEvent.submit(form(container));

    expect(screen.queryByText("✓ Sesión iniciada")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.getByText("✓ Sesión iniciada")).toBeInTheDocument();
    expect(onLoginSuccess).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2200);
    });
    expect(onLoginSuccess).toHaveBeenCalledTimes(1);
  });

  it("Enter produce una sola autenticación, no un submit duplicado", () => {
    const onLoginSuccess = vi.fn();
    const { container } = setup({ onLoginSuccess });

    fireEvent.change(input(), { target: { value: DEMO_PASSWORD } });

    // What a real browser does on Enter: keydown on the input + form submit.
    // If an Enter keydown handler ever comes back, this ends in two logins.
    fireEvent.keyDown(input(), { key: "Enter", code: "Enter" });
    fireEvent.submit(form(container));

    act(() => {
      vi.advanceTimersByTime(600 + 2200);
    });
    expect(onLoginSuccess).toHaveBeenCalledTimes(1);
  });

  it("rechaza una contraseña incorrecta y se resetea sola", () => {
    const { container } = setup();

    fireEvent.change(input(), { target: { value: "1111" } });
    fireEvent.submit(form(container));

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.getByText("Contraseña incorrecta")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1600);
    });
    // React commits the re-render (input re-enabled) at the end of this act;
    // the focus timer is scheduled 50ms after that, like in a real frame.
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(screen.queryByText("Contraseña incorrecta")).toBeNull();
    expect(input().value).toBe("");
    expect(input()).toHaveFocus();
  });

  it("avisa cuando se envía vacío", () => {
    const { container } = setup();
    fireEvent.submit(form(container));

    expect(screen.getByText("Ingresa tu contraseña")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1600 + 50);
    });
    expect(screen.queryByText("Ingresa tu contraseña")).toBeNull();
  });

  it("Escape cierra la card", () => {
    const onClose = vi.fn();
    setup({ onClose });

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("cancela sus timers al desmontar", () => {
    const onLoginSuccess = vi.fn();
    const { container, unmount } = setup({ onLoginSuccess });

    fireEvent.change(input(), { target: { value: DEMO_PASSWORD } });
    fireEvent.submit(form(container));
    unmount();

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(onLoginSuccess).not.toHaveBeenCalled();
  });
});
