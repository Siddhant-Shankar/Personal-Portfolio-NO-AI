/* Career stories, the index, and the contact and help dialogs. Shared by the city and its guided tour. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value =>
    String(value).replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const data = window.CAREER;
  // Order matters: the city's landmarks open these chapters by id.
  const places = [
    { id: 'boring', role: 0, label: 'The Boring Company', sub: 'SOFTWARE × PHYSICAL WORLD' },
    { id: 'hyphenate', role: 1, label: 'Hyphenate', sub: 'FORMERLY MAXIMOR AI' },
    { id: 'zaap', role: 2, label: 'Zaap AI', sub: 'A PRODUCT OF MY OWN' },
    { id: 'parasol', role: 3, label: 'Parasol Lab', sub: 'PARALLEL COMPUTING' },
    {
      id: 'teaching',
      role: 4,
      label: 'Teaching at UIUC',
      sub: 'MAKING REASONING VISIBLE',
      left: true,
    },
    { id: 'zeus', role: 5, label: 'Zeus Learning', sub: 'PRODUCT × AI EVALUATION', left: true },
    { id: 'apac', role: 6, label: 'APAC Financial', sub: 'WHERE THE ROOTS START' },
    { id: 'rare', role: 7, label: 'Rare Billions', sub: 'SPACES YOU CAN EXPLORE', left: true },
    {
      id: 'projects',
      label: 'The workbench',
      sub: 'SIX PUBLIC PROJECTS',
      left: true,
      kind: 'project',
    },
    { id: 'about', label: 'The common thread', sub: 'A LITTLE ABOUT ME', kind: 'about' },
    {
      id: 'beyond',
      label: 'Still growing',
      sub: 'RESEARCH & OPEN QUESTIONS',
      left: true,
      kind: 'future',
    },
  ];
  // The three written case studies in notes.html, with their verified outcomes.
  const CASES = [
    {
      id: 'flux',
      where: 'HYPHENATE',
      title: 'From one LLM call to an enterprise workflow',
      result: '3 enterprise customers in three months',
    },
    {
      id: 'data',
      where: 'HYPHENATE',
      title: 'Choosing which financial record survives',
      result: 'Deterministic deduplication across systems',
    },
    {
      id: 'signal',
      where: 'THE BORING COMPANY',
      title: 'The machine had a signal. The app didn’t.',
      result: 'Traced and fixed in my first week',
    },
  ];
  const visited = new Set(),
    story = $('story');
  let selected = -1;
  function paragraph(text, cls = 'body-copy') {
    return `<p class="${cls}">${esc(text)}</p>`;
  }
  // Education and skills, straight from the résumé (career-data.js).
  function educationAndSkills() {
    const e = data.education;
    return (
      `<h3>EDUCATION</h3><p class="body-copy"><strong>${esc(e.school)}</strong><br>${esc(e.degree)}<br>${esc(e.graduation)} · GPA ${esc(e.gpa)}</p><p class="tools-used">${esc(e.coursework)}</p>` +
      `<h3>TECHNICAL SKILLS</h3><dl class="skill-list">${data.skills.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`
    );
  }
  function openStory(index) {
    selected = index;
    const p = places[index],
      r = data.roles[p.role];
    visited.add(p.id);
    $('story-number').textContent = String(index + 1).padStart(2, '0');
    $('story-category').textContent = r
      ? 'A PROFESSIONAL CHAPTER'
      : p.kind === 'project'
        ? 'THE WORKBENCH'
        : p.kind === 'about'
          ? 'THE COMMON THREAD'
          : 'STILL GROWING';
    $('story-time').textContent = r ? `${r.time} / ${r.place}` : 'CS + ECONOMICS / UIUC';
    $('story-title').textContent = r ? r.company : p.label;
    $('story-role').textContent = r
      ? `${r.role}${r.former ? ' · Formerly Maximor AI' : ''}`
      : p.sub;
    let html = '';
    if (r) {
      html =
        paragraph(r.theme, 'story-content-lead') +
        paragraph(r.body) +
        `<h3>WHAT I WORKED ON</h3><ul class="contributions">${r.items.map(item => `<li>${esc(item)}</li>`).join('')}</ul><p class="tools-used">${esc(r.tech)}</p>`;
      if (r.case)
        html += `<a class="chapter-link" href="notes.html#case-${esc(r.case)}">Read the case study: ${esc(r.link.toLowerCase())} ↗</a>`;
    } else if (p.id === 'projects') {
      html =
        paragraph('Small experiments. Real questions.', 'story-content-lead') +
        paragraph(
          'The public side of my work: systems I built to understand what happens beneath the interface.',
        ) +
        paragraph(
          'In the city, each one is on show around the makers’ warehouse: a drone circling the roof, an F1 car on the rooftop next door, a sketch easel by the entrance, and two working walls. Click any of them.',
        ) +
        data.projects
          .map(
            project =>
              `<a class="project-card" href="${esc(project.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(project.title)}</strong><p>${esc(project.body)}</p><span>EXPLORE THE REPOSITORY ↗</span></a>`,
          )
          .join('');
    } else if (p.id === 'about') {
      html =
        paragraph('I like finding the connection between things.', 'story-content-lead') +
        paragraph(
          'I’m Siddhant, a Computer Science + Economics student at the University of Illinois, with a minor in Mathematics. I build across AI, financial data, and the physical world.',
        ) +
        paragraph(
          'My work has taken me from Mumbai to Urbana-Champaign, New York, and Texas. The settings change, but I keep coming back to the same questions: how does this system behave, where does it break, and what would make it useful to someone?',
        ) +
        paragraph(
          'This city is a map of those questions. Each building holds a chapter, and the streets between them are the things that connect it all.',
        ) +
        educationAndSkills() +
        '<a class="chapter-link" href="notes.html#about">Read the complete field guide ↗</a>';
    } else {
      html =
        paragraph('Some branches are still taking shape.', 'story-content-lead') +
        data.extras
          .map(
            e =>
              `<h3>${esc(e.label)}</h3>` +
              paragraph(e.title, 'story-content-lead') +
              paragraph(e.body),
          )
          .join('');
    }
    $('story-content').innerHTML = html;
    $('story-position').textContent =
      `CHAPTER ${String(index + 1).padStart(2, '0')} / ${places.length}`;
    $('story-scroll').scrollTop = 0;
    document.querySelectorAll('dialog[open]').forEach(d => {
      if (d !== story) d.close();
    });
    if (!story.open) story.showModal();
    document.body.classList.add('panel-open');
    $('announcement').textContent = `Opened ${p.label}. ${visited.size} places discovered.`;
    window.dispatchEvent(new CustomEvent('portfolio:story', { detail: { id: p.id, index } }));
  }
  $('index-entries').innerHTML =
    '<h3 class="index-group-title">SELECTED WORK</h3><div class="case-links">' +
    CASES.map(
      c =>
        `<a class="case-link" href="notes.html#case-${c.id}"><small>${esc(c.where)}</small><strong>${esc(c.title)}</strong><span>${esc(c.result)}</span></a>`,
    ).join('') +
    '</div><h3 class="index-group-title">EVERY CHAPTER</h3><div class="index-grid">' +
    places
      .map(
        (p, i) =>
          `<button class="index-entry" data-chapter="${i}"><span>${String(i + 1).padStart(2, '0')}</span><span><strong>${esc(p.label)}</strong><small>${esc(data.roles[p.role]?.role || p.sub.toLowerCase())}</small></span></button>`,
      )
      .join('') +
    '</div><button class="text-button" id="tour-start">Take the guided story tour ⊹</button><button class="text-button" id="index-contact">Say hello ↗</button>';
  $('index-entries').addEventListener('click', e => {
    const b = e.target.closest('[data-chapter]');
    if (b) openStory(Number(b.dataset.chapter));
  });
  function modal(id) {
    document.querySelectorAll('dialog[open]').forEach(d => d.close());
    $(id).showModal();
  }
  $('open-index').onclick = () => modal('atlas');
  $('open-contact').onclick = () => modal('hello');
  $('index-contact').onclick = () => modal('hello');
  document.querySelectorAll('dialog').forEach(d => {
    d.querySelectorAll('[data-close]').forEach(b => (b.onclick = () => d.close()));
    d.addEventListener('click', e => {
      const r = d.getBoundingClientRect();
      if (
        e.target === d &&
        (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
      )
        d.close();
    });
    d.addEventListener('close', () => {
      if (d === story) document.body.classList.remove('panel-open');
    });
  });
  $('next-story').onclick = () => openStory((selected + 1) % places.length);
  window.Portfolio = { openStory, places, esc, modal, begin() {}, sceneView() {} };
})();
