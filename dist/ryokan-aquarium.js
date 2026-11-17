import * as T from './vendor/three.module.js';
import {makeBuilder,mergeFinish} from './architecture-kit.js';
const bounds={x:6.65,y:1.65,z:1.35};
// Deterministic steering with bounded acceleration, separation and soft wall avoidance.
export function createFishSchool(count=32){
 let seed=381;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;
 const fish=Array.from({length:count},(_,i)=>({x:(rand()-.5)*11,y:(rand()-.5)*2.6,z:(rand()-.5)*2.1,vx:(rand()-.5)*.8,vy:0,vz:(rand()-.5)*.3,phase:rand()*Math.PI*2,size:i<2?1.05:.42+rand()*.28}));let time=0;
 return{fish,step(delta,n=count){const dt=Math.min(.08,Math.max(0,delta));time+=dt;for(let i=0;i<n;i++){const f=fish[i];let ax=Math.cos(time*.19+f.phase)*.18,ay=Math.sin(time*.27+f.phase)*.09,az=Math.cos(time*.13+f.phase)*.08;for(let j=0;j<n;j++){if(i===j)continue;const p=fish[j],dx=f.x-p.x,dy=f.y-p.y,dz=f.z-p.z,d=dx*dx+dy*dy+dz*dz;if(d<.65&&d>.001){ax+=dx*.2/d;ay+=dy*.2/d;az+=dz*.2/d;}else if(d<6){ax+=(p.vx-f.vx)*.015;az+=(p.vz-f.vz)*.015;}}
 for(const k of ['x','y','z']){const limit=bounds[k]-f.size*.55,v=f[k],push=Math.sign(v)*Math.max(0,(Math.abs(v)-(limit-.75))/.75)**2*.9;if(k==='x')ax-=push;if(k==='y')ay-=push;if(k==='z')az-=push;}
 // Avoid the central driftwood ridge rather than swimming through it.
 if(Math.abs(f.x)<1.8&&f.y<-.6){ay+=.45;az+=Math.sign(f.z||1)*.15;}
 f.vx+=ax*dt;f.vy=Math.max(-.14,Math.min(.14,f.vy+ay*dt));f.vz+=az*dt;const speed=Math.hypot(f.vx,f.vy,f.vz),limit=i<2?.75:1.15;if(speed>limit){f.vx*=limit/speed;f.vy*=limit/speed;f.vz*=limit/speed;}for(const k of ['x','y','z']){f[k]+=f['v'+k]*dt;const edge=bounds[k]-f.size*.55;if(Math.abs(f[k])>edge){f[k]=Math.sign(f[k])*edge;f['v'+k]*=-.35;}}}return fish;}};
}
export function buildRyokanAquarium(parent,m){
 const root=new T.Group();root.name='ryokan-panorama-aquarium';root.userData.keepGroup=true;root.position.set(-12,2.25,14.7);parent.add(root);const b=makeBuilder(root);
 const dark=new T.MeshStandardMaterial({color:'#123848',emissive:'#0d384a',emissiveIntensity:.45,roughness:.8}),fishMat=new T.MeshStandardMaterial({color:'#bcd6cd',roughness:.4,metalness:.2}),finMat=new T.MeshStandardMaterial({color:'#b48a51',roughness:.5,metalness:.2,side:T.DoubleSide});
 b.box(14.6,.36,3.7,m.endgrain,0,-1.99,0);b.box(14.6,.24,3.7,m.endgrain,0,2.05,0);b.box(14,.08,3.4,m.stone,0,-1.78,0);b.box(14,3.8,.16,dark,0,0,1.7);
 for(const x of [-7,7]){b.box(.24,3.9,3.6,m.endgrain,x,0,0);b.box(.035,3.6,.06,m.brass,x-.14*Math.sign(x),0,-1.81);}b.box(13.8,.045,.05,m.coolLamp,0,1.86,-1.76);b.box(13.8,.035,.05,m.brass,0,-1.77,-1.77);
 // Shoji panels intentionally use an opaque material; the viewing glass must not inherit it.
 const glass=new T.MeshPhysicalMaterial({color:'#b0e3ed',transparent:true,opacity:.075,roughness:.08,metalness:.05,clearcoat:1,depthWrite:false});glass.userData.exteriorWindow=false;b.box(13.8,3.6,.025,glass,0,0,-1.76).name='aquarium-viewing-glass';
 const line=new T.MeshBasicMaterial({color:'#bae4e3',transparent:true,opacity:.1,depthWrite:false});for(const x of [-6.8,6.8])b.box(.03,3.4,.02,line,x,0,-1.8);
 // Stones and rooted aquatic grasses share the same freshwater environment.
 for(let i=0;i<23;i++){const x=-6.5+i*.57,z=.35+Math.sin(i*2.3)*.7;b.oval(i%2?m.stone:m.darkStone,x,-1.62,z,.24+(i%3)*.13,.16+(i%4)*.1,.25);}
 b.tube([[-1.6,-1.65,.4],[-.4,-1.15,.2],[.5,-1.35,.6],[1.4,-1.65,.9]],.17,m.endgrain);
 for(let i=0;i<35;i++){const x=-6.4+i*.38,z=.65+Math.sin(i*2.4)*.55;for(let j=0;j<3;j++){const h=.45+(i%7)*.16,a=j*2.1+i;const shape=new T.Shape();shape.moveTo(0,0);shape.quadraticCurveTo(.22,h*.65,.05,h);shape.quadraticCurveTo(-.12,h*.5,0,0);const leaf=b.mesh(new T.ShapeGeometry(shape,8),i%2?m.leaf:m.sage,x,-1.7,z);leaf.rotation.y=a;leaf.rotation.z=Math.sin(a)*.2;}}
 mergeFinish(root);
 const sphere=new T.SphereGeometry(1,16,10),coarse=new T.SphereGeometry(1,8,6),tailShape=new T.Shape();tailShape.moveTo(0,0);tailShape.lineTo(-.7,.6);tailShape.quadraticCurveTo(-.45,0,-.7,-.6);tailShape.closePath();const tailGeo=new T.ExtrudeGeometry(tailShape,{depth:.035,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:1,steps:1});
 const bodies=new T.InstancedMesh(sphere,fishMat,32),tails=new T.InstancedMesh(tailGeo,finMat,32),eyes=new T.InstancedMesh(sphere,new T.MeshBasicMaterial({color:'#172c30'}),64);bodies.name='aquarium-instanced-fish';for(const o of [bodies,tails,eyes]){o.frustumCulled=false;root.add(o);}const colors=['#d8c794','#b2d9d5','#d89571','#718d9a'];for(let i=0;i<32;i++)bodies.setColorAt(i,new T.Color(colors[i%4]));
 const aquariumLight=new T.PointLight('#93dfed',22,16,2);aquariumLight.position.set(0,1.45,-.9);root.add(aquariumLight);
 const school=createFishSchool(),dummy=new T.Object3D(),fishFrame=new T.Object3D(),time={value:0};
 const finShape=new T.Shape();finShape.moveTo(-.5,.15);finShape.quadraticCurveTo(-.1,.8,.38,.2);finShape.closePath();const fins=new T.InstancedMesh(new T.ShapeGeometry(finShape,8),finMat,32);fins.frustumCulled=false;root.add(fins);
 const caustic=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float time;void main(){vec2 p=vUv*vec2(11.,5.);float a=sin(p.x*2.3+sin(p.y*2.+time*.3))+cos(p.y*3.1+sin(p.x+time*.24));float b=sin(p.x*3.2-p.y*2.7+time*.16);float c=pow(max(0.,1.-abs(a+b)*1.8),5.);gl_FragColor=vec4(.42,.83,.85,c*.18);}' });
 const light=b.mesh(new T.PlaneGeometry(13.6,6),caustic,0,-2.142,-3);light.rotation.x=-Math.PI/2;const underwater=b.mesh(new T.PlaneGeometry(13.7,3.2),caustic,0,-1.735,0);underwater.rotation.x=-Math.PI/2;
 const data=new Float32Array(80*3),phases=new Float32Array(80);for(let i=0;i<80;i++){data[i*3]=Math.sin(i*2.399)*6.3;data[i*3+1]=-1.6;data[i*3+2]=Math.cos(i*1.7)*1.2;phases[i]=i/80;}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(data,3));geo.setAttribute('phase',new T.BufferAttribute(phases,1));const bubble=new T.Points(geo,new T.ShaderMaterial({uniforms:{time},transparent:true,depthWrite:false,vertexShader:'attribute float phase;uniform float time;void main(){vec3 p=position;p.y+=mod(phase*3.4+time*.28,3.4);p.x+=sin(time+phase*30.)*.08;vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(24./-v.z,1.,3.);}',fragmentShader:'void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(.7,.94,1.,smoothstep(.5,.34,d)*.3);}' }));bubble.frustumCulled=false;root.add(bubble);
 let count=24,quality='medium',elapsed=0,last=0;
 function update(t,still=false,player){const distance=player?Math.hypot(player.x-(parent.position.x-12),player.z-(parent.position.z+root.position.z)):0;elapsed+=Math.max(0,Math.min(.1,t-last));last=t;if(still){time.value=0;return;}if(elapsed<(distance>25?.2:1/24))return;const dt=elapsed;elapsed=0;time.value=t;let remaining=dt;while(remaining>0){const step=Math.min(.08,remaining);school.step(step,count);remaining-=step;}const geometry=quality==='low'||distance>20?coarse:sphere;bodies.geometry=eyes.geometry=geometry;for(let i=0;i<count;i++){
 const f=school.fish[i],yaw=-Math.atan2(f.vz,f.vx),s=f.size;
 fishFrame.position.set(f.x,f.y,f.z);fishFrame.rotation.set(0,yaw,Math.max(-.3,Math.min(.3,Math.atan2(f.vy,Math.hypot(f.vx,f.vz)))));fishFrame.scale.setScalar(s);fishFrame.updateMatrix();
 const place=(mesh,index,x,y,z,sx,sy,sz,turn=0)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,turn,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();dummy.matrix.premultiply(fishFrame.matrix);mesh.setMatrixAt(index,dummy.matrix);};
 place(bodies,i,0,0,0,1,.42,.25);
 place(tails,i,-.85,0,0,.7,.7,.7,Math.sin(t*6+f.phase)*.26);
 place(fins,i,-.1,.19,0,.9,.7,1);
 for(let side=0;side<2;side++)place(eyes,i*2+side,.62,.08,(side?1:-1)*.19,.055,.055,.055);
 }for(const o of [bodies,tails,eyes,fins])o.instanceMatrix.needsUpdate=true;}
 function setQuality(q){quality=q;count=q==='low'?12:q==='high'?32:24;bodies.count=tails.count=fins.count=count;eyes.count=count*2;geo.setDrawRange(0,q==='low'?24:q==='high'?80:48);}update(.1,false);return{root,school,update,setQuality,dispose(){sphere.dispose();coarse.dispose();}};
}
