/* City life beyond the career buildings: people on the pavements, boats on the canal, birds, and smoke. */
(function(root){
  'use strict';
  const City=typeof module==='object'&&module.exports?require('./field-city.js'):root.FieldCity;
  const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  const blocks=[];for(const x of [-36,-12,12,36])for(const z of [-36,-12,12,36])blocks.push([x,z]);

  // Pedestrians loop around a block on the pavement. Their pace eases up and down, so they seem to dawdle.
  const PEOPLE=32,PAVEMENT=9.1;
  const coats=['#b8624a','#3f5f6b','#d4b06a','#6f7f58','#8a6c9a','#e0d6bd','#4b4f5c','#c4835a','#5d8a87','#a14c4c'],skins=['#e8c9a6','#c99a72','#9c6b4a','#6f4a33','#f0d5bb'];
  function personPose(i,time){
    const [cx,cz]=blocks[(i*5)%blocks.length],speed=.85+hash(i)*.55,w=.3+hash(i+40)*.35,reverse=i%2===1;
    const travelled=speed*time-speed/w*.75*Math.sin(w*time+hash(i+80)*6)+hash(i+120)*90;
    const p=City.loopPose(cx,cz,PAVEMENT,PAVEMENT,1.4,reverse?-travelled:travelled);
    return {x:p.x,z:p.z,yaw:reverse?p.yaw+Math.PI:p.yaw,stride:travelled*3.2,block:(i*5)%blocks.length};
  }
  function addPerson(b,i,time){
    const p=personPose(i,time),s=Math.sin(p.yaw),c=Math.cos(p.yaw),swing=Math.sin(p.stride),coat=coats[i%coats.length],skin=skins[(i*3)%skins.length],tall=.92+hash(i+9)*.2;
    const part=(x,y,z,w,h,d,color,tilt=0)=>b.box(p.x+x*c+z*s,y*tall,p.z-x*s+z*c,w,h*tall,d,color,p.yaw+tilt);
    for(const side of [-1,1]){part(side*.11,.42,swing*side*.16,.14,.8,.16,'#39413f');part(side*.29,1.18,-swing*side*.14,.11,.62,.13,coat);}
    part(0,1.2,0,.46,.78,.28,coat);part(0,1.78,0,.26,.3,.26,skin);part(0,1.96,-.02,.28,.09,.28,i%3===0?'#2f2a26':'#5a4636');
    if(i%5===2)part(.34,.95,0,.12,.34,.3,'#7d5b3e');
    if(i%7===3){part(0,2.28,0,.035,.65,.035,'#2f3836');part(0,2.6,0,1.05,.1,1.05,i%2?'#a94f45':'#3c5a66');}
  }

  // Boats share a long, narrow circuit: north along the west lane, south along the east lane.
  const boats=[{kind:'ferry',name:'Canal ferry',speed:1.7,length:4.6,color:'#e4dcc4'},{kind:'barge',name:'Supply barge',speed:1.15,length:5.2,color:'#8e6a4c'},{kind:'rowboat',name:'Rowing boat',speed:1.4,length:2.2,color:'#c06a4d'}];
  function boatPose(i,time){const boat=boats[i],p=City.loopPose(57,0,2,50,1.99,time*boat.speed+i*71);return {x:p.x,z:p.z,yaw:p.yaw};}
  function addBoat(b,i,time){
    const boat=boats[i],p=boatPose(i,time),s=Math.sin(p.yaw),c=Math.cos(p.yaw),L=boat.length,bob=Math.sin(time*1.7+i*2)*.04;
    const part=(x,y,z,w,h,d,color,glow=0)=>b.box(p.x+x*c+z*s,y+bob,p.z-x*s+z*c,w,h,d,color,p.yaw,glow);
    part(0,.18,0,1.25,.3,L,boat.color);part(0,.35,L/2-.15,.9,.12,.35,boat.color);part(0,.36,0,1.32,.07,L-.2,'#5b4a3a');
    if(boat.kind==='ferry'){part(0,.78,-.3,1.05,.75,2.4,'#f0e8d2');part(0,.85,-.3,1.08,.28,2.2,'#4f6f73',.85);part(0,1.2,-.3,1.15,.08,2.6,'#3e5a5c');part(0,.4,L/2-.05,.2,.12,.05,'#ead6a1',1);}
    else if(boat.kind==='barge'){for(let k=-1;k<=1;k++)part(0,.62,k*1.3,.95,.55,1.1,['#9b7d4f','#6d8a83','#b0574a'][k+1]);part(0,.95,-L/2+.6,.8,.9,.8,'#ddd2b6');part(0,1.05,-L/2+.6,.82,.2,.6,'#4f6f73',.85);}
    else{part(0,.38,0,.9,.06,.25,'#6b4a36');part(0,.62,-.2,.32,.45,.26,'#3f5f6b');part(0,.86,-.2,.2,.2,.2,'#e0be98');const oar=Math.sin(time*2.4+i)*.5;for(const side of [-1,1])b.box(p.x+side*.8*c,.4+bob,p.z-side*.8*s,.08,.05,1.5,'#7a5a3f',p.yaw+oar*side);}
  }

  // A small flock wheeling above the park; wings beat, then glide.
  const BIRDS=11;
  function birdPose(i,time){const centre={x:-12+Math.sin(time*.05)*6,z:12+Math.cos(time*.04)*6},a=time*.32+i*.55,r=13+(i%4)*1.6;return {x:centre.x+Math.cos(a)*r,y:30+Math.sin(time*.6+i)*1.4+(i%3)*.8,z:centre.z+Math.sin(a)*r,yaw:Math.atan2(-Math.sin(a),Math.cos(a))};}
  function addBird(b,i,time){
    const p=birdPose(i,time),s=Math.sin(p.yaw),c=Math.cos(p.yaw),beat=Math.sin(time*9+i*1.3),flap=(Math.sin(time*.7+i)>.2?beat:.15)*.45,tone='#2f3b3a';
    const at=(x,y,z)=>[p.x+x*c+z*s,p.y+y,p.z-x*s+z*c];
    b.box(p.x,p.y,p.z,.16,.12,.5,tone,p.yaw);
    for(const side of [-1,1]){b.triangle(at(side*.06,0,.12),at(side*.06,0,-.12),at(side*.75,flap,-.05),tone);}
  }

  // Chimney smoke from the makers' warehouse.
  function addSmoke(b,time){const w=City.landmarks.find(p=>p.id==='projects');for(let i=0;i<6;i++){const k=(time*.22+i/6)%1,size=(.45+k*1.25)*(1-Math.max(0,(k-.72)/.28));if(size<=.02)continue;b.box(w.x+3.7+k*1.8+Math.sin(time+i)*.2,12.9+k*5.5,w.z-3-k*.6,size,size,size,'#d8d4c8',k*1.4);}}

  function add(builder,time){for(let i=0;i<PEOPLE;i++)addPerson(builder,i,time);for(let i=0;i<boats.length;i++)addBoat(builder,i,time);for(let i=0;i<BIRDS;i++)addBird(builder,i,time);addSmoke(builder,time);}
  const api={PEOPLE,BIRDS,boats,blocks,PAVEMENT,personPose,boatPose,birdPose,add};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.FieldLife=api;
})(typeof window!=='undefined'?window:globalThis);
