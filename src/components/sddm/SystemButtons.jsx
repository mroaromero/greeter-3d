import React from "react";
import PropTypes from "prop-types";
import { HoldButton } from "./HoldButton";
import { PowerOff, Restart, MoonSleep } from "reicon-react";

/* ── Iconos de sistema (@reicon-react, size 24) ──────────────────────── */
/* PowerOff | Restart | MoonSleep, en ese orden de derecha a izquierda. */

const ICON_POWER_OFF = <PowerOff size={24} />;
const ICON_RESTART = <Restart size={24} />;
const ICON_MOON_SLEEP = <MoonSleep size={24} />;

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
    { type: "suspend", label: "Suspender", icon: ICON_MOON_SLEEP, action: onSuspend },
    { type: "restart", label: "Reiniciar", icon: ICON_RESTART, action: onRestart },
    { type: "power", label: "Apagar", icon: ICON_POWER_OFF, action: onPowerOff },
  ];

  return (
    <div className="sys-btns">
      {actions.map(({ type, label, icon, action }) => (
        <div className="sys-btn-wrap" key={type}>
          <HoldButton
            className="sys-power-btn"
            ariaLabel={label}
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
          <span className="sys-tip" role="tooltip">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

SystemButtons.propTypes = {
  onPowerOff: PropTypes.func,
  onRestart: PropTypes.func,
  onSuspend: PropTypes.func,
};