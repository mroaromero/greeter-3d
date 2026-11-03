import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { ClockWeatherWidget } from "./sddm/ClockWeatherWidget";
import { KeyCap } from "./sddm/KeyCap";

/**
 * Stand-in for the real session.
 *
 * The greeter hands the screen over to this layer after a successful login.
 * It is deliberately a mock: the greetd/PAM bridge will replace it with the
 * actual Hyprland session, and until then it is what the wipe reveals.
 */
export function DesktopSurface({ onExit, userName = "Manuel Roa", userHandle = "lad-manu" }) {
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onExitRef.current?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="desktop" role="region" aria-label="Escritorio">
      <header className="desktop__bar">
        <div className="desktop__session">
          <span className="desktop__dot" aria-hidden="true" />
          <span className="desktop__user">{userName}</span>
          <span className="desktop__handle">@{userHandle}</span>
        </div>
        <ClockWeatherWidget />
      </header>

      <main className="desktop__stage">
        <section className="desktop__window">
          <div className="desktop__window-bar" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="desktop__window-body">
            <p className="desktop__eyebrow">Sesión iniciada</p>
            <h2 className="desktop__title">Escritorio</h2>
            <p className="desktop__text">
              Acá arrancaría Hyprland. Esta capa es solo el destino de la transición
              mientras el greeter sigue siendo un prototipo.
            </p>
          </div>
        </section>
      </main>

      <footer className="desktop__hint">
        <KeyCap variant="esc" />
        <span className="desktop__hint-label">para volver al greeter</span>
      </footer>
    </div>
  );
}

DesktopSurface.propTypes = {
  onExit: PropTypes.func,
  userName: PropTypes.string,
  userHandle: PropTypes.string,
};
