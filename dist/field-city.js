/* An original miniature city: architecture is a navigation metaphor, not an employer site model. */
(function (root) {
  'use strict';
  const landmarks = [
    {
      id: 'about',
      name: 'Central station',
      company: 'Siddhant Shankar',
      kind: 'welcome',
      x: 12,
      z: 12,
      height: 14,
      color: '#ddba7b',
    },
    {
      id: 'boring',
      name: 'The infrastructure yard',
      company: 'The Boring Company',
      kind: 'tunnel',
      x: -36,
      z: -12,
      height: 12,
      color: '#d8a64e',
    },
    {
      id: 'hyphenate',
      name: 'The finance towers',
      company: 'Hyphenate',
      kind: 'towers',
      x: 12,
      z: -12,
      height: 31,
      color: '#86b3ad',
    },
    {
      id: 'zaap',
      name: 'The product studio',
      company: 'Zaap AI',
      kind: 'studio',
      x: 36,
      z: 12,
      height: 17,
      color: '#c78c70',
    },
    {
      id: 'parasol',
      name: 'The research observatory',
      company: 'Parasol Lab',
      kind: 'observatory',
      x: -12,
      z: -36,
      height: 23,
      color: '#92a8be',
    },
    {
      id: 'teaching',
      name: 'The city campus',
      company: 'Teaching at UIUC',
      kind: 'classroom',
      x: -36,
      z: 12,
      height: 15,
      color: '#c1b586',
    },
    {
      id: 'zeus',
      name: 'The learning arcade',
      company: 'Zeus Learning',
      kind: 'sound',
      x: -36,
      z: 36,
      height: 12,
      color: '#a399ba',
    },
    {
      id: 'apac',
      name: 'The exchange building',
      company: 'APAC Financial',
      kind: 'market',
      x: -12,
      z: 36,
      height: 25,
      color: '#a0b6a3',
    },
    {
      id: 'rare',
      name: 'The design gallery',
      company: 'Rare Billions',
      kind: 'house',
      x: 36,
      z: 36,
      height: 15,
      color: '#d1bda0',
    },
    {
      id: 'projects',
      name: 'The makers’ warehouse',
      company: 'Public projects',
      kind: 'workshop',
      x: 12,
      z: -36,
      height: 13,
      color: '#81a3ac',
    },
    {
      id: 'beyond',
      name: 'The rooftop garden',
      company: 'Research & open questions',
      kind: 'garden',
      x: -36,
      z: -36,
      height: 18,
      color: '#a8bb8b',
    },
  ].map((p, i) => ({ ...p, index: i, arrival: { x: p.x, z: p.z + 8.5 } }));
  const streets = [-48, -24, 0, 24, 48];
  const infill = [
    { x: 36, z: -36, height: 16, color: '#ad9c8e' },
    { x: 36, z: -12, height: 21, color: '#839c9e' },
    { x: -12, z: -12, height: 19, color: '#b4a588' },
    { x: 12, z: 36, height: 11, color: '#bca58b' },
  ];
  const blockers = [...landmarks, ...infill];
  // Solid street furniture, as axis-aligned footprints (half extents). These mirror the props drawn in mesh().
  const bridges = [-24, 24],
    props = [];
  const prop = (x, z, hx, hz, kind) => props.push({ x, z, hx, hz, kind });
  for (const p of landmarks) {
    for (const dx of [-7.8, 7.8]) prop(p.x + dx, p.z - 6, 0.9, 0.9, 'tree');
    prop(p.x + 7.7, p.z + 7.7, 0.19, 0.19, 'lamp');
    prop(p.x - 3, p.z + 7, 0.1, 0.1, 'sign');
  }
  for (const p of infill) {
    prop(p.x - 7.5, p.z - 6, 0.9, 0.9, 'tree');
    prop(p.x + 7.5, p.z + 7.5, 0.19, 0.19, 'lamp');
  }
  for (const x of [-19, -5]) for (const z of [5, 19]) prop(x, z, 0.9, 0.9, 'tree');
  for (const x of [-16, -8]) prop(x, 11.85, 1.25, 0.4, 'bench');
  for (let z = -48; z <= 48; z += 12) {
    prop(-57, z, 0.9, 0.9, 'tree');
    if (Math.abs(z) !== 24) prop(51, z, 0.19, 0.19, 'lamp');
  }
  prop(15.6, -29.6, 1.3, 0.35, 'easel');
  // The canal can only be crossed on a bridge; the deck is reached by steps and stands 2.1 above the street.
  const onBridge = z => bridges.some(b => Math.abs(z - b) < 1.6);
  const inWater = (x, z) => x > 52.7 && x < 61.3 && !onBridge(z);
  function groundAt(x, z) {
    if (!bridges.some(b => Math.abs(z - b) < 2)) return 0;
    const d = Math.abs(x - 57);
    return d <= 5.2 ? 2.1 : d >= 7.6 ? 0 : (2.1 * (7.6 - d)) / 2.4;
  }
  function mesh(F, extra) {
    const b = F.builder({ edges: true }),
      { box, cone, roof, finish } = b,
      rand = F.random(29417),
      lights = F.random(5113),
      ink = '#354f50',
      stone = '#c9bea7',
      paving = '#b5b2a0',
      asphalt = '#647876',
      glass = '#7babae',
      warm = '#e9d39e';
    // A continuous city surface with clearly separated roads, curbs, and blocks.
    box(0, -0.2, 0, 194, 0.4, 194, '#8e9a89');
    box(0, 0.005, 0, 110, 0.045, 110, '#a7ac9b');
    for (const x of [-36, -12, 12, 36])
      for (const z of [-36, -12, 12, 36]) {
        box(x, 0.11, z, 19.5, 0.2, 19.5, paving);
        box(x, 0.23, z, 17.8, 0.04, 17.8, '#bdb8a6');
        for (let i = -8; i <= 8; i += 2) {
          box(x + i, 0.257, z, 0.035, 0.014, 17, '#a9a795');
          box(x, 0.257, z + i, 17, 0.014, 0.035, '#a9a795');
        }
      }
    for (const n of streets) {
      box(n, 0.055, 0, 5.4, 0.055, 104, asphalt);
      box(0, 0.06, n, 104, 0.055, 5.4, asphalt);
      for (let j = -50; j <= 50; j += 4) {
        if (streets.some(k => Math.abs(j - k) < 4)) continue;
        box(n, 0.092, j, 0.1, 0.015, 1.9, '#d6cfae');
        box(j, 0.097, n, 1.9, 0.015, 0.1, '#d6cfae');
      }
      for (const m of streets)
        for (let j = -2; j <= 2; j++) {
          box(n + j * 0.8, 0.11, m + 3.4, 0.45, 0.025, 1.45, '#d5d2b9');
          box(n + 3.4, 0.115, m + j * 0.8, 1.45, 0.025, 0.45, '#d5d2b9');
        }
    }
    function tree(x, z, scale = 1, y = 0) {
      box(x, y + 0.4, z, 1.8, 0.7, 1.8, '#9c9981');
      box(x, y + 1.8 * scale, z, 0.3 * scale, 3 * scale, 0.3 * scale, '#786852');
      box(x, y + 3.6 * scale, z, 2.2 * scale, 2.4 * scale, 2.2 * scale, '#6a845b', 0.22);
      box(
        x - 0.4 * scale,
        y + 4.8 * scale,
        z,
        1.6 * scale,
        1.3 * scale,
        1.7 * scale,
        '#97a671',
        -0.18,
      );
    }
    function lamp(x, z) {
      box(x, 2.1, z, 0.13, 4.2, 0.13, ink);
      box(x + 0.5, 4.15, z, 1.2, 0.14, 0.15, ink);
      box(x + 1, 4.02, z, 0.55, 0.2, 0.5, warm, 0, 1);
      box(x, 0.2, z, 0.38, 0.4, 0.38, ink);
    }
    const lit = () => (lights() < 0.52 ? 0.9 + lights() * 0.1 : 0);
    function windows(x, z, w, d, h, color = glass, base = 0) {
      for (let y = base + 2; y < base + h - 0.4; y += 2.5) {
        for (let dx = -w / 2 + 1; dx < w / 2; dx += 1.8) {
          box(x + dx, y, z + d / 2 + 0.02, 1, 0.95, 0.065, color, 0, lit());
          box(x + dx, y, z - d / 2 - 0.02, 1, 0.95, 0.065, color, 0, lit());
        }
        for (let dz = -d / 2 + 1; dz < d / 2; dz += 1.8) {
          box(x + w / 2 + 0.02, y, z + dz, 0.065, 0.95, 1, color, 0, lit());
          box(x - w / 2 - 0.02, y, z + dz, 0.065, 0.95, 1, color, 0, lit());
        }
      }
    }
    function tower(x, z, w, d, h, color) {
      box(x, h / 2 + 0.26, z, w, h, d, color);
      windows(x, z, w, d, h);
      for (let y = 3; y < h; y += 2.5) box(x, y, z, w + 0.15, 0.14, d + 0.15, '#d1c9b3');
      box(x, h + 0.38, z, w + 0.3, 0.3, d + 0.3, stone);
      box(x + 0.8, h + 0.95, z - 1, 2.1, 1, 1.4, '#778a82');
      box(x, 1.75, z + d / 2 + 0.1, 1.8, 3, 0.2, ink);
      box(x, 3.45, z + d / 2 + 0.5, 3.5, 0.22, 1, stone);
    }
    function shop(x, z, h, color) {
      tower(x, z, 8.4, 8.4, h, color);
      for (let i = -1; i <= 1; i++) {
        box(x + i * 2.7, 1.8, z + 4.28, 2.1, 2.5, 0.1, ink, 0, 0.85);
        box(x + i * 2.7, 3.2, z + 4.75, 2.4, 0.18, 1.1, i % 2 ? warm : color);
      }
      box(x, h + 0.7, z, 5, 0.4, 5, '#7c9367');
    }
    // The eleven chapters have different silhouettes, street entrances, and roof lines.
    for (const p of landmarks) {
      const { x, z, height: h, color: c } = p;
      box(x + 1, 0.27, z - 0.3, 11, 0.025, 11, '#969f8d');
      if (p.kind === 'towers') {
        tower(x - 2.4, z, 4.2, 7.7, 24, c);
        tower(x + 2.25, z - 0.6, 4.1, 6.5, 29, '#779e9e');
        box(x, 15, z + 0.4, 8, 0.6, 2.4, '#c5c5ac');
        box(x + 2.3, 31, z - 0.5, 0.13, 3, 0.13, ink);
      } else if (p.kind === 'tunnel') {
        box(x, 3, z - 1.5, 10, 5.5, 6.5, '#a59981');
        roof(x, 5.8, z - 1.5, 10.4, 1.5, 7, '#71857e');
        box(x, 2.6, z + 1.9, 4.9, 4.6, 0.15, ink);
        box(x - 3.9, 2.4, z + 2.1, 1.1, 4.6, 0.3, stone);
        box(x + 3.9, 2.4, z + 2.1, 1.1, 4.6, 0.3, stone);
        box(x, 1.1, z + 3, 3, 1.6, 3.6, c);
        box(x, 2.3, z + 2.2, 1.8, 1.4, 1.8, c);
        box(x, 2.5, z + 3.14, 1.4, 0.7, 0.08, glass);
        for (const a of [-1, 1])
          for (const b of [-1, 1]) box(x + a * 1.5, 0.7, z + 3 + b * 1.1, 0.5, 1, 0.9, ink);
        box(x - 4, 6, z - 3, 0.3, 12, 0.3, c);
        box(x, 11.8, z - 3, 9, 0.35, 0.35, c);
        box(x + 3.8, 9.2, z - 3, 0.045, 5, 0.045, ink);
        for (let i = -3; i < 4; i++) box(x + i, 11.3, z - 3, 0.1, 1, 0.1, c, 0.4);
      } else if (p.kind === 'observatory') {
        tower(x, z, 8.3, 8.3, 15, '#a8b0ae');
        box(x, 16, z, 9, 0.8, 9, stone);
        cone(x, 16.4, z, 4, 4.6, c, 10);
        box(x, 21, z, 0.12, 4, 0.12, ink);
      } else if (p.kind === 'welcome') {
        tower(x, z, 9.4, 8.5, 6.8, '#cabd9c');
        roof(x, 7.1, z, 10, 1.8, 9.2, '#6c8c82');
        box(x - 2.5, 10, z, 2.8, 6, 2.8, c);
        box(x - 2.5, 13.1, z, 3.2, 0.3, 3.2, stone);
        box(x - 2.5, 11.6, z + 1.44, 1.5, 1.5, 0.08, warm, 0, 1);
        box(x - 2.5, 11.7, z + 1.5, 0.08, 0.55, 0.03, ink);
        box(x - 2.25, 11.7, z + 1.5, 0.55, 0.08, 0.03, ink);
      } else if (p.kind === 'classroom') {
        tower(x, z, 9.5, 8.5, 11.5, '#bca783');
        roof(x, 11.8, z, 10.2, 2.2, 9.2, '#7c927f');
        for (let i = -3; i <= 3; i += 2) box(x + i, 2, z + 4.6, 0.4, 4, 0.45, stone);
        box(x, 4.3, z + 4.4, 9, 0.35, 1, stone);
      } else if (p.kind === 'studio') {
        shop(x, z, 12, c);
        box(x + 1, 14, z - 1, 5.6, 3.5, 5.6, '#e0ccab');
        windows(x + 1, z - 1, 5.6, 5.6, 3.5, glass, 12.5);
        box(x + 1, 16, z - 1, 6, 0.25, 6, '#7f9678');
      } else if (p.kind === 'market') {
        tower(x, z, 9.5, 9.5, 17, '#a0aca0');
        tower(x, z, 6.8, 6.8, 23, c);
        box(x, 24, z, 7.2, 0.5, 7.2, stone);
        for (let i = -3; i <= 3; i += 2) box(x + i, 2, z + 4.9, 0.45, 4, 0.45, stone);
      } else if (p.kind === 'sound') {
        shop(x, z, 9, c);
        box(x, 10.3, z, 8, 0.6, 8, stone);
        box(x, 7.8, z + 4.4, 6, 1.4, 0.3, '#d5c496');
        for (let i = -2; i <= 2; i++) box(x + i, 7.8, z + 4.58, 0.12, 0.5, 0.03, ink);
        box(x, 3.1, z + 5, 8, 0.35, 1.6, c);
      } else if (p.kind === 'workshop') {
        shop(x, z, 8, c);
        for (let i = -1; i <= 1; i++) roof(x + i * 2.8, 8.4, z, 2.8, 2.6, 8.8, '#536f77');
        box(x + 3.7, 10, z - 3, 1, 5, 1, '#ad977b');
      } else if (p.kind === 'garden') {
        tower(x, z, 9.2, 9.2, 13.5, c);
        box(x, 14, z, 9.5, 0.3, 9.5, '#7f975f');
        for (const a of [-2.6, 2.6]) for (const b of [-2.6, 2.6]) tree(x + a, z + b, 0.55, 14);
        box(x, 15, z, 3.1, 1.9, 3.1, glass);
        roof(x, 16, z, 3.7, 1.3, 3.7, '#b8c7aa');
      } else {
        tower(x - 1, z, 7.3, 8.4, 9.8, '#d0c4aa');
        box(x + 1, 11.8, z - 1, 7.1, 4, 7.1, c);
        windows(x + 1, z - 1, 7.1, 7.1, 4, glass, 10);
        box(x + 1, 14, z - 1, 7.4, 0.3, 7.4, stone);
      }
      // An enamel street plaque and a clear approach identify every career entrance.
      box(x - 3, 1.4, z + 7, 0.12, 2.5, 0.12, ink);
      box(x - 3, 2.4, z + 7, 1.5, 0.65, 0.13, c);
      box(x - 3, 2.4, z + 7.08, 0.7, 0.08, 0.02, warm, 0, 1);
      box(x, 0.28, z + 7.3, 3.5, 0.08, 3.8, stone);
      for (const dx of [-7.8, 7.8]) tree(x + dx, z - 6, 0.7);
      lamp(x + 7.7, z + 7.7);
    }
    for (const p of infill) {
      shop(p.x, p.z, p.height, p.color);
      tree(p.x - 7.5, p.z - 6, 0.75);
      lamp(p.x + 7.5, p.z + 7.5);
    }
    // A park provides a quiet place for the wildlife, enclosed by the city blocks.
    box(-12, 0.27, 12, 17, 0.08, 17, '#8fa574');
    box(-12, 0.33, 12, 1.7, 0.03, 17, '#c6bea0');
    box(-12, 0.34, 12, 17, 0.03, 1.7, '#c6bea0');
    for (const x of [-19, -5]) for (const z of [5, 19]) tree(x, z, 0.8);
    for (const x of [-16, -8]) {
      box(x, 0.6, 12, 2.5, 0.45, 0.6, '#8b785b');
      box(x, 1.05, 11.7, 2.5, 0.65, 0.12, '#8b785b');
    }
    // A canal and promenade establish a readable eastern city edge.
    box(57, 0.03, 0, 8, 0.1, 113, '#7aa5a6');
    for (const x of [52, 62]) box(x, 0.18, 0, 1, 0.3, 113, stone);
    for (const z of [-24, 24]) {
      box(57, 1.9, z, 10.5, 0.4, 4, stone);
      for (const x of [51.8, 62.2]) box(x, 1.05, z, 1.6, 2.1, 4, stone);
      for (const side of [-1, 1])
        for (let k = 0; k < 4; k++) {
          const top = 1.95 - k * 0.45;
          box(57 + side * (5.55 + k * 0.6), top / 2, z, 0.6, top, 3.4, stone);
        }
      for (const side of [-1, 1]) {
        box(57, 2.65, z + side * 1.95, 10.5, 0.11, 0.11, ink);
        for (let x = 52; x <= 62; x += 2) box(x, 2.35, z + side * 1.95, 0.09, 0.6, 0.09, ink);
      }
    }
    for (let z = -48; z <= 48; z += 12) {
      tree(-57, z, 0.8);
      if (Math.abs(z) !== 24) lamp(51, z);
    }
    // A denser, muted skyline frames the playable district, without adding fake chapters.
    for (let n = -78; n <= 78; n += 12)
      for (const side of [-1, 1]) {
        const h = 10 + rand() * 19;
        tower(n, side * 72, 7 + rand() * 2, 8, h, side < 0 ? '#a7af9e' : '#a0aea5');
        if (Math.abs(n) < 66) tower(side * 76, n, 8, 7, 8 + rand() * 17, '#a6b1a4');
      }
    if (extra) extra(b);
    return finish();
  }
  // Rounded-rectangle circuits shared by cars, pedestrians, and boats. Travel is clockwise seen from above.
  function loopPose(cx, cz, ex, ez, r, distance) {
    const sx = 2 * (ex - r),
      sz = 2 * (ez - r),
      arc = (Math.PI * r) / 2,
      total = 2 * (sx + sz) + 4 * arc;
    distance = ((distance % total) + total) % total;
    const lengths = [sx, sz, sx, sz],
      starts = [
        [cx - ex + r, cz - ez],
        [cx + ex, cz - ez + r],
        [cx + ex - r, cz + ez],
        [cx - ex, cz + ez - r],
      ];
    const directions = [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, -1],
      ],
      corners = [
        [cx + ex - r, cz - ez + r],
        [cx + ex - r, cz + ez - r],
        [cx - ex + r, cz + ez - r],
        [cx - ex + r, cz - ez + r],
      ];
    for (let side = 0; side < 4; side++) {
      if (distance <= lengths[side]) {
        const [dx, dz] = directions[side];
        return {
          x: starts[side][0] + dx * distance,
          z: starts[side][1] + dz * distance,
          yaw: Math.atan2(dx, dz),
        };
      }
      distance -= lengths[side];
      if (distance <= arc) {
        const angle = -Math.PI / 2 + (side * Math.PI) / 2 + distance / r;
        return {
          x: corners[side][0] + r * Math.cos(angle),
          z: corners[side][1] + r * Math.sin(angle),
          yaw: Math.atan2(-Math.sin(angle), Math.cos(angle)),
        };
      }
      distance -= arc;
    }
    return { x: starts[0][0], z: starts[0][1], yaw: Math.PI / 2 };
  }
  const loopLength = (ex, ez, r) => 2 * (2 * (ex - r) + 2 * (ez - r)) + 2 * Math.PI * r;
  // Vehicles share a speed per circuit, so cars on the same block never overtake each other.
  const TRAFFIC = 16,
    circuits = [
      [-12, -12, 3.2],
      [12, 12, 4.6],
      [-36, 12, 3.8],
      [12, -36, 4.2],
      [36, 36, 4],
      [36, -12, 4.4],
      [-12, 36, 3.6],
      [-36, -36, 3.9],
    ];
  const vehicleKind = i => (i % 8 === 5 ? 'bus' : i % 4 === 0 ? 'van' : 'car');
  const vehicleHalf = i => {
    const k = vehicleKind(i);
    return k === 'bus'
      ? { w: 0.72, l: 2.25 }
      : k === 'van'
        ? { w: 0.65, l: 1.35 }
        : { w: 0.65, l: 1.15 };
  };
  function trafficPoseAt(index, distance) {
    const [cx, cz] = circuits[index % circuits.length];
    return loopPose(cx, cz, 10.7, 10.7, 2.1, distance);
  }
  function trafficPose(index, time) {
    return trafficPoseAt(index, time * circuits[index % circuits.length][2] + index * 17);
  }
  function addTraffic(builder, time, poses) {
    for (let i = 0; i < TRAFFIC; i++) {
      const p = poses ? poses[i] : trafficPose(i, time),
        s = Math.sin(p.yaw),
        c = Math.cos(p.yaw),
        kind = vehicleKind(i),
        van = kind === 'van',
        coat = ['#d3ad68', '#a06c50', '#759d9c', '#e0d3b2', '#8895aa'][i % 5];
      function part(x, y, z, w, h, d, color, glow = 0) {
        builder.box(p.x + x * c + z * s, y, p.z - x * s + z * c, w, h, d, color, p.yaw, glow);
      }
      if (kind === 'bus') {
        part(0, 1.05, 0, 1.4, 1.55, 4.4, '#c9a24f');
        part(0, 1.25, 0, 1.43, 0.5, 3.9, '#4a6a6e', 0.7);
        part(0, 1.86, 0, 1.3, 0.08, 4.2, '#e7dcc0');
        for (const side of [-1, 1])
          for (const end of [-1.4, 1.4]) part(side * 0.66, 0.32, end, 0.2, 0.44, 0.44, '#3d4c48');
        for (const side of [-1, 1]) {
          part(side * 0.45, 0.6, 2.21, 0.26, 0.16, 0.04, '#ead6a1', 1);
          part(side * 0.5, 0.6, -2.21, 0.22, 0.14, 0.04, '#b5463a', 0.8);
        }
        part(0, 1.62, 2.21, 1, 0.22, 0.03, '#ead6a1', 0.9);
        continue;
      }
      part(0, 0.49, 0, 1.25, 0.55, van ? 2.6 : 2.2, coat);
      part(0, 0.94, van ? -0.15 : 0, 1.1, van ? 1 : 0.6, van ? 1.8 : 1.25, coat);
      part(0, 1, van ? 0.79 : 0.65, 0.93, 0.38, 0.045, '#47676b');
      part(0, 1, van ? -1.06 : -0.65, 0.93, 0.38, 0.045, '#47676b');
      for (const side of [-1, 1])
        for (const end of [-1, 1]) part(side * 0.63, 0.3, end * 0.76, 0.18, 0.4, 0.4, '#3d4c48');
      for (const side of [-1, 1]) {
        part(side * 0.4, 0.56, van ? 1.32 : 1.12, 0.25, 0.18, 0.04, '#ead6a1', 1);
        part(side * 0.45, 0.56, van ? -1.32 : -1.12, 0.2, 0.14, 0.04, '#b5463a', 0.8);
      }
    }
  }
  const api = {
    vehicleHalf,
    landmarks,
    streets,
    infill,
    blockers,
    props,
    bridges,
    onBridge,
    inWater,
    groundAt,
    trafficPoseAt,
    mesh,
    loopPose,
    loopLength,
    TRAFFIC,
    circuits,
    vehicleKind,
    trafficPose,
    addTraffic,
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FieldCity = api;
})(typeof window !== 'undefined' ? window : globalThis);
