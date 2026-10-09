/* An illustrated atlas, built from the same coordinates and paths as the 3D field. */
(() => {
  'use strict';
  const Core = CityCore,
    game = CityApp,
    $ = id => document.getElementById(id),
    esc = Portfolio.esc;
  let selected = Core.landmarks[1];
  const dialog = document.createElement('dialog');
  dialog.id = 'city-map';
  dialog.setAttribute('aria-labelledby', 'map-title');
  dialog.innerHTML = `<header class="map-header"><div><span class="map-eyebrow">CITY GUIDE / NO. 01</span><h2 id="map-title">Every block, a story.</h2></div><button id="map-close" aria-label="Close city map">×</button></header><div class="map-layout"><div class="map-sheet"><span class="map-north">N<br>↑</span><svg id="map-drawing" viewBox="-65 -65 130 130" aria-hidden="true"><defs><pattern id="map-hatch" width="3" height="3" patternUnits="userSpaceOnUse"><path d="M0 3L3 0" stroke="#7f846c" stroke-width=".12" opacity=".4"/></pattern></defs><path d="M-58-56Q-15-66 46-58L61-33Q67 0 56 57L-34 61Q-62 59-61 24Z" fill="url(#map-hatch)" stroke="#78826c" stroke-width=".3"/><g id="map-paths"></g><path id="map-route" fill="none" stroke="#bd602f" stroke-width=".8" stroke-dasharray="1.4 1.2"/><path id="map-player" d="M0-1.8L1.3 1.5 0 .7-1.3 1.5Z" fill="#b24b2d" stroke="#f3ead2" stroke-width=".4"/></svg><div id="map-markers"></div><span class="map-caption">THE CITY · A PERSONAL ATLAS<br>11 chapters. A city to explore.</span></div><aside class="map-notes"><span class="map-eyebrow" id="map-number"></span><h3 id="map-company"></h3><p id="map-place"></p><p class="map-description">Choose a place to walk there, or open its chapter right away.</p><button id="map-walk">Walk here <span>↗</span></button><button id="map-read">Read the chapter <span>→</span></button><label for="map-destination">All destinations</label><select id="map-destination">${Core.landmarks.map(p => `<option value="${p.id}">${esc(p.company)}</option>`).join('')}</select><p class="map-legend"><i></i> Your position & direction<br><b>○</b> A chapter waiting to be read<br><b>●</b> A chapter you’ve opened</p><a href="notes.html">The complete field guide ↗</a></aside></div>`;
  document.body.append(dialog);
  const controls = $('city-controls'),
    mapButton = document.createElement('button');
  mapButton.id = 'city-map-toggle';
  mapButton.innerHTML = '<span aria-hidden="true">⌁</span> City map <kbd>M</kbd>';
  mapButton.onclick = open;
  controls.prepend(mapButton);
  const travel = document.createElement('button');
  travel.id = 'city-travel';
  travel.hidden = true;
  travel.onclick = () => {
    game.stop();
    update();
  };
  $('city-shell').append(travel);
  let roads =
    '<rect x="53" y="-60" width="8" height="120" fill="#aec1b8" opacity=".7"/><rect x="-21" y="3" width="18" height="18" rx="1" fill="#b7c09b"/>';
  for (const n of CityLayout.streets) {
    roads += `<path d="M${n} -54V54M-54 ${n}H54" stroke="#a79f88" stroke-width="5.8" fill="none"/><path d="M${n} -54V54M-54 ${n}H54" stroke="#f5edda" stroke-width="4.8" fill="none"/>`;
  }
  for (const p of CityLayout.infill)
    roads += `<rect x="${p.x - 4.5}" y="${p.z - 4.5}" width="9" height="9" fill="#c4bfaa" stroke="#949881" stroke-width=".25"/>`;
  $('map-paths').innerHTML = roads;
  const icons = {
    welcome: 'M-2 2V-1H2V2M-3-1L0-3 3-1',
    tunnel: 'M-3 2V-1L-1-3H1L3-1V2M-1 2V0H1V2',
    towers: 'M-3 2V-2H-1V2M0 2V-4H2V2',
    observatory: 'M-3 0Q-3-5 0-5T3 0ZM-2 0V3H2V0',
    classroom: 'M-3 3V-2H3V3ZM-4-2L0-5 4-2M-1 3V0H1V3',
    garden: 'M-3 3V-2H3V3ZM-3-2L-2-4 0-2 2-4 3-2',
  };
  for (const p of Core.landmarks) {
    const b = document.createElement('button');
    b.className = 'map-marker';
    b.style.left = `${(p.x + 65) / 1.3}%`;
    b.style.top = `${(p.z + 65) / 1.3}%`;
    b.dataset.place = p.id;
    b.title = p.company;
    b.setAttribute('aria-label', p.company);
    b.innerHTML = `<svg viewBox="-5 -6 10 12" aria-hidden="true"><path d="${icons[p.kind] || 'M-3 3V-1L0-4 3-1V3ZM-3-1H3M-1 3V1H1V3'}"/></svg><span>${String(p.index + 1).padStart(2, '0')}</span>`;
    b.onclick = () => select(p, false);
    $('map-markers').append(b);
  }
  function select(place, show = true) {
    selected = place;
    $('map-number').textContent =
      `PLACE ${String(place.index + 1).padStart(2, '0')} / ${game.visited.has(place.id) ? 'CHAPTER OPENED' : 'UNEXPLORED'}`;
    $('map-company').textContent = place.company;
    $('map-place').textContent = place.name;
    $('map-destination').value = place.id;
    dialog
      .querySelectorAll('.map-marker')
      .forEach(b => b.setAttribute('aria-pressed', String(b.dataset.place === place.id)));
    const path = [game.player, ...Core.route(game.player, place)];
    $('map-route').setAttribute('d', path.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.z}`).join(' '));
    if (show) open();
  }
  function open() {
    if (document.pointerLockElement) document.exitPointerLock();
    game.stop();
    select(selected, false);
    if (!dialog.open) dialog.showModal();
    update();
  }
  function update() {
    travel.hidden = !game.journey;
    if (game.journey) travel.textContent = `Walking to ${game.journey.place.company} · Stop ×`;
    $('map-player').setAttribute(
      'transform',
      `translate(${game.player.x} ${game.player.z}) rotate(${(game.player.yaw * 180) / Math.PI})`,
    );
    dialog
      .querySelectorAll('.map-marker')
      .forEach(b => b.classList.toggle('visited', game.visited.has(b.dataset.place)));
  }
  $('map-close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    $('city-canvas').focus();
    game.invalidate();
  });
  $('map-destination').onchange = e =>
    select(
      Core.landmarks.find(p => p.id === e.target.value),
      false,
    );
  $('map-walk').onclick = () => {
    dialog.close();
    game.travel(selected);
    update();
  };
  $('map-read').onclick = () => {
    dialog.close();
    game.openPlace(selected);
  };
  // Large press-and-hold targets plus drag-to-look, without pointer lock on mobile.
  const pad = document.createElement('div');
  pad.id = 'city-touch';
  pad.setAttribute('aria-label', 'Touch walking controls');
  pad.innerHTML =
    '<button data-key="w" aria-label="Walk forward">↑</button><button data-key="a" aria-label="Step left">←</button><button data-key="s" aria-label="Walk backward">↓</button><button data-key="d" aria-label="Step right">→</button><button data-key=" " aria-label="Jump, or rise while flying">⤒</button><button data-fly aria-label="Take off or land">✈</button>';
  $('city-shell').append(pad);
  pad.querySelector('[data-fly]').onclick = () => game.toggleFlight();
  pad.querySelectorAll('button[data-key]').forEach(b => {
    b.onpointerdown = e => {
      e.preventDefault();
      game.stop();
      game.enter();
      game.keys.add(b.dataset.key);
      b.setPointerCapture(e.pointerId);
    };
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
      b.addEventListener(event, () => game.keys.delete(b.dataset.key));
  });
  window.CityMap = { open, select, update };
  select(selected, false);
})();
