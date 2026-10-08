/* One static mesh, directional light, surface grain, and distance haze. */
(() => {
  'use strict';
  const vertex=`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aColor;uniform mat4 uMatrix;varying vec3 vPosition;varying vec3 vColor;varying vec3 vNormal;void main(){vPosition=aPosition;vColor=aColor;vNormal=aNormal;gl_Position=uMatrix*vec4(aPosition,1.0);}`;
  const fragment=`precision mediump float;varying vec3 vPosition;varying vec3 vColor;varying vec3 vNormal;uniform vec3 uEye;uniform vec2 uResolution;
  float grain(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
  void main(){vec3 sun=normalize(vec3(-.5,.85,.35));float light=.63+.37*max(dot(normalize(vNormal),sun),0.0);float rough=grain(floor(vPosition*10.0))*.12-.06;float seams=grain(floor(vPosition*2.0))*.055;vec3 surface=vColor*(light+rough-seams);float d=distance(vPosition,uEye);float fog=smoothstep(34.0,115.0,d);float sy=gl_FragCoord.y/uResolution.y;vec3 sky=mix(vec3(.85,.80,.65),vec3(.49,.66,.66),smoothstep(.35,1.0,sy));gl_FragColor=vec4(mix(surface,sky,fog),1.0);}`;
  class FieldRenderer{
    constructor(canvas){
      this.canvas=canvas;const gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power'});if(!gl)throw Error('WebGL unavailable');this.gl=gl;
      function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(message);}return s;}
      const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);this.program=program;
      const mesh=window.FieldCore.mesh();this.count=mesh.length/9;const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,mesh,gl.STATIC_DRAW);this.staticBuffer=buffer;this.wildBuffer=gl.createBuffer();
      ['aPosition','aNormal','aColor'].forEach((name,i)=>{const location=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,3,gl.FLOAT,false,36,i*12);});
      this.matrix=gl.getUniformLocation(program,'uMatrix');this.eye=gl.getUniformLocation(program,'uEye');this.resolution=gl.getUniformLocation(program,'uResolution');gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);this.resize();
    }
    resize(){const dpr=Math.min(devicePixelRatio||1,1.6);this.canvas.width=Math.round(innerWidth*dpr);this.canvas.height=Math.round(innerHeight*dpr);this.gl.viewport(0,0,this.canvas.width,this.canvas.height);this.projection=window.FieldCore.perspective(Math.PI/3,innerWidth/innerHeight,.08,220);}
    bind(buffer){const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);['aPosition','aNormal','aColor'].forEach((name,i)=>{const location=gl.getAttribLocation(this.program,name);gl.vertexAttribPointer(location,3,gl.FLOAT,false,36,i*12);});}
    draw(player,wildlife){const gl=this.gl,F=window.FieldCore;const matrix=F.multiply(this.projection,F.view(player.x,player.y,player.z,player.yaw,player.pitch));gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniformMatrix4fv(this.matrix,false,matrix);gl.uniform3f(this.eye,player.x,player.y,player.z);gl.uniform2f(this.resolution,this.canvas.width,this.canvas.height);this.bind(this.staticBuffer);gl.drawArrays(gl.TRIANGLES,0,this.count);if(wildlife){this.bind(this.wildBuffer);gl.bufferData(gl.ARRAY_BUFFER,wildlife,gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,wildlife.length/9);}return matrix;}
  }
  window.FieldRenderer=FieldRenderer;
})();
