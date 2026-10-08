/* First-person exploration of a small, handmade field of work. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),F=window.FieldCore,C=window.FieldCamera,api=window.Portfolio,reduced=matchMedia('(prefers-reduced-motion: reduce)');
  document.body.classList.add('field-mode');
  const shell=document.createElement('div');shell.id='field-shell';shell.innerHTML=`<canvas id="field-canvas" tabindex="0" aria-label="First-person landscape. Use WASD to move, drag to look, and E to read a nearby landmark."></canvas><div id="field-shade" aria-hidden="true"></div><div id="landmark-labels"></div><div class="field-compass"><span id="field-heading">N</span><i></i><span>CITY ATLAS / SIDDHANT SHANKAR</span></div><div id="field-clock" role="group" aria-label="Time of day in the city"><span id="clock-dial" aria-hidden="true"><i></i></span><span class="clock-read"><strong id="clock-time">--:--</strong><small id="clock-phase"></small></span><button id="clock-run" aria-pressed="true" aria-label="Pause the passage of time">❚❚</button><button id="clock-skip" aria-label="Skip ahead one hour">+1h <kbd>T</kbd></button></div><div id="field-status"><span class="field-kicker" id="field-mode-status">ON FOOT / STREET LEVEL</span><span id="field-visited">0 / 11 PLACES VISITED</span></div><button id="nearby-place" hidden><span class="nearby-key">E</span><span><small id="nearby-company"></small><strong id="nearby-title"></strong></span><span>↗</span></button><div id="field-perspectives" role="group" aria-label="Camera perspective"><button id="field-walk-view" aria-pressed="true">On foot</button><button id="field-world-view" aria-pressed="false">City view <kbd>V</kbd></button></div><div id="field-flight-controls" hidden><span>FREE FLIGHT</span><p>WASD move · drag to look<br>Space rise · C descend · Shift faster</p><div><button id="field-rise" aria-label="Fly higher">↑ Rise</button><button id="field-descend" aria-label="Fly lower">↓ Descend</button></div><button id="field-frame">Frame the city <kbd>R</kbd></button><small>Scroll to move closer or farther</small></div><div id="field-controls"><button id="field-look">Mouse look</button><button id="field-home">Return to start</button><button id="field-help">How to explore</button></div><div class="field-reticle" aria-hidden="true">·</div><div id="field-fallback" hidden><h2>The city needs WebGL.</h2><p>You can still explore every career story through the index, or read the complete field guide.</p><button id="fallback-index">Open experience index</button><a href="field-notes.html">Read the field guide ↗</a></div>`;
  $('experience').append(shell);const canvas=$('field-canvas');
  const player={x:0,y:1.45,z:23,yaw:-.25,pitch:0},keys=new Set(),visited=new Set();
  const camera=C.create(player);
  let renderer,entered=false,last=0,frame=0,dirty=true,targetYaw=player.yaw,targetPitch=0,vx=0,vz=0,nearest=null,walkTime=0,journey=null;
  const S=window.FieldSky,now=new Date(),clock={hours:now.getHours()+now.getMinutes()/60,running:!reduced.matches,shown:''};const requested=parseFloat(new URLSearchParams(location.search).get('hour'));if(Number.isFinite(requested))clock.hours=S.wrap(requested);let sky=S.sample(clock.hours),skyClock=0;
  const labels=new Map(),wildlife=FieldWildlife.create();let wildlifeMesh=FieldWildlife.mesh(wildlife),wildlifeClock=0,wildlifePaused=reduced.matches;
  const wildlifeButton=document.createElement('button');wildlifeButton.id='field-wildlife-toggle';
  function wildlifeControl(){wildlifeButton.textContent=wildlifePaused?'Resume city life':'City alive';wildlifeButton.setAttribute('aria-label',wildlifePaused?'Resume animals and traffic':'Pause animals and traffic');wildlifeButton.setAttribute('aria-pressed',String(!wildlifePaused));}
  wildlifeButton.onclick=()=>{wildlifePaused=!wildlifePaused;wildlifeControl();dirty=true;};$('field-controls').append(wildlifeButton);wildlifeControl();
  reduced.addEventListener('change',()=>{wildlifePaused=reduced.matches;wildlifeControl();clock.running=!reduced.matches;applySky();dirty=true;});
  function applySky(){
    sky=S.sample(clock.hours);const style=$('field-shell').style;style.setProperty('--sky-top',sky.css.top);style.setProperty('--sky-low',sky.css.low);style.setProperty('--sky-haze',sky.css.haze);style.setProperty('--night',sky.night.toFixed(3));
    document.body.classList.toggle('field-night',sky.night>.5);const label=S.label(clock.hours);
    if(label!==clock.shown){clock.shown=label;$('clock-time').textContent=label;$('clock-phase').textContent=sky.phase;$('clock-dial').style.setProperty('--turn',`${clock.hours/24}turn`);}
    $('clock-run').textContent=clock.running?'❚❚':'▶';$('clock-run').setAttribute('aria-pressed',String(clock.running));$('clock-run').setAttribute('aria-label',clock.running?'Pause the passage of time':'Let time pass');
  }
  function skipHour(){clock.hours=S.wrap(clock.hours+1);applySky();dirty=true;}
  $('clock-run').onclick=()=>{clock.running=!clock.running;applySky();};$('clock-skip').onclick=skipHour;applySky();
  for(const place of F.landmarks){const button=document.createElement('button');button.className='field-label';button.innerHTML=`<i style="--marker:${place.color}"></i><span>${api.esc(place.company)}</span>`;button.setAttribute('aria-label',`Explore ${place.company}`);button.onclick=()=>window.FieldNavigation?.select(place);$('landmark-labels').append(button);labels.set(place.id,button);}
  // Cars, people, and animals are solid. If one has already reached the visitor, let them step away freely.
  let groundY=0;
  function movers(ignore){if(ignore)return null;const solid=(x,z)=>FieldLife.solid(wildlife.life,wildlife.animals,x,z,.35);return solid(player.x,player.z)?null:solid;}
  function pause(){return !!document.querySelector('dialog[open]');}
  function enter(){entered=true;document.body.classList.add('field-entered');$('field-intro').inert=true;canvas.focus({preventScroll:true});dirty=true;}
  function unlock(){if(document.pointerLockElement===canvas)document.exitPointerLock();}
  function openPlace(place){enter();unlock();stop();visited.add(place.id);$('field-visited').textContent=`${visited.size} / 11 PLACES VISITED`;const i=api.places.findIndex(p=>p.id===place.id);if(i>=0)api.openStory(i);dirty=true;}
  function stop(){journey=null;keys.clear();vx=vz=0;C.resetVelocity(camera);}
  function modeUI(){const flying=camera.mode==='world';document.body.classList.toggle('field-flying',flying);$('field-walk-view').setAttribute('aria-pressed',String(!flying));$('field-world-view').setAttribute('aria-pressed',String(flying));$('field-flight-controls').hidden=!flying;$('field-mode-status').textContent=flying?'CITY VIEW / FREE FLIGHT':'ON FOOT / STREET LEVEL';canvas.setAttribute('aria-label',flying?'City view. WASD to fly, Space to rise, C to descend, drag to look, V to return to walking.':'First-person landscape. WASD to walk, drag to look, E to read, V for city view.');}
  function setMode(mode){enter();unlock();stop();C.setMode(camera,mode,player,innerWidth/innerHeight,reduced.matches);const pose=mode==='world'?camera.flight:player;targetYaw=pose.yaw;targetPitch=pose.pitch;modeUI();dirty=true;}
  function frameWorld(){stop();C.frameWorld(camera,reduced.matches,innerWidth/innerHeight);targetYaw=camera.flight.yaw;targetPitch=camera.flight.pitch;dirty=true;}
  $('field-walk-view').onclick=()=>setMode('walk');$('field-world-view').onclick=()=>setMode('world');$('field-frame').onclick=frameWorld;
  for(const [id,key] of [['field-rise',' '],['field-descend','c']]){const b=$(id);b.onpointerdown=e=>{e.preventDefault();keys.add(key);b.setPointerCapture(e.pointerId);};for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(key));}
  $('enter-field').onclick=()=>setMode('walk');$('nearby-place').onclick=()=>{if(nearest)openPlace(nearest.place);};
  $('field-home').onclick=()=>{stop();player.x=0;player.y=1.45;player.z=23;player.yaw=-.25;player.pitch=0;setMode('walk');};
  $('field-help').onclick=()=>{unlock();api.modal('help');};$('fallback-index').onclick=()=>$('open-index').click();
  $('field-look').onclick=async()=>{enter();try{await canvas.requestPointerLock();}catch{$('field-look').textContent='Drag the scene to look';}};
  document.addEventListener('pointerlockchange',()=>{$('field-look').textContent=document.pointerLockElement===canvas?'Mouse captured · Esc to release':'Mouse look';});
  let drag=null;
  canvas.addEventListener('pointerdown',e=>{enter();if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag||pause()||document.pointerLockElement===canvas)return;targetYaw+=(e.clientX-drag.x)*.004;targetPitch=F.clamp(targetPitch-(e.clientY-drag.y)*.003,camera.mode==='world'?-1.48:-.7,camera.mode==='world'?1.2:.7);drag.x=e.clientX;drag.y=e.clientY;dirty=true;});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>drag=null);
  document.addEventListener('mousemove',e=>{if(document.pointerLockElement!==canvas||pause())return;targetYaw+=e.movementX*.002;targetPitch=F.clamp(targetPitch-e.movementY*.002,camera.mode==='world'?-1.48:-.7,camera.mode==='world'?1.2:.7);dirty=true;});
  canvas.addEventListener('wheel',e=>{if(camera.mode!=='world'||pause())return;e.preventDefault();C.zoom(camera,e.deltaY);dirty=true;},{passive:false});
  document.addEventListener('keydown',e=>{
    if(pause()||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
    const k=e.key.toLowerCase();
    if(k==='v'&&!e.repeat){e.preventDefault();setMode(camera.mode==='world'?'walk':'world');return;}
    if(k==='r'&&camera.mode==='world'&&!e.repeat){e.preventDefault();frameWorld();return;}
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)||(camera.mode==='world'&&[' ','c','pageup','pagedown'].includes(k))){
      if(k===' '&&e.target!==canvas&&/BUTTON|A/.test(e.target.tagName))return;
      e.preventDefault();journey=null;enter();keys.add(k);
    }
    if(k==='m'){e.preventDefault();window.FieldNavigation?.open();}
    if(k==='t'&&!e.repeat){e.preventDefault();skipHour();}
    if(k==='escape')stop();
    if(k==='e'&&camera.mode==='walk'&&nearest?.distance<6){e.preventDefault();openPlace(nearest.place);}
  });
  document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  addEventListener('blur',stop);
  document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('close',()=>{dirty=true;canvas.focus({preventScroll:true});});});
  const observer=new MutationObserver(()=>{if(pause()){stop();unlock();}});document.querySelectorAll('dialog').forEach(d=>observer.observe(d,{attributes:true,attributeFilter:['open']}));
  const LABEL_OFFSETS=[];for(let dy=-7;dy<=7;dy++)for(let dx=-2;dx<=2;dx++)LABEL_OFFSETS.push([dx,dy]);LABEL_OFFSETS.sort((a,b)=>(Math.abs(a[1])+(a[1]>0?.4:0)+Math.abs(a[0])*1.3)-(Math.abs(b[1])+(b[1]>0?.4:0)+Math.abs(b[0])*1.3));
  const labelStems=document.createElementNS('http://www.w3.org/2000/svg','svg');labelStems.id='label-stems';labelStems.setAttribute('aria-hidden','true');$('landmark-labels').prepend(labelStems);let lastStems='';
  function overlay(matrix){
    const eye=camera.eye,flying=camera.mode==='world',occupied=[];const intro=flying&&!entered?$('field-intro').getBoundingClientRect():null;let stems='';
    for(const p of [...F.landmarks].sort((a,b)=>F.distance(eye,a)-F.distance(eye,b))){
      const b=labels.get(p.id),distance=F.distance(eye,p),point=F.project(matrix,p.x,(p.height||5)+1.5,p.z),x=(point.x*.5+.5)*innerWidth,y=(-point.y*.5+.5)*innerHeight,width=p.company.length*6.1+32;
      if(flying){
        // City view always labels all eleven chapters. Off-screen buildings are pinned to the edge; crowded labels take the nearest free spot, with a leader line to their roof.
        let px=point.x,py=point.y;if(point.w<=0){const m=Math.max(Math.abs(px),Math.abs(py))||1;px=-px/m*2;py=-py/m*2;}
        const w=b.offsetWidth||width,h=b.offsetHeight||32,anchorX=(px*.5+.5)*innerWidth,anchorY=(-py*.5+.5)*innerHeight,top=165+h,bottom=innerHeight-100;
        const place=(dx,dy)=>{let x=F.clamp(anchorX+dx*(w*.6+8),16+w/2,innerWidth-16-w/2);const y=F.clamp(anchorY-6+dy*(h+6),top,bottom);if(intro&&x-w/2<intro.right+8&&y>intro.top&&y-h<intro.bottom)x=Math.min(innerWidth-16-w/2,intro.right+8+w/2);return {x,y};};
        const free=q=>!occupied.some(r=>Math.abs(q.x-r.x)<(w+r.w)/2+4&&Math.abs(q.y-r.y)<(h+r.h)/2+4);
        const edge=point.w<=0||anchorX<16||anchorX>innerWidth-16||anchorY<top-h||anchorY>bottom+h;
        let spot=place(0,0);for(const [dx,dy] of LABEL_OFFSETS){const q=place(dx,dy);if(free(q)){spot=q;break;}}
        occupied.push({x:spot.x,y:spot.y,w,h});b.hidden=false;b.classList.toggle('edge',edge);
        if(!edge){const cy=spot.y-h/2,sx=Math.abs(anchorY-cy)>h/2?spot.x:spot.x+Math.sign(anchorX-spot.x)*w/2,sy=anchorY>spot.y?spot.y:anchorY<spot.y-h?spot.y-h:cy;if(Math.hypot(anchorX-sx,anchorY-sy)>5)stems+=`<path d="M${sx.toFixed(1)} ${sy.toFixed(1)}L${anchorX.toFixed(1)} ${anchorY.toFixed(1)}"/><circle cx="${anchorX.toFixed(1)}" cy="${anchorY.toFixed(1)}" r="2.2"/>`;}
        b.style.transform=`translate(${Math.round(spot.x)}px,${Math.round(spot.y)}px) translate(-50%,-100%)`;b.style.opacity='1';continue;
      }
      b.classList.remove('edge');
      let shown=point.w>0&&Math.abs(point.x)<.93&&Math.abs(point.y)<.77&&distance<62;
      if(!entered)shown=false;
      b.hidden=!shown;if(shown){occupied.push({x,y,w:width});b.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`;b.style.opacity=flying?'1':String(F.clamp(1-distance/100,.45,1));}
    }
    if(stems!==lastStems){lastStems=stems;labelStems.innerHTML=stems;}
    nearest=F.nearest(player);$('nearby-place').hidden=!entered||flying||!!camera.transition||nearest.distance>6;
    if(nearest.distance<=6){$('nearby-company').textContent=nearest.place.company;$('nearby-title').textContent=nearest.place.name;}
    const degrees=((eye.yaw*180/Math.PI)%360+360)%360;$('field-heading').textContent=['N','NE','E','SE','S','SW','W','NW'][Math.round(degrees/45)%8];
  }
  function tick(time){
    const dt=Math.min(.04,(time-(last||time))/1000);last=time;let moving=false;
    if(!pause()&&!camera.transition){
      let forward=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0),side=(keys.has('d')?1:0)-(keys.has('a')?1:0);
      if(camera.mode==='walk'&&journey){const next=journey.points[0],distance=F.distance(player,next);if(distance<.18){journey.points.shift();if(!journey.points.length){targetYaw=Math.atan2(journey.place.x-player.x,player.z-journey.place.z);journey=null;vx=vz=0;}}else{const angle=Math.atan2(next.x-player.x,player.z-next.z);targetYaw=player.yaw+Math.atan2(Math.sin(angle-player.yaw),Math.cos(angle-player.yaw));const step=Math.min(distance,dt*5),blocked=movers(journey.stuck>1.4);const moved=F.slide(player,(next.x-player.x)/distance*step,(next.z-player.z)/distance*step,blocked);journey.stuck=F.distance(moved,player)<step*.3?journey.stuck+dt:0;player.x=moved.x;player.z=moved.z;dirty=true;moving=true;}forward=0;vx=vz=0;}
      targetYaw+=((keys.has('arrowright')?1:0)-(keys.has('arrowleft')?1:0))*dt*1.4;
      const active=camera.mode==='world'?camera.flight:player;const yawDelta=targetYaw-active.yaw,pitchDelta=targetPitch-active.pitch;active.yaw+=yawDelta*(reduced.matches?1:1-Math.exp(-18*dt));active.pitch+=pitchDelta*(reduced.matches?1:1-Math.exp(-18*dt));
      if(camera.mode==='world'){const up=(keys.has(' ')||keys.has('pageup')?1:0)-(keys.has('c')||keys.has('pagedown')?1:0);moving=C.fly(camera,{forward,side,up,fast:keys.has('shift')},dt);}
      else{
      const f=F.forward(player.yaw),length=Math.hypot(forward,side)||1,speed=keys.has('shift')?8:4.5,tx=(f.x*forward+Math.cos(player.yaw)*side)/length*speed,tz=(f.z*forward+Math.sin(player.yaw)*side)/length*speed;
      const a=1-Math.exp(-12*dt);vx+=(tx-vx)*a;vz+=(tz-vz)*a;const next=F.slide(player,vx*dt,vz*dt,movers());if(next.x===player.x&&Math.abs(vx)>.5)vx*=.5;if(next.z===player.z&&Math.abs(vz)>.5)vz*=.5;moving=moving||Math.hypot(next.x-player.x,next.z-player.z)>.00001;player.x=next.x;player.z=next.z;
      if(moving)walkTime+=dt;groundY+=(F.groundAt(player.x,player.z)-groundY)*(1-Math.exp(-10*dt));player.y=1.45+groundY+(moving&&!reduced.matches?Math.sin(walkTime*9)*.012:0);}
      dirty=dirty||moving||Math.abs(yawDelta)>.0001||Math.abs(pitchDelta)>.0001;
    }
    if(camera.transition&&!pause())dirty=true;
    C.sample(camera,player,pause()?0:dt);
    if(!pause()&&!wildlifePaused){FieldWildlife.update(wildlife,dt,camera.eye);wildlifeClock+=dt;if(wildlifeClock>1/30){wildlifeMesh=FieldWildlife.mesh(wildlife);wildlifeClock=0;dirty=true;}}
    if(!pause()&&clock.running){clock.hours=S.wrap(clock.hours+dt*24/S.DAY_SECONDS);skyClock+=dt;if(skyClock>1/24){skyClock=0;applySky();dirty=true;}}
    if(dirty&&renderer){const matrix=renderer.draw(camera.eye,wildlifeMesh,camera.mode==='world',sky);overlay(matrix);window.FieldNavigation?.update();window.FieldInspect?.update(matrix);dirty=false;}
    if(!document.hidden)frame=requestAnimationFrame(tick);
  }
  C.setMode(camera,'world',player,innerWidth/innerHeight,true);targetYaw=camera.flight.yaw;targetPitch=camera.flight.pitch;modeUI();
  try{renderer=new window.FieldRenderer(canvas);frame=requestAnimationFrame(tick);}catch(error){$('field-fallback').hidden=true;$('enter-field').innerHTML='Open every chapter <span aria-hidden="true">↗</span>';$('enter-field').onclick=()=>api.modal('atlas');console.warn('Field renderer unavailable:',error.message);}
  addEventListener('resize',()=>{renderer?.resize();dirty=true;});
  document.addEventListener('visibilitychange',()=>{stop();last=0;if(!document.hidden){cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);}});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);$('field-fallback').hidden=false;});
  canvas.addEventListener('webglcontextrestored',()=>{try{renderer=new window.FieldRenderer(canvas);$('field-fallback').hidden=true;dirty=true;last=0;frame=requestAnimationFrame(tick);}catch{$('field-fallback').hidden=false;}});
  window.Field={player,keys,visited,enter,openPlace,setMode,get mode(){return camera.mode;},get eye(){return camera.eye;},get nearest(){return nearest;},get paused(){return pause();},look(yaw,pitch){targetYaw=yaw;targetPitch=pitch;dirty=true;},invalidate(){dirty=true;},travel(place){if(camera.mode==='world')setMode('walk');enter();unlock();const points=F.route(player,place);journey=points.length?{place,points,stuck:0}:null;vx=vz=0;dirty=true;return !!journey;},get journey(){return journey;},clock,skipHour,camera,wildlife,get sky(){return sky;},stop,get renderer(){return renderer;}};
})();
