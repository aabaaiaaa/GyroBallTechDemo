/**
 * main.js — Application entry point
 *
 * Gyro Balls: a physics demo that uses the device gyroscope (or mouse on
 * desktop) to control gravity for a set of bouncing balls.
 *
 * Module responsibilities (to be implemented in subsequent tasks):
 *   physics.js    — Matter.js engine, renderer, and ball creation  (TASK-002)
 *   walls.js      — Screen-boundary static bodies                  (TASK-003)
 *   gyroscope.js  — iOS permission prompt + DeviceOrientation API  (TASK-004, TASK-005)
 *   mouse.js      — Mouse-gravity fallback for desktop             (TASK-006)
 *   sound.js      — Web Audio API collision & countdown sounds     (TASK-007)
 *   vibration.js  — Vibration API haptic feedback                  (TASK-008)
 *   settings.js   — Settings panel + localStorage persistence      (TASK-009)
 *   reset.js      — Shake-to-reset + 3-2-1 countdown              (TASK-010)
 */

'use strict';

// Verify Matter.js loaded via CDN before anything else runs.
if (typeof Matter === 'undefined') {
  document.body.innerHTML =
    '<p style="color:#f55;padding:2rem;font-family:sans-serif">' +
    'Failed to load Matter.js. Please check your internet connection and reload.</p>';
  throw new Error('Matter.js not loaded');
}

console.log(`Gyro Balls — Matter.js ${Matter.version} ready`);

// Placeholder: subsequent tasks will import and initialise their modules here.
// Example structure once tasks are complete:
//
//   import { initPhysics }    from './physics.js';
//   import { initWalls }      from './walls.js';
//   import { initGyroscope }  from './gyroscope.js';
//   import { initMouse }      from './mouse.js';
//   import { initSound }      from './sound.js';
//   import { initVibration }  from './vibration.js';
//   import { initSettings }   from './settings.js';
//   import { initReset }      from './reset.js';
//
//   (async () => {
//     const engine   = initPhysics();
//     const walls    = initWalls(engine);
//     const settings = initSettings();
//     const sound    = initSound(settings);
//     const vibe     = initVibration(settings);
//     await initGyroscope(engine, { onDenied: () => initMouse(engine) });
//     initReset(engine, walls, sound);
//   })();
