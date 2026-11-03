import { useRef } from "react";
import PropTypes from "prop-types";
import { animated, easings, useReducedMotion, useTransition } from "@react-spring/web";

// A wipe is one full-screen panel whose clip-path grows and shrinks. The four
// passes are the reference demo's `from` / `enter` / `leave` polygons, split
// into two independent halves so the panel can run forward (greeter → desktop)
// and backward (desktop → greeter).
const COLLAPSED_LEFT = "polygon(0% 0%, 0% 100%, 0% 100%, 0% 0%)";
const FULL = "polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%)";
const COLLAPSED_RIGHT = "polygon(100% 0%, 100% 100%, 100% 100%, 100% 0%)";

const PASSES = {
  // No curtain: the panel parks on the left edge, zero area.
  idle: { from: COLLAPSED_LEFT, to: COLLAPSED_LEFT, duration: 0, edge: "right" },
  // Forward: cover the greeter from the left, then uncover the desktop to the right.
  cover: { from: COLLAPSED_LEFT, to: FULL, duration: 620, edge: "right" },
  reveal: { from: FULL, to: COLLAPSED_RIGHT, duration: 720, edge: "left" },
  // Backward: cover the desktop from the right, then uncover the greeter to the left.
  returnCover: { from: COLLAPSED_RIGHT, to: FULL, duration: 620, edge: "left" },
  returnReveal: { from: FULL, to: COLLAPSED_LEFT, duration: 720, edge: "right" },
};

const PASS_NAMES = Object.keys(PASSES);

/**
 * Curtain wipe between the greeter and the desktop.
 *
 * `useTransition` + `exitBeforeEnter` guarantee the reveal pass never starts
 * before the cover pass has landed: the two passes share the exact same edge
 * polygon, so the hand-off is seamless. The panel leaves instantly (no `leave`
 * animation) because it is already parked on the polygon the next pass starts
 * from.
 */
export function LoginTransition({ pass, onCovered, onRevealed, onReturnCovered, onReturned }) {
  const reducedMotion = useReducedMotion();

  // `onRest` also fires for the item that is being removed, and its payload is
  // the item that just left. Comparing against the current pass keeps the
  // hand-off callbacks from firing twice.
  const passRef = useRef(pass);
  passRef.current = pass;

  const callbacks = { cover: onCovered, reveal: onRevealed, returnCover: onReturnCovered, returnReveal: onReturned };
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const transitions = useTransition(pass, {
    from: (item) => ({ clipPath: PASSES[item].from }),
    enter: (item) => ({
      clipPath: PASSES[item].to,
      // A short beat between cover and reveal, so the covered frame registers.
      delay: item === "reveal" || item === "returnReveal" ? 120 : 0,
    }),
    config: (item) => ({
      duration: reducedMotion ? 0 : PASSES[item].duration,
      easing: easings.easeInOutCubic,
    }),
    exitBeforeEnter: true,
    onRest: (_result, _controller, item) => {
      if (item !== passRef.current) return;
      callbacksRef.current[item]?.();
    },
  });

  return (
    <div className="login-transition" aria-hidden="true">
      {transitions((style, item) => (
        <animated.div
          key={item}
          className="login-transition__panel"
          data-edge={PASSES[item].edge}
          style={style}
        />
      ))}
    </div>
  );
}

LoginTransition.propTypes = {
  pass: PropTypes.oneOf(PASS_NAMES),
  onCovered: PropTypes.func,
  onRevealed: PropTypes.func,
  onReturnCovered: PropTypes.func,
  onReturned: PropTypes.func,
};
