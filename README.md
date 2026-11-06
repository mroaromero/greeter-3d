# Greeter 3D

A 3D login greeter prototype (SDDM-style) built with React Three Fiber — 45 physics-driven toruses orbiting a **Hello World** in a living background, a flamed glass login card, hold-to-confirm system actions, and a curtain wipe transition to a mock desktop.

> **New project, inspired by, not a fork:** this repository started from the visual idea of [SahilK-027/hello-world-r3f](https://github.com/SahilK-027/hello-world-r3f) ("Small Weekend Project" — a React Three Fiber hello-world). It is now a **different project**: the original was a static demo scene; this one grew into a full login-greeter experience: interactive physics (dispersion/return around the text), a WebGL flame login card, keyboard-driven flow, a session state machine with a curtain transition, and an automated test suite. Anyone standing on the original author's shoulder thanks **Sahil K.** for the starting point.

---

## What it does

- **Living background** — 45 torus bubbles drift in a shell around the *Hellø Wørld* text (rapier physics, no gravity, gentle orbit). Click the prompt, press **Enter** or **Space** and they burst to the four screen corners; close the card and they arc back into their cloud — one continuous motion, never a restart loop.
- **Login card** — frosted glass card wrapped in a WebGL fire border (vendored from [canvas-ui](https://canvasui.dev/)), wordle-style password tiles, CSS-3D clock/date/weather widget (Open-Meteo), physical keycap hints.
- **System actions** — power / restart / suspend as hold-to-confirm glass circles (vendored from [react-bits](https://reactbits.dev/) HoldButton) with icons from [reicon-react](https://www.npmjs.com/package/reicon-react), custom glass tooltips.
- **Session transition** — four-pass curtain wipe to a mock desktop, then back to the greeter (state machine: greeter → covering → revealing → desktop → returning → returned).

> ⚠️ **Prototype status:** the password check is a demo credential and the system actions only show feedback — a real deployment needs the greetd/PAM bridge and systemd/loginctl wiring (see `odd/audit/2026-11-06.md`).

## Setup

Requires **Node.js 18+** (React 18 / Vite 4).

```bash
# Install dependencies (only the first time)
npm install

# Run the local dev server
npm run dev        # http://localhost:5173

# Production build (dist/)
npm run build
```

## Tests

```bash
npm test           # vitest — unit tests (34)
npm run test:e2e   # playwright — real WebGL E2E (9 specs)
npm run test:all   # both
```

The E2E suite runs against a real GPU (or SwiftShader in CI); physics, flame rendering, keyboard flow and hold-to-confirm behavior are all covered.

## Project map

```
src/
  App.jsx                       session state machine + keyboard gate (Enter/Space)
  components/
    Sphere.jsx                  bubble physics: home shell, corner burst/return
    returnMotion.js             pure return-steering math (unit-tested)
    Overlay.jsx                 prompt, login overlay, system feedback
    LoginTransition.jsx         curtain wipe
    DesktopSurface.jsx          mock desktop
    sddm/                       login card, password tiles, clock/weather,
                                hold buttons (react-bits), keycaps, flame card
    canvasui/FlameWrap.tsx      WebGL fire border (canvas-ui, vendored)
odd/                            feature specs + audit log
e2e/                            playwright suite
```

## Credits & licenses

- **Inspired by** [SahilK-027/hello-world-r3f](https://github.com/SahilK-027/hello-world-r3f)
- [Vite](https://vitejs.dev/) · [React Three Fiber](https://github.com/pmndrs/react-three-fiber) · [drei](https://github.com/pmndrs/drei) · [react-three/rapier](https://github.com/pmndrs/react-three-rapier) · [leva](https://github.com/pmndrs/leva)
- Vendored: [canvas-ui](https://canvasui.dev/) FlameWrap (MIT + Commons Clause), [react-bits](https://reactbits.dev/) HoldButton (MIT), [reicon-react](https://www.npmjs.com/package/reicon-react) icons
- **Known deferred items** (password bridge, real system actions, offline fonts, dependency audit): `odd/audit/2026-11-06.md`