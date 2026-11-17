import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildFerrisWheel,ferrisDimensions as d} from '../dist/ferris-model.js';

const model=buildFerrisWheel(),meshes=[];
model.root.traverse(object=>{if(object.isMesh)meshes.push(object);});
test('Ferris geometry is finite, shared, and partitioned for cabin camera fading',()=>{
 let triangles=0;const geometry=new Set(),materials=new Set(),names=new Set();
 for(const mesh of meshes){
  assert.ok(mesh.name);assert.ok(!names.has(mesh.name),`duplicate mesh name: ${mesh.name}`);names.add(mesh.name);geometry.add(mesh.geometry);materials.add(mesh.material);
  for(const attribute of Object.values(mesh.geometry.attributes))for(const value of attribute.array)assert.ok(Number.isFinite(value));
  triangles+=(mesh.geometry.index?.count||mesh.geometry.attributes.position.count)/3;
 }
 assert.ok(meshes.length<=70);assert.ok(triangles<240000);assert.ok(geometry.size<=15);assert.equal(materials.size,3);
 for(let cabin=0;cabin<d.cabinCount;cabin++){
  assert.deepEqual(Object.keys(model.cabinParts[cabin]).sort(),['floor','frame','roof']);
  const floor=model.cabinParts[cabin].floor;assert.equal(floor.userData.ferrisCameraFade,false);assert.equal(floor.children.length,2);
  for(const part of ['frame','roof']){
   const group=model.cabinParts[cabin][part];assert.ok(group?.isGroup);assert.equal(group.userData.ferrisCabin,cabin);assert.equal(group.userData.ferrisCameraFade,true);
   group.traverse(object=>{if(object.isMesh){assert.equal(object.userData.ferrisPart,part);assert.equal(object.userData.ferrisCabin,cabin);}});
  }
 }
});
test('each cabin keeps two facing full-size passenger anchors upright over a full turn',()=>{
 for(const time of [0,15,30,60,90,120,180,225,240]){
  model.update(time);model.root.updateMatrixWorld(true);
  for(let i=0;i<d.cabinCount;i++){
   const a=model.seat(i,0),b=model.seat(i,1),up=new T.Vector3(0,1,0).applyQuaternion(model.cabins[i].getWorldQuaternion(new T.Quaternion()));
   assert.ok(Math.abs(Math.hypot(a.x-b.x,a.z-b.z)-d.seatSpacing*d.scale)<1e-8);
   assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>3);const toward=new T.Vector3(b.x-a.x,0,b.z-a.z).normalize(),forwardA=new T.Vector3(Math.sin(a.yaw),0,Math.cos(a.yaw)),forwardB=new T.Vector3(Math.sin(b.yaw),0,Math.cos(b.yaw));assert.ok(forwardA.dot(toward)>.999999);assert.ok(forwardB.dot(toward)<-.999999);assert.ok(Math.abs(a.y-b.y)<1e-8);assert.ok(Math.abs(a.yaw-d.yaw)<1e-8);assert.ok(up.distanceTo(new T.Vector3(0,1,0))<1e-8);
   const floor=model.seatSockets[i][0].getWorldPosition(new T.Vector3());assert.ok(Math.abs(a.y-floor.y-d.avatarOriginOffset)<1e-8);assert.ok(floor.y>.3);
  }
 }
});
test('passengers have at least three metres of clear vertical space in each cabin',()=>{
 const ray=new T.Raycaster(),up=new T.Vector3(0,1,0);
 model.update(0);model.root.updateMatrixWorld(true);
 assert.ok((d.ceilingHeight-d.floorHeight)*d.scale>3.0);
 for(let cabin=0;cabin<d.cabinCount;cabin++)for(let seat=0;seat<2;seat++){
  const floor=model.seatSockets[cabin][seat].getWorldPosition(new T.Vector3()),cabinMeshes=[];model.cabins[cabin].traverse(o=>{if(o.isMesh)cabinMeshes.push(o);});
  for(const [x,z] of [[0,0],[-.42,0],[.42,0],[0,-.40],[0,.40]]){
   ray.set(floor.clone().add(new T.Vector3(x,.22,z)),up);ray.near=0;ray.far=2.78;
   const hits=ray.intersectObjects(cabinMeshes,false);assert.equal(hits.length,0,`${cabin}/${seat}: ${hits[0]?.object.name}`);
  }
 }
});
test('neighboring full-size cabins cannot intersect anywhere around the wheel',()=>{
 const points=[];
 model.cabins[0].traverse(object=>{if(object.isMesh){const p=object.geometry.attributes.position;for(let i=0;i<p.count;i++)points.push([p.getX(i),p.getY(i)]);}});
 points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),hull=[];
 for(const p of points){while(hull.length>1&&cross(hull.at(-2),hull.at(-1),p)<=0)hull.pop();hull.push(p);}
 const lower=hull.length;
 for(let i=points.length-2;i>=0;i--){const p=points[i];while(hull.length>lower&&cross(hull.at(-2),hull.at(-1),p)<=0)hull.pop();hull.push(p);}
 let diameter=0;for(const a of hull)for(const b of hull)diameter=Math.max(diameter,Math.hypot(a[0]-b[0],a[1]-b[1]));
 // A separation greater than the projection diameter rules out intersection for every angle.
 const closestPivots=2*d.radius*Math.sin(Math.PI/d.cabinCount);
 assert.ok((closestPivots-diameter)*d.scale>.50);
});
test('rotation depends only on the world clock and still mode preserves the last pose',()=>{
 model.update(32);const initial=model.seat(3,1);model.update(32+d.rotationPeriod*10);const repeated=model.seat(3,1);
 for(const key of ['x','y','z','yaw'])assert.ok(Math.abs(initial[key]-repeated[key])<1e-8);
 model.update(90,true);assert.deepEqual(model.seat(3,1),repeated);model.update(Number.NaN);assert.deepEqual(model.seat(3,1),repeated);
 assert.equal(model.seat(-1,0),null);assert.equal(model.seat(d.cabinCount,0),null);assert.equal(model.seat(0,2),null);assert.equal(model.seat(.5,0),null);
});

test('the western placement leaves the castle approach and photo garden independent',()=>{
 const bounds=new T.Box3();for(let time=0;time<240;time+=10){model.update(time);model.root.updateMatrixWorld(true);bounds.union(new T.Box3().setFromObject(model.root,true));}
 assert.ok(bounds.min.x>-60);assert.ok(bounds.max.x<-25);assert.ok(bounds.max.y<34);
 assert.ok(Math.hypot(d.entrance.x-d.center.x,d.entrance.z-d.center.z)>9);
});
