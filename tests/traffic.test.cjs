const test = require('node:test'),
  assert = require('node:assert/strict'),
  City = require('../dist/js/city/layout.js'),
  Core = require('../dist/js/city/core.js');
test('traffic stays on streets and outside every building across repeated circuits', () => {
  for (let i = 0; i < City.TRAFFIC; i++)
    for (let t = 0; t < 150; t += 0.1) {
      const p = City.trafficPose(i, t);
      assert.ok(Core.canWalk(p.x, p.z));
      assert.ok(City.streets.some(n => Math.abs(p.x - n) < 2.7 || Math.abs(p.z - n) < 2.7));
      assert.ok(Number.isFinite(p.yaw));
    }
});
test('rounded street corners keep vehicle position and direction continuous', () => {
  for (let i = 0; i < City.TRAFFIC; i++) {
    let previous = City.trafficPose(i, 0);
    for (let t = 0.01; t < 45; t += 0.01) {
      const p = City.trafficPose(i, t);
      assert.ok(Core.distance(previous, p) < 0.05);
      const turn = Math.atan2(Math.sin(p.yaw - previous.yaw), Math.cos(p.yaw - previous.yaw));
      assert.ok(Math.abs(turn) < 0.025);
      previous = p;
    }
  }
});
