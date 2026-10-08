/* Creative-style flight, kept independent from the grounded visitor and the renderer. */
(function (root) {
  'use strict';
  const F =
    typeof module === 'object' && module.exports ? require('./field-core.js') : root.FieldCore;
  const copy = p => ({ x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch });
  function overview(aspect = 16 / 9) {
    const half = Math.atan(Math.tan(Math.PI / 6) * Math.min(1, Math.max(0.35, aspect)));
    const distance = (80 / Math.sin(half)) * 1.05,
      norm = Math.hypot(0.45, 0.65, 0.65);
    const x = (distance * 0.45) / norm,
      y = (distance * 0.65) / norm,
      z = (distance * 0.65) / norm;
    return { x, y, z, yaw: Math.atan2(-x, z), pitch: Math.atan2(-y, Math.hypot(x, z)) };
  }
  function create(ground) {
    return {
      mode: 'walk',
      flight: overview(),
      eye: copy(ground),
      velocity: { x: 0, y: 0, z: 0 },
      transition: null,
    };
  }
  function resetVelocity(state) {
    state.velocity = { x: 0, y: 0, z: 0 };
  }
  function transition(state, target, reduced) {
    resetVelocity(state);
    if (reduced) {
      state.eye = copy(target);
      state.transition = null;
      return;
    }
    state.transition = { from: copy(state.eye), to: copy(target), elapsed: 0 };
  }
  function setMode(state, mode, ground, aspect, reduced = false) {
    state.mode = mode;
    if (mode === 'world') state.flight = overview(aspect);
    transition(state, mode === 'world' ? state.flight : ground, reduced);
  }
  function frameWorld(state, reduced = false, aspect = 16 / 9) {
    state.flight = overview(aspect);
    transition(state, state.flight, reduced);
  }
  function sample(state, ground, dt) {
    if (state.transition) {
      const t = state.transition;
      t.elapsed += Math.max(0, dt);
      const v = F.clamp(t.elapsed / 1.15, 0, 1),
        s = v * v * (3 - 2 * v),
        eye = {};
      for (const key of ['x', 'y', 'z', 'pitch'])
        eye[key] = t.from[key] + (t.to[key] - t.from[key]) * s;
      const angle = Math.atan2(Math.sin(t.to.yaw - t.from.yaw), Math.cos(t.to.yaw - t.from.yaw));
      eye.yaw = t.from.yaw + angle * s;
      state.eye = eye;
      if (v === 1) state.transition = null;
    } else state.eye = copy(state.mode === 'world' ? state.flight : ground);
    return state.eye;
  }
  function fly(state, input, dt) {
    if (state.mode !== 'world' || state.transition) return false;
    dt = F.clamp(dt, 0, 0.05);
    const p = state.flight,
      f = F.forward(p.yaw),
      norm = Math.max(1, Math.hypot(input.forward, input.side, input.up)),
      speed = input.fast ? 38 : 19;
    const target = {
      x: ((f.x * input.forward + Math.cos(p.yaw) * input.side) * speed) / norm,
      z: ((f.z * input.forward + Math.sin(p.yaw) * input.side) * speed) / norm,
      y: (input.up * speed) / norm,
    };
    const old = copy(p),
      damping = 1 - Math.exp(-8 * dt);
    for (const axis of ['y', 'x', 'z']) {
      state.velocity[axis] += (target[axis] - state.velocity[axis]) * damping;
      const next = {
        ...p,
        [axis]: F.clamp(
          p[axis] + state.velocity[axis] * dt,
          axis === 'y' ? 7 : -260,
          axis === 'y' ? 330 : 260,
        ),
      };
      if (F.canFly(next.x, next.y, next.z)) p[axis] = next[axis];
      else state.velocity[axis] = 0;
    }
    return Math.hypot(p.x - old.x, p.y - old.y, p.z - old.z) > 0.00001;
  }
  function zoom(state, delta) {
    if (state.mode !== 'world' || state.transition) return;
    const p = state.flight,
      step = F.clamp(delta, -100, 100) * Math.max(0.035, p.y * 0.0016),
      cp = Math.cos(p.pitch),
      start = copy(p);
    const next = {
      x: F.clamp(p.x - Math.sin(p.yaw) * cp * step, -260, 260),
      z: F.clamp(p.z + Math.cos(p.yaw) * cp * step, -260, 260),
      y: F.clamp(p.y - Math.sin(p.pitch) * step, 7, 330),
    };
    const steps = Math.max(
      1,
      Math.ceil(Math.hypot(next.x - p.x, next.y - p.y, next.z - p.z) / 0.2),
    );
    for (let i = 1; i <= steps; i++) {
      const t = i / steps,
        q = {
          x: start.x + (next.x - start.x) * t,
          y: start.y + (next.y - start.y) * t,
          z: start.z + (next.z - start.z) * t,
        };
      if (!F.canFly(q.x, q.y, q.z)) break;
      Object.assign(p, q);
    }
    resetVelocity(state);
  }
  const api = { overview, create, setMode, frameWorld, sample, fly, zoom, resetVelocity };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FieldCamera = api;
})(typeof window !== 'undefined' ? window : globalThis);
