import test from 'node:test';
import assert from 'node:assert/strict';
import {sharedSeatPose} from '../dist/ride-seats.js';
import {reservedRidePose,currentReservedPose} from '../server/pose-validation.js';
test('delayed passengers validate at bounded send time and publish the current authoritative seat',()=>{
 for(const kind of ['gondola','lift','upperlift','ridgelift','ferris']){
  const reservation={kind,seat:0,cabin:0,startedAt:0},now=50000;
  for(const latency of [0,500,1500,7000]){
   const seatAt=now-latency,pose={...sharedSeatPose(reservation,seatAt),seatAt};
   assert.equal(reservedRidePose(pose,reservation,now),true,kind);
   const current=currentReservedPose(pose,reservation,now);
   assert.deepEqual(current,sharedSeatPose(reservation,now));
   assert.equal(reservedRidePose({...pose,x:pose.x+8},reservation,now),false,'a claimed timestamp cannot move the passenger off their seat');
   assert.equal(reservedRidePose(pose,null,now),false);
  }
 }
 const reservation={kind:'gondola',seat:0,startedAt:0};
 assert.equal(reservedRidePose({...sharedSeatPose(reservation,40000),seatAt:40000},reservation,50000),false,'old replay rejected');
 assert.equal(reservedRidePose({...sharedSeatPose(reservation,60000),seatAt:60000},reservation,50000),false,'future replay rejected');
});
