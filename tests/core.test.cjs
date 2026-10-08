const test = require('node:test'),
  assert = require('node:assert/strict'),
  Core = require('../dist/js/city/core.js');
test('all 121 landmark journeys reach their entrance without crossing buildings', () => {
  for (const from of Core.landmarks)
    for (const to of Core.landmarks) {
      const points = Core.route(from.arrival, to);
      assert.ok(points.length, from.id + ' -> ' + to.id);
      let start = from.arrival;
      for (const end of points) {
        assert.ok(Core.clearLine(start, end));
        start = end;
      }
      assert.ok(Core.distance(start, to.arrival) < 0.01);
    }
});
test('perspective places forward objects in front and backward objects behind', () => {
  const matrix = Core.multiply(
    Core.perspective(Math.PI / 3, 16 / 9, 0.08, 220),
    Core.view(0, 1.45, 23, 0, 0),
  );
  const front = Core.project(matrix, 0, 1.45, 4),
    back = Core.project(matrix, 0, 1.45, 30);
  assert.ok(front.w > 0);
  assert.ok(Math.abs(front.x) < 0.0001);
  assert.ok(back.w < 0);
});
test('world geometry is deterministic and finite', () => {
  const a = Core.mesh(),
    b = Core.mesh();
  assert.deepEqual(a, b);
  assert.equal(a.length % Core.STRIDE, 0);
  assert.ok(a.every(Number.isFinite));
});
test('walking cannot cross a building edge or world boundary', () => {
  const p = Core.landmarks[0];
  assert.equal(Core.canWalk(p.x, p.z), false);
  const a = { x: p.x + 5.7, z: p.z };
  assert.deepEqual(Core.slide(a, -0.3, 0), a);
  assert.equal(Core.canWalk(63, 0), false);
});
test('secondary city buildings participate in collision and route planning', () => {
  for (const p of Core.blockers) {
    assert.equal(Core.canWalk(p.x, p.z), false);
    const start = { x: p.x - 8, z: p.z },
      end = { x: p.x + 8, z: p.z };
    assert.equal(Core.clearLine(start, end), false);
    const route = Core.route(start, end);
    assert.ok(route.length > 1);
    let last = start;
    for (const step of route) {
      assert.ok(Core.clearLine(last, step));
      last = step;
    }
  }
});
