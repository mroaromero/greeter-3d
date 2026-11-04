import { defineConfig } from "@playwright/test";

// WebGL por GPU cuando se puede.
//   - "channel: chromium" usa el binario completo con el headless nuevo;
//     el headless_shell por defecto NO tiene soporte de GPU y siempre cae a
//     SwiftShader, que rasteriza en la CPU (5+ nucleos, ~90% sostenido).
//   - --use-angle=vulkan engancha ANGLE contra RADV (AMD) en vez de SwiftShader.
// En CI no hay GPU: se vuelve a SwiftShader, que necesita el flag para habilitarse.
// Cualquiera de los dos caminos se puede forzar con E2E_GPU=1 (GPU) o E2E_GPU=0 (software).
const useGpu = process.env.E2E_GPU ? process.env.E2E_GPU !== "0" : !process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  // Holgura para el camino por software (CI): compilar shaders y simular 45
  // cuerpos rigidos en CPU tarda ~4x mas que con GPU.
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5199",
    channel: useGpu ? "chromium" : undefined,
    launchOptions: {
      args: useGpu
        ? ["--use-angle=vulkan", "--enable-features=Vulkan"]
        : ["--enable-unsafe-swiftshader"],
    },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 5199 --strictPort",
    url: "http://localhost:5199",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
