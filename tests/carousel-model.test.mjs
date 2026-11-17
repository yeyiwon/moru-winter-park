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
 assert.ok(meshes.length<=50);assert.ok(triangles<260000);assert.ok(materials.size<=9);assert.equal(model.seats.length,8);
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
