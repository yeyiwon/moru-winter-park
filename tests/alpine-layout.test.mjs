import test from 'node:test';
import assert from 'node:assert/strict';
import {skiRuns,skiStarts,skiRunCenter,skiRunHalfWidth,skiRunAt,alpineHeight,resortRides,resortRidePosition,liftPoint,upperLiftPoint,upperLiftLayout,peakSummit,beginnerAccess} from '../dist/resort-layout.js';
import {canStandAt} from '../dist/movement.js';

test('course mouths occupy a middle terrace, main summit and higher expert peak',()=>{
 assert.deepEqual(skiRuns.map(run=>run.id),['main','easy','curve','advanced','expert']);
 assert.ok(new Set(skiStarts.map(start=>start.z)).size>=4);
 for(const start of skiStarts){
  assert.equal(skiRunCenter(start.z,start.id),start.x);
  assert.equal(skiRunAt(start.x,start.z).id,start.id);
  assert.ok(canStandAt(start.x,start.z));
 }
 const height=id=>{const s=skiStarts.find(s=>s.id===id);return alpineHeight(s.x,s.z);};
 assert.ok(height('easy')<height('main')-10);
 assert.ok(height('advanced')>height('main')+25);
 assert.equal(height('expert'),peakSummit.height);
 assert.ok(Math.abs(skiRunCenter(-196,'easy')-skiRunCenter(-196,'main'))<1e-9);
 assert.equal(skiRunCenter(-260,'advanced'),skiRunCenter(-260,'curve'));
 assert.equal(skiRunCenter(-288,'expert'),skiRunCenter(-288,'advanced'));
});

test('all courses descend continuously across their usable width and remain on the island',()=>{
 for(const run of skiRuns)for(let z=run.startZ;z<run.finish;z+=.25){
  const x=skiRunCenter(z,run.id),width=skiRunHalfWidth(z,run.id),y=alpineHeight(x,z),next=alpineHeight(skiRunCenter(z+.25,run.id),z+.25);
  assert.ok(next<=y+.001,`${run.id} climbs at ${z}`);
  for(const side of [-1,1]){
   const edge=x+side*(width-.5);
   assert.ok(Math.hypot(edge,z+260)<142,`${run.id} leaves the island`);
   assert.ok(Math.abs(alpineHeight(edge,z)-y)<.15,`${run.id} has a ridge inside its width at ${z}`);
  }
 }
});

test('the beginner terrace has a continuous wide snow connection from the main summit',()=>{
 let previous=alpineHeight(beginnerAccess.start.x,beginnerAccess.start.z);
 for(let z=beginnerAccess.start.z;z<=beginnerAccess.end.z;z+=.25){
  const y=alpineHeight(24,z);assert.ok(y<=previous+.001);assert.ok(previous-y<.18);
  for(const x of [20,24,28]){assert.ok(canStandAt(x,z));assert.ok(Math.abs(alpineHeight(x,z)-y)<.08);}
  previous=y;
 }
});

test('the summit transfer lift rises continuously and validates actual seats on both routes',()=>{
 const n=Math.hypot(upperLiftLayout.dx,upperLiftLayout.dz),nx=-upperLiftLayout.dz/n,nz=upperLiftLayout.dx/n;
 let previous=upperLiftPoint(0)[1];
 for(let i=0;i<=500;i++){
  const p=upperLiftPoint(i/500);assert.ok(p[1]>=previous);previous=p[1];
  for(const offset of [0,4])assert.ok(p[1]-alpineHeight(p[0]+offset*nx,p[2]+offset*nz)>.5999);
  assert.equal(resortRidePosition(p[0],p[1]+.82,p[2],'lift'),true);
  assert.equal(resortRidePosition(p[0],p[1]+2,p[2],'lift'),false);
 }
 assert.ok(canStandAt(...[resortRides.upperlift.exit[0],resortRides.upperlift.exit[2]]));
});

test('ski traffic stays separate from the base lift and sled valley',()=>{
 for(let i=0;i<=1000;i++){const p=liftPoint(i/1000);if(p[2]>-326&&p[2]<-180)for(const run of skiRuns.filter(r=>p[2]>=r.startZ&&p[2]<=r.finish))assert.ok(skiRunCenter(p[2],run.id)-skiRunHalfWidth(p[2],run.id)-(p[0]+4)>6);}
 for(const p of resortRides.sled.points){
  assert.ok(Math.hypot(p[0]+4,p[2]+260)<144);
  assert.ok(resortRidePosition(p[0],p[1]+1.03,p[2],'sled'));
  for(const run of skiRuns)assert.ok(Math.abs(p[0]-skiRunCenter(p[2],run.id))-skiRunHalfWidth(p[2],run.id)>12);
 }
 const end=resortRides.sled.points.at(-1);assert.ok(canStandAt(end[0],end[2]));
});
