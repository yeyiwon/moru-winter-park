import assert from 'node:assert/strict';
import test from 'node:test';
import {layout,movement,navigation} from './load-world.mjs';
const {findPath,clearSegment}=navigation,{canStandAt,moveOnGround}=movement,home={x:0,z:8};
function checkRoute(start,end){const route=findPath(start,end);assert.ok(route.length,`reachable ${JSON.stringify(end)}`);let previous=start;for(const p of route){assert.ok(clearSegment(previous,p),'no shortcuts through walls or voids');previous=p;}assert.ok(Math.hypot(previous.x-end.x,previous.z-end.z)<.01);return route;}
test('active activity entrances remain reachable from home and each other',()=>{for(const r of layout.rooms.filter(r=>canStandAt(r.door.x,r.door.z))){checkRoute(home,r.door);for(const other of layout.rooms.filter(r=>canStandAt(r.door.x,r.door.z)))checkRoute(r.door,other.door);}});
test('gate and entire north bridge are directly traversable with clearance',()=>{for(let z=8;z>=-44;z-=.1)for(const x of [-.7,0,.7])assert.ok(canStandAt(x,z),`${x},${z}`);assert.equal(checkRoute(home,{x:0,z:-44}).length,1);});
test('A star paths around building sides can actually be walked',()=>{for(const target of [{x:0,z:-20},{x:6.5,z:-16},{x:13,z:-5},{x:8,z:6}]){let p={...home};const route=checkRoute(p,target);for(const dest of route){for(let i=0;i<3000;i++){const dx=dest.x-p.x,dz=dest.z-p.z,d=Math.hypot(dx,dz);if(d<.06)break;const speed=Math.min(4.3,d*10);p=moveOnGround(p,{x:dx/d*speed,z:dz/d*speed},1/60);assert.ok(canStandAt(p.x,p.z));}assert.ok(Math.hypot(p.x-dest.x,p.z-dest.z)<.07);}}});
test('void, non-finite clicks and wall shortcuts are rejected',()=>{assert.deepEqual(findPath(home,{x:300,z:0}),[]);assert.deepEqual(findPath(home,{x:NaN,z:0}),[]);assert.equal(canStandAt(35,12),true);assert.equal(clearSegment({x:9,z:4},{x:23,z:4}),false);});
test('every island arrival and exhibit is reachable, with a route through both conservatory entrances',()=>{
 for(const island of layout.islands.filter(i=>!i.hidden))checkRoute(home,island.spawn);
 for(const exhibit of layout.exhibits.filter(e=>!layout.islands.find(i=>i.id===e.island).hidden&&canStandAt(e.x,e.z)))checkRoute(home,exhibit);
 checkRoute(home,{x:0,z:40.8});checkRoute(home,{x:12,z:113.6});
 assert.equal(canStandAt(0,53),false);
 assert.equal(layout.surfaceHeight(2.6,8),.09);
});

test('removed memory landmark leaves continuous snowfield without a redundant bridge',()=>{assert.equal(layout.terrainAt(-46,-27),true);assert.equal(layout.bridges.some(pair=>pair.some(i=>i.id==='history')),false);checkRoute(home,{x:44,z:24});});

test('observatory removal leaves a direct unobstructed park to alpine bridge',()=>{assert.equal(layout.islands.find(i=>i.id==='science').hidden,true);for(let z=-32;z>=-118;z-=.5)assert.ok(canStandAt(0,z));checkRoute(home,{x:0,z:-118});});


test('precomputed visual promenades stay traversable through the current collision model',async()=>{
 const {pathRoutes}=await import('../dist/path-routes.js');
 const {clearSegment}=await import('../dist/navigation.js');
 for(const route of pathRoutes)for(let i=1;i<route.points.length;i++){const [ax,az]=route.points[i-1],[bx,bz]=route.points[i];assert.ok(clearSegment({x:ax,z:az},{x:bx,z:bz}),`${ax},${az} → ${bx},${bz}`);}
});
