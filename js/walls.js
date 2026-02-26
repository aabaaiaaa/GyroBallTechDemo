// js/walls.js — Screen-boundary static bodies (TASK-003)
'use strict';

const { Bodies, Composite } = Matter;

/**
 * Thickness of each wall in pixels.  Large enough to prevent fast balls from
 * tunnelling through at high velocities (a known Matter.js issue at thin sizes).
 */
const WALL_THICKNESS = 60;

/**
 * Add four invisible static wall bodies around the viewport edges so balls
 * stay contained within the screen.
 *
 * The walls are automatically rebuilt and repositioned whenever the viewport
 * size changes (window resize or device orientation change), ensuring they
 * always align with the current canvas dimensions.
 *
 * @param {Matter.Engine} engine  The active Matter.js engine.
 * @returns {{ update: () => void }}  Object with a manual `update()` method
 *   that can be called to force a wall rebuild (e.g. after an orientation
 *   change fires before the browser emits a 'resize' event).
 */
export function initWalls(engine) {
  // Keep a local mutable reference to the current set of wall bodies so they
  // can be removed and replaced when the viewport dimensions change.
  let currentWalls = _buildWalls();
  Composite.add(engine.world, currentWalls);

  /**
   * Remove the existing walls and create new ones sized to the current
   * viewport.  Called automatically on 'resize' and exposed as `update()`.
   */
  function _refresh() {
    Composite.remove(engine.world, currentWalls);
    currentWalls = _buildWalls();
    Composite.add(engine.world, currentWalls);
  }

  // Rebuild walls on every viewport resize (covers both window resize and
  // device orientation changes, which emit a 'resize' event after layout).
  window.addEventListener('resize', _refresh);

  return { update: _refresh };
}

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build four static rectangle bodies sized to the current viewport.
 *
 * Each wall is placed so its inner face aligns with the corresponding canvas
 * edge, producing a perfect containment box:
 *
 *   Top    — bottom face at y = 0
 *   Bottom — top face    at y = innerHeight
 *   Left   — right face  at x = 0
 *   Right  — left face   at x = innerWidth
 *
 * The extra `t * 2` added to the width/height of opposing walls ensures the
 * corner gaps are fully plugged so balls cannot escape through them.
 */
function _buildWalls() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const t = WALL_THICKNESS;

  return [
    // Top — centred above the canvas; bottom face sits at y = 0
    Bodies.rectangle(w / 2, -t / 2, w + t * 2, t, _opts('wall-top')),
    // Bottom — centred below the canvas; top face sits at y = h
    Bodies.rectangle(w / 2, h + t / 2, w + t * 2, t, _opts('wall-bottom')),
    // Left — centred left of the canvas; right face sits at x = 0
    Bodies.rectangle(-t / 2, h / 2, t, h + t * 2, _opts('wall-left')),
    // Right — centred right of the canvas; left face sits at x = w
    Bodies.rectangle(w + t / 2, h / 2, t, h + t * 2, _opts('wall-right')),
  ];
}

/** Shared options applied to every wall body. */
function _opts(label) {
  return {
    label,
    isStatic:   true,
    friction:   0.1,
    restitution: 0.3,
    render: { visible: false },
  };
}
