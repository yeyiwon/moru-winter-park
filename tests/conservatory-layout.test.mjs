import test from 'node:test';
import assert from 'node:assert/strict';
import {conservatoryLayout as c,conservatoryWalkPoint,conservatoryWalkAt,conservatoryCanStandAt,conservatoryCanMoveFrom,conservatorySurfaceAt} from '../dist/conservatory-layout.js';

test('the canopy promenade rises continuously and agrees with its visible floor',()=>{
 let previous=conservatoryWalkPoint(0);
 for(let i=1;i<=800;i++){
  const p=conservatoryWalkPoint(i/800),floor=conservatorySurfaceAt(p.x,p.z);
  assert.ok(Math.abs(p.y-floor)<1e-8);
  assert.ok(conservatoryCanStandAt(p.x,p.z));
  assert.ok(conservatoryCanMoveFrom(previous,p));
  assert.ok((p.y-previous.y)/Math.hypot(p.x-previous.x,p.z-previous.z)<.16);
  previous=p;
 }
 assert.equal(previous.y,5.2);
});

test('glass doors stay open while the plant basin, walls and raised ramp edges block walking',()=>{
 for(const side of [-1,1])for(const x of [-1.5,0,1.5])assert.ok(conservatoryCanStandAt(x,c.z+side*c.radius));
 assert.equal(conservatoryCanStandAt(c.radius,c.z),false);
 assert.equal(conservatoryCanStandAt(-3.2,53.8),false);
 assert.equal(conservatoryCanMoveFrom({x:8.9,z:53},{x:8.7,z:53}),false);
 assert.equal(conservatoryCanMoveFrom({x:0,z:43.9},{x:0,z:44.3}),true);
 assert.equal(conservatoryWalkAt(0,53),null);
 assert.equal(conservatorySurfaceAt(40,53),null);
});
