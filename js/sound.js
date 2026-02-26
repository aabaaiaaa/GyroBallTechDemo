// js/sound.js — Web Audio API collision & countdown sounds (TASK-007)
'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Minimum relative speed (px/tick) below which no sound is emitted. */
const MIN_SPEED = 1.0;

/** Speed at which volume reaches 1.0 (clamps above this). */
const MAX_SPEED = 20;

/**
 * Minimum milliseconds between sounds for the same body pair.
 * Prevents audio spam when bodies rest against each other.
 */
const COOLDOWN_MS = 80;

// ── Module state ──────────────────────────────────────────────────────────────

/** Lazy-created AudioContext — created on first collision or beep request. */
let _ctx = null;

/**
 * Whether sound is currently enabled.
 * Defaults to the value stored in localStorage (key: 'gyroballs_sound'),
 * falling back to true if nothing is stored.
 */
let _enabled = _readEnabled();

/**
 * Per-pair cooldown map.
 * Keys are `${minId}_${maxId}` (body ID pair, sorted), values are
 * performance.now() timestamps of the last sound emitted for that pair.
 */
const _cooldowns = new Map();

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Initialise the sound module.  Attaches a Matter.js 'collisionStart' listener
 * to the provided engine and wires up AudioContext resume on first user gesture.
 *
 * Returns an object the settings module (TASK-009) and reset module (TASK-010)
 * can use to control sound behaviour:
 *
 *   sound.setSoundEnabled(false)  — disable all sounds
 *   sound.playCountdownBeep(1)    — play the "1" countdown beep
 *
 * @param {Matter.Engine} engine  The active Matter.js engine.
 * @returns {{ playCountdownBeep: (step: number) => void, setSoundEnabled: (on: boolean) => void }}
 */
export function initSound(engine) {
  const { Events } = Matter;
  Events.on(engine, 'collisionStart', _onCollision);

  // Attempt to resume AudioContext after the first user gesture so sounds work
  // immediately once the user has interacted with the page.
  _scheduleContextResume();

  return {
    playCountdownBeep,
    setSoundEnabled,
  };
}

/**
 * Enable or disable all sounds and persist the preference to localStorage.
 * Called by the settings module (TASK-009) when the user toggles the sound switch.
 *
 * @param {boolean} on
 */
export function setSoundEnabled(on) {
  _enabled = Boolean(on);
  localStorage.setItem('gyroballs_sound', _enabled ? '1' : '0');
}

/**
 * Play a short ascending beep for the shake-to-reset countdown (TASK-010).
 *
 * Each step maps to one note of an A major triad:
 *   step 1 → A4  (440 Hz) — first count
 *   step 2 → C#5 (554 Hz) — second count
 *   step 3 → E5  (659 Hz) — third count / launch
 *
 * The ascending sequence creates a satisfying "building up" feel before reset.
 *
 * @param {number} step  Countdown step (1, 2, or 3).
 */
export function playCountdownBeep(step) {
  if (!_enabled) return;
  const ctx = _getContext();
  if (!ctx) return;

  const freqMap = { 1: 440, 2: 554, 3: 659 };
  const freq = freqMap[step] ?? 440;
  const now  = ctx.currentTime;

  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);

  // Envelope: quick attack → brief hold → gentle release
  gain.gain.setValueAtTime(0,    now);
  gain.gain.linearRampToValueAtTime(0.55, now + 0.012);   // attack  12 ms
  gain.gain.setValueAtTime(0.55, now + 0.12);             // hold   108 ms
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28); // release

  osc.start(now);
  osc.stop(now + 0.28);
}

// ── Private helpers ───────────────────────────────────────────────────────────

