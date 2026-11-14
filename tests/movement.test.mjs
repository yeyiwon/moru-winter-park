import assert from 'node:assert/strict';import test from 'node:test';import {movement} from './load-world.mjs';
const {moveVector,moveOnGround,canStandAt}=movement;
function walk(start,v,steps,dt){let p={...start};for(let i=0;i<steps;i++)p=moveOnGround(p,v,dt);return p;}
test('diagonal speed is normalized and camera relative',()=>{assert.ok(Math.abs(Math.hypot(...Object.values(moveVector(1,1,.4)))-1)<1e-9);const v=moveVector(0,-1,Math.PI/2);assert.ok(Math.abs(v.x+1)<1e-9&&Math.abs(v.z)<1e-9);});
test('30 and 60 Hz movement cover identical distance',()=>{const a=walk({x:0,z:8},{x:0,z:-4.8},30,1/30),b=walk({x:0,z:8},{x:0,z:-4.8},60,1/60);assert.ok(Math.abs(a.z-3.2)<1e-9&&Math.abs(a.z-b.z)<1e-9);});
test('buildings and edge block feet while the portal stays open',()=>{for(const [x,z]of [[20,0],[-9,-5],[9,-5.5],[-8,-29],[10,9],[-10,10],[3.9,-12.8]])assert.equal(canStandAt(x,z),false);assert.equal(canStandAt(0,-12.8),true);const p=walk({x:-4,z:-5},{x:-4,z:0},300,.016);assert.ok(canStandAt(p.x,p.z));assert.ok(p.x> -5.3);});
test('large frame gaps cannot teleport through barriers',()=>{const p=moveOnGround({x:0,z:8},{x:0,z:-4.8},10);assert.ok(8-p.z<.4);});
