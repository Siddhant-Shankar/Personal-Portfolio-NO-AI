/* An original miniature city: architecture is a navigation metaphor, not an employer site model. */
(function(root){
  'use strict';
  const landmarks=[
    {id:'about',name:'Central station',company:'Siddhant Shankar',kind:'welcome',x:12,z:12,height:14,color:'#ddba7b'},
    {id:'boring',name:'The infrastructure yard',company:'The Boring Company',kind:'tunnel',x:-36,z:-12,height:12,color:'#d8a64e'},
    {id:'hyphenate',name:'The finance towers',company:'Hyphenate',kind:'towers',x:12,z:-12,height:31,color:'#86b3ad'},
    {id:'zaap',name:'The product studio',company:'Zaap AI',kind:'studio',x:36,z:12,height:17,color:'#c78c70'},
    {id:'parasol',name:'The research observatory',company:'Parasol Lab',kind:'observatory',x:-12,z:-36,height:23,color:'#92a8be'},
    {id:'teaching',name:'The city campus',company:'Teaching at UIUC',kind:'classroom',x:-36,z:12,height:15,color:'#c1b586'},
    {id:'zeus',name:'The learning arcade',company:'Zeus Learning',kind:'sound',x:-36,z:36,height:12,color:'#a399ba'},
    {id:'apac',name:'The exchange building',company:'APAC Financial',kind:'market',x:-12,z:36,height:25,color:'#a0b6a3'},
    {id:'rare',name:'The design gallery',company:'Rare Billions',kind:'house',x:36,z:36,height:15,color:'#d1bda0'},
    {id:'projects',name:'The makers’ warehouse',company:'Public projects',kind:'workshop',x:12,z:-36,height:13,color:'#81a3ac'},
    {id:'beyond',name:'The rooftop garden',company:'Research & open questions',kind:'garden',x:-36,z:-36,height:18,color:'#a8bb8b'}
  ].map((p,i)=>({...p,index:i,arrival:{x:p.x,z:p.z+8.5}}));
  const streets=[-48,-24,0,24,48];
  const infill=[{x:36,z:-36,height:16,color:'#ad9c8e'},{x:36,z:-12,height:21,color:'#839c9e'},{x:-12,z:-12,height:19,color:'#b4a588'},{x:12,z:36,height:11,color:'#bca58b'}];
  const blockers=[...landmarks,...infill];
  function mesh(F){
    const {box,cone,roof,finish}=F.builder(),rand=F.random(29417),ink='#354f50',stone='#c9bea7',paving='#b5b2a0',asphalt='#647876',glass='#7babae',warm='#e9d39e';
    // A continuous city surface with clearly separated roads, curbs, and blocks.
    box(0,-.2,0,194,.4,194,'#8e9a89');box(0,.005,0,110,.045,110,'#a7ac9b');
    for(const x of [-36,-12,12,36])for(const z of [-36,-12,12,36]){
      box(x,.11,z,19.5,.2,19.5,paving);box(x,.23,z,17.8,.04,17.8,'#bdb8a6');
      for(let i=-8;i<=8;i+=2){box(x+i,.257,z,.035,.014,17,'#a9a795');box(x,.257,z+i,17,.014,.035,'#a9a795');}
    }
    for(const n of streets){
      box(n,.055,0,5.4,.055,104,asphalt);box(0,.06,n,104,.055,5.4,asphalt);
      for(let j=-50;j<=50;j+=4){if(streets.some(k=>Math.abs(j-k)<4))continue;box(n,.092,j,.1,.015,1.9,'#d6cfae');box(j,.097,n,1.9,.015,.1,'#d6cfae');}
      for(const m of streets)for(let j=-2;j<=2;j++){box(n+j*.8,.11,m+3.4,.45,.025,1.45,'#d5d2b9');box(n+3.4,.115,m+j*.8,1.45,.025,.45,'#d5d2b9');}
    }
    function tree(x,z,scale=1,y=0){box(x,y+.4,z,1.8,.7,1.8,'#9c9981');box(x,y+1.8*scale,z,.3*scale,3*scale,.3*scale,'#786852');box(x,y+3.6*scale,z,2.2*scale,2.4*scale,2.2*scale,'#6a845b',.22);box(x-.4*scale,y+4.8*scale,z,1.6*scale,1.3*scale,1.7*scale,'#97a671',-.18);}
    function lamp(x,z){box(x,2.1,z,.13,4.2,.13,ink);box(x+.5,4.15,z,1.2,.14,.15,ink);box(x+1,4.02,z,.55,.2,.5,warm);box(x,.2,z,.38,.4,.38,ink);}
    function windows(x,z,w,d,h,color=glass,base=0){
      for(let y=base+2;y<base+h-.4;y+=2.5){
        for(let dx=-w/2+1;dx<w/2;dx+=1.8){box(x+dx,y,z+d/2+.02,1,.95,.065,color);box(x+dx,y,z-d/2-.02,1,.95,.065,color);}
        for(let dz=-d/2+1;dz<d/2;dz+=1.8){box(x+w/2+.02,y,z+dz,.065,.95,1,color);box(x-w/2-.02,y,z+dz,.065,.95,1,color);}
      }
    }
    function tower(x,z,w,d,h,color){
      box(x,h/2+.26,z,w,h,d,color);windows(x,z,w,d,h);
      for(let y=3;y<h;y+=2.5)box(x,y,z,w+.15,.14,d+.15,'#d1c9b3');
      box(x,h+.38,z,w+.3,.3,d+.3,stone);box(x+.8,h+.95,z-1,2.1,1,1.4,'#778a82');
      box(x,1.75,z+d/2+.1,1.8,3,.2,ink);box(x,3.45,z+d/2+.5,3.5,.22,1,stone);
    }
    function shop(x,z,h,color){tower(x,z,8.4,8.4,h,color);for(let i=-1;i<=1;i++){box(x+i*2.7,1.8,z+4.28,2.1,2.5,.1,ink);box(x+i*2.7,3.2,z+4.75,2.4,.18,1.1,i%2?warm:color);}box(x,h+.7,z,5,.4,5,'#7c9367');}
    // The eleven chapters have different silhouettes, street entrances, and roof lines.
    for(const p of landmarks){const {x,z,height:h,color:c}=p;
      box(x+1,.27,z-.3,11,.025,11,'#969f8d');
      if(p.kind==='towers'){
        tower(x-2.4,z,4.2,7.7,24,c);tower(x+2.25,z-.6,4.1,6.5,29,'#779e9e');box(x,15,z+.4,8,.6,2.4,'#c5c5ac');box(x+2.3,31,z-.5,.13,3,.13,ink);
      }else if(p.kind==='tunnel'){
        box(x,3,z-1.5,10,5.5,6.5,'#a59981');roof(x,5.8,z-1.5,10.4,1.5,7,'#71857e');box(x,2.6,z+1.9,4.9,4.6,.15,ink);box(x-3.9,2.4,z+2.1,1.1,4.6,.3,stone);box(x+3.9,2.4,z+2.1,1.1,4.6,.3,stone);
        box(x,1.1,z+3,3,1.6,3.6,c);box(x,2.3,z+2.2,1.8,1.4,1.8,c);box(x,2.5,z+3.14,1.4,.7,.08,glass);for(const a of [-1,1])for(const b of [-1,1])box(x+a*1.5,.7,z+3+b*1.1,.5,1,.9,ink);
        box(x-4,6,z-3,.3,12,.3,c);box(x,11.8,z-3,9,.35,.35,c);box(x+3.8,9.2,z-3,.045,5,.045,ink);for(let i=-3;i<4;i++)box(x+i,11.3,z-3,.1,1,.1,c,.4);
      }else if(p.kind==='observatory'){
        tower(x,z,8.3,8.3,15,'#a8b0ae');box(x,16,z,9,.8,9,stone);cone(x,16.4,z,4,4.6,c,10);box(x,19,z+2.1,.9,.9,4.4,ink);box(x,21,z,.12,4,.12,ink);
      }else if(p.kind==='welcome'){
        tower(x,z,9.4,8.5,6.8,'#cabd9c');roof(x,7.1,z,10,1.8,9.2,'#6c8c82');box(x-2.5,10,z,2.8,6,2.8,c);box(x-2.5,13.1,z,3.2,.3,3.2,stone);box(x-2.5,11.6,z+1.44,1.5,1.5,.08,warm);box(x-2.5,11.7,z+1.5,.08,.55,.03,ink);box(x-2.25,11.7,z+1.5,.55,.08,.03,ink);
      }else if(p.kind==='classroom'){
        tower(x,z,9.5,8.5,11.5,'#bca783');roof(x,11.8,z,10.2,2.2,9.2,'#7c927f');for(let i=-3;i<=3;i+=2)box(x+i,2,z+4.6,.4,4,.45,stone);box(x,4.3,z+4.4,9,.35,1,stone);
      }else if(p.kind==='studio'){
        shop(x,z,12,c);box(x+1,14,z-1,5.6,3.5,5.6,'#e0ccab');windows(x+1,z-1,5.6,5.6,3.5,glass,12.5);box(x+1,16,z-1,6,.25,6,'#7f9678');
      }else if(p.kind==='market'){
        tower(x,z,9.5,9.5,17,'#a0aca0');tower(x,z,6.8,6.8,23,c);box(x,24,z,7.2,.5,7.2,stone);for(let i=-3;i<=3;i+=2)box(x+i,2,z+4.9,.45,4,.45,stone);
      }else if(p.kind==='sound'){
        shop(x,z,9,c);box(x,10.3,z,8,.6,8,stone);box(x,7.8,z+4.4,6,1.4,.3,'#d5c496');for(let i=-2;i<=2;i++)box(x+i,7.8,z+4.58,.12,.5,.03,ink);box(x,3.1,z+5,8,.35,1.6,c);
      }else if(p.kind==='workshop'){
        shop(x,z,8,c);for(let i=-1;i<=1;i++)roof(x+i*2.8,8.4,z,2.8,2.6,8.8,'#536f77');box(x+3.7,10,z-3,1,5,1,'#ad977b');
      }else if(p.kind==='garden'){
        tower(x,z,9.2,9.2,13.5,c);box(x,14,z,9.5,.3,9.5,'#7f975f');for(const a of [-2.6,2.6])for(const b of [-2.6,2.6])tree(x+a,z+b,.55,14);box(x,15,z,3.1,1.9,3.1,glass);roof(x,16,z,3.7,1.3,3.7,'#b8c7aa');
      }else{
        tower(x-1,z,7.3,8.4,9.8,'#d0c4aa');box(x+1,11.8,z-1,7.1,4,7.1,c);windows(x+1,z-1,7.1,7.1,4,glass,10);box(x+1,14,z-1,7.4,.3,7.4,stone);
      }
      // An enamel street plaque and a clear approach identify every career entrance.
      box(x-3,1.4,z+7,.12,2.5,.12,ink);box(x-3,2.4,z+7,1.5,.65,.13,c);box(x-3,2.4,z+7.08,.7,.08,.02,warm);
      box(x,.28,z+7.3,3.5,.08,3.8,stone);
      for(const dx of [-7.8,7.8])tree(x+dx,z-6,.7);lamp(x+7.7,z+7.7);
    }
    for(const p of infill){shop(p.x,p.z,p.height,p.color);tree(p.x-7.5,p.z-6,.75);lamp(p.x+7.5,p.z+7.5);}
    // A park provides a quiet place for the wildlife, enclosed by the city blocks.
    box(-12,.27,12,17,.08,17,'#8fa574');box(-12,.33,12,1.7,.03,17,'#c6bea0');box(-12,.34,12,17,.03,1.7,'#c6bea0');
    for(const x of [-19,-5])for(const z of [5,19])tree(x,z,.8);
    for(const x of [-16,-8]){box(x,.6,12,2.5,.45,.6,'#8b785b');box(x,1.05,11.7,2.5,.65,.12,'#8b785b');}
    // A canal and promenade establish a readable eastern city edge.
    box(57,.03,0,8,.1,113,'#7aa5a6');for(const x of [52,62])box(x,.18,0,1,.3,113,stone);
    for(const z of [-24,24]){box(57,.4,z,12,.45,4,stone);for(const side of [-1,1]){box(57,1,z+side*2,12,.13,.13,ink);for(let x=51;x<=63;x+=2)box(x,.7,z+side*2,.09,.7,.09,ink);}}
    for(let z=-48;z<=48;z+=12){tree(-57,z,.8);lamp(51,z);}
    // A denser, muted skyline frames the playable district, without adding fake chapters.
    for(let n=-78;n<=78;n+=12)for(const side of [-1,1]){
      const h=10+rand()*19;tower(n,side*72,7+rand()*2,8,h,side<0?'#a7af9e':'#a0aea5');
      if(Math.abs(n)<66)tower(side*76,n,8,7,8+rand()*17,'#a6b1a4');
    }
    return finish();
  }
  const api={landmarks,streets,infill,blockers,mesh};if(typeof module==='object'&&module.exports)module.exports=api;else root.FieldCity=api;
})(typeof window!=='undefined'?window:globalThis);
