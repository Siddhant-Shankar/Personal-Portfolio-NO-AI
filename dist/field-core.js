/* A small first-person world: real geometry, deterministic terrain, no runtime dependencies. */
(function(root){
  'use strict';
  const landmarks=[
    {id:'about',name:'The welcome station',company:'Siddhant Shankar',kind:'welcome',x:0,z:4,color:'#d9ab68'},
    {id:'boring',name:'The tunnel workshop',company:'The Boring Company',kind:'tunnel',x:-23,z:-12,color:'#dba94d'},
    {id:'hyphenate',name:'The signal towers',company:'Hyphenate',kind:'towers',x:20,z:-22,color:'#84b8a7'},
    {id:'zaap',name:'The pocket studio',company:'Zaap AI',kind:'studio',x:34,z:7,color:'#cf8866'},
    {id:'parasol',name:'The observatory',company:'Parasol Lab',kind:'observatory',x:-14,z:-42,color:'#9aaec9'},
    {id:'teaching',name:'The open classroom',company:'Teaching at UIUC',kind:'classroom',x:-37,z:8,color:'#e0c58a'},
    {id:'zeus',name:'The listening room',company:'Zeus Learning',kind:'sound',x:-36,z:31,color:'#b89fbe'},
    {id:'apac',name:'The trading post',company:'APAC Financial',kind:'market',x:0,z:43,color:'#9cbd8e'},
    {id:'rare',name:'The model house',company:'Rare Billions',kind:'house',x:38,z:33,color:'#d5be9d'},
    {id:'projects',name:'The workbench',company:'Public projects',kind:'workshop',x:8,z:-49,color:'#8bb7c4'},
    {id:'beyond',name:'The unfinished windmill',company:'Research & open questions',kind:'windmill',x:-44,z:-27,color:'#bbc29a'}
  ].map((p,i)=>({...p,index:i,arrival:{x:p.x,z:p.z+8.5}}));
  const hub={x:0,z:22};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  function forward(yaw){return {x:Math.sin(yaw),z:-Math.cos(yaw)};}
  function nearest(position){return landmarks.map(p=>({place:p,distance:distance(position,p.arrival)})).sort((a,b)=>a.distance-b.distance)[0];}
  function canWalk(x,z){return Math.abs(x)<62&&Math.abs(z)<62&&!landmarks.some(p=>Math.abs(x-p.x)<5.6&&Math.abs(z-p.z)<5.5);}
  function slide(position,dx,dz){let x=position.x,z=position.z;if(canWalk(x+dx,z))x+=dx;if(canWalk(x,z+dz))z+=dz;return {x,z};}
  function clearLine(a,b){const length=distance(a,b),steps=Math.ceil(length/.2);for(let i=0;i<=steps;i++){const t=steps?i/steps:0;if(!canWalk(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t))return false;}return true;}
  function route(position,destination){
    const end=destination.arrival||destination;
    if(!canWalk(position.x,position.z)||!canWalk(end.x,end.z))return [];
    if(clearLine(position,end))return [{...end}];
    // Visibility graph around expanded building footprints. Every segment is walkable.
    const nodes=[{x:position.x,z:position.z},{...end}];
    landmarks.forEach(p=>{for(const x of [-6.4,6.4])for(const z of [-6.3,6.3]){const q={x:p.x+x,z:p.z+z};if(canWalk(q.x,q.z))nodes.push(q);}});
    const cost=nodes.map(()=>Infinity),previous=[],done=new Set();cost[0]=0;
    while(done.size<nodes.length){let u=-1;for(let i=0;i<nodes.length;i++)if(!done.has(i)&&(u<0||cost[i]<cost[u]))u=i;
      if(u<0||!Number.isFinite(cost[u]))return [];if(u===1)break;done.add(u);
      for(let v=0;v<nodes.length;v++){if(done.has(v)||!clearLine(nodes[u],nodes[v]))continue;const candidate=cost[u]+distance(nodes[u],nodes[v]);if(candidate<cost[v]){cost[v]=candidate;previous[v]=u;}}
    }
    const points=[];for(let i=1;i!==0;i=previous[i]){if(i===undefined)return [];points.unshift(nodes[i]);}return points;
  }
  function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
  function view(x,y,z,yaw,pitch){const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);const right=[cy,0,sy],up=[-sy*sp,cp,cy*sp],back=[-sy*cp,-sp,cy*cp];return new Float32Array([right[0],up[0],back[0],0,right[1],up[1],back[1],0,right[2],up[2],back[2],0,-(right[0]*x+right[2]*z),-(up[0]*x+up[1]*y+up[2]*z),-(back[0]*x+back[1]*y+back[2]*z),1]);}
  function multiply(a,b){const r=new Float32Array(16);for(let c=0;c<4;c++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)r[c*4+row]+=a[k*4+row]*b[c*4+k];return r;}
  function project(matrix,x,y,z){const w=matrix[3]*x+matrix[7]*y+matrix[11]*z+matrix[15];return {x:(matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12])/w,y:(matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13])/w,w};}
  function random(seed=7391){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  function color(hex){return hex.replace('#','').match(/../g).map(v=>parseInt(v,16)/255);}
  function builder(){
    const data=[],rand=random();
    function box(x,y,z,w,h,d,c,angle=0){
      if(typeof c==='string')c=color(c);const cs=Math.cos(angle),sn=Math.sin(angle);
      const faces=[[[1,0,0],[[1,-1,-1],[1,1,-1],[1,1,1],[1,-1,1]]],[[-1,0,0],[[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,-1,-1]]],[[0,1,0],[[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1]]],[[0,-1,0],[[-1,-1,1],[-1,-1,-1],[1,-1,-1],[1,-1,1]]],[[0,0,1],[[1,-1,1],[1,1,1],[-1,1,1],[-1,-1,1]]],[[0,0,-1],[[-1,-1,-1],[-1,1,-1],[1,1,-1],[1,-1,-1]]]];
      for(const [normal,points] of faces){const shade=.96+rand()*.08;for(const i of [0,1,2,0,2,3]){const p=points[i],px=p[0]*w/2,pz=p[2]*d/2;data.push(x+px*cs+pz*sn,y+p[1]*h/2,z-px*sn+pz*cs,normal[0]*cs+normal[2]*sn,normal[1],-normal[0]*sn+normal[2]*cs,c[0]*shade,c[1]*shade,c[2]*shade);}}
    }
    function triangle(a,b,c,tint){if(typeof tint==='string')tint=color(tint);const u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n)||1;for(const p of [a,b,c])data.push(...p,...n.map(v=>v/l),...tint);}
    function cone(x,y,z,r,h,tint,sides=5){for(let i=0;i<sides;i++){const a=i/sides*Math.PI*2,b=(i+1)/sides*Math.PI*2;triangle([x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x,y+h,z],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],tint);}}
    function roof(x,y,z,w,h,d,tint){const a=[x-w/2,y,z-d/2],b=[x+w/2,y,z-d/2],c=[x-w/2,y,z+d/2],e=[x+w/2,y,z+d/2],u=[x,y+h,z-d/2],v=[x,y+h,z+d/2];triangle(a,c,v,tint);triangle(a,v,u,tint);triangle(b,u,v,tint);triangle(b,v,e,tint);triangle(a,u,b,'#cbb68d');triangle(c,e,v,'#cbb68d');}
    return {box,triangle,cone,roof,finish:()=>new Float32Array(data)};
  }
  function mesh(){
    const {box,cone,roof,finish}=builder(),rand=random(),stone=color('#a0997d'),wood=color('#826449'),grass=color('#8b9c64');
    // The irregular tiled meadow gives the world its hand-built, rough surface.
    for(let x=-96;x<96;x+=4)for(let z=-96;z<96;z+=4){const v=.95+Math.sin(x*.11)*Math.cos(z*.1)*.055+rand()*.04;box(x,-.22-rand()*.025,z,4.02,.4,4.02,grass.map(n=>n*v));}
    function path(a,b){const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),angle=Math.atan2(dx,dz);for(let s=0;s<len;s+=1.7){const t=s/len;box(a.x+dx*t,.015,a.z+dz*t,2.1+rand()*.5,.06,1.8,'#c3ac7e',angle);}}
    landmarks.forEach(p=>{let start=hub;for(const next of route(hub,p)){path(start,next);start=next;}});box(0,.025,22,10,.09,10,'#bca97b');
    function fence(x,z){box(x,.65,z,.17,1.3,.17,wood);box(x+1,.95,z,2,.16,.13,wood);box(x+1,.5,z,2,.14,.13,wood);}
    function tree(x,z,size=1){box(x,.01,z,3.4*size,.025,3*size,'#788857',.3);box(x,1.4*size,z,.46*size,2.8*size,.46*size,'#786347');if(rand()>.35){cone(x,1.8*size,z,2.1*size,3.6*size,'#516e50');cone(x,3.2*size,z,1.65*size,2.8*size,'#668453');cone(x,4.4*size,z,1.1*size,2.1*size,'#82965e');}else{box(x,3.1*size,z,2.9*size,2.3*size,2.8*size,'#6c854f',.3);box(x-.6*size,4.3*size,z,2.1*size,1.8*size,2.2*size,'#91a362',-.2);box(x+1.1*size,2.9*size,z+.7*size,1.8*size,1.6*size,1.7*size,'#7d925a',.4);}}
    // Peripheral formations frame the walkable field without becoming invisible walls.
    for(let i=0;i<85;i++){const a=i/85*Math.PI*2,r=73+rand()*18,h=4+rand()*13;box(Math.sin(a)*r,h/2-1,Math.cos(a)*r,7+rand()*8,h,8+rand()*7,i%3?'#9caa88':'#b7b18d',rand()*.3);}
    for(let i=0;i<115;i++){const x=rand()*118-59,z=rand()*118-59;if(landmarks.some(p=>Math.hypot(x-p.x,z-p.z)<10)||Math.hypot(x,z-22)<11)continue;if(i%3===0)tree(x,z,.7+rand()*.5);else box(x,.18,z,.6+rand(),.4,.6+rand(),stone,rand());}
    for(let i=0;i<1800;i++){const x=rand()*120-60,z=rand()*120-60;if(landmarks.some(p=>Math.hypot(x-p.x,z-p.z)<7))continue;const h=.18+rand()*.28;cone(x,0,z,.08,h,i%12?'#99ab70':'#e2c980',3);}
    for(const p of landmarks){const {x,z}=p,c=color(p.color),dark='#394f4e',cream='#dfd0aa';
      box(x+1.4,.008,z-1,9.5,.025,7.2,'#778252',.12);box(x,.08,z+7.3,4,.16,2.8,'#c5b591');
      // Every destination has the same welcoming marker, but a different silhouette.
      box(x-2.5,1.3,z+7,.17,2.6,.17,wood);box(x-2.5,2.25,z+7,1.15,.55,.16,c);box(x-2.5,2.65,z+7,.36,.25,.3,'#efe1ad');
      if(p.kind==='tunnel'){
        for(let j=-3;j<=3;j++){box(x+j*1.35,4.8-Math.abs(j)*.58,z,1.4,1.2,5.5,'#ab9c7d');}box(x-4.3,1.8,z,1.4,3.6,5.5,'#9b9076');box(x+4.3,1.8,z,1.4,3.6,5.5,'#9b9076');box(x,1.8,z-2.6,7,3.6,.2,'#263b3a');
        box(x,1,z+2.4,3,1.4,3.8,c);box(x,2,z+1.6,1.7,1.2,1.9,c);box(x,2.15,z+2.62,1.35,.65,.1,dark);for(const a of [-1,1])for(const b of [-1,1])box(x+a*1.5,.5,z+2.4+b*1.2,.5,.9,.9,'#3c4140');for(let j=-3;j<=3;j++)box(x+j,.07,z+4,.1,.12,3,'#827553');
      }else if(p.kind==='towers'){
        for(let t=-1;t<=1;t++)for(let k=0;k<3+t;k++){box(x+t*3,1+k*1.9,z,2.3,1.55,2.8,c.map(n=>n*(.82+k*.08)));box(x+t*3,1+k*1.9,z+1.42,1.5,.2,.1,cream);}box(x,3,z,8.5,.35,.8,wood);
      }else if(p.kind==='observatory'){
        box(x,1.8,z,5,3.6,5,'#aaa58a');box(x,4,z,6,.7,6,c);box(x,4.7,z,4.4,.75,4.4,c);box(x,5.35,z,2.8,.7,2.8,c);box(x,5.9,z,1.4,.5,1.4,cream);box(x,4.8,z+2.5,1,1,4,dark);box(x,2,z+2.56,1.3,2.8,.15,dark);
      }else if(p.kind==='windmill'){
        box(x,3,z,1.8,6,1.8,wood);box(x,5.7,z+1.1,.65,8,.35,cream);box(x,5.7,z+1.1,8,.65,.35,cream);box(x,5.7,z+1.35,1.1,1.1,.5,c);for(let j=0;j<3;j++)box(x+3, .35+j*.5,z+2,3,.35,.7,wood);
      }else if(p.kind==='classroom'){
        for(let row=0;row<3;row++){box(x,.4+row*.2,z+row*1.8,7,.55,1.1,'#a59a7e');}box(x,2.1,z-2.4,6,3,.35,dark);box(x,2.1,z-2.15,4.5,.08,.1,cream);box(x-2.9,1.4,z-2.3,.2,2.8,.2,wood);box(x+2.9,1.4,z-2.3,.2,2.8,.2,wood);
      }else if(p.kind==='welcome'){
        for(const a of [-1,1])box(x+a*2.6,1.6,z,.25,3.2,.25,wood);box(x,3.3,z,6,.4,3.5,c);box(x,2.1,z,4.4,1.7,.35,'#526c5b');box(x,2.4,z+.19,2.8,.12,.03,cream);box(x,1.85,z+.19,3.4,.1,.03,cream);
      }else{
        const h=p.kind==='house'?2.5:3.3;box(x,h/2,z,7,h,5,p.kind==='house'?cream:c);roof(x,h+.05,z,8,2.1,6,p.kind==='studio'?'#af7654':p.kind==='sound'?'#86778c':p.kind==='workshop'?'#547b80':'#87916c');box(x,h+2.15,z,.2,.16,6.2,'#5f6550');box(x,1.2,z+2.55,1.3,2.4,.15,dark);for(const side of [-1,1])box(x+side*2.1,1.7,z+2.58,1.5,1.3,.12,'#7da5a3');
        if(p.kind==='house'){box(x+2.4,h+1.4,z,2.3,2.3,3.7,cream);box(x+2.4,h+2.65,z,2.8,.25,4.2,wood);}
        if(p.kind==='studio'){for(let j=0;j<3;j++)box(x-2+j*2,4.2+j*.25,z,1.2,1.2,.4,'#e1bf6c');}
        if(p.kind==='sound'){for(const side of [-1,1]){box(x+side*3,4.3,z,1.1,1.7,1.2,dark);box(x+side*3,4.3,z+.63,.6,.8,.1,cream);}}
        if(p.kind==='market'){for(let j=0;j<5;j++)box(x-3.2+j*1.6,2.8,z+3.25,1.6,.25,2.2,j%2?cream:c);}
        if(p.kind==='workshop'){box(x+3.8,.9,z+4,3,1.8,1.4,wood);for(let j=0;j<3;j++)box(x-2+j*2,3.95,z,1.7,.2,3,'#486b76');}
      }
      fence(x-5,z+4.8);fence(x+3,z+4.8);
    }
    // A quiet gathering spot and a brook at the edge of the meadow.
    for(let i=0;i<10;i++){const a=i/10*Math.PI*2;box(-9+Math.cos(a)*1.1,.15,19+Math.sin(a)*1.1,.48,.3,.42,stone,a);}
    box(-9,.18,19,1.4,.18,.24,wood,.6);box(-9,.24,19,1.3,.18,.24,wood,-.7);cone(-9,.25,19,.35,.6,'#d99851',5);
    for(const z of [15.5,22.5]){box(-9,.4,z,3.2,.6,.7,'#8d7250',.12);}
    for(let z=-66;z<67;z+=3){const x=55+Math.sin(z*.09)*2;box(x,-.003,z,5,.035,3.1,'#799f9a');box(x+2.8,.02,z,.7,.16,3.1,'#aaa77e');}
    for(let i=0;i<11;i++)box(50+i*.8,.26,22,.72,.2,3,'#a28b5f');
    return finish();
  }
  const api={landmarks,hub,clamp,distance,forward,nearest,canWalk,clearLine,slide,route,perspective,view,multiply,project,mesh,builder,random};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.FieldCore=api;
})(typeof window!=='undefined'?window:globalThis);
