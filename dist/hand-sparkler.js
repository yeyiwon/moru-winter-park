import * as T from './vendor/three.module.js';
export function createHandSparkler(parent,{low=false}={}){
 const root=new T.Group();root.name='hand-sparkler';root.visible=false;parent.add(root);
 const wire=new T.Mesh(new T.CylinderGeometry(.008,.008,.64,8),new T.MeshStandardMaterial({color:'#b3b2ac',metalness:.7,roughness:.43}));wire.position.y=.12;root.add(wire);
 const coating=new T.Mesh(new T.CylinderGeometry(.014,.014,.23,8),new T.MeshStandardMaterial({color:'#625f56',roughness:1}));coating.position.y=.325;root.add(coating);
 const geometry=new T.BufferGeometry(),n=low?32:80,positions=new Float32Array(n*3),velocity=new Float32Array(n*3),phase=new Float32Array(n);
 for(let i=0;i<n;i++){const a=i*2.39996,y=1-2*(i+.5)/n,r=Math.sqrt(1-y*y);velocity.set([Math.cos(a)*r*.9,y*.9+.18,Math.sin(a)*r*.9],i*3);phase[i]=(i*.618034)%1;}
 geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('velocity',new T.BufferAttribute(velocity,3));geometry.setAttribute('phase',new T.BufferAttribute(phase,1));
 const uniforms={time:{value:0},calm:{value:0}},material=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,
 vertexShader:`attribute vec3 velocity;attribute float phase;uniform float time;uniform float calm;varying float opacity;void main(){float age=fract(time*1.8+phase)*.62;vec3 p=velocity*age;p.y+=.455-age*age*1.35;vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(24./max(1.,-v.z),1.,2.4);opacity=(1.-age/.62)*(1.-calm*.85);}`,
 fragmentShader:`varying float opacity;void main(){float r=length(gl_PointCoord-.5)*2.;float a=(1.-smoothstep(.05,1.,r))*opacity;if(a<.02)discard;gl_FragColor=vec4(1.7,1.2,.55,a);}`});
 const sparks=new T.Points(geometry,material);sparks.frustumCulled=false;root.add(sparks);
 const ember=new T.Mesh(new T.SphereGeometry(.021,10,8),new T.MeshBasicMaterial({color:'#ffe7b1',toneMapped:false}));ember.position.y=.45;root.add(ember);
 return{root,update(time,active,calm=false){root.visible=active;if(active){uniforms.time.value=time;uniforms.calm.value=calm?1:0;}},dispose(){root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});root.removeFromParent();}};
}
