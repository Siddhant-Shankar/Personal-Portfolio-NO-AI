/* Small, independent lives: forage, pause, wander, and yield to a nearby visitor. */
(function(root){
  'use strict';
  const F=typeof module==='object'&&module.exports?require('./field-core.js'):root.FieldCore;
  function create(seed=731){const rand=F.random(seed),animals=[];const types=['rabbit','chicken','fox','deer'];
    for(let i=0;i<12;i++){let x,z;do{x=rand()*90-45;z=rand()*90-40;}while(!F.canWalk(x,z));animals.push({id:i,kind:types[i%4],x,z,yaw:rand()*Math.PI*2,phase:rand()*6,wait:1+rand()*5,goal:null,pace:0});}
    // Two quiet neighbours greet you near the starting clearing.
    Object.assign(animals[0],{x:5,z:17});Object.assign(animals[1],{x:-4,z:18});
    return {animals,rand};
  }
  function update(world,dt,player){dt=F.clamp(dt,0,.05);for(const a of world.animals){const d=F.distance(a,player);a.wait-=dt;
    if(d<3.8){const dx=a.x-player.x,dz=a.z-player.z,l=Math.hypot(dx,dz)||1;const goal={x:a.x+dx/l*5,z:a.z+dz/l*5};if(F.clearLine(a,goal)){a.goal=goal;a.wait=1.5;}}
    if(!a.goal&&a.wait<=0){for(let i=0;i<8;i++){const angle=world.rand()*Math.PI*2,r=2+world.rand()*6,goal={x:a.x+Math.sin(angle)*r,z:a.z+Math.cos(angle)*r};if(F.clearLine(a,goal)&&Math.abs(goal.x)<49&&Math.abs(goal.z)<55){a.goal=goal;break;}}a.wait=2+world.rand()*6;}
    const desired=a.goal?(d<3.8?2.4:a.kind==='deer'?.75:1):0;a.pace+=(desired-a.pace)*(1-Math.exp(-6*dt));
    if(a.goal){const dist=F.distance(a,a.goal);if(dist<.12){a.goal=null;a.wait=2+world.rand()*7;}else{const angle=Math.atan2(a.goal.x-a.x,a.goal.z-a.z),delta=Math.atan2(Math.sin(angle-a.yaw),Math.cos(angle-a.yaw));a.yaw+=delta*(1-Math.exp(-7*dt));const step=Math.min(dist,a.pace*dt),next=F.slide(a,(a.goal.x-a.x)/dist*step,(a.goal.z-a.z)/dist*step);if(F.distance(a,next)<.00001){a.goal=null;a.wait=1;}a.x=next.x;a.z=next.z;}}
    a.phase+=dt*a.pace*7;
  }}
  function mesh(world){const b=F.builder();for(const a of world.animals){const deer=a.kind==='deer',rabbit=a.kind==='rabbit',bird=a.kind==='chicken',scale=deer?1.25:rabbit?.56:bird?.52:.78,coat=deer?'#ad9168':rabbit?'#c2b8a1':bird?'#e8dec3':'#bc7842',s=Math.sin(a.yaw),c=Math.cos(a.yaw),bob=a.pace>.1?Math.abs(Math.sin(a.phase))*.035:0;
    function box(x,y,z,w,h,d,color,angle=0){b.box(a.x+(x*c+z*s)*scale,(y+bob)*scale,a.z+(-x*s+z*c)*scale,w*scale,h*scale,d*scale,color,a.yaw+angle);}
    box(0,.005,0,.9,.012,1.4,'#718354');box(0,.65,0,.55,.5,.95,coat);box(0,.9,.52,.43,.43,.45,coat);box(0,.79,.8,.28,.18,.28,bird?'#d39d43':'#e4d4b0');
    for(const side of [-1,1]){box(side*.16,1.22,.55,.12,rabbit?.55:.25,.17,coat);box(side*.226,.98,.64,.03,.07,.08,'#29362e');}
    if(bird){box(0,1.15,.53,.11,.22,.3,'#aa553c');box(0,.68,-.57,.4,.35,.16,'#8b674d');}
    else{box(0,.67,-.72,rabbit?.25:.3,.27,rabbit?.26:.65,rabbit?'#e6dcc7':coat);if(!rabbit)box(0,.68,-1.03,.28,.25,.24,'#ded0ac');}
    for(const side of [-1,1])for(const end of [-1,1]){if(bird&&end<0)continue;const lift=Math.max(0,Math.sin(a.phase+(side*end>0?0:Math.PI)))*Math.min(.2,a.pace*.12);box(side*.2,.25+lift,end*.3,.12,.45,.13,bird?'#bb904e':deer?'#5b5541':coat);}
    if(deer){for(const side of [-1,1]){box(side*.14,1.5,.48,.07,.65,.08,'#706045');box(side*.23,1.65,.48,.25,.07,.07,'#706045');}}
    if(!a.goal&&a.wait<1.5)box(0,.61,.87,.23,.14,.25,coat);
  }return b.finish();}
  const api={create,update,mesh};if(typeof module==='object'&&module.exports)module.exports=api;else root.FieldWildlife=api;
})(typeof window!=='undefined'?window:globalThis);
