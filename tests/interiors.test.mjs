import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {interiorRooms,interiorInteractions,interiorActivityPoses,interiorActivityPoseValid,interiorAt,interiorCanStandAt,interiorCanMoveFrom,interiorPromenadePoint,interiorSurfaceHeight,interiorPositionValid} from '../dist/interior-layout.js';
import {buildInteriors} from '../dist/interior-world.js';

test('interior arrivals, exits and usable activities occupy clear space',()=>{
 for(const room of Object.values(interiorRooms)){assert.equal(interiorAt(room.entry.x,room.entry.z).id,room.id);assert.ok(interiorCanStandAt(room.entry.x,room.entry.z));assert.ok(interiorCanStandAt(room.exit.x,room.exit.z));assert.equal(interiorCanStandAt(room.x+room.rx,room.z),false);}
 for(const target of interiorInteractions)assert.ok(interiorCanStandAt(target.x,target.z),target.id);
 assert.equal(interiorCanStandAt(413,10),false,'reception has collision');assert.equal(interiorCanStandAt(496,-3),false,'vertical garden has collision');
 assert.equal(interiorPositionValid(400,.95,14.5),true);assert.equal(interiorPositionValid(400,30,14.5),false);assert.equal(interiorPositionValid(0,.95,0),false);
});

test('the upper greenhouse promenade is continuous, walkable and cannot be entered through a raised edge',()=>{
 let old=interiorPromenadePoint(0);assert.ok(interiorCanStandAt(old.x,old.z));
 for(let i=1;i<=1000;i++){const p=interiorPromenadePoint(i/1000);assert.ok(Math.abs(interiorSurfaceHeight(p.x,p.z)-p.y)<1e-7);assert.ok(interiorCanMoveFrom(old,p),String(i));assert.ok((p.y-old.y)/Math.hypot(p.x-old.x,p.z-old.z)<.15);old=p;}
 assert.ok(Math.abs(old.y-6.09)<1e-8);assert.equal(interiorCanMoveFrom({x:500,z:-15},{x:500,z:-14.5}),false);
});

test('every indoor activity can be reached on foot from the entrance',()=>{
 for(const room of Object.values(interiorRooms)){
  const step=.5,start=[Math.round(room.entry.x/step),Math.round(room.entry.z/step)],queue=[start],seen=new Set([start.join()]);let at=0;
  while(at<queue.length){const [gx,gz]=queue[at++],from={x:gx*step,z:gz*step};for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const next=[gx+dx,gz+dz],key=next.join(),to={x:next[0]*step,z:next[1]*step};if(seen.has(key)||!interiorCanMoveFrom(from,to))continue;seen.add(key);queue.push(next);}}
  for(const target of interiorInteractions.filter(p=>p.room===room.id))assert.ok(queue.some(([x,z])=>Math.hypot(x*step-target.x,z*step-target.z)<1),target.id);
 }
});

test('interior assets use bounded finite geometry, real floor heights and camera-cutaway walls',()=>{
 const scene=new T.Scene(),asset=buildInteriors(scene);let count=0,triangles=0;scene.updateMatrixWorld(true);
 scene.traverse(o=>{if(o.isMesh){count++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;for(const a of Object.values(o.geometry.attributes))for(const v of a.array)assert.ok(Number.isFinite(v));}});
 assert.ok(count<100);assert.ok(triangles<180000);assert.equal(asset.root.visible,false);asset.setActive('ryokan');assert.equal(asset.rooms.ryokan.root.visible,true);assert.equal(asset.rooms.conservatory.root.visible,false);
 const room=asset.rooms.ryokan;asset.setCamera({x:400,y:10,z:20});assert.equal(room.ceiling.visible,false);assert.ok(room.walls.some(w=>!w.visible));assert.ok(room.walls.every(w=>w.children.some(c=>c.isMesh)),'merged wall meshes retain their cutaway groups');
 asset.setActive('conservatory');const floor=asset.rooms.conservatory.root.getObjectByName('conservatory-accessible-promenade');assert.ok(floor);floor.updateWorldMatrix(true,false);const point=interiorPromenadePoint(.5);const ray=new T.Raycaster(new T.Vector3(point.x,point.y+1,point.z),new T.Vector3(0,-1,0),0,2);const hit=ray.intersectObject(floor)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-point.y)<.002);asset.setActive(null);assert.equal(asset.root.visible,false);
});

test('activity poses align with their real furniture surface and remain valid for presence',()=>{
 const scene=new T.Scene(),asset=buildInteriors(scene);scene.updateMatrixWorld(true);
 for(const [id,pose]of Object.entries(interiorActivityPoses)){
  assert.ok(Math.abs(pose.y-pose.seatY-.82)<1e-9,id);
  const ray=new T.Raycaster(new T.Vector3(pose.x,pose.seatY+.08,pose.z),new T.Vector3(0,-1,0),0,.12);
  const hits=ray.intersectObject(asset.rooms[pose.room].root,true);
  assert.ok(hits.some(h=>Math.abs(h.point.y-pose.seatY)<.006),id+' has a real cushion/seat under the avatar');
  assert.ok(interiorPositionValid(pose.x,pose.y,pose.z),id);
  assert.equal(interiorActivityPoseValid(pose.x+1,pose.y,pose.z),false,id+' does not exempt the whole furniture collider');
 }
});
