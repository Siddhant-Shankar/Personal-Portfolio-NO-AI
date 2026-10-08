/* Click anything that moves to see what it is up to. Every detail here is fictional city life. */
(() => {
  'use strict';
  const F = window.FieldCore,
    City = window.FieldCity,
    Life = window.FieldLife,
    Marks = window.FieldLandmarks,
    game = window.Field,
    $ = id => document.getElementById(id),
    canvas = $('field-canvas');
  const names = [
    'Ines',
    'Kofi',
    'Mira',
    'Theo',
    'Priya',
    'Jonah',
    'Lena',
    'Ravi',
    'Sofia',
    'Omar',
    'Hana',
    'Felix',
    'Noor',
    'Arlo',
    'Yuki',
    'Dara',
  ];
  const errands = {
    day: [
      'Walking to the exchange building',
      'Out for a coffee',
      'Window shopping',
      'Taking the long way round',
      'Heading to a lecture',
      'Late for a meeting',
      'Looking for the makers’ warehouse',
      'Meeting a friend in the park',
    ],
    night: [
      'On the way home',
      'Walking off dinner',
      'Heading to a late shift',
      'Watching the windows light up',
      'Catching the last bus',
      'Taking the long way home',
    ],
  };
  const nearestPlace = p => [...F.landmarks].sort((a, b) => F.distance(p, a) - F.distance(p, b))[0];
  const heading = yaw => {
    const dx = Math.sin(yaw),
      dz = Math.cos(yaw);
    return Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'east' : 'west') : dz > 0 ? 'south' : 'north';
  };
  const cap = s => s[0].toUpperCase() + s.slice(1);

  // Every clickable mover, posed at the current simulation time.
  function pose(target) {
    const t = game.wildlife.elapsed;
    if (target.type === 'vehicle') {
      const p = Life.vehiclePose(game.wildlife.life, target.i);
      return { ...p, y: 1 };
    }
    if (target.type === 'person') {
      const p = Life.livePerson(game.wildlife.life, target.i);
      return { ...p, y: 1.3 };
    }
    if (target.type === 'boat') {
      const p = Life.boatPose(target.i, t);
      return { ...p, y: 0.7 };
    }
    if (target.type === 'feature') return { yaw: 0, ...Marks.features[target.i].where(t) };
    const a = game.wildlife.animals[target.i];
    return { x: a.x, z: a.z, yaw: a.yaw, y: 0.6 };
  }
  function targets() {
    const list = [];
    for (let i = 0; i < City.TRAFFIC; i++) list.push({ type: 'vehicle', i });
    for (let i = 0; i < Life.PEOPLE; i++) list.push({ type: 'person', i });
    for (let i = 0; i < Life.boats.length; i++) list.push({ type: 'boat', i });
    game.wildlife.animals.forEach((a, i) => list.push({ type: 'animal', i }));
    Marks.features.forEach((f, i) => list.push({ type: 'feature', i }));
    return list;
  }
  function describe(target, p) {
    const place = nearestPlace(p),
      night = game.sky.night > 0.5;
    if (target.type === 'feature') {
      const f = Marks.features[target.i],
        actions = [];
      if (f.chapter) actions.push({ label: 'Read the chapter', chapter: f.chapter });
      if (f.case) actions.push({ label: 'Case study ↗', href: `field-notes.html#case-${f.case}` });
      if (f.github) {
        const repo = window.CAREER.projects.find(q => q.title === f.github);
        if (repo) actions.push({ label: 'View on GitHub ↗', href: repo.url, external: true });
      }
      return { icon: f.icon, title: f.title, lines: f.lines, actions, fact: true };
    }
    if (target.type === 'vehicle') {
      const kind = City.vehicleKind(target.i),
        speed = City.circuits[target.i % City.circuits.length][2];
      return {
        icon: kind === 'bus' ? '▣' : kind === 'van' ? '▤' : '▭',
        title:
          kind === 'bus'
            ? `City bus · Route ${target.i + 1}`
            : kind === 'van'
              ? 'Delivery van'
              : 'Car',
        lines: [
          kind === 'bus'
            ? `Next stop: ${place.name}`
            : kind === 'van'
              ? `Parcels for ${place.name.replace(/^The /, 'the ')}`
              : `Passing ${place.name.replace(/^The /, 'the ')}`,
          game.wildlife.life.vehicles[target.i].waiting
            ? 'Stopped · waiting to move on'
            : `Heading ${heading(p.yaw)} · ${Math.round(speed * 7)} km/h`,
          night ? 'Headlights on' : 'Daytime loop',
        ],
      };
    }
    if (target.type === 'person') {
      const list = night ? errands.night : errands.day;
      return {
        icon: '☺',
        title: names[target.i % names.length],
        lines: [
          game.wildlife.life.people[target.i].waiting
            ? 'Waiting for you to step aside'
            : list[(target.i * 3) % list.length],
          `Near ${place.name.replace(/^The /, 'the ')}`,
          `Walking ${heading(p.yaw)}`,
        ],
      };
    }
    if (target.type === 'boat') {
      const boat = Life.boats[target.i];
      return {
        icon: '⛵',
        title: boat.name,
        lines: [
          `Heading ${heading(p.yaw)} along the canal`,
          boat.kind === 'barge'
            ? 'Carrying supplies to the yard'
            : boat.kind === 'ferry'
              ? 'Stops at both bridges'
              : 'Out for an afternoon row',
          `${(boat.speed * 1.9).toFixed(1)} knots`,
        ],
      };
    }
    const a = game.wildlife.animals[target.i],
      state = a.pace > 2 ? 'Startled, and moving away' : a.goal ? 'Roaming the park' : 'Resting';
    return {
      icon: '❦',
      title: cap(a.kind),
      lines: [
        state,
        a.kind === 'fox' ? 'Keeps to the quieter streets' : 'Lives in the central park',
        `Facing ${heading(a.yaw)}`,
      ],
    };
  }

  const card = document.createElement('div');
  card.id = 'field-inspect';
  card.hidden = true;
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-live', 'polite');
  card.innerHTML =
    '<div class="inspect-head"><span id="inspect-icon" aria-hidden="true"></span><strong id="inspect-title"></strong><button id="inspect-close" aria-label="Close details">×</button></div><ul id="inspect-lines"></ul><div id="inspect-actions"></div><div class="inspect-foot"><button id="inspect-follow">Follow <span aria-hidden="true">◎</span></button><small id="inspect-note">Fictional city life</small></div>';
  $('field-shell').append(card);
  let selected = null,
    follow = null,
    shown = '';
  const screen = (matrix, p) => {
    const q = F.project(matrix, p.x, p.y, p.z);
    return {
      x: (q.x * 0.5 + 0.5) * innerWidth,
      y: (-q.y * 0.5 + 0.5) * innerHeight,
      visible: q.w > 0 && Math.abs(q.x) < 1.05 && Math.abs(q.y) < 1.05,
      w: q.w,
    };
  };
  let lastMatrix = null;
  function pick(x, y) {
    if (!lastMatrix) return null;
    let best = null,
      bestD = Infinity;
    for (const t of targets()) {
      const s = screen(lastMatrix, pose(t));
      if (!s.visible) continue;
      const radius = Math.max(16, Math.min(44, 260 / s.w)),
        d = Math.hypot(s.x - x, s.y - y);
      if (d < radius && d < bestD) {
        best = t;
        bestD = d;
      }
    }
    return best;
  }
  function close() {
    selected = null;
    follow = null;
    card.hidden = true;
    shown = '';
    game.invalidate();
  }
  function open(target) {
    selected = target;
    follow = null;
    shown = '';
    $('inspect-follow').textContent = 'Follow ◎';
    card.hidden = false;
    game.invalidate();
  }
  $('inspect-close').onclick = close;
  $('inspect-actions').addEventListener('click', e => {
    const b = e.target.closest('[data-chapter]');
    if (!b) return;
    const i = window.Portfolio.places.findIndex(p => p.id === b.dataset.chapter);
    if (i >= 0) {
      close();
      game.openPlace
        ? game.openPlace(F.landmarks.find(l => l.id === b.dataset.chapter))
        : window.Portfolio.openStory(i);
    }
  });
  $('inspect-follow').onclick = () => {
    if (follow) {
      follow = null;
      $('inspect-follow').textContent = 'Follow ◎';
      return;
    }
    if (game.mode !== 'world') game.setMode('world');
    const p = pose(selected),
      f = game.camera.flight,
      h = Math.hypot(f.x - p.x, f.z - p.z) || 1;
    follow = { dx: ((f.x - p.x) / h) * 16, dy: 30, dz: ((f.z - p.z) / h) * 16 };
    $('inspect-follow').textContent = 'Following · stop';
    game.invalidate();
  };
  let press = null;
  canvas.addEventListener('pointerdown', e => {
    press = e.button === 0 ? { x: e.clientX, y: e.clientY, time: performance.now() } : null;
    follow = null;
    if (selected) $('inspect-follow').textContent = 'Follow ◎';
  });
  canvas.addEventListener('pointerup', e => {
    if (!press || document.pointerLockElement === canvas) return;
    const moved = Math.hypot(e.clientX - press.x, e.clientY - press.y),
      quick = performance.now() - press.time < 450;
    press = null;
    if (moved > 6 || !quick) return;
    const hit = pick(e.clientX, e.clientY);
    if (hit) open(hit);
    else if (selected) close();
  });
  canvas.addEventListener('pointermove', e => {
    if (press || e.pointerType !== 'mouse') return;
    canvas.style.cursor = pick(e.clientX, e.clientY) ? 'pointer' : '';
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && selected) close();
    else if (
      follow &&
      ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'c'].includes(
        e.key.toLowerCase(),
      )
    ) {
      follow = null;
      $('inspect-follow').textContent = 'Follow ◎';
    }
  });
  function update(matrix) {
    lastMatrix = matrix;
    if (!selected) return;
    const p = pose(selected);
    if (follow && game.mode === 'world' && !game.camera.transition) {
      // Glide to a close chase view that keeps looking at the target.
      const f = game.camera.flight,
        k = 0.12;
      let ty = p.y + follow.dy;
      while (!F.canFly(p.x + follow.dx, ty, p.z + follow.dz) && ty < 80) ty += 2;
      f.x += (p.x + follow.dx - f.x) * k;
      f.y += (ty - f.y) * k;
      f.z += (p.z + follow.dz - f.z) * k;
      const ox = f.x - p.x,
        oy = f.y - p.y,
        oz = f.z - p.z;
      game.look(Math.atan2(-ox, oz), Math.atan2(-oy, Math.hypot(ox, oz)));
      game.invalidate();
    } else if (follow && game.mode !== 'world') follow = null;
    const lift = selected.type === 'feature' ? Marks.features[selected.i].lift || 0 : 0,
      s = screen(matrix, { ...p, y: p.y + lift });
    card.hidden = !s.visible;
    if (!s.visible) return;
    card.style.transform = `translate(${Math.round(s.x)}px,${Math.round(s.y)}px) translate(-50%,calc(-100% - 22px))`;
    const info = describe(selected, p),
      key = JSON.stringify(info);
    if (key !== shown) {
      shown = key;
      $('inspect-icon').textContent = info.icon;
      $('inspect-title').textContent = info.title;
      $('inspect-lines').innerHTML = info.lines
        .map(l => `<li>${window.Portfolio.esc(l)}</li>`)
        .join('');
      const esc = window.Portfolio.esc;
      $('inspect-actions').innerHTML = (info.actions || [])
        .map(a =>
          a.chapter
            ? `<button data-chapter="${esc(a.chapter)}">${esc(a.label)}</button>`
            : `<a href="${esc(a.href)}"${a.external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(a.label)}</a>`,
        )
        .join('');
      $('inspect-note').textContent = info.fact ? 'From my work' : 'Fictional city life';
    }
  }
  window.FieldInspect = {
    update,
    open,
    close,
    pick,
    targets,
    pose,
    describe,
    get selected() {
      return selected;
    },
  };
})();
