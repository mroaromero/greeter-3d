import { describe, it, expect } from "vitest";
import { attractionVelocity, HOME_RELEASE_RADIUS } from "../returnMotion";

// Corner targets used by Sphere.jsx, roughly, at the default framing.
const CORNERS = [
  { x: 5.6, y: 5.0, z: 1.5 },
  { x: -5.6, y: 5.0, z: -1.5 },
  { x: -5.6, y: -5.0, z: 1.5 },
  { x: 5.6, y: -5.0, z: -1.5 },
];

// Un slot de la concha de reposo (los homes de Sphere.jsx viven en una esfera
// de radio ~6.5 alrededor del origen).
const HOME = { x: 3.2, y: 2.1, z: -1.4 };

describe("attractionVelocity", () => {
  it("apunta siempre hacia el origen (target por defecto)", () => {
    for (const pos of CORNERS) {
      const v = attractionVelocity(pos);
      const dot = pos.x * v.x + pos.y * v.y + pos.z * v.z;
      expect(dot).toBeLessThan(0);
    }
  });

  it("apunta hacia el target indicado", () => {
    for (const pos of CORNERS) {
      const v = attractionVelocity(pos, { target: HOME });
      const dot =
        (HOME.x - pos.x) * v.x +
        (HOME.y - pos.y) * v.y +
        (HOME.z - pos.z) * v.z;
      expect(dot).toBeGreaterThan(0);
    }
  });

  it("no produce NaN en el origen exacto", () => {
    expect(attractionVelocity({ x: 0, y: 0, z: 0 })).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("escala con la distancia y respeta el tope", () => {
    const near = attractionVelocity({ x: 2, y: 0, z: 0 });
    const far = attractionVelocity({ x: 6, y: 0, z: 0 });
    const huge = attractionVelocity({ x: 500, y: 0, z: 0 });

    expect(Math.hypot(near.x, near.y, near.z)).toBeLessThan(
      Math.hypot(far.x, far.y, far.z)
    );
    expect(Math.hypot(huge.x, huge.y, huge.z)).toBeLessThanOrEqual(13);
  });

  it("lleva los cuatro grupos al radio de liberación sin cruzar el origen", () => {
    for (const start of CORNERS) {
      let pos = { ...start };
      let released = false;

      for (let frame = 0; frame < 600 && !released; frame++) {
        const dist = Math.hypot(pos.x, pos.y, pos.z);
        if (dist < HOME_RELEASE_RADIUS) {
          released = true;
          break;
        }
        const v = attractionVelocity(pos);
        pos = {
          x: pos.x + v.x / 60,
          y: pos.y + v.y / 60,
          z: pos.z + v.z / 60,
        };
      }

      expect(released).toBe(true);
      expect(Math.hypot(pos.x, pos.y, pos.z)).toBeGreaterThan(0);
    }
  });

  it("lleva un grupo hasta su hogar sin cruzar el target", () => {
    let pos = { ...CORNERS[0] };
    let released = false;

    for (let frame = 0; frame < 600 && !released; frame++) {
      const dist = Math.hypot(pos.x - HOME.x, pos.y - HOME.y, pos.z - HOME.z);
      if (dist < HOME_RELEASE_RADIUS) {
        released = true;
        break;
      }
      const v = attractionVelocity(pos, { target: HOME });
      pos = {
        x: pos.x + v.x / 60,
        y: pos.y + v.y / 60,
        z: pos.z + v.z / 60,
      };
    }

    expect(released).toBe(true);
    // Frenó en el radio de liberación: cerca del hogar, sin atravesarlo.
    expect(
      Math.hypot(pos.x - HOME.x, pos.y - HOME.y, pos.z - HOME.z)
    ).toBeGreaterThan(0);
  });

  it("se libera antes del hogar para no apilar los cuerpos", () => {
    expect(HOME_RELEASE_RADIUS).toBeGreaterThan(0);
    expect(HOME_RELEASE_RADIUS).toBeLessThan(3);
  });
});