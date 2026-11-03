import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D tDiffuse;
uniform sampler2D tPrevious;
uniform vec4 resolution;
uniform float uTime;
uniform float uSize;
uniform float uClearity;
uniform int uNoise;
uniform float uFadeSpeed;
uniform int uMixColours;
uniform vec3 uBgColor;
varying vec2 vUv;

float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u * u * (3.0 - 2.0 * u);

    float res = mix(mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x), mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y);
    return res * res;
}

float fbm(vec2 x, int numOctaves) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
	
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for(int i = 0; i < 30; ++i) {
        if (i >= numOctaves) break;
        v += a * noise(x);
        x = rot * x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

float blendDarken(float base, float blend) {
    return min(base, blend);
}
vec3 blendDarken(vec3 base, vec3 blend) {
    return vec3(blendDarken(base.r, blend.r), blendDarken(base.g, blend.g), blendDarken(base.b, blend.b));
}
vec3 blendDarken(vec3 base, vec3 blend, float opacity) {
    return (blendDarken(base, blend) * opacity + base * (1.0 - opacity));
}

vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
}

void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    vec4 prev = texture2D(tPrevious, vUv);

    vec2 aspect = vec2(1.0, resolution.x / resolution.y);

    vec2 disp = fbm(vUv * uClearity, uNoise) * aspect * uSize;

    vec4 texel = texture2D(tPrevious, vUv);
    vec4 texel2 = texture2D(tPrevious, vec2(vUv.x + disp.x, vUv.y));
    vec4 texel3 = texture2D(tPrevious, vec2(vUv.x - disp.x, vUv.y));
    vec4 texel4 = texture2D(tPrevious, vec2(vUv.x, vUv.y + disp.y));
    vec4 texel5 = texture2D(tPrevious, vec2(vUv.x, vUv.y - disp.y));

    vec3 floodColor = texel.rgb;
    floodColor = blendDarken(floodColor, texel2.rgb);
    floodColor = blendDarken(floodColor, texel3.rgb);
    floodColor = blendDarken(floodColor, texel4.rgb);
    floodColor = blendDarken(floodColor, texel5.rgb);

    vec3 gradient = hsl2rgb(vec3(fract(uTime * 0.1), 0.9, 0.5));
    vec3 lcolor = mix(vec3(1.0), gradient, color.r);

    vec3 waterColor = blendDarken(prev.rgb, floodColor * 1.02, 0.4);

    vec3 finalPaintBrush = blendDarken(waterColor, lcolor, 1.0);

    vec3 bg = uBgColor;
    if(uMixColours == 1) {
        gl_FragColor = vec4(min(bg, finalPaintBrush * (1.0 + uFadeSpeed)), 1.0);
    } else {
        gl_FragColor = vec4(min(bg, finalPaintBrush * (1.0 + uFadeSpeed) + 0.005), 1.0);
    }
}
`;

export function WatercolorBackground({
  sizeMultiplier = 0.02,
  clearity = 30,
  noise = 30,
  fadeSpeed = 0.01,
  mixColours = 0,
  bgColor = "#ffffff",
}) {
  const { gl, scene, size } = useThree();
  const mousePos = useRef({ x: 9999, y: 9999, hasMoved: false });
  const bgParsedColor = useMemo(() => new THREE.Color(bgColor), [bgColor]);

  const fbo = useMemo(() => {
    const w = Math.max(size.width, 1);
    const h = Math.max(size.height, 1);

    // 1. Brush Scene (draws a smooth white sphere at cursor against pure black background)
    const brushScene = new THREE.Scene();
    brushScene.background = new THREE.Color(0x000000);

    const brushGeometry = new THREE.SphereGeometry(0.12, 32, 32);
    const brushMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const brushMesh = new THREE.Mesh(brushGeometry, brushMaterial);
    brushMesh.position.set(9999, 9999, 0);
    brushScene.add(brushMesh);

    const brushCamera = new THREE.PerspectiveCamera(75, w / h, 0.1, 100);
    brushCamera.position.set(0, 0, 2);

    const targetOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
    };

    const brushTarget = new THREE.WebGLRenderTarget(w, h, targetOptions);
    const targetA = new THREE.WebGLRenderTarget(w, h, targetOptions);
    const targetB = new THREE.WebGLRenderTarget(w, h, targetOptions);

    const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const simScene = new THREE.Scene();

    const simMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tPrevious: { value: null },
        resolution: { value: new THREE.Vector4(w, h, 1, 1) },
        uTime: { value: 0 },
        uSize: { value: sizeMultiplier },
        uClearity: { value: clearity },
        uNoise: { value: Math.round(noise) },
        uFadeSpeed: { value: fadeSpeed },
        uMixColours: { value: Math.round(mixColours) },
        uBgColor: { value: bgParsedColor },
      },
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
    });

    const quadMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), simMaterial);
    simScene.add(quadMesh);

    // Initial white background scene
    const initScene = new THREE.Scene();
    initScene.background = bgParsedColor;
    gl.setRenderTarget(targetA);
    gl.render(initScene, orthoCamera);
    gl.setRenderTarget(targetB);
    gl.render(initScene, orthoCamera);
    gl.setRenderTarget(null);

    return {
      brushScene,
      brushMesh,
      brushCamera,
      brushTarget,
      targetA,
      targetB,
      simScene,
      simMaterial,
      orthoCamera,
    };
  }, [gl, bgParsedColor]);

  // Update uniforms when props change
  useEffect(() => {
    if (fbo.simMaterial) {
      fbo.simMaterial.uniforms.uSize.value = sizeMultiplier;
      fbo.simMaterial.uniforms.uClearity.value = clearity;
      fbo.simMaterial.uniforms.uNoise.value = Math.round(noise);
      fbo.simMaterial.uniforms.uFadeSpeed.value = fadeSpeed;
      fbo.simMaterial.uniforms.uMixColours.value = Math.round(mixColours);
      fbo.simMaterial.uniforms.uBgColor.value = bgParsedColor;
    }
  }, [fbo, sizeMultiplier, clearity, noise, fadeSpeed, mixColours, bgParsedColor]);

  // Handle window resizing
  useEffect(() => {
    const w = Math.max(size.width, 1);
    const h = Math.max(size.height, 1);
    fbo.brushTarget.setSize(w, h);
    fbo.targetA.setSize(w, h);
    fbo.targetB.setSize(w, h);
    fbo.brushCamera.aspect = w / h;
    fbo.brushCamera.updateProjectionMatrix();
    fbo.simMaterial.uniforms.resolution.value.set(w, h, 1, 1);
  }, [size, fbo]);

  // Track pointer movements
  useEffect(() => {
    const handlePointerMove = (e) => {
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      mousePos.current.hasMoved = true;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  // Ping-pong targets ref
  const currentTargets = useRef({
    read: fbo.targetA,
    write: fbo.targetB,
  });

  // Ensure currentTargets point to valid instances
  useEffect(() => {
    currentTargets.current = {
      read: fbo.targetA,
      write: fbo.targetB,
    };
  }, [fbo]);

  useFrame((state) => {
    const { gl, clock } = state;
    const time = clock.getElapsedTime();

    // Position brush mesh in brushCamera space (fov 75, distance 2)
    if (mousePos.current.hasMoved) {
      const halfH = Math.tan(((75 / 2) * Math.PI) / 180) * 2;
      const halfW = halfH * fbo.brushCamera.aspect;
      fbo.brushMesh.position.x = mousePos.current.x * halfW;
      fbo.brushMesh.position.y = mousePos.current.y * halfH;
      fbo.brushMesh.position.z = 0;
    } else {
      fbo.brushMesh.position.set(9999, 9999, 0);
    }

    // 1. Render brush onto brushTarget (black background, white sphere)
    gl.setRenderTarget(fbo.brushTarget);
    gl.render(fbo.brushScene, fbo.brushCamera);

    // 2. Render simulation into write buffer
    const { read, write } = currentTargets.current;
    fbo.simMaterial.uniforms.tDiffuse.value = fbo.brushTarget.texture;
    fbo.simMaterial.uniforms.tPrevious.value = read.texture;
    fbo.simMaterial.uniforms.uTime.value = time;

    gl.setRenderTarget(write);
    gl.render(fbo.simScene, fbo.orthoCamera);

    // 3. Swap read and write for next frame
    currentTargets.current.read = write;
    currentTargets.current.write = read;

    // 4. Update scene background texture
    scene.background = write.texture;

    // Reset render target so R3F can render the main 3D scene
    gl.setRenderTarget(null);
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      scene.background = null;
      fbo.brushTarget.dispose();
      fbo.targetA.dispose();
      fbo.targetB.dispose();
    };
  }, [fbo, scene]);

  return null;
}
