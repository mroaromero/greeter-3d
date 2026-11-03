import React from "react";
import { PasswordLoginCard } from "./sddm/PasswordLoginCard";

const Overlay = ({ isDispersed = false, isLoginOpen = false, onTriggerLogin, onCloseLogin, onLoginSuccess }) => {
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
          HAZ CLICK PARA INICIAR SESIÓN
        </p>
        <div style={{ width: 10 }} />
        <p className="full" style={{ flex: "1 1 0%", fontSize: 12, lineHeight: "1em", textAlign: "right", color: "black" }} />
      </div>

      {/* SDDM Password Card Centered Modal */}
      {isLoginOpen && (
        <PasswordLoginCard
          onClose={onCloseLogin}
          onLoginSuccess={onLoginSuccess}
          userName="Manuel Roa"
          userHandle="lad-manu"
        />
      )}
    </div>
  );
};

export default Overlay;
