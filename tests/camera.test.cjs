const test = require('node:test'),
  assert = require('node:assert/strict'),
  Core = require('../dist/js/city/core.js'),
  Camera = require('../dist/js/city/camera.js');
const ground = () => ({ x: 0, y: 1.45, z: 23, yaw: -0.25, pitch: 0 });
test('overview frames all eleven landmarks on desktop and portrait screens', () => {
  for (const aspect of [16 / 9, 1, 390 / 844]) {
    const eye = Camera.overview(aspect),
      m = Core.multiply(
        Core.perspective(Math.PI / 3, aspect, 0.08, 640),
        Core.view(eye.x, eye.y, eye.z, eye.yaw, eye.pitch),
      );
    for (const p of Core.landmarks) {
      const q = Core.project(m, p.x, p.height + 1.5, p.z);
      assert.ok(
        q.w > 0 && Math.abs(q.x) < 0.9 && Math.abs(q.y) < 0.8,
        `${aspect} ${p.id}: ${JSON.stringify(q)}`,
      );
    }
  }
});
test('flight leaves walking position untouched and returns to the exact saved pose', () => {
  const p = ground(),
    initial = { ...p },
    s = Camera.create(p);
  Camera.setMode(s, 'world', p, 16 / 9, true);
  for (let i = 0; i < 100; i++) Camera.fly(s, { forward: 1, side: 1, up: 1, fast: true }, 0.02);
  assert.deepEqual(p, initial);
  assert.ok(s.flight.y > 100);
  Camera.setMode(s, 'walk', p, 16 / 9, false);
  for (let i = 0; i < 120; i++) Camera.sample(s, p, 1 / 60);
  assert.equal(s.transition, null);
  assert.deepEqual(s.eye, p);
});
test('camera transition takes the short angle and settles at all common frame rates', () => {
  for (const hz of [30, 60, 120]) {
    const p = ground(),
      s = Camera.create(p);
    Camera.setMode(s, 'world', p, 16 / 9);
    const initial = { ...s.eye };
    Camera.sample(s, p, 1 / hz);
    assert.ok(s.eye.y > initial.y && s.eye.y < 5);
    for (let i = 0; i < hz * 2; i++) Camera.sample(s, p, 1 / hz);
    assert.equal(s.transition, null);
    assert.deepEqual(s.eye, s.flight);
  }
});
test('free flight has altitude and horizontal bounds and brakes after input release', () => {
  const p = ground(),
    s = Camera.create(p);
  Camera.setMode(s, 'world', p, 1, true);
  for (let i = 0; i < 2000; i++) Camera.fly(s, { forward: 1, side: 1, up: 1, fast: true }, 0.04);
  assert.ok(Math.abs(s.flight.x) <= 260 && Math.abs(s.flight.z) <= 260 && s.flight.y <= 330);
  for (let i = 0; i < 150; i++) Camera.fly(s, { forward: 0, side: 0, up: 0, fast: false }, 0.02);
  assert.ok(Math.hypot(...Object.values(s.velocity)) < 0.001);
  for (let i = 0; i < 1000; i++) Camera.fly(s, { forward: 0, side: 0, up: -1, fast: true }, 0.04);
  assert.equal(s.flight.y, Camera.floor(s.flight.x, s.flight.z));
});
test('zoom closes distance to the ground and reduced motion changes view immediately', () => {
  const p = ground(),
    s = Camera.create(p);
  Camera.setMode(s, 'world', p, 16 / 9, true);
  assert.equal(s.transition, null);
  const y = s.flight.y;
  Camera.zoom(s, -100);
  assert.ok(s.flight.y < y);
  Camera.frameWorld(s, true, 16 / 9);
  assert.deepEqual(s.eye, Camera.overview(16 / 9));
});
test('flight and wheel zoom cannot enter a tall career building', () => {
  const s = Camera.create(ground()),
    p = Core.landmarks.find(p => p.id === 'hyphenate');
  s.mode = 'world';
  s.flight = { x: p.x - 7, y: 10, z: p.z, yaw: Math.PI / 2, pitch: 0 };
  for (let i = 0; i < 100; i++) Camera.fly(s, { forward: 1, side: 0, up: 0, fast: true }, 0.02);
  assert.ok(s.flight.x <= p.x - 6);
  Camera.zoom(s, -100);
  assert.ok(Core.canFly(s.flight.x, s.flight.y, s.flight.z));
  s.flight = { x: p.x, y: p.height + 3, z: p.z, yaw: 0, pitch: -1 };
  for (let i = 0; i < 100; i++) Camera.fly(s, { forward: 0, side: 0, up: -1, fast: true }, 0.02);
  assert.ok(s.flight.y >= p.height + 2);
});
test('take off from the street, fly low, and touch down where you descend', () => {
  const p = ground(),
    s = Camera.create(p);
  Camera.takeOff(s, p, { x: 1, z: 0 });
  assert.equal(s.mode, 'world');
  assert.equal(s.transition, null);
  for (let i = 0; i < 60; i++) Camera.fly(s, { forward: 0, side: 0, up: 1, fast: false }, 1 / 60);
  assert.ok(s.flight.y > p.y + 3);
  let landed = false;
  for (let i = 0; i < 600 && !landed; i++) {
    Camera.fly(s, { forward: 0, side: 0, up: -1, fast: false }, 1 / 60);
    landed = s.touchdown;
  }
  assert.ok(landed);
  assert.ok(Math.abs(s.flight.y - Camera.floor(s.flight.x, s.flight.z)) < 1e-6);
  const drop = Camera.land(s, p);
  assert.equal(s.mode, 'walk');
  assert.ok(drop < 1e-6);
  assert.ok(Core.canWalk(p.x, p.z));
});
test('flight is gentle near the street and quicker up high', () => {
  const p = ground(),
    low = Camera.create(p),
    high = Camera.create(p);
  Camera.takeOff(low, p);
  Camera.takeOff(high, p);
  low.velocity = { x: 0, y: 0, z: 0 };
  high.velocity = { x: 0, y: 0, z: 0 };
  high.flight = { x: 100, y: 120, z: 100, yaw: 0, pitch: 0 };
  for (let i = 0; i < 120; i++) {
    Camera.fly(low, { forward: 1, side: 0, up: 0, fast: false }, 1 / 60);
    Camera.fly(high, { forward: 1, side: 0, up: 0, fast: false }, 1 / 60);
  }
  const speed = s => Math.hypot(s.velocity.x, s.velocity.z);
  assert.ok(speed(low) < 14 && speed(low) > 8, `low ${speed(low)}`);
  assert.ok(speed(high) > speed(low) * 2.5, `high ${speed(high)}`);
});
