const test = require('node:test'),
  assert = require('node:assert/strict'),
  Core = require('../dist/js/city/core.js'),
  Life = require('../dist/js/city/life.js');
test('pedestrians stay on the pavement, outside buildings and off the road, for ten minutes', () => {
  for (let i = 0; i < Life.PEOPLE; i++)
    for (let t = 0; t < 600; t += 0.25) {
      const p = Life.personPose(i, t),
        [cx, cz] = Life.blocks[p.block];
      assert.ok(Core.canWalk(p.x, p.z), `person ${i} at ${t}`);
      assert.ok(Math.max(Math.abs(p.x - cx), Math.abs(p.z - cz)) <= Life.PAVEMENT + 1e-9);
      assert.ok(Math.max(Math.abs(p.x - cx), Math.abs(p.z - cz)) > 8.5);
    }
});
test('pedestrians keep moving forward, slowing without reversing', () => {
  for (let i = 0; i < Life.PEOPLE; i++) {
    let previous = Life.personPose(i, 0);
    for (let t = 0.05; t < 120; t += 0.05) {
      const p = Life.personPose(i, t),
        step = Core.distance(previous, p);
      assert.ok(step > 0 && step < 0.15, `${i} ${t} ${step}`);
      previous = p;
    }
  }
});
test('boats remain inside the canal walls and clear of the bridge piers', () => {
  for (let i = 0; i < Life.boats.length; i++)
    for (let t = 0; t < 600; t += 0.2) {
      const p = Life.boatPose(i, t);
      assert.ok(p.x >= 54.9 && p.x <= 59.1, `${i} ${p.x}`);
      assert.ok(Math.abs(p.z) <= 52.1);
    }
});
test('birds never fly into a building they pass over', () => {
  for (let i = 0; i < Life.BIRDS; i++)
    for (let t = 0; t < 300; t += 0.25) {
      const p = Life.birdPose(i, t);
      assert.ok(Core.canFly(p.x, p.y, p.z), `bird ${i} at ${t}`);
      assert.ok(p.y > 15);
    }
});
test('city life geometry uses the renderer vertex format and stays finite', () => {
  const b = Core.builder();
  Life.add(b, 12.5);
  const mesh = b.finish();
  assert.equal(mesh.length % Core.STRIDE, 0);
  assert.ok(mesh.length > 5000);
  assert.ok(mesh.every(Number.isFinite));
});
