# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running locally

No build step — static site with vanilla JS ES modules.

```bash
# Python 3
python -m http.server 8080

# or npx
npx serve .
```

For iOS gyroscope testing on a real device, the page must be served over HTTPS. Use an ngrok tunnel pointed at the local server, or deploy to GitHub Pages.

## Architecture

**Entry point:** `js/main.js` — imports and wires all modules together. Read this first to understand initialization order and inter-module dependencies.

**External dependency:** Matter.js 0.19.0 is loaded via CDN (`<script>` tag in `index.html`). It is a global (`Matter`) — not imported. `main.js` guards against CDN failure at startup.

**Module responsibilities:**

| Module | Role |
|---|---|
| `physics.js` | Matter.js engine, renderer, runner; `createBalls`, `removeAllBalls`, `resetBalls` |
| `walls.js` | Static boundary bodies around screen edges |
| `gyroscope.js` | iOS 13+ `DeviceOrientationEvent.requestPermission` prompt; maps `beta`/`gamma` to `engine.gravity` |
| `mouse.js` | Desktop fallback: maps mouse position to `engine.gravity` |
| `sound.js` | Web Audio API collision sounds + countdown beeps; exports `setSoundEnabled` |
| `vibration.js` | Vibration API haptic feedback; exports `setVibrationEnabled` |
| `settings.js` | Settings panel UI; reads/writes localStorage; calls `removeAllBalls`/`createBalls` on count change |
| `reset.js` | Shake detection (DeviceMotion) and double-click/double-tap fallback; runs a 3-2-1 countdown via `setInterval`, freezes gravity with a Matter.js `beforeUpdate` hook during countdown |

**Gyroscope → mouse fallback chain:** `initGyroscope` accepts an `onDenied` callback. `main.js` passes `() => initMouse(engine)` — so mouse control activates automatically when iOS permission is denied or when no real gyroscope data arrives (desktop).

**localStorage keys** (shared across modules — don't rename without updating all):
- `gyroballs_count` — ball count (1–30), read by `physics.js` and `reset.js` on startup/reset
- `gyroballs_sound` — `'0'` = muted, anything else (or absent) = enabled
- `gyroballs_vibration` — `'0'` = off, anything else (or absent) = enabled

**Ball bodies** are tagged with `label: 'ball'` so `removeAllBalls` can filter them from all composite bodies without tracking references.

## Deployment

Push to GitHub and enable GitHub Pages from the `main` branch root. All asset paths are relative, so the app works correctly from the `/GyroBallTechDemo/` sub-path without changes.
