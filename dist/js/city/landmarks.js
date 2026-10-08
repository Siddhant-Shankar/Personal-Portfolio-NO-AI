/* Buildings that tell their story, and the public projects on show around the makers' warehouse.
   Every set piece can be clicked; its card states verified facts from the career content. */
(function (root) {
  'use strict';
  const City =
    typeof module === 'object' && module.exports ? require('./layout.js') : root.CityLayout;
  const at = id => City.landmarks.find(p => p.id === id);
  const B = at('boring'),
    H = at('hyphenate'),
    P = at('parasol'),
    Z = at('zaap'),
    A = at('apac'),
    W = at('projects'),
    F1 = { x: 36, z: -36, y: 16.72 };
  const panel = '#1c2a28',
    ink = '#2f3836',
    wave = (t, k) => 0.5 + 0.5 * Math.sin(t + k);
  const quad = (b, p, q, r, s, color, glow = 0) => {
    b.triangle(p, q, r, color, glow);
    b.triangle(p, r, s, color, glow);
  };
  // A thick line drawn in a vertical plane facing +z (for sketches and spokes).
  function stroke(b, x1, y1, x2, y2, z, w, color, glow = 0) {
    const dx = x2 - x1,
      dy = y2 - y1,
      l = Math.hypot(dx, dy) || 1,
      nx = ((-dy / l) * w) / 2,
      ny = ((dx / l) * w) / 2;
    quad(
      b,
      [x1 - nx, y1 - ny, z],
      [x2 - nx, y2 - ny, z],
      [x2 + nx, y2 + ny, z],
      [x1 + nx, y1 + ny, z],
      color,
      glow,
    );
  }

  // The sketch on the easel: a QuickDraw-style cat, as line segments in board metres.
  const cat = [];
  {
    const r = 0.42,
      cy = 0.12;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2,
        c = ((i + 1) / 14) * Math.PI * 2;
      cat.push([Math.cos(a) * r, cy + Math.sin(a) * r, Math.cos(c) * r, cy + Math.sin(c) * r]);
    }
    cat.push(
      [-0.36, 0.34, -0.3, 0.72],
      [-0.3, 0.72, -0.1, 0.52],
      [0.1, 0.52, 0.3, 0.72],
      [0.3, 0.72, 0.36, 0.34],
      [-0.12, 0.06, -0.6, 0.14],
      [-0.12, 0.0, -0.62, -0.04],
      [0.12, 0.06, 0.6, 0.14],
      [0.12, 0.0, 0.62, -0.04],
      [-0.08, -0.12, 0, -0.18],
      [0, -0.18, 0.08, -0.12],
    );
  }
  const EASEL = { x: 15.6, y: 2.2, z: -29.6 };

  function addStatic(b) {
    const { box } = b;
    box(H.x - 2.4, 6.6, H.z + 3.98, 3.7, 3.4, 0.12, panel);
    box(H.x - 2.4, 8.38, H.z + 4, 3.9, 0.16, 0.16, '#c5c5ac');
    box(P.x, 6.3, P.z + 4.33, 5.4, 1.9, 0.1, panel);
    box(Z.x + 1, 18.2, Z.z - 1, 2.3, 4.1, 0.35, '#22302e');
    box(Z.x + 1, 18.25, Z.z - 0.81, 2, 3.6, 0.02, '#16211f');
    box(Z.x + 1, 16.35, Z.z - 0.81, 0.5, 0.08, 0.02, '#5d6b67');
    box(A.x, 15.9, A.z, 9.75, 0.8, 9.75, panel);
    // Rooftop circuit for the F1 project, with a chequered start line.
    const track = City.loopLength(3.6, 3.6, 1.5);
    for (let d = 0; d < track; d += 0.45) {
      const p = City.loopPose(F1.x, F1.z, 3.6, 3.6, 1.5, d);
      box(p.x, F1.y, p.z, 0.95, 0.06, 0.5, '#4a5553', p.yaw);
    }
    for (let k = 0; k < 4; k++)
      box(
        F1.x - 3.6,
        F1.y + 0.04,
        F1.z - 0.3 + k * 0.2,
        0.95,
        0.02,
        0.2,
        k % 2 ? '#f2ecdc' : '#242a29',
      );
    // The easel, its legs, and the classifier's output bars.
    box(EASEL.x, EASEL.y, EASEL.z, 2.4, 1.8, 0.08, '#f3ecd8');
    box(EASEL.x, EASEL.y + 0.93, EASEL.z, 2.5, 0.08, 0.12, '#8a6c4c');
    for (const dx of [-1, 1])
      box(EASEL.x + dx * 0.95, 1.1, EASEL.z - 0.05, 0.09, 2.2, 0.09, '#8a6c4c');
    box(EASEL.x, 1.25, EASEL.z - 0.5, 0.09, 2.5, 0.09, '#8a6c4c', 0);
    // Warehouse walls: an attention grid (west) and a chat wall (east), plus a mast for the drone to circle.
    box(W.x - 4.38, 4.6, W.z, 0.1, 3.4, 3.4, panel);
    box(W.x + 4.38, 4.6, W.z, 0.1, 3.4, 3.4, panel);
    box(W.x - 2.6, 10.8, W.z + 2.5, 0.12, 4.4, 0.12, '#b5463a');
    box(W.x - 2.6, 13.05, W.z + 2.5, 0.25, 0.12, 0.25, '#e9d39e', 0, 1);
  }

  function dronePose(t) {
    const s = t * 0.5,
      cx = W.x,
      cz = W.z - 0.6;
    return {
      x: cx + 3 * Math.sin(s),
      y: 13.6 + 0.25 * Math.sin(3 * s),
      z: cz + 1.9 * Math.sin(2 * s),
      yaw: Math.atan2(3 * Math.cos(s), 3.8 * Math.cos(2 * s)),
    };
  }
  function carPose(t) {
    const p = City.loopPose(F1.x, F1.z, 3.6, 3.6, 1.5, t * 3.4);
    return { ...p, y: F1.y + 0.12 };
  }
  function telescopeYaw(t) {
    return Math.sin(t * 0.15) * 1.2;
  }

  function addAnimated(b, t) {
    const { box } = b;
    // The Boring Company: a tunnel boring machine's cutter head turning in the portal.
    {
      const cx = B.x,
        cy = 2.6,
        z = B.z + 2.06,
        r = 2.05,
        spin = t * 0.7,
        n = 16;
      for (let i = 0; i < n; i++) {
        const a = spin + (i / n) * Math.PI * 2,
          c = spin + ((i + 1) / n) * Math.PI * 2;
        b.triangle(
          [cx, cy, z],
          [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z],
          [cx + Math.cos(c) * r, cy + Math.sin(c) * r, z],
          i % 2 ? '#c9a24f' : '#b48d3f',
        );
      }
      for (let k = 0; k < 4; k++) {
        const a = spin + (k * Math.PI) / 2;
        stroke(b, cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r, z + 0.03, 0.24, '#3a3f3c');
        for (let j = 1; j <= 3; j++)
          box(
            cx + (Math.cos(a) * r * j) / 3.4,
            cy + (Math.sin(a) * r * j) / 3.4,
            z + 0.1,
            0.2,
            0.2,
            0.14,
            '#d8d2c2',
          );
      }
      box(cx, cy, z + 0.08, 0.55, 0.55, 0.2, '#3a3f3c');
    }
    // Hyphenate: a live ledger; the last column is the reconciled total.
    for (let i = 0; i < 6; i++) {
      const h = i === 5 ? 2.6 : 0.4 + 2.1 * wave(t * 0.7, i * 0.9),
        x = H.x - 2.4 - 1.38 + i * 0.55;
      box(
        x,
        5.1 + h / 2,
        H.z + 4.07,
        0.42,
        h,
        0.05,
        i === 5 ? '#9fe3a8' : i % 2 ? '#e7c46b' : '#7fd1c4',
        0,
        0.9,
      );
    }
    // Parasol Lab: the telescope sweeps the sky; the panel runs a parallel reduction tree.
    {
      const a = telescopeYaw(t);
      box(P.x + Math.sin(a) * 1.9, 19.2, P.z + Math.cos(a) * 1.9, 0.9, 0.9, 4.4, ink, a);
      box(
        P.x + Math.sin(a) * 4.15,
        19.2,
        P.z + Math.cos(a) * 4.15,
        0.95,
        0.95,
        0.12,
        '#b9c9d6',
        a,
        0.6,
      );
      const phase = Math.floor(t * 1.2) % 5;
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 8; c++) {
          const stride = 1 << (r + 1),
            lit = phase > r && c % stride === stride - 1;
          box(
            P.x - 2.275 + c * 0.65,
            5.75 + r * 0.55,
            P.z + 4.4,
            0.42,
            0.3,
            0.04,
            lit ? '#a8f0b4' : '#2f4a3c',
            0,
            lit ? 1 : 0,
          );
        }
    }
    // Zaap AI: a conversation scrolls up a phone on the studio roof.
    for (let i = 0; i < 5; i++) {
      const k = (t * 0.2 + i / 5) % 1;
      if (k > 0.93) continue;
      const ai = i % 2 === 1;
      box(
        Z.x + 1 + (ai ? 0.32 : -0.32),
        16.7 + k * 3.05,
        Z.z - 0.79,
        1.15,
        0.42,
        0.03,
        ai ? '#86b3ad' : '#e9d39e',
        0,
        0.9,
      );
    }
    // APAC Financial: a stock ticker runs around the exchange building.
    {
      const L = City.loopLength(4.9, 4.9, 0.05),
        n = 40;
      for (let i = 0; i < n; i++) {
        const p = City.loopPose(A.x, A.z, 4.9, 4.9, 0.05, ((i / n) * L + t * 1.1) % L),
          mood = (Math.sin(i * 12.9898 + Math.floor(t / 3) * 4.1) * 43758.5453) % 1;
        box(
          p.x,
          15.9,
          p.z,
          0.06,
          0.42,
          (L / n) * 0.7,
          mood > 0.3 ? '#8fe08a' : mood < -0.3 ? '#e0776a' : '#e6dcc0',
          p.yaw,
          0.9,
        );
      }
    }
    // Project: the RL drone loops around the mast.
    {
      const p = dronePose(t),
        s = Math.sin(p.yaw),
        c = Math.cos(p.yaw);
      box(p.x, p.y, p.z, 0.5, 0.14, 0.5, '#2f3836', p.yaw);
      for (const [ax, az] of [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]) {
        const x = p.x + (ax * 0.42 * c + az * 0.42 * s),
          z = p.z + (-ax * 0.42 * s + az * 0.42 * c);
        box(x, p.y + 0.08, z, 0.62, 0.02, 0.07, '#c9cfc6', t * 40 + ax);
      }
      box(p.x + 0.27 * s, p.y, p.z + 0.27 * c, 0.08, 0.06, 0.04, '#e0776a', p.yaw, 1);
    }
    // Project: an F1 car laps the rooftop circuit.
    {
      const p = carPose(t),
        s = Math.sin(p.yaw),
        c = Math.cos(p.yaw),
        part = (x, y, z, w, h, d, color) =>
          box(p.x + x * c + z * s, p.y + y, p.z - x * s + z * c, w, h, d, color, p.yaw);
      part(0, 0, 0, 0.3, 0.1, 0.85, '#c8402f');
      part(0, 0.02, 0.46, 0.5, 0.03, 0.12, '#c8402f');
      part(0, 0.13, -0.4, 0.46, 0.04, 0.1, '#2f3836');
      part(0, 0.09, -0.05, 0.14, 0.1, 0.22, '#2f3836');
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) part(sx * 0.22, -0.02, sz * 0.28, 0.1, 0.14, 0.16, '#1f2524');
    }
    // Project: the sketch classifier draws a cat, then its confidence bars fill.
    {
      const cycle = t % 9,
        drawn = Math.min(cat.length, Math.floor((cycle / 5) * cat.length)),
        z = EASEL.z + 0.05;
      for (let i = 0; i < drawn; i++) {
        const [x1, y1, x2, y2] = cat[i];
        stroke(
          b,
          EASEL.x + x1 * 0.95,
          EASEL.y + 0.22 + y1 * 0.95,
          EASEL.x + x2 * 0.95,
          EASEL.y + 0.22 + y2 * 0.95,
          z,
          0.05,
          '#2f3836',
        );
      }
      const fill = Math.min(1, Math.max(0, (cycle - 5.2) / 1.3));
      [0.92, 0.05, 0.03].forEach((v, i) => {
        const w = 1.6 * v * fill;
        if (w > 0.01)
          box(
            EASEL.x - 0.8 + w / 2,
            EASEL.y - 0.55 - i * 0.14,
            z,
            w,
            0.09,
            0.02,
            i ? '#b9b2a0' : '#6f9f74',
            0,
            0.5,
          );
      });
    }
    // Project: an attention matrix pulses on the west wall; the chat wall scrolls on the east wall.
    for (let i = 0; i < 5; i++)
      for (let j = 0; j < 5; j++) {
        const v = Math.pow(wave(t * 1.3, i * 0.8 - j * 0.6 + (i === j ? 1.4 : 0)), 3);
        box(
          W.x - 4.45,
          3.2 + i * 0.6,
          W.z - 1.2 + j * 0.6,
          0.04,
          0.5,
          0.5,
          [0.17 + v * 0.74, 0.22 + v * 0.55, 0.2 + v * 0.2],
          0,
          0.4 + v * 0.6,
        );
      }
    for (let i = 0; i < 4; i++) {
      const k = (t * 0.18 + i / 4) % 1;
      if (k > 0.92) continue;
      const me = i % 2 === 0;
      box(
        W.x + 4.45,
        3.15 + k * 2.9,
        W.z + (me ? 0.55 : -0.55),
        0.04,
        0.48,
        1.6,
        me ? '#e9d39e' : '#86b3ad',
        0,
        0.9,
      );
    }
  }

  // Click targets. Facts come from career-data.js and the projects' own READMEs.
  const project = title => ({ github: title });
  const features = [
    {
      id: 'tbm',
      lift: 2.4,
      icon: '⚙',
      title: 'Tunnel boring machine',
      where: () => ({ x: B.x, y: 2.6, z: B.z + 2.1 }),
      chapter: 'boring',
      lines: [
        'The Boring Company · Software Engineering Intern',
        'Working across six engineering and operations tools',
        'Week one: traced a missing machine signal to an allowlist',
      ],
      case: 'signal',
    },
    {
      id: 'ledger',
      lift: 1.9,
      icon: '▥',
      title: 'The Flux Analysis ledger',
      where: () => ({ x: H.x - 2.4, y: 6.6, z: H.z + 4.1 }),
      chapter: 'hyphenate',
      lines: [
        'Hyphenate · from one LLM call to agentic workflows',
        '3 enterprise customers in three months',
        '99% line-item correctness, validated against NetSuite',
      ],
      case: 'flux',
    },
    {
      id: 'telescope',
      lift: 0.8,
      icon: '✦',
      title: 'The research telescope',
      where: t => {
        const a = telescopeYaw(t);
        return { x: P.x + Math.sin(a) * 3, y: 19.2, z: P.z + Math.cos(a) * 3 };
      },
      chapter: 'parasol',
      lines: [
        'Parasol Lab, UIUC · Research Assistant',
        'Parallel scan, reduction, and inner product in C++ / STAPL',
        'Benchmarking scalability and memory behaviour',
      ],
    },
    {
      id: 'reduction',
      lift: 1.1,
      icon: '⋮',
      title: 'A parallel reduction, in lights',
      where: () => ({ x: P.x, y: 6.3, z: P.z + 4.45 }),
      chapter: 'parasol',
      lines: [
        'Each row combines pairs from the row below',
        'Eight values, three steps, instead of seven',
        'An illustration of the primitives I study',
      ],
    },
    {
      id: 'phone',
      lift: 2.2,
      icon: '▯',
      title: 'Zaap AI',
      where: () => ({ x: Z.x + 1, y: 18.2, z: Z.z - 0.75 }),
      chapter: 'zaap',
      lines: [
        'An AI analyst in your pocket · founder',
        '50 beta users onboarded',
        '35% fewer API calls after redesigning data fetching',
      ],
    },
    {
      id: 'ticker',
      lift: 0.6,
      icon: '↗',
      title: 'The exchange ticker',
      where: () => ({ x: A.x, y: 15.9, z: A.z + 4.95 }),
      chapter: 'apac',
      lines: [
        'APAC Financial Services · Software Engineering Intern',
        'Preprocessing pipelines for financial-data models',
        'Where software and economics first met',
      ],
    },
    {
      id: 'drone',
      lift: 0.5,
      icon: '✈',
      title: 'Learning to navigate',
      where: t => dronePose(t),
      lines: [
        'Autonomous drone navigation with TD3 reinforcement learning',
        '80% success rate · dynamic obstacle avoidance',
        'ROS simulation with real-time 3D path visualisation',
      ],
      ...project('Learning to navigate'),
    },
    {
      id: 'f1',
      lift: 0.4,
      icon: '◐',
      title: 'Reading a race through data',
      where: t => carPose(t),
      lines: [
        'FastF1 telemetry and lap-time data',
        'Gradient boosting estimates the gap to pole',
        'Best laps, speed traces, and team pace compared',
      ],
      ...project('Reading a race through data'),
    },
    {
      id: 'easel',
      lift: 1.1,
      icon: '✎',
      title: 'A sketch becomes a prediction',
      where: () => ({ x: EASEL.x, y: EASEL.y, z: EASEL.z + 0.1 }),
      lines: [
        'React drawing canvas → FastAPI → CNN',
        'Trained on Google QuickDraw sketches',
        'Predictions with confidence scores',
      ],
      ...project('A sketch becomes a prediction'),
    },
    {
      id: 'attention',
      lift: 1.9,
      icon: '▦',
      title: 'Under the transformer',
      where: () => ({ x: W.x - 4.45, y: 4.6, z: W.z }),
      lines: [
        'Building transformer fundamentals from scratch',
        'Working through each piece from the inside out',
        'A learning repository with notes alongside the code',
      ],
      ...project('Under the transformer'),
    },
    {
      id: 'chat',
      lift: 1.9,
      icon: '☰',
      title: 'Real-time chat',
      where: () => ({ x: W.x + 4.45, y: 4.6, z: W.z }),
      lines: [
        'WebSockets end to end',
        'From authentication to message-storage validation',
        'The commit history shows the iteration',
      ],
      ...project('Real-time chat'),
    },
  ];
  const api = { addStatic, addAnimated, features, dronePose, carPose, EASEL };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CityLandmarks = api;
})(typeof window !== 'undefined' ? window : globalThis);
