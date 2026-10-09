const test = require('node:test'),
  assert = require('node:assert/strict'),
  Core = require('../dist/js/city/core.js'),
  Layout = require('../dist/js/city/layout.js'),
  Rooftops = require('../dist/js/city/rooftops.js');
test('the island coast clears every street, block, and the canal with room to spare', () => {
  for (let i = 0; i < 720; i++) {
    const a = (i / 720) * Math.PI * 2,
      edge = Math.min(62 / Math.abs(Math.cos(a)), 62 / Math.abs(Math.sin(a)));
    assert.ok(Layout.coast(a) > edge + 10, `angle ${a.toFixed(2)}`);
  }
  for (const p of Core.landmarks) assert.ok(Layout.onIsland(p.x, p.z, 40), p.id);
});
test('rooftop signs build finite geometry in the renderer format', () => {
  const b = Core.builder({ edges: true });
  Rooftops.add(b, Core);
  const m = b.finish();
  assert.equal(m.length % Core.STRIDE, 0);
  assert.ok(m.length > 10000 && m.every(Number.isFinite));
  assert.ok(m.edges.every(Number.isFinite));
});
test('the name sign stands on the island, outside the city streets', () => {
  for (const [x, , z] of Rooftops.BANNER.corners) {
    assert.ok(Layout.onIsland(x, z, -2), `${x}, ${z}`);
    assert.ok(Math.abs(x) > 62 || Math.abs(z) > 62, `${x}, ${z}`);
  }
});
test('the whole city mesh, island included, stays finite', () => {
  const m = Core.mesh();
  assert.ok(m.every(Number.isFinite));
  assert.ok(m.edges.every(Number.isFinite));
});
test('moving rooftop signs stay finite and keep moving through the day', () => {
  const frames = [0, 0.4, 7.3, 361].map(t => {
    const b = Core.builder();
    Rooftops.addAnimated(b, t);
    return b.finish();
  });
  for (const m of frames) {
    assert.equal(m.length % Core.STRIDE, 0);
    assert.ok(m.length > 10000 && m.every(Number.isFinite));
  }
  assert.notDeepEqual(frames[0], frames[1]);
});
