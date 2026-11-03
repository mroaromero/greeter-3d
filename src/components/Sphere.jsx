import * as THREE from "three";
import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { BallCollider, RigidBody, CylinderCollider } from "@react-three/rapier";

const geometryTypes = {
  Sphere: new THREE.SphereGeometry(0.7, 32, 32),
  Box: new THREE.BoxGeometry(1, 1, 1),
  Cone: new THREE.ConeGeometry(0.7, 2, 32),
  Cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1.2, 32),
  Dodecahedron: new THREE.DodecahedronGeometry(0.8),
  Icosahedron: new THREE.IcosahedronGeometry(1),
  Octahedron: new THREE.OctahedronGeometry(1),
  Tetrahedron: new THREE.TetrahedronGeometry(1),
  Torus: new THREE.TorusGeometry(0.7, 0.3, 32, 64),
};

function getRandomColor() {
  return new THREE.Color(Math.random(), Math.random(), Math.random());
}

export function Bubble({
  vec = new THREE.Vector3(),
  scale = 1,
  index = 0,
  r = THREE.MathUtils.randFloatSpread,
  geometryType = "Torus",
  isDispersed = false,
  scatterSignal = 0,
}) {
  const api = useRef();

  // Assign this torus to one of the 4 screen corners:
  // 0: Top-Right, 1: Top-Left, 2: Bottom-Left, 3: Bottom-Right
  const cornerIndex = index % 4;

  // Stable organic offset around the assigned corner so they cluster nicely
  const cornerOffset = useMemo(() => {
    const angle = ((index * 137.5) * Math.PI) / 180;
    const radius = 0.5 + (index % 5) * 0.55;
    return new THREE.Vector3(
      Math.cos(angle) * radius * 1.3,
      Math.sin(angle) * radius * 1.1,
      ((index % 5) - 2) * 0.8
    );
  }, [index]);

  // Initial blast when scatterSignal fires
  useEffect(() => {
    if (scatterSignal > 0 && api.current) {
      const signX = cornerIndex === 0 || cornerIndex === 3 ? 1 : -1;
      const signY = cornerIndex === 0 || cornerIndex === 1 ? 1 : -1;
      
      const burstSpeed = 35 + Math.random() * 20;
      api.current.setLinvel(
        {
          x: signX * burstSpeed + (Math.random() - 0.5) * 10,
          y: signY * burstSpeed + (Math.random() - 0.5) * 10,
          z: (Math.random() - 0.5) * 10,
        },
        true
      );

      api.current.setAngvel(
        {
          x: (Math.random() - 0.5) * 18,
          y: (Math.random() - 0.5) * 18,
          z: (Math.random() - 0.5) * 18,
        },
        true
      );
    }
  }, [scatterSignal, cornerIndex]);

  useFrame((state, delta) => {
    if (!api.current) return;
    delta = Math.min(0.05, delta);
    const pos = api.current.translation();

    if (isDispersed) {
      // 4-CORNER DISPERSION LOGIC:
      // Dynamically calculate the 4 corners in 3D world units at z=0
      const vWidth = state.viewport.width;
      const vHeight = state.viewport.height;

      // Corner target positions
      // 0: Top-Right (+X, +Y)
      // 1: Top-Left (-X, +Y)
      // 2: Bottom-Left (-X, -Y)
      // 3: Bottom-Right (+X, -Y)
      const signX = cornerIndex === 0 || cornerIndex === 3 ? 1 : -1;
      const signY = cornerIndex === 0 || cornerIndex === 1 ? 1 : -1;

      const targetX = signX * (vWidth * 0.44) + cornerOffset.x;
      const targetY = signY * (vHeight * 0.42) + cornerOffset.y;
      const targetZ = cornerOffset.z;

      const dx = targetX - pos.x;
      const dy = targetY - pos.y;
      const dz = targetZ - pos.z;

      // Strong, smooth kinematic velocity pulling them directly into the 4 corners
      api.current.setLinvel(
        {
          x: dx * 4.2,
          y: dy * 4.2,
          z: dz * 4.2,
        },
        true
      );

      // Continuous subtle rotation in the corners
      api.current.setAngvel(
        {
          x: Math.sin(state.clock.elapsedTime * 1.5 + index) * 1.8,
          y: Math.cos(state.clock.elapsedTime * 1.5 + index) * 1.8,
          z: 1.0,
        },
        true
      );
    } else {
      // RESTING MODE: converge and accumulate gently in center around HelloWorld
      vec
        .set(pos.x, pos.y, pos.z)
        .normalize()
        .multiply({
          x: -50 * delta * scale,
          y: -150 * delta * scale,
          z: -50 * delta * scale,
        });
      api.current.applyImpulse(vec, true);
    }
  });

  const bubbleColor = useMemo(() => getRandomColor(), []);

  const bubbleMaterial = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        color: bubbleColor,
        emissive: "#7f2eff",
      }),
    [bubbleColor]
  );

  const activeGeometry = geometryTypes[geometryType] || geometryTypes.Torus;

  return (
    <RigidBody
      linearDamping={0.65}
      angularDamping={0.15}
      friction={0.2}
      position={[r(20), r(20) - 25, r(20) - 10]}
      ref={api}
      colliders="hull"
      dispose={null}
    >
      <BallCollider args={[scale * 0.9]} />
      <CylinderCollider
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 1.2 * scale]}
        args={[0.15 * scale, 0.275 * scale]}
      />
      <mesh
        castShadow
        receiveShadow
        scale={scale}
        geometry={activeGeometry}
        material={bubbleMaterial}
        raycast={() => null} // Prevent toruses from blocking raycasting clicks to Hello World
      />
    </RigidBody>
  );
}
