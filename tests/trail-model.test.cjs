const assert=require('node:assert/strict');
const M=require('../dist/trail-model.js');
const seen=new Set(['apac']),queue=['apac'];
while(queue.length)for(const id of M.neighbors(queue.shift()))if(!seen.has(id)){seen.add(id);queue.push(id);}
assert.equal(seen.size,M.nodes.length,'Every stop is reachable');
for(const [a,b] of M.links){assert(M.byId[a]&&M.byId[b]);assert(M.neighbors(b).includes(a));}
const s=M.create();assert.equal(M.hop(s,'crown').ok,false);assert.equal(s.at,'apac');
for(const stop of ['rootfork','parasol','rootbridge','trunk','boring','eastbridge','hyphenate','zaap','crown'])assert.equal(M.hop(s,stop).ok,true,stop);
assert.equal(s.won,true);assert.equal(s.collected.length,3);assert.equal(s.checkpoint,'hyphenate');
const locked=M.create();for(const stop of ['rootfork','zeus','rootbridge','trunk','about','branchfork','projects'])assert(M.hop(locked,stop).ok);
assert.equal(M.hop(locked,'crown').ok,false,'All fireflies are required');
assert.equal(M.direction('apac',0,-1),'rootfork');
assert.equal(M.direction('apac',0,1),undefined);
const duplicate=M.create();for(const stop of ['rootfork','parasol','rootfork','parasol'])M.hop(duplicate,stop);
assert.equal(duplicate.collected.length,1,'Revisiting never duplicates rewards');
console.log('Graph connectivity, legal movement, directional selection, rewards, and win conditions pass.');
