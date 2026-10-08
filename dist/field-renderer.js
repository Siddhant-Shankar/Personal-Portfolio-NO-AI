/* three.js renderer: sun and moon with real shadows, hairline outlines, lit windows after dark, and haze.
   The city geometry, camera maths, and simulation are unchanged; this module only draws them. */
import * as THREE from './vendor/three.module.min.js';

// The city's colours are authored as plain sRGB values and lit in that space, as before.
THREE.ColorManagement.enabled=false;
const NOON=window.FieldSky.sample(12),PI=Math.PI;

// Lambert shading plus the city's own touches: surface grain, and windows that glow with the night.
function cityMaterial(night){
  // As in Factory Yard: fills sit a hair behind their hairlines, so outlines always win the depth test.
  const material=new THREE.MeshLambertMaterial({vertexColors:true,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
  material.onBeforeCompile=shader=>{
    shader.uniforms.uNight=night;
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float glow;varying float vGlow;varying vec3 vObj;').replace('#include <begin_vertex>','#include <begin_vertex>\nvGlow=glow;vObj=position;');
    shader.fragmentShader=shader.fragmentShader
      .replace('#include <common>','#include <common>\nuniform float uNight;varying float vGlow;varying vec3 vObj;float grain(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}')
      .replace('#include <color_fragment>','#include <color_fragment>\nfloat rough=grain(floor(vObj*10.0))*.12-.06;float seams=grain(floor(vObj*2.0))*.055;diffuseColor.rgb*=1.0+rough-seams;float lit=clamp(vGlow*uNight*1.15,0.0,1.0);vec3 lamp=mix(vec3(1.0,.8,.47),vColor*1.25,.22);diffuseColor.rgb*=1.0-lit;')
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=lamp*lit;');
  };
  return material;
}
function interleaved(array,usage){
  const buffer=new THREE.InterleavedBuffer(array,window.FieldCore.STRIDE);if(usage)buffer.setUsage(usage);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.InterleavedBufferAttribute(buffer,3,0));geometry.setAttribute('normal',new THREE.InterleavedBufferAttribute(buffer,3,3));
  geometry.setAttribute('color',new THREE.InterleavedBufferAttribute(buffer,3,6));geometry.setAttribute('glow',new THREE.InterleavedBufferAttribute(buffer,1,9));
  return {geometry,buffer};
}

class FieldRenderer{
  constructor(canvas){
    this.canvas=canvas;const coarse=matchMedia('(pointer: coarse)').matches;this.coarse=coarse;
    const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:coarse?'low-power':'high-performance'});
    if(!renderer.getContext())throw Error('WebGL unavailable');
    renderer.outputColorSpace=THREE.LinearSRGBColorSpace;renderer.setClearColor(0x000000,0);
    renderer.shadowMap.enabled=!coarse;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    // Phones skip shadows entirely. Shadows are the costliest pass. The sun moves slowly, so redraw them at 15 Hz (8 Hz on phones), not every frame.
    renderer.shadowMap.autoUpdate=false;this.shadowEvery=coarse?1/8:1/15;this.shadowAt=-1;this.renderer=renderer;
    const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xc7c8ac,34,115);this.scene=scene;
    this.night={value:0};this.material=cityMaterial(this.night);
    // Static city: one interleaved mesh, plus its hairline outlines.
    const city=window.FieldCore.mesh(),statics=interleaved(city);
    const mesh=new THREE.Mesh(statics.geometry,this.material);mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.matrixAutoUpdate=false;scene.add(mesh);
    if(city.edges){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(city.edges,3));this.lineMaterial=new THREE.LineBasicMaterial({color:0x26332f,transparent:true,opacity:.42,fog:true});const lines=new THREE.LineSegments(g,this.lineMaterial);lines.frustumCulled=false;lines.matrixAutoUpdate=false;scene.add(lines);}
    this.count=city.length/window.FieldCore.STRIDE;
    // Moving things share one dynamic buffer that grows as needed.
    this.lifeCapacity=0;this.lifeMesh=null;
    // A sun (or moon) that casts shadows over the whole district, and soft sky light.
    const sun=new THREE.DirectionalLight(0xffffff,1);sun.castShadow=true;const size=coarse?1024:2048;sun.shadow.mapSize.set(size,size);
    Object.assign(sun.shadow.camera,{left:-82,right:82,top:82,bottom:-82,near:10,far:420});sun.shadow.bias=-.0004;sun.shadow.normalBias=.04;sun.shadow.camera.updateProjectionMatrix();
    scene.add(sun,sun.target);this.sun=sun;this.ambient=new THREE.AmbientLight(0xffffff,1);scene.add(this.ambient);
    this.camera=new THREE.PerspectiveCamera();this.camera.matrixAutoUpdate=false;
    this.resize();
  }
  resize(){const dpr=Math.min(devicePixelRatio||1,this.coarse?1.25:1.6);this.renderer.setPixelRatio(dpr);this.renderer.setSize(innerWidth,innerHeight,false);this.projection=window.FieldCore.perspective(Math.PI/3,innerWidth/innerHeight,.08,640);this.camera.projectionMatrix.fromArray(this.projection);this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();}
  updateLife(array){
    const stride=window.FieldCore.STRIDE;
    if(array.length>this.lifeCapacity){
      if(this.lifeMesh){this.scene.remove(this.lifeMesh);this.lifeMesh.geometry.dispose();}
      this.lifeCapacity=Math.ceil(array.length*1.3/stride)*stride;const life=interleaved(new Float32Array(this.lifeCapacity),THREE.DynamicDrawUsage);
      this.lifeMesh=new THREE.Mesh(life.geometry,this.material);this.lifeMesh.castShadow=this.lifeMesh.receiveShadow=true;this.lifeMesh.frustumCulled=false;this.lifeMesh.matrixAutoUpdate=false;this.lifeBuffer=life.buffer;this.scene.add(this.lifeMesh);
    }
    this.lifeBuffer.array.set(array);this.lifeBuffer.needsUpdate=true;this.lifeMesh.geometry.setDrawRange(0,array.length/stride);
  }
  draw(eye,life,flying=false,sky=NOON){
    const F=window.FieldCore,view=F.view(eye.x,eye.y,eye.z,eye.yaw,eye.pitch),matrix=F.multiply(this.projection,view);
    this.camera.matrix.fromArray(view).invert();this.camera.matrixWorldNeedsUpdate=true;
    // Light: the old shader added ambient + sun·N·L; three's physical lights divide by π, so scale back up.
    const [sx,sy,sz]=sky.sun,[r,g,b]=sky.sunColor,[ar,ag,ab]=sky.ambient;
    this.sun.position.set(sx*220,sy*220,sz*220);this.sun.color.setRGB(r*PI,g*PI,b*PI);this.sun.castShadow=sy>.08&&r+g+b>.12;
    this.ambient.color.setRGB(ar*PI,ag*PI,ab*PI);this.night.value=sky.night;
    this.scene.fog.color.setRGB(...sky.haze);// Haze follows the camera's height, so transitions between street and sky never flash.
    const lift=Math.min(1,Math.max(0,(eye.y-3)/40));this.scene.fog.near=34+216*lift;this.scene.fog.far=115+445*lift;
    if(this.lineMaterial)this.lineMaterial.opacity=.42-.1*lift;
    if(life)this.updateLife(life);
    const now=performance.now()/1000;if(now-this.shadowAt>=this.shadowEvery){this.renderer.shadowMap.needsUpdate=true;this.shadowAt=now;}
    this.renderer.render(this.scene,this.camera);this.adapt(now);
    return matrix;
  }
  // Adaptive quality: if frames stay slow for two seconds, drop shadows first, then resolution.
  adapt(now){
    const q=this.quality||(this.quality={level:this.renderer.shadowMap.enabled?2:1,last:now,frames:0,since:now});
    q.frames++;const gap=now-q.last;q.last=now;if(gap>.5){q.frames=0;q.since=now;return;}
    if(now-q.since<2)return;const fps=q.frames/(now-q.since);q.frames=0;q.since=now;
    if(fps>=24||q.level===0)return;
    if(q.level===2){this.renderer.shadowMap.enabled=false;this.scene.traverse(o=>{if(o.material)o.material.needsUpdate=true;});}
    else{this.renderer.setPixelRatio(1);this.renderer.setSize(innerWidth,innerHeight,false);}
    q.level--;
  }
}
window.FieldRenderer=FieldRenderer;
