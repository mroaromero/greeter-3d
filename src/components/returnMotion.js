/**
 * Return-phase steering for the corner groups.
 *
 * When the login closes, each group of bubbles travels from its corner back to
 * the Hello World. The velocity is radial (toward the origin) with a small
 * tangential component, so the four groups arc inward instead of sliding along
 * four straight spokes. Speed scales with distance and is capped.
 *
 * Extracted as pure math so it can be verified without a WebGL context.
 */
export const RETURN_RELEASE_RADIUS = 3.4;

export function attractionVelocity(pos, { swirl = 0.4, maxSpeed = 12, gain = 1.25 } = {}) {
  const dist = Math.hypot(pos.x, pos.y, pos.z);
  if (dist === 0) return { x: 0, y: 0, z: 0 };

  const rx = pos.x / dist;
  const ry = pos.y / dist;
  const rz = pos.z / dist;
  const speed = Math.min(maxSpeed, dist * gain);

  return {
    x: (-rx - ry * swirl) * speed,
    y: (-ry + rx * swirl) * speed,
    z: -rz * speed,
  };
}
