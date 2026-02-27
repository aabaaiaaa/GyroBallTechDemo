# Gyro Balls

A physics demo that uses your phone's gyroscope to control gravity for a set of bouncing balls. Tilt your device to make the balls roll and fall in that direction, with collision sound effects and haptic feedback.

## Features

- **Gyroscope gravity** — tilt your phone to control which way the balls fall
- **Bouncing physics** — balls collide with each other and the screen edges via [Matter.js](https://brm.io/matter-js/)
- **Sound effects** — Web Audio API collision sounds scaled by impact velocity
- **Haptic feedback** — vibration pulses on collision (where supported)
- **Shake to reset** — shake your phone (or double-click / double-tap on desktop and tablets) to trigger a 3-2-1 countdown and respawn the balls
- **Settings** — adjust ball count (1–30), toggle sound, toggle vibration; persisted in `localStorage`
- **Desktop fallback** — mouse position controls gravity when no gyroscope is available
- **iOS permission prompt** — friendly overlay to request `DeviceOrientationEvent` access on iOS 13+

## Live Demo

[https://jeastaugh.github.io/GyroBallTechDemo/](https://jeastaugh.github.io/GyroBallTechDemo/)

> **Note for iOS users:** The demo must be served over HTTPS for the gyroscope permission prompt to work. GitHub Pages provides HTTPS automatically.

## Running Locally

No build step required — this is a static site with vanilla JS ES modules.

### Option 1: VS Code Live Server

1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension
2. Right-click `index.html` → **Open with Live Server**
3. The app opens at `http://localhost:5500`

> **iOS gyroscope note:** `DeviceOrientationEvent.requestPermission()` requires a secure context (HTTPS). On localhost this works in some browsers; to test on a real iOS device you'll need an HTTPS tunnel (see below) or deploy to GitHub Pages.

### Option 2: Python HTTP server

```bash
# Python 3
python -m http.server 8080
# Then open http://localhost:8080
```

### Option 3: npx serve

```bash
npx serve .
# Then open the URL shown in the terminal
```

### Testing on a real iOS device (HTTPS tunnel)

To test gyroscope permission on a physical iPhone/iPad over your local network:

```bash
# Using ngrok (free tier)
ngrok http 8080
# Open the https:// URL ngrok provides on your iOS device
```

## Deploying to GitHub Pages

1. Push the repository to GitHub
2. Go to **Settings → Pages**
3. Under **Source**, select **Deploy from a branch**
4. Choose `main` branch, `/ (root)` folder, then click **Save**
5. GitHub Pages will publish the site at `https://<username>.github.io/<repo-name>/`

All asset paths in the project are relative, so the app works correctly from the `/repo-name/` sub-path without any configuration changes.

## Project Structure

```
index.html          — Main HTML shell
css/
  styles.css        — All styles (dark theme, overlays, settings panel, responsive)
js/
  main.js           — Entry point; wires all modules together
  physics.js        — Matter.js engine, renderer, and ball creation
  walls.js          — Screen-boundary static bodies
  gyroscope.js      — iOS permission prompt + DeviceOrientation gravity control
  mouse.js          — Mouse-gravity fallback for desktop
  sound.js          — Web Audio API collision and countdown sounds
  vibration.js      — Vibration API haptic feedback
  settings.js       — Settings panel and localStorage persistence
  reset.js          — Shake-to-reset with 3-2-1 countdown
```
