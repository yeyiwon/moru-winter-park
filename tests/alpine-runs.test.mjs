import {walkToStart,followCourse} from './ski-driver.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {alpineHeight,skiRuns,skiRunCenter,skiRunHalfWidth,summitFacilities,summitPositionValid,resortRides,setSummitRestroomOpen} from '../dist/resort-layout.js';
import {canStandAt} from '../dist/movement.js';


test('the separate sled valley does not cross any ski run',()=>{
 for(const p of resortRides.sled.points)for(const run of skiRuns)assert.ok(Math.abs(p[0]-skiRunCenter(p[2],run.id))>skiRunHalfWidth(p[2],run.id)+8);
 const p=resortRides.sled.points.at(-1);assert.ok(canStandAt(p[0],p[2]));
});

test('summit counters are accessible while solid props and restroom walls block movement',()=>{
 for(const stop of summitFacilities){assert.ok(canStandAt(stop.x,stop.z));assert.ok(summitPositionValid(stop.x,stop.z));assert.ok(Math.abs(alpineHeight(stop.x,stop.z)-72.09)<.2);}
 for(const [x,z] of [[-18,-357],[2,-357],[-8,-349],[-11.8,-349],[11.1,-352],[16.9,-352]])assert.equal(summitPositionValid(x,z),false);
 for(const z of [-348,-349.6,-350,-351])assert.equal(summitPositionValid(14,z),true,'the restroom doorway is traversable');
});

test('the restroom door blocks passage when its physical panel closes',()=>{
 try{setSummitRestroomOpen(false);assert.equal(summitPositionValid(14,-349.6),false);assert.equal(summitPositionValid(14,-348),true);}finally{setSummitRestroomOpen(true);}
 assert.equal(summitPositionValid(14,-349.6),true);
});


test('every physically entered ski run responds to steering and reaches its own exit',async()=>{
 const {createRideController}=await import('../dist/winter-rides.js');
 for(const run of skiRuns){
  const ride=createRideController(resortRides);ride.start('lift');let p=ride.update(45);walkToStart(ride,run.id);
  assert.equal(ride.start('ski'),true);p=ride.update(0);assert.equal(p.speed,0);
  for(let i=0;i<2400;i++){
   p=ride.update(.05,followCourse(p,run.id));if(p.finished)break;
  }
  assert.equal(p.finished,true,run.id);assert.equal(p.runId,run.id);
  assert.ok(Math.abs(p.x-skiRunCenter(run.finish,run.id))<skiRunHalfWidth(run.finish,run.id));
 }
});
