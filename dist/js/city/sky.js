/* A slow day over the city: sun, sky, and how much of the city has switched its lights on. */
(function (root) {
  'use strict';
  // Keyframes by hour. Colours are sky top, sky horizon, and ground haze; night is the share of lights on.
  const keys = [
    { h: 0, top: '#0d1a28', low: '#24364a', haze: '#1c2b38', night: 1 },
    { h: 4.8, top: '#13233a', low: '#3a4660', haze: '#2a3446', night: 1 },
    { h: 6, top: '#4e6582', low: '#e0a483', haze: '#9a8a86', night: 0.55 },
    { h: 7.3, top: '#86adb6', low: '#ead2a8', haze: '#c9c4a6', night: 0 },
    { h: 12, top: '#7da8ad', low: '#d9cda7', haze: '#c7c8ac', night: 0 },
    { h: 16.8, top: '#83a6ab', low: '#e2c99a', haze: '#cfc3a0', night: 0 },
    { h: 18.6, top: '#5e7590', low: '#eba374', haze: '#c39a7f', night: 0.3 },
    { h: 19.7, top: '#2c3b56', low: '#8e6a72', haze: '#5d5262', night: 0.8 },
    { h: 21, top: '#101e30', low: '#2b3a52', haze: '#1f2c3c', night: 1 },
    { h: 24, top: '#0d1a28', low: '#24364a', haze: '#1c2b38', night: 1 },
  ];
  const DAY_SECONDS = 360;
  const rgb = hex =>
    hex
      .replace('#', '')
      .match(/../g)
      .map(v => parseInt(v, 16) / 255);
  const hex = c =>
    '#' +
    c
      .map(v =>
        Math.round(Math.max(0, Math.min(1, v)) * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('');
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const wrap = h => ((h % 24) + 24) % 24;
  function phase(h) {
    h = wrap(h);
    return h < 5
      ? 'Night'
      : h < 7.3
        ? 'Dawn'
        : h < 11
          ? 'Morning'
          : h < 16
            ? 'Afternoon'
            : h < 18.6
              ? 'Golden hour'
              : h < 20.5
                ? 'Dusk'
                : 'Night';
  }
  function sample(hours) {
    const h = wrap(hours);
    let i = 0;
    while (keys[i + 1].h <= h && i < keys.length - 2) i++;
    const a = keys[i],
      b = keys[i + 1],
      t = (h - a.h) / (b.h - a.h),
      s = t * t * (3 - 2 * t);
    const top = mix(rgb(a.top), rgb(b.top), s),
      low = mix(rgb(a.low), rgb(b.low), s),
      haze = mix(rgb(a.haze), rgb(b.haze), s),
      night = a.night + (b.night - a.night) * s;
    // The sun rises in the east (+x), crosses the south, and sets in the west. A cool moon takes over below the horizon.
    const angle = ((h - 6) / 12) * Math.PI,
      elevation = Math.sin(angle),
      norm = v => {
        const l = Math.hypot(...v);
        return v.map(n => n / l);
      };
    const solar = [Math.cos(angle) * 0.75, Math.max(0.12, elevation), 0.42],
      lunar = [-Math.cos(angle) * 0.6, 0.7, -0.3],
      w = Math.min(1, Math.max(0, (elevation + 0.3) / 0.4)),
      day = w * w * (3 - 2 * w);
    const sun = norm(mix(lunar, solar, day));
    const strength = Math.min(1, Math.max(0, (elevation + 0.08) * 2.6)),
      warmth = 1 - Math.min(1, Math.max(0, elevation * 1.8));
    const sunColor = mix(
      [0.1, 0.13, 0.2],
      mix([0.4, 0.38, 0.34], [0.5, 0.33, 0.22], warmth).map(v => v * strength),
      day,
    );
    const ambient = mix([0.66, 0.66, 0.65], [0.28, 0.32, 0.44], night).map(
      (v, k) => v * (1 - strength * 0.08) + (k === 0 ? warmth * strength * day * 0.05 : 0),
    );
    return {
      hours: h,
      phase: phase(h),
      night,
      sun,
      sunColor,
      ambient,
      top,
      low,
      haze,
      css: { top: hex(top), low: hex(low), haze: hex(haze) },
    };
  }
  const label = hours => {
    const h = wrap(hours),
      m = Math.floor(h * 60);
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  };
  const api = { DAY_SECONDS, sample, label, phase, wrap };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CitySky = api;
})(typeof window !== 'undefined' ? window : globalThis);
