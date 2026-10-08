/* A small first-person world: real geometry, deterministic terrain, no runtime dependencies. */
(function(root){
  'use strict';
  const City=typeof module==='object'&&module.exports?require('./field-city.js'):root.FieldCity;
  const landmarks=City.landmarks,blockers=City.blockers,hub={x:0,z:24};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  function forward(yaw){return {x:Math.sin(yaw),z:-Math.cos(yaw)};}
  function nearest(position){return landmarks.map(p=>({place:p,distance:distance(position,p.arrival)})).sort((a,b)=>a.distance-b.distance)[0];}
  // Feet collide with buildings, street furniture, and the canal. BODY is the visitor's radius around a prop.
  const BODY=.3,props=City.props;
  function canWalk(x,z){return Math.abs(x)<62&&Math.abs(z)<62&&!blockers.some(p=>Math.abs(x-p.x)<5.6&&Math.abs(z-p.z)<5.5)&&!City.inWater(x,z)&&!props.some(p=>Math.abs(x-p.x)<p.hx+BODY&&Math.abs(z-p.z)<p.hz+BODY);}
  function canFly(x,y,z){return !blockers.some(p=>Math.abs(x-p.x)<6&&Math.abs(z-p.z)<6&&y<(p.height||15)+2);}
  // Optional `blocked` adds moving obstacles (cars, people, animals) on top of the static city.
  function slide(position,dx,dz,blocked){const ok=(x,z)=>canWalk(x,z)&&!(blocked&&blocked(x,z));let x=position.x,z=position.z;if(ok(x+dx,z))x+=dx;if(ok(x,z+dz))z+=dz;return {x,z};}
  function clearLine(a,b){const length=distance(a,b),steps=Math.ceil(length/.2);for(let i=0;i<=steps;i++){const t=steps?i/steps:0;if(!canWalk(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t))return false;}return true;}
  // Route planning: A* over a half-metre walkability grid, then string-pulled into a few straight legs.
  const CELL=.5,N=Math.round(124/CELL);let grid=null;
  const centre=k=>-62+(k+.5)*CELL,cellIndex=v=>Math.max(0,Math.min(N-1,Math.floor((v+62)/CELL)));
  function walkGrid(){if(grid)return grid;grid=new Uint8Array(N*N);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=centre(i),z=centre(j);grid[j*N+i]=canWalk(x,z)&&canWalk(x-.26,z-.26)&&canWalk(x+.26,z-.26)&&canWalk(x-.26,z+.26)&&canWalk(x+.26,z+.26)?1:0;}return grid;}
  function snap(p){const g=walkGrid(),ci=cellIndex(p.x),cj=cellIndex(p.z);let best=-1,bestD=Infinity;for(let r=0;r<=4&&best<0;r++)for(let j=cj-r;j<=cj+r;j++)for(let i=ci-r;i<=ci+r;i++){if(i<0||j<0||i>=N||j>=N||!g[j*N+i])continue;const q={x:centre(i),z:centre(j)},d=distance(p,q);if(d<bestD&&clearLine(p,q)){best=j*N+i;bestD=d;}}return best;}
  function astar(start,goal){
    const g=walkGrid(),cost=new Float32Array(N*N).fill(Infinity),from=new Int32Array(N*N).fill(-1),closed=new Uint8Array(N*N),heap=[],gx=goal%N,gz=Math.floor(goal/N);
    const h=k=>{const dx=Math.abs(k%N-gx),dz=Math.abs(Math.floor(k/N)-gz);return Math.max(dx,dz)+.4142*Math.min(dx,dz);};
    const push=(k,f)=>{heap.push([f,k]);let n=heap.length-1;while(n>0){const p=(n-1)>>1;if(heap[p][0]<=heap[n][0])break;[heap[p],heap[n]]=[heap[n],heap[p]];n=p;}};
    const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let n=0;for(;;){const l=2*n+1,r=l+1;let m=n;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===n)break;[heap[m],heap[n]]=[heap[n],heap[m]];n=m;}}return top;};
    cost[start]=0;push(start,h(start));
    while(heap.length){const [,k]=pop();if(closed[k])continue;if(k===goal)break;closed[k]=1;const x=k%N,z=Math.floor(k/N);
      for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=N||nz>=N)continue;const n=nz*N+nx;if(!g[n]||closed[n])continue;if(dx&&dz&&(!g[z*N+nx]||!g[nz*N+x]))continue;const c=cost[k]+(dx&&dz?1.4142:1);if(c<cost[n]){cost[n]=c;from[n]=k;push(n,c+h(n));}}
    }
    if(start!==goal&&from[goal]<0)return null;const cells=[];for(let k=goal;k!==start;k=from[k])cells.unshift({x:centre(k%N),z:centre(Math.floor(k/N))});return cells;
  }
  function route(position,destination){
    const end=destination.arrival||destination;
    if(!canWalk(position.x,position.z)||!canWalk(end.x,end.z))return [];
    if(clearLine(position,end))return [{x:end.x,z:end.z}];
    const s=snap(position),e=snap(end);if(s<0||e<0)return [];
    const cells=astar(s,e);if(!cells)return [];
    const points=[{x:centre(s%N),z:centre(Math.floor(s/N))},...cells,{x:end.x,z:end.z}],legs=[];let anchor={x:position.x,z:position.z},i=0;
    while(i<points.length){let best=i;for(let k=i+1;k<points.length&&clearLine(anchor,points[k]);k++)best=k;anchor=points[best];legs.push(anchor);i=best+1;}
    return legs;
  }
  function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
  function view(x,y,z,yaw,pitch){const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);const right=[cy,0,sy],up=[-sy*sp,cp,cy*sp],back=[-sy*cp,-sp,cy*cp];return new Float32Array([right[0],up[0],back[0],0,right[1],up[1],back[1],0,right[2],up[2],back[2],0,-(right[0]*x+right[2]*z),-(up[0]*x+up[1]*y+up[2]*z),-(back[0]*x+back[1]*y+back[2]*z),1]);}
  function multiply(a,b){const r=new Float32Array(16);for(let c=0;c<4;c++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)r[c*4+row]+=a[k*4+row]*b[c*4+k];return r;}
  function project(matrix,x,y,z){const w=matrix[3]*x+matrix[7]*y+matrix[11]*z+matrix[15];return {x:(matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12])/w,y:(matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13])/w,w};}
  function random(seed=7391){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  const STRIDE=10;
  function color(hex){return hex.replace('#','').match(/../g).map(v=>parseInt(v,16)/255);}
  function builder(){
    const data=[],rand=random();
    // Each vertex: position, normal, colour, and glow (how strongly it lights up after dark).
    function box(x,y,z,w,h,d,c,angle=0,glow=0){
      if(typeof c==='string')c=color(c);const cs=Math.cos(angle),sn=Math.sin(angle);
      const faces=[[[1,0,0],[[1,-1,-1],[1,1,-1],[1,1,1],[1,-1,1]]],[[-1,0,0],[[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,-1,-1]]],[[0,1,0],[[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1]]],[[0,-1,0],[[-1,-1,1],[-1,-1,-1],[1,-1,-1],[1,-1,1]]],[[0,0,1],[[1,-1,1],[1,1,1],[-1,1,1],[-1,-1,1]]],[[0,0,-1],[[-1,-1,-1],[-1,1,-1],[1,1,-1],[1,-1,-1]]]];
      for(const [normal,points] of faces){const shade=.96+rand()*.08;for(const i of [0,1,2,0,2,3]){const p=points[i],px=p[0]*w/2,pz=p[2]*d/2;data.push(x+px*cs+pz*sn,y+p[1]*h/2,z-px*sn+pz*cs,normal[0]*cs+normal[2]*sn,normal[1],-normal[0]*sn+normal[2]*cs,c[0]*shade,c[1]*shade,c[2]*shade,glow);}}
    }
    function triangle(a,b,c,tint,glow=0){if(typeof tint==='string')tint=color(tint);const u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n)||1;for(const p of [a,b,c])data.push(...p,...n.map(v=>v/l),...tint,glow);}
    function cone(x,y,z,r,h,tint,sides=5){for(let i=0;i<sides;i++){const a=i/sides*Math.PI*2,b=(i+1)/sides*Math.PI*2;triangle([x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x,y+h,z],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],tint);}}
    function roof(x,y,z,w,h,d,tint){const a=[x-w/2,y,z-d/2],b=[x+w/2,y,z-d/2],c=[x-w/2,y,z+d/2],e=[x+w/2,y,z+d/2],u=[x,y+h,z-d/2],v=[x,y+h,z+d/2];triangle(a,c,v,tint);triangle(a,v,u,tint);triangle(b,u,v,tint);triangle(b,v,e,tint);triangle(a,u,b,'#cbb68d');triangle(c,e,v,'#cbb68d');}
    return {box,triangle,cone,roof,finish:()=>new Float32Array(data)};
  }
  function mesh(){return City.mesh(api);}
  const api={STRIDE,BODY,groundAt:City.groundAt,walkGrid,city:City,landmarks,blockers,hub,clamp,distance,forward,nearest,canWalk,canFly,clearLine,slide,route,perspective,view,multiply,project,mesh,builder,random};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.FieldCore=api;
})(typeof window!=='undefined'?window:globalThis);
