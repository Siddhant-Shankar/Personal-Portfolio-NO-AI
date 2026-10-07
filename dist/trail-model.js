/* Shared deterministic rules, usable in both the browser and Node tests. */
(function(root){
  'use strict';
  const nodes=[
    ['apac',920,940,'APAC Financial','Where it starts'],
    ['rootfork',830,865,'The first fork','Choose your own route'],
    ['zeus',665,840,'Zeus Learning','Product & AI evaluation'],
    ['parasol',1030,780,'Parasol Lab','Find the research firefly','research'],
    ['rootbridge',880,740,'Woven roots','Two paths meet'],
    ['teaching',725,665,'Teaching at UIUC','Make reasoning visible'],
    ['trunk',880,610,'The old trunk','A place to catch your breath'],
    ['boring',1055,596,'The Boring Company','Find the systems firefly','systems'],
    ['about',870,490,'The common thread','Meet Siddhant'],
    ['westbridge',660,470,'The western bough','Follow your curiosity'],
    ['beyond',500,470,'Still growing','Research & open questions'],
    ['rare',600,330,'Rare Billions','Spaces you can explore'],
    ['eastbridge',1030,420,'The eastern bough','A little further up'],
    ['hyphenate',1030,325,'Hyphenate','Find the product firefly','product'],
    ['branchfork',850,300,'A fork in the canopy','There is more than one way'],
    ['projects',730,155,'The workbench','Five public experiments'],
    ['zaap',1130,215,'Zaap AI','A product of my own'],
    ['crown',920,90,'The crown','Bring three fireflies home']
  ].map(([id,x,y,label,hint,firefly])=>({id,x,y,label,hint,firefly}));
  const links=[['apac','rootfork'],['rootfork','zeus'],['rootfork','parasol'],['zeus','rootbridge'],['parasol','rootbridge'],['rootbridge','teaching'],['rootbridge','trunk'],['teaching','trunk'],['teaching','westbridge'],['trunk','boring'],['trunk','about'],['boring','eastbridge'],['about','westbridge'],['about','branchfork'],['about','eastbridge'],['westbridge','beyond'],['westbridge','rare'],['beyond','rare'],['rare','branchfork'],['rare','projects'],['eastbridge','hyphenate'],['hyphenate','branchfork'],['hyphenate','zaap'],['branchfork','projects'],['branchfork','zaap'],['projects','crown'],['zaap','crown']];
  const byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
  function neighbors(id){return links.filter(e=>e.includes(id)).map(e=>e[0]===id?e[1]:e[0]);}
  function create(){return {at:'apac',checkpoint:'apac',collected:[],visited:['apac'],hops:0,falls:0,won:false};}
  function hop(state,to){
    if(!neighbors(state.at).includes(to))return {ok:false,reason:'Choose a connected branch.'};
    if(to==='crown'&&state.collected.length<3)return {ok:false,reason:'The crown needs all three fireflies: research, systems, and product.'};
    state.at=to;state.hops++;if(!state.visited.includes(to))state.visited.push(to);
    const firefly=byId[to].firefly;let found=false;
    if(firefly&&!state.collected.includes(firefly)){state.collected.push(firefly);found=true;}
    if(firefly||to==='about')state.checkpoint=to;
    state.won=to==='crown';return {ok:true,found,won:state.won};
  }
  function direction(id,dx,dy){const n=byId[id];return neighbors(id).map(to=>{const t=byId[to],x=t.x-n.x,y=t.y-n.y;return {to,score:(x*dx+y*dy)/Math.hypot(x,y)};}).filter(v=>v.score>.25).sort((a,b)=>b.score-a.score)[0]?.to;}
  const windy=[['rootfork','parasol'],['trunk','boring'],['eastbridge','hyphenate'],['rare','projects'],['zaap','crown']];
  function wind(a,b,time){const index=windy.findIndex(e=>e.includes(a)&&e.includes(b));if(index<0)return {windy:false,safe:true};const phase=((time+index*1170)%5200+5200)%5200;return {windy:true,safe:phase>=1800&&phase<4600,phase};}
  function fall(state){state.at=state.checkpoint;state.falls++;state.won=false;}
  const api={nodes,links,byId,neighbors,create,hop,direction,wind,fall};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.TrailModel=api;
})(typeof window!=='undefined'?window:globalThis);
