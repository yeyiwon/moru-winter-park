import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildCarousel,carouselDimensions} from '../dist/carousel-model.js';
import {sculptedHorseCoats} from '../dist/carousel-horse-geometry.js';
const model=buildCarousel(),meshes=[];model.root.traverse(o=>{if(o.isMesh)meshes.push(o);});
test('sculpted anatomy retains all four legs down to their hoof joints',()=>{
 for(let variant=0;variant<sculptedHorseCoats.length;variant++){
  const positions=sculptedHorseCoats[variant].position,swing=((variant+1)%3-1)*.12;
  for(const joint of [[.36,.11,.82+swing],[-.35,.57,.52],[.37,.16,-.90],[-.37,.12,-1.09]]){
   let distance=Infinity;for(let i=0;i<positions.length;i+=3)distance=Math.min(distance,Math.hypot(positions[i]-joint[0],positions[i+1]-joint[1],positions[i+2]-joint[2]));
   assert.ok(distance<.14,`horse ${variant} is missing the leg at ${joint}`);
  }
 }
});
test('authored carousel has bounded finite geometry and physical saddle sockets',()=>{
 let triangles=0;const materials=new Set();
 for(const mesh of meshes){assert.ok(mesh.geometry.attributes.normal);assert.ok(mesh.geometry.attributes.uv);for(const attribute of Object.values(mesh.geometry.attributes))for(const value of attribute.array)assert.ok(Number.isFinite(value));triangles+=(mesh.geometry.index?.count||mesh.geometry.attributes.position.count)/3;materials.add(mesh.material.uuid);}
 assert.ok(meshes.length<=58);assert.ok(triangles<260000);assert.ok(materials.size<=10);assert.equal(model.seats.length,8);
 for(const socket of model.seats){assert.equal(socket.userData.seatSurface,true);assert.equal(socket.userData.forwardAxis,'+Z');assert.equal(socket.position.y,carouselDimensions.saddleHeight);assert.ok(socket.parent.name.startsWith('carved-carousel-horse-'));}
});
test('saddles bob with their horse and provide head clearance throughout the rotation',()=>{
 const up=new T.Vector3(0,1,0),position=new T.Vector3(),ray=new T.Raycaster();
 for(const time of [0,1.2,2.4,4.2,8.7,17]){
  model.update(time);model.root.updateMatrixWorld(true);
  for(const socket of model.seats){
   socket.getWorldPosition(position);assert.ok(Math.abs(Math.hypot(position.x,position.z)-carouselDimensions.orbitRadius)<.11);assert.ok(position.y>2.25&&position.y<2.59);
   for(const offset of [[0,0],[.36,0],[-.36,0],[0,.18],[0,-.18]]){const start=position.clone().add(new T.Vector3(offset[0],.07,offset[1]));ray.set(start,up);ray.near=0;ray.far=2.3;const hits=ray.intersectObjects(meshes,false);assert.equal(hits.length,0,`${socket.name} at ${time}: ${hits[0]?.object.name}`);}
  }
 }
});
test('saddle forward follows the tangent and does not change during bobbing',()=>{
 const position=new T.Vector3(),quaternion=new T.Quaternion(),forward=new T.Vector3();
 for(const time of [0,4,18]){model.update(time);model.root.updateMatrixWorld(true);for(const socket of model.seats){socket.getWorldPosition(position);socket.getWorldQuaternion(quaternion);forward.set(0,0,1).applyQuaternion(quaternion);const tangent=new T.Vector3(-position.z,0,position.x).normalize();assert.ok(forward.dot(tangent)>.999);}}
 const before=model.rotor.rotation.y;model.update(50,true);assert.equal(model.rotor.rotation.y,before);
});

test('the horse and rider face the actual direction of travel',()=>{
 const a=new T.Vector3(),b=new T.Vector3(),q=new T.Quaternion();
 for(const t of [1,6,17,41])for(const socket of model.seats){model.update(t);model.root.updateMatrixWorld(true);socket.getWorldPosition(a);socket.getWorldQuaternion(q);model.update(t+.01);model.root.updateMatrixWorld(true);socket.getWorldPosition(b);const velocity=b.sub(a).setY(0).normalize(),forward=new T.Vector3(0,0,1).applyQuaternion(q).setY(0).normalize();assert.ok(velocity.dot(forward)>.999);}
});

