# Greeter motion and control refresh

Two-line summary: swap the system action buttons to reicon-react icons (right-to-left), turn the login prompt into click/Enter/Space with keycap icons, and rework the torus dispersion so opening always launches from the bubbles' current positions to the 4 corners and closing re-groups them around "Hello World" — no restart-from-bottom loop, a continuous living background.

## Specs

S1 — System buttons → reicon-react icons, order right to left:
"1) Elimina los botones de apagar, reiniciar y suspender y reemplzalos por los siguientes (orden de derecha a izquierda):
a) import { PowerOff } from 'reicon-react'; <PowerOff size={24} />
b) import { Restart } from 'reicon-react'; <Restart size={24} />
c) import { MoonSleep } from 'reicon-react'; <MoonSleep size={24} />"
Right-to-left order -> rendered left-to-right: MoonSleep, Restart, PowerOff. Each icon size 24. Keep the existing hold-to-confirm interaction (user-approved pattern for destructive actions); only the icons change.

S2 — Prompt text with keycap icons, 3 ways to open:
"2) El texto "HAZ CLICK PARA INICIAR SESION" reemplazalo por "HAZ CLICK O PRESIONA [Icono de Enter] / [Icon Space] PARA ACCEDER". Aqui se reemplaza la palabra ENTER y SPACE por el respectivo icono. Cualquier de esas 3 acciones (click, enter o space) permitira la aparicion de la tarjeta de login."
Exact new copy: "HAZ CLICK O PRESIONA <enter-icon> / <space-icon> PARA ACCEDER" (Enter and Space replaced by their glyph icons; use the project's KeyCap visual language). Click on the prompt, Enter, or Space each opens the login card; keyboard must be inert while the card is open or during dispersion.

S3 — Dispersion always from current positions; close re-groups around Hello World (no loop):
"3) Transicion/animaciones - Te voy a describir exactamente como me imagino todo el cuadro:
a) Cuando el usuario hace click, presiona Enter/Space para que aparezca la tarjeta de login, las geometrias torus independiente del lugar en el que esten del backgroud, se iran a las 4 esquinas. Actualmente, cuando el usuario realiza la accion para ver la tarjeta de login, la animacion de dispersion de las geometrias siempre comienza desde abajo hacia las 4 esquinas.
b) Actualmente las geometrias torus se quedan en las 4 esquinas cuando aparece la tarjeta de login. Eso esta OK y debe permanecer asi.
c) Actualmente, si estoy en la tarjeta de login, y presiono el boton de cerrar o ESC, la animacion/transicion de las geometrias torus de las 4 esquinas, desaparece rapidamente y comienza nuevamente desde abajo, dando la sensacion de que se repite nuevamente el bucle y aqui el problema, ya que no lo quiero asi. Lo que quiero, es que cuando se presione el boton cerrar o ESC, las geometrias torus de cada esquina se vuelvan agrupar alrededor del "Hello World". Lo que quiero lograr es la sensacion de que nunca se sienta un bucle de animaciones entrando y saliendo, sino un continua que permita ver el background como si estuviera vivo en tiempo real."

## Tasks

T1 — Install reicon-react (pinned 1.2.6) and swap SystemButtons icons: MoonSleep / Restart / PowerOff, right-to-left, size 24, hold-to-confirm kept; adjust sys-power-btn svg CSS if it overrides size. Route: inline. Commit: feat(greeter).
T2 — Prompt copy + keycap glyphs + Enter/Space open (and key handling inert while card open / dispersing). Route: inline. Commit: feat(greeter).
T3 — Rework dispersion start (bubbles fly to corners from their current positions) and close re-group (corners -> around Hello World, no position reset / bottom re-scatter). Route: inline (delicate motion feel). Commit: feat(greeter).
T4 — Update + extend tests (vitest: SystemButtons icons, Overlay prompt/keys; e2e: prompt text, Enter/Space open, hold buttons, return physics) and docs (help/copy references). Route: inline. Commit: test(greeter).

## Log

