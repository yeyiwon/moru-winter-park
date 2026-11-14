import assert from 'node:assert/strict';
import test from 'node:test';
import {layout,movement,navigation} from './load-world.mjs';
const {findPath,clearSegment}=navigation,{canStandAt,moveOnGround}=movement;
const home={x:2.6,z:8};
function checkRoute(start,end){const route=findPath(start,end);assert.ok(route.length,'reachable destination');let previous=start;for(const p of route){assert.ok(clearSegment(previous,p),'no shortcut through structures or gaps');previous=p;}assert.ok(Math.hypot(previous.x-end.x,previous.z-end.z)<.01);return route;}
test('all seven islands can be reached on foot from the park',()=>{for(const island of layout.islands)checkRoute(home,island.spawn);});
test('all ten knowledge markers are reachable, including beyond buildings',()=>{for(const [x,z] of [[2.6,5.1],[-5,-46],[6,-56],[40,-24],[52,-22],[44,24],[-6,49],[-42,32],[-40,-24],[-52,-23]])checkRoute(home,{x,z});});
test('the route around the carousel can be followed without sticking',()=>{let pos={x:2.6,z:8};const target={x:11,z:-7},route=findPath(pos,target);for(const point of route){for(let step=0;step<3000;step++){const dx=point.x-pos.x,dz=point.z-pos.z,d=Math.hypot(dx,dz);if(d<.08)break;const speed=Math.min(6.2,d*10);pos=moveOnGround(pos,{x:dx/d*speed,z:dz/d*speed},1/60);assert.ok(canStandAt(pos.x,pos.z));}assert.ok(Math.hypot(pos.x-point.x,pos.z-point.z)<.09);}assert.ok(Math.hypot(pos.x-target.x,pos.z-target.z)<.09);});
test('void clicks are rejected and the lake cannot be crossed',()=>{assert.deepEqual(findPath(home,{x:300,z:0}),[]);assert.deepEqual(findPath(home,{x:NaN,z:0}),[]);assert.equal(canStandAt(30,0),false);assert.equal(clearSegment({x:-2,z:0},{x:-18,z:0}),false);});

test('castle gate stays open all the way onto the north bridge',()=>{
  for(let z=-9;z>=-31;z-=.1)for(const x of [-.65,0,.65])assert.ok(canStandAt(x,z),`gate/bridge corridor blocked at ${x}, ${z}`);
  assert.ok(clearSegment({x:0,z:-9},{x:0,z:-31}));
  assert.equal(canStandAt(-3.4,-16),false);assert.equal(canStandAt(3.4,-16),false);
  const route=checkRoute({x:0,z:-9},{x:0,z:-31});assert.equal(route.length,1,'direct passage, without a detour via other islands');
});
