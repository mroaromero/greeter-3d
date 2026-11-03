import React, { useEffect, useRef } from "react";
import { useSprings, animated } from "@react-spring/web";

const MAX_TILES = 8;

/**
 * Wordle-style tile row.
 *
 * Key design decisions:
 * - useSprings (NOT useTrail) → each tile is fully independent, no chained animation
 * - "active" tile (index === password.length) shows blinking "|" cursor when focused
 * - only the tile whose state actually changed is animated each keystroke
 * - on success/error every tile flips with a staggered delay
 */
export function WordleTiles({ password, showPassword, status, isFocused }) {
  const isSuccess  = status === "success";
  const isError    = status === "error";
  const isVerifying = status === "verifying";

  // ── Spring setup ──────────────────────────────────────────────────────────
  // Each spring is independent: rotateX 0 = front face, 180 = back face
  const [springs, api] = useSprings(MAX_TILES, () => ({
    rotateX: 0,
    config: { tension: 300, friction: 24 },
  }));

  // ── Track previous values to animate only what changed ───────────────────
  const prevLenRef    = useRef(0);
  const prevStatusRef = useRef("idle");

  useEffect(() => {
    const len       = password.length;
    const prevLen   = prevLenRef.current;
    const prevStatus = prevStatusRef.current;

    // ① Outcome: success or error → stagger-flip ALL tiles
    if ((isSuccess || isError) && prevStatus !== status) {
      api.start((i) => ({
        rotateX: 180,
        delay: i * 75,
        config: { tension: 260, friction: 20 },
      }));
    }
    // ② Back to idle (after error reset) → stagger-unflip ALL tiles
    else if (status === "idle" && (prevStatus === "error" || prevStatus === "success")) {
      api.start((i) => ({
        rotateX: 0,
        delay: i * 35,
        config: { tension: 300, friction: 26 },
      }));
    }
    // ③ Normal typing
    else if (status === "idle" || status === "verifying") {
      if (len > prevLen && len <= MAX_TILES) {
        // Character added → flip ONLY tile [len-1] to back face
        api.start((i) =>
          i === len - 1
            ? { rotateX: 180, config: { tension: 310, friction: 22 } }
            : {}          // ← empty object = no change for other tiles
        );
      } else if (len < prevLen) {
        // Character removed → flip ONLY tile [len] back to front face
        const flippedTile = Math.min(prevLen - 1, MAX_TILES - 1);
        api.start((i) =>
          i === flippedTile
            ? { rotateX: 0, config: { tension: 330, friction: 26 } }
            : {}
        );
      }
    }

    prevLenRef.current    = len;
    prevStatusRef.current = status;
  }, [password, status, isSuccess, isError, api]);

  // ── Derived display info per tile ─────────────────────────────────────────
  const displaySource = isSuccess ? "CORRECTO" : isError ? "INCORREC" : password;

  // The "active" tile: next slot to receive a character
  const activeTileIdx = Math.min(password.length, MAX_TILES - 1);

  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        justifyContent: "center",
        margin: "22px 0 12px",
      }}
    >
      {springs.map(({ rotateX }, i) => {
        const isFilled   = i < Math.min(password.length, MAX_TILES) || isSuccess || isError;
        const isActive   = isFocused && !isSuccess && !isError && i === activeTileIdx && password.length < MAX_TILES;
        const displayChar = displaySource[i] || "";

        // Back face colour: changes only when status changes, not per-keystroke colour leak
        const backBg = isError
          ? "#dc2626"          // red
          : isSuccess
          ? "#16a34a"          // green
          : isVerifying
          ? "#6366f1"          // indigo
          : "#1e1b4b";         // deep navy for normal typing

        return (
          <div
            key={i}
            style={{ position: "relative", width: 36, height: 42, flexShrink: 0 }}
          >
            {/* ── FRONT FACE ── shown when rotateX ≈ 0 ── */}
            <animated.div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 7,
                // Active (cursor) tile gets a highlighted border
                background: isActive
                  ? "rgba(30,27,75,0.05)"
                  : "rgba(0,0,0,0.035)",
                border: isActive
                  ? "2px solid rgba(30,27,75,0.55)"
                  : isFilled
                  ? "2px solid rgba(30,27,75,0.3)"
                  : "2px solid rgba(0,0,0,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: rotateX.to((v) => `perspective(400px) rotateX(${v}deg)`),
              }}
            >
              {/* Blinking cursor on the active tile */}
              {isActive && (
                <span className="wordle-cursor">|</span>
              )}
            </animated.div>

            {/* ── BACK FACE ── shown when rotateX ≈ 180 ── */}
            <animated.div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 7,
                background: backBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: isSuccess || isError ? 13 : 18,
                fontWeight: 800,
                letterSpacing: isSuccess || isError ? 0.5 : 1,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: rotateX.to((v) => `perspective(400px) rotateX(${180 - v}deg)`),
                boxShadow: "0 2px 8px rgba(0,0,0,0.16)",
                textShadow: "0 1px 3px rgba(0,0,0,0.2)",
                userSelect: "none",
              }}
            >
              {isFilled
                ? isSuccess || isError
                  ? displayChar
                  : showPassword
                  ? displayChar
                  : "•"
                : ""}
            </animated.div>
          </div>
        );
      })}
    </div>
  );
}
