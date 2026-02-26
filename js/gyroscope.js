/**
 * gyroscope.js — iOS gyroscope permission prompt + DeviceOrientation API
 *
 * TASK-004: iOS Gyroscope Permission Prompt
 *   On iOS 13+, DeviceOrientationEvent requires explicit user permission before
 *   orientation data is available.  This module detects that requirement, shows a
 *   full-screen prompt, and requests permission when the user taps "Enable Motion".
 *   If the user denies access the supplied onDenied callback is invoked so the
 *   caller can activate the mouse-gravity fallback (TASK-006).
 *   On Android and desktop browsers no prompt is shown.
 *
 * TASK-005: Gyroscope Gravity Control
 *   After permission is confirmed the DeviceOrientation listener maps tilt
 *   angles to the Matter.js gravity vector in real time:
 *     gamma (left/right, -90…+90) → engine.gravity.x
 *     beta  (forward/back, -180…+180) → engine.gravity.y via sin(beta)
 *   The gravity magnitude is clamped to MAX_GRAVITY so balls never fly
 *   uncontrollably fast.  Devices that fire the event with null data are
 *   detected and the mouse-gravity fallback is activated instead.
 */

'use strict';

const overlay   = document.getElementById('permission-overlay');
const btnEnable = document.getElementById('btn-enable-motion');

// ─────────────────────────────────────────────────────────────────────────────
// TASK-005 constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maximum magnitude of the gravity vector.  Values above this are clamped so
 * balls never fly too fast to follow visually or interact with.
 */
const MAX_GRAVITY = 2.5;

/**
 * Lateral (gamma) scale factor: how many degrees of left/right tilt equals
 * 1.0 gravity unit.  45° of tilt produces a gravity.x of 1.0.
 */
const TILT_SCALE = 45;

/**
 * Number of consecutive deviceorientation events with null beta/gamma before
 * the module concludes the device has no real gyroscope and falls back to the
 * mouse-gravity path (TASK-006).
 */
const NO_DATA_THRESHOLD = 5;

// ─────────────────────────────────────────────────────────────────────────────
// Detection helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true when the browser requires an explicit requestPermission() call
 * before DeviceOrientationEvent data is accessible.
 *
 * This is the case on iOS 13+ and iPadOS 13+ in Safari.  All other browsers
 * (Android Chrome, desktop) dispatch orientation events without a prompt.
 */
