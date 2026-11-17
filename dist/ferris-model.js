import * as T from './vendor/three.module.js';

import {ferrisDimensions,ferrisSeatAnchor} from './ferris-layout.js';
export {ferrisDimensions} from './ferris-layout.js';
const TAU=Math.PI*2,V=(x,y,z)=>new T.Vector3(x,y,z);
const colors={silver:'#d0dce2',paleSilver:'#edf3f4',gold:'#cbb582',ice:'#9ec6d6',blue:'#91aebb',navy:'#253b50',ivory:'#e4e8e4',warm:'#ffdfab',cool:'#cceeff'};

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
   const count=items.reduce((sum,{geometry})=>sum+(geometry.index?.count||geometry.attributes.position.count),0),positions=new Float32Array(count*3),normals=new Float32Array(count*3),uv=new Float32Array(count*2),paint=new Float32Array(count*3);let offset=0;
   for(const {geometry,color} of items){const plain=geometry.index?geometry.toNonIndexed():geometry,n=plain.attributes.position.count;positions.set(plain.attributes.position.array,offset*3);normals.set(plain.attributes.normal.array,offset*3);uv.set(plain.attributes.uv.array,offset*2);for(let i=0;i<n;i++)paint.set(color.toArray(),(offset+i)*3);offset+=n;if(plain!==geometry)plain.dispose();geometry.dispose();}
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('normal',new T.BufferAttribute(normals,3));geometry.setAttribute('uv',new T.BufferAttribute(uv,2));geometry.setAttribute('color',new T.BufferAttribute(paint,3));geometry.computeBoundingSphere();geometry.computeBoundingBox();
   const mesh=new T.Mesh(geometry,materials[kind]);mesh.name=name+'-'+kind;mesh.castShadow=kind!=='light';mesh.receiveShadow=kind!=='light';mesh.userData={...metadata};parent.add(mesh);meshes.push(mesh);
  }return meshes;
 }
 return{add,finish};
}

