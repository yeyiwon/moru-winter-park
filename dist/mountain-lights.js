import * as T from './vendor/three.module.js';

// One reusable GPU batch for selected firs, not a light or particle system per tree.
export function createMountainLights(parent,trees){
 const position=[],phase=[],color=[],ice=new T.Color('#9bdbff'),gold=new T.Color('#ffe3ae');
 for(const tree of trees)for(let i=0;i<42;i++){
  const tier=i%3,t=(i/3|0)/13,a=t*Math.PI*4+tree.turn+tier*1.7,h=tree.h*(.8-tier*.19),r=h*.36*(1-t*.86);
  position.push(tree.x+Math.cos(a)*r,tree.y+tree.h*(.35+tier*.21)+h*(t-.5)*.84,tree.z+Math.sin(a)*r);
  phase.push(i*2.399+tree.x*.13+tree.z*.07);(i%7?ice:gold).toArray(color,color.length);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(position,3));geometry.setAttribute('phase',new T.Float32BufferAttribute(phase,1));geometry.setAttribute('color',new T.Float32BufferAttribute(color,3));
 const uniforms={...T.UniformsUtils.clone(T.UniformsLib.fog),time:{value:0},density:{value:1}};
 const material=new T.ShaderMaterial({uniforms,fog:true,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:true,
 vertexShader:`attribute float phase;uniform float time;uniform float density;varying vec3 tint;varying float glow;
#include <fog_pars_vertex>
void main(){vec4 mvPosition=modelViewMatrix*vec4(position,1.);float distance=length(mvPosition.xyz);tint=color;glow=(.65+.35*pow(.5+.5*sin(time*.85+phase),5.))*(1.-smoothstep(300.,700.,distance))*step(fract(phase*.137),density);gl_Position=projectionMatrix*mvPosition;gl_PointSize=clamp(210./max(1.,-mvPosition.z),1.3,8.);
#include <fog_vertex>
}`,
 fragmentShader:`varying vec3 tint;varying float glow;
#include <fog_pars_fragment>
void main(){vec2 p=gl_PointCoord-.5;float a=(exp(-dot(p,p)*40.)+.16*exp(-abs(p.x)*45.-abs(p.y)*8.)+.16*exp(-abs(p.y)*45.-abs(p.x)*8.))*glow;
#ifdef USE_FOG
a*=1.-smoothstep(fogNear,fogFar,vFogDepth);
#endif
if(a<.004)discard;gl_FragColor=vec4(tint*2.7,a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 const points=new T.Points(geometry,material);points.name='alpine-forest-fairy-lights';points.userData.cameraIgnore=true;geometry.computeBoundingSphere();parent.add(points);
 return{points,update(t,still){uniforms.time.value=still?0:t;},setQuality(q){uniforms.density.value=q==='low'?.35:q==='medium'?.65:1;},dispose(){geometry.dispose();material.dispose();points.removeFromParent();}};
}
