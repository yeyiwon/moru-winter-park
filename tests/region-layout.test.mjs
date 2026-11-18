import test from 'node:test';
import assert from 'node:assert/strict';
import {regions,regionBridges,resolveRegion} from '../dist/region-layout.js';
import {landforms,landDistance,surfaceHeight} from '../dist/world-layout.js';
import {interiorRooms,interiorPositionValid} from '../dist/interior-layout.js';
import {findPath,clearSegment} from '../dist/navigation.js';
import {moveOnGround,canStandAt} from '../dist/movement.js';
import {mapFacilities} from '../dist/world-map.js';
import {museumLayout} from '../dist/district-layout.js';

test('final five islands preserve relative placement and never overlap',()=>{
 assert.deepEqual(Object.keys(regions),['park','ski','spa','tree','museum']);
 assert.equal(interiorRooms.conservatory,undefined);assert.equal(interiorPositionValid(800,.95,0),false);
 assert.equal(mapFacilities.length,8);assert.ok(!mapFacilities.some(p=>['conservatory','castle'].includes(p.id)));
 assert.ok(regions.ski.center.z<regions.spa.center.z&&regions.spa.center.z<regions.tree.center.z);
 assert.ok(regions.tree.center.z>regions.park.center.z);assert.ok(regions.museum.center.x<regions.park.center.x-regions.park.size.rx);
 for(let x=-180;x<150;x+=2)for(let z=-360;z<120;z+=2)assert.ok(landforms.filter(f=>landDistance(x,z,f)<0).length<=1,`overlapping land at ${x},${z}`);
});
test('bridge landings support the full walking width and crossings retain a continuous ground profile',()=>{
 for(const bridge of regionBridges){const a=bridge.start,b=bridge.end,dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
  for(const end of [a,b])for(const side of [-2.8,0,2.8]){const p={x:end.x+dz/length*side,z:end.z-dx/length*side};assert.ok(landforms.some(f=>landDistance(p.x,p.z,f)<-.1),`${bridge.id} unsupported landing ${JSON.stringify(p)}`);}
  for(const side of [-2.7,0,2.7]){let previous;for(let i=0;i<=100;i++){const p={x:a.x+dx*i/100+dz/length*side,z:a.z+dz*i/100-dx/length*side};assert.ok(canStandAt(p.x,p.z),`${bridge.id} blocked ${JSON.stringify(p)}`);const y=surfaceHeight(p.x,p.z);if(previous!==undefined)assert.ok(Math.abs(y-previous)<.08);previous=y;}}
 }
});
test('all requested routes walk through real collision with no teleport shortcuts',()=>{
 for(const [from,to]of [['park','ski'],['ski','spa'],['park','tree'],['park','museum']]){
  let current={...regions[from].arrival};const goal=regions[to].arrival,route=findPath(current,goal);assert.ok(route.length,`${from}-${to}`);
  let exact={...current};for(const target of route){assert.ok(clearSegment(exact,target));exact=target;for(let i=0;i<10000;i++){const dx=target.x-current.x,dz=target.z-current.z,d=Math.hypot(dx,dz);if(d<.03)break;current=moveOnGround(current,{x:dx/d*Math.min(8,d*20),z:dz/d*Math.min(8,d*20)},1/60);}assert.ok(Math.hypot(current.x-target.x,current.z-target.z)<.04,`${from}-${to} stuck`);}
  assert.ok(Math.hypot(current.x-goal.x,current.z-goal.z)<.04);
 }
});
test('changing a region origin moves its bridge anchors, landmarks and safe arrival together',()=>{
 const definition={id:'test',center:{x:20,z:40},arrival:{x:2,z:3},anchors:{park:{x:-4,z:1}},landmarks:{door:{x:3,z:0}}},a=resolveRegion(definition),b=resolveRegion({...definition,center:{x:35,z:12}});
 for(const [p,q]of [[a.arrival,b.arrival],[a.anchors.park,b.anchors.park],[a.landmarks.door,b.landmarks.door]])assert.deepEqual({x:q.x-p.x,z:q.z-p.z},{x:15,z:-28});
 for(const marker of mapFacilities.filter(p=>!p.travelId))assert.deepEqual({x:marker.x,z:marker.z},regions[marker.region].arrival);
});

test('bridge aprons keep the full walking width clear before paths turn',()=>{
 for(const bridge of regionBridges){
  const dx=bridge.end.x-bridge.start.x,dz=bridge.end.z-bridge.start.z,length=Math.hypot(dx,dz);
  for(const [a,b]of [[bridge.approachStart,bridge.start],[bridge.end,bridge.approachEnd]])for(let i=0;i<=24;i++)for(const side of [-2.7,0,2.7]){
   const x=a.x+(b.x-a.x)*i/24+dz/length*side,z=a.z+(b.z-a.z)*i/24-dx/length*side;
   assert.ok(canStandAt(x,z),`${bridge.id} obstructed approach ${x},${z}`);
  }
 }
 const museum=regionBridges.find(b=>b.id==='park-museum');
 const dx=museum.start.x-museum.end.x,dz=museum.start.z-museum.end.z;
 assert.ok(Math.abs(dx*Math.cos(museumLayout.yaw)-dz*Math.sin(museumLayout.yaw))<1e-8,'bridge and entrance share the same axis');
 assert.ok(museum.start.z>regions.park.center.z&&regions.museum.center.z>regions.park.center.z,'museum connects from the front promenade');
 assert.ok(Math.hypot(dx,dz)<27);assert.equal(regions.tree.center.x,regions.park.center.x);assert.equal(regions.rink,undefined);assert.ok(!regionBridges.some(b=>b.id.includes('rink')));
});
