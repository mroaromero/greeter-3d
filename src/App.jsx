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

THREE.ColorManagement.legacyMode = false;
const spheres = [...Array(45)].map(() => ({
  scale: [0.75, 0.75, 1, 1, 1.25][Math.floor(Math.random() * 5)],
}));

export const App = () => {
  // Torus geometry by default
  const [geometryType] = useState("Torus");
  const [isDispersed, setIsDispersed] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [scatterSignal, setScatterSignal] = useState(0);
  const loginTimerRef = useRef(null);

  // Drop any pending "open the card" timer if the app unmounts.
  useEffect(() => {
    return () => {
      if (loginTimerRef.current) clearTimeout(loginTimerRef.current);
    };
  }, []);

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

  const handleCloseLogin = () => {
    if (loginTimerRef.current) clearTimeout(loginTimerRef.current);
    setIsLoginOpen(false);
    setIsDispersed(false);
  };

  const handleLoginSuccess = () => {
    // Keep login open with success feedback
  };

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
              geometryType={geometryType}
              isDispersed={isDispersed}
              scatterSignal={scatterSignal}
            />
          ))}
          <Physics gravity={[0, 0, 0]}>
            <HelloWorld
              onTriggerLogin={handleTriggerLogin}
              isLoginOpen={isLoginOpen}
            />
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
    </>
  );
};
