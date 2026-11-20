import * as T from './vendor/three.module.js';
export function createHandSparkler(parent,{low=false}={}){
 const root=new T.Group();root.name='hand-sparkler';root.visible=false;parent.add(root);
 const wire=new T.Mesh(new T.CylinderGeometry(.008,.008,.64,8),new T.MeshStandardMaterial({color:'#b3b2ac',metalness:.7,roughness:.43}));wire.position.y=.12;root.add(wire);
 const coating=new T.Mesh(new T.CylinderGeometry(.014,.014,.23,8),new T.MeshStandardMaterial({color:'#625f56',roughness:1}));coating.position.y=.325;root.add(coating);
 const geometry=new T.BufferGeometry(),heads=low?40:96,n=heads*3+1,positions=new Float32Array(n*3),velocity=new Float32Array(n*3),phase=new Float32Array(n),trail=new Float32Array(n);phase[0]=-1;
 for(let i=0;i<heads;i++){const a=i*2.39996,y=1-2*(i+.5)/heads,r=Math.sqrt(1-y*y);for(let tail=0;tail<3;tail++){const k=1+i*3+tail;velocity.set([Math.cos(a)*r*1.8,y*1.8+.3,Math.sin(a)*r*1.8],k*3);phase[k]=(i*.618034)%1;trail[k]=tail;}}
 geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('velocity',new T.BufferAttribute(velocity,3));geometry.setAttribute('phase',new T.BufferAttribute(phase,1));geometry.setAttribute('trail',new T.BufferAttribute(trail,1));
 const uniforms={time:{value:0},calm:{value:0}},material=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,
 vertexShader:`attribute vec3 velocity;attribute float phase;attribute float trail;uniform float time;uniform float calm;varying float opacity;varying vec3 tint;void main(){float cycle=fract(time*1.7+phase)*.58;float age=max(0.,cycle-trail*.035);vec3 p=velocity*age;p.y+=.455-age*age*1.8;bool core=phase<0.;if(core)p=vec3(0.,.455,0.);vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;gl_PointSize=core?clamp(155./max(1.,-v.z),6.,17.):clamp(64./max(1.,-v.z),1.8,5.5)*(1.-trail*.17);opacity=core?.75:(1.-age/.58)*exp(-trail*.65)*(1.-calm*.92)*step(trail*.035,cycle);tint=mix(vec3(2.4,1.55,.6),vec3(1.1,1.9,2.3),step(.85,phase));if(core)tint=vec3(2.3,1.8,1.1);}`,
 fragmentShader:`varying float opacity;varying vec3 tint;void main(){float r=length(gl_PointCoord-.5)*2.;float a=(exp(-r*r*7.)+.2*exp(-r*r*2.))*(1.-smoothstep(.7,1.,r))*opacity;if(a<.008)discard;gl_FragColor=vec4(tint,a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 const sparks=new T.Points(geometry,material);sparks.frustumCulled=false;root.add(sparks);
 const ember=new T.Mesh(new T.SphereGeometry(.035,10,8),new T.MeshBasicMaterial({color:'#ffe7b1',toneMapped:false}));ember.position.y=.45;root.add(ember);
 return{root,update(time,active,calm=false){root.visible=active;if(active){uniforms.time.value=time;uniforms.calm.value=calm?1:0;}},dispose(){root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});root.removeFromParent();}};
}
