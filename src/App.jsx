import * as THREE from "three";
import { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import { Physics } from "@react-three/rapier";
import { Leva, useControls } from "leva";
import { Bubble } from "./components/Sphere";
import { HelloWorld } from "./components/HelloWorld";
import { Pointer } from "./components/Pointer";
import { WatercolorBackground } from "./components/WatercolorBackground";
import Overlay from "./components/Overlay";
import { LoginTransition } from "./components/LoginTransition";
import { DesktopSurface } from "./components/DesktopSurface";

THREE.ColorManagement.legacyMode = false;
const spheres = [...Array(45)].map(() => ({
  scale: [0.75, 0.75, 1, 1, 1.25][Math.floor(Math.random() * 5)],
}));

// Greeter → desktop is a four-pass curtain. Each session state maps to the
// wipe pass that must be on screen; `idle` parks the panel off-screen.
const PASS_BY_SESSION = {
  covering: "cover",
  revealing: "reveal",
  desktop: "reveal",
  returning: "returnCover",
  returned: "returnReveal",
};

const DESKTOP_SESSIONS = new Set(["revealing", "desktop", "returning"]);

export const App = () => {
  const [isDispersed, setIsDispersed] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [scatterSignal, setScatterSignal] = useState(0);
  // greeter | covering | revealing | desktop | returning | returned
  const [session, setSession] = useState("greeter");
  const loginTimerRef = useRef(null);

  // Drop any pending "open the card" timer if the app unmounts.
  useEffect(() => {
    return () => {
      if (loginTimerRef.current) clearTimeout(loginTimerRef.current);
    };
  }, []);

  // Referencia siempre fresca al handler de apertura (inicializada abajo).
  useEffect(() => {
    triggerRef.current = handleTriggerLogin;
  });

  // Enter / Space abren el login desde el greeter (además del click en el
  // prompt). Inerte cuando la card está abierta o dispersando, fuera del
  // greeter, o cuando el foco está en un control (password, botón de sistema).
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const target = event.target;
      if (target?.closest?.("button, input, textarea, [role='button']")) return;
      if (session !== "greeter" || isLoginOpen || isDispersed) return;
      event.preventDefault();
      triggerRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [session, isLoginOpen, isDispersed]);

  const { aoColor, directionalLightColor, spotLightColor, bgColor } = useControls({
    aoColor: "#5b41aa",
    directionalLightColor: "#9687ff",
    spotLightColor: "#2e2155",
    bgColor: "#ffffff",
  });

  const handleTriggerLogin = () => {
    // 1. Immediately trigger the 3D dispersion animation and hide bottom prompt
    setIsDispersed(true);
    setScatterSignal((prev) => prev + 1);

    if (loginTimerRef.current) clearTimeout(loginTimerRef.current);

    // 2. Wait exactly 2 seconds of clean 3D dispersion before showing the login card
    loginTimerRef.current = setTimeout(() => {
      setIsLoginOpen(true);
    }, 2000);
  };

  const triggerRef = useRef(handleTriggerLogin);

  const handleCloseLogin = () => {
    if (loginTimerRef.current) clearTimeout(loginTimerRef.current);
    setIsLoginOpen(false);
    setIsDispersed(false);
  };

  const handleLoginSuccess = () => {
    // Start the curtain. The card stays mounted underneath until the cover
    // pass lands, so the hand-off has no visible gap.
    setSession("covering");
  };

  const handleCovered = () => {
    // Greeter is hidden: close the card, send the bubbles back home and mount
    // the desktop underneath the still-covering panel.
    setIsLoginOpen(false);
    setIsDispersed(false);
    setSession("revealing");
  };

  const handleRevealed = () => setSession("desktop");

  const handleDesktopExit = () => {
    if (session === "desktop") setSession("returning");
  };

  const handleReturnCovered = () => {
    // The panel covers the desktop again: drop it and let the greeter show.
    setSession("returned");
  };

  const handleReturned = () => setSession("greeter");

  return (
    <>
      <Leva hidden />
      <Canvas
        shadows
        gl={{ alpha: true, stencil: false, depth: false, antialias: false }}
        camera={{ position: [0, 0, 20], fov: 32.5, near: 1, far: 100 }}
        onCreated={(state) => {
          state.gl.toneMappingExposure = 1.5;

          // E2E observation bridge. Only in dev, and only when explicitly
          // requested with ?e2e=1, so it never ships in a build.
          if (
            import.meta.env.DEV &&
            new URLSearchParams(window.location.search).has("e2e")
          ) {
            const tmp = new THREE.Vector3();
            window.__greeterDebug = {
              bubbles: () => {
                const out = [];
                state.scene.traverse((object) => {
                  if (object.userData?.kind === "bubble") {
                    object.getWorldPosition(tmp);
                    out.push({ x: tmp.x, y: tmp.y, z: tmp.z });
                  }
                });
                return out;
              },
            };
          }
        }}
      >
        <WatercolorBackground bgColor={bgColor} />
        <ambientLight intensity={1} />
        <spotLight
          position={[20, 20, 25]}
          penumbra={1}
          angle={0.2}
          color={spotLightColor}
          castShadow
          shadow-mapSize={[512, 512]}
        />
        <directionalLight position={[0, 5, -4]} intensity={4} color={directionalLightColor} />
        <directionalLight position={[0, -15, 0]} intensity={4} color={directionalLightColor} />
        
        <Physics colliders gravity={[0, 0, 0]}>
          <Pointer />
          {spheres.map((props, i) => (
            <Bubble
              key={i}
              index={i}
              {...props}
              isDispersed={isDispersed}
              scatterSignal={scatterSignal}
            />
          ))}
          <Physics gravity={[0, 0, 0]}>
            <HelloWorld onTriggerLogin={handleTriggerLogin} />
          </Physics>
        </Physics>

        <Environment files="/adamsbridge.hdr" />
        <EffectComposer disableNormalPass multisampling={0}>
          <N8AO color={aoColor} aoRadius={1} intensity={1} />
        </EffectComposer>
      </Canvas>

      <Overlay
        isDispersed={isDispersed}
        isLoginOpen={isLoginOpen}
        onTriggerLogin={handleTriggerLogin}
        onCloseLogin={handleCloseLogin}
        onLoginSuccess={handleLoginSuccess}
      />

      {DESKTOP_SESSIONS.has(session) && (
        <DesktopSurface onExit={handleDesktopExit} userName="Manuel Roa" userHandle="lad-manu" />
      )}

      <LoginTransition
        pass={PASS_BY_SESSION[session] ?? "idle"}
        onCovered={handleCovered}
        onRevealed={handleRevealed}
        onReturnCovered={handleReturnCovered}
        onReturned={handleReturned}
      />
    </>
  );
};
