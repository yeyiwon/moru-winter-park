import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {movement} from './load-world.mjs';
const {moveVector,moveOnGround,canStandAt}=movement;
function walk(start,velocity,steps,dt){let p={...start};for(let i=0;i<steps;i++)p=moveOnGround(p,velocity,dt);return p}
test('diagonal input stays normalized and follows camera heading',()=>{
  assert.ok(Math.abs(Math.hypot(...Object.values(moveVector(1,1,.4)))-1)<1e-9);
  const v=moveVector(0,-1,Math.PI/2);assert.ok(Math.abs(v.x+1)<1e-9&&Math.abs(v.z)<1e-9);
});
test('movement speed stays equal at 30 and 60 frames per second',()=>{
  const a=walk({x:2.6,z:8},{x:0,z:-4.8},30,1/30),b=walk({x:2.6,z:8},{x:0,z:-4.8},60,1/60);
  assert.ok(Math.abs(a.z-3.2)<1e-9&&Math.abs(a.z-b.z)<1e-9);
});
test('the island edge, lake, castle and carousel block entry',()=>{
  for(const [x,z] of [[20,0],[-10,-3],[7.1,-3.2],[3.4,-16]])assert.equal(canStandAt(x,z),false);
  for(const [start,velocity] of [[{x:14,z:10},{x:5,z:5}],[{x:2.5,z:-3.2},{x:5,z:0}],[{x:0,z:0},{x:-5,z:0}]]){
    const p=walk(start,velocity,300,.016);assert.equal(canStandAt(p.x,p.z),true);
    assert.ok(Math.hypot(p.x-start.x,p.z-start.z)<3);
  }
});
test('large time gaps cannot teleport the character through obstacles',()=>{
  const p=moveOnGround({x:2.6,z:8},{x:0,z:-4.8},10);assert.ok(8-p.z<.4);
});
