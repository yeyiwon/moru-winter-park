import {buildWinterBench} from './winter-bench.js';
import {createGondola} from './alpine-gondola.js';
import {createMountainTerrainSteps} from './mountain-terrain.js';
import {finishSteps} from './startup-work.js';
import {mergeFinish} from './architecture-kit.js';
import {sampleRide} from './winter-rides.js';
import {mergeMeshGeometrySteps,spatialBatchKey} from './mesh-batch.js';
import {landforms,landRadius} from './world-layout.js';
import {alpineTrees} from './alpine-forest-layout.js';
import {createTreeAtmosphere} from './tree-atmosphere.js';
import {buildResortScenery} from './resort-scenery.js';
import {createSnowPaths} from './snow-path.js';
import {buildParkLamps} from './park-lamps.js';
import * as THREE from './vendor/three.module.js';
import {skiTicketBooth,skiJumps,alpine,alpineHeight,summit as summitLayout,peakSummit,resortRides,ridgeLiftLayout,ridgeLiftPoint,ridgeTransfers,ridgeBase,ridgeSummit,gondolaEntry,gondolaApproach,liftApproach,gondolaPoints,liftLayout,liftPoint,upperLiftLayout,upperLiftPoint,skiRuns,skiRunCenter,skiRunHalfWidth,summitFacilities,summitTransfer,middleTransfer,mountainRest,skiStarts,skiRunouts} from './resort-blueprint.js';
import {mountainWayfinders,mountainBounds,mountainShelter,skiNetwork} from './mountain-layout.js';
import {alpineShift} from './resort-layout.js';

