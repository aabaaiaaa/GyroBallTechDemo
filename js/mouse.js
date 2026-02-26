/**
 * mouse.js — Desktop mouse-gravity fallback
 *
 * TASK-006: Desktop Mouse Gravity Fallback
 *   When no gyroscope is available (desktop browsers or iOS permission denied),
 *   tracks the mouse position relative to the screen centre and uses its offset
 *   to set the Matter.js gravity vector, simulating the effect of tilting the
 *   device.  Moving the cursor right causes balls to roll right; moving it down
 *   increases downward gravity; etc.
 *
 *   A small pill-shaped label is revealed at the top of the screen to indicate
 *   that mouse-control mode is active.
 */

'use strict';

/**
 * Maximum gravity magnitude — kept in sync with gyroscope.js so the two
 * input modes feel consistent.  At the screen edge the gravity vector reaches
 * this value; in the centre it is (0, 0).
 */
const MAX_GRAVITY = 2.5;

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Activate mouse-gravity fallback mode.
 *
 * Attaches a 'mousemove' listener that normalises the cursor's offset from the
 * screen centre to a ±1 range and scales it to the gravity magnitude.  The
 * vector magnitude is clamped to MAX_GRAVITY so diagonal positions near the
 * corners don't exceed the same maximum used by the gyroscope path.
 *
 * Also reveals the #mouse-mode-label indicator so the user knows which input
 * method is active.
 *
 * @param {Matter.Engine} engine  The Matter.js physics engine instance.
 */
export function initMouse(engine) {
  // Reveal the mouse-mode indicator label.
  const label = document.getElementById('mouse-mode-label');
  if (label) {
    label.classList.remove('hidden');
  }

  function _onMouseMove(event) {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;

    // Normalise cursor offset to ±1 (0 at centre, ±1 at the screen edge).
    const nx = (event.clientX - cx) / cx;
    const ny = (event.clientY - cy) / cy;

    // Scale to gravity units — ±MAX_GRAVITY at the screen edges.
    let gx = nx * MAX_GRAVITY;
    let gy = ny * MAX_GRAVITY;

    // Clamp vector magnitude so diagonal corners don't exceed MAX_GRAVITY.
    const mag = Math.sqrt(gx * gx + gy * gy);
    if (mag > MAX_GRAVITY) {
      gx = (gx / mag) * MAX_GRAVITY;
      gy = (gy / mag) * MAX_GRAVITY;
    }

    engine.gravity.x = gx;
    engine.gravity.y = gy;
  }

  window.addEventListener('mousemove', _onMouseMove);
  console.log('[mouse] Mouse-gravity fallback active — tracking cursor position.');
}
