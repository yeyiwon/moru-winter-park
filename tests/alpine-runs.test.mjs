import {alpineShift} from '../dist/resort-layout.js';
import {walkToStart,followCourse} from './ski-driver.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {alpineHeight,skiRuns,skiRunCenter,skiRunHalfWidth,summitFacilities,summitPositionValid,resortRides} from '../dist/resort-layout.js';
import {canStandAt} from '../dist/movement.js';


test('preserved food trucks rest on a level base and their service positions remain accessible',()=>{for(const stop of summitFacilities.filter(p=>['odeng','marshmallow'].includes(p.id))){assert.ok(canStandAt(stop.x,stop.z));assert.equal(summitPositionValid(stop.model.x,stop.model.z),false);for(let x=-4.1;x<=4.1;x+=.3)for(let z=-2;z<=2;z+=.3)assert.ok(Math.abs(alpineHeight(stop.model.x+x,stop.model.z+z)-.09)<.02);}assert.ok(!summitFacilities.some(p=>p.id==='restroom'));});

test('every physically entered ski run responds to steering and reaches its own exit',async()=>{
 const {createRideController}=await import('../dist/winter-rides.js');
 for(const run of skiRuns){
  const ride=createRideController(resortRides);ride.start('lift');let p=ride.update(45);walkToStart(ride,run.id);
  assert.equal(ride.start('ski'),true);p=ride.update(0);assert.equal(p.speed,0);
  for(let i=0;i<2400;i++){
   p=ride.update(.05,followCourse(p,run.id));if(p.finished)break;
  }
  assert.equal(p.finished,true,run.id);assert.ok(skiRuns.some(r=>r.id===p.runId));
  assert.ok(Math.abs(p.x-skiRunCenter(run.finish,run.id))<skiRunHalfWidth(run.finish,run.id));
 }
});
