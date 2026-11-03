import { test, expect } from "@playwright/test";

test("la escena 3D monta en WebGL y expone las 45 burbujas", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/?e2e=1");

  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForFunction(
    () => window.__greeterDebug?.bubbles().length > 0,
    null,
    { timeout: 90_000 }
  );

  const info = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const gl = canvas.getContext("webgl2");
    return {
      count: window.__greeterDebug.bubbles().length,
      gl: gl ? gl.getParameter(gl.VERSION) : null,
    };
  });

  expect(info.count).toBe(45);
  expect(info.gl).toMatch(/WebGL 2/);
  expect(pageErrors).toEqual([]);
});

test("el overlay arranca en el prompt y sin errores de consola", async ({ page }) => {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/?e2e=1");

  await expect(page.locator("#text")).toHaveText("HAZ CLICK PARA INICIAR SESIÓN");
  await expect(page.locator(".sddm-card")).toHaveCount(0);

  const realErrors = consoleErrors.filter(
    (text) => !/favicon|Download the React DevTools/i.test(text)
  );
  expect(realErrors).toEqual([]);
});
