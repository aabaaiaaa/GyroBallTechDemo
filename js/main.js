/**
 * main.js — Application entry point
 *
 * Gyro Balls: a physics demo that uses the device gyroscope (or mouse on
 * desktop) to control gravity for a set of bouncing balls.
 *
 * Module responsibilities:
 *   physics.js    — Matter.js engine, renderer, and ball creation  (TASK-002) ✓
 *   walls.js      — Screen-boundary static bodies                  (TASK-003)
 *   gyroscope.js  — iOS permission prompt + DeviceOrientation API  (TASK-004, TASK-005)
 *   mouse.js      — Mouse-gravity fallback for desktop             (TASK-006)
 *   sound.js      — Web Audio API collision & countdown sounds     (TASK-007)
 *   vibration.js  — Vibration API haptic feedback                  (TASK-008)
 *   settings.js   — Settings panel + localStorage persistence      (TASK-009)
 *   reset.js      — Shake-to-reset + 3-2-1 countdown              (TASK-010)
 */

'use strict';

import { initPhysics } from './physics.js';

// Verify Matter.js loaded via CDN before anything else runs.
if (typeof Matter === 'undefined') {
  document.body.innerHTML =
    '<p style="color:#f55;padding:2rem;font-family:sans-serif">' +
    'Failed to load Matter.js. Please check your internet connection and reload.</p>';
  throw new Error('Matter.js not loaded');
}

console.log(`Gyro Balls — Matter.js ${Matter.version} ready`);

// ── TASK-002: Physics engine + balls ────────────────────────────────────────
const physics = initPhysics();

// Future module initialisations (uncommented as each task is completed):
//
//   import { initWalls }      from './walls.js';       // TASK-003
//   import { initGyroscope }  from './gyroscope.js';   // TASK-004, TASK-005
//   import { initMouse }      from './mouse.js';        // TASK-006
//   import { initSound }      from './sound.js';        // TASK-007
//   import { initVibration }  from './vibration.js';   // TASK-008
//   import { initSettings }   from './settings.js';    // TASK-009
//   import { initReset }      from './reset.js';        // TASK-010
//
//   (async () => {
//     const walls    = initWalls(physics.engine);
//     const settings = initSettings(physics);
//     const sound    = initSound(settings);
//     const vibe     = initVibration(settings);
//     await initGyroscope(physics.engine, { onDenied: () => initMouse(physics.engine) });
//     initReset(physics, walls, sound);
//   })();
