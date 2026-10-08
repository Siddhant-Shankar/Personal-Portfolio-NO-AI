/* A small first-person world: real geometry, deterministic terrain, no runtime dependencies. */
(function(root){
  'use strict';
  const City=typeof module==='object'&&module.exports?require('./field-city.js'):root.FieldCity;
  const landmarks=City.landmarks,blockers=City.blockers,hub={x:0,z:24};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  function forward(yaw){return {x:Math.sin(yaw),z:-Math.cos(yaw)};}
  function nearest(position){return landmarks.map(p=>({place:p,distance:distance(position,p.arrival)})).sort((a,b)=>a.distance-b.distance)[0];}
  function canWalk(x,z){return Math.abs(x)<62&&Math.abs(z)<62&&!blockers.some(p=>Math.abs(x-p.x)<5.6&&Math.abs(z-p.z)<5.5);}
  function slide(position,dx,dz){let x=position.x,z=position.z;if(canWalk(x+dx,z))x+=dx;if(canWalk(x,z+dz))z+=dz;return {x,z};}
  function clearLine(a,b){const length=distance(a,b),steps=Math.ceil(length/.2);for(let i=0;i<=steps;i++){const t=steps?i/steps:0;if(!canWalk(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t))return false;}return true;}
  function route(position,destination){
    const end=destination.arrival||destination;
    if(!canWalk(position.x,position.z)||!canWalk(end.x,end.z))return [];
    if(clearLine(position,end))return [{...end}];
    // Visibility graph around expanded building footprints. Every segment is walkable.
    const nodes=[{x:position.x,z:position.z},{...end}];
    blockers.forEach(p=>{for(const x of [-6.4,6.4])for(const z of [-6.3,6.3]){const q={x:p.x+x,z:p.z+z};if(canWalk(q.x,q.z))nodes.push(q);}});
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
  function mesh(){return City.mesh(api);}
  const api={landmarks,blockers,hub,clamp,distance,forward,nearest,canWalk,clearLine,slide,route,perspective,view,multiply,project,mesh,builder,random};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.FieldCore=api;
})(typeof window!=='undefined'?window:globalThis);
