import React from "react";
import PropTypes from "prop-types";
import { HoldButton } from "./HoldButton";

/* ── Iconos universales del sistema ─────────────────────────────────────── */
/* Símbolos estándar que se reconocen a simple vista (stroke line rounded). */

const ICON_POWER = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="7" />
    <path d="M12 4v3" />
  </svg>
);

const ICON_RESTART = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v7M12 12l3-3M12 12l-3-3" />
    <path d="M12 21v-7M12 14l3 3M12 14l-3 3" />
  </svg>
);

const ICON_SUSPEND = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3v18" />
    <path d="M18 3v18" />
  </svg>
);

const ICON_CHECK = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/**
 * System action buttons: power off, restart, suspend.
 *
 * Hold-to-confirm circles (react-bits HoldButton adapted): press and hold
 * ~2s to fire the action; releasing early cancels. The violet fill (#7c5cff)
 * rises while holding and the icon swaps to a check when it confirms,
 * harmonized with the greeter palette (dark indigo #201c33 base).
 */
export function SystemButtons({ onPowerOff, onRestart, onSuspend }) {
  const actions = [
    { type: "power", label: "Apagar", icon: ICON_POWER, action: onPowerOff },
    { type: "restart", label: "Reiniciar", icon: ICON_RESTART, action: onRestart },
    { type: "suspend", label: "Suspender", icon: ICON_SUSPEND, action: onSuspend },
  ];

  return (
    <div className="sys-btns">
      {actions.map(({ type, label, icon, action }) => (
        <HoldButton
          key={type}
          className="sys-power-btn"
          ariaLabel={label}
          title={label}
          srHint={`${label}: mantené presionado para confirmar`}
          icon={icon}
          doneIcon={ICON_CHECK}
          backgroundColor="#201c33"
          fillColor="#7c5cff"
          textColor="#f5f5f5"
          fillTextColor="#ffffff"
          radius={999}
          holdTime={2000}
          releaseTime={200}
          fillDirection="up"
          wave
          waveAmplitude={6}
          glow
          resetAfter={1200}
          onHold={action}
        />
      ))}
    </div>
  );
}

SystemButtons.propTypes = {
  onPowerOff: PropTypes.func,
  onRestart: PropTypes.func,
  onSuspend: PropTypes.func,
};