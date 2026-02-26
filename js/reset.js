// js/reset.js — Shake to Reset with 3-2-1 countdown (TASK-010)
'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Minimum acceleration magnitude (m/s²) to treat as a deliberate shake.
 * A stationary phone has ~9.8 m/s² from gravity alone.  A firm shake peaks
 * at 20–40 m/s².  22 m/s² is high enough to avoid false positives from
 * normal handling while still triggering reliably on a purposeful shake.
 */
const SHAKE_THRESHOLD = 22;

/** Milliseconds to suppress further shake triggers after one fires. */
const SHAKE_COOLDOWN_MS = 4500;

/**
 * Max milliseconds between two consecutive touchend events to count as a
 * double-tap (desktop / tablet fallback when shake is unavailable).
 */
const DOUBLE_TAP_MS = 350;

// ── Module-level state ────────────────────────────────────────────────────────

/** True while the countdown is active — blocks re-triggering. */
let _isResetting = false;

/** Timestamp of the last shake trigger (performance.now). */
let _lastShakeMs = -SHAKE_COOLDOWN_MS; // allow first shake immediately

/**
 * When non-null, the Matter.js beforeUpdate hook forces engine gravity to
 * these values on every physics step, overriding whatever the gyroscope /
 * mouse modules write between steps.  Set to null to restore normal control.
 */
let _gravityOverride = null;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Initialise the shake-to-reset feature.
 *
 * Mobile:  listens to DeviceMotion for a sharp acceleration spike.
 * Desktop: listens for a double-click anywhere on the canvas.
 * Both:    also listens for a double-tap (for touch devices without shake, e.g.
 *          iPads or iOS devices where motion permission was not granted).
 *
 * When triggered:
 *   1. Gravity is frozen to (0, 0) via a Matter.js beforeUpdate hook so the
 *      gyroscope / mouse modules cannot override it during the countdown.
 *   2. A centred 3-2-1 overlay is shown with a rising-pitch beep on each count.
 *   3. All existing balls are removed and replaced with new ones near the centre.
 *   4. Gravity is released so normal gyroscope / mouse control resumes.
 *
 * @param {{
 *   engine:         Matter.Engine,
 *   removeAllBalls: () => void,
 *   resetBalls:     (n: number) => void,
 * }} physics
 *   Object returned by initPhysics().
 * @param {{
 *   playCountdownBeep: (step: number) => void,
 * }} sound
 *   Object returned by initSound().
 */
export function initReset(physics, sound) {
  const { engine, removeAllBalls, resetBalls } = physics;
  const { playCountdownBeep } = sound;
  const { Events } = Matter;

  // ── Gravity override via beforeUpdate ─────────────────────────────────────
  // Runs before every physics step.  When _gravityOverride is set the engine
  // gravity is forced to (0,0) regardless of what gyroscope.js / mouse.js
  // wrote to engine.gravity between steps.
  Events.on(engine, 'beforeUpdate', () => {
    if (_gravityOverride !== null) {
      engine.gravity.x = _gravityOverride.x;
      engine.gravity.y = _gravityOverride.y;
    }
  });

  // ── Shared reset trigger ──────────────────────────────────────────────────
  function _triggerReset() {
    if (_isResetting) return;
    _isResetting  = true;
    _lastShakeMs  = performance.now();

    // Freeze gravity to zero for the duration of the countdown.
    _gravityOverride = { x: 0, y: 0 };

    const overlay  = document.getElementById('countdown-overlay');
    const numberEl = document.getElementById('countdown-number');

    let count = 3;
    overlay.classList.remove('hidden');
    numberEl.textContent = String(count);
    // Ascending pitch as the countdown progresses toward reset:
    //   count 3 → step 1 (440 Hz A4)
    //   count 2 → step 2 (554 Hz C#5)
    //   count 1 → step 3 (659 Hz E5)
    playCountdownBeep(4 - count);

    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        numberEl.textContent = String(count);
        playCountdownBeep(4 - count);
      } else {
        clearInterval(timer);
        overlay.classList.add('hidden');

        // Replace all balls with a fresh set clustered near the screen centre.
        removeAllBalls();
        resetBalls(_storedBallCount());

        // Release the gravity freeze — gyroscope / mouse control resumes
        // on the next physics step.
        _gravityOverride = null;
        _isResetting     = false;
      }
    }, 1000);
  }

  // ── DeviceMotion shake detection (mobile) ─────────────────────────────────
  // DeviceMotionEvent fires on Android and iOS (when motion permission has been
  // granted alongside orientation permission).  No extra permission call is
  // needed here because initGyroscope() already obtained motion access on iOS.
  if (typeof DeviceMotionEvent !== 'undefined') {
    window.addEventListener('devicemotion', (e) => {
      if (_isResetting) return;
      if (performance.now() - _lastShakeMs < SHAKE_COOLDOWN_MS) return;

      const a = e.accelerationIncludingGravity;
      if (!a) return;

      // Compute the total acceleration magnitude.
      const mag = Math.sqrt(
        (a.x ?? 0) ** 2 +
        (a.y ?? 0) ** 2 +
        (a.z ?? 0) ** 2,
      );

      if (mag > SHAKE_THRESHOLD) {
        console.log(`[reset] Shake detected (mag=${mag.toFixed(1)} m/s²) — triggering reset.`);
        _triggerReset();
      }
    }, { passive: true });
  }

  // ── Double-click fallback (desktop) ───────────────────────────────────────
  const canvas = document.getElementById('world');
  canvas.addEventListener('dblclick', () => {
    if (!_isResetting) {
      console.log('[reset] Double-click detected — triggering reset.');
      _triggerReset();
    }
  });

  // ── Double-tap fallback (touch devices without shake) ─────────────────────
  // Handles iPads, tablets, or any touch device where DeviceMotion is
  // unavailable or motion permission was not granted.
  let _lastTapMs = 0;
  canvas.addEventListener('touchend', () => {
    const now = performance.now();
    if (now - _lastTapMs < DOUBLE_TAP_MS && !_isResetting) {
      console.log('[reset] Double-tap detected — triggering reset.');
      _triggerReset();
    }
    _lastTapMs = now;
  }, { passive: true });

  console.log('[reset] Shake-to-reset active (shake on mobile, double-click/tap on desktop).');
}

// ── Private helpers ───────────────────────────────────────────────────────────

/**
 * Read the stored ball count from localStorage (key: 'gyroballs_count').
 * Mirrors the logic in physics.js so the same count is used after a reset.
 *
 * @returns {number}  Ball count in [1, 30], defaulting to 10.
 */
function _storedBallCount() {
  const n = parseInt(localStorage.getItem('gyroballs_count') || '', 10);
  return isNaN(n) ? 10 : Math.min(30, Math.max(1, n));
}
