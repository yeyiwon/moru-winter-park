import {addLandmarkNightFill} from './landmark-lighting.js';
import {mergePaintedGeometry} from './mesh-batch.js';
import * as T from './vendor/three.module.js';

import {ferrisDimensions,ferrisSeatAnchor} from './ferris-layout.js';
export {ferrisDimensions} from './ferris-layout.js';
const TAU=Math.PI*2,V=(x,y,z)=>new T.Vector3(x,y,z);
const colors={silver:'#d7e6ec',paleSilver:'#f1f4f3',gold:'#dfbc78',ice:'#badfe7',blue:'#446781',navy:'#183756',ivory:'#f2eadb',warm:'#ffe2af',cool:'#c8f1ff'};

function roundedBlock(w,h,d,r=.04){
 r=Math.min(r,w/5,h/5,d/5);const shape=new T.Shape(),x=-w/2,y=-h/2;
 shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);
 const geometry=new T.ExtrudeGeometry(shape,{depth:d-r*2,bevelEnabled:true,bevelThickness:r,bevelSize:r*.35,bevelSegments:2,curveSegments:5});geometry.translate(0,0,-d/2+r);return geometry;
}
function tube(points,r=.02,steps=20){return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>V(...p))),steps,r,6,false);}
function rod(a,b,r=.025){
 const from=V(...a),to=V(...b),direction=to.clone().sub(from),geometry=new T.CylinderGeometry(r,r,direction.length(),8);
 geometry.applyQuaternion(new T.Quaternion().setFromUnitVectors(V(0,1,0),direction.normalize()));geometry.translate(...from.add(to).multiplyScalar(.5).toArray());return geometry;
}
function ellipseRing(rx,rz,y,r=.02){return new T.TorusGeometry(1,r,6,64).rotateX(Math.PI/2).scale(rx,1,rz).translate(0,y,0);}

// Color attributes allow detailed metalwork to share one draw call per camera-facing section.
function batch(parent,name,materials,metadata={}){
 const parts=new Map(),transform=new T.Object3D();
 function add(geometry,color,finish='metal',position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]){
  transform.position.set(...position);transform.rotation.set(...rotation);transform.scale.set(...scale);transform.updateMatrix();geometry.applyMatrix4(transform.matrix);
  if(!parts.has(finish))parts.set(finish,[]);parts.get(finish).push({geometry,color:new T.Color(colors[color]||color)});
 }
 function finish(){
  const meshes=[];
  for(const [kind,items] of parts){
   const geometry=mergePaintedGeometry(items);for(const item of items)item.geometry.dispose();
   const mesh=new T.Mesh(geometry,materials[kind]);mesh.name=name+'-'+kind;mesh.castShadow=kind!=='light';mesh.receiveShadow=kind!=='light';mesh.userData={...metadata};parent.add(mesh);meshes.push(mesh);
  }return meshes;
 }
 return{add,finish};
}

