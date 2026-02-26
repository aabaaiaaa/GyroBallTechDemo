// js/physics.js — Matter.js engine, renderer, and ball creation (TASK-002)
'use strict';

const { Engine, Render, Runner, Bodies, Composite } = Matter;

/** Vibrant colours that pop against the dark (#111111) background. */
const BALL_COLOURS = [
  '#ff6b6b', '#ff9f43', '#ffd32a', '#0be881',
  '#48dbfb', '#54a0ff', '#c56ef2', '#ff9ff3',
  '#ff6b81', '#1dd1a1', '#00d2d3', '#feca57',
];

const DEFAULT_BALL_COUNT = 10;

/**
 * Initialise the Matter.js physics engine and renderer.
 *
 * Reads a saved ball count from localStorage (key: "gyroballs_count") so the
 * settings module (TASK-009) can persist the preference across reloads.
 * Falls back to DEFAULT_BALL_COUNT when no value is stored.
 *
 * @returns {{
 *   engine:         Matter.Engine,
 *   runner:         Matter.Runner,
 *   render:         Matter.Render,
 *   createBalls:    (count: number) => Matter.Body[],
 *   removeAllBalls: () => void,
 * }}
 */
export function initPhysics() {
  const canvas = document.getElementById('world');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  // ── Engine ──────────────────────────────────────────────────────────────
  const engine = Engine.create();
  // Default downward gravity; the gyroscope/mouse modules (TASK-005, TASK-006)
  // will override these values in real time.
  engine.gravity.x = 0;
  engine.gravity.y = 1;

  // ── Renderer ─────────────────────────────────────────────────────────────
  const render = Render.create({
    canvas,
    engine,
    options: {
      width:      canvas.width,
      height:     canvas.height,
      background: '#111111',
      wireframes: false,
    },
  });

  // ── Runner ────────────────────────────────────────────────────────────────
  const runner = Runner.create();
  Runner.run(runner, engine);
  Render.run(render);

  // ── Initial balls ─────────────────────────────────────────────────────────
  _addBalls(engine, _storedBallCount());

  // ── Viewport resize ───────────────────────────────────────────────────────
  window.addEventListener('resize', () => _onResize(render, canvas));

  return {
    engine,
    runner,
    render,
    createBalls:    (count) => _addBalls(engine, count),
    removeAllBalls: ()      => _removeAllBalls(engine),
    resetBalls:     (count) => _resetBalls(engine, count),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return the ball count saved in localStorage, clamped to [1, 30].
 * Falls back to DEFAULT_BALL_COUNT if nothing is stored or the value is invalid.
 */
function _storedBallCount() {
  const stored = parseInt(localStorage.getItem('gyroballs_count') || '', 10);
  if (isNaN(stored)) return DEFAULT_BALL_COUNT;
  return Math.min(30, Math.max(1, stored));
}

/**
 * Create `count` balls with randomised physical properties and add them to the
 * engine world.  Balls are seeded near the top-centre of the viewport so they
 * have room to fall and bounce once the boundary walls are added (TASK-003).
 *
 * Property ranges chosen so balls behave noticeably differently from one another:
 *   radius      15–40 px     — visual variety and different rolling dynamics
 *   density     0.001–0.004  — mass = density × area, heavier balls resist gravity less
 *   restitution 0.40–0.85    — all < 1 so kinetic energy is lost on every bounce
 *   friction    0.005–0.08   — surface friction when rolling/sliding
 *   frictionAir 0.008–0.030  — air drag; balls gradually slow and come to rest
 */
function _addBalls(engine, count) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const bodies = [];

  for (let i = 0; i < count; i++) {
    const radius      = _rand(15, 40);
    const colour      = BALL_COLOURS[Math.floor(Math.random() * BALL_COLOURS.length)];
    const restitution = _rand(0.40, 0.85);
    const friction    = _rand(0.005, 0.08);
    const frictionAir = _rand(0.008, 0.030);
    const density     = _rand(0.001, 0.004);

    // Scatter balls across the centre-60 % horizontally and top-40 % vertically
    // so they drop naturally into the play area without bunching at one edge.
    const x = _rand(w * 0.20, w * 0.80);
    const y = _rand(h * 0.05, h * 0.40);

    bodies.push(
      Bodies.circle(x, y, radius, {
        label: 'ball',
        restitution,
        friction,
        frictionAir,
        density,
        render: { fillStyle: colour, lineWidth: 0 },
      }),
    );
  }

  Composite.add(engine.world, bodies);
  return bodies;
}

/** Remove every body labelled "ball" from the world. */
function _removeAllBalls(engine) {
  const balls = engine.world.bodies.filter(b => b.label === 'ball');
  Composite.remove(engine.world, balls);
}

/**
 * Create `count` balls clustered near the viewport centre.
 * Used by the shake-to-reset feature (TASK-010) so balls reappear at the
 * midpoint regardless of device orientation, giving the user a clean start.
 *
 * @param {Matter.Engine} engine
 * @param {number}        count
 * @returns {Matter.Body[]}
 */
function _resetBalls(engine, count) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const bodies = [];

  for (let i = 0; i < count; i++) {
    const radius      = _rand(15, 40);
    const colour      = BALL_COLOURS[Math.floor(Math.random() * BALL_COLOURS.length)];
    const restitution = _rand(0.40, 0.85);
    const friction    = _rand(0.005, 0.08);
    const frictionAir = _rand(0.008, 0.030);
    const density     = _rand(0.001, 0.004);

    // Cluster balls within the central 30 % of the screen width/height
    // so they all appear near the midpoint after a reset.
    const x = _rand(w * 0.35, w * 0.65);
    const y = _rand(h * 0.35, h * 0.65);

    bodies.push(
      Bodies.circle(x, y, radius, {
        label: 'ball',
        restitution,
        friction,
        frictionAir,
        density,
        render: { fillStyle: colour, lineWidth: 0 },
      }),
    );
  }

  Composite.add(engine.world, bodies);
  return bodies;
}

/** Keep the renderer and canvas dimensions in sync with the viewport. */
function _onResize(render, canvas) {
  const w = window.innerWidth;
  const h = window.innerHeight;

  canvas.width          = w;
  canvas.height         = h;
  render.options.width  = w;
  render.options.height = h;
  render.canvas.width   = w;
  render.canvas.height  = h;

  Render.lookAt(render, { min: { x: 0, y: 0 }, max: { x: w, y: h } });
}

/** Return a random float in [min, max). */
function _rand(min, max) {
  return Math.random() * (max - min) + min;
}