/**
 * Matter.js 'collisionStart' handler.
 * Classifies each colliding pair as ball-wall or ball-ball, throttles by
 * per-pair cooldown, and dispatches the appropriate synthesised sound.
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

    let speed      = 0;
    let isBallBall = false;

    if (aIsBall && bIsBall) {
      // Ball-to-ball: relative speed between the two moving bodies
      const dvx = bodyA.velocity.x - bodyB.velocity.x;
      const dvy = bodyA.velocity.y - bodyB.velocity.y;
      speed      = Math.sqrt(dvx * dvx + dvy * dvy);
      isBallBall = true;
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
    const lastPlayed = _cooldowns.get(key) ?? 0;
    if (now - lastPlayed < COOLDOWN_MS) continue;
    _cooldowns.set(key, now);

    // ── Emit the appropriate sound ────────────────────────────────────────────
    const volume = _speedToVolume(speed);
    if (isBallBall) {
      _playBallCollision(volume);
    } else {
      _playWallCollision(volume);
    }
  }
}

/**
 * Synthesise a soft low-frequency thud for wall impacts.
 *
 * A sine wave sweeps from 90 Hz → 45 Hz over a short decay, producing a
 * dull, padded knock that suits a rubber ball hitting a hard boundary.
 *
 * @param {number} volume  Gain level in [0, 1].
 */
function _playWallCollision(volume) {
  const ctx = _getContext();
  if (!ctx) return;

  const now  = ctx.currentTime;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(90, now);
  osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume * 0.50, now + 0.008); // fast attack
  gain.gain.exponentialRampToValueAtTime(0.001,    now + 0.18);  // decay

  osc.start(now);
  osc.stop(now + 0.18);
}

/**
 * Synthesise a short higher-pitched click for ball-to-ball collisions.
 *
 * A triangle wave sweeps from 320 Hz → 160 Hz over a very short envelope,
 * giving a crisp tick/click that sounds distinct from the wall thud.
 *
 * @param {number} volume  Gain level in [0, 1].
 */
function _playBallCollision(volume) {
  const ctx = _getContext();
  if (!ctx) return;

  const now  = ctx.currentTime;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(160, now + 0.06);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume * 0.35, now + 0.004); // very fast attack
  gain.gain.exponentialRampToValueAtTime(0.001,    now + 0.10);  // short decay

  osc.start(now);
  osc.stop(now + 0.10);
}

/**
 * Lazy-create the AudioContext and resume it if suspended.
 *
 * Browsers require a user gesture before audio can play.  We call resume()
 * opportunistically here; if the context is still suspended the call is a
 * no-op until the browser allows it (typically after the first click/tap).
 *
 * @returns {AudioContext|null}  Null if the Web Audio API is unavailable.
 */
function _getContext() {
  const Ctor = window.AudioContext ?? window.webkitAudioContext;
  if (!Ctor) return null;

  if (!_ctx) {
    try {
      _ctx = new Ctor();
    } catch {
      return null;
    }
  }

  if (_ctx.state === 'suspended') {
    _ctx.resume().catch(() => { /* ignore: will retry on next sound */ });
  }

  return _ctx;
}

/**
 * Register one-time event listeners so the AudioContext is resumed the moment
 * the user first interacts with the page (click or touch).  This is required
 * by browser autoplay policies and ensures sounds work from the very first
 * collision after user interaction.
 */
function _scheduleContextResume() {
  const tryResume = () => {
    const ctx = _getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => { /* ignore */ });
    }
  };

  document.addEventListener('click',      tryResume, { once: true, passive: true });
  document.addEventListener('touchstart', tryResume, { once: true, passive: true });
  document.addEventListener('touchend',   tryResume, { once: true, passive: true });
}

/**
 * Map a collision speed to a 0–1 volume using a linear scale clamped between
 * MIN_SPEED and MAX_SPEED.  Speeds at or below MIN_SPEED return 0 (silent).
 *
 * @param {number} speed
 * @returns {number}  Volume in [0, 1].
 */
function _speedToVolume(speed) {
  return Math.min(1, (speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED));
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
 * Read the stored sound-enabled preference from localStorage.
 * Defaults to true if no value is stored.
 *
 * @returns {boolean}
 */
function _readEnabled() {
  const stored = localStorage.getItem('gyroballs_sound');
  return stored === null ? true : stored !== '0';
}
