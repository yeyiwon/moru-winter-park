import * as T from './vendor/three.module.js';
import {makeBuilder,mergeFinish} from './architecture-kit.js';
const bounds={x:6.65,y:1.65,z:1.35};
// Deterministic steering with bounded acceleration, separation and soft wall avoidance.
export function createFishSchool(count=32){
 let seed=381;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;
 const fish=Array.from({length:count},(_,i)=>({x:(rand()-.5)*11,y:(rand()-.5)*2.6,z:(rand()-.5)*2.1,vx:(rand()-.5)*.8,vy:0,vz:(rand()-.5)*.3,phase:rand()*Math.PI*2,size:i<2?.8:.28+rand()*.25}));let time=0;
 return{fish,step(delta,n=count){const dt=Math.min(.08,Math.max(0,delta));time+=dt;for(let i=0;i<n;i++){const f=fish[i];let ax=Math.cos(time*.19+f.phase)*.18,ay=Math.sin(time*.27+f.phase)*.09,az=Math.cos(time*.13+f.phase)*.08;for(let j=0;j<n;j++){if(i===j)continue;const p=fish[j],dx=f.x-p.x,dy=f.y-p.y,dz=f.z-p.z,d=dx*dx+dy*dy+dz*dz;if(d<.65&&d>.001){ax+=dx*.2/d;ay+=dy*.2/d;az+=dz*.2/d;}else if(d<12&&i%3===j%3){ax+=(p.vx-f.vx)*.035-dx*.006;az+=(p.vz-f.vz)*.035-dz*.006;}}
 for(const k of ['x','y','z']){const limit=bounds[k]-f.size*(k==='y'?.62:1.6),v=f[k],push=Math.sign(v)*Math.max(0,(Math.abs(v)-(limit-.75))/.75)**2*.9;if(k==='x')ax-=push;if(k==='y')ay-=push;if(k==='z')az-=push;}
 // Keep clear of the two planted rock banks.
 if(Math.abs(f.x)>3.5&&f.y<-.4&&f.z>.1){ay+=.4;az-=.2;}
 f.vx+=ax*dt;f.vy=Math.max(-.14,Math.min(.14,f.vy+ay*dt));f.vz+=az*dt;const speed=Math.hypot(f.vx,f.vy,f.vz),limit=i<2?.75:1.15;if(speed>limit){f.vx*=limit/speed;f.vy*=limit/speed;f.vz*=limit/speed;}for(const k of ['x','y','z']){f[k]+=f['v'+k]*dt;const edge=bounds[k]-f.size*(k==='y'?.62:1.6);if(Math.abs(f[k])>edge){f[k]=Math.sign(f[k])*edge;f['v'+k]*=-.35;}}}return fish;}};
}
export function fishBodyGeometry(segments=16,rings=20){
 const pos=[],normalColors=[],uv=[],indices=[];
 for(let i=0;i<=rings;i++){
  const t=i/rings,x=-1.05+t*2.05,profile=Math.pow(Math.sin(Math.PI*t),.65)*(1-.23*t)+.035;
  for(let j=0;j<=segments;j++){
   const a=j/segments*Math.PI*2,y=Math.cos(a)*profile*.39,z=Math.sin(a)*profile*.19;
   pos.push(x,y,z);uv.push(t,j/segments);
   const belly=.64+.36*(1-Math.cos(a))*.5,scale=.96+.04*Math.sin(t*140.+j*.7);normalColors.push(belly*scale,(belly+.035)*scale,(belly+.045)*scale);
   if(i<rings&&j<segments){const n=i*(segments+1)+j;indices.push(n,n+1,n+segments+1,n+1,n+segments+2,n+segments+1);}
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(normalColors,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function buildRyokanAquarium(parent,m){
 const root=new T.Group();root.name='ryokan-panorama-aquarium';root.userData.keepGroup=true;root.position.set(-12,2.5,14.7);parent.add(root);const b=makeBuilder(root),time={value:0};
 const stone=new T.MeshStandardMaterial({color:'#52655b',roughness:.94}),sand=new T.MeshStandardMaterial({color:'#8e9f8b',roughness:.96}),fishMat=new T.MeshStandardMaterial({color:'#fff3d4',roughness:.38,metalness:.18,vertexColors:true}),finMat=new T.MeshStandardMaterial({color:'#b9a774',roughness:.7,side:T.DoubleSide});
 for(const material of [stone,sand]){
  material.onBeforeCompile=shader=>{shader.uniforms.aquariumTime=time;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWaterRock;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWaterRock=position;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float aquariumTime;varying vec3 vWaterRock;').replace('#include <color_fragment>',`#include <color_fragment>
   vec2 rp=vWaterRock.xz*2.;float n=sin(rp.x*2.1+sin(rp.y*1.9+aquariumTime*.24))+cos(rp.y*2.2+sin(rp.x*1.7-aquariumTime*.19));float c=pow(max(0.,1.-abs(n)*3.),10.);diffuseColor.rgb*=.96+.04*fract(sin(dot(floor(vWaterRock*65.),vec3(127.1,311.7,74.7)))*43758.5453);diffuseColor.rgb+=vec3(.12,.2,.16)*c;`);};material.customProgramCacheKey=()=> 'aquarium-stone-caustic-v33';
 }
 const back=new T.ShaderMaterial({side:T.DoubleSide,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;void main(){vec3 c=mix(vec3(.008,.026,.032),vec3(.025,.065,.07),vUv.y);float ray=pow(.5+.5*sin(vUv.x*39.+vUv.y*2.),12.)*vUv.y*.015;gl_FragColor=vec4(c+vec3(.35,.68,.64)*ray,1.);}'});
 b.box(14.8,.4,3.9,m.endgrain,0,-2.13,0);b.box(14.8,.42,3.9,m.endgrain,0,2.24,0);b.box(14.2,.12,3.4,sand,0,-1.88,0);
 b.mesh(new T.PlaneGeometry(14,4.2),back,0,0,1.72);
 for(const x of [-7.12,7.12]){b.box(.26,4.4,3.8,m.endgrain,x,.02,0);b.box(.035,4.2,.08,m.brass,x-.14*Math.sign(x),0,-1.86);}
 b.box(13.9,.06,.04,m.coolLamp,0,2.02,-1.72);b.box(13.9,.035,.06,m.brass,0,-1.9,-1.84);
 const glass=new T.MeshPhysicalMaterial({color:'#b0e3ed',transparent:true,opacity:.035,roughness:.05,metalness:0,clearcoat:1,depthWrite:false});glass.userData.exteriorWindow=false;
 b.box(13.95,4.1,.018,glass,0,.02,-1.82).name='aquarium-viewing-glass';
 // Asymmetric planted banks leave a broad open-water channel through the middle.
 const rockGeo=new T.IcosahedronGeometry(1,2),rp=rockGeo.attributes.position;
 for(let i=0;i<rp.count;i++){const x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i),n=1+.09*Math.sin(x*9+y*4)+.055*Math.sin(z*11-y*6);rp.setXYZ(i,x*n,y*n,z*n);}rockGeo.computeVertexNormals();const rn=rockGeo.attributes.normal;for(let i=0;i<rn.count;i++){const v=new T.Vector3().fromBufferAttribute(rp,i).normalize();rn.setXYZ(i,v.x,v.y,v.z);}
 for(const [x,y,z,sx,sy,sz]of [[-5.6,-1.2,.6,1.2,.8,.8],[-4.3,-1.5,.9,.8,.5,.6],[-6.3,-.6,1,1.1,1.25,.6],[4.8,-1.25,.7,1,.75,.7],[5.8,-1.2,1.15,1.2,.7,.5],[3.7,-1.55,1,.65,.35,.6]]){const rock=b.mesh(rockGeo,stone,x,y,z);rock.scale.set(sx,sy,sz);rock.rotation.set(.13,x*.6,.2);}
 for(let i=0;i<32;i++){const x=-6.6+i*.42,z=Math.sin(i*2.399)*1.3;const rock=b.mesh(rockGeo,i%3?sand:stone,x,-1.81,z);rock.scale.set(.07+(i%4)*.035,.05+(i%3)*.035,.09);}
 for(const side of [-1,1]){b.tube([[side*6,-1.7,1.1],[side*4.7,-1,.8],[side*3.7,-.8,1],[side*2.5,-.4,1.1]],.07,m.endgrain);b.tube([[side*4.7,-1,.8],[side*4.4,-.1,1.1],[side*3.9,.7,1.2]],.035,m.endgrain);}
 const seaGrass=new T.MeshStandardMaterial({color:'#527654',roughness:1,side:T.DoubleSide});
 const grass=new T.Group();grass.userData.keepGroup=true;grass.name='aquarium-swaying-grass';root.add(grass);const gb=makeBuilder(grass);
 for(let i=0;i<50;i++){const x=-6.5+i*.265,z=.85+Math.sin(i*2.399)*.5;const h=.45+(i%7)*.13+(Math.abs(x)>4?.3:0);for(let j=0;j<2;j++){const leaf=new T.Shape();leaf.moveTo(-.055,0);leaf.bezierCurveTo(-.22,h*.35,.27,h*.85,.12,h);leaf.bezierCurveTo(.18,h*.65,-.06,h*.25,.055,0);leaf.closePath();gb.mesh(new T.ShapeGeometry(leaf,8),seaGrass,x,-1.84,z).rotation.y=i+j*1.7;}}
 mergeFinish(grass);seaGrass.onBeforeCompile=s=>{s.uniforms.aquariumTime=time;s.vertexShader='uniform float aquariumTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat rise=max(0.,position.y+1.84);transformed.x+=sin(aquariumTime*.5+position.x*2.)*.055*rise;');};seaGrass.customProgramCacheKey=()=> 'aquarium-grass-v33';
 mergeFinish(root);
 const fine=fishBodyGeometry(),coarse=fishBodyGeometry(8,10),sphere=new T.SphereGeometry(1,8,6);
 const fan=new T.Shape();fan.moveTo(0,0);fan.quadraticCurveTo(-.25,.14,-.63,.46);fan.quadraticCurveTo(-.48,0,-.63,-.46);fan.quadraticCurveTo(-.25,-.14,0,0);
 const dorsal=new T.Shape();dorsal.moveTo(-.5,0);dorsal.quadraticCurveTo(-.2,.5,.25,.03);dorsal.closePath();
 const sideFin=new T.Shape();sideFin.moveTo(0,0);sideFin.quadraticCurveTo(-.3,-.35,-.48,-.23);sideFin.lineTo(-.1,.05);sideFin.closePath();
 const bodies=new T.InstancedMesh(fine,fishMat,32),tails=new T.InstancedMesh(new T.ShapeGeometry(fan,8),finMat,32),fins=new T.InstancedMesh(new T.ShapeGeometry(dorsal,8),finMat,32),pectoral=new T.InstancedMesh(new T.ShapeGeometry(sideFin,6),finMat,64),eyes=new T.InstancedMesh(sphere,new T.MeshBasicMaterial({color:'#102625'}),64);
 const meshes=[bodies,tails,fins,pectoral,eyes];bodies.name='aquarium-instanced-fish';for(const o of meshes){o.frustumCulled=false;root.add(o);}const colors=['#c0bd8a','#90b8ac','#d3a07a','#91a8ad'];for(let i=0;i<32;i++)bodies.setColorAt(i,new T.Color(colors[i%4]));
 const aquariumLight=new T.PointLight('#a4d9d2',18,15,2);aquariumLight.position.set(0,1.6,-.8);root.add(aquariumLight);
 const caustic=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 vP;uniform float time;
  void main(){vec2 p=vP.xz*2.;p+=vec2(sin(p.y*1.3+time*.24),cos(p.x*.9-time*.19))*.45;float a=sin(p.x*2.1+sin(p.y*1.9)),b=cos(p.y*2.2+sin(p.x*1.7));float vein=pow(max(0.,1.-abs(a+b)*3.),10.);float boundary=1.-smoothstep(4.3,6.8,abs(vP.x));gl_FragColor=vec4(.54,.87,.77,vein*.15*boundary);}`});
 const causticFloor=b.mesh(new T.PlaneGeometry(13.8,3.4),caustic,0,-1.81,0);causticFloor.rotation.x=-Math.PI/2;
 // Use a world-oriented plane so the caustic field is not collapsed to a single UV axis.
 causticFloor.geometry.rotateX(-Math.PI/2);causticFloor.rotation.x=0;
 const spill=b.mesh(new T.PlaneGeometry(13.8,4.6),caustic,0,-2.38,-3.4);spill.geometry=spill.geometry.clone();spill.geometry.rotateX(-Math.PI/2);
 const data=new Float32Array(64*3),phases=new Float32Array(64);for(let i=0;i<64;i++){data[i*3]=Math.sin(i*2.399)*6.3;data[i*3+1]=-1.6;data[i*3+2]=Math.cos(i*1.7)*1.2;phases[i]=i/64;}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(data,3));geo.setAttribute('phase',new T.BufferAttribute(phases,1));
 const bubbles=new T.Points(geo,new T.ShaderMaterial({uniforms:{time},transparent:true,depthWrite:false,vertexShader:'attribute float phase;uniform float time;void main(){vec3 p=position;p.y+=mod(phase*3.4+time*.18,3.4);p.x+=sin(time*.4+phase*30.)*.06;vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(22./-v.z,1.,2.6);}',fragmentShader:'void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(.7,.94,1.,smoothstep(.5,.34,d)*.24);}'}));bubbles.frustumCulled=false;root.add(bubbles);
 const school=createFishSchool(),dummy=new T.Object3D(),fishFrame=new T.Object3D();let count=24,quality='medium',elapsed=0,last=0;
 function update(t,still=false,player){
  const distance=player?Math.hypot(player.x-(parent.position.x-12),player.z-(parent.position.z+root.position.z)):0;elapsed+=Math.max(0,Math.min(.1,t-last));last=t;
  if(still)return;time.value=t;if(elapsed<(distance>25?.2:1/30))return;const dt=elapsed;elapsed=0;let remaining=dt;while(remaining>0){const step=Math.min(.08,remaining);school.step(step,count);remaining-=step;}
  bodies.geometry=quality==='low'||distance>20?coarse:fine;
  for(let i=0;i<count;i++){
   const f=school.fish[i],yaw=-Math.atan2(f.vz,f.vx),s=f.size;
   fishFrame.position.set(f.x,f.y,f.z);fishFrame.rotation.set(0,yaw,Math.max(-.22,Math.min(.22,Math.atan2(f.vy,Math.hypot(f.vx,f.vz)))));fishFrame.scale.setScalar(s);fishFrame.updateMatrix();
   const place=(mesh,index,x,y,z,sx,sy,sz,turn=0,roll=0)=>{dummy.position.set(x,y,z);dummy.rotation.set(roll,turn,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();dummy.matrix.premultiply(fishFrame.matrix);mesh.setMatrixAt(index,dummy.matrix);};
   const beat=Math.sin(t*4.2+f.phase)*.24;
   place(bodies,i,0,0,0,1,i%4===1?1.25:1,1);
   place(tails,i,-1.02,0,0,.8,.8,1,beat);place(fins,i,-.08,.3,0,.9,.72,1);
   for(let side=0;side<2;side++){const sign=side?1:-1;place(eyes,i*2+side,.68,.06,sign*.115,.032,.032,.025);place(pectoral,i*2+side,.28,-.12,sign*.16,.7,.7,1,sign*(.55+beat*.4),sign*.4);}
  }
  for(const o of meshes)o.instanceMatrix.needsUpdate=true;
 }
 function setQuality(q){quality=q;count=q==='low'?12:q==='high'?32:24;bodies.count=tails.count=fins.count=count;eyes.count=pectoral.count=count*2;geo.setDrawRange(0,q==='low'?20:q==='high'?64:40);}
 update(.1);return{root,school,update,setQuality,dispose(){fine.dispose();coarse.dispose();}};
}
