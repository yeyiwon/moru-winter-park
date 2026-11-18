import test from 'node:test';
import assert from 'node:assert/strict';
import {parkWalkways,parkStalls,stallEntrance} from '../dist/park-layout.js';
import {ferrisDimensions,ferrisGroundPoint} from '../dist/ferris-layout.js';
import {regions,regionBridges} from '../dist/region-layout.js';
import {museumLayout,museumPoint} from '../dist/district-layout.js';
import {findPath,clearSegment} from '../dist/navigation.js';
import {canStandAt,moveOnGround} from '../dist/movement.js';
import {encodeActivity,decodeActivity,activityGestures} from '../dist/activity-state.js';
import {createPopcornGeometry} from '../dist/held-popcorn.js';

test('park promenades reserve at least three metres of unobstructed walking width',()=>{
 for(const route of parkWalkways)for(let i=1;i<route.points.length;i++){
  const a=route.points[i-1],b=route.points[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),count=Math.ceil(length/.2);
  for(let j=0;j<=count;j++)for(const offset of [-1.5,0,1.5]){const x=a[0]+dx*j/count-dz/length*offset,z=a[1]+dz*j/count+dx/length*offset;assert.ok(canStandAt(x,z),`path blocked at ${x},${z}`);}
 }
 for(const booth of parkStalls){const entrance=stallEntrance(booth.kind);assert.ok(canStandAt(entrance.x,entrance.z));assert.ok(clearSegment(entrance,{x:booth.x,z:25}));}
});
test('wheel front and museum gate can be reached without passing behind the wheel',()=>{
 const front=ferrisDimensions.entrance;assert.deepEqual(front,ferrisGroundPoint(0,9.5));
 for(const start of [regions.park.arrival,{x:0,z:-7},{x:16,z:12.2}]){
  const route=findPath(start,front);assert.ok(route.length);assert.ok(route.every(p=>p.z>=Math.min(start.z,front.z)-1));
  let previous=start,distance=0;for(const p of route){assert.ok(clearSegment(previous,p));distance+=Math.hypot(p.x-previous.x,p.z-previous.z);previous=p;}assert.ok(distance<Math.hypot(front.x-start.x,front.z-start.z)*1.35);
 }
 const bridge=regionBridges.find(b=>b.id==='park-museum');assert.ok(bridge.start.z>20);assert.deepEqual(museumLayout.door,museumPoint(0,17.4));assert.ok(clearSegment(bridge.end,museumLayout.door));
 assert.ok(Math.hypot(regions.museum.center.x,regions.museum.center.z)<100);assert.ok(regions.museum.size.rx>30&&regions.museum.size.rz>30);
});
test('real movement reaches the new door, booths and both front ride entrances',()=>{
 for(const goal of [museumLayout.door,ferrisDimensions.entrance,{x:16,z:12.2},...parkStalls.map(s=>stallEntrance(s.kind))]){
  let p={...regions.park.arrival};const route=findPath(p,goal);assert.ok(route.length);
  for(const target of route){let steps=0;while(Math.hypot(target.x-p.x,target.z-p.z)>.025&&steps++<10000){const dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz),speed=Math.min(8,d*30);p=moveOnGround(p,{x:dx/d*speed,z:dz/d*speed},1/60);}assert.ok(steps<10000);}
  assert.ok(Math.hypot(p.x-goal.x,p.z-goal.z)<.03);
 }
});
test('popcorn uses the existing synchronized activity contract and a bounded two-material asset',()=>{
 for(const gesture of ['', 'eat']){const encoded=encodeActivity({heldItem:'popcorn',gesture});assert.ok(activityGestures.includes(encoded));assert.deepEqual(decodeActivity(encoded),{heldItem:'popcorn',gesture});}
 const g=createPopcornGeometry();assert.equal(g.groups.length,2);assert.ok(g.attributes.position.count<10000);assert.ok([...g.attributes.position.array].every(Number.isFinite));assert.ok(g.boundingSphere.radius<.4);g.dispose();
 assert.equal(encodeActivity({heldItem:'bubble-wand'}),'bubble-carry');assert.deepEqual(decodeActivity('bubble-carry'),{heldItem:'bubble-wand',gesture:''});assert.equal(encodeActivity({heldItem:'bubble-wand',gesture:'bubble'}),'bubble');assert.ok(activityGestures.includes('bubble-carry'));
});