L1 — User request (2026-11-06): "Seguimos con la mejora del greeter, aqui unas indicaciones: ..." (verbatim arriba en Specs S1/S2/S3).

L2 (decisión de implementación, T3): El mapa de exploración reveló que el "desde abajo" no era lógica de dispersión: las burbujas nacían con y∈[-35,-15] (siempre bajo el origen) y el resorte de reposo tenía 3× de ganancia en Y. La primera concha de reposo se probó a radio 6.5 y falló la e2e física: las esquinas del mundo 3D están a radio ~7.5 (viewport ±5.6/±5.0), así que la nube quedaba casi encima de las esquinas y la dispersión apenas era hacia afuera (avg 10.5 vs umbral settled*1.5=11.95). Se rediseñó con concha de radio 4.2 (aplastada y·0.75, z·0.65): idle 4.62 → dispersión 10.46 (2.3×) → retorno 3.9 estable.

L3 (evidencia): vitest 30/30 ✓ (2 tests nuevos de returnMotion con target), build ✓, E2E completa 8/8 ✓ con [fisica] reposo 5.58 / disperso 10.54 cuadrantes 12/11/11/11 / retorno 4.00 (umbral 7.53). El test de física e2e no necesitó re-baseline (sus umbrales relativos a settled se adaptaron solos a la geometría centrada). Gate final T4: vitest 34/34 (+4 KeyCap) y E2E completa 9/9 (nuevo test "enter y space abren la tarjeta de login").

L4 (commits): e9baee0 feat(greeter): reicon-react icons (T1) · 61f203e feat(greeter): prompt keycaps + Enter/Space (T2) · 26ff53f feat(greeter): burbujas en concha alrededor del Hello World + retorno orgánico (T3) · e64f93c test(greeter): Enter/Space open flow e2e, KeyCap unit tests, feature docs · 459b055 docs(greeter): feature log with final 9/9 gate evidence.

L5 (afinamientos pedidos después del gate): "1) La keycap space quedo desalineada respecto a la keycap enter, esta un poco hacia abajo. debe esta alineadas a la misma altura. 2) Al pasar el cursor por los botones de apagar, reiniciar y suspender, el tooltip que aparece es el comun de navegador... quiero uno que sea bonito y acorde a la paleta de colores y estilo del greeter." — (1) fix: `.keycap { vertical-align: middle }` (la keycap Enter, solo SVG, alineaba por baseline del borde inferior; la de Space por la baseline del texto). Verificado: deltaTop 0 px en el prompt. (2) tooltip de vidrio índigo (.sys-btn-wrap/.sys-tip) en reemplazo del title nativo (se quitó el prop title de HoldButton): Antonio uppercase 11px, fondo rgba(18,14,30,0.9) + blur, borde violeta, flecha, hover/focus-within. Verificado: solo el botón hovereado muestra su tip, centrado arriba, sin title nativo.

L6 (gotcha infra): el server de Vite de la mañana no tomó la SEGUNDA escritura a styles.css en un mismo turno (watcher perdió el change tras dos edits seguidos al mismo archivo); `touch src/styles.css` re-disparó el transform. Síntoma: el build/probes veían lo nuevo pero el server servía una versión intermedia.

L7 (detalles UX pedidos después de L5): "Dale con el detalle de UX. Tambien note que cuando mantengo apretado alguno de los botones... el tooltip queda pegado cuando dejo de mantener." — (a) delay de 300ms en la aparición (transition con delay solo en la regla de mostrar; el ocultar sigue rápido); (b) bug del "pegado": la regla usaba `:focus-within`, y el foco por CLICK (no `:focus-visible`) dejaba el tooltip visible aunque el cursor se fuera. Fix: mostrar solo con `:hover` o `:has(.hold-button:focus-visible)`, y ocultar al instante con `:active` (mientras se mantiene presionado). Verificado por probe: delay 0→1, oculto en holding, oculto al soltar y reaparece con delay si seguís encima, desaparece al alejar aunque el botón tenga foco por click, y el foco por teclado (Tab, :focus-visible) sí lo muestra.