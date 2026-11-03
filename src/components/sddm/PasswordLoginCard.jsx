import React, { useState, useEffect, useRef, useCallback } from "react";
import { WordleTiles } from "./WordleTiles";

export function PasswordLoginCard({ onClose, onLoginSuccess, userName = "Manuel Roa", userHandle = "lad-manu" }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle"); // 'idle' | 'verifying' | 'error' | 'success'
  const [errorMessage, setErrorMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus input on mount; handle Escape to close
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      inputRef.current?.focus();
      setIsFocused(true);
    });
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // After error: wait for tile animation → reset to idle + clear password
  const handleErrorReset = () => {
    setTimeout(() => {
      setStatus("idle");
      setPassword("");
      setTimeout(() => {
        inputRef.current?.focus();
        setIsFocused(true);
      }, 50);
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
    setTimeout(() => {
      if (password === "error") {
        setStatus("error");
        setErrorMessage("Contraseña incorrecta");
        handleErrorReset();
      } else {
        setStatus("success");
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess();
        }, 2200); // let success tiles animate fully before leaving
      }
    }, 600);
  };

  // Re-focus hidden input when clicking the tile area
  const handleTileAreaClick = () => {
    inputRef.current?.focus();
    setIsFocused(true);
  };

  return (
    <div className="sddm-overlay-backdrop">
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

        {/* Avatar */}
        <div className="sddm-avatar-container">
          <div className="sddm-avatar"><span>MR</span></div>
          <div className="sddm-status-dot" title="En línea" />
        </div>

        {/* User info */}
        <div className="sddm-user-info">
          <h2 className="sddm-username">{userName}</h2>
          <span className="sddm-userhandle">@{userHandle}</span>
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
            />
          </div>

          {/* Hidden native input — sole keyboard event capture */}
          <input
            ref={inputRef}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
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
          {(status === "idle" || status === "verifying") && (
            <p className="sddm-hint-text">
              {status === "verifying"
                ? "Verificando…"
                : password.length === 0
                ? "Escribe tu contraseña y pulsa Enter"
                : `${password.length} carácter${password.length !== 1 ? "es" : ""} · Enter para acceder · Esc para cancelar`}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
