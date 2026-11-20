import test from 'node:test';
import assert from 'node:assert/strict';
import {skiNetwork,peakSummit,skiRunCenter,skiRunHeight,mountainGroundHeight,liftPoint,upperLiftPoint,ridgeLiftPoint,gondolaPoint} from '../dist/mountain-layout.js';
test('natural shoulders preserve every existing course length and the long main descent',()=>{
 const lengths={main:2335.8282713140957,easy:483.66059927921316,curve:1421.333063903038,advanced:1498.5332336243473,explore:992.2333444912729};
 for(const course of skiNetwork)assert.ok(Math.abs(course.length-lengths[course.id])<.001,course.id);assert.equal(skiNetwork[0].drop,900);
});
test('summit departure has a level preparation area and no tall snow walls along its first 240 metres',()=>{
 for(let z=peakSummit.z-12;z<=peakSummit.z+4;z+=2)for(let dx=-22;dx<=22;dx+=2)assert.ok(Math.abs(mountainGroundHeight(peakSummit.x+dx,z)-peakSummit.height)<.1);
 for(let z=peakSummit.z;z<peakSummit.z+240;z+=2)for(let dx=-100;dx<=100;dx+=2){const x=skiRunCenter(z)+dx;assert.ok(mountainGroundHeight(x,z)-skiRunHeight(z)<6,'enclosing summit wall');if(Math.abs(dx)<=65)assert.ok(Math.abs(mountainGroundHeight(x+1,z)-mountainGroundHeight(x-1,z))/2<.4,'abrupt groomed shoulder');}
});
test('all four uphill transport routes remain straight and never descend before their terminals',()=>{
 for(const sample of [liftPoint,upperLiftPoint,ridgeLiftPoint,gondolaPoint]){const start=sample(0),end=sample(1),dx=end[0]-start[0],dz=end[2]-start[2];let previous=start;
  for(let i=1;i<=2000;i++){const p=sample(i/2000);assert.ok(p[1]>=previous[1]-1e-8,'terminal overshoot/drop');assert.ok(Math.abs((p[0]-start[0])*dz-(p[2]-start[2])*dx)<1e-6,'lateral bend');previous=p;}
 }
});
