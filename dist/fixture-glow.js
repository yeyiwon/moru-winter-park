import * as T from './vendor/three.module.js';

// Every authored lantern gets the same halo and snow reflection, in two draw calls.
// These effects belong to the fixtures; they do not alter character materials or geometry.
export function createFixtureGlow(scene){
 const root=new T.Group();root.name='winter-lantern-glow';root.userData.cameraIgnore=true;
 const positions=[],seeds=[],pools=[],point=new T.Vector3();scene.updateMatrixWorld(true);
 scene.traverse(object=>{for(const lamp of object.userData.lampGlow||[]){
  point.set(lamp.x||0,lamp.y,lamp.z||0);object.localToWorld(point);positions.push(point.x,point.y,point.z);seeds.push(positions.length*.618);
  const floor=new T.Vector3(lamp.x||0,lamp.floor??.12,lamp.z||0);object.localToWorld(floor);pools.push({position:floor,radius:lamp.radius||2.7});
 }});
 const time={value:0},gain={value:1},geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('seed',new T.Float32BufferAttribute(seeds,1));geometry.computeBoundingSphere();
 const halos=new T.Points(geometry,new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,uniforms:{time,gain},vertexShader:`uniform float time;attribute float seed;varying float glow;void main(){glow=.82+.18*sin(time*.65+seed);vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(850./max(1.,-mv.z),3.,64.);gl_Position=projectionMatrix*mv;}`,fragmentShader:`uniform float gain;varying float glow;void main(){vec2 p=(gl_PointCoord-.5)*2.;float d=dot(p,p);float aura=exp(-d*6.)*(1.-smoothstep(.65,1.,sqrt(d)));float star=exp(-abs(p.x)*45.-abs(p.y)*7.)+exp(-abs(p.y)*45.-abs(p.x)*7.);gl_FragColor=vec4(1.,.77,.44,(aura*.27+star*.07)*glow*gain);}`}));halos.name='all-lantern-soft-halos';root.add(halos);
 const wash=new T.InstancedMesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,uniforms:{gain},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`,fragmentShader:`uniform float gain;varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.;float d=length(p);float light=exp(-dot(p,p)*2.8)*(1.-smoothstep(.5,1.,d));gl_FragColor=vec4(1.,.71,.36,light*.22*gain);}`}),pools.length);
 wash.name='all-lantern-snow-reflections';const transform=new T.Object3D();for(let i=0;i<pools.length;i++){transform.position.copy(pools[i].position);transform.rotation.set(-Math.PI/2,0,0);transform.scale.set(pools[i].radius,pools[i].radius,1);transform.updateMatrix();wash.setMatrixAt(i,transform.matrix);}wash.computeBoundingSphere();root.add(wash);scene.add(root);
 return{root,count:pools.length,update(t,still=false){if(!still&&Number.isFinite(t))time.value=t;},setQuality(value){gain.value=value==='low'?.8:1;},dispose(){geometry.dispose();halos.material.dispose();wash.geometry.dispose();wash.material.dispose();root.removeFromParent();}};
}
