import { useState, useEffect, useRef, useCallback } from "react";
import { WordleTiles } from "./WordleTiles";
import { KeyCap } from "./KeyCap";
import { ClockWeatherWidget } from "./ClockWeatherWidget";
import { FlameWrap } from "../canvasui/FlameWrap";

// FlameWrap (Canvas UI): borde de fuego WebGL alrededor de la card. Config base
// = demo oficial de canvasui.dev, ajustada: radius 40 > la card (32px) para que
// el arco redondeado de la card se vea dentro del fuego (la esquina no queda
// tapada), melt reducido para morder menos el canto, y colorCycle mueve un
// gradiente de hue que viaja por el borde: en el shader el color de cada llama
// depende de su ángulo alrededor de la card (2 ciclos por vuelta) + el tiempo
// (uRealTime), como un arcoíris móvil (~7.9s por tour completo).
// En navegadores sin la API experimental html-in-canvas (QtWebEngine/SDDM, p.ej.)
// las llamas se dibujan igual alrededor de la silueta, sin capturar el contenido.
const FLAME_PROPS = {
  intensity: 0.5,
  height: 170,
  spread: 8,
  radius: 40,
  speed: 0.25,
  scale: 0.75,
  turbulence: 0.5,
  turbulenceScale: 0.5,
  turbulenceReach: 25,
  sparks: 1.5,
  sparkSize: 0.35,
  sparkDensity: 1,
  sparkSpeed: 1,
  rim: 2.5,
  melt: 2.5,
  distortion: 10,
  smoke: 1.5,
  ember: 2,
  scorch: 0,
  color: [0.3059, 0.5373, 1],
  colorCycle: 0.8,
};

// Demo credential, until the greetd/PAM bridge replaces this check.
// 10 characters on purpose: it exercises the sliding window (> 8 tiles) and the
// strip rewind when the outcome word takes over the row.
const DEMO_PASSWORD = "1111111111";

export function PasswordLoginCard({ onClose, onLoginSuccess, userName = "Manuel Roa", userHandle = "lad-manu" }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle"); // 'idle' | 'verifying' | 'error' | 'success'
  const [errorMessage, setErrorMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Every timer is tracked so it can be cancelled on unmount. Without this,
  // closing the card mid-verification still mutated state of a dead component.
  const timersRef = useRef(new Set());
  const schedule = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id);
      fn();
    }, ms);
    timersRef.current.add(id);
    return id;
  }, []);
  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current.clear();
    },
    []
  );

  // Hold the latest onClose without re-subscribing on every parent render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Escape closes the card. Mount-only: no dependency on parent identity,
  // so this never steals focus back by re-running the autofocus below.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCloseRef.current?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-focus the hidden input once, on mount only.
  useEffect(() => {
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, []);

  // After error: wait for tile animation → reset to idle + clear password
  const handleErrorReset = () => {
    schedule(() => {
      setStatus("idle");
      setPassword("");
      schedule(() => inputRef.current?.focus(), 50);
    }, 1600);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setStatus("error");
      setErrorMessage("Ingresa tu contraseña");
      handleErrorReset();
      return;
    }

    setStatus("verifying");

    // Simulate PAM authentication (~600ms)
    schedule(() => {
      if (password !== DEMO_PASSWORD) {
        setStatus("error");
        setErrorMessage("Contraseña incorrecta");
        handleErrorReset();
      } else {
        setStatus("success");
        // let success tiles animate fully before leaving
        schedule(() => onLoginSuccess?.(), 2200);
      }
    }, 600);
  };

  // Re-focus hidden input when clicking the tile area
  const handleTileAreaClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="sddm-overlay-backdrop">
      <FlameWrap className="sddm-flame" {...FLAME_PROPS}>
      <div className={`sddm-card ${status === "error" ? "sddm-shake" : ""}`}>

        {/* Close button */}
        <button
          className="sddm-close-btn"
          onClick={onClose}
          title="Regresar (Esc)"
          aria-label="Cerrar login"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Avatar + identity, with the clock/date/weather tile on the right */}
        <div className="sddm-hero">
          <div className="sddm-identity">
            <div className="sddm-avatar-container">
              <div className="sddm-avatar"><span>MR</span></div>
              <div className="sddm-status-dot" title="En línea" />
            </div>

            <div className="sddm-user-info">
              <h2 className="sddm-username">{userName}</h2>
              <span className="sddm-userhandle">@{userHandle}</span>
            </div>
          </div>

          <ClockWeatherWidget />
        </div>

        {/* Password form */}
        <form onSubmit={handleSubmit} className="sddm-form">

          {/* Label above tiles */}
          <p className="sddm-field-label">Contraseña</p>

          {/* Wordle tile row */}
          <div
            onClick={handleTileAreaClick}
            style={{ cursor: "text", userSelect: "none", width: "100%" }}
          >
            <WordleTiles
              password={password}
              showPassword={showPassword}
              status={status}
              isFocused={isFocused}
            />
          </div>

          {/* Hidden native input — sole keyboard event capture */}
          <input
            ref={inputRef}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={status === "verifying" || status === "success" || status === "error"}
            style={{
              position: "absolute",
              opacity: 0,
              pointerEvents: "none",
              width: 1,
              height: 1,
              border: "none",
              padding: 0,
            }}
            aria-label="Contraseña"
            autoComplete="current-password"
          />

          {/* Action row: toggle + submit */}
          <div className="sddm-action-row">
            <button
              type="button"
              className="sddm-toggle-pwd"
              onClick={() => setShowPassword(!showPassword)}
              // Keep focus on the hidden input so the caret stays visible.
              onMouseDown={(e) => e.preventDefault()}
              title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              disabled={status === "verifying" || status === "success" || status === "error"}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>

            <button
              type="submit"
              disabled={status === "verifying" || status === "success" || status === "error"}
              onMouseDown={(e) => e.preventDefault()}
              className="sddm-submit-btn"
              title="Iniciar sesión (Enter)"
            >
              {status === "verifying" ? (
                <span className="sddm-spinner" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </button>
          </div>

          {/* Feedback / hints */}
          {status === "error" && (
            <p className="sddm-feedback-msg error">{errorMessage}</p>
          )}
          {status === "success" && (
            <p className="sddm-feedback-msg success">✓ Sesión iniciada</p>
          )}
          {status === "verifying" && (
            <p className="sddm-hint-text">Verificando…</p>
          )}
          {/* Keycaps replace the old "Enter"/"Esc" literals; the labels reuse the
              Antonio / black treatment of the main prompt for contrast. */}
          {status === "idle" && (
            <div className="sddm-hint-keys">
              <span className="sddm-hint-item">
                <KeyCap variant="enter" />
                <span className="sddm-hint-label">para acceder</span>
              </span>
              <span className="sddm-hint-sep" aria-hidden="true" />
              <span className="sddm-hint-item">
                <KeyCap variant="esc" />
                <span className="sddm-hint-label">para cancelar</span>
              </span>
            </div>
          )}
        </form>
      </div>
      </FlameWrap>
    </div>
  );
}
