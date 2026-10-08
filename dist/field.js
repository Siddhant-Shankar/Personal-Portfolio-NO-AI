/* First-person exploration of a small, handmade field of work. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),F=window.FieldCore,api=window.Portfolio,reduced=matchMedia('(prefers-reduced-motion: reduce)');
  document.body.classList.add('field-mode');
  const shell=document.createElement('div');shell.id='field-shell';shell.innerHTML=`<canvas id="field-canvas" tabindex="0" aria-label="First-person landscape. Use WASD to move, drag to look, and E to read a nearby landmark."></canvas><div id="field-shade" aria-hidden="true"></div><div id="landmark-labels"></div><div class="field-compass"><span id="field-heading">N</span><i></i><span>THE FIELD / SIDDHANT SHANKAR</span></div><section id="field-intro"><span class="field-kicker">A SMALL WORLD OF WORK</span><h1>Take a<br><em>look around.</em></h1><p>I’m Siddhant. Engineer, builder,<br>and your guide to this little place.</p><button id="enter-field">Step into the field <span>↗</span></button><p class="field-intro-hint">WASD to walk · drag to look · E to explore</p></section><div id="field-status"><span class="field-kicker">ON FOOT / FOX’S-EYE VIEW</span><span id="field-visited">0 / 11 PLACES VISITED</span></div><button id="nearby-place" hidden><span class="nearby-key">E</span><span><small id="nearby-company"></small><strong id="nearby-title"></strong></span><span>↗</span></button><div id="field-controls"><button id="field-look">Mouse look</button><button id="field-home">Return to start</button><button id="field-help">How to explore</button></div><div class="field-reticle" aria-hidden="true">·</div><div id="field-fallback" hidden><h2>The field needs WebGL.</h2><p>You can still explore every career story through the index, or read the complete field guide.</p><button id="fallback-index">Open experience index</button><a href="field-notes.html">Read the field guide ↗</a></div>`;
  $('experience').append(shell);const canvas=$('field-canvas');
  const player={x:0,y:1.45,z:23,yaw:-.25,pitch:0},keys=new Set(),visited=new Set();
  let renderer,entered=false,last=0,frame=0,dirty=true,targetYaw=player.yaw,targetPitch=0,vx=0,vz=0,nearest=null,walkTime=0,journey=null;
  const labels=new Map(),wildlife=FieldWildlife.create();let wildlifeMesh=FieldWildlife.mesh(wildlife),wildlifeClock=0,wildlifePaused=reduced.matches;
  const wildlifeButton=document.createElement('button');wildlifeButton.id='field-wildlife-toggle';
  function wildlifeControl(){wildlifeButton.textContent=wildlifePaused?'Resume animals':'Animals roaming';wildlifeButton.setAttribute('aria-label',wildlifePaused?'Resume animal movement':'Pause animal movement');wildlifeButton.setAttribute('aria-pressed',String(!wildlifePaused));}
  wildlifeButton.onclick=()=>{wildlifePaused=!wildlifePaused;wildlifeControl();dirty=true;};$('field-controls').append(wildlifeButton);wildlifeControl();
  reduced.addEventListener('change',()=>{wildlifePaused=reduced.matches;wildlifeControl();dirty=true;});
  for(const place of F.landmarks){const button=document.createElement('button');button.className='field-label';button.innerHTML=`<i style="--marker:${place.color}"></i><span>${api.esc(place.company)}</span>`;button.setAttribute('aria-label',`Explore ${place.company}`);button.onclick=()=>window.FieldNavigation?.select(place);$('landmark-labels').append(button);labels.set(place.id,button);}
  function pause(){return !!document.querySelector('dialog[open]');}
  function enter(){entered=true;document.body.classList.add('field-entered');$('field-intro').inert=true;canvas.focus({preventScroll:true});dirty=true;}
  function unlock(){if(document.pointerLockElement===canvas)document.exitPointerLock();}
  function openPlace(place){enter();unlock();journey=null;keys.clear();vx=vz=0;visited.add(place.id);$('field-visited').textContent=`${visited.size} / 11 PLACES VISITED`;const i=api.places.findIndex(p=>p.id===place.id);if(i>=0)api.openStory(i);dirty=true;}
  $('enter-field').onclick=enter;$('nearby-place').onclick=()=>{if(nearest)openPlace(nearest.place);};
  $('field-home').onclick=()=>{journey=null;enter();player.x=0;player.z=23;targetYaw=-.25;targetPitch=0;vx=vz=0;dirty=true;};
  $('field-help').onclick=()=>{unlock();$('help-toggle').click();};$('fallback-index').onclick=()=>$('open-index').click();
  $('field-look').onclick=async()=>{enter();try{await canvas.requestPointerLock();}catch{$('field-look').textContent='Drag the scene to look';}};
  document.addEventListener('pointerlockchange',()=>{$('field-look').textContent=document.pointerLockElement===canvas?'Mouse captured · Esc to release':'Mouse look';});
  let drag=null;
  canvas.addEventListener('pointerdown',e=>{enter();if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag||pause()||document.pointerLockElement===canvas)return;targetYaw+=(e.clientX-drag.x)*.004;targetPitch=F.clamp(targetPitch-(e.clientY-drag.y)*.003,-.7,.7);drag.x=e.clientX;drag.y=e.clientY;dirty=true;});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>drag=null);
  document.addEventListener('mousemove',e=>{if(document.pointerLockElement!==canvas||pause())return;targetYaw+=e.movementX*.002;targetPitch=F.clamp(targetPitch-e.movementY*.002,-.7,.7);dirty=true;});
  document.addEventListener('keydown',e=>{if(pause()||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)){e.preventDefault();journey=null;enter();keys.add(k);}if(k==='m'){e.preventDefault();window.FieldNavigation?.open();}if(k==='escape')journey=null;if(k==='e'&&nearest?.distance<6){e.preventDefault();openPlace(nearest.place);}});
  document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  addEventListener('blur',()=>{keys.clear();vx=vz=0;});
  document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('close',()=>{dirty=true;canvas.focus({preventScroll:true});});});
  const observer=new MutationObserver(()=>{if(pause()){keys.clear();vx=vz=0;unlock();}});document.querySelectorAll('dialog').forEach(d=>observer.observe(d,{attributes:true,attributeFilter:['open']}));
  function overlay(matrix){
    for(const p of F.landmarks){const b=labels.get(p.id),distance=F.distance(player,p),point=F.project(matrix,p.x,5.8,p.z);const shown=point.w>0&&Math.abs(point.x)<.93&&Math.abs(point.y)<.77&&distance<62;b.hidden=!shown;if(shown){b.style.transform=`translate(${(point.x*.5+.5)*innerWidth}px,${(-point.y*.5+.5)*innerHeight}px) translate(-50%,-100%)`;b.style.opacity=String(F.clamp(1-distance/100,.45,1));}}
    nearest=F.nearest(player);$('nearby-place').hidden=!entered||nearest.distance>6;if(nearest.distance<=6){$('nearby-company').textContent=nearest.place.company;$('nearby-title').textContent=nearest.place.name;}
    const degrees=((player.yaw*180/Math.PI)%360+360)%360;$('field-heading').textContent=['N','NE','E','SE','S','SW','W','NW'][Math.round(degrees/45)%8];
  }
  function tick(time){
    const dt=Math.min(.04,(time-(last||time))/1000);last=time;let moving=false;
    if(!pause()){
      let forward=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0),side=(keys.has('d')?1:0)-(keys.has('a')?1:0);
      if(journey){const next=journey.points[0],distance=F.distance(player,next);if(distance<.18){journey.points.shift();if(!journey.points.length){targetYaw=Math.atan2(journey.place.x-player.x,player.z-journey.place.z);journey=null;vx=vz=0;}}else{const angle=Math.atan2(next.x-player.x,player.z-next.z);targetYaw=player.yaw+Math.atan2(Math.sin(angle-player.yaw),Math.cos(angle-player.yaw));const step=Math.min(distance,dt*5);const moved=F.slide(player,(next.x-player.x)/distance*step,(next.z-player.z)/distance*step);player.x=moved.x;player.z=moved.z;dirty=true;moving=true;}forward=0;vx=vz=0;}
      targetYaw+=((keys.has('arrowright')?1:0)-(keys.has('arrowleft')?1:0))*dt*1.4;
      const yawDelta=targetYaw-player.yaw,pitchDelta=targetPitch-player.pitch;player.yaw+=yawDelta*(reduced.matches?1:1-Math.exp(-18*dt));player.pitch+=pitchDelta*(reduced.matches?1:1-Math.exp(-18*dt));
      const f=F.forward(player.yaw),length=Math.hypot(forward,side)||1,speed=keys.has('shift')?8:4.5,tx=(f.x*forward+Math.cos(player.yaw)*side)/length*speed,tz=(f.z*forward+Math.sin(player.yaw)*side)/length*speed;
      const a=1-Math.exp(-12*dt);vx+=(tx-vx)*a;vz+=(tz-vz)*a;const next=F.slide(player,vx*dt,vz*dt);moving=moving||Math.hypot(next.x-player.x,next.z-player.z)>.00001;player.x=next.x;player.z=next.z;
      if(moving)walkTime+=dt;player.y=1.45+(moving&&!reduced.matches?Math.sin(walkTime*9)*.012:0);dirty=dirty||moving||Math.abs(yawDelta)>.0001||Math.abs(pitchDelta)>.0001;
    }
    if(!pause()&&!wildlifePaused){FieldWildlife.update(wildlife,dt,player);wildlifeClock+=dt;if(wildlifeClock>1/65){wildlifeMesh=FieldWildlife.mesh(wildlife);wildlifeClock=0;dirty=true;}}
    if(dirty&&renderer){overlay(renderer.draw(player,wildlifeMesh));window.FieldNavigation?.update();dirty=false;}
    if(!document.hidden)frame=requestAnimationFrame(tick);
  }
  try{renderer=new window.FieldRenderer(canvas);frame=requestAnimationFrame(tick);}catch(error){$('field-fallback').hidden=false;$('field-intro').hidden=true;console.warn('Field renderer unavailable:',error.message);}
  addEventListener('resize',()=>{renderer?.resize();dirty=true;});
  document.addEventListener('visibilitychange',()=>{keys.clear();last=0;if(!document.hidden){cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);}});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);$('field-fallback').hidden=false;});
  canvas.addEventListener('webglcontextrestored',()=>{try{renderer=new window.FieldRenderer(canvas);$('field-fallback').hidden=true;dirty=true;last=0;frame=requestAnimationFrame(tick);}catch{$('field-fallback').hidden=false;}});
  window.Field={player,keys,visited,enter,openPlace,get nearest(){return nearest;},get paused(){return pause();},look(yaw,pitch){targetYaw=yaw;targetPitch=pitch;dirty=true;},invalidate(){dirty=true;},travel(place){enter();unlock();const points=F.route(player,place);journey=points.length?{place,points}:null;vx=vz=0;dirty=true;return !!journey;},get journey(){return journey;},stop(){journey=null;keys.clear();vx=vz=0;},get renderer(){return renderer;}};
})();
