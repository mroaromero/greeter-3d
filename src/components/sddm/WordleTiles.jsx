import { useEffect, useRef } from "react";
import { useSprings, useSpring, animated } from "@react-spring/web";

// ── Grid constants ────────────────────────────────────────────────────────────
// The grid width is a design constant, exactly like Wordle's 5. The outcome
// words are chosen to fit it, never the other way around:
//   CORRECTO = 8 · DENEGADO = 8
const MAX_TILES = 8;

const TILE_W = 36;
const GAP = 6;
const STEP = TILE_W + GAP;
const VIEWPORT_W = MAX_TILES * TILE_W + (MAX_TILES - 1) * GAP;

/**
 * Wordle-style tile row.
 *
 * The row is a fixed-width viewport over a strip of tiles indexed by *absolute*
 * character position. Typing never re-maps content: the strip translates left
 * and the next tile flips in. That's what makes a password longer than
 * MAX_TILES work without freezing the display.
 *
 * - offset: keeps the caret (absolute index `len`) inside the viewport
 * - the caret only exists while there is somewhere to type
 * - on success/error the strip rewinds to 0 and spells the outcome word
 */
export function WordleTiles({ password, showPassword, status, isFocused }) {
  const isSuccess = status === "success";
  const isError = status === "error";
  const isVerifying = status === "verifying";
  const isOutcome = isSuccess || isError;
  const outcomeWord = isSuccess ? "CORRECTO" : isError ? "DENEGADO" : "";

  const len = password.length;
  const filledCount = isOutcome ? outcomeWord.length : len;

  // Once the password fills the grid, the caret becomes the last visible slot
  // and the strip slides one step per character.
  const offset = isOutcome ? 0 : Math.max(0, len - (MAX_TILES - 1));

  // Always keep one slot past the caret so there is somewhere to type into.
  const tileCount = Math.max(MAX_TILES, len + 1);

  const [springs, api] = useSprings(tileCount, () => ({
    rotateX: 0,
    config: { tension: 300, friction: 24 },
  }));

  const shift = useSpring({
    x: -offset * STEP,
    config: { tension: 300, friction: 32 },
  });

  const prevStatusRef = useRef("idle");

  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    const enteringOutcome = isOutcome && prevStatus !== status;
    const leavingOutcome = !isOutcome && (prevStatus === "success" || prevStatus === "error");
    const staggered = enteringOutcome || leavingOutcome;

    // Declarative: every tile targets the flip state its absolute index
    // implies. Only the tile that actually changes animates.
    api.start((i) => ({
      rotateX: i < filledCount ? 180 : 0,
      delay: staggered ? i * (enteringOutcome ? 75 : 35) : 0,
      config: enteringOutcome
        ? { tension: 260, friction: 20 }
        : { tension: 300, friction: 26 },
    }));
  }, [filledCount, status, isOutcome, api]);

  return (
    <div
      style={{
        width: VIEWPORT_W,
        overflow: "hidden",
        margin: "22px auto 12px",
        padding: "4px 0",
      }}
    >
      <animated.div
        style={{
          display: "flex",
          gap: GAP,
          transform: shift.x.to((v) => `translateX(${v}px)`),
        }}
      >
        {springs.map(({ rotateX }, i) => {
          const isFilled = i < filledCount;
          const isActive = isFocused && !isOutcome && !isVerifying && i === len;
          const displayChar = isOutcome ? outcomeWord[i] || "" : password[i] || "";

          // Back face colour: changes only when status changes, not per keystroke
          const backBg = isError
            ? "#dc2626"
            : isSuccess
            ? "#16a34a"
            : isVerifying
            ? "#6366f1"
            : "#1e1b4b";

          return (
            <div
              key={i}
              style={{ position: "relative", width: TILE_W, height: 42, flexShrink: 0 }}
            >
              {/* ── FRONT FACE ── shown when rotateX ≈ 0 ── */}
              <animated.div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 7,
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
                {isActive && <span className="wordle-cursor">|</span>}
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
                  fontSize: isOutcome ? 13 : 18,
                  fontWeight: 800,
                  letterSpacing: isOutcome ? 0.5 : 1,
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: rotateX.to((v) => `perspective(400px) rotateX(${180 - v}deg)`),
                  boxShadow: "0 2px 8px rgba(0,0,0,0.16)",
                  textShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  userSelect: "none",
                }}
              >
                {isFilled
                  ? isOutcome
                    ? displayChar
                    : showPassword
                    ? displayChar
                    : "•"
                  : ""}
              </animated.div>
            </div>
          );
        })}
      </animated.div>
    </div>
  );
}
