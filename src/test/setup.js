import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom ships requestAnimationFrame, but it is backed by its own timer loop.
// Routing it through setTimeout makes `vi.advanceTimersByTime()` deterministic
// for components that defer work to the next frame.
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

afterEach(() => {
  cleanup();
});
