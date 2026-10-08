const test = require('node:test'),
  assert = require('node:assert/strict'),
  Core = require('../dist/js/city/core.js'),
  Landmarks = require('../dist/js/city/landmarks.js'),
  Career = require('./career.cjs');
test('animated set pieces build finite geometry in the renderer format at any time', () => {
  for (const t of [0, 3.3, 47.9, 600]) {
    const b = Core.builder();
    Landmarks.addAnimated(b, t);
    const m = b.finish();
    assert.equal(m.length % Core.STRIDE, 0);
    assert.ok(m.length > 10000 && m.every(Number.isFinite));
  }
});
test('every set piece has a finite anchor, a title, and three facts', () => {
  for (const f of Landmarks.features) {
    const p = f.where(12);
    assert.ok([p.x, p.y, p.z].every(Number.isFinite), f.id);
    assert.ok(f.title && f.lines.length === 3, f.id);
    assert.ok(f.chapter || f.github, f.id);
  }
});
test('every chapter and project a card links to exists', () => {
  for (const f of Landmarks.features) {
    if (f.chapter)
      assert.ok(
        Core.landmarks.some(l => l.id === f.chapter),
        f.id,
      );
    if (f.github)
      assert.ok(
        Career.projects.some(p => p.title === f.github),
        f.id,
      );
  }
});
test('the drone stays clear of the warehouse roof, its mast, and the chimney', () => {
  for (let t = 0; t < 200; t += 0.1) {
    const p = Landmarks.dronePose(t);
    assert.ok(p.y > 12.9);
    assert.ok(Math.hypot(p.x - 9.4, p.z + 33.5) > 1.2, `mast at ${t}`);
    assert.ok(Math.hypot(p.x - 15.7, p.z + 39) > 1.2, `chimney at ${t}`);
  }
});
test('the rooftop F1 car stays on its roof', () => {
  for (let t = 0; t < 200; t += 0.1) {
    const p = Landmarks.carPose(t);
    assert.ok(Math.abs(p.x - 36) < 4.3 && Math.abs(p.z + 36) < 4.3);
  }
});
test('the easel is solid street furniture', () => {
  assert.equal(Core.canWalk(Landmarks.EASEL.x, Landmarks.EASEL.z), false);
  assert.equal(Core.canWalk(Landmarks.EASEL.x, Landmarks.EASEL.z + 1.2), true);
});
