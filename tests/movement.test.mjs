import assert from 'node:assert/strict';import test from 'node:test';import {movement} from './load-world.mjs';
const {moveVector,moveOnGround,canStandAt}=movement;
function walk(start,v,steps,dt){let p={...start};for(let i=0;i<steps;i++)p=moveOnGround(p,v,dt);return p;}
test('diagonal speed is normalized and camera relative',()=>{assert.ok(Math.abs(Math.hypot(...Object.values(moveVector(1,1,.4)))-1)<1e-9);const v=moveVector(0,-1,Math.PI/2);assert.ok(Math.abs(v.x+1)<1e-9&&Math.abs(v.z)<1e-9);});
test('30 and 60 Hz movement cover identical distance',()=>{const a=walk({x:0,z:8},{x:0,z:-4.8},30,1/30),b=walk({x:0,z:8},{x:0,z:-4.8},60,1/60);assert.ok(Math.abs(a.z-3.2)<1e-9&&Math.abs(a.z-b.z)<1e-9);});
test('buildings and edge block feet while the portal stays open',()=>{for(const [x,z]of [[155,12],[16,3.8],[-42,-6],[-8,-14.5]])assert.equal(canStandAt(x,z),false);assert.equal(canStandAt(0,64),true,'removed greenhouse leaves the direct spa bridge open');assert.equal(canStandAt(0,-12.8),true);assert.equal(canStandAt(0,-56),true,'the direct bridge to the ski island is open');const p=walk({x:2,z:8},{x:-4,z:0},300,.016);assert.ok(canStandAt(p.x,p.z));assert.ok(p.x< -10,'the removed pond is now walkable');assert.ok(canStandAt(-6,1));});
test('large frame gaps cannot teleport through barriers',()=>{const p=moveOnGround({x:0,z:8},{x:0,z:-4.8},10);assert.ok(8-p.z<.4);});
