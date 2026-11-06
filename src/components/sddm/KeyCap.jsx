import PropTypes from "prop-types";

/**
 * Physical keycap glyphs used in the login hints.
 *
 * These are drawn as keycaps — not plain text — so the hint reads as a piece of
 * hardware: a beveled Enter key with the return arrow, and the Esc key with its
 * label. The press effect comes from the CSS `box-shadow` stack in styles.css.
 */
export function KeyCap({ variant = "enter" }) {
  if (variant === "esc") {
    return (
      <span className="keycap keycap--esc" role="img" aria-label="Tecla Esc">
        esc
      </span>
    );
  }

  if (variant === "space") {
    return (
      <span
        className="keycap keycap--space"
        role="img"
        aria-label="Tecla Espacio"
      >
        space
      </span>
    );
  }

  return (
    <span className="keycap keycap--enter" role="img" aria-label="Tecla Enter">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="9 10 4 15 9 20" />
        <path d="M20 4v7a4 4 0 0 1-4 4H4" />
      </svg>
    </span>
  );
}

KeyCap.propTypes = {
  variant: PropTypes.oneOf(["enter", "esc", "space"]),
};
