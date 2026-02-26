# Requirements

## Project Overview
A polished web app tech demo that uses a phone's gyroscope to simulate gravity for a set of physics-driven balls on screen. Tipping the phone causes balls to roll and fall in that direction, bouncing off screen edges and each other with subtle sound and haptic feedback. Deployable to GitHub Pages.

---

### TASK-001: Project Setup & Structure
- **Status**: done
- **Priority**: high
- **Dependencies**: none
- **Description**: Scaffold a static HTML/CSS/JS project using Matter.js for physics. Set up the directory structure, include Matter.js via CDN or bundler, and configure the project for GitHub Pages deployment (e.g. correct base paths, an index.html at the root). No framework required — vanilla JS is fine.

---

### TASK-002: Physics Engine & Ball Creation
- **Status**: done
- **Priority**: high
- **Dependencies**: TASK-001
- **Description**: Initialise a Matter.js engine and renderer on a full-screen canvas. Create 10 balls by default, each with randomly varied radius, colour, mass, restitution (bounciness), and friction so they behave differently. Balls should lose energy on each collision and eventually come to rest. Ball count must be configurable (see TASK-009).

---

### TASK-003: Screen Boundary Walls
- **Status**: done
- **Priority**: high
- **Dependencies**: TASK-002
- **Description**: Add four invisible static bodies as walls along all screen edges (top, bottom, left, right) so balls bounce off them and are contained within the viewport. Walls must resize correctly if the browser window or screen orientation changes.

---

### TASK-004: iOS Gyroscope Permission Prompt
- **Status**: done
- **Priority**: high
- **Dependencies**: TASK-001
- **Description**: On iOS Safari, DeviceOrientationEvent requires explicit user permission. Detect whether permission is needed (iOS 13+) and if so show a friendly full-screen prompt before the demo starts, with a clear "Enable Motion" button that triggers the permission request. If permission is denied, fall back to mouse gravity (TASK-006). On Android and desktop no prompt is needed.

---

### TASK-005: Gyroscope Gravity Control
- **Status**: done
- **Priority**: high
- **Dependencies**: TASK-002, TASK-004
- **Description**: Listen to the DeviceOrientation API (gamma for left/right tilt, beta for forward/back tilt) and map those values in real time to the Matter.js gravity vector (world.gravity.x and world.gravity.y). The mapping should feel natural — tipping the phone right should cause balls to roll right. Clamp gravity magnitude to a sensible maximum so balls don't fly too fast.

---

### TASK-006: Desktop Mouse Gravity Fallback
- **Status**: done
- **Priority**: medium
- **Dependencies**: TASK-002
- **Description**: When no gyroscope is available (desktop browsers, or iOS permission denied), track mouse position relative to the centre of the screen and use its offset to set the gravity vector, simulating the effect of tilting. Show a small unobtrusive label indicating mouse-control mode is active.

---

### TASK-007: Sound Effects
- **Status**: done
- **Priority**: medium
- **Dependencies**: TASK-003
- **Description**: Use the Web Audio API to generate subtle collision sounds: a soft low-frequency thud when a ball hits a wall, and a slightly higher-pitched click when two balls collide. Scale volume by the relative impact velocity so gentle touches are quiet and hard impacts are louder. Also generate three short countdown beep tones (descending or ascending pitch) for the reset countdown (TASK-010). All sounds must respect the sound toggle in settings (TASK-009).

---

### TASK-008: Vibration Feedback
- **Status**: done
- **Priority**: medium
- **Dependencies**: TASK-003
- **Description**: Use the Vibration API to trigger a short haptic pulse when a ball hits a wall or another ball. Scale pulse duration by impact velocity (e.g. 10–40ms). Vibration must respect the vibration toggle in settings (TASK-009) and default to enabled. Gracefully handle browsers that do not support the Vibration API with no errors.

---

### TASK-009: Settings Menu
- **Status**: done
- **Priority**: medium
- **Dependencies**: TASK-007, TASK-008
- **Description**: Add a small floating gear icon (bottom-right corner) that opens a settings panel overlay. The panel must include: a ball count control (numeric input or slider, range 1–30, default 10) that resets the simulation when changed, a vibration on/off toggle (default on), and a sound on/off toggle (default on). Settings should persist in localStorage so they survive page reloads. The panel must be dismissible by tapping outside it or tapping the gear icon again.

---

### TASK-010: Shake to Reset with Countdown
- **Status**: pending
- **Priority**: medium
- **Dependencies**: TASK-007, TASK-003
- **Description**: Listen to the DeviceMotion API for a shake gesture (sharp acceleration spike above a threshold). When a shake is detected, immediately pause gravity and show a centred 3-2-1 countdown overlay. Play a distinct beep on each count (using the sounds from TASK-007). When the countdown reaches 0, remove all balls, re-create them clustered near the screen centre, and re-engage gravity. The 3-second delay gives the user time to reposition the phone before balls start moving. On desktop, provide an alternative reset (e.g. double-click/double-tap anywhere on the canvas) since shake is not available.

---

### TASK-011: Polish & Responsive Design
- **Status**: pending
- **Priority**: medium
- **Dependencies**: TASK-002, TASK-003, TASK-004, TASK-005, TASK-006, TASK-007, TASK-008, TASK-009, TASK-010
- **Description**: Ensure the app looks and feels polished and production-ready. This includes: smooth 60fps rendering, a clean dark background that makes the colourful balls pop, readable typography for any UI elements, the settings panel and countdown overlay styled consistently, correct layout on a range of phone screen sizes and orientations (portrait and landscape), no layout overflow or scroll, and a proper viewport meta tag to prevent unwanted zooming on mobile. Test on iOS Safari and Android Chrome (simulated or real).

---

### TASK-012: GitHub Pages Deployment
- **Status**: pending
- **Priority**: low
- **Dependencies**: TASK-011
- **Description**: Verify the project deploys cleanly to GitHub Pages. Ensure all asset paths are relative (no hardcoded localhost paths), the app loads correctly from a /repo-name/ sub-path if needed, and HTTPS is used (required for DeviceOrientation permission on iOS). Add a minimal README.md documenting how to run locally and the live GitHub Pages URL.
