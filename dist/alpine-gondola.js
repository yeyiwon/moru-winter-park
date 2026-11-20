import * as T from './vendor/three.module.js';
import {gondolaStations,gondolaSupports} from './mountain-layout.js';
import {mergeFinish} from './architecture-kit.js';
import {resortRides,alpineHeight} from './resort-blueprint.js';
import {alpineShift} from './resort-layout.js';
import {sampleCableRide} from './winter-rides.js';
import {gondolaSeat,gondolaCabinsAt} from './ride-seats.js';
import {serverNow} from './server-clock.js';

export function createGondola(parent){
 const root=new T.Group();root.name='cloud-gondola';parent.add(root);
 const white=new T.MeshStandardMaterial({color:'#e4ebef',metalness:.28,roughness:.31}),silver=new T.MeshStandardMaterial({color:'#aabfcf',metalness:.7,roughness:.27}),dark=new T.MeshStandardMaterial({color:'#173347',metalness:.2,roughness:.65}),glass=new T.MeshPhysicalMaterial({color:'#b8e5f6',transparent:true,opacity:.22,roughness:.16,metalness:.15,depthWrite:false,side:T.DoubleSide}),warm=new T.MeshBasicMaterial({color:'#ffdd9c',toneMapped:false});
 const unitBox=new T.BoxGeometry(1,1,1),unitSphere=new T.SphereGeometry(1,20,12),rodGeo=new T.CylinderGeometry(1,1,1,8),up=new T.Vector3(0,1,0),v=new T.Vector3();
 function box(g,m,x,y,z,w,h,d){const o=new T.Mesh(unitBox,m);o.position.set(x,y,z);o.scale.set(w,h,d);g.add(o);return o;}
 function ellipsoid(g,m,x,y,z,sx,sy,sz){const o=new T.Mesh(unitSphere,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);g.add(o);return o;}
 function rod(g,a,b,r,m=silver){const o=new T.Mesh(rodGeo,m);v.subVectors(b,a);o.position.copy(a).add(b).multiplyScalar(.5);o.scale.set(r,v.length(),r);o.quaternion.setFromUnitVectors(up,v.normalize());g.add(o);return o;}
 const template=new T.Group();template.name='six-seat-gondola';
 // Curved shell and continuous curved glazing share the same elliptical cross-section.
 ellipsoid(template,white,0,-.37,0,3.08,.39,3.15);ellipsoid(template,white,0,2.46,0,2.82,.26,2.9);
 const floor=new T.Mesh(new T.CylinderGeometry(1,1,1,40),dark);floor.position.y=-.13;floor.scale.set(2.8,.12,2.85);template.add(floor);
 const points=[new T.Vector2(1.88,.05),new T.Vector2(2.02,.65),new T.Vector2(1.99,1.45),new T.Vector2(1.8,2.39)];
 const glazing=new T.Mesh(new T.LatheGeometry(points,40,Math.PI+.48,Math.PI*2-.96),glass);glazing.scale.set(1.55,1,1.55);template.add(glazing);
 for(const a of [-.48,.48,Math.PI/2,Math.PI,Math.PI*1.5]){const pts=points.map(p=>new T.Vector3(Math.sin(a+Math.PI)*p.x*1.55,p.y,Math.cos(a+Math.PI)*p.x*1.55));const rail=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),16,.038,6,false),silver);template.add(rail);}
 for(const y of [.08,2.34]){const rail=new T.Mesh(new T.TorusGeometry(y<1?1.88:1.81,.045,6,40,Math.PI*2-.96),silver);rail.rotation.x=Math.PI/2;rail.rotation.z=Math.PI+.48;rail.position.y=y;rail.scale.set(1.55,1.55,1);template.add(rail);}
 for(let i=0;i<6;i++){const seat=gondolaSeat(i),s=box(template,dark,seat.x,.02,seat.z,.75,.18,.88);box(template,white,seat.x+(i<3?-.27:.27),.49,seat.z,.12,.85,.86);box(template,silver,seat.x,-.19,seat.z,.12,.35,.6);s.rotation.y=0;}
 for(const x of [-.8,.8])box(template,warm,x,2.28,0,.5,.035,1.8);
 rod(template,new T.Vector3(0,2.6,0),new T.Vector3(0,5.3,-.35),.075);box(template,silver,0,5.35,-.35,.3,.2,.8);
 template.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.rideCameraFade=true;}});mergeFinish(template);template.traverse(o=>{if(o.isMesh)Object.assign(o.userData,{rideCameraFade:true,cameraMovingCabin:true});});
 const doorGeometry=new T.PlaneGeometry(.85,2.1),doors=[];
 for(const side of [-1,1]){const door=new T.Group();door.name='gondola-door-'+side;door.position.set(side*.43,1.25,-3.0);const pane=new T.Mesh(doorGeometry,glass);door.add(pane);for(const x of [-.43,.43])box(door,silver,x,0,.015,.035,2.1,.035);for(const y of [-1.05,1.05])box(door,silver,0,y,.015,.85,.035,.035);box(door,silver,side*-.3,-.08,.04,.035,.32,.035);door.traverse(o=>{if(o.isMesh)o.userData.cameraMovingCabin=true;});template.add(door);doors.push(door);}
 const route=resortRides.gondola,detail=new Map(),cabins=[],occluders=[],dummy=new T.Object3D();
 const proxy=new T.InstancedMesh(unitSphere,white,48);proxy.name='distant-gondola-cabins';proxy.userData.skiTerrain=true;root.add(proxy);
 const cablePositions=[];for(let i=1;i<route.points.length;i++){const a=route.points[i-1],b=route.points[i];const yaw=Math.atan2(b[0]-a[0],b[2]-a[2]);for(const offset of [0,12])cablePositions.push(a[0]-Math.cos(yaw)*offset,a[1]+5.35,a[2]+Math.sin(yaw)*offset,b[0]-Math.cos(yaw)*offset,b[1]+5.35,b[2]+Math.sin(yaw)*offset);}
 const cableGeometry=new T.BufferGeometry();cableGeometry.setAttribute('position',new T.Float32BufferAttribute(cablePositions,3));root.add(new T.LineSegments(cableGeometry,new T.LineBasicMaterial({color:'#344b60'})));
 // The shared layout excludes the entire piste width; do not regenerate posts from cable samples.
 for(const p of gondolaSupports.slice(1,-1)){const yaw=gondolaStations[0].yaw,tower=new T.Group(),cx=p[0]-Math.cos(yaw)*6,cz=p[2]+Math.sin(yaw)*6,ground=alpineHeight(cx,cz);tower.name='gondola-support';tower.position.set(cx,ground,cz);tower.rotation.y=yaw;root.add(tower);const h=p[1]+4.9-ground;rod(tower,new T.Vector3(0,0,0),new T.Vector3(0,h,0),.3);box(tower,dark,0,h,0,14,.4,.6);for(const x of [-6,6])box(tower,silver,x,h+.2,0,.45,.35,2);}
 for(const [index,p]of gondolaStations.entries()){
  const station=new T.Group();station.name=index?'cloud-summit-terminal':'cloud-base-terminal';station.position.set(p.x,p.y,p.z);station.rotation.y=p.yaw;root.add(station);
  for(const x of [-16,-4,4])for(const z of [-5,5])box(station,silver,x,3.4,z,.24,6.8,.24);
  for(const canopy of [ellipsoid(station,white,-6,6.7,0,11.1,.4,7),box(station,dark,-6,6.25,0,20,.24,12)])Object.assign(canopy.userData,{keep:true,cameraCanopy:true});
  for(const x of [-14,-10,-2,2])box(station,warm,x,6.08,0,.09,.05,9);
  // Flat entry apron matches collision terrain; there is no raised platform to climb through.
  box(station,white,0,.035,-8,7,.06,8);
 }
 mergeFinish(root);root.traverse(o=>{if(o.isMesh)o.userData.rideCameraFade=true;});
 function cabinPose(start,now){const elapsed=(now-start)/1000,p=sampleCableRide(route,elapsed);return {...p,y:p.y-.82};}
 function update(){const now=serverNow(),player=globalThis.window?.labPlayerState,active=new Set();let count=0;
  // Reservations use this same schedule on the server; they never spawn a second visual cabin.
  for(const {id,startedAt:start} of gondolaCabinsAt(now,cabins)){const p=cabinPose(start,now);
   const near=player&&Math.hypot(player.x-p.x,player.z-alpineShift-p.z)<170;let g=detail.get(id);
   if(near){active.add(id);if(!g){g=template.clone(true);root.add(g);detail.set(id,g);g.userData.cabinId=id;g.traverse(o=>{if(o.isMesh){o.userData.rideCameraFade=true;occluders.push(o);}});}g.position.set(p.x,p.y,p.z);g.rotation.y=p.yaw;for(const side of [-1,1])g.getObjectByName('gondola-door-'+side).position.x=side*(.43+p.doors*.85);}
   else if(count<48){dummy.position.set(p.x,p.y+1,p.z);dummy.rotation.set(0,p.yaw,0);dummy.scale.set(3.05,1.5,3.1);dummy.updateMatrix();proxy.setMatrixAt(count++,dummy.matrix);}
  }
  for(const [id,g]of detail)if(!active.has(id)){g.removeFromParent();detail.delete(id);g.traverse(o=>{const i=occluders.indexOf(o);if(i!==-1)occluders.splice(i,1);});}proxy.count=count;proxy.instanceMatrix.needsUpdate=true;proxy.computeBoundingSphere();
 }
 return{root,update,occluders};
}