function cabinTemplate(materials){
 const root=new T.Group(),sections={};root.name='ferris-cabin-template';
 const section=(name,fade=false)=>{const group=new T.Group();group.name=name;group.userData={ferrisPart:name,ferrisCameraFade:fade};root.add(group);sections[name]=group;return batch(group,name,materials,{ferrisPart:name,ferrisCameraFade:fade});};
 const floor=section('floor'),roof=section('roof',true),frame=section('frame',true);
 // A rounded enamel cabin with a gilded lower skirt; seated faces retain an open sight line.
 floor.add(new T.CylinderGeometry(1.075,1.02,.10,40),'ivory','paint',[0,-1.365,0]);
 floor.add(ellipseRing(1.065,1.065,-1.31,.016),'gold');
 const shell=[new T.Vector2(.89,-1.44),new T.Vector2(1.02,-1.38),new T.Vector2(1.08,-1.30),new T.Vector2(1.09,-1.12),new T.Vector2(1.065,-.86),new T.Vector2(1.04,-.83)];
 floor.add(new T.LatheGeometry(shell,40),'ivory','paint');
 floor.add(ellipseRing(1.075,1.075,-1.26,.013),'gold');
 floor.add(ellipseRing(1.043,1.043,-.825,.022),'gold');
 floor.add(ellipseRing(1.071,1.071,-.88,.009),'warm','paint');
 // Enamel panels, medallions and fine vertical beads give the cabins a recognisable pavilion finish.
 for(let j=0;j<16;j++){
  const a=j/16*TAU,side=[Math.cos(a),Math.sin(a)];
  floor.add(rod([side[0]*1.082,-1.25,side[1]*1.082],[side[0]*1.067,-.87,side[1]*1.067],.010),'gold');
  if(j%4===0){
   floor.add(new T.TorusGeometry(.078,.012,5,18),'gold','metal',[side[0]*1.095,-1.07,side[1]*1.095],[0,Math.PI/2-a,0]);
   floor.add(new T.OctahedronGeometry(.043,0),'blue','paint',[side[0]*1.1,-1.07,side[1]*1.1]);
  }
 }

 // Seats face the central aisle; their sockets and cushions use the same local Z values.
 for(const seatIndex of [0,1]){
  const anchor=ferrisSeatAnchor(seatIndex),side=seatIndex===1?1:-1,z=anchor.z;
  floor.add(roundedBlock(.72,.08,.45),'blue','paint',[0,-1.285,z]);
  floor.add(roundedBlock(.75,.025,.47),'gold','metal',[0,-1.333,z]);
  floor.add(roundedBlock(.76,.29,.075),'blue','paint',[0,-1.10,z+side*.24]);
  floor.add(roundedBlock(.77,.025,.08),'silver','metal',[0,-.947,z+side*.24]);
  for(const x of [-.35,.35])floor.add(rod([x,-1.30,z+side*.24],[x,-.94,z+side*.24],.014),'silver');
 }
 floor.finish();
 // Four slender posts stay away from either head and from the side-facing camera.
 for(let i=0;i<4;i++){
  const a=Math.PI/4+i*Math.PI/2,x=Math.cos(a)*1.04,z=Math.sin(a)*1.04;
  frame.add(rod([x,-1.14,z],[x,.14,z],.024),'paleSilver');
  for(const y of [-.86,.10])frame.add(new T.CylinderGeometry(.047,.047,.055,10),'gold','metal',[x,y,z]);
  for(const sign of [-1,1]){const b=a+sign*.5;frame.add(tube([[x,-.12,z],[x*.97,.04,z*.97],[Math.cos(b)*1.04,.115,Math.sin(b)*1.04]],.014,10),'gold');}

 }
 // Low side rails leave the two seated faces unobstructed and provide a side entry.
 for(const side of [-1,1]){
  const points=Array.from({length:15},(_,i)=>{const a=side*Math.PI/2+(i/14-.5)*.92;return[Math.cos(a)*1.055,-.91,Math.sin(a)*1.055];});
  frame.add(tube(points,.016,18),'silver');
 }
 const canopy=[new T.Vector2(1.10,.12),new T.Vector2(1.10,.17),new T.Vector2(.99,.21),new T.Vector2(.86,.32),new T.Vector2(.58,.40),new T.Vector2(.20,.44),new T.Vector2(0,.45)];
 roof.add(new T.LatheGeometry(canopy,40),'blue','metal');
 roof.add(ellipseRing(1.10,1.10,.13,.020),'silver');
 roof.add(ellipseRing(1.085,1.085,.105,.010),'warm','light');
 // Tailored gold ribs and a scalloped illuminated valance restore the winter pavilion detail.
 for(let j=0;j<12;j++){
  const a=j/12*TAU;
  roof.add(tube(canopy.slice(0,-1).map(p=>[Math.cos(a)*(p.x+.008),p.y+.009,Math.sin(a)*(p.x+.008)]),.010,14),'gold');
  const arc=Array.from({length:7},(_,k)=>{const u=k/6,b=a+u*TAU/12;return[Math.cos(b)*1.09,.105-Math.sin(u*Math.PI)*.065,Math.sin(b)*1.09];});
  roof.add(tube(arc,.012,8),'gold');
  roof.add(new T.SphereGeometry(.025,6,4),'warm','light',[Math.cos(a)*1.09,.085,Math.sin(a)*1.09]);
 }
 roof.add(new T.CylinderGeometry(.045,.08,.055,12),'gold','metal',[0,.465,0]);
 roof.add(new T.SphereGeometry(.035,8,6),'cool','light',[0,.505,0]);
 // Light traces the pavilion ribs, corner posts and lower skirt without closing the view.
 for(let j=0;j<4;j++){
  const a=j/4*TAU+Math.PI/4;
  roof.add(tube(canopy.slice(0,-1).map(p=>[Math.cos(a)*(p.x+.015),p.y+.022,Math.sin(a)*(p.x+.015)]),.008,12),'warm','light');
  {const x=Math.cos(a)*1.055,z=Math.sin(a)*1.055;roof.add(rod([x,-.82,z],[x,.10,z],.007),'cool','light');}
 }
 roof.add(new T.TorusGeometry(1.085,.008,4,48).rotateX(Math.PI/2).translate(0,-1.28,0),'warm','light');

 roof.finish();
 // The hanger reaches over the canopy from the wheel plane behind the passenger envelope.
 frame.add(rod([0,0,-1.85],[0,0,-1.16],.05),'silver');
 frame.add(tube([[0,0,-1.16],[0,.43,-1.15],[0,.67,-.65],[0,.69,-.20],[0,.43,0]],.037,18),'silver');
 frame.add(new T.TorusGeometry(.085,.018,8,24),'gold','metal',[0,0,-1.86]);
 frame.finish();return{root,sections};
}

