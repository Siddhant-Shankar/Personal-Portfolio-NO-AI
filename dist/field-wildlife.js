/* Small, independent lives: forage, pause, wander, and yield to a nearby visitor. */
(function(root){
  'use strict';
  const F=typeof module==='object'&&module.exports?require('./field-core.js'):root.FieldCore;
  const Life=typeof module==='object'&&module.exports?require('./field-life.js'):root.FieldLife;
  function create(seed=731){const rand=F.random(seed),animals=[];const types=['rabbit','chicken','fox','deer'];
    for(let i=0;i<16;i++){let x,z;do{x=rand()*90-45;z=rand()*90-40;}while(!F.canWalk(x,z));animals.push({id:i,kind:types[i%4],x,z,yaw:rand()*Math.PI*2,phase:rand()*6,wait:i%4===0?1+rand()*2:0,goal:null,pace:0,path:[]});}
    // Two quiet neighbours greet you near the starting clearing.
    Object.assign(animals[0],{x:5,z:17});Object.assign(animals[1],{x:-4,z:18});Object.assign(animals[2],{x:-8,z:9});Object.assign(animals[3],{x:-10,z:16});
    for(const a of animals)if(a.kind!=='fox'){a.habitat={minX:-20,maxX:-4,minZ:4,maxZ:20};do{a.x=-20+rand()*16;a.z=4+rand()*16;}while(!F.canWalk(a.x,a.z));}
    // Nobody starts inside a tree, bench, or lamp post.
    for(const a of animals)while(!F.canWalk(a.x,a.z)){a.x+=rand()*2-1;a.z+=rand()*2-1;}
    return {animals,rand,elapsed:0,life:Life.create()};
  }
  function choosePath(world,a){
    // Longer journeys through connected clear space; feet never pass through buildings.
    const range=a.kind==='fox'?18:a.kind==='deer'?14:a.kind==='rabbit'?8:6;
    for(let i=0;i<10;i++){
      const angle=world.rand()*Math.PI*2,r=3+world.rand()*range;
      const h=a.habitat,goal={x:F.clamp(a.x+Math.sin(angle)*r,h?h.minX:-48,h?h.maxX:48),z:F.clamp(a.z+Math.cos(angle)*r,h?h.minZ:-52,h?h.maxZ:54)};
      if(!F.canWalk(goal.x,goal.z)||F.distance(a,goal)<2)continue;
      const path=F.route(a,goal);if(path.length){a.path=path;a.goal=a.path.shift();return;}
    }
    a.wait=.5;
  }
  function update(world,dt,player){
    dt=F.clamp(dt,0,.05);world.elapsed+=dt;Life.update(world.life,dt,player);
    for(const a of world.animals){
      const d=Math.hypot(a.x-player.x,a.z-player.z,Math.max(0,(player.y||1.45)-1.45));a.wait-=dt;
      if(d<3.8){const dx=a.x-player.x,dz=a.z-player.z,l=Math.hypot(dx,dz)||1,goal={x:a.x+dx/l*5,z:a.z+dz/l*5};if(F.clearLine(a,goal)){a.goal=goal;a.path=[];a.wait=1.5;}}
      if(!a.goal&&a.wait<=0)choosePath(world,a);
      const cruising={deer:1.2,fox:1.65,rabbit:1.35,chicken:.95}[a.kind];
      const desired=a.goal?(d<3.8?3.1:cruising):0;a.pace+=(desired-a.pace)*(1-Math.exp(-6*dt));
      if(a.goal){
        const dist=F.distance(a,a.goal);
        if(dist<.09){a.goal=a.path.shift()||null;if(!a.goal)a.wait=.8+world.rand()*2.7;}
        else{const angle=Math.atan2(a.goal.x-a.x,a.goal.z-a.z),delta=Math.atan2(Math.sin(angle-a.yaw),Math.cos(angle-a.yaw));a.yaw+=delta*(1-Math.exp(-7*dt));const step=Math.min(dist,a.pace*dt),next=F.slide(a,(a.goal.x-a.x)/dist*step,(a.goal.z-a.z)/dist*step);if(F.distance(a,next)<.00001){a.goal=null;a.path=[];a.wait=.5;}a.x=next.x;a.z=next.z;}
      }
      a.phase+=dt*a.pace*(a.kind==='rabbit'?10:7);
    }
  }
  function mesh(world){const b=F.builder();for(const a of world.animals){const deer=a.kind==='deer',rabbit=a.kind==='rabbit',bird=a.kind==='chicken',scale=deer?1.25:rabbit?.56:bird?.52:.78,coat=deer?'#ad9168':rabbit?'#c2b8a1':bird?'#e8dec3':'#bc7842',s=Math.sin(a.yaw),c=Math.cos(a.yaw),bob=a.pace>.1?Math.max(0,Math.sin(a.phase))*(rabbit?.2:bird?.065:.045):Math.sin(world.elapsed*1.5+a.id)*.012,graze=!a.goal?(Math.sin(world.elapsed*2+a.id)*.5+.5)*.14:0;
    function box(x,y,z,w,h,d,color,angle=0){b.box(a.x+(x*c+z*s)*scale,(y+bob)*scale,a.z+(-x*s+z*c)*scale,w*scale,h*scale,d*scale,color,a.yaw+angle);}
    box(0,.005,0,.9,.012,1.4,'#718354');box(0,.65,0,.55,.5,.95,coat);box(0,.9-graze,.52,.43,.43,.45,coat);box(0,.79-graze,.8,.28,.18,.28,bird?'#d39d43':'#e4d4b0');
    for(const side of [-1,1]){box(side*.16,1.22-graze,.55,.12,rabbit?.55:.25,.17,coat);box(side*.226,.98-graze,.64,.03,.07,.08,'#29362e');}
    if(bird){box(0,1.15-graze,.53,.11,.22,.3,'#aa553c');box(0,.68,-.57,.4,.35,.16,'#8b674d');}
    else{box(Math.sin(world.elapsed*3+a.id)*.06,.67,-.72,rabbit?.25:.3,.27,rabbit?.26:.65,rabbit?'#e6dcc7':coat);if(!rabbit)box(Math.sin(world.elapsed*3+a.id)*.12,.68,-1.03,.28,.25,.24,'#ded0ac');}
    for(const side of [-1,1])for(const end of [-1,1]){if(bird&&end<0)continue;const lift=Math.max(0,Math.sin(a.phase+(side*end>0?0:Math.PI)))*Math.min(.2,a.pace*.12);const stride=Math.sin(a.phase+(side*end>0?0:Math.PI))*Math.min(.19,a.pace*.15);box(side*.2,.25+lift,end*.3+stride,.12,.45,.13,bird?'#bb904e':deer?'#5b5541':coat);}
    if(deer){for(const side of [-1,1]){box(side*.14,1.5-graze,.48,.07,.65,.08,'#706045');box(side*.23,1.65-graze,.48,.25,.07,.07,'#706045');}}

  }F.city.addTraffic(b,world.elapsed,world.life.vehicles.map((_,i)=>Life.vehiclePose(world.life,i)));Life.add(b,world.elapsed,world.life);return b.finish();}
  const api={create,update,mesh};if(typeof module==='object'&&module.exports)module.exports=api;else root.FieldWildlife=api;
})(typeof window!=='undefined'?window:globalThis);
