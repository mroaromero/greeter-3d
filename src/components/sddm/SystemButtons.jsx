import { useState, useRef, useCallback, useEffect } from "react";
import PropTypes from "prop-types";

/* ── Iconos universales del sistema ─────────────────────────────────────── */
/* Símbolos estándar que se reconocen a simple vista.                      */

const ICON_POWER = (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="7" />
    <path d="M12 4v3" />
  </svg>
);

const ICON_RESTART = (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v7M12 12l3-3M12 12l-3-3" />
    <path d="M12 21v-7M12 14l3 3M12 14l-3 3" />
  </svg>
);

const ICON_SUSPEND = (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3v18" />
    <path d="M18 3v18" />
  </svg>
);

/**
 * System action buttons: power off, restart, suspend.
 *
 * Icon-only prism-edge buttons with universal system symbols.
 * Click once to arm a 5-second countdown; click again to cancel.
 * After 5s the corresponding callback fires.
 */
export function SystemButtons({ onPowerOff, onRestart, onSuspend }) {
  const [countdown, setCountdown] = useState({
    power: 0,
    restart: 0,
    suspend: 0,
  });
  const intervals = useRef({
    power: null,
    restart: null,
    suspend: null,
  });

  const clearTimer = useCallback((type) => {
    if (intervals.current[type]) {
      clearInterval(intervals.current[type]);
      intervals.current[type] = null;
    }
    setCountdown((prev) => ({ ...prev, [type]: 0 }));
  }, []);

  useEffect(() => {
    return () => {
      Object.keys(intervals.current).forEach((key) => {
        if (intervals.current[key]) clearInterval(intervals.current[key]);
      });
    };
  }, []);

  const handleClick = useCallback((type, onAction) => {
    if (countdown[type] > 0) {
      clearTimer(type);
      return;
    }

    setCountdown((prev) => ({ ...prev, [type]: 5 }));
    intervals.current[type] = setInterval(() => {
      setCountdown((prev) => {
        const val = prev[type];
        if (val === null || val === undefined || val <= 1) {
          clearInterval(intervals.current[type]);
          intervals.current[type] = null;
          onAction?.();
          return { ...prev, [type]: 0 };
        }
        return { ...prev, [type]: val - 1 };
      });
    }, 1000);
  }, [countdown, clearTimer]);

  const getIcon = (type) => {
    switch (type) {
      case "power": return ICON_POWER;
      case "restart": return ICON_RESTART;
      case "suspend": return ICON_SUSPEND;
      default: return null;
    }
  };

  const getLabel = (type) => {
    switch (type) {
      case "power": return "Apagar";
      case "restart": return "Reiniciar";
      case "suspend": return "Suspender";
      default: return "";
    }
  };

  const getAction = (type) => {
    switch (type) {
      case "power": return onPowerOff;
      case "restart": return onRestart;
      case "suspend": return onSuspend;
      default: return undefined;
    }
  };

  return (
    <div className="sys-btns">
      {["suspend", "restart", "power"].map((type) => {
        const secs = countdown[type];
        const isCounting = secs > 0;
        const Icon = getIcon(type);
        const onAction = getAction(type);
        return (
          <button
            key={type}
            className={`sys-btn sys-btn--${type} ${isCounting ? "sys-btn--counting" : ""}`}
            onClick={() => handleClick(type, onAction)}
            title={getLabel(type)}
            aria-label={getLabel(type)}
          >
            {isCounting ? (
              <span className="sys-btn-countdown">{secs}</span>
            ) : (
              Icon
            )}
          </button>
        );
      })}
    </div>
  );
}

SystemButtons.propTypes = {
  onPowerOff: PropTypes.func,
  onRestart: PropTypes.func,
  onSuspend: PropTypes.func,
};
