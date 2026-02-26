// js/vibration.js — Vibration API haptic feedback (TASK-008)
'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Minimum relative speed (px/tick) below which no vibration is emitted. */
const MIN_SPEED = 1.0;

/** Speed at which pulse duration reaches MAX_DURATION_MS. */
const MAX_SPEED = 20;

/** Shortest haptic pulse in ms (gentle impact). */
const MIN_DURATION_MS = 10;

/** Longest haptic pulse in ms (hard impact). */
const MAX_DURATION_MS = 40;

/**
 * Minimum milliseconds between vibrations for the same body pair.
 * Prevents haptic spam when bodies rest against each other.
 */
const COOLDOWN_MS = 80;

// ── Module state ──────────────────────────────────────────────────────────────

/**
 * Whether vibration is currently enabled.
 * Defaults to the value stored in localStorage (key: 'gyroballs_vibration'),
 * falling back to true if nothing is stored.
 */
let _enabled = _readEnabled();

/**
 * Whether the current browser supports navigator.vibrate.
 * Checked once at module load time to avoid repeated property lookups.
 */
const _supported = typeof navigator !== 'undefined' &&
                   typeof navigator.vibrate === 'function';

/**
 * Per-pair cooldown map.
 * Keys are `${minId}_${maxId}` (body ID pair, sorted), values are
 * performance.now() timestamps of the last vibration emitted for that pair.
 */
const _cooldowns = new Map();

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Initialise the vibration module.  Attaches a Matter.js 'collisionStart'
 * listener to the provided engine to trigger haptic pulses on impact.
 *
 * If the browser does not support navigator.vibrate the listener is not
 * attached and all calls are silently skipped — no errors are thrown.
 *
 * Returns an object the settings module (TASK-009) can use to toggle haptics:
 *   vibration.setVibrationEnabled(false)  — disable haptic feedback
 *
 * @param {Matter.Engine} engine  The active Matter.js engine.
 * @returns {{ setVibrationEnabled: (on: boolean) => void }}
 */
export function initVibration(engine) {
  if (_supported) {
    const { Events } = Matter;
    Events.on(engine, 'collisionStart', _onCollision);
  }

  return {
    setVibrationEnabled,
  };
}

/**
 * Enable or disable vibration feedback and persist the preference to localStorage.
 * Called by the settings module (TASK-009) when the user toggles the vibration switch.
 *
 * @param {boolean} on
 */
export function setVibrationEnabled(on) {
  _enabled = Boolean(on);
  localStorage.setItem('gyroballs_vibration', _enabled ? '1' : '0');
}

// ── Private helpers ───────────────────────────────────────────────────────────

/**
 * Matter.js 'collisionStart' handler.
 * Classifies each colliding pair as ball-wall or ball-ball, throttles by
 * per-pair cooldown, and triggers a haptic pulse scaled to impact speed.
 *
 * @param {{ pairs: Matter.Collision[] }} event
 */
function _onCollision(event) {
  if (!_enabled) return;

  const now = performance.now();

  for (const pair of event.pairs) {
    const { bodyA, bodyB } = pair;

    // ── Classify the collision pair ───────────────────────────────────────────
    const aIsBall = bodyA.label === 'ball';
    const bIsBall = bodyB.label === 'ball';
    const aIsWall = bodyA.label.startsWith('wall-');
    const bIsWall = bodyB.label.startsWith('wall-');

    let speed = 0;

    if (aIsBall && bIsBall) {
      // Ball-to-ball: relative speed between the two moving bodies
      const dvx = bodyA.velocity.x - bodyB.velocity.x;
      const dvy = bodyA.velocity.y - bodyB.velocity.y;
      speed = Math.sqrt(dvx * dvx + dvy * dvy);
    } else if ((aIsBall && bIsWall) || (bIsBall && aIsWall)) {
      // Ball-to-wall: the ball's own speed at impact
      const ball = aIsBall ? bodyA : bodyB;
      speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
    } else {
      continue; // ignore all other collision types
    }

    if (speed < MIN_SPEED) continue;

    // ── Per-pair cooldown ─────────────────────────────────────────────────────
    const key = _pairKey(bodyA.id, bodyB.id);
    const lastVibrated = _cooldowns.get(key) ?? 0;
    if (now - lastVibrated < COOLDOWN_MS) continue;
    _cooldowns.set(key, now);

    // ── Trigger haptic pulse ──────────────────────────────────────────────────
    const duration = _speedToDuration(speed);
    try {
      navigator.vibrate(duration);
    } catch {
      // Silently ignore — e.g. sandboxed iframes may throw on vibrate()
    }
  }
}

/**
 * Map a collision speed to a pulse duration in ms, linearly scaled between
 * MIN_DURATION_MS (gentle impact) and MAX_DURATION_MS (hard impact).
 *
 * @param {number} speed
 * @returns {number}  Duration in [MIN_DURATION_MS, MAX_DURATION_MS].
 */
function _speedToDuration(speed) {
  const t = Math.min(1, Math.max(0, (speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)));
  return Math.round(MIN_DURATION_MS + t * (MAX_DURATION_MS - MIN_DURATION_MS));
}

/**
 * Create a stable string key for a body pair, sorted by ID so order doesn't matter.
 *
 * @param {number} idA
 * @param {number} idB
 * @returns {string}
 */
function _pairKey(idA, idB) {
  return idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`;
}

/**
 * Read the stored vibration-enabled preference from localStorage.
 * Defaults to true if no value is stored.
 *
 * @returns {boolean}
 */
function _readEnabled() {
  const stored = localStorage.getItem('gyroballs_vibration');
  return stored === null ? true : stored !== '0';
}
