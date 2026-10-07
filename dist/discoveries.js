/* Guided chapters and fictional, hands-on explanations of engineering ideas. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),api=window.Portfolio;
  const trail=[9,6,5,1,0,2,3,10];
  let position=-1;
  function end(){position=-1;$('trail-progress').hidden=true;$('next-story').textContent='Next discovery ✧';}
  function start(){position=0;$('trail-progress').hidden=false;api.openStory(trail[0]);}
  $('tour-start').onclick=$('help-tour').onclick=start;
  $('end-trail').onclick=end;
  $('next-story').onclick=()=>{
    if(position>=0){if(position===trail.length-1){end();$('story').close();api.sceneView('whole');$('announcement').textContent='Trail complete. Keep wandering, or open the index to find another chapter.';}else api.openStory(trail[++position]);}
    else {const current=api.places.findIndex(p=>p.id===$('story').dataset.place);api.openStory((current+1)%api.places.length);}
  };
  addEventListener('portfolio:story',({detail})=>{
    $('story').dataset.place=detail.id;
    if(position>=0&&trail[position]!==detail.index)end();
    if(position>=0){$('trail-label').textContent=`GUIDED TRAIL / ${position+1} OF ${trail.length}`;$('next-story').textContent=position===trail.length-1?'Finish the trail ✧':'Continue the trail ✧';$('story-position').textContent=`TRAIL ${position+1} / ${trail.length}`;}
    if(detail.id==='boring')telemetry();
    if(detail.id==='hyphenate')ledger();
    if(detail.id==='parasol')parallel();
  });
  function lab(title,question,body){const el=document.createElement('section');el.className='mini-lab';el.setAttribute('aria-label',title);el.innerHTML=`<p class="lab-label">${title} / FICTIONAL DEMONSTRATION</p><p class="lab-question">${question}</p>${body}`;$('story-content').append(el);return el;}
  function telemetry(){
    const el=lab('TRACE A SIGNAL','The sensor is sending. Why is the screen empty?','<div class="lab-path"><button class="lab-node" data-layer="sensor">Sensor</button><span>→</span><button class="lab-node" data-layer="network">Network</button><span>→</span><button class="lab-node" data-layer="service">Service</button><span>→</span><button class="lab-node" data-layer="screen">Screen</button></div><p class="lab-result" role="status">Inspect each boundary. The failure is somewhere between two working pieces.</p>');
    const results={sensor:'The sensor has emitted a packet. Its output is present.',network:'Found it: the sender is missing from the network allowlist. The packet never reaches the service.',service:'The service is healthy, but there is no incoming packet to process.',screen:'The interface is connected. It has no new record to display.'};
    el.querySelectorAll('[data-layer]').forEach(b=>b.onclick=()=>{el.querySelector('.lab-result').textContent=results[b.dataset.layer];b.classList.add(b.dataset.layer==='network'?'blocked':'correct');if(b.dataset.layer==='network'&&!el.querySelector('.lab-action')){const fix=document.createElement('button');fix.className='lab-action';fix.textContent='Allow this fictional sender';fix.onclick=()=>{el.querySelectorAll('.lab-node').forEach(n=>{n.classList.remove('blocked');n.classList.add('correct');});el.querySelector('.lab-result').textContent='Signal received. Now verify the whole path: sender → network → service → screen.';fix.disabled=true;fix.textContent='Verified end to end ✓';};el.append(fix);}});
  }
  function ledger(){
    const el=lab('TRUST THE TOTAL','Three rows. Two transactions. What should the total be?','<div class="record-row"><span>TX-101 / Consulting</span><span>$120</span></div><div class="record-row"><span>TX-102 / Hosting</span><span>$80</span></div><div class="record-row duplicate"><span>TX-101 / Replayed event</span><span>$120</span></div><div class="lab-total">Reported total: <strong>$320</strong></div><button class="lab-action">Reconcile by transaction ID</button><p class="lab-result" role="status">A replayed event is counted twice. A plausible answer can still be wrong.</p>');
    let fixed=false;el.querySelector('button').onclick=()=>{fixed=!fixed;el.querySelector('.duplicate').classList.toggle('removed',fixed);el.querySelector('.lab-total strong').textContent=fixed?'$200':'$320';el.querySelector('button').textContent=fixed?'Replay the duplicate':'Reconcile by transaction ID';el.querySelector('.lab-result').textContent=fixed?'Two unique transactions: $120 + $80 = $200. Stable identities make repeated delivery safe to reconcile.':'The same transaction has arrived again. The raw sum includes it twice.';};
  }
  function parallel(){
    const el=lab('PARALLEL THINKING','Does twice the hardware mean twice the speed?','<label class="worker-label">Workers <output>4</output><input type="range" min="1" max="16" value="4" aria-label="Number of workers"></label><div class="speed-track"><span></span></div><p class="lab-result" role="status"></p><p class="lab-label">MODEL: 20% SERIAL WORK / NO ADDED OVERHEAD</p>');
    const input=el.querySelector('input');function update(){const n=Number(input.value),speed=1/(.2+.8/n);el.querySelector('output').textContent=n;el.querySelector('.speed-track span').style.width=(speed/5*100)+'%';el.querySelector('.lab-result').textContent=`${n} worker${n===1?'':'s'} → ${speed.toFixed(2)}× theoretical speedup. The serial portion caps this model at 5×, even with unlimited workers.`;}input.oninput=update;update();
  }
  // Ambient motes are decorative; never run them for reduced-motion visitors.
  const canvas=$('motes'),ctx=canvas.getContext('2d'),motion=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,last=0,w=0,h=0;
  const motes=Array.from({length:30},()=>({x:Math.random(),y:Math.random(),phase:Math.random()*6.28,size:Math.random()*1.3+.5}));
  function resize(){w=innerWidth;h=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
  function tick(time){if(motion.matches||document.hidden)return;const dt=Math.min(40,time-last||16);last=time;ctx.clearRect(0,0,w,h);for(const m of motes){m.y-=dt*.000006;if(m.y<0)m.y=1;const a=.15+.3*(.5+.5*Math.sin(time*.0007+m.phase));ctx.fillStyle=`rgba(223,218,157,${a})`;ctx.beginPath();ctx.arc(m.x*w+Math.sin(time*.0002+m.phase)*15,m.y*h,m.size,0,Math.PI*2);ctx.fill();}frame=requestAnimationFrame(tick);}
  function restart(){cancelAnimationFrame(frame);last=0;ctx.clearRect(0,0,w,h);if(!motion.matches&&!document.hidden)frame=requestAnimationFrame(tick);}
  if(ctx){resize();addEventListener('resize',resize);motion.addEventListener('change',restart);document.addEventListener('visibilitychange',restart);restart();}
})();
