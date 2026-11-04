import { test, expect } from "@playwright/test";

const BUBBLES = 45;

/** Positions of every rendered bubble, in world space. */
const bubbles = (page) => page.evaluate(() => window.__greeterDebug.bubbles());

const stats = (positions) => {
  const total = positions.length;
  const average = positions.reduce((sum, p) => sum + Math.hypot(p.x, p.y, p.z), 0) / total;
  const quadrants = [0, 0, 0, 0];
  for (const p of positions) {
    const quadrant = (p.x >= 0 ? 0 : 1) + (p.y >= 0 ? 0 : 2);
    quadrants[quadrant] += 1;
  }
  return { average, quadrants, total };
};

async function waitForStableAverage(page, { maxMs = 25_000, tolerance = 0.15 } = {}) {
  const started = Date.now();
  let previous = Infinity;

  while (Date.now() - started < maxMs) {
    const { average } = stats(await bubbles(page));
    if (Math.abs(average - previous) < tolerance) return average;
    previous = average;
    await page.waitForTimeout(400);
  }
  return previous;
}

/** Waits until the average bubble distance is above/below a value. */
async function waitForAverage(page, comparison, argument, timeout = 60_000) {
  await page.waitForFunction(
    ([mode, threshold]) => {
      const positions = window.__greeterDebug.bubbles();
      const average =
        positions.reduce((sum, p) => sum + Math.hypot(p.x, p.y, p.z), 0) / positions.length;
      return mode === "above" ? average > threshold : average < threshold;
    },
    [comparison, argument],
    { timeout }
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto("/?e2e=1");
  await page.waitForFunction(
    (expected) => window.__greeterDebug?.bubbles().length === expected,
    BUBBLES,
    { timeout: 90_000 }
  );
});

test("el login completo: click, contraseña, éxito y cierre con Esc", async ({ page }) => {
  await page.locator("#text").click();

  const card = page.locator(".sddm-card");
  await expect(card).toBeVisible();

  // Real browser: the hidden input must own focus, or typing goes nowhere.
  const password = page.locator('input[aria-label="Contraseña"]');
  await expect(password).toBeFocused();

  await page.keyboard.type("1111111111");
  await page.keyboard.press("Enter");

  await expect(page.getByText("✓ Sesión iniciada")).toBeVisible();
  await expect(card).toContainText("CORRECTO");

  await page.keyboard.press("Escape");
  await expect(card).toBeHidden();
});

test("una contraseña incorrecta vuelve a idle sola", async ({ page }) => {
  await page.locator("#text").click();

  const card = page.locator(".sddm-card");
  await expect(card).toBeVisible();
  await expect(page.locator('input[aria-label="Contraseña"]')).toBeFocused();

  await page.keyboard.type("0000");
  await page.keyboard.press("Enter");

  await expect(card).toContainText("DENEGADO");
  await expect(page.getByText("Contraseña incorrecta")).toBeVisible();

  // Auto-reset: message gone, password cleared, keycap hints back.
  await expect(page.locator(".sddm-hint-keys")).toBeVisible({ timeout: 15_000 });
  const password = page.locator('input[aria-label="Contraseña"]');
  await expect(password).toHaveValue("");
  await expect(password).toBeFocused();
});

test("las cuatro esquinas vuelven al Hello World al cerrar el login", async ({ page }) => {
  const settled = await waitForStableAverage(page);
  console.log(`[fisica] reposo: ${settled.toFixed(2)}`);

  await page.locator("#text").click();

  // The burst pushes the bubbles outward, then the corner pull groups them.
  await waitForAverage(page, "above", settled * 1.5);
  await expect(page.locator(".sddm-card")).toBeVisible();

  const dispersedStats = stats(await bubbles(page));
  console.log(
    `[fisica] disperso: ${dispersedStats.average.toFixed(2)} · cuadrantes ${dispersedStats.quadrants.join("/")}`
  );

  // Each corner keeps its own group: no quadrant may end up empty.
  for (const count of dispersedStats.quadrants) {
    expect(count).toBeGreaterThanOrEqual(6);
  }
  expect(dispersedStats.quadrants.reduce((a, b) => a + b, 0)).toBe(BUBBLES);
  expect(dispersedStats.average).toBeGreaterThan(settled * 1.5);

  await page.keyboard.press("Escape");
  await expect(page.locator(".sddm-card")).toBeHidden();

  // They must travel back to the Hello World, not restart the scene.
  const threshold = Math.max(settled * 1.35, settled + 1.2);
  await waitForAverage(page, "below", threshold, 30_000);

  // Cruzar el umbral solo dice que ya empezo a volver: con render por GPU el
  // cruce se detecta en el frame exacto y medir ahi deja el assert sin margen.
  // Esperamos a que se asiente de nuevo para medir el reposo real.
  const returnedSettled = await waitForStableAverage(page);
  const returned = stats(await bubbles(page));
  console.log(
    `[fisica] retorno: ${returned.average.toFixed(2)} ` +
      `(reposo ${returnedSettled.toFixed(2)}, umbral ${threshold.toFixed(2)})`
  );
  expect(returned.average).toBeLessThan(threshold);
  expect(returned.average).toBeLessThan(dispersedStats.average / 1.5);
});
