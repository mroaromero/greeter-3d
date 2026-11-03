import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { ClockWeatherWidget } from "../ClockWeatherWidget";

const weatherResponse = (temperature, weatherCode) => ({
  ok: true,
  json: () => Promise.resolve({ current: { temperature_2m: temperature, weather_code: weatherCode } }),
});

/** Flushes the fetch → json → setState promise chain. */
async function flush(times = 5) {
  await act(async () => {
    for (let i = 0; i < times; i++) await Promise.resolve();
  });
}

const pick = (container, className) => container.querySelector(className);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 3, 15, 49, 0));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("ClockWeatherWidget", () => {
  it("muestra la hora local y la fecha", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(weatherResponse(15.2, 81))));
    const { container } = render(<ClockWeatherWidget />);
    await flush();

    expect(pick(container, ".sddm-clock__time").textContent).toBe("15:49");
    expect(pick(container, ".sddm-clock__date").textContent).toMatch(/03/);
    expect(pick(container, ".sddm-clock__date").textContent).toMatch(/nov/i);
  });

  it("avanza el reloj cada minuto", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(weatherResponse(15.2, 81))));
    const { container } = render(<ClockWeatherWidget />);
    await flush();

    act(() => {
      vi.advanceTimersByTime(61_000);
    });

    expect(pick(container, ".sddm-clock__time").textContent).toBe("15:50");
  });

  it("pinta la temperatura que devuelve el clima", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(weatherResponse(15.2, 81))));
    const { container } = render(<ClockWeatherWidget />);
    await flush();

    expect(pick(container, ".sddm-clock__temp").textContent).toBe("15°");
    expect(pick(container, ".sddm-clock").title).toContain("Santiago de Chile");
  });

  it("cae en un placeholder si no hay red", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
    const { container } = render(<ClockWeatherWidget />);
    await flush();

    expect(pick(container, ".sddm-clock__temp").textContent).toBe("--°");
    expect(pick(container, ".sddm-clock__time").textContent).toBe("15:49");
  });
});
