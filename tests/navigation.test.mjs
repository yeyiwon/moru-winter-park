import assert from 'node:assert/strict';
import test from 'node:test';
import {layout,movement,navigation} from './load-world.mjs';
const {findPath,clearSegment}=navigation,{canStandAt,moveOnGround}=movement,home={x:0,z:8};
function checkRoute(start,end){const route=findPath(start,end);assert.ok(route.length,`reachable ${JSON.stringify(end)}`);let previous=start;for(const p of route){assert.ok(clearSegment(previous,p),'no shortcuts through walls or voids');previous=p;}assert.ok(Math.hypot(previous.x-end.x,previous.z-end.z)<.01);return route;}
test('learning entries in seven preserved islands are reachable from home and each other',()=>{for(const r of layout.rooms){checkRoute(home,r.door);for(const other of layout.rooms)checkRoute(r.door,other.door);}});
test('gate and entire north bridge are directly traversable with clearance',()=>{for(let z=9;z>=-44;z-=.1)for(const x of [-.7,0,.7])assert.ok(canStandAt(x,z),`${x},${z}`);assert.equal(checkRoute(home,{x:0,z:-44}).length,1);});
test('A star paths around building sides can actually be walked',()=>{for(const target of [{x:0,z:-20},{x:6.5,z:-16},{x:5.5,z:-59},{x:-46,z:-34},{x:53,z:-34}]){let p={...home};const route=checkRoute(p,target);for(const dest of route){for(let i=0;i<3000;i++){const dx=dest.x-p.x,dz=dest.z-p.z,d=Math.hypot(dx,dz);if(d<.06)break;const speed=Math.min(4.3,d*10);p=moveOnGround(p,{x:dx/d*speed,z:dz/d*speed},1/60);assert.ok(canStandAt(p.x,p.z));}assert.ok(Math.hypot(p.x-dest.x,p.z-dest.z)<.07);}}});
test('void, non-finite clicks and wall shortcuts are rejected',()=>{assert.deepEqual(findPath(home,{x:300,z:0}),[]);assert.deepEqual(findPath(home,{x:NaN,z:0}),[]);assert.equal(canStandAt(24,10),false);assert.equal(clearSegment({x:-4,z:-5},{x:-14,z:-5}),false);});
test('every island arrival and exhibit is reachable, with a route through both conservatory entrances',()=>{
 for(const island of layout.islands)checkRoute(home,island.spawn);
 for(const exhibit of layout.exhibits)checkRoute(home,exhibit);
 for(const side of [-1,1]){checkRoute({x:0,z:47.5},{x:side*3.6,z:53});checkRoute({x:side*3.6,z:53},{x:0,z:58.5});}
 assert.equal(canStandAt(0,53),false,'the pool is not a walkable surface');
 assert.equal(layout.surfaceHeight(3.6,53),.22);
 assert.equal(layout.surfaceHeight(2.6,8),.09);
});
