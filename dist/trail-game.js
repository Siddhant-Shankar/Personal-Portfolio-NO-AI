/* A fox, a branching journey, and the work between the destinations. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),api=window.Portfolio,M=window.TrailModel;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let state=M.create(),active=false,busy=false,hopFrame=0;
  const nodes=new Map(),edges=[];
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.id='trail-routes';svg.setAttribute('viewBox','0 0 1600 1067');svg.setAttribute('aria-hidden','true');$('world').append(svg);
  M.links.forEach(([a,b],i)=>{const n=M.byId[a],t=M.byId[b];const p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',`M${n.x} ${n.y} Q${(n.x+t.x)/2} ${(n.y+t.y)/2-15} ${t.x} ${t.y}`);p.classList.add('trail-edge');svg.append(p);edges.push({a,b,p,i});});
  const layer=document.createElement('div');layer.id='trail-stops';$('world').append(layer);
  M.nodes.forEach(n=>{const b=document.createElement('button');b.className='trail-stop';b.dataset.stop=n.id;b.style.left=n.x+'px';b.style.top=n.y+'px';b.setAttribute('aria-label',`Hop to ${n.label}`);b.innerHTML=`<span class="stop-stone"></span>${n.firefly?'<span class="stop-firefly" aria-hidden="true">✧</span>':''}<span class="stop-name">${api.esc(n.label)}</span>`;b.onclick=()=>attempt(n.id);layer.append(b);nodes.set(n.id,b);});
  const fox=document.createElement('div');fox.id='fox';fox.setAttribute('aria-hidden','true');
  fox.innerHTML='<div class="fox-shadow"></div><div class="fox-body"><svg viewBox="0 0 100 100"><g class="fox-tail"><path d="M51 69C15 77 1 47 12 29c8 20 22 14 35 22Z" fill="#c7793f"/><path d="M12 29c-5 11-5 21 0 29l16-14C21 43 16 39 12 29" fill="#f6e5c3"/></g><path d="M37 62Q43 45 66 48l13 20-9 14H43Z" fill="#dc914c"/><path d="m42 74-3 15h12l5-15m9 0 1 15h11l-2-19" fill="#4b3430"/><path d="m53 48-3-27 18 13 20-11-3 29-16 15Z" fill="#ecaa64"/><path d="m54 29 3 14 6-6m18-6-10 8 9 4" fill="#593a35"/><path d="m54 46 15 7 16-8-9 15-9 6-11-9Z" fill="#fff0cf"/><path d="m65 56 8-1-4 6Z" fill="#382d2a"/><circle cx="61" cy="46" r="2.4" fill="#252a29"/><circle cx="77" cy="45" r="2.4" fill="#252a29"/><path d="M46 65q8 11 16 11l-7 6H44Z" fill="#f5d3a0"/></svg></div><span class="fox-you">YOU</span>';
  $('world').append(fox);
  const hud=document.createElement('section');hud.id='game-hud';hud.setAttribute('aria-label','Game progress');hud.innerHTML='<div class="game-topline"><span class="eyebrow">THE LONG WAY UP</span><button id="leave-game">Browse freely ↗</button></div><div class="firefly-counter"><span id="game-fireflies">✧ ✧ ✧</span><span id="game-score">0 / 3 FIREFLIES</span></div><p id="game-objective">Find three fireflies. Bring them to the crown.</p><div class="game-meter"><span id="game-height"></span></div>';$('experience').append(hud);
  const dock=document.createElement('section');dock.id='game-dock';dock.setAttribute('aria-label','Current place and available routes');dock.innerHTML='<div class="arrival-copy"><span class="eyebrow" id="game-region">THE ROOTS</span><h2 id="game-location"></h2><p id="game-message" role="status"></p></div><div id="route-choices" aria-label="Connected paths"></div><div class="game-dock-footer"><button id="read-camp">Read this chapter <kbd>E</kbd></button><button id="follow-fox">Find my fox ⌖</button><button id="restart-game">Start over</button></div>';$('experience').append(dock);
  const badge=document.createElement('button');badge.id='resume-game';badge.textContent='Play the fox trail ↗';badge.onclick=()=>start();$('experience').append(badge);
  function say(message){$('game-message').textContent=message;$('announcement').textContent=message;}
  function foxAt(n){fox.style.left=n.x+'px';fox.style.top=n.y+'px';}
  function follow(){const n=M.byId[state.at],near=[n,...M.neighbors(state.at).map(id=>M.byId[id])];const xs=near.map(p=>p.x),ys=near.map(p=>p.y),mobile=innerWidth<761;const rangeX=Math.max(...xs)-Math.min(...xs),rangeY=Math.max(...ys)-Math.min(...ys);const scale=Math.max(.38,Math.min(mobile?.85:1.15,(innerWidth-(mobile?55:180))/(rangeX+210),(innerHeight-(mobile?380:330))/(rangeY+100)));const cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;api.move({scale,x:innerWidth*.5-cx*scale,y:(innerHeight-(mobile?280:225))*.56-cy*scale});}
  function render(message){
    const current=M.byId[state.at],near=M.neighbors(state.at);
    nodes.forEach((b,id)=>{b.classList.toggle('current',id===state.at);b.classList.toggle('reachable',near.includes(id));b.classList.toggle('seen',state.visited.includes(id));b.classList.toggle('collected',state.collected.includes(M.byId[id].firefly));b.tabIndex=near.includes(id)?0:-1;b.setAttribute('aria-disabled',!near.includes(id));});
    edges.forEach(e=>{e.p.classList.toggle('near',e.a===state.at||e.b===state.at);e.p.classList.toggle('traveled',state.visited.includes(e.a)&&state.visited.includes(e.b));});
    $('game-location').textContent=current.label;$('game-region').textContent=current.y>620?'01 / THE ROOTS':current.y>350?'02 / THE TRUNK':'03 / THE CANOPY';
    $('game-fireflies').textContent=[0,1,2].map(i=>i<state.collected.length?'✦':'✧').join(' ');$('game-score').textContent=`${state.collected.length} / 3 FIREFLIES`;$('game-height').style.width=Math.max(0,(940-current.y)/850*100)+'%';
    $('route-choices').innerHTML=near.map(id=>{const n=M.byId[id];const direction=n.y<current.y-40?'↗':n.y>current.y+40?'↙':n.x>current.x?'→':'←';return `<button data-hop="${id}"><span>${direction}</span>${api.esc(n.label)}${n.firefly&&!state.collected.includes(n.firefly)?'<i>✧</i>':''}</button>`;}).join('');
    $('read-camp').hidden=!api.places.some(p=>p.id===state.at);
    say(message||current.hint);foxAt(current);follow();
  }
  function attempt(to){
    if(!active||busy||document.querySelector('dialog[open]'))return;
    const previous=M.byId[state.at];const result=M.hop(state,to);if(!result.ok){say(result.reason);return;}
    busy=true;const next=M.byId[to],startTime=performance.now(),duration=reduced.matches?0:440;fox.classList.toggle('face-left',next.x<previous.x);fox.classList.add('hopping');
    function animate(now){const t=duration?Math.min(1,(now-startTime)/duration):1;foxAt({x:previous.x+(next.x-previous.x)*t,y:previous.y+(next.y-previous.y)*t-Math.sin(t*Math.PI)*38});if(t<1)hopFrame=requestAnimationFrame(animate);else{busy=false;fox.classList.remove('hopping');api.chime(state.hops);render(result.won?'You brought the light home. Every route tells a different story.':result.found?`${next.firefly[0].toUpperCase()+next.firefly.slice(1)} firefly found. Checkpoint saved. Read the story behind this place, or keep climbing.`:next.hint);window.dispatchEvent(new CustomEvent('trail:arrive',{detail:{...result,at:to}}));}}
    hopFrame=requestAnimationFrame(animate);
  }
  function start(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());$('end-trail').click();api.begin();active=true;document.body.classList.add('game-active');render(state.won?'The crown is yours. Start over to try another route.':'Three fireflies are scattered through the tree. Choose a connected path to begin.');$('viewport').focus({preventScroll:true});}
  function leave(){active=false;document.body.classList.remove('game-active');api.sceneView('whole');}
  $('begin').onclick=start;$('leave-game').onclick=leave;$('follow-fox').onclick=follow;
  $('restart-game').onclick=()=>{cancelAnimationFrame(hopFrame);busy=false;state=M.create();fox.classList.remove('hopping');render('A fresh trail. Your first choice is waiting.');};
  $('route-choices').onclick=e=>{const b=e.target.closest('[data-hop]');if(b)attempt(b.dataset.hop);};
  $('read-camp').onclick=()=>{const i=api.places.findIndex(p=>p.id===state.at);if(i>=0)api.openStory(i);};
  document.addEventListener('keydown',e=>{if(!active||document.querySelector('dialog[open]')||e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;const vector={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]}[e.key];if(vector){e.preventDefault();e.stopImmediatePropagation();const to=M.direction(state.at,...vector);if(to)attempt(to);else say('No branch in that direction. Choose one of the connected routes below.');}else if(e.key.toLowerCase()==='e'){e.preventDefault();$('read-camp').click();}},true);
  $('story').addEventListener('close',()=>{if(active){follow();$('viewport').focus({preventScroll:true});}});
  addEventListener('resize',()=>{if(active)requestAnimationFrame(follow);});
  window.TrailGame={get state(){return state;},get active(){return active;},attempt,start,leave,render,say,follow,nodes,edges};
})();