export function buildFerrisWheel(){
 const d=ferrisDimensions,root=new T.Group();root.name='winter-grand-ferris-wheel';root.position.set(d.center.x,d.center.y,d.center.z);root.rotation.y=d.yaw;root.scale.setScalar(d.scale);
 root.userData={asset:'winter-grand-ferris-wheel',dynamic:true,cabinCount:d.cabinCount,seatsPerCabin:d.seatsPerCabin};
 const materials={metal:new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.31,metalness:.52}),paint:new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.48,metalness:.12}),light:new T.MeshBasicMaterial({color:'#ffffff',vertexColors:true,toneMapped:false})};
 addLandmarkNightFill(materials.metal,.08);addLandmarkNightFill(materials.paint,.12);
 const illuminationTime={value:0};
 materials.light.onBeforeCompile=shader=>{shader.uniforms.illuminationTime=illuminationTime;shader.vertexShader='varying vec3 vFixture;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFixture=position;');shader.fragmentShader='uniform float illuminationTime;varying vec3 vFixture;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=1.8+.28*pow(.5+.5*sin(vFixture.y*.8+vFixture.x*.5-illuminationTime*.4),8.);');};
 materials.light.customProgramCacheKey=()=> 'ferris-illumination-v27';
 const wheel=new T.Group();wheel.name='ferris-rotating-wheel';root.add(wheel);
 const structure=batch(root,'ferris-support',materials,{ferrisPart:'support'}),rim=batch(wheel,'ferris-rim',materials,{ferrisPart:'wheel'}),spokes=batch(wheel,'ferris-spokes',materials,{ferrisPart:'wheel'}),hub=batch(root,'ferris-hub',materials,{ferrisPart:'hub'});
 const footY=-d.center.y/d.scale+.14;
 for(const z of [-.95,.12]){
  for(const side of [-1,1]){
   const x=side*2.7;structure.add(roundedBlock(.72,.18,.85),'blue','paint',[x,footY-.03,z]);structure.add(roundedBlock(.76,.045,.9),'gold','metal',[x,footY+.073,z]);
   structure.add(rod([x,footY+.09,z],[side*.10,-.12,z],.105),'silver');
   structure.add(rod([x,footY+.16,z+.116],[side*.10,-.12,z+.116],.014),'cool','light');
   structure.add(rod([x+side*.14,footY+.16,z+.10],[side*.24,-.12,z+.10],.010),'warm','light');
   for(let j=0;j<22;j++){const u=j/21;structure.add(new T.SphereGeometry(.025,6,4),'warm','light',[x*(1-u)+side*.1*u,footY+.2+(-.2-footY)*u,z+.13]);}
   structure.add(rod([x+side*.12,footY+.12,z+.07],[side*.23,-.14,z+.07],.023),'gold');
   for(let j=0;j<7;j++){
    const t=j/7,y=footY+.2+(-.2-footY)*t,cx=x*(1-t);structure.add(rod([cx-.13,y,z-.11],[cx+.13,y+.13,z+.11],.019),'gold');
   }
   for(const dx of [-.20,.20])for(const dz of [-.27,.27])structure.add(new T.CylinderGeometry(.035,.035,.035,8),'silver','metal',[x+dx,footY+.11,z+dz]);
  }
  structure.add(rod([-1.60,-3.5,z],[1.60,-3.5,z],.045),'silver');structure.add(rod([-1.60,-3.5,z],[0,-1.05,z],.026),'gold');structure.add(rod([1.60,-3.5,z],[0,-1.05,z],.026),'gold');
 }
 for(const x of [-2.7,2.7])structure.add(rod([x,footY+.1,-.95],[x,footY+.1,.12],.045),'silver');
 for(const z of [-.81,.26]){structure.add(rod([-1.60,-3.5,z],[1.60,-3.5,z],.012),'warm','light');structure.add(rod([-1.60,-3.5,z],[0,-1.05,z],.010),'cool','light');structure.add(rod([1.60,-3.5,z],[0,-1.05,z],.010),'cool','light');}
 structure.finish();

 for(const z of [-.35,.35]){
  rim.add(new T.TorusGeometry(d.radius,.060,8,120),'silver','metal',[0,0,z]);rim.add(new T.TorusGeometry(d.radius-.28,.035,8,120),'gold','metal',[0,0,z]);
  rim.add(new T.TorusGeometry(d.radius+.025,.023,6,120),'cool','light',[0,0,z+(z>0?.062:-.062)]);rim.add(new T.TorusGeometry(d.radius-.265,.017,6,120),'warm','light',[0,0,z+(z>0?.045:-.045)]);
  for(let i=0;i<48;i++){
   const a=i/48*TAU,b=(i+.5)/48*TAU,c=(i+1)/48*TAU,outer=t=>[Math.cos(t)*d.radius,Math.sin(t)*d.radius,z],inner=t=>[Math.cos(t)*(d.radius-.28),Math.sin(t)*(d.radius-.28),z];
   rim.add(rod(outer(a),inner(b),.016),'gold');rim.add(rod(inner(b),outer(c),.016),'gold');
   rim.add(new T.SphereGeometry(.032,6,4),'warm','light',outer(a));
  }
 }
 for(let i=0;i<24;i++){
  const a=i/24*TAU,x=Math.cos(a)*d.radius,y=Math.sin(a)*d.radius;rim.add(rod([x,y,-.35],[x,y,.35],.029),'silver');
  for(const z of [-.30,.30]){
   const start=a;spokes.add(rod([Math.cos(start)*.39,Math.sin(start)*.39,z],[Math.cos(a)*(d.radius-.29),Math.sin(a)*(d.radius-.29),z],i%2?.018:.026),i%2?'gold':'silver');
  }
  for(const z of [-.34,.34])spokes.add(rod([Math.cos(a)*.57,Math.sin(a)*.57,z],[Math.cos(a)*(d.radius-.35),Math.sin(a)*(d.radius-.35),z],i%2?.010:.016),i%2?'warm':'cool','light');
 }
 rim.finish();spokes.finish();
 // One GPU point cloud supplies the visible halo of the rim bulbs at every distance.
 // These decorative fixtures never consume the bounded real-light pool.
 const glowPositions=[],glowColors=[];
 for(const z of [-.43,.43])for(let i=0;i<120;i++){
  const a=i/120*TAU,r=d.radius-(i%2?.27:0);glowPositions.push(Math.cos(a)*r,Math.sin(a)*r,z);
  const color=new T.Color(i%2?colors.warm:colors.cool);glowColors.push(color.r,color.g,color.b);
 }
 const glowGeometry=new T.BufferGeometry();glowGeometry.setAttribute('position',new T.Float32BufferAttribute(glowPositions,3));glowGeometry.setAttribute('color',new T.Float32BufferAttribute(glowColors,3));
 const glowMaterial=new T.ShaderMaterial({uniforms:{time:illuminationTime},transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,vertexColors:true,
  vertexShader:`uniform float time;varying vec3 vColor;varying float shine;void main(){vColor=color;shine=.64+.36*pow(.5+.5*sin(position.x*.7+position.y*.8-time*.35),6.);vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(850./max(1.,-p.z),2.,18.);gl_Position=projectionMatrix*p;}`,
  fragmentShader:`varying vec3 vColor;varying float shine;void main(){vec2 p=gl_PointCoord-.5;float core=exp(-dot(p,p)*80.);float halo=exp(-dot(p,p)*14.)*.22;float rays=exp(-abs(p.x)*75.)*exp(-abs(p.y)*7.)+exp(-abs(p.y)*75.)*exp(-abs(p.x)*7.);float a=(core+halo+rays*.25)*shine;if(a<.01)discard;gl_FragColor=vec4(vColor,a);}`});
 const glow=new T.Points(glowGeometry,glowMaterial);glow.name='ferris-rim-fairy-lights';wheel.add(glow);
 hub.add(new T.CylinderGeometry(.23,.23,1.5,24),'silver','metal',[0,0,-.35],[Math.PI/2,0,0]);
 for(const z of [-1.03,.43]){
  hub.add(new T.CylinderGeometry(.40,.40,.12,40),'blue','paint',[0,0,z],[Math.PI/2,0,0]);hub.add(new T.TorusGeometry(.35,.024,8,40),'gold','metal',[0,0,z+.071]);hub.add(new T.TorusGeometry(.23,.014,6,32),'cool','light',[0,0,z+.075]);
  for(let j=0;j<8;j++){const a=j/8*TAU;hub.add(new T.SphereGeometry(.025,8,6),'gold','metal',[Math.cos(a)*.31,Math.sin(a)*.31,z+.082]);}
 }
 hub.finish();

 // Cabins reuse geometry while retaining separate objects for occupancy and camera fading.
 const template=cabinTemplate(materials),cabins=[],cabinParts=[],seatSockets=[];
 for(let i=0;i<d.cabinCount;i++){
  const cabin=template.root.clone(true);cabin.name='ferris-cabin-'+i;cabin.userData={ferrisCabin:i,seatCount:2};const angle=i/d.cabinCount*TAU;cabin.position.set(Math.cos(angle)*d.radius,Math.sin(angle)*d.radius,d.cabinDepthOffset);wheel.add(cabin);cabins.push(cabin);const parts={};
  cabin.traverse(object=>{if(object!==cabin){const part=object.userData.ferrisPart;object.name='ferris-cabin-'+i+'-'+object.name;object.userData={...object.userData,ferrisCabin:i};if(object.isGroup&&part)parts[part]=object;}});cabinParts.push(parts);
  const pair=[];
  for(let seatIndex=0;seatIndex<d.seatsPerCabin;seatIndex++){
   const socket=new T.Object3D();socket.name='ferris-cabin-'+i+'-seat-'+seatIndex;const anchor=ferrisSeatAnchor(seatIndex);socket.position.set(anchor.x,anchor.y,anchor.z);socket.rotation.y=anchor.yaw;socket.userData={ferrisCabin:i,seatIndex,seatSurface:true,forwardAxis:'+Z',avatarOriginOffset:d.avatarOriginOffset};cabin.add(socket);pair.push(socket);
  }seatSockets.push(pair);
 }
 const point=new T.Vector3(),forward=new T.Vector3(),quaternion=new T.Quaternion();
 function update(time,still=false){
  if(still||!Number.isFinite(time))return;
  illuminationTime.value=time;
  wheel.rotation.z=((time%d.rotationPeriod)+d.rotationPeriod)%d.rotationPeriod/d.rotationPeriod*TAU;
  for(const cabin of cabins)cabin.rotation.z=-wheel.rotation.z;
 }
 function seat(cabinIndex=0,seatIndex=0){
  if(!Number.isInteger(cabinIndex)||!Number.isInteger(seatIndex))return null;
  const socket=seatSockets[cabinIndex]?.[seatIndex];if(!socket)return null;
  socket.getWorldPosition(point);socket.getWorldQuaternion(quaternion);forward.set(0,0,1).applyQuaternion(quaternion);
  return{x:point.x,y:point.y+d.avatarOriginOffset,z:point.z,yaw:Math.atan2(forward.x,forward.z)};
 }
 update(0);root.updateMatrixWorld(true);
 return{root,wheel,rotor:wheel,cabins,gondolas:cabins,cabinParts,seatSockets,dimensions:d,update,seat};
}