function cabinTemplate(materials){
 const root=new T.Group(),sections={};root.name='ferris-cabin-template';
 const section=(name,fade=false)=>{const group=new T.Group();group.name=name;group.userData={ferrisPart:name,ferrisCameraFade:fade};root.add(group);sections[name]=group;return batch(group,name,materials,{ferrisPart:name,ferrisCameraFade:fade});};
 const floor=section('floor'),roof=section('roof',true),frame=section('frame',true);
 // The round basin and low shell keep the cabin silhouette simple and the view open.
 floor.add(new T.CylinderGeometry(1.075,1.02,.10,48),'ivory','paint',[0,-1.365,0]);
 floor.add(ellipseRing(1.065,1.065,-1.31,.016),'gold');
 const shell=[new T.Vector2(1.02,-1.38),new T.Vector2(1.08,-1.30),new T.Vector2(1.09,-1.19),new T.Vector2(1.07,-1.12)];
 floor.add(new T.LatheGeometry(shell,48),'ice','paint');
 floor.add(ellipseRing(1.07,1.07,-1.12,.016),'silver');
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
  for(const y of [-1.1,.12])frame.add(new T.CylinderGeometry(.039,.039,.04,10),'gold','metal',[x,y,z]);
 }
 // Low side rails leave the two seated faces unobstructed and provide a side entry.
 for(const side of [-1,1]){
  const points=Array.from({length:15},(_,i)=>{const a=side*Math.PI/2+(i/14-.5)*.92;return[Math.cos(a)*1.055,-.91,Math.sin(a)*1.055];});
  frame.add(tube(points,.016,18),'silver');
 }
 const canopy=[new T.Vector2(1.10,.12),new T.Vector2(1.09,.18),new T.Vector2(.91,.27),new T.Vector2(.60,.34),new T.Vector2(.20,.38),new T.Vector2(0,.39)];
 roof.add(new T.LatheGeometry(canopy,48),'ivory');
 roof.add(ellipseRing(1.10,1.10,.13,.020),'silver');
 roof.add(ellipseRing(1.085,1.085,.105,.010),'warm','light');
 // Eight tiny lamps rather than decorative ribs preserve the classic, quiet pod design.
 for(let j=0;j<8;j++){const a=j/8*TAU;roof.add(new T.SphereGeometry(.022,8,5),'cool','light',[Math.cos(a)*1.07,.10,Math.sin(a)*1.07]);}
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
 const materials={metal:new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.29,metalness:.72}),paint:new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.48,metalness:.12}),light:new T.MeshBasicMaterial({color:'#ffffff',vertexColors:true,toneMapped:false})};
 const wheel=new T.Group();wheel.name='ferris-rotating-wheel';root.add(wheel);
 const structure=batch(root,'ferris-support',materials,{ferrisPart:'support'}),rim=batch(wheel,'ferris-rim',materials,{ferrisPart:'wheel'}),spokes=batch(wheel,'ferris-spokes',materials,{ferrisPart:'wheel'}),hub=batch(root,'ferris-hub',materials,{ferrisPart:'hub'});
 const footY=-d.center.y/d.scale+.14;
 for(const z of [-.95,.12]){
  for(const side of [-1,1]){
   const x=side*2.7;structure.add(roundedBlock(.72,.18,.85),'blue','paint',[x,footY-.03,z]);structure.add(roundedBlock(.76,.045,.9),'gold','metal',[x,footY+.073,z]);
   structure.add(rod([x,footY+.09,z],[side*.10,-.12,z],.105),'silver');
   structure.add(rod([x+side*.12,footY+.12,z+.07],[side*.23,-.14,z+.07],.023),'gold');
   for(let j=0;j<7;j++){
    const t=j/7,y=footY+.2+(-.2-footY)*t,cx=x*(1-t);structure.add(rod([cx-.13,y,z-.11],[cx+.13,y+.13,z+.11],.019),'gold');
   }
   for(const dx of [-.20,.20])for(const dz of [-.27,.27])structure.add(new T.CylinderGeometry(.035,.035,.035,8),'silver','metal',[x+dx,footY+.11,z+dz]);
  }
  structure.add(rod([-1.60,-3.5,z],[1.60,-3.5,z],.045),'silver');structure.add(rod([-1.60,-3.5,z],[0,-1.05,z],.026),'gold');structure.add(rod([1.60,-3.5,z],[0,-1.05,z],.026),'gold');
 }
 for(const x of [-2.7,2.7])structure.add(rod([x,footY+.1,-.95],[x,footY+.1,.12],.045),'silver');
 structure.finish();

 for(const z of [-.35,.35]){
  rim.add(new T.TorusGeometry(d.radius,.060,8,120),'silver','metal',[0,0,z]);rim.add(new T.TorusGeometry(d.radius-.28,.035,8,120),'gold','metal',[0,0,z]);
  rim.add(new T.TorusGeometry(d.radius+.025,.013,6,120),'cool','light',[0,0,z+(z>0?.062:-.062)]);rim.add(new T.TorusGeometry(d.radius-.265,.009,6,120),'warm','light',[0,0,z+(z>0?.045:-.045)]);
  for(let i=0;i<48;i++){
   const a=i/48*TAU,b=(i+.5)/48*TAU,c=(i+1)/48*TAU,outer=t=>[Math.cos(t)*d.radius,Math.sin(t)*d.radius,z],inner=t=>[Math.cos(t)*(d.radius-.28),Math.sin(t)*(d.radius-.28),z];
   rim.add(rod(outer(a),inner(b),.016),'gold');rim.add(rod(inner(b),outer(c),.016),'gold');
   rim.add(new T.SphereGeometry(.026,6,4),'warm','light',outer(a));
  }
 }
 for(let i=0;i<24;i++){
  const a=i/24*TAU,x=Math.cos(a)*d.radius,y=Math.sin(a)*d.radius;rim.add(rod([x,y,-.35],[x,y,.35],.029),'silver');
  for(const z of [-.30,.30]){
   const start=a;spokes.add(rod([Math.cos(start)*.39,Math.sin(start)*.39,z],[Math.cos(a)*(d.radius-.29),Math.sin(a)*(d.radius-.29),z],i%2?.018:.026),i%2?'gold':'silver');
  }
  if(i%2===0)spokes.add(rod([Math.cos(a)*.57,Math.sin(a)*.57,.33],[Math.cos(a)*(d.radius-.35),Math.sin(a)*(d.radius-.35),.33],.008),'cool','light');
 }
 rim.finish();spokes.finish();
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
