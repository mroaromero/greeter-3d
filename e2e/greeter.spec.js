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
      async ({
        cardTop,
        cardLeft,
        cardWidth,
        flameTop,
        flameLeft,
        cssH,
        cssW,
        cardHeight,
      }) => {
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

        // Muestra un píxel mapeado desde CSS (la copia 2D comparte el origen
        // arriba-izquierda y, a dpr 1, la misma escala CSS → píxel a píxel).
        const at = (cssX, cssY) => {
          const x = Math.min(
            width - 1,
            Math.max(0, Math.round((cssX - flameLeft) * (width / cssW)))
          );
          const y = Math.min(
            height - 1,
            Math.max(0, Math.round((cssY - flameTop) * (height / cssH)))
          );
          const o = (y * width + x) * 4;
          return [data[o], data[o + 1], data[o + 2], data[o + 3]];
        };
        const cardCenterX = cardLeft + cardWidth / 2;

        return {
          alive,
          // 3px adentro del borde superior: donde el fuego muerde la silueta.
          topEdge: at(cardCenterX, cardTop + 3),
          // Gradiente espacial: un cuarto y tres cuartos del ancho de la card
          // en el mismo instante → distinto hue si el color viaja por el borde.
          leftEdge: at(cardLeft + cardWidth * 0.25, cardTop + 3),
          rightEdge: at(cardLeft + cardWidth * 0.75, cardTop + 3),
          // Centro de la card: en fallback no se captura contenido.
          interior: at(cardCenterX, cardTop + cardHeight / 2),
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
  // La rotación temporal del hue depende del ritmo del rAF: en headless el
  // rAF queda estrangulado (~2 fps → ~1.5°/s reales vs ~46°/s en escritorio),
  // así que medir "el hue rota en X segundos" es intrínsecamente flaky según
  // el entorno (el spread RGB viejo medía el ruido del parpadeo del fuego:
  // 55-60 hacia un umbral 60). Lo que SÍ es determinista en cualquier entorno:
  //  - el gradiente ESPACIAL de hue en el MISMO instante (feature 55512dc):
  //    dos puntos del borde superior con hue distinto en la misma captura;
  //  - la VIVEZA del loop: la turbulencia mueve la forma del fuego entre
  //    capturas (un canvas congelado daría frames idénticos → spread 0).
  const gap = (a, b) =>
    Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
  expect(gap(c1.leftEdge, c1.rightEdge)).toBeGreaterThan(40);
  const aliveSpread =
    Math.max(c1.alive, c2.alive, c3.alive) -
    Math.min(c1.alive, c2.alive, c3.alive);
  expect(aliveSpread).toBeGreaterThan(500);
});

test("mantener presionado el botón de poder confirma la acción", async ({ page }) => {
  await page.locator("#text").click();
  await expect(page.locator(".sddm-card")).toBeVisible();

  const power = page.getByRole("button", { name: "Apagar" });
  await expect(power).toBeVisible();
  const box = await power.boundingBox();
  expect(box).not.toBeNull();
  expect(power).toHaveAttribute("data-phase", "idle");

  // Mantener 2s (holdTime) completa el hold → onHold → notificación de sistema.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(power).toHaveAttribute("data-phase", "holding");
  await page.waitForTimeout(2400);
  await page.mouse.up();

  await expect(page.getByText("Apagando…")).toBeVisible();
});

test("soltar el botón de poder antes de tiempo cancela la acción", async ({ page }) => {
  await page.locator("#text").click();
  await expect(page.locator(".sddm-card")).toBeVisible();

  const power = page.getByRole("button", { name: "Apagar" });
  const box = await power.boundingBox();
  expect(box).not.toBeNull();

  // Hold breve (< holdTime): al soltar vuelve a idle y nada se dispara.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(500);
  await page.mouse.up();

  await expect(power).toHaveAttribute("data-phase", "idle");
  await expect(page.getByText("Apagando…")).toHaveCount(0);
});
