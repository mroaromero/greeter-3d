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

  // La card vive dentro de FlameWrap (Canvas UI): su canvas WebGL de salida
  // debe montarse al abrir, aunque el Chromium E2E no tenga la API
  // experimental html-in-canvas (las llamas se dibujan por silueta).
  await expect(page.locator('canvas[aria-hidden="true"]')).toBeVisible();

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

test("la card abre con el borde de fuego de FlameWrap renderizando", async ({ page }) => {
  await page.locator("#text").click();
  await expect(page.locator(".sddm-card")).toBeVisible();

  const cardRect = await page.locator(".sddm-card").boundingBox();
  const flameRect = await page.locator('canvas[aria-hidden="true"]').boundingBox();
  expect(cardRect).not.toBeNull();
  expect(flameRect).not.toBeNull();

  // Captura fiable del frame: leer readPixels directo de un canvas WebGL sin
  // preserveDrawingBuffer es una carrera contra el clear post-composición.
  // drawImage() de un canvas WebGL sincroniza la surface presentada (como el
  // compositor) y dibuja en un canvas 2D, que sí se puede leer siempre.
  const capture = () =>
    page.evaluate(
      async ({ cardTop, flameTop, cssH, cardHeight }) => {
        const c = document.querySelector('canvas[aria-hidden="true"]');
        await new Promise(requestAnimationFrame); // deja al loop dibujar un frame
        const tmp = document.createElement("canvas");
        tmp.width = c.width;
        tmp.height = c.height;
        const tctx = tmp.getContext("2d");
        tctx.drawImage(c, 0, 0);
        const img = tctx.getImageData(0, 0, tmp.width, tmp.height);
        const { data, width, height } = img;

        let alive = 0;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] > 10) alive++;
        }

        // Muestra un píxel del centro horizontal, mapeado desde CSS (la copia
        // 2D comparte el origen arriba-izquierda). y se clampa al buffer.
        const at = (cssY) => {
          const midX = Math.round(width / 2);
          const y = Math.min(
            height - 1,
            Math.max(0, Math.round((cssY - flameTop) * (height / cssH)))
          );
          const o = (y * width + midX) * 4;
          return [data[o], data[o + 1], data[o + 2], data[o + 3]];
        };

        // Media de color a lo largo de una tira del borde superior: la media
        // promedia el parpadeo del ruido, dejando ver el color de fase actual.
        let sr = 0,
          sg = 0,
          sb = 0,
          sn = 0;
        const yEdge = Math.min(
          height - 1,
          Math.max(0, Math.round((cardTop + 3 - flameTop) * (height / cssH)))
        );
        const stripW = 64;
        const midX = Math.round(width / 2);
        for (let dx = -stripW / 2; dx <= stripW / 2; dx += 4) {
          const x = Math.min(width - 1, Math.max(0, midX + dx));
          const o = (yEdge * width + x) * 4;
          sr += data[o];
          sg += data[o + 1];
          sb += data[o + 2];
          sn++;
        }
        sr /= sn;
        sg /= sn;
        sb /= sn;

        return {
          alive,
          // 3px adentro del borde superior: donde el fuego muerde la silueta.
          topEdge: at(cardTop + 3),
          // Centro de la card: en fallback no se captura contenido.
          interior: at(cardTop + cardHeight / 2),
          strip: [sr, sg, sb],
        };
      },
      {
        cardTop: cardRect.y,
        cardLeft: cardRect.x,
        cardWidth: cardRect.width,
        flameTop: flameRect.y,
        flameLeft: flameRect.x,
        cssH: flameRect.height,
        cssW: flameRect.width,
        cardHeight: cardRect.height,
      }
    );

  const c1 = await capture();
  await page.waitForTimeout(1800);
  const c2 = await capture();
  await page.waitForTimeout(1800);
  const c3 = await capture();

  // El efecto dibujó fuego: decenas de miles de píxeles vivos.
  expect(c1.alive).toBeGreaterThan(10_000);
  // En el borde superior el fuego abraza la silueta (canal alfa alto).
  const a = c1.topEdge[3];
  expect(a).toBeGreaterThan(120);
  // Fallback puro: el interior de la card no se captura (canvas transparente).
  expect(c1.interior[3]).toBeLessThan(10);
  // El hue rota (colorCycle): en ~3.6s de capturas el color medio viaja;
  // con color estático las tres tiras serían casi idénticas.
  const spread = (arr) => Math.max(...arr) - Math.min(...arr);
  const traveled =
    spread([c1.strip[0], c2.strip[0], c3.strip[0]]) +
    spread([c1.strip[1], c2.strip[1], c3.strip[1]]) +
    spread([c1.strip[2], c2.strip[2], c3.strip[2]]);
  expect(traveled).toBeGreaterThan(60);
});