test('carousel camera frames horse and rider through the full turn and only fades individual obstructing columns',async()=>{
 const {carouselCameraView,carouselLayout}=await import('../dist/park-layout.js'),{createCameraClearance}=await import('../dist/camera-clearance.js');const center=carouselLayout,guard=createCameraClearance();
 model.root.position.set(center.x,0,center.z);const seatPosition=new T.Vector3(),forward=new T.Vector3();const architecture=meshes;const columns=meshes.filter(o=>o.userData.rideCameraFade);assert.equal(columns.length,24);
 for(const mobile of [false,true])for(let time=0;time<63;time+=3){model.update(time);model.root.updateMatrixWorld(true);const socket=model.seats[0];socket.getWorldPosition(seatPosition);socket.getWorldDirection(forward);const seat={x:seatPosition.x,y:seatPosition.y+.82,z:seatPosition.z},view=carouselCameraView(seat,mobile),focus=new T.Vector3(seat.x,seat.y+1.2+view.lookHeight,seat.z),camera=new T.PerspectiveCamera(view.fov,mobile?390/844:1440/900,.1,200);
  assert.ok(Math.abs(focus.y-2.85)<1e-9,'saddle bob does not move the horizon');camera.position.set(focus.x+Math.sin(view.yaw)*Math.cos(view.pitch)*view.distance,focus.y+Math.sin(view.pitch)*view.distance,focus.z+Math.cos(view.yaw)*Math.cos(view.pitch)*view.distance);
  guard.update(camera,focus,architecture,1/30,{mode:'carousel',minDistance:4.2});assert.ok(camera.position.distanceTo(focus)>7.5,'columns must not force the camera into the face');camera.lookAt(focus);camera.updateMatrixWorld(true);
  for(const point of [new T.Vector3(seat.x,seat.y+1,seat.z),new T.Vector3(seat.x,.65,seat.z),seatPosition.clone().addScaledVector(forward,1.6)]){point.project(camera);assert.ok(Math.abs(point.x)<.9&&Math.abs(point.y)<.9,'horse and rider stay inside the viewport');}
 }
 guard.reset();assert.ok(columns.every(o=>!o.material.transparent));model.root.position.set(0,0,0);
});


test('carousel clearance tolerates the camera follow lag beside moving lift poles',async()=>{
 const {carouselCameraView,carouselLayout}=await import('../dist/park-layout.js'),{createCameraClearance}=await import('../dist/camera-clearance.js');const guard=createCameraClearance(),seatPoint=new T.Vector3(),previous=new T.Vector3();model.root.position.set(carouselLayout.x,0,carouselLayout.z);
 for(let time=0;time<63;time+=1.5){
  guard.reset(); // Each sample teleports to an independent point in the revolution.
  model.update(time-.32);model.root.updateMatrixWorld(true);model.seats[0].getWorldPosition(previous);
  model.update(time);model.root.updateMatrixWorld(true);model.seats[0].getWorldPosition(seatPoint);
  const seat={x:seatPoint.x,y:seatPoint.y+.82,z:seatPoint.z},view=carouselCameraView(seat),focus=previous.clone().setY(2.85),camera=new T.PerspectiveCamera(view.fov,1.6,.1,200);
  camera.position.copy(focus).add(new T.Vector3(Math.sin(view.yaw+.032)*Math.cos(view.pitch),Math.sin(view.pitch),Math.cos(view.yaw+.032)*Math.cos(view.pitch)).multiplyScalar(view.distance));
  guard.update(camera,seatPoint.clone().add(new T.Vector3(0,1.12,0)),meshes,1/30,{mode:'carousel',minDistance:4.2});assert.ok(camera.position.distanceTo(focus)>7,'the moving support must not collapse the camera into the rider at '+time);
 }guard.reset();model.root.position.set(0,0,0);
});
