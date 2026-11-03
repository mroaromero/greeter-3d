import { useEffect } from "react";
import { useControls } from "leva";
import { Center, MeshTransmissionMaterial, Text3D, Float } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";

export function HelloWorld({ onTriggerLogin }) {
  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  const config = useControls({
    samples: { value: 16, min: 1, max: 32, step: 1 },
    resolution: { value: 256, min: 64, max: 2048, step: 64 },
    transmission: { value: 0.95, min: 0, max: 1 },
    roughness: { value: 0.1, min: 0, max: 1, step: 0.01 },
    clearcoat: { value: 0.1, min: 0, max: 1, step: 0.01 },
    clearcoatRoughness: { value: 0.1, min: 0, max: 1, step: 0.01 },
    thickness: { value: 200, min: 0, max: 200, step: 0.01 },
    backsideThickness: { value: 200, min: 0, max: 200, step: 0.01 },
    ior: { value: 1.5, min: 1, max: 5, step: 0.01 },
    chromaticAberration: { value: 1, min: 0, max: 1 },
    anisotropy: { value: 1, min: 0, max: 10, step: 0.01 },
    distortion: { value: 0, min: 0, max: 1, step: 0.01 },
    distortionScale: { value: 0.2, min: 0.01, max: 1, step: 0.01 },
    temporalDistortion: { value: 0, min: 0, max: 1, step: 0.01 },
    attenuationDistance: { value: 0.5, min: 0, max: 10, step: 0.01 },
    attenuationColor: "#000000",
    color: "#000000",
  });

  const handleClick = (e) => {
    e.stopPropagation();
    if (onTriggerLogin) onTriggerLogin();
  };

  const handlePointerOver = (e) => {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    document.body.style.cursor = "auto";
  };

  return (
    <RigidBody linearDamping={0.75} angularDamping={0.15} friction={0.2} colliders="cuboid" dispose={null}>
      <Center rotation={[0.2, -0.2, 0]}>
        <Float
          speed={2.4}
          rotationIntensity={1.4}
          floatIntensity={1.4}
          floatingRange={[0, -0.1]}
        >
          {/* Expanded transparent hit area ensuring 100% click registration */}
          <mesh
            position={[0, 0, 0]}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <boxGeometry args={[9, 4.5, 3]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          <Text3D
            curveSegments={32}
            bevelEnabled
            bevelSize={0.04}
            bevelThickness={0.2}
            height={0.5}
            lineHeight={0.6}
            letterSpacing={-0.06}
            size={1.5}
            font="./inter_bold.json"
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            {`Hellø\nWørld`}
            <MeshTransmissionMaterial {...config} color={config.color} toneMapped={false} />
          </Text3D>
        </Float>
      </Center>
    </RigidBody>
  );
}