function _permissionRequired() {
  return (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Permission prompt
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Show the full-screen permission overlay and wait for the user to tap
 * "Enable Motion".  After the tap, calls DeviceOrientationEvent.requestPermission()
 * (which must be invoked inside a user-gesture handler on iOS).
 *
 * @returns {Promise<'granted'|'denied'>}
 */
function _showPermissionPrompt() {
  return new Promise((resolve) => {
    // Reveal the overlay (it starts hidden via the .hidden CSS class).
    overlay.classList.remove('hidden');

    btnEnable.addEventListener('click', async () => {
      // Hide the overlay immediately so the user sees the simulation underneath.
      overlay.classList.add('hidden');

      try {
        const state = await DeviceOrientationEvent.requestPermission();
        // state is 'granted', 'denied', or occasionally 'default' — treat
        // anything other than 'granted' as a denial.
        resolve(state === 'granted' ? 'granted' : 'denied');
      } catch (err) {
        // requestPermission() can throw if:
        //  • the call somehow ended up outside a user-gesture context, or
        //  • an older iOS version exposed the function but behaves unexpectedly.
        console.warn('[gyroscope] requestPermission() threw:', err);
        resolve('denied');
      }
    }, { once: true });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK-005: Gravity control
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attach a deviceorientation listener that maps tilt angles to the Matter.js
 * gravity vector in real time.
 *
 * Angle → gravity mapping
 * ───────────────────────
 * gamma (left/right, -90…+90)
 *   Dividing by TILT_SCALE (45°) gives a gravity.x of ±1 at a 45° lateral
 *   tilt, which feels natural.  Positive gamma = phone tilted right = balls
 *   roll right = positive gravity.x.
 *
 * beta (front/back, -180…+180)
 *   sin(beta) is used so that gravity.y tracks physical reality smoothly:
 *     β = 90°   (portrait upright, facing user) → sin = +1.0  (balls fall down)
 *     β = 0°    (flat, face-up)                 → sin =  0.0  (no y component)
 *     β = 180°  (flat, face-down)               → sin =  0.0
 *     β = -90°  (portrait upright, facing away) → sin = -1.0  (balls fall up)
 *
 * Magnitude clamping
 * ──────────────────
 * After computing (gx, gy) the vector magnitude is clamped to MAX_GRAVITY by
 * scaling both components proportionally, preserving direction while keeping
 * ball speeds manageable at extreme tilt angles.
 *
 * No-gyroscope detection
 * ──────────────────────
 * Desktop browsers and some older devices fire deviceorientation events but
 * provide null for beta and gamma.  After NO_DATA_THRESHOLD consecutive null
 * events the listener removes itself and calls onNoGyroscope() so the caller
 * can activate the mouse-gravity fallback (TASK-006).
 *
 * @param {Matter.Engine} engine           Active Matter.js engine.
 * @param {Function}      onNoGyroscope    Called when no real gyroscope data arrives.
 */
function _startGravityControl(engine, onNoGyroscope) {
  let nullCount = 0;

  function _onDeviceOrientation(event) {
    const { beta, gamma } = event;

    // ── No-gyroscope detection ───────────────────────────────────────────────
    if (beta === null && gamma === null) {
      nullCount += 1;
      if (nullCount >= NO_DATA_THRESHOLD) {
        console.log('[gyroscope] No real gyroscope data — activating mouse-gravity fallback.');
        window.removeEventListener('deviceorientation', _onDeviceOrientation);
        onNoGyroscope();
      }
      return;
    }

    nullCount = 0; // reset counter when real data arrives

    // ── Map tilt to gravity ──────────────────────────────────────────────────
    // gamma: left/right tilt. Positive = tilted right → positive gravity.x.
    const gx = (gamma ?? 0) / TILT_SCALE;

    // beta: forward/back tilt. sin(beta) naturally produces:
    //   • +1 when the phone is upright in portrait (β ≈ 90°)
    //   • 0  when the phone is flat (β ≈ 0°)
    //   • −1 when the phone is upside-down upright (β ≈ −90°)
    const gy = Math.sin(((beta ?? 90) * Math.PI) / 180);

    // ── Clamp vector magnitude ───────────────────────────────────────────────
    const mag = Math.sqrt(gx * gx + gy * gy);
    if (mag > MAX_GRAVITY) {
      engine.gravity.x = (gx / mag) * MAX_GRAVITY;
      engine.gravity.y = (gy / mag) * MAX_GRAVITY;
    } else {
      engine.gravity.x = gx;
      engine.gravity.y = gy;
    }
  }

  window.addEventListener('deviceorientation', _onDeviceOrientation);
  console.log('[gyroscope] DeviceOrientation listener active — gravity control running.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialise gyroscope permission and the DeviceOrientation gravity listener.
 *
 * Behaviour by platform:
 *   iOS 13+   — Shows the permission overlay; on denial calls onDenied() and returns.
 *   Android   — No prompt; proceeds directly to gravity control.
 *   Desktop   — No prompt; attaches listener but detects null data after
 *               NO_DATA_THRESHOLD events and falls back via onDenied().
 *
 * @param {Matter.Engine} engine      The Matter.js physics engine instance.
 * @param {object}        [options]
 * @param {Function}      [options.onDenied]  Invoked when iOS permission is denied
 *                                            or when no real gyroscope data is found.
 * @returns {Promise<void>}
 */
export async function initGyroscope(engine, { onDenied = () => {} } = {}) {
  if (_permissionRequired()) {
    // ── iOS 13+ path ──────────────────────────────────────────────────────────
    console.log('[gyroscope] iOS 13+ detected — requesting DeviceOrientation permission.');
    const state = await _showPermissionPrompt();

    if (state !== 'granted') {
      console.log('[gyroscope] Permission denied — activating mouse-gravity fallback.');
      onDenied();
      return;
    }

    console.log('[gyroscope] Permission granted — gyroscope is active.');
  } else {
    // ── Android / desktop path ────────────────────────────────────────────────
    // No permission prompt is required.  The overlay stays hidden.
    console.log('[gyroscope] No permission prompt required (Android / desktop).');
  }

  // ── TASK-005: Start gravity control ──────────────────────────────────────
  // Map DeviceOrientation angles to the Matter.js gravity vector in real time.
  // On devices without a real gyroscope onDenied() is called so the caller
  // can activate the mouse-gravity fallback (TASK-006).
  _startGravityControl(engine, onDenied);
}
