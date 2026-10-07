/* A fox, a branching journey, and the work between the destinations. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),api=window.Portfolio,M=window.TrailModel,Motion=window.TrailMotion;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let state=M.create(),active=false,busy=false,hopFrame=0,calm=reduced.matches,clock=2200,lastTick=performance.now();
  const nodes=new Map(),edges=[];
  let cameraFrame=0,cameraLast=0,eyeView=false,layout={x:innerWidth/2,y:innerHeight/2,scale:1};
  const subject={x:920,y:940},look={x:0,y:-45},chase={x:920,y:895,vx:0,vy:0,scale:1,vs:0};
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.id='trail-routes';svg.setAttribute('viewBox','0 0 1600 1067');svg.setAttribute('aria-hidden','true');$('world').append(svg);
  M.links.forEach(([a,b],i)=>{const n=M.byId[a],t=M.byId[b];const p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',`M${n.x} ${n.y} Q${(n.x+t.x)/2} ${(n.y+t.y)/2-15} ${t.x} ${t.y}`);p.classList.add('trail-edge');svg.append(p);edges.push({a,b,p,i});if(M.wind(a,b,0).windy)p.classList.add('windy');});
  const layer=document.createElement('div');layer.id='trail-stops';$('world').append(layer);
  M.nodes.forEach(n=>{const b=document.createElement('button');b.className='trail-stop';b.dataset.stop=n.id;b.style.left=n.x+'px';b.style.top=n.y+'px';b.setAttribute('aria-label',`Hop to ${n.label}`);b.innerHTML=`<span class="stop-stone"></span>${n.firefly?'<span class="stop-firefly" aria-hidden="true">✧</span>':''}<span class="stop-name">${api.esc(n.label)}</span>`;b.onclick=()=>attempt(n.id);layer.append(b);nodes.set(n.id,b);});
  const fox=document.createElement('div');fox.id='fox';fox.setAttribute('aria-hidden','true');
  fox.innerHTML='<div class="fox-shadow"></div><div class="fox-body"><svg viewBox="0 0 100 100"><path d="m34 72 1 15h12l3-15m14 0 1 15h12l-4-18" fill="#44322d"/><ellipse cx="55" cy="61" rx="22" ry="24" fill="#d48c49"/><path d="M36 48q19-13 40 0l-4 12q-16-12-33 0Z" fill="#f4d7a6"/><path d="m34 41-6-27 20 12h15l20-12-6 28-21 15Z" fill="#e5a15b"/><path d="m33 20 4 17 8-8m33-9-5 17-8-8" fill="#503932"/><path d="M44 40q11 9 25 0l-6 10H50Z" fill="#ca7d3e"/><g class="fox-tail"><path d="M53 62C83 62 88 83 66 96 44 100 35 83 48 77c-1 12 15 10 16 3Z" fill="#c77b3c"/><path d="M66 96c-11 2-19-1-23-7l8-10c1 9 12 8 13 1 5 2 7 8 2 16" fill="#f7e5bf"/></g></svg></div>';

  $('world').append(fox);
  const hud=document.createElement('section');hud.id='game-hud';hud.setAttribute('aria-label','Game progress');hud.innerHTML='<div class="game-topline"><span class="eyebrow">THE LONG WAY UP</span><button id="leave-game">Browse freely ↗</button></div><div class="firefly-counter"><span id="game-fireflies">✧ ✧ ✧</span><span id="game-score">0 / 3 FIREFLIES</span></div><p id="game-objective">Find three fireflies. Bring them to the crown.</p><button id="calm-mode" aria-pressed="false">Wind crossings: on</button><div class="game-meter"><span id="game-height"></span></div>';$('experience').append(hud);
  const dock=document.createElement('section');dock.id='game-dock';dock.setAttribute('aria-label','Current place and available routes');dock.innerHTML='<div class="arrival-copy"><span class="eyebrow" id="game-region">THE ROOTS</span><h2 id="game-location"></h2><p id="game-message" role="status"></p></div><div id="route-choices" aria-label="Connected paths"></div><div class="game-dock-footer"><button id="read-camp">Read this chapter <kbd>E</kbd></button><button id="follow-fox">Center view ⌖</button><button id="fox-view" aria-pressed="false">Fox-eye view</button><button id="restart-game">Start over</button></div>';$('experience').append(dock);
  const finish=document.createElement('dialog');finish.id='trail-finish';finish.className='small-modal';finish.setAttribute('aria-labelledby','finish-title');finish.innerHTML='<span class="finish-fireflies" aria-hidden="true">✦ ✦ ✦</span><span class="eyebrow">YOU BROUGHT THE LIGHT HOME.</span><h2 id="finish-title">Different branches.<br><em>The same curiosity.</em></h2><p>Research. Systems. Products. Those are the connections running through my work.</p><p id="finish-stats"></p><div class="finish-actions"><button id="finish-explore">Keep exploring</button><button id="finish-contact">Build the next branch together ↗</button></div>';document.body.append(finish);
  $('finish-explore').onclick=()=>finish.close();$('finish-contact').onclick=()=>{finish.close();$('open-contact').click();};
  finish.addEventListener('close',()=>{follow();$('viewport').focus({preventScroll:true});});
  const badge=document.createElement('button');badge.id='resume-game';badge.textContent='Play the fox trail ↗';badge.onclick=()=>start();$('experience').append(badge);
  function say(message){$('game-message').textContent=message;$('announcement').textContent=message;}
  function foxAt(n){subject.x=n.x;subject.y=n.y;fox.style.setProperty('--fox-x',n.x+'px');fox.style.setProperty('--fox-y',n.y+'px');}
  function cameraTick(now){
    if(!active)return;
    const dt=Math.min(.05,Math.max(0,(now-(cameraLast||now))/1000));cameraLast=now;
    const tx=subject.x+look.x,ty=subject.y+look.y;
    if(reduced.matches){chase.x=tx;chase.y=ty;chase.scale=layout.scale;chase.vx=chase.vy=chase.vs=0;}
    else {let next=Motion.damp(chase.x,chase.vx,tx,dt);chase.x=next.value;chase.vx=next.velocity;next=Motion.damp(chase.y,chase.vy,ty,dt);chase.y=next.value;chase.vy=next.velocity;next=Motion.damp(chase.scale,chase.vs,layout.scale,dt,7);chase.scale=next.value;chase.vs=next.velocity;}
    const pitch=reduced.matches?15:eyeView?48:32;
    $('world').style.transform=`translate3d(${layout.x}px,${layout.y}px,0) perspective(1100px) rotateX(${pitch}deg) scale(${chase.scale}) translate3d(${-chase.x}px,${-chase.y}px,0)`;
    $('world').style.setProperty('--pin-scale',1/chase.scale);$('world').style.setProperty('--camera-pitch',pitch+'deg');
    if(!document.hidden)cameraFrame=requestAnimationFrame(cameraTick);
  }
  function startCamera(){api.setGameCamera(true);cancelAnimationFrame(cameraFrame);cameraLast=0;cameraFrame=requestAnimationFrame(cameraTick);}
  document.addEventListener('visibilitychange',()=>{if(active&&!document.hidden)startCamera();});
  function follow(){
    const mobile=innerWidth<761,top=mobile?$('game-hud').getBoundingClientRect().bottom+18:135;
    const bottom=Math.max(top+140,$('game-dock').getBoundingClientRect().top-35);
    layout={x:innerWidth*.5,y:top+(bottom-top)*(eyeView?.83:.65),scale:Math.max(.5,Math.min(mobile?.9:1.3,(bottom-top)/310))};
    if(eyeView)layout.scale*=1.15;
    if(active&&!cameraFrame)startCamera();
  }
  function render(message){
    const current=M.byId[state.at],near=M.neighbors(state.at);
    nodes.forEach((b,id)=>{b.classList.toggle('current',id===state.at);b.classList.toggle('reachable',near.includes(id));b.classList.toggle('seen',state.visited.includes(id));b.classList.toggle('collected',state.collected.includes(M.byId[id].firefly));b.tabIndex=near.includes(id)?0:-1;b.setAttribute('aria-disabled',!near.includes(id));});
    edges.forEach(e=>{e.p.classList.toggle('near',e.a===state.at||e.b===state.at);e.p.classList.toggle('traveled',state.visited.includes(e.a)&&state.visited.includes(e.b));});
    $('game-location').textContent=current.label;$('game-region').textContent=current.y>620?'01 / THE ROOTS':current.y>350?'02 / THE TRUNK':'03 / THE CANOPY';
    $('game-fireflies').textContent=[0,1,2].map(i=>i<state.collected.length?'✦':'✧').join(' ');$('game-score').textContent=`${state.collected.length} / 3 FIREFLIES`;$('game-height').style.width=Math.max(0,(940-current.y)/850*100)+'%';
    $('route-choices').innerHTML=near.map(id=>{const n=M.byId[id];const direction=n.y<current.y-40?'↗':n.y>current.y+40?'↙':n.x>current.x?'→':'←';return `<button data-hop="${id}"><span>${direction}</span>${api.esc(n.label)}${n.firefly&&!state.collected.includes(n.firefly)?'<i>✧</i>':''}<small class="crossing-status"></small></button>`;}).join('');
    $('read-camp').hidden=!api.places.some(p=>p.id===state.at);
    say(message||current.hint);foxAt(current);follow();updateWind();document.body.classList.toggle('crown-lit',state.won);
  }
  function attempt(to){
    if(!active||busy||document.querySelector('dialog[open]'))return;
    const previous=M.byId[state.at];
    if(!M.neighbors(state.at).includes(to)){say('Choose one of the connected branches below.');return;}
    if(M.neighbors(state.at).includes(to)&&!calm&&!M.wind(state.at,to,clock).safe){
      busy=true;M.fall(state);fox.classList.add('stumbled');say('A gust caught you! Your fireflies are safe. Returning to your last checkpoint.');
      const started=performance.now();function recover(now){if(!reduced.matches&&now-started<650){hopFrame=requestAnimationFrame(recover);return;}busy=false;fox.classList.remove('stumbled');render('Back at your checkpoint. Wait until the route says CLEAR, then hop.');}hopFrame=requestAnimationFrame(recover);return;
    }
    const result=M.hop(state,to);if(!result.ok){say(result.reason);return;}
    busy=true;const next=M.byId[to];look.x=Math.max(-65,Math.min(65,(next.x-previous.x)*.16));look.y=Math.max(-80,Math.min(35,(next.y-previous.y)*.16-35));const startTime=performance.now(),duration=reduced.matches?0:440;fox.classList.toggle('face-left',next.x<previous.x);fox.classList.add('hopping');
    function animate(now){const t=duration?Math.min(1,(now-startTime)/duration):1;foxAt({x:previous.x+(next.x-previous.x)*t,y:previous.y+(next.y-previous.y)*t-Math.sin(t*Math.PI)*38});if(t<1)hopFrame=requestAnimationFrame(animate);else{busy=false;fox.classList.remove('hopping');api.chime(state.hops);render(result.won?'You brought the light home. Every route tells a different story.':result.found?`${next.firefly[0].toUpperCase()+next.firefly.slice(1)} firefly found. Checkpoint saved. Read the story behind this place, or keep climbing.`:next.hint);if(result.won){$('finish-stats').textContent=`${state.hops} hops · ${state.visited.length} places visited · ${state.falls} gust recoveries`;finish.showModal();}window.dispatchEvent(new CustomEvent('trail:arrive',{detail:{...result,at:to}}));}}
    hopFrame=requestAnimationFrame(animate);
  }
  function start(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());$('end-trail').click();api.begin();active=true;document.body.classList.add('game-active','fox-perspective');document.body.classList.toggle('fox-eye',eyeView);startCamera();render(state.won?'The crown is yours. Start over to try another route.':'Hop with arrow keys, WASD, or the routes below. At windy crossings, wait for CLEAR.');$('viewport').focus({preventScroll:true});}
  function leave(){cancelAnimationFrame(hopFrame);busy=false;fox.classList.remove('hopping','stumbled');active=false;cancelAnimationFrame(cameraFrame);cameraFrame=0;api.setGameCamera(false);document.body.classList.remove('game-active','fox-perspective','fox-eye');api.sceneView('whole');}
  $('begin').onclick=start;$('leave-game').onclick=leave;$('follow-fox').onclick=()=>{look.x=0;look.y=-45;follow();};$('fox-view').onclick=()=>{eyeView=!eyeView;document.body.classList.toggle('fox-eye',eyeView);$('fox-view').setAttribute('aria-pressed',eyeView);$('fox-view').textContent=eyeView?'Follow behind':'Fox-eye view';follow();};
  $('restart-game').onclick=()=>{cancelAnimationFrame(hopFrame);busy=false;state=M.create();fox.classList.remove('hopping','stumbled');render('A fresh trail. Your first choice is waiting.');};
  $('route-choices').onclick=e=>{const b=e.target.closest('[data-hop]');if(b)attempt(b.dataset.hop);};
  $('read-camp').onclick=()=>{if(busy)return;const i=api.places.findIndex(p=>p.id===state.at);if(i>=0)api.openStory(i);};
  function updateWind(){
    edges.forEach(e=>{const w=M.wind(e.a,e.b,clock);e.p.classList.toggle('gust',w.windy&&!w.safe&&!calm);e.p.classList.toggle('clear',w.windy&&(w.safe||calm));});
    document.querySelectorAll('[data-hop]').forEach(b=>{const w=M.wind(state.at,b.dataset.hop,clock),label=b.querySelector('.crossing-status');if(label)label.textContent=w.windy?(calm?'CALM':w.safe?'CLEAR · HOP':'GUST · WAIT'):'';b.classList.toggle('gust',w.windy&&!w.safe&&!calm);b.setAttribute('aria-label',`Hop to ${M.byId[b.dataset.hop].label}${w.windy?calm?', calm crossing':w.safe?', crossing clear':', wind gust; wait for clear':''}`);});
  }
  function syncCalm(){$('calm-mode').setAttribute('aria-pressed',calm);$('calm-mode').textContent=calm?'Calm mode: on':'Wind crossings: on';updateWind();}
  $('calm-mode').onclick=()=>{calm=!calm;syncCalm();say(calm?'Calm mode: take any connected path without waiting.':'Wind crossings are on. Wait for CLEAR before hopping across a windy branch.');};syncCalm();
  setInterval(()=>{const now=performance.now(),paused=!active||document.hidden||!!document.querySelector('dialog[open]');if(!paused)clock+=Math.min(150,now-lastTick);lastTick=now;document.body.classList.toggle('game-paused',paused);if(!paused)updateWind();},100);
  document.addEventListener('keydown',e=>{if(!active||document.querySelector('dialog[open]')||e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;const vector={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]}[e.key.length===1?e.key.toLowerCase():e.key];if(vector){e.preventDefault();e.stopImmediatePropagation();const to=M.direction(state.at,...vector);if(to)attempt(to);else say('No branch in that direction. Choose one of the connected routes below.');}else if(e.key.toLowerCase()==='e'){e.preventDefault();$('read-camp').click();}},true);
  $('story').addEventListener('close',()=>{if(active){follow();$('viewport').focus({preventScroll:true});}});
  const guidedTour=$('help-tour').onclick;$('help-tour').onclick=()=>{if(active)leave();guidedTour();};
  $('recenter').onclick=()=>active?follow():api.sceneView('whole');
  reduced.addEventListener('change',()=>{if(reduced.matches){calm=true;syncCalm();}});
  addEventListener('resize',()=>{if(active)requestAnimationFrame(follow);});
  window.TrailGame={get state(){return state;},get active(){return active;},attempt,start,leave,render,say,follow,nodes,edges};
})();
