/* One static mesh, a moving sun, lit windows after dark, surface grain, and distance haze. */
(() => {
  'use strict';
  const vertex=`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aColor;attribute float aGlow;uniform mat4 uMatrix;varying vec3 vPosition;varying vec3 vColor;varying vec3 vNormal;varying float vGlow;void main(){vPosition=aPosition;vColor=aColor;vNormal=aNormal;vGlow=aGlow;gl_Position=uMatrix*vec4(aPosition,1.0);}`;
  const fragment=`precision mediump float;varying vec3 vPosition;varying vec3 vColor;varying vec3 vNormal;varying float vGlow;uniform vec3 uEye;uniform vec2 uResolution;uniform vec2 uFog;uniform vec3 uSun;uniform vec3 uSunColor;uniform vec3 uAmbient;uniform vec3 uSkyTop;uniform vec3 uSkyLow;uniform float uNight;
  float grain(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
  void main(){vec3 n=normalize(vNormal);vec3 light=uAmbient+uSunColor*max(dot(n,uSun),0.0);float rough=grain(floor(vPosition*10.0))*.12-.06;float seams=grain(floor(vPosition*2.0))*.055;vec3 surface=vColor*(light+rough-seams);
  float lit=clamp(vGlow*uNight*1.15,0.0,1.0);vec3 lamp=mix(vec3(1.0,.8,.47),vColor*1.25,.22);surface=mix(surface,lamp,lit);
  float d=distance(vPosition,uEye);float fog=smoothstep(uFog.x,uFog.y,d)*(1.0-lit*.6);float sy=gl_FragCoord.y/uResolution.y;vec3 sky=mix(uSkyLow,uSkyTop,smoothstep(.35,1.0,sy));gl_FragColor=vec4(mix(surface,sky,fog),1.0);}`;
  const NOON=window.FieldSky.sample(12);
  class FieldRenderer{
    constructor(canvas){
      this.canvas=canvas;const gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power'});if(!gl)throw Error('WebGL unavailable');this.gl=gl;
      function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(message);}return s;}
      const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);this.program=program;
      const mesh=window.FieldCore.mesh(),stride=window.FieldCore.STRIDE;this.stride=stride;this.count=mesh.length/stride;const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,mesh,gl.STATIC_DRAW);this.staticBuffer=buffer;this.lifeBuffer=gl.createBuffer();
      this.attributes=[['aPosition',3,0],['aNormal',3,3],['aColor',3,6],['aGlow',1,9]].map(([name,size,offset])=>({location:gl.getAttribLocation(program,name),size,offset}));
      for(const a of this.attributes)gl.enableVertexAttribArray(a.location);
      this.uniforms={};for(const name of ['uMatrix','uEye','uResolution','uFog','uSun','uSunColor','uAmbient','uSkyTop','uSkyLow','uNight'])this.uniforms[name]=gl.getUniformLocation(program,name);
      gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);this.resize();
    }
    resize(){const dpr=Math.min(devicePixelRatio||1,1.6);this.canvas.width=Math.round(innerWidth*dpr);this.canvas.height=Math.round(innerHeight*dpr);this.gl.viewport(0,0,this.canvas.width,this.canvas.height);this.projection=window.FieldCore.perspective(Math.PI/3,innerWidth/innerHeight,.08,640);}
    bind(buffer){const gl=this.gl,bytes=this.stride*4;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);for(const a of this.attributes)gl.vertexAttribPointer(a.location,a.size,gl.FLOAT,false,bytes,a.offset*4);}
    draw(player,life,flying=false,sky=NOON){
      const gl=this.gl,F=window.FieldCore,u=this.uniforms;const matrix=F.multiply(this.projection,F.view(player.x,player.y,player.z,player.yaw,player.pitch));
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniformMatrix4fv(u.uMatrix,false,matrix);gl.uniform3f(u.uEye,player.x,player.y,player.z);gl.uniform2f(u.uResolution,this.canvas.width,this.canvas.height);gl.uniform2f(u.uFog,flying?250:34,flying?560:115);
      gl.uniform3fv(u.uSun,sky.sun);gl.uniform3fv(u.uSunColor,sky.sunColor);gl.uniform3fv(u.uAmbient,sky.ambient);gl.uniform3fv(u.uSkyTop,sky.top);gl.uniform3fv(u.uSkyLow,sky.haze);gl.uniform1f(u.uNight,sky.night);
      this.bind(this.staticBuffer);gl.drawArrays(gl.TRIANGLES,0,this.count);
      if(life){this.bind(this.lifeBuffer);gl.bufferData(gl.ARRAY_BUFFER,life,gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,life.length/this.stride);}
      return matrix;
    }
  }
  window.FieldRenderer=FieldRenderer;
})();
