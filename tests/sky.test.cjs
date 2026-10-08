const test = require('node:test'),
  assert = require('node:assert/strict'),
  Sky = require('../dist/js/city/sky.js');
test('sky is continuous and finite across a full day, including midnight', () => {
  let previous = Sky.sample(0);
  for (let h = 0.01; h <= 24.001; h += 0.01) {
    const s = Sky.sample(h);
    for (const key of ['top', 'low', 'haze', 'sun', 'sunColor', 'ambient'])
      s[key].forEach((v, i) => {
        assert.ok(Number.isFinite(v));
        assert.ok(Math.abs(v - previous[key][i]) < 0.05, `${key} jumps at ${h.toFixed(2)}`);
      });
    assert.ok(Math.abs(s.night - previous.night) < 0.05);
    assert.ok(Math.abs(Math.hypot(...s.sun) - 1) < 1e-9);
    previous = s;
  }
});
test('city lights are off at noon and on at midnight; the sun is high at noon', () => {
  assert.equal(Sky.sample(12).night, 0);
  assert.equal(Sky.sample(0).night, 1);
  assert.ok(Sky.sample(12).sun[1] > 0.9);
  assert.ok(Sky.sample(12).sunColor[0] > Sky.sample(2).sunColor[0]);
});
test('clock labels and phases read correctly', () => {
  assert.equal(Sky.label(0), '00:00');
  assert.equal(Sky.label(13.5), '13:30');
  assert.equal(Sky.label(25.25), '01:15');
  assert.equal(Sky.phase(12), 'Afternoon');
  assert.equal(Sky.phase(18), 'Golden hour');
  assert.equal(Sky.phase(23), 'Night');
});
