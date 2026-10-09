/* First-person exploration of a small, handmade field of work. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id),
    Core = window.CityCore,
    Camera = window.CityCamera,
    Portfolio = window.Portfolio,
    reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.body.classList.add('city-mode');
  const shell = document.createElement('div');
  shell.id = 'city-shell';
  shell.innerHTML = `<canvas id="city-canvas" tabindex="0" aria-label="First-person landscape. Use WASD to move, Space to jump, double-tap Space to fly, click to capture the mouse and look around, and E to read a nearby landmark."></canvas><div id="city-shade" aria-hidden="true"></div><div id="landmark-labels"></div><div class="city-compass"><span id="city-heading">N</span><i></i><span>CITY ATLAS / SIDDHANT SHANKAR</span></div><div id="city-clock" role="group" aria-label="Time of day in the city"><span id="clock-dial" aria-hidden="true"><i></i></span><span class="clock-read"><strong id="clock-time">--:--</strong><small id="clock-phase"></small></span><button id="clock-run" aria-pressed="true" aria-label="Pause the passage of time">❚❚</button><button id="clock-skip" aria-label="Skip ahead one hour">+1h <kbd>T</kbd></button></div><div id="city-status"><span class="city-kicker" id="city-mode-status">ON FOOT / STREET LEVEL</span><span id="city-visited">0 / 11 PLACES VISITED</span></div><button id="nearby-place" hidden><span class="nearby-key">E</span><span><small id="nearby-company"></small><strong id="nearby-title"></strong></span><span>↗</span></button><div id="city-perspectives" role="group" aria-label="Camera perspective"><button id="city-walk-view" aria-pressed="true">On foot</button><button id="city-world-view" aria-pressed="false">City view <kbd>V</kbd></button></div><div id="city-flight-controls" hidden><span>FREE FLIGHT</span><p>WASD move · click to look<br>Space rise · Shift descend<br>Double-tap W to sprint<br>Double-tap Space to drop</p><div><button id="city-rise" aria-label="Fly higher">↑ Rise</button><button id="city-descend" aria-label="Fly lower">↓ Descend</button></div><button id="city-frame">Frame the city <kbd>R</kbd></button><small>Scroll to move closer or farther</small></div><div id="city-controls"><button id="city-look">Click the city to look</button><button id="city-home">Return to start</button><button id="city-help">How to explore</button></div><div class="city-reticle" aria-hidden="true">·</div><div id="city-fallback" hidden><h2>The city needs WebGL.</h2><p>You can still explore every career story through the index, or read the complete field guide.</p><button id="fallback-index">Open experience index</button><a href="notes.html">Read the field guide ↗</a></div>`;
  $('experience').append(shell);
  const canvas = $('city-canvas');
  const player = { x: 0, y: 1.45, z: 23, yaw: -0.25, pitch: 0 },
    keys = new Set(),
    visited = new Set();
  const camera = Camera.create(player);
  let renderer,
    entered = false,
    last = 0,
    frame = 0,
    dirty = true,
    targetYaw = player.yaw,
    targetPitch = 0,
    vx = 0,
    vz = 0,
    nearest = null,
    walkTime = 0,
    journey = null;
  // Creative-mode feel: Space jumps, a double-tap of Space takes off or drops, a double-tap of W sprints.
  const air = { lift: 0, v: 0 },
    taps = { ' ': 0, w: 0 },
    DOUBLE_TAP = 0.3;
  let sprint = false;
  const Sky = window.CitySky,
    now = new Date(),
    clock = { hours: now.getHours() + now.getMinutes() / 60, running: !reduced.matches, shown: '' };
  const requested = parseFloat(new URLSearchParams(location.search).get('hour'));
  if (Number.isFinite(requested)) clock.hours = Sky.wrap(requested);
  let sky = Sky.sample(clock.hours),
    skyClock = 0;
  const labels = new Map(),
    wildlife = CityWildlife.create();
  let wildlifeMesh = CityWildlife.mesh(wildlife),
    wildlifeClock = 0,
    wildlifePaused = false;
  const wildlifeButton = document.createElement('button');
  wildlifeButton.id = 'city-wildlife-toggle';
  function wildlifeControl() {
    wildlifeButton.textContent = wildlifePaused ? 'Resume city life' : 'City alive';
    wildlifeButton.setAttribute(
      'aria-label',
      wildlifePaused ? 'Resume animals and traffic' : 'Pause animals and traffic',
    );
    wildlifeButton.setAttribute('aria-pressed', String(!wildlifePaused));
  }
  wildlifeButton.onclick = () => {
    wildlifePaused = !wildlifePaused;
    wildlifeControl();
    dirty = true;
  };
  $('city-controls').append(wildlifeButton);
  wildlifeControl();
  reduced.addEventListener('change', () => {
    clock.running = !reduced.matches;
    applySky();
    dirty = true;
  });
  function applySky() {
    sky = Sky.sample(clock.hours);
    const style = $('city-shell').style;
    style.setProperty('--sky-top', sky.css.top);
    style.setProperty('--sky-low', sky.css.low);
    style.setProperty('--sky-haze', sky.css.haze);
    style.setProperty('--night', sky.night.toFixed(3));
    document.body.classList.toggle('city-night', sky.night > 0.5);
    const label = Sky.label(clock.hours);
    if (label !== clock.shown) {
      clock.shown = label;
      $('clock-time').textContent = label;
      $('clock-phase').textContent = sky.phase;
      $('clock-dial').style.setProperty('--turn', `${clock.hours / 24}turn`);
    }
    $('clock-run').textContent = clock.running ? '❚❚' : '▶';
    $('clock-run').setAttribute('aria-pressed', String(clock.running));
    $('clock-run').setAttribute(
      'aria-label',
      clock.running ? 'Pause the passage of time' : 'Let time pass',
    );
  }
  function skipHour() {
    clock.hours = Sky.wrap(clock.hours + 1);
    applySky();
    dirty = true;
  }
  $('clock-run').onclick = () => {
    clock.running = !clock.running;
    applySky();
  };
  $('clock-skip').onclick = skipHour;
  applySky();
  for (const place of Core.landmarks) {
    const button = document.createElement('button');
    button.className = 'city-label';
    button.innerHTML = `<i style="--marker:${place.color}"></i><span>${Portfolio.esc(place.company)}</span><small class="label-meta"></small>`;
    button.setAttribute('aria-label', `Explore ${place.company}`);
    button.onclick = () => window.CityMap?.select(place);
    $('landmark-labels').append(button);
    labels.set(place.id, button);
  }
  // Cars, people, and animals are solid. If one has already reached the visitor, let them step away freely.
  let groundY = 0;
  function movers(ignore) {
    if (ignore) return null;
    const solid = (x, z) => CityLife.solid(wildlife.life, wildlife.animals, x, z, 0.35);
    return solid(player.x, player.z) ? null : solid;
  }
  function pause() {
    return !!document.querySelector('dialog[open]');
  }
  function enter() {
    entered = true;
    document.body.classList.add('city-entered');
    $('city-intro').inert = true;
    canvas.focus({ preventScroll: true });
    dirty = true;
  }
  function unlock() {
    if (document.pointerLockElement === canvas) document.exitPointerLock();
  }
  function openPlace(place) {
    enter();
    unlock();
    stop();
    visited.add(place.id);
    $('city-visited').textContent = `${visited.size} / 11 PLACES VISITED`;
    const i = Portfolio.places.findIndex(p => p.id === place.id);
    if (i >= 0) Portfolio.openStory(i);
    dirty = true;
  }
  function stop() {
    journey = null;
    keys.clear();
    sprint = false;
    vx = vz = 0;
    Camera.resetVelocity(camera);
  }
  // The flight cheat sheet shows for a few seconds after take-off, then tucks itself into a small tab.
  let tuckFlight = 0;
  function modeUI() {
    const flying = camera.mode === 'world';
    clearTimeout(tuckFlight);
    $('city-flight-controls').classList.remove('compact');
    if (flying)
      tuckFlight = setTimeout(() => $('city-flight-controls').classList.add('compact'), 6000);
    document.body.classList.toggle('city-flying', flying);
    $('city-walk-view').setAttribute('aria-pressed', String(!flying));
    $('city-world-view').setAttribute('aria-pressed', String(flying));
    $('city-flight-controls').hidden = !flying;
    $('city-mode-status').textContent = flying ? 'FLYING / FREE FLIGHT' : 'ON FOOT / STREET LEVEL';
    canvas.setAttribute(
      'aria-label',
      flying
        ? 'Flying. WASD to fly, Space to rise, Shift to descend, double-tap Space to drop, drag to look, V to return to walking.'
        : 'First-person landscape. WASD to walk, Shift to run, Space to jump, double-tap Space to fly, E to read, V for city view.',
    );
  }
  function setMode(mode) {
    enter();
    unlock();
    stop();
    air.lift = air.v = 0;
    Camera.setMode(camera, mode, player, innerWidth / innerHeight, reduced.matches);
    const pose = mode === 'world' ? camera.flight : player;
    targetYaw = pose.yaw;
    targetPitch = pose.pitch;
    modeUI();
    dirty = true;
  }
  function frameWorld() {
    stop();
    Camera.frameWorld(camera, reduced.matches, innerWidth / innerHeight);
    targetYaw = camera.flight.yaw;
    targetPitch = camera.flight.pitch;
    dirty = true;
  }
  // Take off from the street, or come down onto it. Over a roof or the canal, keep flying until there is a street below.
  function toggleFlight() {
    if (camera.transition) return;
    enter();
    journey = null;
    if (camera.mode === 'walk') {
      Camera.takeOff(camera, player, { x: vx, z: vz });
      air.lift = air.v = 0;
    } else if (Core.canWalk(camera.flight.x, camera.flight.z)) {
      const v = camera.velocity;
      vx = v.x;
      vz = v.z;
      air.lift = Camera.land(camera, player);
      air.v = 0;
      groundY = Core.groundAt(player.x, player.z);
      targetPitch = Core.clamp(targetPitch, -1.35, 1.35);
    } else {
      $('city-mode-status').textContent = 'NO STREET BELOW / KEEP FLYING';
      return;
    }
    modeUI();
    dirty = true;
  }
  // On foot from the air: drop onto the street below if there is one, otherwise go back to where you were.
  $('city-walk-view').onclick = () => {
    if (
      camera.mode === 'world' &&
      !camera.transition &&
      camera.flight.y < 40 &&
      Core.canWalk(camera.flight.x, camera.flight.z)
    )
      toggleFlight();
    else setMode('walk');
  };
  $('city-world-view').onclick = () => setMode('world');
  $('city-frame').onclick = frameWorld;
  for (const [id, key] of [
    ['city-rise', ' '],
    ['city-descend', 'c'],
  ]) {
    const b = $(id);
    b.onpointerdown = e => {
      e.preventDefault();
      keys.add(key);
      b.setPointerCapture(e.pointerId);
    };
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
      b.addEventListener(event, () => keys.delete(key));
  }
  $('enter-field').onclick = () => setMode('walk');
  $('nearby-place').onclick = () => {
    if (nearest) openPlace(nearest.place);
  };
  $('city-home').onclick = () => {
    stop();
    player.x = 0;
    player.y = 1.45;
    player.z = 23;
    player.yaw = -0.25;
    player.pitch = 0;
    setMode('walk');
  };
  $('city-help').onclick = () => {
    unlock();
    Portfolio.modal('help');
  };
  $('fallback-index').onclick = () => $('open-index').click();
  // As in Minecraft: click into the city and the mouse is captured, so moving it looks around with
  // no button held. Esc lets go. Raw, unaccelerated movement where the browser offers it.
  async function lockMouse() {
    enter();
    if (document.pointerLockElement === canvas) return;
    try {
      await canvas.requestPointerLock({ unadjustedMovement: true });
    } catch {
      // Browsers refuse a re-capture for a moment after Esc; dragging still looks around meanwhile.
      try {
        await canvas.requestPointerLock();
      } catch {
        /* Not captured this time; the next click tries again. */
      }
    }
  }
  $('city-look').onclick = lockMouse;
  document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement === canvas;
    document.body.classList.toggle('city-locked', locked);
    $('city-look').textContent = locked
      ? 'Mouse captured · Esc to release'
      : 'Click the city to look';
    if (!locked) drag = null;
  });
  let drag = null;
  canvas.addEventListener('pointerdown', e => {
    enter();
    if (e.button !== 0 || document.pointerLockElement === canvas) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!drag || pause() || document.pointerLockElement === canvas) return;
    targetYaw += (e.clientX - drag.x) * 0.004;
    targetPitch = Core.clamp(
      targetPitch - (e.clientY - drag.y) * 0.003,
      camera.mode === 'world' ? -1.48 : -1.35,
      camera.mode === 'world' ? 1.2 : 1.35,
    );
    drag.x = e.clientX;
    drag.y = e.clientY;
    dirty = true;
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
    canvas.addEventListener(event, () => (drag = null));
  document.addEventListener('mousemove', e => {
    if (document.pointerLockElement !== canvas || pause()) return;
    targetYaw += e.movementX * 0.002;
    targetPitch = Core.clamp(
      targetPitch - e.movementY * 0.002,
      camera.mode === 'world' ? -1.48 : -1.35,
      camera.mode === 'world' ? 1.2 : 1.35,
    );
    dirty = true;
  });
  canvas.addEventListener(
    'wheel',
    e => {
      if (camera.mode !== 'world' || pause()) return;
      e.preventDefault();
      Camera.zoom(camera, e.deltaY);
      dirty = true;
    },
    { passive: false },
  );
  document.addEventListener('keydown', e => {
    if (
      pause() ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)
    )
      return;
    const k = e.key.toLowerCase();
    if (k === 'v' && !e.repeat) {
      e.preventDefault();
      setMode(camera.mode === 'world' ? 'walk' : 'world');
      return;
    }
    if (k === 'r' && camera.mode === 'world' && !e.repeat) {
      e.preventDefault();
      frameWorld();
      return;
    }
    if (
      [
        'w',
        'a',
        's',
        'd',
        'arrowup',
        'arrowdown',
        'arrowleft',
        'arrowright',
        'shift',
        ' ',
      ].includes(k) ||
      (camera.mode === 'world' && ['c', 'pageup', 'pagedown'].includes(k))
    ) {
      if (k === ' ' && e.target !== canvas && /BUTTON|A/.test(e.target.tagName)) return;
      e.preventDefault();
      journey = null;
      enter();
      keys.add(k);
      const tap = k === 'arrowup' ? 'w' : k;
      if (!e.repeat && tap in taps) {
        const now = performance.now() / 1000,
          double = now - taps[tap] < DOUBLE_TAP;
        taps[tap] = double ? 0 : now;
        if (double && tap === ' ') toggleFlight();
        if (double && tap === 'w') sprint = true;
      }
    }
    if (k === 'm') {
      e.preventDefault();
      window.CityMap?.open();
    }
    if (k === 't' && !e.repeat) {
      e.preventDefault();
      skipHour();
    }
    if (k === 'escape') stop();
    if (k === 'e' && camera.mode === 'walk' && nearest?.distance < 6) {
      e.preventDefault();
      openPlace(nearest.place);
    }
  });
  document.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  addEventListener('blur', stop);
  document.querySelectorAll('dialog').forEach(d => {
    d.addEventListener('close', () => {
      dirty = true;
      canvas.focus({ preventScroll: true });
    });
  });
  const observer = new MutationObserver(() => {
    if (pause()) {
      stop();
      unlock();
    }
  });
  document
    .querySelectorAll('dialog')
    .forEach(d => observer.observe(d, { attributes: true, attributeFilter: ['open'] }));
  const LABEL_OFFSETS = [];
  for (let dy = -7; dy <= 7; dy++) for (let dx = -2; dx <= 2; dx++) LABEL_OFFSETS.push([dx, dy]);
  LABEL_OFFSETS.sort(
    (a, b) =>
      Math.abs(a[1]) +
      (a[1] > 0 ? 0.4 : 0) +
      Math.abs(a[0]) * 1.3 -
      (Math.abs(b[1]) + (b[1] > 0 ? 0.4 : 0) + Math.abs(b[0]) * 1.3),
  );
  const labelStems = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  labelStems.id = 'label-stems';
  labelStems.setAttribute('aria-hidden', 'true');
  $('landmark-labels').prepend(labelStems);
  let lastStems = '',
    relayout = false;
  // Only touch the DOM when a sign's distance text actually changes.
  function setMeta(label, text) {
    if (label.dataset.meta === text) return false;
    label.dataset.meta = text;
    label.querySelector('.label-meta').textContent = text;
    return true;
  }
  // Is another building standing between the eye and this landmark?
  function hiddenBehind(place, eye) {
    const dx = place.x - eye.x,
      dz = place.z - eye.z,
      length = Math.hypot(dx, dz);
    for (let t = 2; t < length - 6; t += 1.5) {
      const x = eye.x + (dx * t) / length,
        z = eye.z + (dz * t) / length;
      if (
        Core.blockers.some(o => o !== place && Math.abs(x - o.x) < 4.2 && Math.abs(z - o.z) < 4.2)
      )
        return true;
    }
    return false;
  }
  function overlay(matrix) {
    // Flying low reads like walking: nearby signs with distances. Up high, every chapter is labelled.
    // Before the visitor starts exploring, the still overview lays all eleven out with leader lines.
    const eye = camera.eye,
      flying = camera.mode === 'world' && eye.y > 14,
      occupied = [];
    const intro = flying && !entered ? $('city-intro').getBoundingClientRect() : null;
    // Keep the opening overview's labels off the big name sign on the hills.
    const banner = window.CityRooftops?.BANNER;
    if (flying && !entered && banner) {
      const pts = banner.corners.map(([x, y, z]) => Core.project(matrix, x, y, z));
      if (pts.every(q => q.w > 0)) {
        const xs = pts.map(q => (q.x * 0.5 + 0.5) * innerWidth),
          ys = pts.map(q => (-q.y * 0.5 + 0.5) * innerHeight),
          left = Math.min(...xs),
          right = Math.max(...xs),
          top = Math.min(...ys),
          bottom = Math.max(...ys);
        occupied.push({ x: (left + right) / 2, y: bottom, w: right - left, h: bottom - top });
      }
    }
    let stems = '',
      remeasure = false;
    for (const p of [...Core.landmarks].sort(
      (a, b) => Core.distance(eye, a) - Core.distance(eye, b),
    )) {
      const b = labels.get(p.id),
        distance = Core.distance(eye, p),
        point = Core.project(matrix, p.x, (p.height || 5) + 1.5, p.z),
        x = (point.x * 0.5 + 0.5) * innerWidth,
        y = (-point.y * 0.5 + 0.5) * innerHeight,
        width = p.company.length * 6.1 + 32;
      if (entered) {
        // Exploring: every sign sits straight above its own roof and glides with it. Nothing is
        // reshuffled or pinned to the screen edge as you move; when two signs would overlap, the
        // nearer one stays and the farther one fades out until there is room again.
        const w = b.offsetWidth || width,
          h = b.offsetHeight || 32,
          base = Core.project(matrix, p.x, 1, p.z),
          inView =
            distance < (flying ? 400 : 90) &&
            (point.w > 0 || base.w > 0) &&
            Math.abs((point.w > 0 ? point : base).x) < 1.04 &&
            (point.w > 0 ? point.y : 1) > -1.04 &&
            base.y < 1.04,
          spot = {
            x: Core.clamp(x, 16 + w / 2, innerWidth - 16 - w / 2),
            y: Core.clamp(point.w > 0 ? y : 0, 168 + h, innerHeight - 120),
          },
          tucked = b.classList.contains('tucked'),
          pad = tucked ? 12 : 3,
          clear =
            inView &&
            !occupied.some(
              r =>
                Math.abs(spot.x - r.x) < (w + r.w) / 2 + pad &&
                Math.abs(spot.y - r.y) < (h + r.h) / 2 + pad,
            );
        if (b.hidden || !b.offsetWidth) remeasure = true;
        b.hidden = false;
        b.classList.remove('edge');
        b.classList.toggle('near', !flying && distance < 14);
        b.classList.toggle('tucked', !clear);
        // Distances only up close, in five-metre steps, so the text is not ticking as you walk.
        if (setMeta(b, !flying && distance < 40 ? `${Math.round(distance / 5) * 5} m` : ''))
          remeasure = true;
        if (clear) occupied.push({ x: spot.x, y: spot.y, w, h });
        b.style.transform = `translate(${Math.round(spot.x)}px,${Math.round(spot.y)}px) translate(-50%,-100%)`;
        b.style.opacity = !clear
          ? '0'
          : flying
            ? '1'
            : String(hiddenBehind(p, eye) ? 0.62 : Core.clamp(1.15 - distance / 90, 0.75, 1));
        continue;
      }
      if (flying) {
        // The opening overview labels all eleven chapters. Off-screen buildings are pinned to the edge; crowded labels take the nearest free spot, with a leader line to their roof.
        let px = point.x,
          py = point.y;
        if (point.w <= 0) {
          const m = Math.max(Math.abs(px), Math.abs(py)) || 1;
          px = (-px / m) * 2;
          py = (-py / m) * 2;
        }
        const w = b.offsetWidth || width,
          h = b.offsetHeight || 32,
          anchorX = (px * 0.5 + 0.5) * innerWidth,
          anchorY = (-py * 0.5 + 0.5) * innerHeight,
          top = 165 + h,
          bottom = innerHeight - 100;
        const place = (dx, dy) => {
          let x = Core.clamp(anchorX + dx * (w * 0.6 + 8), 16 + w / 2, innerWidth - 16 - w / 2);
          const y = Core.clamp(anchorY - 6 + dy * (h + 6), top, bottom);
          if (intro && x - w / 2 < intro.right + 8 && y > intro.top && y - h < intro.bottom)
            x = Math.min(innerWidth - 16 - w / 2, intro.right + 8 + w / 2);
          return { x, y };
        };
        const free = q =>
          !occupied.some(
            r => Math.abs(q.x - r.x) < (w + r.w) / 2 + 4 && Math.abs(q.y - r.y) < (h + r.h) / 2 + 4,
          );
        const edge =
          point.w <= 0 ||
          anchorX < 16 ||
          anchorX > innerWidth - 16 ||
          anchorY < top - h ||
          anchorY > bottom + h;
        let spot = place(0, 0);
        for (const [dx, dy] of LABEL_OFFSETS) {
          const q = place(dx, dy);
          if (free(q)) {
            spot = q;
            break;
          }
        }
        occupied.push({ x: spot.x, y: spot.y, w, h });
        if (b.hidden || !b.offsetWidth) remeasure = true;
        b.hidden = false;
        b.classList.toggle('edge', edge);
        b.classList.remove('near');
        setMeta(b, '');
        if (!edge) {
          const cy = spot.y - h / 2,
            sx =
              Math.abs(anchorY - cy) > h / 2
                ? spot.x
                : spot.x + (Math.sign(anchorX - spot.x) * w) / 2,
            sy = anchorY > spot.y ? spot.y : anchorY < spot.y - h ? spot.y - h : cy;
          if (Math.hypot(anchorX - sx, anchorY - sy) > 5)
            stems += `<path d="M${sx.toFixed(1)} ${sy.toFixed(1)}L${anchorX.toFixed(1)} ${anchorY.toFixed(1)}"/><circle cx="${anchorX.toFixed(1)}" cy="${anchorY.toFixed(1)}" r="2.2"/>`;
        }
        b.style.transform = `translate(${Math.round(spot.x)}px,${Math.round(spot.y)}px) translate(-50%,-100%)`;
        b.style.opacity = '1';
        continue;
      }
      // Not exploring yet and not overhead: the intro covers the street, so no signs.
      b.hidden = true;
      setMeta(b, '');
    }
    relayout = remeasure;
    if (stems !== lastStems) {
      lastStems = stems;
      labelStems.innerHTML = stems;
    }
    nearest = Core.nearest(player);
    $('nearby-place').hidden =
      !entered || camera.mode === 'world' || !!camera.transition || nearest.distance > 6;
    if (nearest.distance <= 6) {
      $('nearby-company').textContent = nearest.place.company;
      $('nearby-title').textContent = nearest.place.name;
    }
    const degrees = ((((eye.yaw * 180) / Math.PI) % 360) + 360) % 360;
    $('city-heading').textContent = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][
      Math.round(degrees / 45) % 8
    ];
  }
  function tick(time) {
    const dt = Math.min(0.04, (time - (last || time)) / 1000);
    last = time;
    let moving = false;
    if (!pause() && !camera.transition) {
      let forward =
          (keys.has('w') || keys.has('arrowup') ? 1 : 0) -
          (keys.has('s') || keys.has('arrowdown') ? 1 : 0),
        side = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0);
      if (camera.mode === 'walk' && journey) {
        const next = journey.points[0],
          distance = Core.distance(player, next);
        if (distance < 0.18) {
          journey.points.shift();
          if (!journey.points.length) {
            targetYaw = Math.atan2(journey.place.x - player.x, player.z - journey.place.z);
            journey = null;
            vx = vz = 0;
          }
        } else {
          const angle = Math.atan2(next.x - player.x, player.z - next.z);
          targetYaw =
            player.yaw + Math.atan2(Math.sin(angle - player.yaw), Math.cos(angle - player.yaw));
          const step = Math.min(distance, dt * 5),
            blocked = movers(journey.stuck > 1.4);
          const moved = Core.slide(
            player,
            ((next.x - player.x) / distance) * step,
            ((next.z - player.z) / distance) * step,
            blocked,
          );
          journey.stuck = Core.distance(moved, player) < step * 0.3 ? journey.stuck + dt : 0;
          player.x = moved.x;
          player.z = moved.z;
          dirty = true;
          moving = true;
        }
        forward = 0;
        vx = vz = 0;
      }
      if (forward <= 0) sprint = false;
      targetYaw += ((keys.has('arrowright') ? 1 : 0) - (keys.has('arrowleft') ? 1 : 0)) * dt * 1.4;
      const active = camera.mode === 'world' ? camera.flight : player;
      const yawDelta = targetYaw - active.yaw,
        pitchDelta = targetPitch - active.pitch;
      // A captured mouse should feel direct, so it is barely smoothed; dragging glides a little more.
      const follow = reduced.matches
        ? 1
        : 1 - Math.exp((document.pointerLockElement === canvas ? -45 : -18) * dt);
      active.yaw += yawDelta * follow;
      active.pitch += pitchDelta * follow;
      if (camera.mode === 'world') {
        const up =
          (keys.has(' ') || keys.has('pageup') ? 1 : 0) -
          (keys.has('shift') || keys.has('c') || keys.has('pagedown') ? 1 : 0);
        moving = Camera.fly(camera, { forward, side, up, fast: sprint }, dt);
        // Flying down onto a street lands you there, as in creative mode.
        if (camera.touchdown) toggleFlight();
      } else {
        const f = Core.forward(player.yaw),
          length = Math.hypot(forward, side) || 1,
          speed = sprint ? 9 : keys.has('shift') ? 7.5 : 4.5,
          tx = ((f.x * forward + Math.cos(player.yaw) * side) / length) * speed,
          tz = ((f.z * forward + Math.sin(player.yaw) * side) / length) * speed;
        // Full control on the ground, a little less in the air.
        const a = 1 - Math.exp((air.lift > 0 ? -5 : -12) * dt);
        vx += (tx - vx) * a;
        vz += (tz - vz) * a;
        const next = Core.slide(player, vx * dt, vz * dt, movers());
        if (next.x === player.x && Math.abs(vx) > 0.5) vx *= 0.5;
        if (next.z === player.z && Math.abs(vz) > 0.5) vz *= 0.5;
        moving = moving || Math.hypot(next.x - player.x, next.z - player.z) > 0.00001;
        player.x = next.x;
        player.z = next.z;
        if (moving) walkTime += dt;
        groundY += (Core.groundAt(player.x, player.z) - groundY) * (1 - Math.exp(-10 * dt));
        // Hold Space to keep hopping. Gravity is a touch stronger than Earth's, so jumps feel snappy.
        if (keys.has(' ') && air.lift === 0 && air.v === 0) air.v = 6.4;
        if (air.lift > 0 || air.v > 0) {
          air.v = Math.max(-40, air.v - 22 * dt);
          air.lift += air.v * dt;
          if (air.lift <= 0) air.lift = air.v = 0;
          moving = true;
        }
        const bob = moving && !air.lift && !reduced.matches ? Math.sin(walkTime * 9) * 0.012 : 0;
        player.y = 1.45 + groundY + air.lift + bob;
      }
      dirty = dirty || moving || Math.abs(yawDelta) > 0.0001 || Math.abs(pitchDelta) > 0.0001;
    }
    if (camera.transition && !pause()) dirty = true;
    Camera.sample(camera, player, pause() ? 0 : dt);
    if (!pause() && !wildlifePaused) {
      CityWildlife.update(wildlife, dt, camera.eye);
      wildlifeClock += dt;
      if (wildlifeClock > 1 / 30) {
        wildlifeMesh = CityWildlife.mesh(wildlife);
        wildlifeClock = 0;
        dirty = true;
      }
    }
    if (!pause() && clock.running) {
      clock.hours = Sky.wrap(clock.hours + (dt * 24) / Sky.DAY_SECONDS);
      skyClock += dt;
      if (skyClock > 1 / 24) {
        skyClock = 0;
        applySky();
        dirty = true;
      }
    }
    if (dirty && renderer) {
      const matrix = renderer.draw(camera.eye, wildlifeMesh, camera.mode === 'world', sky);
      overlay(matrix);
      window.CityMap?.update();
      window.CityInspector?.update(matrix);
      // Signs that changed size this frame are placed again on the next one.
      dirty = relayout;
    }
    if (!document.hidden) frame = requestAnimationFrame(tick);
  }
  Camera.setMode(camera, 'world', player, innerWidth / innerHeight, true);
  targetYaw = camera.flight.yaw;
  targetPitch = camera.flight.pitch;
  modeUI();
  try {
    renderer = new window.CityRenderer(canvas);
    frame = requestAnimationFrame(tick);
  } catch (error) {
    $('city-fallback').hidden = true;
    $('enter-field').innerHTML = 'Open every chapter <span aria-hidden="true">↗</span>';
    $('enter-field').onclick = () => Portfolio.modal('atlas');
    console.warn('City renderer unavailable:', error.message);
  }
  addEventListener('resize', () => {
    renderer?.resize();
    dirty = true;
  });
  document.addEventListener('visibilitychange', () => {
    stop();
    last = 0;
    if (!document.hidden) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tick);
    }
  });
  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    cancelAnimationFrame(frame);
    $('city-fallback').hidden = false;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    try {
      renderer = new window.CityRenderer(canvas);
      $('city-fallback').hidden = true;
      dirty = true;
      last = 0;
      frame = requestAnimationFrame(tick);
    } catch {
      $('city-fallback').hidden = false;
    }
  });
  window.CityApp = {
    player,
    keys,
    visited,
    enter,
    openPlace,
    setMode,
    toggleFlight,
    lockMouse,
    get mode() {
      return camera.mode;
    },
    get eye() {
      return camera.eye;
    },
    get nearest() {
      return nearest;
    },
    get paused() {
      return pause();
    },
    look(yaw, pitch) {
      targetYaw = yaw;
      targetPitch = pitch;
      dirty = true;
    },
    invalidate() {
      dirty = true;
    },
    travel(place) {
      if (camera.mode === 'world') setMode('walk');
      enter();
      unlock();
      const points = Core.route(player, place);
      journey = points.length ? { place, points, stuck: 0 } : null;
      vx = vz = 0;
      dirty = true;
      return !!journey;
    },
    get journey() {
      return journey;
    },
    clock,
    skipHour,
    camera,
    wildlife,
    get sky() {
      return sky;
    },
    stop,
    get renderer() {
      return renderer;
    },
  };
})();
