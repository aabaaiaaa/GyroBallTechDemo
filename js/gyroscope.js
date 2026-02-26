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
 * TASK-005: Gyroscope Gravity Control (stub — wired up in the TASK-005 iteration)
 *   Once permission is confirmed the DeviceOrientation listener that maps tilt
 *   angles to the Matter.js gravity vector will be added here.
 */

'use strict';

const overlay   = document.getElementById('permission-overlay');
const btnEnable = document.getElementById('btn-enable-motion');

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
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialise gyroscope permission and (once TASK-005 is implemented) the
 * DeviceOrientation listener.
 *
 * Behaviour by platform:
 *   iOS 13+   — Shows the permission overlay; on denial calls onDenied() and returns.
 *   Android   — No prompt; proceeds directly (TASK-005 will attach the listener).
 *   Desktop   — No prompt; proceeds directly (TASK-005 will detect no useful data
 *               and TASK-006 mouse fallback can be activated from the caller side).
 *
 * @param {Matter.Engine} engine      The Matter.js physics engine instance.
 * @param {object}        [options]
 * @param {Function}      [options.onDenied]  Invoked when iOS permission is denied.
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

  // ── TASK-005 stub ─────────────────────────────────────────────────────────
  // When TASK-005 is implemented, the DeviceOrientation event listener that
  // maps (beta, gamma) → (engine.gravity.y, engine.gravity.x) will be
  // registered here.  For now we log a placeholder message.
  console.log('[gyroscope] Ready — gravity control will be wired up in TASK-005.');
}
