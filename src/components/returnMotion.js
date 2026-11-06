/**
 * Return-phase steering for the corner groups.
 *
 * When the login closes, each bubble travels from its corner back to its own
 * home slot in the resting cloud around the Hello World (not the raw origin),
 * so closing re-forms the cloud instead of collapsing to a point and
 * re-scattering from the bottom. The velocity is radial (toward the target)
 * with a small tangential component, so the groups arc in instead of sliding
 * along straight spokes. Speed scales with distance and is capped.
 *
 * Extracted as pure math so it can be verified without a WebGL context.
 */

/** Radius around a home slot at which the return phase hands off to the
 *  resting spring (avoids piling into the exact target position). */
export const HOME_RELEASE_RADIUS = 1.3;

export function attractionVelocity(
  pos,
  { swirl = 0.4, maxSpeed = 12, gain = 1.25, target = null } = {}
) {
  const tx = target && target.x !== undefined ? target.x : 0;
  const ty = target && target.y !== undefined ? target.y : 0;
  const tz = target && target.z !== undefined ? target.z : 0;

  const dx = pos.x - tx;
  const dy = pos.y - ty;
  const dz = pos.z - tz;
  const dist = Math.hypot(dx, dy, dz);
  if (dist === 0) return { x: 0, y: 0, z: 0 };

  const rx = dx / dist;
  const ry = dy / dist;
  const rz = dz / dist;
  const speed = Math.min(maxSpeed, dist * gain);

  return {
    x: (-rx - ry * swirl) * speed,
    y: (-ry + rx * swirl) * speed,
    z: -rz * speed,
  };
}