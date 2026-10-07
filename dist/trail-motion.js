/* Frame-rate-independent motion shared by the camera and its tests. */
(function(root){
  'use strict';
  function damp(value,velocity,target,dt,omega=11){
    const offset=value-target,c=velocity+omega*offset,decay=Math.exp(-omega*dt);
    return {value:target+(offset+c*dt)*decay,velocity:(velocity-omega*c*dt)*decay};
  }
  function ease(t){t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10);}
  function hop(from,to,t){const u=ease(t),distance=Math.hypot(to.x-from.x,to.y-from.y);return {x:from.x+(to.x-from.x)*u,y:from.y+(to.y-from.y)*u,lift:4*u*(1-u)*Math.min(52,24+distance*.07),stretch:Math.sin(Math.PI*u)*.07};}
  const api={damp,ease,hop};if(typeof module==='object'&&module.exports)module.exports=api;else root.TrailMotion=api;
})(typeof window!=='undefined'?window:globalThis);
