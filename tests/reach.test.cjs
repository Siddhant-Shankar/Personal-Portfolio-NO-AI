const test = require('node:test'),
  assert = require('node:assert/strict'),
  Core = require('../dist/js/city/core.js');
const place = id => Core.landmarks.find(p => p.id === id);
test('a building is in reach from any side, not just its front door', () => {
  const p = place('hyphenate');
  for (const [dx, dz] of [
    [0, 8],
    [0, -8],
    [8, 0],
    [-8, 0],
    [7, 7],
  ]) {
    const near = Core.closest({ x: p.x + dx, y: 1.45, z: p.z + dz });
    assert.equal(near.place.id, p.id, `${dx}, ${dz}`);
    assert.ok(near.distance < 8, `${dx}, ${dz}: ${near.distance}`);
  }
});
test('reach works at any height: beside the walls, over the roof, and not far above it', () => {
  const p = place('parasol');
  assert.ok(Core.gap({ x: p.x + 7, y: 18, z: p.z }, p) < 2);
  assert.equal(Core.gap({ x: p.x, y: p.height + 4, z: p.z }, p), 0);
  assert.ok(Core.gap({ x: p.x, y: p.height + 40, z: p.z }, p) > 25);
});
test('every street crossing has a nearest building, and the open overview has none in reach', () => {
  for (const x of Core.city.streets)
    for (const z of Core.city.streets)
      assert.ok(Number.isFinite(Core.closest({ x, y: 1.45, z }).distance));
  assert.ok(Core.closest({ x: 120, y: 160, z: 170 }).distance > 100);
});
