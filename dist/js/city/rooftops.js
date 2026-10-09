/* Giant rooftop signs, in the spirit of a cartoon tech skyline: every chapter building wears one big,
   playful object that says what happened there, and a red name sign stands on the hills behind the city.
   Fixed parts join the static city; moving parts are rebuilt with city life every frame.
   All original shapes. The objects are props, not logos or claims about the employers' buildings. */
(function (root) {
  'use strict';
  const City =
    typeof module === 'object' && module.exports ? require('./layout.js') : root.CityLayout;
  // Signs turn to face the opening overview, which looks at the city from the south-east.
  const VIEW = Math.hypot(0.45, 0.65),
    FACE = { x: 0.45 / VIEW, z: 0.65 / VIEW },
    TURN = Math.atan2(FACE.x, FACE.z),
    RIGHT = { x: FACE.z, z: -FACE.x };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    cross = (a, b) => [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ],
    dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    norm = a => {
      const l = Math.hypot(...a) || 1;
      return a.map(v => v / l);
    },
    TAU = Math.PI * 2;
  // Five-by-seven block letters, read top row first.
  const GLYPHS = {
    S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
    D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
    T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  };
  // The name sign on the hills. City-view labels keep clear of it, including the height of its wave.
  const BANNER = {
    text: 'SIDDHANT',
    x: -FACE.x * 84 - RIGHT.x * 2,
    y: 6,
    z: -FACE.z * 84 - RIGHT.z * 2,
    px: 2,
    lean: 0.45,
    wave: 1.1,
  };
  BANNER.width = BANNER.text.length * 6 * BANNER.px - BANNER.px;
  BANNER.corners = [-1, 1].flatMap(side =>
    [0, 7].map(row => [
      BANNER.x +
        RIGHT.x * side * (BANNER.width / 2) -
        FACE.x * Math.sin(BANNER.lean) * row * BANNER.px,
      BANNER.y + Math.cos(BANNER.lean) * row * BANNER.px + (row ? BANNER.wave : 0),
      BANNER.z +
        RIGHT.z * side * (BANNER.width / 2) -
        FACE.z * Math.sin(BANNER.lean) * row * BANNER.px,
    ]),
  );
  const site = id => City.landmarks.find(p => p.id === id);
  const core = () =>
      typeof module === 'object' && module.exports ? require('./core.js') : root.CityCore,
    balls = new Map();
  // Drawing helpers bound to one builder: tubes, balls, oriented slabs, block letters, and sign frames.
  function kit(b) {
    const { box, triangle } = b;
    // A triangle whose front faces `out`, so it survives back-face culling whichever way it was listed.
    const face = (p, q, r, tint, out, glow = 0) =>
      dot(cross(sub(q, p), sub(r, p)), out) >= 0
        ? triangle(p, q, r, tint, glow)
        : triangle(p, r, q, tint, glow);
    // A tapered tube between two points: cylinders, cones, needles, and coin edges.
    function tube(a, c, r0, r1, tint, sides = 12, glow = 0) {
      const axis = norm(sub(c, a)),
        helper = Math.abs(axis[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0],
        u = norm(cross(axis, helper)),
        v = cross(axis, u),
        back = axis.map(n => -n);
      const ring = (p, r, k) => {
        const t = (k / sides) * TAU,
          cs = Math.cos(t) * r,
          sn = Math.sin(t) * r;
        return [0, 1, 2].map(n => p[n] + u[n] * cs + v[n] * sn);
      };
      for (let k = 0; k < sides; k++) {
        const t = ((k + 0.5) / sides) * TAU,
          out = [0, 1, 2].map(n => u[n] * Math.cos(t) + v[n] * Math.sin(t));
        const a0 = ring(a, r0, k),
          a1 = ring(a, r0, k + 1),
          c0 = ring(c, r1, k),
          c1 = ring(c, r1, k + 1);
        face(a0, a1, c1, tint, out, glow);
        face(a0, c1, c0, tint, out, glow);
        if (r0 > 0) face(a, a0, a1, tint, back, glow);
        if (r1 > 0) face(c, c0, c1, tint, axis, glow);
      }
    }
    // Balls are built once per size and colour, then copied into place.
    function sphere(x, y, z, r, tint, squash = 1, rows = 7, cols = 12) {
      const key = [r, tint, squash, rows, cols].join('|');
      let ball = balls.get(key);
      if (!ball) {
        const fresh = core().builder();
        kit(fresh).rawSphere(r, tint, squash, rows, cols);
        balls.set(key, (ball = fresh.finish()));
      }
      b.append(ball, x, y, z);
    }
    function rawSphere(r, tint, squash, rows, cols) {
      const x = 0,
        y = 0,
        z = 0;
      const at = (i, j) => {
        const lat = (i / rows) * Math.PI,
          lon = (j / cols) * TAU;
        return [
          x + Math.sin(lat) * Math.cos(lon) * r,
          y + Math.cos(lat) * r * squash,
          z + Math.sin(lat) * Math.sin(lon) * r,
        ];
      };
      for (let i = 0; i < rows; i++)
        for (let j = 0; j < cols; j++) {
          const p = at(i, j),
            q = at(i + 1, j),
            s = at(i + 1, j + 1),
            t = at(i, j + 1),
            out = sub(at(i + 0.5, j + 0.5), [x, y, z]);
          if (i > 0) face(p, q, t, tint, out);
          if (i < rows - 1) face(q, s, t, tint, out);
        }
    }
    // A box with arbitrary axes, for lettering that leans back toward the viewer.
    function slab(c, axes, half, tint) {
      const corner = signs =>
        c.map((v, n) => v + axes.reduce((sum, a, k) => sum + a[n] * half[k] * signs[k], 0));
      for (let k = 0; k < 3; k++)
        for (const side of [-1, 1]) {
          const out = axes[k].map(v => v * side),
            [i, j] = [0, 1, 2].filter(n => n !== k),
            at = (a, bb) => {
              const signs = [0, 0, 0];
              signs[k] = side;
              signs[i] = a;
              signs[j] = bb;
              return corner(signs);
            };
          face(at(-1, -1), at(1, -1), at(1, 1), tint, out);
          face(at(-1, -1), at(1, 1), at(-1, 1), tint, out);
        }
    }
    // Block lettering, a white body with a coloured face. Each glyph row is merged into runs; the sign
    // leans back by `lean` radians to read square-on from above, and `lift(i)` raises letter i
    // (or skips it, when null).
    function lettering(text, cx, cy, cz, px, front, depth, lean = 0, lift = () => 0, spin = 0) {
      const width = text.length * 6 * px - px,
        r = turned(spin),
        across = [r.right.x, 0, r.right.z],
        up = [-r.face.x * Math.sin(lean), Math.cos(lean), -r.face.z * Math.sin(lean)],
        out = [r.face.x * Math.cos(lean), Math.sin(lean), r.face.z * Math.cos(lean)],
        axes = [across, up, out];
      [...text].forEach((ch, i) => {
        const dy = lift(i);
        if (dy === null) return;
        GLYPHS[ch].forEach((row, line) => {
          for (let c = 0; c < 5; c++) {
            if (row[c] !== '#') continue;
            let end = c;
            while (row[end + 1] === '#') end++;
            const a = -width / 2 + (i * 6 + (c + end + 1) / 2) * px,
              u = (6.5 - line) * px,
              w = (end - c + 1) * px,
              centre = [0, 1, 2].map(n => [cx, cy + dy, cz][n] + across[n] * a + up[n] * u);
            slab(centre, axes, [w / 2, px / 2, depth / 2], '#f4f1ea');
            slab(
              centre.map((v, n) => v + out[n] * (depth / 2 + 0.04)),
              axes,
              [w / 2, px / 2, 0.05],
              front,
            );
            c = end;
          }
        });
      });
    }
    // Each sign is drawn in its own frame: across (right), up, and out toward the viewer, at a scale,
    // optionally spun about the vertical. Signs are oversized so they read from the opening overview.
    function sign(x, y, z, k, spin = 0) {
      const { right, face: out, angle } = turned(spin);
      const at = (dx, dy, dz) => [
        x + (right.x * dx + out.x * dz) * k,
        y + dy * k,
        z + (right.z * dx + out.z * dz) * k,
      ];
      return {
        at,
        tube: (a, c, r0, r1, tint, sides, glow) =>
          tube(at(...a), at(...c), r0 * k, r1 * k, tint, sides, glow),
        ball: (c, r, tint, squash) => sphere(...at(...c), r * k, tint, squash),
        box: (c, w, h, d, tint, glow = 0) => {
          const p = at(...c);
          box(p[0], p[1], p[2], w * k, h * k, d * k, tint, angle, glow);
        },
      };
    }
    return { tube, sphere, rawSphere, lettering, sign };
  }
  function turned(spin) {
    const cs = Math.cos(spin),
      sn = Math.sin(spin),
      right = { x: RIGHT.x * cs + FACE.x * sn, z: RIGHT.z * cs + FACE.z * sn },
      face = { x: FACE.x * cs - RIGHT.x * sn, z: FACE.z * cs - RIGHT.z * sn };
    return { right, face, angle: Math.atan2(face.x, face.z) };
  }
  // Where each sign stands, and how big it is drawn.
  const SPOTS = {
    parasol: p => [p.x + 2.6, 16.4, p.z + 2.6, 1.7],
    beyond: p => [p.x - FACE.x * 2.8, 14.2, p.z - FACE.z * 2.8, 1.5],
    boring: p => [p.x + 1.5, 7.25, p.z - 1.5, 1.6],
    hyphenate: p => [p.x - 2.4, 24.6, p.z, 1.6],
    zaap: p => [p.x - 1.5, 12.5, p.z + 1.5, 1.7],
    teaching: p => [p.x, 14, p.z, 1.6],
    zeus: p => [p.x, 10.6, p.z, 1.6],
    apac: p => [p.x, 24.25, p.z, 1.5],
    rare: p => [p.x + 1, 14.15, p.z - 1, 1.5],
    projects: p => [p.x - 1, 11, p.z + 0.5, 1.5],
    about: p => [p.x + 2.2, 8.3, p.z + 1.5, 1.6],
  };
  const BALLOONS = [
    { x: -12, y: 33, z: 12, tint: '#e64fb0', band: '#ffd1ec', phase: 0 },
    { x: 44, y: 38, z: -30, tint: '#f7f4ee', band: '#e5484d', phase: 2.1 },
  ];
  function at(id, k, spin) {
    const p = site(id);
    if (!p) return null;
    const [x, y, z, scale] = SPOTS[id](p);
    return k.sign(x, y, z, scale, spin);
  }
  const wave = (t, speed, phase = 0) => Math.sin(t * speed + phase);

  // The fixed parts: plinths, barrels, stands, the hills, and the posts. Drawn once with the city.
  function add(b) {
    const k = kit(b),
      { box, plain } = b;
    let s;
    // Research: the syringe's barrel, needle, and finger flange.
    if ((s = at('parasol', k))) {
      s.tube([0, 0, 0], [0, 2.4, 0], 0.03, 0.09, '#c9d2d6', 6);
      s.tube([0, 2.4, 0], [0, 3.1, 0], 0.42, 0.25, '#d7dde0', 10);
      s.tube([0, 3.1, 0], [0, 7.8, 0], 0.95, 0.95, '#cfe8f2', 14);
      for (let i = 0; i < 5; i++)
        s.tube([0, 3.6 + i * 0.85, 0], [0, 3.68 + i * 0.85, 0], 1.03, 1.03, '#2b3438', 14);
      s.tube([0, 7.8, 0], [0, 8.05, 0], 1.6, 1.6, '#eef1f2', 14);
    }
    // Research and open questions: a syringe leaning where the question mark bobs.
    if ((s = at('beyond', k))) {
      s.tube([2.2, 0, 1.3], [2.15, 0.65, 1.3], 0.02, 0.05, '#c9d2d6', 6);
      s.tube([2.15, 0.65, 1.3], [3.6, 3.9, 1.3], 0.42, 0.42, '#cfe8f2', 12);
      s.tube([2.35, 1.1, 1.3], [3, 2.6, 1.3], 0.45, 0.45, '#5ac46b', 12, 0.35);
      s.tube([3.6, 3.9, 1.3], [4, 4.8, 1.3], 0.1, 0.1, '#eef1f2', 6);
      s.tube([4, 4.8, 1.3], [4.1, 5, 1.3], 0.6, 0.6, '#eef1f2', 12);
    }
    if ((s = at('boring', k))) s.box([0, 0.25, 0], 4.6, 0.5, 4.6, '#f06a1d');
    if ((s = at('hyphenate', k))) s.box([0, 0.15, 0], 1.4, 0.3, 1.4, '#c98a16');
    // Product studio: the phone body, screen, and kickstand; the app tiles move.
    if ((s = at('zaap', k))) {
      s.box([0, 2.8, 0], 3.2, 5.6, 0.45, '#262b33');
      s.box([0, 2.9, 0.24], 2.7, 4.6, 0.04, '#7fd4ff', 0.5);
      s.box([0, 1.3, -0.6], 0.5, 2.6, 0.25, '#262b33');
    }
    // Speech recognition: the microphone on its stand; sound rings move.
    if ((s = at('zeus', k))) {
      s.tube([0, 0, 0], [0, 0.35, 0], 1.6, 1.6, '#30353c', 14);
      s.tube([0, 0.35, 0], [0, 4.6, 0], 0.18, 0.18, '#9aa3ab', 8);
      s.tube([0, 4.6, 0], [0, 5.6, 0.6], 0.5, 0.65, '#30353c', 12);
      s.ball([0, 6.55, 0.95], 1.35, '#c7ced4');
      for (const d of [-0.5, 0, 0.5])
        s.tube([-1.36, 6.55 + d, 0.95], [1.36, 6.55 + d, 0.95], 0.06, 0.06, '#59626b', 6);
    }
    // Predictive modelling: the trend arrow; the bars move.
    if ((s = at('apac', k))) {
      s.tube([-3, 2.2, 0.9], [-0.6, 3.8, 0.9], 0.28, 0.28, '#e5484d', 8);
      s.tube([-0.6, 3.8, 0.9], [0.6, 3.3, 0.9], 0.28, 0.28, '#e5484d', 8);
      s.tube([0.6, 3.3, 0.9], [2.6, 6.3, 0.9], 0.28, 0.28, '#e5484d', 8);
      s.tube([2.4, 6, 0.9], [3.3, 7.35, 0.9], 0.8, 0, '#e5484d', 10);
    }
    // 3D interiors: a turntable, like a product viewer, for the armchair to turn on.
    if ((s = at('rare', k))) s.tube([0, 0, 0], [0, 0.25, 0], 3.2, 3.2, '#3a4149', 20);
    if ((s = at('projects', k))) s.box([0, 0.3, 0], 1.6, 0.6, 1.6, '#3a4149');
    // The hills and posts beneath the name sign.
    plain(() => {
      for (let i = -48; i <= 48; i += 12)
        b.cone(
          BANNER.x + RIGHT.x * i - FACE.x * 6,
          -0.2,
          BANNER.z + RIGHT.z * i - FACE.z * 6,
          15,
          9 - Math.abs(i) * 0.09,
          '#6f9c50',
          10,
        );
    });
    for (let i = 0; i <= 8; i++) {
      const d = -BANNER.width / 2 + (i * BANNER.width) / 8;
      box(
        BANNER.x - FACE.x * 1.6 + RIGHT.x * d,
        3,
        BANNER.z - FACE.z * 1.6 + RIGHT.z * d,
        0.5,
        6,
        0.5,
        '#7a6a55',
      );
    }
  }

  // One pre-built mesh per letter of the name sign.
  let banner = null;
  function letters() {
    if (banner) return banner;
    banner = [...BANNER.text].map((ch, i) => {
      const b = core().builder();
      kit(b).lettering(
        BANNER.text,
        BANNER.x,
        BANNER.y,
        BANNER.z,
        BANNER.px,
        '#e8392b',
        BANNER.px * 1.4,
        BANNER.lean,
        j => (j === i ? 0 : null),
      );
      return b.finish();
    });
    return banner;
  }
  // The moving parts, posed at time t. Rebuilt with cars and people, and frozen when city life pauses.
  function addAnimated(b, t) {
    const k = kit(b),
      { plain } = b;
    let s;
    // The syringe injects and refills: the plunger slides and the red dose drains.
    if ((s = at('parasol', k))) {
      const push = 0.5 - 0.5 * Math.cos(t * 1.1),
        level = 6.2 - 2.6 * push;
      s.tube([0, 3.2, 0], [0, level, 0], 0.97, 0.97, '#e5484d', 14, 0.35);
      s.tube([0, level, 0], [0, level + 0.3, 0], 0.99, 0.99, '#2b3438', 14);
      s.tube([0, level + 0.3, 0], [0, level + 4.6, 0], 0.22, 0.22, '#eef1f2', 8);
      s.tube([0, level + 4.6, 0], [0, level + 4.95, 0], 1.2, 1.2, '#eef1f2', 14);
    }
    // The question mark bobs and sways, as if thinking it over.
    if ((s = at('beyond', k, wave(t, 0.8) * 0.35))) {
      const q = s.at(0, 0.3 + wave(t, 1.6) * 0.35, 0);
      plain(() =>
        k.lettering(
          '?',
          q[0],
          q[1],
          q[2],
          1.275,
          '#ffc93c',
          1.6,
          0,
          undefined,
          wave(t, 0.8) * 0.35,
        ),
      );
    }
    // The traffic cone hops, squashing as it lands and stretching at the top.
    if ((s = at('boring', k))) {
      const phase = (t * 0.75) % 1,
        hop = 4 * phase * (1 - phase) * 1.1,
        stretch = 1 - 0.13 * Math.cos(phase * TAU),
        r = h => 1.95 * (1 - h / 6.2) * (1 + (1 - stretch) * 0.8);
      for (const [h0, h1, tint] of [
        [0.5, 1.9, '#f06a1d'],
        [1.9, 2.7, '#f7f4ee'],
        [2.7, 3.9, '#f06a1d'],
        [3.9, 4.6, '#f7f4ee'],
        [4.6, 6.2, '#f06a1d'],
      ])
        s.tube(
          [0, 0.5 + hop + (h0 - 0.5) * stretch, 0],
          [0, 0.5 + hop + (h1 - 0.5) * stretch, 0],
          r(h0),
          r(h1),
          tint,
          14,
        );
    }
    // The coin spins on its edge.
    if ((s = at('hyphenate', k, t * 1.4))) {
      s.tube([0, 2.7, -0.35], [0, 2.7, 0.35], 2.5, 2.5, '#f2b632', 20);
      for (const side of [-1, 1]) {
        s.tube([0, 2.7, side * 0.35], [0, 2.7, side * 0.45], 1.9, 1.9, '#ffd45c', 20);
        const z = side * 0.47,
          x = side;
        s.tube([-0.9 * x, 2.8, z], [-0.25 * x, 2.1, z], 0.24, 0.24, '#c98a16', 6);
        s.tube([-0.25 * x, 2.1, z], [1 * x, 3.5, z], 0.24, 0.24, '#c98a16', 6);
      }
    }
    // App tiles pop in a ripple, and a notification badge bounces on the corner.
    if ((s = at('zaap', k))) {
      const tiles = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff', '#ff9f43'];
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 2; c++) {
          const i = r * 2 + c,
            pop = 0.72 + 0.28 * Math.max(0, Math.sin(t * 2.2 - i * 0.7));
          s.box([(c - 0.5) * 1.1, 4.1 - r * 1.15, 0.28], 0.8 * pop, 0.8 * pop, 0.06, tiles[i], 0.6);
        }
      const bounce = Math.abs(Math.sin(t * 3)) * 0.35;
      s.ball([1.45, 5.55 + bounce, 0.35], 0.42, '#e5484d');
    }
    // The apple rocks gently on the ridge; its leaf flutters.
    if ((s = at('teaching', k, wave(t, 1.3) * 0.25))) {
      const bob = Math.abs(wave(t, 1.3)) * 0.18;
      s.ball([0, 1.3 + bob, 0], 1.45, '#e8423a', 0.9);
      s.tube([0, 2.5 + bob, 0], [0.15, 3.3 + bob, 0], 0.1, 0.07, '#6b4a2b', 6);
      s.box([0.6, 3.15 + bob + wave(t, 5) * 0.06, 0.1], 0.8, 0.08, 0.4, '#57b04a');
    }
    // Sound rings ripple out from the microphone.
    if ((s = at('zeus', k))) {
      for (let i = 0; i < 3; i++) {
        const age = (t * 0.6 + i / 3) % 1,
          radius = 1.8 + age * 3.2,
          size = 0.34 * (1 - age);
        if (size < 0.04) continue;
        for (let j = 0; j < 18; j++) {
          const a = (j / 18) * TAU;
          s.box(
            [Math.cos(a) * radius, 6.55 + Math.sin(a) * radius, 1.2],
            size,
            size,
            size,
            '#4d96ff',
            0.6,
          );
        }
      }
    }
    // The bar chart climbs and dips in a wave.
    if ((s = at('apac', k)))
      ['#4d96ff', '#3fc1a5', '#ffc93c', '#ff6b6b'].forEach((tint, i) => {
        const h = (1.4 + i * 1.3) * (0.8 + 0.2 * Math.sin(t * 1.8 - i * 0.9));
        s.box([-2.4 + i * 1.6, 0.25 + h / 2, 0], 1.2, h, 1.2, tint);
      });
    // The armchair turns slowly on its turntable.
    if ((s = at('rare', k, t * 0.5))) {
      const coral = '#f2727f';
      for (const dx of [-1.9, 1.9])
        for (const dz of [-1.4, 1.4]) s.box([dx, 0.55, dz], 0.35, 0.6, 0.35, '#6b4a2b');
      s.box([0, 1.25, 0], 4.4, 0.9, 3.4, coral);
      s.box([0, 1.9, 0.2], 3.2, 0.4, 2.8, '#ffd1d6');
      s.box([0, 3.15, -1.35], 4.4, 3.2, 0.8, coral);
      for (const dx of [-2.05, 2.05]) s.box([dx, 2.15, 0], 0.7, 1.7, 3.4, coral);
    }
    // The gear turns about its axle.
    if ((s = at('projects', k))) {
      const turn = t * 0.6;
      s.tube([0, 3.6, -0.5], [0, 3.6, 0.5], 2.6, 2.6, '#8f9aa6', 16);
      s.tube([0, 3.6, -0.55], [0, 3.6, 0.55], 0.9, 0.9, '#3a4149', 12);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU + turn,
          dx = Math.cos(a),
          dy = Math.sin(a);
        s.tube(
          [dx * 2.4, 3.6 + dy * 2.4, 0],
          [dx * 3.4, 3.6 + dy * 3.4, 0],
          0.55,
          0.45,
          '#8f9aa6',
          4,
        );
      }
      for (const a of [turn, turn + Math.PI / 2])
        s.tube(
          [Math.cos(a) * -0.85, 3.6 + Math.sin(a) * -0.85, 0.56],
          [Math.cos(a) * 0.85, 3.6 + Math.sin(a) * 0.85, 0.56],
          0.12,
          0.12,
          '#c7ced4',
          6,
        );
    }
    // The map pin drops and bounces, turning as it settles.
    if ((s = at('about', k, t * 0.8))) {
      const phase = (t * 0.5) % 1,
        bounce = Math.abs(Math.sin(phase * Math.PI * 3)) * (1 - phase) * 1.4;
      s.tube([0, bounce, 0], [0, 2.6 + bounce, 0], 0, 1.1, '#e5484d', 16);
      s.ball([0, 3.05 + bounce, 0], 1.22, '#e5484d');
      s.ball([0, 3.15 + bounce, 0.25], 0.5, '#fff5d6');
    }
    // The name sign does a slow stadium wave, letter by letter. Letters are built once and shifted.
    letters().forEach((geometry, i) =>
      b.append(geometry, 0, Math.max(0, Math.sin(t * 1.6 - i * 0.55)) * BANNER.wave, 0),
    );
    // Balloons drift and sway on their tethers.
    for (const p of BALLOONS) {
      const x = p.x + wave(t, 0.23, p.phase) * 1.2,
        z = p.z + wave(t, 0.19, p.phase + 1) * 1.2,
        y = p.y + wave(t, 0.4, p.phase) * 0.8;
      k.sphere(x, y, z, 5, p.tint, 1.08, 9, 16);
      k.tube([x, y - 0.7, z], [x, y + 0.7, z], 5.06, 5.06, p.band, 16);
      k.tube([x, y - 5.3, z], [x, y - 6.8, z], 1.3, 1, p.tint, 10);
      b.box(x, y - 7.6, z, 1.6, 1.1, 1.6, '#8a6a3c');
      k.tube([x, y - 8.2, z], [p.x, 0.3, p.z], 0.05, 0.05, '#59626b', 4);
    }
  }
  const api = { add, addAnimated, GLYPHS, BANNER, BALLOONS };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CityRooftops = api;
})(typeof window !== 'undefined' ? window : globalThis);