// Geometry and ride code sample the same height function: no decorative ramp above an unrelated floor.
export function buildAlpineResort(api){return finishSteps(buildAlpineResortSteps(api));}
export function* buildAlpineResortSteps(api){
 const hitMaterial=new THREE.MeshBasicMaterial({visible:false,colorWrite:false,depthTest:false,transparent:true,opacity:0,depthWrite:false});
 const {scene,mesh,ball:worldBall,cylinder,box,rod,torus:worldTorus,M}=api;
 const bulbGeometry=new THREE.SphereGeometry(1,8,5),rollerGeometry=new Map();
 function ball(mat,x,y,z,size,parent){if(size>=.18)return worldBall(mat,x,y,z,size,parent);const o=mesh(bulbGeometry,mat,x,y,z,parent);o.scale.setScalar(size);return o;}
 function torus(radius,tube,mat,x,y,z,parent){if(radius>=.4)return worldTorus(radius,tube,mat,x,y,z,parent);const key=radius+'/'+tube;if(!rollerGeometry.has(key))rollerGeometry.set(key,new THREE.TorusGeometry(radius,tube,5,16));return mesh(rollerGeometry.get(key),mat,x,y,z,parent);}
 const root=new THREE.Group();root.name='alpine-mountain';scene.add(root);
 const snow=M('#e5edf0',.96,0),groomed=M('#f0f4f4',.92,0),bankSnow=M('#d3e0e7',.98,0),rock=M('#526276',.92,.02),rockLight=M('#71828d',.95,0),timber=M('#80634d',.88,0),oak=M('#a38a6b',.83,0),ink=M('#233448',.72,.08),metal=M('#9bacae',.45,.4),brass=M('#b99e73',.48,.4),red=M('#9f4c4b',.66,.02),blue=M('#5d89a4',.7,.02),pine=[M('#294d4e',.98,0),M('#365c57',.98,0),M('#41685e',.98,0)];
 const windowMat=new THREE.MeshStandardMaterial({color:'#d3bb8a',emissive:'#c89a58',emissiveIntensity:.35,roughness:.4,metalness:.12});
 const lampRequests=[];
 const warm=new THREE.MeshBasicMaterial({color:'#efd4a0'}),interactive=[],dynamic=new Set(),chairs=[],steamSystems=[],flames=[];let fireLight=null;const steamDummy=new THREE.Object3D();
 let seed=4277;const rand=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
 const ovalGeo=new THREE.SphereGeometry(1,12,8);
 function oval(mat,x,y,z,sx,sy,sz,p=root){const o=mesh(ovalGeo,mat,x,y,z,p);o.scale.set(sx,sy,sz);return o;}
 function place(x,z,name,y=alpineHeight(x,z)){const g=new THREE.Group();g.position.set(x,y,z);g.name=name;root.add(g);return g;}
 function target(x,y,z,w,h,d,action){const m=mesh(new THREE.BoxGeometry(w,h,d),hitMaterial,x,y,z,root);m.userData={winter:true,action};interactive.push(m);dynamic.add(m);return m;}
 function lamp(parent,x,z,y=0){lampRequests.push({parent,x,y,z});}
 const detailRingGeo=new Map();
 function ring(radius,tube,mat,x,y,z,parent=root){const key=radius+'/'+tube;if(!detailRingGeo.has(key))detailRingGeo.set(key,new THREE.TorusGeometry(radius,tube,5,24));const m=mesh(detailRingGeo.get(key),mat,x,y,z,parent);m.rotation.x=Math.PI/2;return m;}
 function plaque(lines,x,y,z,w,h,parent){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.round(1024*h/w);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff0d2';ctx.textAlign='center';ctx.textBaseline='middle';
  lines.forEach((line,i)=>{ctx.font=`${i?'400':'600'} ${Math.round(canvas.height*(lines.length===1?.51:i?.27:.34))}px "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`;ctx.fillText(line,canvas.width/2,canvas.height*(lines.length===1?.5:i?.75:.32),canvas.width*.9);});
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;const mat=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false});
  box(w+.12,h+.12,.1,oak,x,y,z,parent);box(w,h,.04,pine[0],x,y,z+.06,parent);mesh(new THREE.PlaneGeometry(w*.94,h*.94),mat,x,y,z+.085,parent);
  for(const side of [-1,1]){box(.025,h+.02,.025,brass,x+side*w/2,y,z+.09,parent);box(w+.02,.025,.025,brass,x,y+side*h/2,z+.09,parent);}
 }


 const mountainTerrain=yield* createMountainTerrainSteps(root);yield;const gondolas=createGondola(root);dynamic.add(gondolas.root);yield;
 function ribbon(points,width,mat,offset=.055){const pos=[],uv=[],idx=[],columns=Math.max(1,Math.ceil(width/.75));for(let i=0;i<points.length;i++){const p=points[i],prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],dx=next[0]-prev[0],dz=next[2]-prev[2],length=Math.hypot(dx,dz)||1,nx=-dz/length,nz=dx/length;for(let j=0;j<=columns;j++){const side=j/columns-.5,x=p[0]+nx*width*side,z=p[2]+nz*width*side;pos.push(x,alpineHeight(x,z)+offset,z);uv.push(j/columns,i/(points.length-1));if(i<points.length-1&&j<columns){const k=i*(columns+1)+j;idx.push(k,k+1,k+columns+1,k+1,k+columns+2,k+columns+1);}}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return mesh(g,mat,0,0,0,root);}

 // Low-cost groomed kickers use the exact gameplay height, independently of tile LOD.
 for(const jump of skiJumps){const points=[],indices=[],rows=30,cols=8;
  for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){
   const along=-jump.length+i*(jump.length+8)/rows,side=(j/cols-.5)*jump.width;
   const x=jump.x+Math.sin(jump.yaw)*along+Math.cos(jump.yaw)*side,z=jump.z+Math.cos(jump.yaw)*along-Math.sin(jump.yaw)*side;
   points.push(x,alpineHeight(x,z)+.045,z);if(i<rows&&j<cols){const k=i*(cols+1)+j;indices.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const top=mesh(geometry,groomed,0,0,0,root);top.name=jump.id;top.userData.cameraIgnore=true;
  // Paired blue poles mark the take-off edges without blocking the bypass.
  for(const side of [-1,1]){const x=jump.x+Math.cos(jump.yaw)*side*(jump.width/2+.4),z=jump.z-Math.sin(jump.yaw)*side*(jump.width/2+.4),y=alpineHeight(x,z);rod([x,y,z],[x,y+1.6,z],.055,blue,root);}
 }
 // The piste is part of the terrain itself; no lifted strip can cover a skier.

 const safetyNet=new THREE.MeshStandardMaterial({color:'#b87c64',roughness:1,transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false});
 const fenceBulbs=[],fenceColors=[],fenceWires=[];
 const runColors=Object.fromEntries(skiRuns.map(run=>[run.id,M(run.color,.6,0)]));
 // Boundaries disappear through shared junctions instead of fencing across another run.
 const transfers=[summitTransfer,middleTransfer,...ridgeTransfers];
 function transferOpening(x,z){return transfers.some(path=>path.slice(1).some((b,i)=>{const a=path[i],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a.x-dx*t,z-a.z-dz*t)<7;}));}
 for(const run of skiRuns){yield;
  const points=Array.from({length:Math.max(2,Math.ceil((run.finish-run.startZ-14)/8))},(_,i)=>{const z=run.startZ+6+i*8;return[skiRunCenter(z,run.id),z];});
  const exposed=(x,z)=>!transferOpening(x,z)&&!skiRuns.some(other=>other.id!==run.id&&z>=other.startZ-2&&z<=other.finish&&Math.abs(x-skiRunCenter(z,other.id))<skiRunHalfWidth(z,other.id)+.7)&&!(z>=-340&&z<=-286&&Math.abs(x-24)<6.8);
  for(const side of [-1,1]){const pos=[],idx=[];
   for(let i=0;i<points.length;i++){const [cx,z]=points[i],x=cx+side*(skiRunHalfWidth(z,run.id)+.5),y=alpineHeight(x,z),show=exposed(x,z);
    if(show){fenceBulbs.push(x,y+1.32,z);const c=new THREE.Color(i%8===0?'#a8dfff':'#55b8ff');fenceColors.push(c.r,c.g,c.b);}
    if(show&&i%2===0){rod([x,y,z],[x,y+1.3,z],.035,metal,root);box(.36,.28,.035,runColors[run.id],x,y+1.12,z,root);}
    if(i===points.length-1||!show)continue;const [nx,nz]=points[i+1],ex=nx+side*(skiRunHalfWidth(nz,run.id)+.5);if(!exposed(ex,nz))continue;
    const ey=alpineHeight(ex,nz),k=pos.length/3;fenceWires.push(x,y+1.3,z,ex,ey+1.3,nz);for(const f of [.25,.5,.75]){fenceBulbs.push(x+(ex-x)*f,y+(ey-y)*f+1.3,z+(nz-z)*f);const c=new THREE.Color('#6dc7ff');fenceColors.push(c.r,c.g,c.b);}pos.push(x,y+.2,z,x,y+1.05,z,ex,ey+.2,nz,ex,ey+1.05,nz);idx.push(k,k+1,k+2,k+1,k+3,k+2);
   }
   if(pos.length){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();mesh(geo,safetyNet,0,0,0,root);}
  }
 }
 // Persistent emissive bulbs never switch off with the nearby-light budget.
 const fenceGeometry=new THREE.BufferGeometry();fenceGeometry.setAttribute('position',new THREE.Float32BufferAttribute(fenceBulbs,3));fenceGeometry.setAttribute('color',new THREE.Float32BufferAttribute(fenceColors,3));
 // Distant bulbs must fade with the mountain fog; otherwise the enlarged resort
 // draws floating piste outlines across the castle's night sky.
 const fenceLights=new THREE.Points(fenceGeometry,new THREE.ShaderMaterial({uniforms:THREE.UniformsUtils.clone(THREE.UniformsLib.fog),fog:true,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:true,
  vertexShader:`varying vec3 tint;varying float bulbDistance;
#include <fog_pars_vertex>
void main(){tint=color;vec4 mvPosition=modelViewMatrix*vec4(position,1.);bulbDistance=length(mvPosition.xyz);gl_Position=projectionMatrix*mvPosition;gl_PointSize=clamp(820./max(1.,-mvPosition.z),1.1,15.);
#include <fog_vertex>
}`,
  fragmentShader:`varying vec3 tint;varying float bulbDistance;
#include <fog_pars_fragment>
void main(){float r=length(gl_PointCoord-.5)*2.;float core=exp(-r*r*20.);float halo=exp(-r*r*4.)*(1.-smoothstep(.65,1.,r));float visibility=1.-smoothstep(350.,900.,bulbDistance);
#ifdef USE_FOG
visibility*=1.-smoothstep(fogNear,fogFar,vFogDepth);
#endif
float alpha=min(1.,core+halo*.92)*visibility;if(alpha<.003)discard;gl_FragColor=vec4(tint*3.4,alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`}));fenceLights.name='alpine-fence-illuminations';fenceLights.userData.cameraIgnore=true;root.add(fenceLights);
 const wireGeometry=new THREE.BufferGeometry();wireGeometry.setAttribute('position',new THREE.Float32BufferAttribute(fenceWires,3));const wires=new THREE.LineSegments(wireGeometry,new THREE.LineBasicMaterial({color:'#79caff',transparent:true,opacity:.88,toneMapped:false}));wires.name='alpine-fence-light-cable';wires.userData.cameraIgnore=true;root.add(wires);
 // Each course has its own physical mouth. The sign faces both the summit
 // approach and the slope, while the posts stay beyond the skiable width.
 for(const start of skiStarts){
  const x=start.x-skiRunHalfWidth(start.z,start.id)-1.8,z=start.z-1.3,y=alpineHeight(x,z),g=place(x,z,`ski-start-${start.id}`,y),paint=runColors[start.id];
  for(const side of [-1,1]){rod([side*.95,0,0],[side*.95,2.65,0],.075,metal,g);ball(brass,side*.95,2.7,0,.11,g);}
  box(2.5,.8,.16,paint,0,2.1,0,g);box(2.65,.08,.23,snow,0,2.55,0,g);
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.font='600 46px "Apple SD Gothic Neo", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(start.name,256,64);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const label=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false});for(const side of [-1,1]){const face=mesh(new THREE.PlaneGeometry(2.4,.72),label,0,2.1,side*.087,g);if(side<0)face.rotation.y=Math.PI;}
 }

 // One reusable irregular fir profile: layered boughs, quiet snow shelves, varied height and lean.
 function firGeometry(snowCap=false){
  const position=[],uv=[],index=[],sectors=28;
  for(let tier=0;tier<8;tier++){
   const y=.10+tier*.115,radius=(1-y)*.4+.012,turn=tier*.47,rows=snowCap?[[.12,y+.18],[.46,y+.112],[.94,y+.024],[.93,y+.009]]:[[.07,y+.185],[.43,y+.105],[1,y],[.72,y-.035],[.08,y-.045]],base=position.length/3;
   for(let row=0;row<rows.length;row++)for(let j=0;j<=sectors;j++){
    const a=j/sectors*Math.PI*2+turn,lobes=1+.13*Math.cos(a*7+turn)+.045*Math.sin(a*14-tier),r=radius*rows[row][0]*lobes,drop=(row>=2?.012*Math.sin(a*7+turn):0);
    position.push(Math.cos(a)*r,rows[row][1]+drop,Math.sin(a)*r);uv.push(j/sectors,tier/8+row/rows.length/8);
   }
   for(let row=0;row<rows.length-1;row++)for(let j=0;j<sectors;j++){
    if(snowCap&&Math.sin(j/sectors*Math.PI*10+tier*1.7)<-.45)continue;
    const a=base+row*(sectors+1)+j,b=a+1,c=a+sectors+1,d=c+1;index.push(a,b,c,b,d,c);
   }
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(position,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();return geo;
 }
 const firGeo=firGeometry(),capGeo=firGeometry(true),trunkGeo=new THREE.CylinderGeometry(.025,.045,1,7);
 const treeLights=createTreeAtmosphere(root,{capacity:24*222,brightness:1.55});treeLights.root.name='alpine-tree-illumination';dynamic.add(treeLights.root);
 const ornamentGeo=new THREE.OctahedronGeometry(.09,0);
 for(const tree of alpineTrees.map(p=>({...p,z:p.z-alpineShift}))){yield;
  const {x,y,z,h,turn,shade,decorated}=tree,g=place(x,z,'alpine-fir',y);g.rotation.y=turn;g.userData.forestTree={height:h,decorated};
  const trunk=mesh(trunkGeo,timber,0,h*.36,0,g);trunk.scale.set(h,h*.72,h);
  const b=mesh(firGeo,pine[shade],0,h*.1,0,g);b.scale.set(h,h,h);const cap=mesh(capGeo,bankSnow,0,h*.1,0,g);cap.scale.set(h,h,h);
  if(decorated){
   treeLights.addTree({x,y:y+h*.04,z,height:h});
   for(let i=0;i<8;i++){const a=i*2.399,t=.24+(i%4)*.13,r=h*.39*(1-t),px=Math.cos(a)*r,pz=Math.sin(a)*r,py=h*(t+.12);rod([px,py,pz],[px,py-.16,pz],.007,brass,g);mesh(ornamentGeo,i%3?brass:windowMat,px,py-.22,pz,g);}
  }
 }
 // Mid-slope shoulders remain a continuous snow surface, without placed boulder lumps.

 // Parallel cable spans share the rider path; smoothing a separate spline here
 // used to make the visible cable diverge from the actual chair near the summit.
 const leftLength=Math.hypot(liftLayout.dx,liftLayout.dz),lnx=-liftLayout.dz/leftLength,lnz=liftLayout.dx/leftLength;
 const liftPoints=resortRides.lift.points,cableCurve=offset=>{const curve=new THREE.Curve();curve.getPoint=t=>{const p=liftPoint(t);return new THREE.Vector3(p[0]+lnx*offset,p[1]+liftLayout.hanger,p[2]+lnz*offset);};return curve;};
 // A 5cm cable cannot meaningfully occlude the player; treating it as a wall
 // collapsed the near-plane sweep whenever a waiting player stood below it.
 for(const offset of [0,liftLayout.spacing])mesh(new THREE.TubeGeometry(cableCurve(offset),240,.027,6,false),ink,0,0,0,root).userData.cameraIgnore=true;
 for(const t of liftLayout.supports.slice(1,-1)){
  const support=new THREE.Group();support.name='lift-support';root.add(support);
  const p=liftPoint(t),cx=p[0]+lnx*2,cz=p[2]+lnz*2,y=alpineHeight(cx,cz),top=p[1]+liftLayout.hanger;
  rod([cx,y,cz],[cx,top-.45,cz],.16,metal,support);
  rod([cx-lnx*2.7,top-.45,cz-lnz*2.7],[cx+lnx*2.7,top-.45,cz+lnz*2.7],.12,ink,support);
  for(const side of [-1,1]){
   rod([cx,top-1.5,cz],[cx+side*lnx*2.35,top-.45,cz+side*lnz*2.35],.065,metal,support);
   for(const d of [-.6,-.2,.2,.6]){const q=liftPoint(t+d/leftLength),offset=(side+1)*liftLayout.spacing/2,wheel=torus(.17,.035,ink,q[0]+lnx*offset,q[1]+liftLayout.hanger-.17,q[2]+lnz*offset,support);wheel.rotation.y=Math.atan2(liftLayout.dx,liftLayout.dz)-Math.PI/2;}
  }
  cylinder(.62,.8,.3,rock,cx,y+.15,cz,support,12);
  for(let yy=y+.45;yy<top-.8;yy+=.42)rod([cx-.19,yy,cz+.22],[cx+.19,yy,cz+.22],.018,ink,support);
  for(const side of [-1,1])rod([cx+side*.19,y+.25,cz+.22],[cx+side*.19,top-.75,cz+.22],.023,metal,support);
  mergeFinish(support);support.traverse(o=>{if(o.isMesh)Object.assign(o.userData,{rideCameraFade:true,cameraFadeMode:'lift'});});
 }
 function chair(){const g=new THREE.Group();g.name='alpine-lift-chair';root.add(g);dynamic.add(g);
 rod([0,liftLayout.hanger,0],[0,2.72,-.65],.065,metal,g);rod([0,2.72,-.65],[0,.72,-.65],.065,metal,g);box(.14,.11,.32,ink,0,liftLayout.hanger,0,g);
 box(2.5,.16,1.4,oak,0,0,0,g);box(2.5,.85,.13,ink,0,.55,-.65,g);for(const x of [-.63,.63]){box(1.14,.11,1.1,ink,x,.12,.06,g);box(1.14,.59,.08,oak,x,.55,-.56,g);}
 for(const side of [-1,1]){rod([side*1.15,.1,-.6],[side*1.15,.48,.94],.045,metal,g);rod([side*1.15,.64,-.6],[0,2.3,-.65],.045,metal,g);}
 rod([-1.15,.48,.94],[1.15,.48,.94],.055,metal,g);rod([-1.1,-.45,1],[1.1,-.45,1],.045,metal,g);
 // Each animated chair needs only three material draws, independent of its frame detail.
 g.scale.x=1.52;g.updateMatrixWorld(true);for(const mat of [metal,oak,ink]){const items=g.children.filter(o=>o.isMesh&&o.material===mat);if(items.length<2)continue;const chunks={position:[],normal:[],uv:[]};let n=0;for(const o of items){let geo=o.geometry.clone().applyMatrix4(o.matrix);if(geo.index)geo=geo.toNonIndexed();n+=geo.attributes.position.count;for(const key in chunks)chunks[key].push(geo.attributes[key].array);o.removeFromParent();geo.dispose();}const geo=new THREE.BufferGeometry();for(const key in chunks){const size=key==='uv'?2:3,out=new Float32Array(n*size);let off=0;for(const a of chunks[key]){out.set(a,off);off+=a.length;}geo.setAttribute(key,new THREE.BufferAttribute(out,size));}mesh(geo,mat,0,0,0,g).userData.rideCameraFade=true;}g.traverse(o=>{if(o.isMesh)o.userData.cameraMovingCabin=true;});return g;}
 function pathPoint(t){const p=sampleRide(resortRides.lift,t);return new THREE.Vector3(p.x,p.y-.82,p.z);}
 const turnShare=Math.PI*liftLayout.spacing/2/Math.hypot(liftLayout.dx,liftLayout.dz),upYaw=Math.atan2(liftLayout.dx,liftLayout.dz);
 function loopPose(progress){const s=progress*(2+2*turnShare);if(s<=1)return{position:pathPoint(s),yaw:upYaw};if(s<=1+turnShare){const a=(s-1)/turnShare*Math.PI,p=liftPoint(1);return{position:new THREE.Vector3(p[0]+lnx*2*(1-Math.cos(a))+Math.sin(upYaw)*2*Math.sin(a),p[1],p[2]+lnz*2*(1-Math.cos(a))+Math.cos(upYaw)*2*Math.sin(a)),yaw:upYaw-a};}if(s<=2+turnShare){const p=pathPoint(2+turnShare-s);p.x+=lnx*4;p.z+=lnz*4;return{position:p,yaw:upYaw-Math.PI};}const a=(s-2-turnShare)/turnShare*Math.PI,p=liftPoint(0);return{position:new THREE.Vector3(p[0]+lnx*2*(1+Math.cos(a))-Math.sin(upYaw)*2*Math.sin(a),p[1],p[2]+lnz*2*(1+Math.cos(a))-Math.cos(upYaw)*2*Math.sin(a)),yaw:upYaw-Math.PI-a};}
 for(let i=0;i<8;i++){const g=chair(),offset=i/8,pose=loopPose(offset);g.position.copy(pose.position);g.rotation.y=pose.yaw;chairs.push({g,offset});}
 const rideChair=chair();rideChair.name='alpine-personal-chair';rideChair.visible=false;rideChair.position.copy(pathPoint(0));
 function station(point,name,upper=false,axisYaw=0,addLight=true){
  const [x,seat,z]=point,y=alpineHeight(x,z),g=place(x+2*Math.cos(axisYaw),z-2*Math.sin(axisYaw),name,y),cable=seat-y+liftLayout.hanger,roof=cable+.9,half=upper?4.8:5.2,depth=upper?5.1:6.6;g.rotation.y=axisYaw;
  for(const side of [-1,1]){for(const dz of [-1.65,1.65])rod([side*half,0,dz],[side*half,roof,dz],.13,ink,g);box(.12,.6,3.2,metal,side*half,roof-.35,0,g);}
  box(half*2+.7,.28,depth,ink,0,roof,0,g);box(half*2+.8,.16,depth+.1,snow,0,roof+.2,0,g);for(const side of [-1,1])box(half*2-.4,.04,.08,warm,0,roof-.2,side*(depth/2-.65),g);for(const side of [-1,1]){box(half*2+.6,.065,.08,brass,0,roof-.15,side*depth/2,g);for(let k=0;k<=14;k++)ball(warm,-half+k/14*half*2,roof-.24,side*depth/2,.04,g);}
  // Timber soffits and bolted steel haunches sit high above the loading envelope.
  for(let xx=-half+.2;xx<half;xx+=.36)box(.2,.075,depth-.22,timber,xx,roof-.19,0,g);
  for(const side of [-1,1])for(const dz of [-1.65,1.65]){
   box(.5,.07,.5,metal,side*half,.055,dz,g);for(const dx of [-.17,.17])for(const zz of [-.17,.17])cylinder(.037,.037,.065,brass,side*half+dx,.12,dz+zz,g,6);
   cylinder(.19,.19,.09,brass,side*half,1.38,dz,g,12);rod([side*half,roof-1.0,dz],[side*(half-.8),roof-.28,dz],.075,timber,g);
   const join=box(.36,.32,.07,metal,side*half,roof-.32,dz+.08,g);for(const dx of [-.1,.1])ball(brass,side*half+dx,roof-.32,dz+.13,.035,g);
  }
  box(1.4,.4,1.65,metal,0,cable+.58,0,g);for(let j=0;j<8;j++)box(1.1,.025,.05,ink,0,cable+.8,-.65+j*.185,g);
  for(const side of [-1,1])rod([side*.55,cable+.33,0],[side*.55,roof-.28,0],.07,ink,g);
  if(!upper&&addLight){const light=new THREE.PointLight('#ffce91',8,14,2);light.position.set(-1,roof-.65,.6);g.add(light);}
  plaque([name.includes('ridge')?'정상 연결 리프트':name.includes('peak')?'포레스트 리프트':'초급 리프트'],0,roof+.12,depth/2+.12,2.2,.55,g);
  const wheel=torus(2,.085,metal,0,cable,0,g);wheel.rotation.x=Math.PI/2;
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;rod([0,cable,0],[Math.cos(a)*1.96,cable,Math.sin(a)*1.96],.035,metal,g);}for(let i=0;i<20;i++){const a=i/20*Math.PI*2;ball(brass,Math.cos(a)*1.88,cable-.06,Math.sin(a)*1.88,.045,g);}ring(1.93,.035,brass,0,cable-.04,0,g);cylinder(.36,.36,.3,ink,0,cable,0,g,16);
  // The actual cable turns around the terminal wheel rather than ending in air.
  const arc=new THREE.Curve();arc.getPoint=t=>{const a=t*Math.PI;return new THREE.Vector3(-2*Math.cos(a),cable,(upper?-1:1)*2*Math.sin(a));};mesh(new THREE.TubeGeometry(arc,36,.027,6,false),ink,0,0,0,g);
  if(upper)box(6.8,.12,5.1,oak,0,.06,0,g);
  // The loading lane stays open at the front: railings and columns sit outside it.
  for(const side of [-1,1]){const edge=side*(half-.2);rod([edge,.13,-2],[edge,1.05,-2],.035,metal,g);rod([edge,1.05,-2],[edge,1.05,2],.035,metal,g);}
  box(1.15,.72,.18,blue,-half,2.15,2.05,g);for(const yy of [1.97,2.16,2.35])box(.65,.055,.025,snow,-half,yy,2.16,g);
  // Rod geometry may already contain its endpoints with position.y === 0.
  // Classify the whole mesh in station space, keeping ground-reaching posts solid.
  const canopyBounds=new THREE.Box3();
  g.traverse(o=>{if(!o.isMesh)return;o.updateMatrix();o.geometry.computeBoundingBox();canopyBounds.copy(o.geometry.boundingBox).applyMatrix4(o.matrix);if(canopyBounds.min.y>2.7)o.userData.cameraCanopy=true;});
  return g;
 }
 yield;station(liftPoints[0],'alpine-base-terminal',false,upYaw-Math.PI);station(liftPoints.at(-1),'alpine-summit-terminal',true,upYaw-Math.PI);
 // The right-hand base lift reaches the upper course junction. Its normal
 // vector is shared by chairs, towers and stations, including both turnaround arcs.
 function buildSideLift(kind,line,point){
 const chairs=[];const upperYaw=Math.atan2(line.dx,line.dz),upperAxis=upperYaw-Math.PI,ux=Math.cos(upperAxis),uz=-Math.sin(upperAxis),utx=Math.sin(upperYaw),utz=Math.cos(upperYaw),upperTurn=Math.PI*2/Math.hypot(line.dx,line.dz);
 const upperCurve=offset=>{const curve=new THREE.Curve();curve.getPoint=t=>{const p=point(t);return new THREE.Vector3(p[0]+ux*offset,p[1]+3.1,p[2]+uz*offset);};return curve;};
 for(const offset of [0,4])mesh(new THREE.TubeGeometry(upperCurve(offset),120,.027,6,false),ink,0,0,0,root).userData.cameraIgnore=true;
 for(const t of line.supports.slice(1,-1)){
  const support=new THREE.Group();support.name='lift-support';root.add(support);
  const p=point(t),cx=p[0]+2*ux,cz=p[2]+2*uz,y=alpineHeight(cx,cz),top=p[1]+3.1;
  cylinder(.62,.8,.25,rock,cx,y+.125,cz,support,12);rod([cx,y,cz],[cx,top-.4,cz],.16,metal,support);rod([cx-ux*2.6,top-.4,cz-uz*2.6],[cx+ux*2.6,top-.4,cz+uz*2.6],.12,ink,support);
  for(const side of [-1,1]){rod([cx,top-1.6,cz],[cx+side*ux*2.3,top-.4,cz+side*uz*2.3],.07,metal,support);for(const d of [-.4,0,.4]){const wheel=torus(.17,.035,ink,cx+side*ux*2+utx*d,top-.17,cz+side*uz*2+utz*d,support);wheel.rotation.y=upperAxis+Math.PI/2;}}
  mergeFinish(support);support.traverse(o=>{if(o.isMesh)Object.assign(o.userData,{rideCameraFade:true,cameraFadeMode:'lift'});});
 }
 function upperLoopPose(progress){
  const s=progress*(2+2*upperTurn);let p,yaw;
  if(s<=1){const q=sampleRide(resortRides[kind],s);p=[q.x,q.y-.82,q.z];yaw=upperYaw;}
  else if(s<=1+upperTurn){const a=(s-1)/upperTurn*Math.PI,q=point(1);p=[q[0]+ux*2*(1-Math.cos(a))+utx*2*Math.sin(a),q[1],q[2]+uz*2*(1-Math.cos(a))+utz*2*Math.sin(a)];yaw=upperYaw-a;}
  else if(s<=2+upperTurn){const q=sampleRide(resortRides[kind],2+upperTurn-s);p=[q.x,q.y-.82,q.z];p[0]+=ux*4;p[2]+=uz*4;yaw=upperYaw-Math.PI;}
  else{const a=(s-2-upperTurn)/upperTurn*Math.PI,q=point(0);p=[q[0]+ux*2*(1+Math.cos(a))-utx*2*Math.sin(a),q[1],q[2]+uz*2*(1+Math.cos(a))-utz*2*Math.sin(a)];yaw=upperYaw-Math.PI-a;}
  return{position:new THREE.Vector3(...p),yaw};
 }
 station(point(0),kind==='ridgelift'?'alpine-ridge-base-terminal':'alpine-peak-base-terminal',false,upperAxis,false);station(point(1),kind==='ridgelift'?'alpine-ridge-top-terminal':'alpine-peak-top-terminal',true,upperAxis,false);
 for(let i=0;i<4;i++){const g=chair(),offset=i/4,pose=upperLoopPose(offset);g.position.copy(pose.position);g.rotation.y=pose.yaw;chairs.push({g,offset});}
 return {kind,chairs,pose:upperLoopPose};
 }
 yield;const sideLifts=[buildSideLift('upperlift',upperLiftLayout,upperLiftPoint),buildSideLift('ridgelift',ridgeLiftLayout,ridgeLiftPoint)];
 const upperStop=summitFacilities.find(p=>p.id==='upperlift');plaque(['포레스트 리프트','실버 포레스트 · 초중급'],upperStop.x-3.8,alpineHeight(upperStop.x-3.8,upperStop.z)+2.5,upperStop.z,2.3,.6,root);
 // The summit is an actual rest terrace; the front remains a broad, clear launch apron.
 const foodMat=M('#efd8b7',.8,0),truckRose=M('#bf747d',.65,.05),truckMint=M('#98c5b8',.65,.05),steamMat=new THREE.MeshBasicMaterial({color:'#fff4df',transparent:true,opacity:.11,depthWrite:false});
 function foodTruck(stop,paint,marshmallow=false){
  const g=place(stop.model.x,stop.model.z,`summit-${stop.id}-truck`);
  box(7.7,.2,2.8,ink,0,.65,0,g);box(5.5,.65,3,paint,-1,1.1,0,g);
  box(5.5,1.4,.13,paint,-1,2.12,-1.45,g);for(const x of [-3.75,1.75])box(.15,1.4,3,paint,x,2.12,0,g);
  box(5.75,.16,3.25,foodMat,-1,2.9,0,g);box(5.8,.1,3.28,snow,-1,3.03,0,g);
  box(2.2,2.15,2.88,paint,2.8,1.7,0,g);box(.035,.95,2.25,blue,3.92,2.25,0,g);box(.08,.07,2.4,metal,3.96,1.73,0,g);
  for(const side of [-1,1]){box(1.4,.9,.035,blue,2.75,2.22,side*1.46,g);box(.07,1.2,.05,metal,2.1,2.08,side*1.49,g);box(.4,.055,.05,brass,2.25,1.48,side*1.5,g);for(const x of [-2.5,2.6]){const tyre=cylinder(.5,.5,.28,ink,x,.5,side*1.48,g,20);tyre.rotation.x=Math.PI/2;const hub=cylinder(.25,.25,.3,metal,x,.5,side*1.51,g,20);hub.rotation.x=Math.PI/2;ball(brass,x,.5,side*1.7,.09,g);}ball(warm,3.94,1.16,side*.98,.12,g);box(.035,.24,.14,red,-3.83,1.0,side*1.18,g);}
  box(5.3,.13,.65,oak,-1,1.5,1.71,g);for(const x of [-3.62,1.62])rod([x,1.55,1.8],[x,2.84,2.02],.035,brass,g);
  for(let i=0;i<9;i++){const awning=box(.6,.06,1.15,i%2?paint:foodMat,-3.4+i*.6,2.8,1.8,g);awning.rotation.x=.16;box(.6,.18,.06,i%2?paint:foodMat,-3.4+i*.6,2.62,2.35,g);ball(warm,-3.4+i*.6,2.56,2.35,.04,g);}
  // Rounded valances, a lit menu and stocked shelves make the counter readable
  // at walking distance without moving anything into the service approach.
  for(let i=0;i<9;i++){const x=-3.4+i*.6,scallop=new THREE.Shape();scallop.moveTo(-.3,0);scallop.lineTo(.3,0);scallop.lineTo(.3,-.08);scallop.quadraticCurveTo(0,-.28,-.3,-.08);scallop.closePath();mesh(new THREE.ShapeGeometry(scallop),i%2?paint:foodMat,x,2.61,2.387,g);cylinder(.055,.055,.07,brass,x,2.52,2.25,g,8);ball(warm,x,2.45,2.25,.065,g);}
  plaque(marshmallow?['마시멜로','핫초코']:['어묵','따뜻한 국물'],-2.98,2.09,1.52,1.1,.95,g);
  for(const yy of [1.65,2.31]){box(4.75,.07,.5,oak,-1,yy,-1.08,g);for(let j=0;j<7;j++){const x=-3.05+j*.61;cylinder(.115,.115,.22,foodMat,x,yy+.15,-1.08,g,10);cylinder(.13,.13,.04,paint,x,yy+.28,-1.08,g,10);}}
  box(.16,1.1,.04,brass,1.25,2.1,1.52,g);for(let i=0;i<3;i++)rod([1.16,1.72+i*.24,1.56],[1.34,1.72+i*.24,1.56],.018,brass,g);
  if(marshmallow){
   cylinder(.27,.22,.45,metal,-1,1.78,1.58,g,20);
   for(let i=0;i<5;i++){const x=-1.22+i*.12;rod([x,1.64,1.58],[x+(i-2)*.08,2.42,1.6],.014,oak,g);for(let j=0;j<2;j++)box(.18,.2,.18,foodMat,x+(i-2)*.055,2.16+j*.23,1.6,g);}
   for(let i=0;i<3;i++)box(.5,.09,.35,foodMat,.1+i*.55,1.62,1.75,g);
   cylinder(.28,.24,.38,metal,-.25,1.8,.88,g,18);ring(.27,.025,brass,-.25,2,.88,g);const lid=oval(metal,-.25,2.02,.88,.27,.06,.27,g);ball(ink,-.25,2.1,.88,.055,g);rod([-.54,1.87,.88],[-.62,1.87,1.12],.025,metal,g);
   box(1.2,.12,.5,ink,.4,1.63,1.05,g);for(let i=0;i<7;i++)rod([-.13+i*.17,1.71,.85],[-.13+i*.17,1.71,1.25],.018,metal,g);
  }else{
   box(2.1,.25,.85,metal,-1.3,1.69,1.45,g);box(1.92,.025,.69,timber,-1.3,1.83,1.45,g);
   for(let i=0;i<7;i++){const x=-2.1+i*.25;rod([x,1.78,1.5],[x+.08,2.35,1.5],.014,oak,g);for(let j=0;j<3;j++){const fold=box(.17,.075,.12,foodMat,x+.025,1.95+j*.105,1.5,g);fold.rotation.z=(j%2?1:-1)*.3;}}
   for(let i=0;i<3;i++)cylinder(.1,.075,.24,foodMat,.15+i*.3,1.69,1.75,g,12);
   for(const x of [-2.38,-.22]){rod([x,1.78,1.26],[x,1.98,1.26],.025,metal,g);rod([x,1.98,1.26],[x,1.98,1.64],.025,metal,g);rod([x,1.98,1.64],[x,1.78,1.64],.025,metal,g);}
   for(const x of [-1.65,-.95])box(.025,.12,.7,metal,x,1.84,1.45,g);
   cylinder(.31,.28,.42,metal,.83,1.82,.93,g,20);ring(.31,.025,brass,.83,2.04,.93,g);oval(metal,.83,2.06,.93,.31,.045,.31,g);ball(ink,.83,2.13,.93,.06,g);rod([.4,1.72,1.66],[.59,2.23,1.6],.02,metal,g);oval(metal,.4,1.72,1.66,.09,.03,.06,g);
  }
  const steam=new THREE.InstancedMesh(ovalGeo,steamMat,8);steam.frustumCulled=false;root.add(steam);dynamic.add(steam);steamSystems.push({mesh:steam,x:stop.model.x-1,y:g.position.y+2,z:stop.model.z+1.5});
 }
 yield;foodTruck(summitFacilities.find(s=>s.id==='odeng'),truckRose);yield;foodTruck(summitFacilities.find(s=>s.id==='marshmallow'),truckMint,true);
 const foodLight=new THREE.PointLight('#ffd6a2',14,25,2);foodLight.position.set(-59,3.6,-163);root.add(foodLight);
 const scenery=buildResortScenery(root);dynamic.add(scenery.root);const firePoint=summitFacilities.find(p=>p.id==='campfire').model;
 for(const side of [-1,1]){const x=firePoint.x+side*3.8,z=firePoint.z,y=alpineHeight(x,z);box(.8,.18,2.8,oak,x,y+.55,z,root);box(.12,.65,2.8,timber,x+side*.4,y+.94,z,root);for(const dz of [-1,1])box(.55,.45,.14,ink,x,y+.23,z+dz,root);}

 for(const x of [-75,-46]){const y=alpineHeight(x,-170);rod([x,y,-170],[x,y+4.1,-170],.055,timber,root);}const festoon=Array.from({length:25},(_,i)=>new THREE.Vector3(-75+29*i/24,4.2-Math.sin(i/24*Math.PI)*.55,-170));mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(festoon),48,.018,6,false),ink,0,0,0,root);for(let i=0;i<festoon.length;i+=2){const p=festoon[i];ball(warm,p.x,p.y-.08,p.z,.065,root);}
 // Rear summit edge only: the broad south apron opens onto all three course mouths.
 for(const terrace of [summitLayout,peakSummit])for(let i=0;i<18;i++){const a=Math.PI+i/18*Math.PI,x=terrace.x+Math.cos(a)*terrace.rx,z=terrace.z+Math.sin(a)*terrace.rz,y=alpineHeight(x,z);rod([x,y,z],[x,y+1.1,z],.045,timber,root);}
 // Low, snow-covered dismount apron follows ground directly beside the shared endpoint.
 const summit=liftPoints.at(-1),exit=resortRides.lift.exit;const apron=Array.from({length:15},(_,i)=>{const t=i/14,x=summit[0]+(exit[0]-summit[0])*t,z=summit[2]+(exit[2]-summit[2])*t;return[x,alpineHeight(x,z),z];});ribbon(apron,4.2,snow,.025);
 // Lamps mark the outer edge; the entire 4.8 m transfer lane stays free of posts.
 for(let i=0;i<summitTransfer.length-1;i++){const a=summitTransfer[i],b=summitTransfer[i+1],length=Math.hypot(b.x-a.x,b.z-a.z),x=(a.x+b.x)/2-(b.z-a.z)/length*6.5,z=(a.z+b.z)/2+(b.x-a.x)/length*6.5;lamp(root,x,z,alpineHeight(x,z));}

 const basePaths=createSnowPaths({root,stone:[M('#a1aaac',.98,0)],snow,heightAt:alpineHeight});
 basePaths(summitTransfer.map(p=>[p.x,p.z]),8.5);basePaths(middleTransfer.map(p=>[p.x,p.z]),9);for(const path of ridgeTransfers)basePaths(path.map(p=>[p.x,p.z]),9);
 for(const p of [ridgeBase,ridgeSummit])plaque([p===ridgeBase?'정상 연결 리프트 ↗':'← 은하 파노라마'],p.x+25,alpineHeight(p.x+25,p.z+10)+2.2,p.z+10,3.5,.7,root);
 basePaths(gondolaApproach.map(p=>[p.x,p.z]),7);
 for(const p of mountainRest){const bench=buildWinterBench(p);bench.position.y=alpineHeight(p.x,p.z);root.add(bench);}
 const shelterY=alpineHeight(mountainShelter.x,mountainShelter.z);for(const dx of [-18,18])for(const dz of [-5,5]){const x=mountainShelter.x+dx,z=mountainShelter.z+dz;rod([x,shelterY,z],[x,shelterY+4,z],.12,timber,root);}box(40,.22,14,timber,mountainShelter.x,shelterY+4,mountainShelter.z,root);box(40,.12,14,snow,mountainShelter.x,shelterY+4.17,mountainShelter.z,root);
 for(const dx of [-15,15]){const x=mountainShelter.x+dx,z=mountainShelter.z+8;lamp(root,x,z,alpineHeight(x,z));}
 const trailToBase=Array.from({length:30},(_,i)=>{const t=i/29;return[8+(liftLayout.x-8)*t,-172-6*t+Math.sin(t*Math.PI)*3];});basePaths([[-26,-150],...liftApproach.map(p=>[p.x,p.z])],5.5);basePaths([[25,-150],[70,-160],[upperLiftLayout.x-8,-174],[upperStop.x,upperStop.z]],5.5);basePaths([[-62,-150],[-53,-163]],4.5);basePaths([[-62,-150],[-68,-160]],4.5);basePaths([[-26,-150],[-39,-151]],4.5);
 basePaths([[liftLayout.x,-172],[liftLayout.x,-178],[liftLayout.x,-184],[liftLayout.x,-188]],5.6);
 // A wide, groomed queue approaches the chair directly; nothing crosses its mouth.
 for(const side of [-1,1]){const x=liftLayout.x+side*3.7;for(const z of [-179,-182,-185]){const y=alpineHeight(x,z);cylinder(.075,.1,1.0,timber,x,y+.5,z,root,10);ball(brass,x,y+1.05,z,.1,root);}for(const z of [-179,-182])rod([x,alpineHeight(x,z)+.82,z],[x,alpineHeight(x,z-3)+.82,z-3],.032,oak,root);lamp(root,x,-177,alpineHeight(x,-177));}


 // Full-scale timber lodge: inset glazing, balcony rails, stone chimney and layered snow roof.
 const lodge=place(-97,-176,'alpine-base-lodge'),foundation=rockLight;
 box(18,.65,12,foundation,0,.32,0,lodge);box(17.3,5.7,11.3,timber,0,3.5,0,lodge);
 for(let i=0;i<54;i++)box(.11,5.6,.06,oak,-8.4+i*.318,3.5,5.69,lodge);
 for(const side of [-1,1])for(let i=0;i<32;i++)box(.06,5.6,.11,oak,side*8.69,3.5,-5.4+i*.34,lodge);
 for(const x of [-6,-3,3,6]){box(2.1,2.45,.08,windowMat,x,3.2,5.76,lodge);for(const dx of [-1.1,0,1.1])box(.065,2.58,.13,ink,x+dx,3.2,5.85,lodge);for(const y of [1.95,3.2,4.45])box(2.25,.065,.13,ink,x,y,5.85,lodge);box(2.4,.12,.4,oak,x,1.88,5.92,lodge);}
 box(1.8,3.2,.13,ink,0,2.2,5.8,lodge);box(1.45,2.6,.04,windowMat,0,2.35,5.89,lodge);rod([.5,1.7,5.98],[.5,2.25,5.98],.035,brass,lodge);
 const gable=new THREE.Shape();gable.moveTo(-8.65,0);gable.lineTo(0,4.3);gable.lineTo(8.65,0);gable.closePath();mesh(new THREE.ShapeGeometry(gable),timber,0,6.35,5.67,lodge);const backGable=mesh(new THREE.ShapeGeometry(gable),timber,0,6.35,-5.67,lodge);backGable.rotation.y=Math.PI;
 for(const side of [-1,1]){const r=box(10,.25,13.5,ink,side*4.3,8.5,0,lodge);r.rotation.z=-side*.46;const s=box(10,.24,13.65,snow,side*4.3,8.73,0,lodge);s.rotation.z=-side*.46;for(let z=-6;z<=6;z+=1.1){const icicle=mesh(new THREE.ConeGeometry(.055,.38+rand()*.35,5),bankSnow,side*8.75,6.25,z,lodge);icicle.rotation.z=Math.PI;}}
 box(1.2,4.1,1.4,rock,-5,9.5,-2,lodge);box(1.5,.2,1.7,ink,-5,11.65,-2,lodge);for(let y=8.2;y<11.5;y+=.35)box(1.24,.035,1.44,rockLight,-5,y,-2,lodge);
 box(18.5,.2,2.3,oak,0,.75,6.7,lodge);for(const side of [-1,1]){for(let i=0;i<8;i++)rod([side*(1.7+i*.96),.85,7.72],[side*(1.7+i*.96),1.75,7.72],.035,ink,lodge);rod([side*1.7,1.75,7.72],[side*8.8,1.75,7.72],.06,oak,lodge);}for(let i=0;i<4;i++)box(2.9,.18,1.0,foundation,0,.11+i*.18,9.6-i*.7,lodge);
 for(const x of [-7,7]){box(2,.16,.65,oak,x,1.15,6.4,lodge);for(const side of [-1,1])box(.12,.5,.5,ink,x+side*.7,.82,6.4,lodge);lamp(lodge,x,8.2);}
 // Skis, poles, folded blankets and a trail board make the base visibly inhabited.
 for(const x of [9.65,11.4]){box(.14,1.7,.18,timber,x,1.1,4.48,lodge);box(.45,.12,.9,oak,x,.3,4.48,lodge);}box(1.9,.15,.16,oak,10.52,1.8,4.48,lodge);box(1.9,.1,.16,timber,10.52,.75,4.48,lodge);
 for(let i=0;i<5;i++){const x=10+i*.25,paint=i%2?red:blue,s=box(.16,2.5,.065,paint,x,1.49,4.6,lodge);s.rotation.z=-.16;const tip=oval(paint,x+.2,2.73,4.65,.085,.18,.055,lodge);tip.rotation.z=-.16;box(.17,.32,.14,ink,x,1.3,4.69,lodge);box(.2,.08,.17,metal,x+.03,1.63,4.69,lodge);rod([x+.1,.3,4.83],[x+.1,2.4,4.83],.016,metal,lodge);cylinder(.035,.035,.2,ink,x+.1,2.42,4.83,lodge,8);ring(.07,.012,ink,x+.1,.46,4.83,lodge);}for(let i=0;i<3;i++)box(.75,.12,.5,bankSnow,-7,1.3+i*.13,6.4,lodge);
 // Warm timber ticket window beside the queue, with its footprint out of the approach.
 const booth=place(skiTicketBooth.x,skiTicketBooth.z,'alpine-ticket-window');box(3,.3,2.8,rockLight,0,.15,0,booth);box(2.7,2.7,2.5,timber,0,1.65,0,booth);
 for(const x of [-1.4,1.4])box(.14,2.9,2.6,oak,x,1.65,0,booth);
 const boothArch=new THREE.Shape();boothArch.moveTo(-.95,0);boothArch.lineTo(-.95,.95);boothArch.quadraticCurveTo(0,1.65,.95,.95);boothArch.lineTo(.95,0);boothArch.closePath();mesh(new THREE.ShapeGeometry(boothArch),windowMat,0,1.05,1.26,booth);
 const outline=boothArch.getPoints(24).map(p=>new THREE.Vector3(p.x,p.y+1.05,1.29));mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(outline,true),40,.04,8,true),brass,0,0,0,booth);box(2.2,.12,.6,oak,0,1.04,1.4,booth);
 for(const side of [-1,1]){const eave=box(1.85,.14,3.5,ink,side*.73,3.2,0,booth);eave.rotation.z=-side*.36;const cap=box(1.88,.14,3.6,snow,side*.73,3.35,0,booth);cap.rotation.z=eave.rotation.z;}
 for(let i=0;i<9;i++)ball(warm,-1.4+i*.35,2.95+Math.sin(i/8*Math.PI)*.2,1.77,.055,booth);
 const board=summitFacilities.find(p=>p.id==='trail-map'),sign=place(board.model.x,board.model.z,'alpine-trail-board');sign.rotation.y=Math.atan2(-board.model.x,-125-board.model.z);for(const x of [-1.2,1.2])rod([x,0,0],[x,3.1,0],.08,timber,sign);box(3,1.15,.18,ink,0,.95,0,sign);const map=document.createElement('canvas');map.width=768;map.height=512;const ctx=map.getContext('2d');ctx.fillStyle='#122436';ctx.fillRect(0,0,768,512);ctx.font='28px sans-serif';ctx.fillStyle='#f7e6c9';ctx.fillText('TRAIL MAP',25,36);const px=x=>384+x*330/mountainBounds.maxX,pz=z=>65+(z-mountainBounds.minZ)*365/(mountainBounds.maxZ-mountainBounds.minZ);
 for(const run of skiRuns){ctx.strokeStyle=run.color;ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();for(let z=run.startZ;z<=run.finish;z+=8){const x=px(skiRunCenter(z,run.id)),y=pz(z);if(z===run.startZ)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}
 ctx.setLineDash([8,7]);ctx.lineWidth=3;ctx.strokeStyle='#f3dfad';for(const point of [liftPoint,upperLiftPoint,ridgeLiftPoint,t=>{const i=Math.min(gondolaPoints.length-1,Math.floor(t*(gondolaPoints.length-1)));return gondolaPoints[i];}]){ctx.beginPath();for(let i=0;i<=100;i++){const p=point(i/100);if(i)ctx.lineTo(px(p[0]),pz(p[2]));else ctx.moveTo(px(p[0]),pz(p[2]));}ctx.stroke();}ctx.setLineDash([]);ctx.font='22px sans-serif';for(let i=0;i<skiRuns.length;i++){ctx.fillStyle=skiRuns[i].color;ctx.fillText(skiRuns[i].name,24+(i%2)*360,466+Math.floor(i/2)*29);}const mapTexture=new THREE.CanvasTexture(map);mapTexture.colorSpace=THREE.SRGBColorSpace;const mapMat=new THREE.MeshBasicMaterial({map:mapTexture});mesh(new THREE.PlaneGeometry(2.85,1.05),mapMat,0,.95,.12,sign);
 box(3.2,.10,.4,snow,0,1.58,0,sign);
 // A little alpine chalet sign reads before the paths split, with broad directional wings.
 for(const side of [-1,1]){
  const roof=box(1.9,.12,.85,timber,side*.8,4.65,0,sign);roof.rotation.z=-side*.26;const snowCap=box(1.95,.13,.9,snow,side*.8,4.77,0,sign);snowCap.rotation.z=roof.rotation.z;
  for(let i=0;i<7;i++)ball(warm,side*(.15+i*.24),4.58-i*.055,.47,.055,sign);
 }
 plaque(['설산 리조트'],0,3.91,.03,3.15,.6,sign);
 for(const [i,lines]of [[0,['←  초급 리프트','푸드트럭 · 모닥불']],[1,['포레스트 리프트  →','← 정상 곤돌라 · '+(skiNetwork[0].length/1000).toFixed(1)+' km']]]){
  const side=i?1:-1,g=new THREE.Group();g.position.set(0,3.18-i*.79,.18);sign.add(g);
  plaque(lines,0,0,0,3.65,.67,g);const arrow=new THREE.Shape();arrow.moveTo(side*1.85,-.335);arrow.lineTo(side*2.25,0);arrow.lineTo(side*1.85,.335);arrow.closePath();mesh(new THREE.ShapeGeometry(arrow),oak,0,0,.06,g);box(3.72,.055,.25,snow,0,.39,0,g);
 }
 for(const x of [-1.35,1.35]){rod([x,3.4,0],[x,4.56,0],.06,timber,sign);ball(warm,x,3.2,.23,.07,sign);}
 // Right-base walkers see both the nearby lift and the rest area across the apron.
 const wayfinder=place(61,-145,'alpine-right-base-wayfinding');
 for(const side of [-1,1])rod([side*1.7,0,0],[side*1.7,2.8,0],.075,timber,wayfinder);
 plaque(['중간 쉼터 리프트  ↗','←  모닥불 · 어묵'],0,2.2,0,4.1,1.2,wayfinder);
 box(4.35,.12,.45,snow,0,2.91,0,wayfinder);lamp(wayfinder,-2.5,.6);
 target(liftLayout.x,alpineHeight(liftLayout.x,-188)+1.3,-188,5,2.6,4,'ski');

 // Small chalet wayfinders and a wreath give the transfers identity without extra booths.
 const wayfinderAtlas=document.createElement('canvas');wayfinderAtlas.width=1024;wayfinderAtlas.height=128*mountainWayfinders.length;const wayfinderContext=wayfinderAtlas.getContext('2d');wayfinderContext.textAlign='center';wayfinderContext.textBaseline='middle';wayfinderContext.fillStyle='#fff0d2';
 mountainWayfinders.forEach((p,i)=>p.lines.forEach((line,j)=>{wayfinderContext.font=(j?'400 30':'600 38')+'px sans-serif';wayfinderContext.fillText(line,512,i*128+(j?91:39),950);}));
 const wayfinderTexture=new THREE.CanvasTexture(wayfinderAtlas);wayfinderTexture.colorSpace=THREE.SRGBColorSpace;const wayfinderMaterial=new THREE.MeshBasicMaterial({map:wayfinderTexture,transparent:true,depthWrite:false});
 for(const [index,point] of mountainWayfinders.entries()){
  const g=place(point.x,point.z,'alpine-wayfinder-'+point.id);g.rotation.y=point.yaw;
  for(const side of [-1,1]){rod([side*1.25,0,0],[side*1.25,3.45,0],.08,timber,g);const roof=box(1.8,.14,.85,timber,side*.74,3.5,0,g);roof.rotation.z=-side*.25;const cap=box(1.85,.15,.91,snow,side*.74,3.65,0,g);cap.rotation.z=roof.rotation.z;for(let i=0;i<5;i++)ball(warm,side*(.2+i*.25),3.41-i*.055,.46,.065,g);}
  box(3.22,1.07,.1,oak,0,2.45,.15,g);box(3.1,.95,.04,pine[0],0,2.45,.21,g);
  const face=new THREE.PlaneGeometry(3,.91),uv=face.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,(mountainWayfinders.length-1-index+uv.getY(i))/mountainWayfinders.length);mesh(face,wayfinderMaterial,0,2.45,.24,g);
  const wreath=torus(.37,.085,pine[0],0,1.36,.17,g);for(let i=0;i<8;i++){const a=i*Math.PI/4;ball(warm,Math.cos(a)*.37,1.36+Math.sin(a)*.37,.27,.045,g);}box(.17,.25,.09,red,0,1.04,.28,g);
 }
 // Use the same authored lanterns as the park, retaining the original lamp footprints.
 const alpineLamps=buildParkLamps({...api,scene:root},lampRequests.map(p=>({x:p.x,z:p.z})));
 alpineLamps.forEach((lamp,i)=>{const p=lampRequests[i];lamp.name='alpine-ornate-lamp';p.parent.add(lamp);lamp.position.set(p.x,p.y,p.z);});
 // Merge stationary geometry by material. Moving chair roots retain small local meshes.
 root.updateMatrixWorld(true);const batches=new Map();root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.userData.snowTrail||o.userData.skiTerrain||Array.isArray(o.material)||dynamic.has(o))return;for(let p=o.parent;p&&p!==root;p=p.parent)if(dynamic.has(p))return;if(!o.geometry.attributes.normal||!o.geometry.attributes.uv)return;const k=o.material.uuid+':'+!!o.userData.rideCameraFade+':'+!!o.userData.cameraCanopy+':'+!!o.userData.cameraIgnore+':'+spatialBatchKey(o,o.userData.rideCameraFade?256:o.position.z<-390?256:128);if(!batches.has(k))batches.set(k,{material:o.material,items:[]});batches.get(k).items.push(o);});
 for(const {material,items}of batches.values()){if(items.length<2)continue;const g=yield* mergeMeshGeometrySteps(items);for(const item of items)item.removeFromParent();const merged=mesh(g,material,0,0,0,root);if(items.every(o=>o.userData.cameraCanopy))merged.userData.cameraCanopy=true;if(items.every(o=>o.userData.cameraIgnore))merged.userData.cameraIgnore=true;if(items.every(o=>o.userData.rideCameraFade))Object.assign(merged.userData,{rideCameraFade:true,cameraFadeMode:'lift'});}
 root.position.z=alpineShift;scene.add(rideChair);
 return{root,interactive,rideChair,rideOccluders:gondolas.occluders,terrain:mountainTerrain,setQuality(value){treeLights.setQuality(value);mountainTerrain.setQuality(value);},update(t,still){gondolas.update();const p=globalThis.window?.labPlayerState;if(p)mountainTerrain.update(p.x,p.z-alpineShift,p.yaw);treeLights.update(t,still);mountainTerrain.updateLights(t,still);const dummy=steamDummy;for(const system of steamSystems){for(let i=0;i<8;i++){const phase=((still?0:t*.2)+i/8)%1;dummy.position.set(system.x+Math.sin(i*2+phase)*.3,system.y+phase*2,system.z+Math.cos(i*3)*.2);const scale=Math.sin(phase*Math.PI)*(.18+phase*.4);dummy.scale.set(scale,scale*.75,scale);dummy.updateMatrix();system.mesh.setMatrixAt(i,dummy.matrix);}system.mesh.instanceMatrix.needsUpdate=true;}scenery.update(t,still);if(still)return;for(const {g,offset}of chairs){const pose=loopPose((t/(resortRides.lift.duration*2+4)+offset)%1);g.position.copy(pose.position);g.rotation.set(0,pose.yaw,Math.sin(t*.6+offset)*.009);g.visible=!rideChair.visible||Math.hypot(g.position.x-rideChair.position.x,g.position.y-rideChair.position.y,g.position.z+alpineShift-rideChair.position.z)>14;}for(const service of sideLifts)for(const {g,offset}of service.chairs){const pose=service.pose((t/(resortRides[service.kind].duration*2+4)+offset)%1);g.position.copy(pose.position);g.rotation.set(0,pose.yaw,Math.sin(t*.6+offset)*.009);g.visible=!rideChair.visible||Math.hypot(g.position.x-rideChair.position.x,g.position.y-rideChair.position.y,g.position.z+alpineShift-rideChair.position.z)>14;}}};
}
