import * as T from './vendor/three.module.js';

export const ferrisDimensions=Object.freeze({
 center:Object.freeze({x:-18,y:17,z:-5}),scale:2.35,yaw:.12,radius:5.7,cabinCount:12,seatsPerCabin:2,
 cabinWidth:2.14,cabinDepth:1.56,cabinDepthOffset:1.23,floorHeight:-1.30,ceilingHeight:.12,
 seatSpacing:1,seatDepth:.04,avatarOriginOffset:.82,rotationPeriod:240,
});
const TAU=Math.PI*2,V=(x,y,z)=>new T.Vector3(x,y,z);
const colors={silver:'#c0d0d8',paleSilver:'#e0e8e9',gold:'#cbb582',ice:'#9ec6d6',blue:'#536f83',navy:'#253b50',ivory:'#e4e8e4',warm:'#ffdfab',cool:'#cceeff'};

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

function canopyGeometry(){
 const points=[V(1.13,.12,0),V(1.11,.19,0),V(.96,.29,0),V(.70,.42,0),V(.36,.51,0),V(.035,.55,0)];
 return new T.LatheGeometry(points.map(p=>new T.Vector2(p.x,p.y)),40).scale(1,1,.76);
}

function cabinTemplate(materials){
 const root=new T.Group(),sections={};root.name='ferris-cabin-template';
 const section=(name,fade=false)=>{const group=new T.Group();group.name=name;group.userData={ferrisPart:name,ferrisCameraFade:fade};root.add(group);sections[name]=group;return batch(group,name,materials,{ferrisPart:name,ferrisCameraFade:fade});};
 const floor=section('floor'),roof=section('roof',true),frameParts=section('frame',true);
 floor.add(roundedBlock(2.14,.11,1.56),'blue','paint',[0,-1.365,0]);
 floor.add(roundedBlock(2.10,.035,1.52),'gold','metal',[0,-1.302,0]);
 floor.add(roundedBlock(2.04,.025,1.46),'ivory','paint',[0,-1.31,0]);
 // A low fascia leaves faces and the landscape open, including from inside the gondola.
 floor.add(roundedBlock(2.14,.19,.055),'ice','paint',[0,-1.25,.75]);
 floor.add(roundedBlock(2.14,.19,.055),'ice','paint',[0,-1.25,-.75]);
 for(const x of [-1.045,1.045])floor.add(roundedBlock(.055,.19,1.48),'ice','paint',[x,-1.25,0]);
 for(const z of [-.785,.785]){floor.add(rod([-1.04,-1.15,z],[1.04,-1.15,z],.018),'gold');for(const x of [-.75,-.25,.25,.75])floor.add(roundedBlock(.017,.09,.014),'silver','metal',[x,-1.25,z]);}
 for(const x of [-1.068,1.068])floor.add(rod([x,-1.15,-.73],[x,-1.15,.73],.018),'gold');
 floor.add(roundedBlock(.72,.055,.22),'silver','metal',[0,-1.38,.86]);
 floor.add(new T.TorusGeometry(.095,.014,6,20),'gold','metal',[0,-1.25,.797],[0,0,0],[1,.65,1]);
 // Each full-width cushion is low enough for the existing floor + .82 avatar anchor.
 for(const x of [-.5,.5]){
  floor.add(roundedBlock(.82,.09,.60,.04),'blue','paint',[x,-1.29,.04]);
  floor.add(roundedBlock(.84,.025,.62),'gold','metal',[x,-1.338,.04]);
  floor.add(roundedBlock(.83,.24,.075),'blue','paint',[x,-1.13,-.30]);
  floor.add(roundedBlock(.84,.025,.075),'gold','metal',[x,-.998,-.30]);
  for(const dx of [-.35,.35])floor.add(rod([x+dx,-1.29,-.29],[x+dx,-.99,-.29],.014),'silver');
 }
 floor.finish();

 const frame=(name,z)=>{
  const b=frameParts;
  for(const x of [-1.0,1.0]){
   b.add(rod([x,-1.18,z],[x,.12,z],.025),'silver');
   for(const y of [-1.13,-.91,.08])b.add(new T.CylinderGeometry(.043,.043,.045,10),'gold','metal',[x,y,z]);
   b.add(tube([[x,-.12,z],[x*.96,.02,z],[x*.79,.12,z]],.018,10),'gold');
  }
  b.add(rod([-1,.12,z],[1,.12,z],.022),'gold');
  if(name==='back-frame'){
   b.add(rod([-1,-.89,z],[1,-.89,z],.019),'silver');
   for(const x of [-.72,-.36,0,.36,.72])b.add(rod([x,-1.15,z],[x,-.89,z],.011),'gold');
  }else{
   // The broad central entrance is intentionally free of a rail across the riders.
   for(const side of [-1,1]){b.add(rod([side,-.92,z],[side*.72,-.92,z],.017),'gold');b.add(rod([side*.72,-1.15,z],[side*.72,-.92,z],.012),'silver');}
  }
 };
 frame('front-frame',.68);frame('back-frame',-.68);
 for(const side of [-1,1]){
  const b=frameParts,x=side*1.0;
  b.add(rod([x,-.88,-.68],[x,-.88,.68],.020),'silver');b.add(rod([x,.12,-.68],[x,.12,.68],.022),'gold');
  for(const z of [-.40,0,.40])b.add(rod([x,-1.15,z],[x,-.88,z],.012),'gold');
  b.add(tube([[x,-.08,-.68],[x,.10,-.45],[x,.15,0],[x,.10,.45],[x,-.08,.68]],.016,16),'silver');
 }

 roof.add(canopyGeometry(),'blue');
 roof.add(ellipseRing(1.13,.86,.13,.022),'gold');roof.add(ellipseRing(1.12,.85,.11,.011),'cool','light');
 roof.add(ellipseRing(.95,.72,.30,.011),'silver');
 for(let j=0;j<12;j++){
  const angle=j/12*TAU,c=Math.cos(angle),s=Math.sin(angle),profile=[[1.13,.14],[1.09,.21],[.94,.31],[.69,.44],[.35,.53],[.035,.565]];
  roof.add(tube(profile.map(([r,y])=>[c*r,y,s*r*.76]),.013,14),'gold');
  if(j%2===0)roof.add(new T.SphereGeometry(.023,8,6),'warm','light',[c*1.105,.10,s*.84]);
 }
 roof.add(new T.CylinderGeometry(.055,.095,.075,12),'gold','metal',[0,.59,0]);roof.add(new T.SphereGeometry(.036,10,7),'warm','light',[0,.655,0]);roof.finish();

 // The axle stays behind the passenger envelope; an arched yoke reaches over the canopy.
 frameParts.add(rod([0,0,-1.58],[0,0,-.85],.055),'silver');
 frameParts.add(tube([[0,0,-.85],[0,.39,-.91],[0,.76,-.65],[0,.82,-.25],[0,.72,0],[0,.59,0]],.042,22),'silver');
 frameParts.add(new T.TorusGeometry(.095,.023,8,24),'gold','metal',[0,0,-1.60]);
 frameParts.finish();return{root,sections};
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
   const offset=(i%2?1:-1)*.13,start=a+offset;spokes.add(rod([Math.cos(start)*.39,Math.sin(start)*.39,z],[Math.cos(a)*(d.radius-.29),Math.sin(a)*(d.radius-.29),z],i%2?.018:.026),i%2?'gold':'silver');
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
   const socket=new T.Object3D();socket.name='ferris-cabin-'+i+'-seat-'+seatIndex;socket.position.set((seatIndex-.5)*d.seatSpacing,d.floorHeight,d.seatDepth);socket.userData={ferrisCabin:i,seatIndex,seatSurface:true,forwardAxis:'+Z',avatarOriginOffset:d.avatarOriginOffset};cabin.add(socket);pair.push(socket);
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
