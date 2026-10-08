const test = require('node:test'),
  assert = require('node:assert/strict'),
  Core = require('../dist/js/city/core.js'),
  Wildlife = require('../dist/js/city/wildlife.js');
test('wildlife roams for five minutes without entering buildings or escaping the field', () => {
  const world = Wildlife.create();
  for (let i = 0; i < 9000; i++) {
    Wildlife.update(world, 1 / 30, { x: Math.sin(i * 0.003) * 40, z: Math.cos(i * 0.004) * 40 });
    for (const a of world.animals) {
      assert.ok(Core.canWalk(a.x, a.z), a.id + ' collided');
      assert.ok([a.x, a.z, a.yaw, a.phase, a.pace].every(Number.isFinite));
    }
  }
});
test('nearby visitor makes an animal yield, then return to idle', () => {
  const world = Wildlife.create();
  world.animals = world.animals.slice(0, 1);
  const a = world.animals[0],
    player = { x: a.x - 0.5, z: a.z },
    initial = Core.distance(a, player);
  for (let i = 0; i < 90; i++) Wildlife.update(world, 1 / 30, player);
  assert.ok(Core.distance(a, player) > initial + 2);
  let rested = false;
  for (let i = 0; i < 1800; i++) {
    Wildlife.update(world, 1 / 30, { x: 60, z: 60 });
    if (!a.goal && a.pace < 0.05) rested = true;
  }
  assert.ok(rested);
});
test('animal geometry uses the renderer vertex format and remains finite', () => {
  const world = Wildlife.create(),
    mesh = Wildlife.mesh(world);
  assert.equal(mesh.length % Core.STRIDE, 0);
  assert.ok(mesh.every(Number.isFinite));
  assert.ok(mesh.length > 1000);
});
test('most animals begin roaming immediately and cover meaningful ground', () => {
  const world = Wildlife.create();
  Wildlife.update(world, 1 / 60, { x: 60, y: 100, z: 60 });
  assert.ok(world.animals.filter(a => a.goal).length >= 12);
  const travel = world.animals.map(() => 0);
  for (let i = 0; i < 3600; i++) {
    const previous = world.animals.map(a => ({ ...a }));
    Wildlife.update(world, 1 / 60, { x: 60, y: 100, z: 60 });
    world.animals.forEach((a, j) => (travel[j] += Core.distance(a, previous[j])));
  }
  assert.ok(
    travel.every(d => d > 15),
    JSON.stringify(travel),
  );
});
test('an overhead camera does not frighten animals', () => {
  const a = Wildlife.create(),
    b = Wildlife.create();
  const p = a.animals[0];
  Wildlife.update(a, 0.03, { x: p.x - 0.5, y: 80, z: p.z });
  Wildlife.update(b, 0.03, { x: 60, y: 80, z: 60 });
  assert.deepEqual(a.animals, b.animals);
});
