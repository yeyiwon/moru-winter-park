import * as T from './vendor/three.module.js';
import {makeBuilder,mergeFinish} from './architecture-kit.js';
import {aquariumLayout as layout,aquariumBounds as bounds,aquariumRocks} from './ryokan-aquarium-layout.js';
const axes=['x','y','z'];
// Deterministic steering with bounded acceleration, separation and soft wall avoidance.
export function createFishSchool(count=72){
 let seed=381;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;
 const fish=Array.from({length:count},(_,i)=>{
  const f={x:(rand()-.5)*33,y:(rand()-.5)*5.8,z:(i%3-1)*2.2+(rand()-.5)*.7,vx:(i%3===1?-1:1)*(.35+rand()*.35),vy:0,vz:(rand()-.5)*.12,phase:rand()*Math.PI*2,size:i<4?1.05+rand()*.25:.28+rand()*.36};
  for(const k of axes){const edge=bounds[k]-f.size*(k==='y'?.62:1.6);f[k]=Math.max(-edge,Math.min(edge,f[k]));}
  f.heading=-Math.atan2(f.vz,f.vx);return f;
 });
 const schools=Array.from({length:6},()=>({x:0,y:0,z:0,vx:0}));let time=0;
 return{fish,step(delta,n=count){
  if(!Number.isFinite(delta))return fish;
  const dt=Math.min(.08,Math.max(0,delta));n=Math.max(0,Math.min(count,Number.isFinite(n)?Math.floor(n):count));time+=dt;
  // Three loose shoals follow broad, overlapping currents instead of each fish
  // oscillating alone. Neighbour separation still has priority near a turn.
  for(let i=0;i<6;i++){const phase=time*(.045+i*.006)+i*Math.PI/3,lane=schools[i];lane.x=Math.cos(phase)*11.4;lane.y=Math.sin(phase*.73+i)*1.8;lane.z=(i%3-1)*2.15+Math.sin(phase*.57)*.35;lane.vx=-Math.sin(phase)*.48;}
  for(let i=0;i<n;i++){
   const f=fish[i],lane=schools[i%6],solo=i<4;
   const targetX=solo?Math.sin(time*.035+f.phase)*14:lane.x+Math.sin(f.phase)*4.8,targetY=solo?Math.sin(time*.06+f.phase)*2.4:lane.y+Math.cos(f.phase)*1.15,targetZ=solo?Math.sin(time*.04+f.phase)*1.5:lane.z+Math.cos(f.phase)*.42;
   let ax=(targetX-f.x)*.033+(lane.vx-f.vx)*.12,ay=(targetY-f.y)*.04+Math.sin(time*.34+f.phase)*.018,az=(targetZ-f.z)*.06+Math.cos(time*.21+f.phase)*.016;
   for(let j=0;j<n;j++){
    if(i===j)continue;
    const p=fish[j],dx=f.x-p.x,dy=f.y-p.y,dz=f.z-p.z,d=dx*dx+dy*dy+dz*dz;
    const spacing=(f.size+p.size)*1.25+.65,space2=spacing*spacing;
    if(d<space2&&d>.001){const repel=(space2-d)*.32/(space2*(d+.12));ax+=dx*repel;ay+=dy*repel;az+=dz*repel;}
    else if(!solo&&d<9&&i%6===j%6){ax+=(p.vx-f.vx)*.016;ay+=(p.vy-f.vy)*.01;az+=(p.vz-f.vz)*.016;}
   }
 for(const k of axes){const limit=bounds[k]-f.size*(k==='y'?.62:1.6),margin=Math.min(.8,Math.max(.03,limit*.42)),v=f[k],push=Math.sign(v)*Math.max(0,(Math.abs(v)-(limit-margin))/margin)**2*.95;if(k==='x')ax-=push;if(k==='y')ay-=push;if(k==='z')az-=push;}
 // Keep clear of the two planted rock banks.
 for(const rock of aquariumRocks){const dx=(f.x-rock.x)/(rock.sx+f.size),dy=(f.y-rock.y)/(rock.sy+f.size*.65),dz=(f.z-rock.z)/(rock.sz+f.size);if(dx*dx+dy*dy+dz*dz<1.5){ay+=.35;az-=.3;ax+=dx*.18;}}
 const acceleration=Math.hypot(ax,ay,az);if(acceleration>.85){ax*=.85/acceleration;ay*=.85/acceleration;az*=.85/acceleration;}
 f.vx+=ax*dt;f.vy=Math.max(-.14,Math.min(.14,f.vy+ay*dt));f.vz+=az*dt;const speed=Math.hypot(f.vx,f.vy,f.vz),limit=i<4?.7:1.15;if(speed>limit){f.vx*=limit/speed;f.vy*=limit/speed;f.vz*=limit/speed;}
 for(const k of axes){f[k]+=f['v'+k]*dt;const edge=bounds[k]-f.size*(k==='y'?.62:1.6);if(Math.abs(f[k])>edge){f[k]=Math.sign(f[k])*edge;f['v'+k]*=-.35;}}
 const heading=-Math.atan2(f.vz,f.vx),turn=Math.atan2(Math.sin(heading-f.heading),Math.cos(heading-f.heading));f.heading+=Math.max(-dt*1.7,Math.min(dt*1.7,turn));
  }return fish;
 }};
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
 const root=new T.Group();root.name='ryokan-panorama-aquarium';root.userData.keepGroup=true;root.position.set(layout.x,layout.y,layout.z);root.rotation.y=Math.PI;parent.add(root);const b=makeBuilder(root),time={value:0},detail={value:.65};
 const stone=new T.MeshStandardMaterial({color:'#52655b',roughness:.94}),sand=new T.MeshStandardMaterial({color:'#8e9f8b',roughness:.96}),fishMat=new T.MeshStandardMaterial({color:'#f2f6e8',emissive:'#5d9890',emissiveIntensity:.11,roughness:.26,metalness:.2,vertexColors:true}),finMat=new T.MeshStandardMaterial({color:'#aabcb0',roughness:.62,side:T.DoubleSide});
 for(const material of [stone,sand]){
  material.onBeforeCompile=shader=>{shader.uniforms.aquariumTime=time;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWaterRock;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWaterRock=position;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float aquariumTime;varying vec3 vWaterRock;').replace('#include <color_fragment>',`#include <color_fragment>
   vec2 rp=vWaterRock.xz*2.;float n=sin(rp.x*2.1+sin(rp.y*1.9+aquariumTime*.24))+cos(rp.y*2.2+sin(rp.x*1.7-aquariumTime*.19));float c=pow(max(0.,1.-abs(n)*3.),10.);diffuseColor.rgb*=.96+.04*fract(sin(dot(floor(vWaterRock*65.),vec3(127.1,311.7,74.7)))*43758.5453);diffuseColor.rgb+=vec3(.12,.2,.16)*c;`);};material.customProgramCacheKey=()=> 'aquarium-stone-caustic-v33';
 }
 const back=new T.ShaderMaterial({side:T.DoubleSide,uniforms:{time,detail},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;uniform float time;uniform float detail;
  void main(){
   float height=smoothstep(0.,1.,vUv.y),edge=1.-smoothstep(.32,.58,abs(vUv.x-.5));
   vec3 c=mix(vec3(.002,.009,.027),vec3(.012,.067,.092),height);
   c+=vec3(.003,.018,.025)*sin(vUv.y*3.14159)*edge;
   float drift=sin(vUv.y*3.1+time*.28)*.021;
   float broad=0.;if(detail>.4){drift+=sin(vUv.y*7.-time*.19)*.009;broad=pow(.5+.5*sin(vUv.x*13.+vUv.y*1.8-time*.12),4.);}
   float beam=pow(.5+.5*sin((vUv.x+drift)*42.+sin(vUv.x*17.-time*.23)),8.);
   float light=(beam*.052+broad*.022)*(.25+.75*height)*edge;
   if(detail>.4)light+=pow(.5+.5*sin((vUv.x-drift*.6)*71.+time*.16),18.)*.012*height;
   c+=vec3(.49,.74,.69)*light;
   c+=vec3(.06,.055,.032)*pow(height,7.);
   gl_FragColor=vec4(c,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});
 // The full wall reveal, deep side returns and actual overhead water surface
 // make the volume readable from oblique seats, not just from a frontal camera.
 b.box(39.5,.55,8.7,m.endgrain,0,-4.38,0);b.box(39.5,.46,8.7,m.endgrain,0,4.52,0);
 const bed=new T.PlaneGeometry(38,8,96,24);bed.rotateX(-Math.PI/2);
 const bp=bed.attributes.position;for(let i=0;i<bp.count;i++){const x=bp.getX(i),z=bp.getZ(i);bp.setY(i,-4.12+.12*Math.sin(x*.5+z)+.16*Math.cos(x*.23-z*.7)+.2*(z+4)/8);}bed.computeVertexNormals();b.mesh(bed,sand);
 const backdrop=b.mesh(new T.PlaneGeometry(38.5,8.7),back,0,0,4.12);backdrop.name='aquarium-moving-light-depth';
 for(const x of [-19.42,19.42]){b.box(.32,9.2,8.7,m.endgrain,x,0,0);b.box(.065,8.7,.1,m.brass,x-.2*Math.sign(x),0,-4.24);}
 b.box(38.5,.08,.06,m.coolLamp,0,4.28,-4.12);b.box(38.5,.05,.09,m.brass,0,-4.15,-4.24);
 for(const x of [-19.6,19.6])b.box(.18,9.2,.34,m.lightWood,x,0,-4.3);
 const glass=new T.MeshPhysicalMaterial({color:'#b0e3ed',transparent:true,opacity:.035,roughness:.05,metalness:0,clearcoat:1,depthWrite:false});glass.userData.exteriorWindow=false;
 // The existing glass draw carries a soft moving waterline and surface glints;
 // no second transparent sheet, reflection render target or postprocess is added.
 glass.onBeforeCompile=shader=>{
  shader.uniforms.aquariumTime=time;shader.uniforms.aquariumDetail=detail;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vAquariumGlass;').replace('#include <begin_vertex>','#include <begin_vertex>\nvAquariumGlass=position.xy/vec2(38.6,8.8)+vec2(.5);');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float aquariumTime;uniform float aquariumDetail;varying vec2 vAquariumGlass;').replace('#include <color_fragment>',`#include <color_fragment>
   float ripple=sin(vAquariumGlass.x*19.+aquariumTime*.67)*.003+sin(vAquariumGlass.x*31.-aquariumTime*.49)*.0015;
   float waterline=1.-smoothstep(.001,.008,abs(vAquariumGlass.y-(.953+ripple)));
   float surface=exp(-abs(vAquariumGlass.y-(.934+ripple*2.))*42.);
   float glint=pow(.5+.5*sin(vAquariumGlass.x*73.+sin(vAquariumGlass.x*17.+aquariumTime*.31)*2.-aquariumTime*.43),14.)*surface;
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.7,.84,.79),waterline*.3+glint*.18);
   diffuseColor.a+=waterline*.19+glint*(.08+.06*aquariumDetail);
  `);
 };glass.customProgramCacheKey=()=> 'aquarium-waterline-v43';
 b.box(38.6,8.8,.08,glass,0,0,-4.2).name='aquarium-viewing-glass';
 // Asymmetric planted banks leave a broad open-water channel through the middle.
 const rockGeo=new T.IcosahedronGeometry(1,2),rp=rockGeo.attributes.position;
 for(let i=0;i<rp.count;i++){const x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i),n=1+.09*Math.sin(x*9+y*4)+.055*Math.sin(z*11-y*6);rp.setXYZ(i,x*n,y*n,z*n);}rockGeo.computeVertexNormals();const rn=rockGeo.attributes.normal;for(let i=0;i<rn.count;i++){const v=new T.Vector3().fromBufferAttribute(rp,i).normalize();rn.setXYZ(i,v.x,v.y,v.z);}
 for(const {x,y,z,sx,sy,sz}of aquariumRocks){const rock=b.mesh(rockGeo,stone,x,y,z);rock.scale.set(sx,sy,sz);rock.rotation.set(.08,x*.12,.08);}
 for(let i=0;i<54;i++){const x=-18.4+i*.69,z=Math.sin(i*2.399)*3.5;const rock=b.mesh(rockGeo,i%3?sand:stone,x,-3.98,z);rock.scale.set(.12+(i%4)*.13,.08+(i%3)*.08,.16+(i%5)*.06);}
 for(const side of [-1,1]){b.tube([[side*16,-3.6,2.6],[side*14,-2.5,1.6],[side*11.5,-1.7,2.1],[side*9.8,-.7,2.8]],.12,m.endgrain);b.tube([[side*14,-2.5,1.6],[side*13.8,-1,2],[side*13.2,.9,2.8]],.075,m.endgrain);}
 const seaGrass=new T.MeshStandardMaterial({color:'#477967',emissive:'#0a211b',emissiveIntensity:.32,roughness:.85,side:T.DoubleSide});
 const plantPositions=[],plantIndices=[];for(let leaf=0;leaf<7;leaf++){const angle=leaf*2.399,h=1.2+(leaf%4)*.38,bend=.3+(leaf%3)*.16,base=plantPositions.length/3;for(let row=0;row<=8;row++){const t=row/8,w=Math.sin(Math.PI*t)*(.12+(leaf%3)*.05);for(const side of [-1,1])plantPositions.push(Math.cos(angle)*bend*t*t-Math.sin(angle)*w*side,h*t,Math.sin(angle)*bend*t*t+Math.cos(angle)*w*side);if(row<8){const k=base+row*2;plantIndices.push(k,k+2,k+1,k+1,k+2,k+3);}}}const plantGeometry=new T.BufferGeometry();plantGeometry.setAttribute('position',new T.Float32BufferAttribute(plantPositions,3));plantGeometry.setIndex(plantIndices);plantGeometry.computeVertexNormals();
 const plants=new T.InstancedMesh(plantGeometry,seaGrass,120);plants.name='aquarium-swaying-grass';plants.userData.keep=true;
 const plantPose=new T.Object3D();for(let i=0;i<120;i++){const x=Math.sin(i*2.399)*18,z=.2+Math.cos(i*1.71)*3.1;plantPose.position.set(x,-4,z);plantPose.rotation.y=i*1.7;plantPose.scale.set(.7+(i%4)*.18,.3+(i%9)*.12+(z>1?.5:0),1);plantPose.updateMatrix();plants.setMatrixAt(i,plantPose.matrix);}root.add(plants);
 seaGrass.onBeforeCompile=s=>{s.uniforms.aquariumTime=time;s.vertexShader='uniform float aquariumTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x+=sin(aquariumTime*.58+instanceMatrix[3].x*.7)*.065*position.y*position.y;');};seaGrass.customProgramCacheKey=()=> 'aquarium-vegetation-v57';
 mergeFinish(root);
 const surfaceMaterial=new T.ShaderMaterial({side:T.DoubleSide,transparent:true,depthWrite:false,uniforms:{time},vertexShader:'uniform float time;varying vec3 p;void main(){p=position;vec3 v=position;v.y+=sin(v.x*.8+time*.6)*.025+cos(v.z*2.-time*.4)*.018;gl_Position=projectionMatrix*modelViewMatrix*vec4(v,1.);}',fragmentShader:`uniform float time;varying vec3 p;void main(){float flow=sin(p.x*1.7+sin(p.z*2.+time*.3))+cos(p.z*2.8-time*.4);float glitter=pow(max(0.,1.-abs(flow)*3.),8.);gl_FragColor=vec4(vec3(.025,.11,.14)+vec3(.18,.36,.4)*glitter,.16+glitter*.1);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const surfaceGeometry=new T.PlaneGeometry(38.5,8.1,64,16);surfaceGeometry.rotateX(-Math.PI/2);b.mesh(surfaceGeometry,surfaceMaterial,0,4.15,0).name='aquarium-water-surface';
 const fine=fishBodyGeometry(),coarse=fishBodyGeometry(8,10),sphere=new T.SphereGeometry(1,8,6);
 const fan=new T.Shape();fan.moveTo(0,0);fan.quadraticCurveTo(-.25,.14,-.63,.46);fan.quadraticCurveTo(-.48,0,-.63,-.46);fan.quadraticCurveTo(-.25,-.14,0,0);
 const dorsal=new T.Shape();dorsal.moveTo(-.5,0);dorsal.quadraticCurveTo(-.2,.5,.25,.03);dorsal.closePath();
 const sideFin=new T.Shape();sideFin.moveTo(0,0);sideFin.quadraticCurveTo(-.3,-.35,-.48,-.23);sideFin.lineTo(-.1,.05);sideFin.closePath();
 const bodies=new T.InstancedMesh(fine,fishMat,72),tails=new T.InstancedMesh(new T.ShapeGeometry(fan,8),finMat,72),fins=new T.InstancedMesh(new T.ShapeGeometry(dorsal,8),finMat,72),pectoral=new T.InstancedMesh(new T.ShapeGeometry(sideFin,6),finMat,144),eyes=new T.InstancedMesh(sphere,new T.MeshBasicMaterial({color:'#102625'}),144);
 const meshes=[bodies,tails,fins,pectoral,eyes];bodies.name='aquarium-instanced-fish';
 for(const o of meshes){o.frustumCulled=true;o.boundingSphere=new T.Sphere(new T.Vector3(),21);root.add(o);}
 const colors=['#c6d8ce','#8dbeb4','#d7b38c','#b5c6cd'];for(let i=0;i<72;i++)bodies.setColorAt(i,new T.Color(colors[i%4]));
 fishMat.onBeforeCompile=shader=>{
  shader.uniforms.aquariumTime=time;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float aquariumTime;attribute float swimPhase;varying vec3 vAquariumFish;').replace('#include <begin_vertex>',`#include <begin_vertex>
   float tailWeight=1.-smoothstep(-1.05,.3,position.x);
   transformed.z+=sin(aquariumTime*4.2+swimPhase-position.x*1.8)*.035*tailWeight;
   vAquariumFish=(instanceMatrix*vec4(transformed,1.)).xyz;
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float aquariumTime;varying vec3 vAquariumFish;').replace('#include <color_fragment>',`#include <color_fragment>
   float flow=sin(vAquariumFish.x*2.3+sin(vAquariumFish.z*2.+aquariumTime*.38))+cos(vAquariumFish.z*3.1-aquariumTime*.3);
   float silver=pow(max(0.,1.-abs(flow)*2.4),6.)*.075;
   diffuseColor.rgb+=vec3(.65,.9,.83)*silver*smoothstep(-3.,3.,vAquariumFish.y);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.035,.16,.2),smoothstep(-3.8,4.,vAquariumFish.z)*.55);
  `);
 };fishMat.customProgramCacheKey=()=> 'aquarium-swimming-fish-v43';
 for(const x of [-12,0,12]){const aquariumLight=new T.PointLight('#9edee4',52,16,2);aquariumLight.position.set(x,2.8,-1.8);root.add(aquariumLight);}
 const caustic=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time,detail},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 vP;uniform float time;uniform float detail;
  void main(){vec2 p=vP.xz*2.;p+=vec2(sin(p.y*1.3+time*.38),cos(p.x*.9-time*.29))*.5;float a=sin(p.x*2.1+sin(p.y*1.9)),b=cos(p.y*2.2+sin(p.x*1.7));float vein=pow(max(0.,1.-abs(a+b)*3.),8.);float boundary=1.-smoothstep(15.,19.,abs(vP.x));gl_FragColor=vec4(.61,.86,.8,vein*(.14+.07*detail)*boundary);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 const causticFloor=b.mesh(new T.PlaneGeometry(38,8),caustic,0,-3.89,0);causticFloor.rotation.x=-Math.PI/2;
 // Use a world-oriented plane so the caustic field is not collapsed to a single UV axis.
 causticFloor.geometry.rotateX(-Math.PI/2);causticFloor.rotation.x=0;
 const spillMaterial=caustic.clone();spillMaterial.uniforms={time,detail:{value:-1.1}};const spill=b.mesh(new T.PlaneGeometry(38,4.6),spillMaterial,0,-4.83,-6.4);spill.geometry.rotateX(-Math.PI/2);
 const data=new Float32Array(64*3),phases=new Float32Array(64);for(let i=0;i<64;i++){data[i*3]=Math.sin(i*2.399)*18.3;data[i*3+1]=-3.8;data[i*3+2]=Math.cos(i*1.7)*3.5;phases[i]=i/64;}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(data,3));geo.setAttribute('phase',new T.BufferAttribute(phases,1));
 const bubbles=new T.Points(geo,new T.ShaderMaterial({uniforms:{time},transparent:true,depthWrite:false,vertexShader:'attribute float phase;uniform float time;void main(){vec3 p=position;float rise=mod(phase*7.7+time*(.16+phase*.06),7.7);p.y+=rise;p.x+=sin(time*.5+phase*30.+rise)*.085;vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(25./max(1.,-v.z),1.,2.8);}',fragmentShader:'void main(){float d=length(gl_PointCoord-.5)*2.;float edge=(1.-smoothstep(.67,1.,d))*smoothstep(.2,.67,d);float shine=exp(-dot(gl_PointCoord-vec2(.34,.65),gl_PointCoord-vec2(.34,.65))*50.);gl_FragColor=vec4(.74,.92,.91,(edge*.2+shine*.12)*(1.-smoothstep(.8,1.,d)));}'}));bubbles.frustumCulled=true;geo.boundingSphere=new T.Sphere(new T.Vector3(),21);bubbles.name='aquarium-floating-bubbles';root.add(bubbles);
 const school=createFishSchool(),dummy=new T.Object3D(),fishFrame=new T.Object3D(),worldPosition=new T.Vector3();
 const phasesAttribute=new T.InstancedBufferAttribute(new Float32Array(school.fish.map(f=>f.phase)),1);fine.setAttribute('swimPhase',phasesAttribute);coarse.setAttribute('swimPhase',phasesAttribute);
 let count=48,quality='medium',elapsed=0,last=null,lastDrawn=0,hasDrawn=false,disposed=false;
 const markDrawn=()=>{hasDrawn=true;lastDrawn=last??0;};backdrop.onBeforeRender=markDrawn;for(const mesh of meshes)mesh.onBeforeRender=markDrawn;
 function place(mesh,index,x,y,z,sx,sy,sz,turn=0,roll=0){dummy.position.set(x,y,z);dummy.rotation.set(roll,turn,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();dummy.matrix.premultiply(fishFrame.matrix);mesh.setMatrixAt(index,dummy.matrix);}
 function writeInstances(){
  const t=time.value;
  for(let i=0;i<count;i++){
   const f=school.fish[i],yaw=f.heading,s=f.size;
   fishFrame.position.set(f.x,f.y,f.z);fishFrame.rotation.set(0,yaw,Math.max(-.22,Math.min(.22,Math.atan2(f.vy,Math.hypot(f.vx,f.vz)))));fishFrame.scale.setScalar(s);fishFrame.updateMatrix();
   const beat=Math.sin(t*4.2+f.phase)*.24;
   place(bodies,i,0,0,0,1,i%4===1?1.25:1,1);
   place(tails,i,-1.02,0,Math.sin(t*4.2+f.phase+1.84)*.035,.8,.8,1,beat);place(fins,i,-.08,.3,0,.9,.72,1);
   for(let side=0;side<2;side++){const sign=side?1:-1;place(eyes,i*2+side,.68,.06,sign*.115,.032,.032,.025);place(pectoral,i*2+side,.28,-.12,sign*.16,.7,.7,1,sign*(.55+beat*.4),sign*.4);}
  }
  for(const o of meshes)o.instanceMatrix.needsUpdate=true;
 }
 function update(t,still=false,player){
  if(disposed||!Number.isFinite(t))return false;
  const dt=last===null?0:Math.max(0,Math.min(.1,t-last));last=t;
  let visible=true;for(let node=root;node;node=node.parent)if(!node.visible){visible=false;break;}
  if(!visible||still){elapsed=0;return false;}
  time.value+=dt;elapsed+=dt;
  root.getWorldPosition(worldPosition);
  const distance=player&&Number.isFinite(player.x)&&Number.isFinite(player.z)?Math.hypot(player.x-worldPosition.x,player.z-worldPosition.z):0;
  const offscreen=hasDrawn&&t-lastDrawn>.25,cadence=offscreen||distance>55?.2:quality==='low'?1/24:1/30;
  if(elapsed<cadence)return false;
  let remaining=elapsed;elapsed=0;while(remaining>0){const step=Math.min(.08,remaining);school.step(step,count);remaining-=step;}
  bodies.geometry=quality==='low'||distance>45?coarse:fine;writeInstances();return true;
 }
 function setQuality(q){
  if(disposed)return;
  quality=['low','medium','high'].includes(q)?q:'medium';count=quality==='low'?28:quality==='high'?72:48;plants.count=quality==='low'?40:quality==='high'?120:80;
  detail.value=quality==='low'?.25:quality==='high'?1:.65;
  bodies.count=tails.count=fins.count=count;eyes.count=pectoral.count=count*2;geo.setDrawRange(0,quality==='low'?20:quality==='high'?64:40);
  bodies.geometry=quality==='low'?coarse:fine;writeInstances();
 }
 setQuality('medium');return{root,school,update,setQuality,dispose(){if(disposed)return;disposed=true;fine.dispose();coarse.dispose();}};
}
