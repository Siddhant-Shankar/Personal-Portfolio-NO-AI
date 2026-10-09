/* three.js renderer: sun and moon with real shadows, cartoon shading and ink outlines, lit windows after dark, and haze.
   The city geometry, camera maths, and simulation are unchanged; this module only draws them. */
import * as THREE from '../vendor/three.module.min.js';

// The city's colours are authored as plain sRGB values and lit in that space, as before.
THREE.ColorManagement.enabled = false;
const NOON = window.CitySky.sample(12),
  PI = Math.PI;

// Cartoon shading: light falls in flat bands, colours are pushed brighter, and windows glow with the night.
function cityMaterial(night) {
  // Three tones: shade, half-light, full sun. Nearest filtering keeps the steps hard.
  const steps = new THREE.DataTexture(new Uint8Array([0, 0, 150, 255]), 4, 1, THREE.RedFormat);
  steps.minFilter = steps.magFilter = THREE.NearestFilter;
  steps.needsUpdate = true;
  // As in Factory Yard: fills sit a hair behind their outlines, so outlines always win the depth test.
  const material = new THREE.MeshToonMaterial({
    vertexColors: true,
    gradientMap: steps,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  material.onBeforeCompile = shader => {
    shader.uniforms.uNight = night;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float glow;varying float vGlow;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow=glow;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uNight;varying float vGlow;')
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\nfloat luma=dot(diffuseColor.rgb,vec3(.3,.59,.11));diffuseColor.rgb=clamp(mix(vec3(luma),diffuseColor.rgb,1.75)*1.08,0.0,1.0);float lit=clamp(vGlow*uNight*1.15,0.0,1.0);vec3 lamp=mix(vec3(1.0,.82,.4),diffuseColor.rgb*1.25,.22);diffuseColor.rgb*=1.0-lit;',
      )
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=lamp*lit;',
      );
  };
  return material;
}
// Ink outlines. WebGL draws every line one pixel wide, so each edge becomes a screen-facing quad a few
// pixels across instead. The ink thins with distance, and edges are clipped at the near plane so lines
// beside someone on foot never flip across the screen.
function inkLines(edges) {
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0], 3),
  );
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  const ends = new THREE.InstancedInterleavedBuffer(edges, 6);
  geometry.setAttribute('start', new THREE.InterleavedBufferAttribute(ends, 3, 0));
  geometry.setAttribute('end', new THREE.InterleavedBufferAttribute(ends, 3, 3));
  geometry.instanceCount = edges.length / 6;
  const material = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        color: { value: new THREE.Color(0x1c2326) },
        opacity: { value: 1 },
        width: { value: 2.4 },
        resolution: { value: new THREE.Vector2(1, 1) },
      },
    ]),
    fog: true,
    transparent: true,
    vertexShader: `#include <common>
#include <fog_pars_vertex>
attribute vec3 start;attribute vec3 end;uniform float width;uniform vec2 resolution;
void main(){
  vec4 a=modelViewMatrix*vec4(start,1.0),b=modelViewMatrix*vec4(end,1.0);
  float n=projectionMatrix[3][2]/(projectionMatrix[2][2]-1.0)*1.01;
  if(a.z>-n&&b.z>-n){gl_Position=vec4(0.0,0.0,2.0,1.0);return;}
  if(a.z>-n)a=mix(a,b,(-n-a.z)/(b.z-a.z));else if(b.z>-n)b=mix(b,a,(-n-b.z)/(a.z-b.z));
  vec4 ca=projectionMatrix*a,cb=projectionMatrix*b;
  vec2 dir=cb.xy/cb.w*resolution-ca.xy/ca.w*resolution;
  dir=length(dir)<1e-4?vec2(1.0,0.0):normalize(dir);
  vec4 mvPosition=position.x<0.5?a:b;
  vec4 clip=position.x<0.5?ca:cb;
  float w=width*clamp(28.0/-mvPosition.z,0.45,1.0);
  clip.xy+=(vec2(-dir.y,dir.x)*position.y+dir*(position.x*2.0-1.0))*w/resolution*clip.w;
  gl_Position=clip;
  #include <fog_vertex>
}`,
    fragmentShader: `#include <common>
#include <fog_pars_fragment>
uniform vec3 color;uniform float opacity;
void main(){
  gl_FragColor=vec4(color,opacity);
  #include <fog_fragment>
}`,
  });
  return new THREE.Mesh(geometry, material);
}
function interleaved(array, usage) {
  const buffer = new THREE.InterleavedBuffer(array, window.CityCore.STRIDE);
  if (usage) buffer.setUsage(usage);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.InterleavedBufferAttribute(buffer, 3, 0));
  geometry.setAttribute('normal', new THREE.InterleavedBufferAttribute(buffer, 3, 3));
  geometry.setAttribute('color', new THREE.InterleavedBufferAttribute(buffer, 3, 6));
  geometry.setAttribute('glow', new THREE.InterleavedBufferAttribute(buffer, 1, 9));
  return { geometry, buffer };
}

class CityRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    const coarse = matchMedia('(pointer: coarse)').matches;
    this.coarse = coarse;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: coarse ? 'low-power' : 'high-performance',
    });
    if (!renderer.getContext()) throw Error('WebGL unavailable');
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = !coarse;
    renderer.shadowMap.type = THREE.PCFShadowMap; // Crisp shadow edges suit the cartoon shading.
    // Phones skip shadows entirely. Shadows are the costliest pass. The sun moves slowly, so redraw them at 15 Hz (8 Hz on phones), not every frame.
    renderer.shadowMap.autoUpdate = false;
    this.shadowEvery = coarse ? 1 / 8 : 1 / 15;
    this.shadowAt = -1;
    this.renderer = renderer;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xcfe6e0, 34, 115);
    this.scene = scene;
    this.night = { value: 0 };
    this.material = cityMaterial(this.night);
    // Static city: one interleaved mesh, plus its ink outlines.
    const city = window.CityCore.mesh(),
      statics = interleaved(city);
    const mesh = new THREE.Mesh(statics.geometry, this.material);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.matrixAutoUpdate = false;
    scene.add(mesh);
    if (city.edges) {
      const lines = inkLines(city.edges);
      this.lineMaterial = lines.material;
      lines.frustumCulled = false;
      lines.matrixAutoUpdate = false;
      scene.add(lines);
    }
    this.count = city.length / window.CityCore.STRIDE;
    // Moving things share one dynamic buffer that grows as needed.
    this.lifeCapacity = 0;
    this.lifeMesh = null;
    // A sun (or moon) that casts shadows over the whole district, and soft sky light.
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.castShadow = true;
    const size = coarse ? 1024 : 2048;
    sun.shadow.mapSize.set(size, size);
    Object.assign(sun.shadow.camera, {
      left: -82,
      right: 82,
      top: 82,
      bottom: -82,
      near: 10,
      far: 420,
    });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.04;
    sun.shadow.camera.updateProjectionMatrix();
    scene.add(sun, sun.target);
    this.sun = sun;
    this.ambient = new THREE.AmbientLight(0xffffff, 1);
    scene.add(this.ambient);
    this.camera = new THREE.PerspectiveCamera();
    this.camera.matrixAutoUpdate = false;
    this.resize();
  }
  resize() {
    const dpr = Math.min(devicePixelRatio || 1, this.coarse ? 1.25 : 1.6);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(innerWidth, innerHeight, false);
    this.ink();
    this.projection = window.CityCore.perspective(Math.PI / 3, innerWidth / innerHeight, 0.08, 640);
    this.camera.projectionMatrix.fromArray(this.projection);
    this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
  }
  // Outline weight is set in screen pixels, so it follows the canvas size and pixel ratio.
  ink() {
    if (!this.lineMaterial) return;
    const u = this.lineMaterial.uniforms,
      ratio = this.renderer.getPixelRatio();
    this.renderer.getDrawingBufferSize(u.resolution.value);
    u.width.value = (this.coarse ? 2 : 2.4) * ratio;
  }
  updateLife(array) {
    const stride = window.CityCore.STRIDE;
    if (array.length > this.lifeCapacity) {
      if (this.lifeMesh) {
        this.scene.remove(this.lifeMesh);
        this.lifeMesh.geometry.dispose();
      }
      this.lifeCapacity = Math.ceil((array.length * 1.3) / stride) * stride;
      const life = interleaved(new Float32Array(this.lifeCapacity), THREE.DynamicDrawUsage);
      this.lifeMesh = new THREE.Mesh(life.geometry, this.material);
      this.lifeMesh.castShadow = this.lifeMesh.receiveShadow = true;
      this.lifeMesh.frustumCulled = false;
      this.lifeMesh.matrixAutoUpdate = false;
      this.lifeBuffer = life.buffer;
      this.scene.add(this.lifeMesh);
    }
    this.lifeBuffer.array.set(array);
    this.lifeBuffer.needsUpdate = true;
    this.lifeMesh.geometry.setDrawRange(0, array.length / stride);
  }
  draw(eye, life, flying = false, sky = NOON) {
    const Core = window.CityCore,
      view = Core.view(eye.x, eye.y, eye.z, eye.yaw, eye.pitch),
      matrix = Core.multiply(this.projection, view);
    this.camera.matrix.fromArray(view).invert();
    this.camera.matrixWorldNeedsUpdate = true;
    // Light: the old shader added ambient + sun·N·L; three's physical lights divide by π, so scale back up.
    const [sx, sy, sz] = sky.sun,
      [r, g, b] = sky.sunColor,
      [ar, ag, ab] = sky.ambient;
    this.sun.position.set(sx * 220, sy * 220, sz * 220);
    this.sun.color.setRGB(r * PI, g * PI, b * PI);
    this.sun.castShadow = sy > 0.08 && r + g + b > 0.12;
    this.ambient.color.setRGB(ar * PI, ag * PI, ab * PI);
    this.night.value = sky.night;
    this.scene.fog.color.setRGB(...sky.haze); // Haze follows the camera's height, so transitions between street and sky never flash.
    const lift = Math.min(1, Math.max(0, (eye.y - 3) / 40));
    this.scene.fog.near = 34 + 216 * lift;
    this.scene.fog.far = 115 + 445 * lift;
    if (this.lineMaterial) this.lineMaterial.uniforms.opacity.value = 0.92 - 0.2 * lift;
    if (life) this.updateLife(life);
    const now = performance.now() / 1000;
    if (now - this.shadowAt >= this.shadowEvery) {
      this.renderer.shadowMap.needsUpdate = true;
      this.shadowAt = now;
    }
    this.renderer.render(this.scene, this.camera);
    this.adapt(now);
    return matrix;
  }
  // Adaptive quality: if frames stay slow for two seconds, drop shadows first, then resolution.
  adapt(now) {
    const q =
      this.quality ||
      (this.quality = {
        level: this.renderer.shadowMap.enabled ? 2 : 1,
        last: now,
        frames: 0,
        since: now,
      });
    q.frames++;
    const gap = now - q.last;
    q.last = now;
    if (gap > 0.5) {
      q.frames = 0;
      q.since = now;
      return;
    }
    if (now - q.since < 2) return;
    const fps = q.frames / (now - q.since);
    q.frames = 0;
    q.since = now;
    if (fps >= 24 || q.level === 0) return;
    if (q.level === 2) {
      this.renderer.shadowMap.enabled = false;
      this.scene.traverse(o => {
        if (o.material) o.material.needsUpdate = true;
      });
    } else {
      this.renderer.setPixelRatio(1);
      this.renderer.setSize(innerWidth, innerHeight, false);
      this.ink();
    }
    q.level--;
  }
}
window.CityRenderer = CityRenderer;
