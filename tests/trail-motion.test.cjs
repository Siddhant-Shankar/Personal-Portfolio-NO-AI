const assert=require('node:assert/strict');
const {damp,ease,hop}=require('../dist/trail-motion.js');
function settle(hz){let x=0,v=0;for(let i=0;i<hz;i++){const n=damp(x,v,100,1/hz);x=n.value;v=n.velocity;}return x;}
assert(Math.abs(settle(30)-settle(120))<1e-8,'Follow camera must be frame-rate independent');
assert(settle(60)>99.9&&settle(60)<=100,'Camera settles without overshoot');
assert.equal(ease(0),0);assert.equal(ease(1),1);
const a={x:10,y:20},b={x:400,y:600};
assert.deepEqual(hop(a,b,0),{x:10,y:20,lift:0,stretch:0});
assert.equal(hop(a,b,1).x,b.x);assert.equal(hop(a,b,1).y,b.y);assert.equal(hop(a,b,1).lift,0);
assert(hop(a,b,.5).lift>0);assert(Math.abs(ease(.0001))<1e-8);
console.log('Camera consistency at 30/60/120 Hz, settling, and smooth hop endpoints pass.');
