/* City life beyond the career buildings: people on the pavements, boats on the canal, birds, and smoke. */
(function (root) {
  'use strict';
  const City =
    typeof module === 'object' && module.exports ? require('./field-city.js') : root.FieldCity;
  const hash = n => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const blocks = [];
  for (const x of [-36, -12, 12, 36]) for (const z of [-36, -12, 12, 36]) blocks.push([x, z]);

  // Pedestrians loop around a block on the pavement. Their pace eases up and down, so they seem to dawdle.
  const PEOPLE = 32,
    PAVEMENT = 9.1;
  const coats = [
      '#b8624a',
      '#3f5f6b',
      '#d4b06a',
      '#6f7f58',
      '#8a6c9a',
      '#e0d6bd',
      '#4b4f5c',
      '#c4835a',
      '#5d8a87',
      '#a14c4c',
    ],
    skins = ['#e8c9a6', '#c99a72', '#9c6b4a', '#6f4a33', '#f0d5bb'];
  function personPose(i, time) {
    const [cx, cz] = blocks[(i * 5) % blocks.length],
      speed = 0.85 + hash(i) * 0.55,
      w = 0.3 + hash(i + 40) * 0.35,
      reverse = i % 2 === 1;
    const travelled =
      speed * time -
      (speed / w) * 0.75 * Math.sin(w * time + hash(i + 80) * 6) +
      hash(i + 120) * 90;
    const p = City.loopPose(cx, cz, PAVEMENT, PAVEMENT, 1.4, reverse ? -travelled : travelled);
    return {
      x: p.x,
      z: p.z,
      yaw: reverse ? p.yaw + Math.PI : p.yaw,
      stride: travelled * 3.2,
      block: (i * 5) % blocks.length,
    };
  }
  function addPerson(b, i, time) {
    const p = personPose(i, time),
      s = Math.sin(p.yaw),
      c = Math.cos(p.yaw),
      swing = Math.sin(p.stride),
      coat = coats[i % coats.length],
      skin = skins[(i * 3) % skins.length],
      tall = 0.92 + hash(i + 9) * 0.2;
    const part = (x, y, z, w, h, d, color, tilt = 0) =>
      b.box(
        p.x + x * c + z * s,
        y * tall,
        p.z - x * s + z * c,
        w,
        h * tall,
        d,
        color,
        p.yaw + tilt,
      );
    for (const side of [-1, 1]) {
      part(side * 0.11, 0.42, swing * side * 0.16, 0.14, 0.8, 0.16, '#39413f');
      part(side * 0.29, 1.18, -swing * side * 0.14, 0.11, 0.62, 0.13, coat);
    }
    part(0, 1.2, 0, 0.46, 0.78, 0.28, coat);
    part(0, 1.78, 0, 0.26, 0.3, 0.26, skin);
    part(0, 1.96, -0.02, 0.28, 0.09, 0.28, i % 3 === 0 ? '#2f2a26' : '#5a4636');
    if (i % 5 === 2) part(0.34, 0.95, 0, 0.12, 0.34, 0.3, '#7d5b3e');
    if (i % 7 === 3) {
      part(0, 2.28, 0, 0.035, 0.65, 0.035, '#2f3836');
      part(0, 2.6, 0, 1.05, 0.1, 1.05, i % 2 ? '#a94f45' : '#3c5a66');
    }
  }

  // Boats share a long, narrow circuit: north along the west lane, south along the east lane.
  const boats = [
    { kind: 'ferry', name: 'Canal ferry', speed: 1.7, length: 4.6, color: '#e4dcc4' },
    { kind: 'barge', name: 'Supply barge', speed: 1.15, length: 5.2, color: '#8e6a4c' },
    { kind: 'rowboat', name: 'Rowing boat', speed: 1.4, length: 2.2, color: '#c06a4d' },
  ];
  function boatPose(i, time) {
    const boat = boats[i],
      p = City.loopPose(57, 0, 2, 50, 1.99, time * boat.speed + i * 71);
    return { x: p.x, z: p.z, yaw: p.yaw };
  }
  function addBoat(b, i, time) {
    const boat = boats[i],
      p = boatPose(i, time),
      s = Math.sin(p.yaw),
      c = Math.cos(p.yaw),
      L = boat.length,
      bob = Math.sin(time * 1.7 + i * 2) * 0.04;
    const part = (x, y, z, w, h, d, color, glow = 0) =>
      b.box(p.x + x * c + z * s, y + bob, p.z - x * s + z * c, w, h, d, color, p.yaw, glow);
    part(0, 0.18, 0, 1.25, 0.3, L, boat.color);
    part(0, 0.35, L / 2 - 0.15, 0.9, 0.12, 0.35, boat.color);
    part(0, 0.36, 0, 1.32, 0.07, L - 0.2, '#5b4a3a');
    if (boat.kind === 'ferry') {
      part(0, 0.78, -0.3, 1.05, 0.75, 2.4, '#f0e8d2');
      part(0, 0.85, -0.3, 1.08, 0.28, 2.2, '#4f6f73', 0.85);
      part(0, 1.2, -0.3, 1.15, 0.08, 2.6, '#3e5a5c');
      part(0, 0.4, L / 2 - 0.05, 0.2, 0.12, 0.05, '#ead6a1', 1);
    } else if (boat.kind === 'barge') {
      for (let k = -1; k <= 1; k++)
        part(0, 0.62, k * 1.3, 0.95, 0.55, 1.1, ['#9b7d4f', '#6d8a83', '#b0574a'][k + 1]);
      part(0, 0.95, -L / 2 + 0.6, 0.8, 0.9, 0.8, '#ddd2b6');
      part(0, 1.05, -L / 2 + 0.6, 0.82, 0.2, 0.6, '#4f6f73', 0.85);
    } else {
      part(0, 0.38, 0, 0.9, 0.06, 0.25, '#6b4a36');
      part(0, 0.62, -0.2, 0.32, 0.45, 0.26, '#3f5f6b');
      part(0, 0.86, -0.2, 0.2, 0.2, 0.2, '#e0be98');
      const oar = Math.sin(time * 2.4 + i) * 0.5;
      for (const side of [-1, 1])
        b.box(
          p.x + side * 0.8 * c,
          0.4 + bob,
          p.z - side * 0.8 * s,
          0.08,
          0.05,
          1.5,
          '#7a5a3f',
          p.yaw + oar * side,
        );
    }
  }

  // A small flock wheeling above the park; wings beat, then glide.
  const BIRDS = 11;
  function birdPose(i, time) {
    const centre = { x: -12 + Math.sin(time * 0.05) * 6, z: 12 + Math.cos(time * 0.04) * 6 },
      a = time * 0.32 + i * 0.55,
      r = 13 + (i % 4) * 1.6;
    return {
      x: centre.x + Math.cos(a) * r,
      y: 30 + Math.sin(time * 0.6 + i) * 1.4 + (i % 3) * 0.8,
      z: centre.z + Math.sin(a) * r,
      yaw: Math.atan2(-Math.sin(a), Math.cos(a)),
    };
  }
  function addBird(b, i, time) {
    const p = birdPose(i, time),
      s = Math.sin(p.yaw),
      c = Math.cos(p.yaw),
      beat = Math.sin(time * 9 + i * 1.3),
      flap = (Math.sin(time * 0.7 + i) > 0.2 ? beat : 0.15) * 0.45,
      tone = '#2f3b3a';
    const at = (x, y, z) => [p.x + x * c + z * s, p.y + y, p.z - x * s + z * c];
    b.box(p.x, p.y, p.z, 0.16, 0.12, 0.5, tone, p.yaw);
    for (const side of [-1, 1]) {
      b.triangle(
        at(side * 0.06, 0, 0.12),
        at(side * 0.06, 0, -0.12),
        at(side * 0.75, flap, -0.05),
        tone,
      );
    }
  }

  // Chimney smoke from the makers' warehouse.
  function addSmoke(b, time) {
    const w = City.landmarks.find(p => p.id === 'projects');
    for (let i = 0; i < 6; i++) {
      const k = (time * 0.22 + i / 6) % 1,
        size = (0.45 + k * 1.25) * (1 - Math.max(0, (k - 0.72) / 0.28));
      if (size <= 0.02) continue;
      b.box(
        w.x + 3.7 + k * 1.8 + Math.sin(time + i) * 0.2,
        12.9 + k * 5.5,
        w.z - 3 - k * 0.6,
        size,
        size,
        size,
        '#d8d4c8',
        k * 1.4,
      );
    }
  }

  // Live state: each vehicle and person keeps its own progress, so they can stop for the visitor and for each other.
  function create() {
    return {
      vehicles: Array.from({ length: City.TRAFFIC }, (_, i) => {
        const speed = City.circuits[i % City.circuits.length][2];
        return { d: i * 17, v: speed, speed };
      }),
      people: Array.from({ length: PEOPLE }, () => ({ t: 0, rate: 1 })),
    };
  }
  const vehiclePose = (state, i) => City.trafficPoseAt(i, state.vehicles[i].d);
  const livePerson = (state, i) => personPose(i, state.people[i].t);
  const ahead = (p, yaw, q) => {
    const dx = q.x - p.x,
      dz = q.z - p.z,
      s = Math.sin(yaw),
      c = Math.cos(yaw);
    return { along: dx * s + dz * c, side: Math.abs(dx * c - dz * s) };
  };
  const LOOP = City.loopLength(10.7, 10.7, 2.1);
  function update(state, dt, visitor) {
    const walking = visitor && (visitor.y === undefined || visitor.y < 4),
      ease = k => 1 - Math.exp(-k * dt);
    const cars = state.vehicles.map((_, i) => vehiclePose(state, i));
    state.vehicles.forEach((v, i) => {
      const p = cars[i],
        half = City.vehicleHalf(i);
      let blocked = false;
      // Brake for a visitor in front of the bumper, and keep a gap behind the vehicle ahead on the same circuit.
      if (walking) {
        const q = ahead(p, p.yaw, visitor);
        if (q.along > half.l - 0.3 && q.along < half.l + 3.2 && q.side < half.w + 0.9)
          blocked = true;
      }
      for (let j = 0; j < cars.length && !blocked; j++) {
        if (j === i || j % City.circuits.length !== i % City.circuits.length) continue;
        const gap = (((state.vehicles[j].d - v.d) % LOOP) + LOOP) % LOOP;
        if (gap < half.l + City.vehicleHalf(j).l + 2.2) blocked = true;
      }
      v.waiting = blocked;
      v.v += ((blocked ? 0 : v.speed) - v.v) * ease(blocked ? 7 : 2.2);
      if (v.v < 0.02 && blocked) v.v = 0;
      v.d += v.v * dt;
    });
    const people = state.people.map((_, i) => livePerson(state, i));
    state.people.forEach((person, i) => {
      const p = people[i];
      let blocked = false;
      if (walking) {
        const q = ahead(p, p.yaw, visitor);
        if (q.along > 0 && q.along < 1.15 && q.side < 0.6) blocked = true;
      }
      for (let j = 0; j < people.length && !blocked; j++) {
        if (j === i || people[j].block !== p.block) continue;
        const q = ahead(p, p.yaw, people[j]);
        if (q.along > 0 && q.along < 0.95 && q.side < 0.45) blocked = true;
      }
      person.waiting = blocked;
      person.rate += ((blocked ? 0 : 1) - person.rate) * ease(blocked ? 9 : 3);
      if (person.rate < 0.02 && blocked) person.rate = 0;
      person.t += person.rate * dt;
    });
  }
  // Is a visitor of radius r at (x,z) overlapping a vehicle, person, or animal?
  function solid(state, animals, x, z, r) {
    for (let i = 0; i < state.vehicles.length; i++) {
      const p = vehiclePose(state, i),
        h = City.vehicleHalf(i),
        q = ahead(p, p.yaw, { x, z });
      if (Math.abs(q.along) < h.l + r && q.side < h.w + r) return true;
    }
    for (let i = 0; i < PEOPLE; i++) {
      const p = livePerson(state, i);
      if (Math.hypot(p.x - x, p.z - z) < 0.28 + r) return true;
    }
    for (const a of animals || []) {
      const size = { deer: 0.6, fox: 0.38, rabbit: 0.24, chicken: 0.22 }[a.kind] || 0.3;
      if (Math.hypot(a.x - x, a.z - z) < size + r) return true;
    }
    return false;
  }
  const Landmarks = () =>
    typeof module === 'object' && module.exports
      ? require('./field-landmarks.js')
      : root.FieldLandmarks;
  function add(builder, time, state) {
    for (let i = 0; i < PEOPLE; i++) addPerson(builder, i, state ? state.people[i].t : time);
    for (let i = 0; i < boats.length; i++) addBoat(builder, i, time);
    for (let i = 0; i < BIRDS; i++) addBird(builder, i, time);
    addSmoke(builder, time);
    Landmarks()?.addAnimated(builder, time);
  }
  const api = {
    PEOPLE,
    BIRDS,
    boats,
    blocks,
    PAVEMENT,
    personPose,
    boatPose,
    birdPose,
    add,
    create,
    update,
    solid,
    vehiclePose,
    livePerson,
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FieldLife = api;
})(typeof window !== 'undefined' ? window : globalThis);
