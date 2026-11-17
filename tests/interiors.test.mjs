import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {interiorRooms,interiorInteractions,interiorActivityPoses,interiorActivityPoseValid,interiorAt,interiorCanStandAt,interiorCanMoveFrom,interiorSurfaceHeight,interiorPositionValid} from '../dist/interior-layout.js';
import {buildInteriors} from '../dist/interior-world.js';

test('interior arrivals, exits and usable activities occupy clear space',()=>{
 for(const room of Object.values(interiorRooms)){assert.equal(interiorAt(room.entry.x,room.entry.z).id,room.id);assert.ok(interiorCanStandAt(room.entry.x,room.entry.z));assert.ok(interiorCanStandAt(room.exit.x,room.exit.z));assert.equal(interiorCanStandAt(room.x+room.rx,room.z),false);}
 for(const target of interiorInteractions)assert.ok(interiorCanStandAt(target.x,target.z),target.id);
 assert.equal(interiorCanStandAt(413,10),false,'reception has collision');assert.equal(interiorAt(496,-3),null,'removed interior is not enterable');
 assert.equal(interiorPositionValid(400,.95,14.5),true);assert.equal(interiorPositionValid(400,30,14.5),false);assert.equal(interiorPositionValid(0,.95,0),false);
});

test('every indoor activity can be reached on foot from the entrance',()=>{
 for(const room of Object.values(interiorRooms)){
  const step=.5,start=[Math.round(room.entry.x/step),Math.round(room.entry.z/step)],queue=[start],seen=new Set([start.join()]);let at=0;
  while(at<queue.length){const [gx,gz]=queue[at++],from={x:gx*step,z:gz*step};for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const next=[gx+dx,gz+dz],key=next.join(),to={x:next[0]*step,z:next[1]*step};if(seen.has(key)||!interiorCanMoveFrom(from,to))continue;seen.add(key);queue.push(next);}}
  for(const target of interiorInteractions.filter(p=>p.room===room.id))assert.ok(queue.some(([x,z])=>Math.hypot(x*step-target.x,z*step-target.z)<1),target.id);
 }
});

test('interior assets use bounded finite geometry, real floor heights and opaque room boundaries',()=>{
 const scene=new T.Scene(),asset=buildInteriors(scene,{lazy:true});asset.ensure('ryokan');let count=0,triangles=0;scene.updateMatrixWorld(true);
 scene.traverse(o=>{if(o.isMesh){count++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;for(const a of Object.values(o.geometry.attributes))for(const v of a.array)assert.ok(Number.isFinite(v));}});
 assert.ok(count<100);assert.ok(triangles<180000);assert.equal(asset.root.visible,false);asset.setActive('ryokan');assert.equal(asset.rooms.ryokan.root.visible,true);assert.equal(asset.rooms.conservatory,undefined);
 const room=asset.rooms.ryokan;asset.setCamera({x:400,y:10,z:20});assert.equal(room.ceiling.visible,true);assert.ok(room.walls.every(w=>w.visible));assert.ok(room.walls.every(w=>w.children.some(c=>c.isMesh)),'merged wall meshes retain their cutaway groups');
 asset.setActive('museum');assert.equal(asset.active,'museum');assert.equal(asset.rooms.ryokan.root.visible,false);assert.equal(asset.rooms.museum.root.visible,true);assert.equal(asset.ensure('conservatory'),null);
});

test('activity poses align with their real furniture surface and remain valid for presence',()=>{
 const scene=new T.Scene(),asset=buildInteriors(scene);scene.updateMatrixWorld(true);
 for(const [id,pose]of Object.entries(interiorActivityPoses)){
  if(pose.standing){assert.ok(interiorPositionValid(pose.x,pose.y,pose.z),id);continue;}assert.ok(Math.abs(pose.y-pose.seatY-.82)<1e-9,id);
  const ray=new T.Raycaster(new T.Vector3(pose.x,pose.seatY+.08,pose.z),new T.Vector3(0,-1,0),0,.12);
  const hits=ray.intersectObject(asset.rooms[pose.room].root,true);
  assert.ok(hits.some(h=>Math.abs(h.point.y-pose.seatY)<.006),id+' has a real cushion/seat under the avatar');
  assert.ok(interiorPositionValid(pose.x,pose.y,pose.z),id);
  assert.equal(interiorActivityPoseValid(pose.x+1,pose.y,pose.z),false,id+' does not exempt the whole furniture collider');
 }
});
