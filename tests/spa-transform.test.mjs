import test from 'node:test';
import assert from 'node:assert/strict';
import {regions,regionBridges,resolveRegion} from '../dist/region-layout.js';
import {spaToWorld,spaToLocal,spaYaw} from '../dist/spa-transform.js';
import {interiorDoors} from '../dist/district-layout.js';
import {spaActivities,spaPositionValid} from '../dist/resort-layout.js';
import {createStaticColliderIndex,colliderContains} from '../dist/collision-grid.js';
import {surfaceAt,ambientSources} from '../dist/audio-world.js';

test('a rotated district keeps its doorway, safe landing and interaction poses in one frame',()=>{
 const r=resolveRegion({center:{x:10,z:20},yaw:Math.PI/2,arrival:{x:0,z:-5},anchors:{park:{x:2,z:0}},landmarks:{door:{x:0,z:-3}}});
 assert.ok(Math.hypot(r.arrival.x-5,r.arrival.z-20)<1e-9);assert.ok(Math.hypot(r.anchors.park.x-10,r.anchors.park.z-18)<1e-9);
 for(const p of [{x:-10,z:124},{x:12,z:113.6,yaw:0},{x:29,z:106}]){const local=spaToLocal(spaToWorld(p));assert.ok(Math.hypot(local.x-p.x,local.z-p.z)<1e-9);}
 const door=spaToWorld({x:12,z:113.6,yaw:0});assert.equal(interiorDoors.ryokan.x,door.x);assert.equal(interiorDoors.ryokan.z,door.z);assert.equal(interiorDoors.ryokan.yaw,spaYaw);
 for(const pose of Object.values(spaActivities))assert.ok(spaPositionValid(pose.x,pose.y,pose.z,pose.mode));
 const inside=spaToWorld({x:12,z:125});assert.equal(surfaceAt(inside.x,inside.z),'indoor');
 const bridge=regionBridges.find(b=>b.id==='park-spa'),forward=spaToWorld({x:0,z:118}),center=regions.spa.center;
 assert.ok(Math.abs((forward.x-center.x)*(bridge.start.z-center.z)-(forward.z-center.z)*(bridge.start.x-center.x))<1e-8,'front axis faces the clear park approach');
});

test('rotated wall doors and broad-phase bounds preserve clearance at oblique angles',()=>{
 const wall={x:100,z:30,w:10,d:.2,yaw:Math.PI/4,door:{offset:0,w:2.2}},index=createStaticColliderIndex([wall],{size:2,padding:.35});
 assert.equal(colliderContains(wall,100,30,.35),false,'door remains open');
 const p={x:100+8/Math.sqrt(2),z:30-8/Math.sqrt(2)};
 assert.ok(index.query(p.x,p.z).includes(wall));assert.ok(colliderContains(wall,p.x,p.z,.35));
 assert.equal(colliderContains(wall,p.x+2,p.z+2,.35),false,'axis-aligned bounding box is not the physical wall');
});
