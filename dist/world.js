/* A small, dependency-free camera for an illustrated body of work. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const data = window.CAREER;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const places = [
    {id:'boring', role:0, x:1055,y:596,label:'The Boring Company',sub:'SOFTWARE × PHYSICAL WORLD'},
    {id:'hyphenate',role:1,x:1030,y:325,label:'Hyphenate',sub:'FORMERLY MAXIMOR AI'},
    {id:'zaap',role:2,x:1130,y:215,label:'Zaap AI',sub:'A PRODUCT OF MY OWN'},
    {id:'parasol',role:3,x:1030,y:780,label:'Parasol Lab',sub:'PARALLEL COMPUTING'},
    {id:'teaching',role:4,x:725,y:665,label:'Teaching at UIUC',sub:'MAKING REASONING VISIBLE',left:true},
    {id:'zeus',role:5,x:665,y:840,label:'Zeus Learning',sub:'PRODUCT × AI EVALUATION',left:true},
    {id:'apac',role:6,x:920,y:940,label:'APAC Financial',sub:'WHERE THE ROOTS START'},
    {id:'rare',role:7,x:600,y:330,label:'Rare Billions',sub:'SPACES YOU CAN EXPLORE',left:true},
    {id:'projects',x:730,y:155,label:'The workbench',sub:'FIVE PUBLIC EXPERIMENTS',left:true,kind:'project'},
    {id:'about',x:870,y:490,label:'The common thread',sub:'A LITTLE ABOUT ME',kind:'about'},
    {id:'beyond',x:500,y:470,label:'Still growing',sub:'RESEARCH & OPEN QUESTIONS',left:true,kind:'future'}
  ];
  const visited = new Set();
  const camera = {x:0,y:0,scale:1};
  const viewport = $('viewport'), world = $('world'), story = $('story');
  let selected = -1, explored = false, animation = 0, sound = null, soundOn = false;
  let view = 'whole';
  const fit = () => Math.min(innerWidth / 1600, (innerHeight - 160) / 1067);
  function draw() {
    world.style.transform = `translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`;
    world.style.setProperty('--pin-scale', 1 / camera.scale);
  }
  function constrain(c) {
    c.scale = Math.max(Math.max(.22,fit()*.8),Math.min(2.5,c.scale));
    c.x = Math.max(80-1600*c.scale,Math.min(innerWidth-80,c.x));
    c.y = Math.max(100-1067*c.scale,Math.min(innerHeight-150,c.y));
    return c;
  }
  function move(target,animate=true) {
    cancelAnimationFrame(animation); constrain(target);
    const start = {...camera}, time = performance.now();
    function frame(now) {
      const t = !animate || reduced.matches ? 1 : Math.min(1,(now-time)/850);
      const ease = 1-Math.pow(1-t,3);
      for(const key of ['x','y','scale']) camera[key]=start[key]+(target[key]-start[key])*ease;
      draw(); if(t<1) animation=requestAnimationFrame(frame);
    }
    animation=requestAnimationFrame(frame);
  }
  function sceneView(name,animate=true) {
    view=name;
    const mobile=innerWidth<761;
    const base=mobile ? Math.max(.55,(innerHeight-160)/1067) : fit();
    const scale=base*(name==='whole'?1:1.65);
    const centerY=name==='canopy'?300:name==='roots'?775:520;
    move({x:innerWidth/2-850*scale,y:innerHeight/2-centerY*scale,scale},animate);
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===name));
  }
  function begin() {
    if(explored)return;
    explored=true;document.body.classList.add('exploring');$('invitation').inert=true;
    $('announcement').textContent='The tree is yours to explore. Open the index to browse all eleven places.';
  }
  function chime(index) {
    if(!soundOn||!sound)return;
    const osc=sound.createOscillator(),gain=sound.createGain();
    osc.type='sine';osc.frequency.value=[261.63,329.63,392,440,523.25][index%5];
    gain.gain.setValueAtTime(0,sound.currentTime);gain.gain.linearRampToValueAtTime(.045,sound.currentTime+.03);
    gain.gain.exponentialRampToValueAtTime(.0001,sound.currentTime+1.3);
    osc.connect(gain);gain.connect(sound.destination);osc.start();osc.stop(sound.currentTime+1.4);
  }
  function paragraph(text,cls='body-copy'){return `<p class="${cls}">${esc(text)}</p>`;}
  function openStory(index) {
    begin();selected=index;const p=places[index],r=data.roles[p.role];
    visited.add(p.id);document.querySelectorAll('.place').forEach((b,i)=>{b.classList.toggle('is-active',i===index);b.classList.toggle('visited',visited.has(places[i].id));});
    document.querySelectorAll('.connection').forEach((path,i)=>path.classList.toggle('active',i===index));
    $('discovery-count').textContent=`${visited.size} OF ${places.length} PLACES DISCOVERED`;
    $('discovery-hint').textContent=visited.size===places.length?'Every chapter visited. The next one is unwritten.':'Follow another light. See where it leads.';
    $('story-number').textContent=String(index+1).padStart(2,'0');
    $('story-category').textContent=r?'A PROFESSIONAL CHAPTER':p.kind==='project'?'THE WORKBENCH':p.kind==='about'?'THE COMMON THREAD':'STILL GROWING';
    $('story-time').textContent=r?`${r.time} / ${r.place}`:'CS + ECONOMICS / UIUC';
    $('story-title').textContent=r?r.company:p.label;
    $('story-role').textContent=r?`${r.role}${r.former?' · Formerly Maximor AI':''}`:p.sub;
    let html='';
    if(r) {
      html=paragraph(r.theme,'story-content-lead')+paragraph(r.body)+`<h3>WHAT I WORKED ON</h3><ul class="contributions">${r.items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul><p class="tools-used">${esc(r.tech)}</p>`;
      if(r.case)html+=`<a class="chapter-link" href="field-notes.html#work">${esc(r.link)} ↗</a>`;
    } else if(p.id==='projects') {
      html=paragraph('Small experiments. Real questions.','story-content-lead')+paragraph('The public side of my work: systems I built to understand what happens beneath the interface.')+data.projects.map(project=>`<a class="project-card" href="${esc(project.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(project.title)}</strong><p>${esc(project.body)}</p><span>EXPLORE THE REPOSITORY ↗</span></a>`).join('');
    } else if(p.id==='about') {
      html=paragraph('I like finding the connection between things.','story-content-lead')+paragraph('I’m Siddhant, a Computer Science + Economics student at the University of Illinois. I build across AI, financial data, and the physical world.')+paragraph('My work has taken me from Mumbai to Urbana-Champaign, New York, and Texas. The settings change, but I keep coming back to the same questions: how does this system behave, where does it break, and what would make it useful to someone?')+paragraph('This tree is a map of those questions. Its roots hold the foundations; its branches hold the things I’m building.')+'<a class="chapter-link" href="field-notes.html#about">Read the complete field guide ↗</a>';
    } else {
      html=paragraph('Some branches are still taking shape.','story-content-lead')+data.extras.map(e=>`<h3>${esc(e.label)}</h3>`+paragraph(e.title,'story-content-lead')+paragraph(e.body)).join('');
    }
    $('story-content').innerHTML=html;
    $('story-position').textContent=`CHAPTER ${String(index+1).padStart(2,'0')} / ${places.length}`;
    $('story-scroll').scrollTop=0;
    document.querySelectorAll('dialog[open]').forEach(d=>{if(d!==story)d.close();});
    if(!story.open)story.showModal();document.body.classList.add('panel-open');
    const scale=Math.max(camera.scale,innerWidth<761?.8:.75);
    const area=innerWidth<761?innerWidth:innerWidth-Math.min(500,innerWidth*.45);
    move({scale,x:area*.5-p.x*scale,y:innerHeight*(innerWidth<761?.15:.48)-p.y*scale});
    chime(index);$('announcement').textContent=`Opened ${p.label}. ${visited.size} places discovered.`;
    window.dispatchEvent(new CustomEvent('portfolio:story',{detail:{id:p.id,index}}));
  }
  places.forEach((p,index)=>{
    const b=document.createElement('button');b.className=`place ${p.left?'left ':''}${p.kind||''}`;
    b.style.left=p.x+'px';b.style.top=p.y+'px';b.style.setProperty('--delay',`${index*-.31}s`);
    b.setAttribute('aria-label',`Explore ${p.label}: ${p.sub.toLowerCase()}`);
    b.innerHTML=`<span class="place-ring" aria-hidden="true"></span><span class="place-core" aria-hidden="true"></span><span class="place-label">${esc(p.label)}<small>${esc(p.sub)}</small></span>`;
    b.addEventListener('click',()=>{if(!suppressClick)openStory(index);});$('places').append(b);
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.classList.add('connection');path.setAttribute('d',`M870 490 Q${(870+p.x)/2} ${p.y<490?430:590} ${p.x} ${p.y}`);$('connections').append(path);
  });
  $('index-entries').innerHTML='<h3 class="index-group-title">FOLLOW A LIGHT</h3><div class="index-grid">'+places.map((p,i)=>`<button class="index-entry" data-chapter="${i}"><span>${String(i+1).padStart(2,'0')}</span><span><strong>${esc(p.label)}</strong><small>${esc(data.roles[p.role]?.role||p.sub.toLowerCase())}</small></span></button>`).join('')+'</div><button class="text-button" id="index-contact">Say hello ↗</button>';
  $('index-entries').addEventListener('click',e=>{const b=e.target.closest('[data-chapter]');if(b)openStory(Number(b.dataset.chapter));});
  function modal(id){document.querySelectorAll('dialog[open]').forEach(d=>d.close());$(id).showModal();}
  $('open-index').onclick=()=>modal('atlas');$('open-contact').onclick=()=>modal('hello');$('index-contact').onclick=()=>modal('hello');$('help-toggle').onclick=()=>modal('help');
  document.querySelectorAll('dialog').forEach(d=>{
    d.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>d.close());
    d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.target===d&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))d.close();});
    d.addEventListener('close',()=>{if(d===story){document.body.classList.remove('panel-open');document.querySelector('.place.is-active')?.focus({preventScroll:true});}});
  });
  $('begin').onclick=()=>{begin();viewport.focus();};
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{begin();sceneView(b.dataset.view);});
  function zoom(factor,x=innerWidth/2,y=innerHeight/2){begin();const scale=Math.max(Math.max(.22,fit()*.8),Math.min(2.5,camera.scale*factor));move({scale,x:x-(x-camera.x)*scale/camera.scale,y:y-(y-camera.y)*scale/camera.scale},false);}
  $('zoom-in').onclick=()=>zoom(1.25);$('zoom-out').onclick=()=>zoom(.8);$('recenter').onclick=()=>sceneView('whole');
  viewport.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(-Math.max(-100,Math.min(100,e.deltaY))*.002),e.clientX,e.clientY);},{passive:false});
  const pointers=new Map();let suppressClick=false,origin=null;
  viewport.addEventListener('pointerdown',e=>{if(e.button&&e.pointerType==='mouse')return;cancelAnimationFrame(animation);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});origin={x:e.clientX,y:e.clientY};if(!e.target.closest('button'))viewport.setPointerCapture(e.pointerId);});
  viewport.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId))return;
    const old=pointers.get(e.pointerId),other=[...pointers.entries()].find(([id])=>id!==e.pointerId)?.[1];
    if(origin&&Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>5){suppressClick=true;begin();viewport.classList.add('dragging');}
    if(other){const before=Math.hypot(old.x-other.x,old.y-other.y),after=Math.hypot(e.clientX-other.x,e.clientY-other.y);if(before>0)zoom(after/before,(other.x+e.clientX)/2,(other.y+e.clientY)/2);}
    else if(suppressClick){camera.x+=e.clientX-old.x;camera.y+=e.clientY-old.y;constrain(camera);draw();}
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  });
  function release(e){pointers.delete(e.pointerId);if(!pointers.size){viewport.classList.remove('dragging');origin=null;setTimeout(()=>suppressClick=false,0);}}
  window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);viewport.addEventListener('lostpointercapture',release);
  viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;const delta={ArrowLeft:[70,0],ArrowRight:[-70,0],ArrowUp:[0,70],ArrowDown:[0,-70]}[e.key];if(delta){e.preventDefault();begin();move({...camera,x:camera.x+delta[0],y:camera.y+delta[1]});}else if(['+','=','-','0'].includes(e.key)){e.preventDefault();if(e.key==='0')sceneView('whole');else zoom(e.key==='-'?.8:1.25);}});
  $('sound-toggle').onclick=async()=>{try{if(!sound)sound=new(window.AudioContext||window.webkitAudioContext)();await sound.resume();soundOn=!soundOn;$('sound-toggle').setAttribute('aria-pressed',soundOn);$('sound-toggle').setAttribute('aria-label',soundOn?'Disable discovery sounds':'Enable discovery sounds');$('sound-toggle').querySelector('span').textContent=soundOn?'Sound on':'Sound off';if(soundOn)chime(0);}catch{$('announcement').textContent='Sound is unavailable in this browser.';}};
  // The first complete scene includes a simple tour; the guided trail can extend it.
  $('next-story').onclick=()=>openStory((selected+1)%places.length);
  $('tour-start').onclick=$('help-tour').onclick=()=>openStory(9);
  $('end-trail').onclick=()=>{$('trail-progress').hidden=true;};
  const art=$('tree-art');if(art.complete&&art.naturalWidth)document.body.classList.add('art-ready');else art.addEventListener('load',()=>document.body.classList.add('art-ready'));
  art.addEventListener('error',()=>{$('announcement').textContent='The illustration could not load. All stories remain available in the index.';});
  sceneView('whole',false);addEventListener('resize',()=>sceneView(view,false));
  window.Portfolio={openStory,places,begin,sceneView,esc,move,chime};
})();
