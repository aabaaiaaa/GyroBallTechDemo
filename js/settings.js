// js/settings.js — Settings panel + localStorage persistence (TASK-009)
'use strict';

import { setSoundEnabled }     from './sound.js';
import { setVibrationEnabled } from './vibration.js';

// ── localStorage keys (shared with physics.js, sound.js, vibration.js) ────────
const KEY_COUNT     = 'gyroballs_count';
const KEY_SOUND     = 'gyroballs_sound';
const KEY_VIBRATION = 'gyroballs_vibration';

// ── DOM references ─────────────────────────────────────────────────────────────
const panel          = document.getElementById('settings-panel');
const btnSettings    = document.getElementById('btn-settings');
const sliderBalls    = document.getElementById('ball-count');
const displayBalls   = document.getElementById('ball-count-display');
const checkSound     = document.getElementById('toggle-sound');
const checkVibration = document.getElementById('toggle-vibration');

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Initialise the settings panel.
 *
 * Reads persisted values from localStorage and applies them to the UI
 * controls, then attaches all event listeners.
 *
 * @param {{ engine: Matter.Engine, createBalls: (n: number) => void, removeAllBalls: () => void }} physics
 *   The object returned by initPhysics() — used to reset the simulation when
 *   the ball count changes.
 */
export function initSettings(physics) {
  _applyStoredValues();
  _attachListeners(physics);
}

// ── Private helpers ───────────────────────────────────────────────────────────

/**
 * Read persisted settings from localStorage and apply them to the UI controls.
 * This keeps the UI in sync with whatever was saved from a previous session.
 */
function _applyStoredValues() {
  // Ball count
  const storedCount = parseInt(localStorage.getItem(KEY_COUNT) || '', 10);
  const count = isNaN(storedCount) ? 10 : Math.min(30, Math.max(1, storedCount));
  sliderBalls.value     = count;
  displayBalls.textContent = count;

  // Sound toggle
  const storedSound = localStorage.getItem(KEY_SOUND);
  checkSound.checked = storedSound === null ? true : storedSound !== '0';

  // Vibration toggle
  const storedVibration = localStorage.getItem(KEY_VIBRATION);
  checkVibration.checked = storedVibration === null ? true : storedVibration !== '0';
}

/**
 * Attach all event listeners for the settings panel.
 *
 * @param {{ removeAllBalls: () => void, createBalls: (n: number) => void }} physics
 */
function _attachListeners(physics) {
  // ── Gear button: toggle panel open/closed ────────────────────────────────
  btnSettings.addEventListener('click', (e) => {
    e.stopPropagation();
    _togglePanel();
  });

  // ── Dismiss panel when tapping/clicking outside it ───────────────────────
  document.addEventListener('click', (e) => {
    if (!panel.classList.contains('hidden') &&
        !panel.contains(e.target) &&
        e.target !== btnSettings) {
      _closePanel();
    }
  });

  // On touch devices the 'click' event fires after touchend, so the above
  // listener also handles tap-outside dismissal correctly.

  // ── Ball count slider ────────────────────────────────────────────────────
  sliderBalls.addEventListener('input', () => {
    const count = parseInt(sliderBalls.value, 10);
    displayBalls.textContent = count;
  });

  sliderBalls.addEventListener('change', () => {
    const count = parseInt(sliderBalls.value, 10);
    displayBalls.textContent = count;
    localStorage.setItem(KEY_COUNT, count);
    // Reset the simulation with the new ball count
    physics.removeAllBalls();
    physics.createBalls(count);
  });

  // ── Sound toggle ─────────────────────────────────────────────────────────
  checkSound.addEventListener('change', () => {
    setSoundEnabled(checkSound.checked);
  });

  // ── Vibration toggle ─────────────────────────────────────────────────────
  checkVibration.addEventListener('change', () => {
    setVibrationEnabled(checkVibration.checked);
  });
}

/** Open the settings panel and update the gear button state. */
function _openPanel() {
  panel.classList.remove('hidden');
  btnSettings.setAttribute('aria-expanded', 'true');
}

/** Close the settings panel and update the gear button state. */
function _closePanel() {
  panel.classList.add('hidden');
  btnSettings.setAttribute('aria-expanded', 'false');
}

/** Toggle the settings panel open or closed. */
function _togglePanel() {
  if (panel.classList.contains('hidden')) {
    _openPanel();
  } else {
    _closePanel();
  }
}
