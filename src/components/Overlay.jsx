import React, { useState } from "react";
import { PasswordLoginCard } from "./sddm/PasswordLoginCard";
import { SystemButtons } from "./sddm/SystemButtons";
import { KeyCap } from "./sddm/KeyCap";

const OVERLAY_POINTER_EVENTS = "none";

const Overlay = ({ isDispersed = false, isLoginOpen = false, onTriggerLogin, onCloseLogin, onLoginSuccess }) => {
  // Feedback visual para acciones del sistema (power / restart / suspend)
  const [systemAction, setSystemAction] = useState(null); // null | { type: 'power'|'restart'|'suspend', message: string }

  const handleSystemAction = (type) => {
    const labels = { power: "Apagando…", restart: "Reiniciando…", suspend: "Suspendiendo…" };
    setSystemAction({ type, message: labels[type] });
    // Auto-clear la notificación tras 3 segundos
    setTimeout(() => setSystemAction(null), 3000);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        padding: 40,
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      {/* Top Bar Header Area */}
      <div
        style={{
          width: "100%",
          padding: 0,
          display: "inline-flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          id="heading"
          style={{
            fontFamily: "'Antonio', sans-serif",
            flex: "1 1 0%",
            height: 30,
            fontSize: 50,
            fontWeight: "700",
            lineHeight: "30px",
            color: "black",
            letterSpacing: -2,
          }}
        />
        <div style={{ flex: "1 1 0%", display: "flex", gap: "2em" }} />
      </div>

      <div style={{ height: 60 }} />

      {/* Middle Flexible Spacer */}
      <div
        className="full"
        style={{
          fontFamily: "'Antonio', sans-serif",
          width: "100%",
          padding: 0,
          flex: "3 1 0%",
          display: "inline-flex",
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      />

      <div style={{ height: 60 }} />

      {/* Bottom Action Prompt */}
      <div
        style={{
          pointerEvents: isDispersed || isLoginOpen ? "none" : "all",
          width: "100%",
          padding: 0,
          display: "inline-flex",
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "center",
          flex: "1 1 0%",
          opacity: isDispersed || isLoginOpen ? 0 : 1,
          transition: "opacity 0.4s ease",
        }}
      >
        <p className="full" style={{ whiteSpace: "nowrap", flex: "1 1 0%", fontSize: 12, lineHeight: "1.5em", color: "black" }} />
        <div style={{ width: 10 }} />
        <p
          id="text"
          className="blink-prompt"
          onClick={onTriggerLogin}
          style={{
            fontFamily: "'Antonio', sans-serif",
            flex: "1 1 0%",
            fontSize: 16,
            fontWeight: "700",
            lineHeight: "1em",
            textAlign: "center",
            color: "black",
            letterSpacing: 2,
            whiteSpace: "nowrap",
            cursor: "pointer",
          }}
        >
          HAZ CLICK O PRESIONA <KeyCap variant="enter" /> /{" "}
          <KeyCap variant="space" /> PARA ACCEDER
        </p>
        <div style={{ width: 10 }} />
        <p className="full" style={{ flex: "1 1 0%", fontSize: 12, lineHeight: "1em", textAlign: "right", color: "black" }} />
      </div>

      {/* SDDM Password Card Centered Modal */}
      {isLoginOpen && (
        <div style={{ pointerEvents: "all" }}>
          <PasswordLoginCard
            onClose={onCloseLogin}
            onLoginSuccess={onLoginSuccess}
            userName="Manuel Roa"
            userHandle="lad-manu"
          />
          <SystemButtons
            onPowerOff={() => handleSystemAction("power")}
            onRestart={() => handleSystemAction("restart")}
            onSuspend={() => handleSystemAction("suspend")}
          />
        </div>
      )}

      {/* Notificación de acción del sistema */}
      {systemAction && (
        <div
          className="sys-notification"
          style={{
            position: "fixed",
            top: 40,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 200,
            animation: "sysNotifSlide 0.3s ease forwards",
          }}
        >
          <div
            className="sys-notification__badge"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 20px",
              background: "rgba(11, 9, 18, 0.95)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: 9999,
              color: "#f8fafc",
              boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
            }}
          >
            <span style={{ fontSize: 16 }}>{systemAction.type === "power" ? "⏻" : systemAction.type === "restart" ? "⟳" : "⏸"}</span>
            <span
              style={{
                fontFamily: "'Antonio', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}
            >
              {systemAction.message}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Overlay;
