import {sharedSeatPose} from '../dist/ride-seats.js';
import {benchPoseValid} from '../dist/bench-layout.js';
import {diningPoseValid} from '../dist/ryokan-service.js';
import {restSeats,spaPositionValid,resortRidePosition} from '../dist/resort-layout.js';
import {surfaceHeight} from '../dist/world-layout.js';
import {canStandAt} from '../dist/movement.js';
import {interiorPositionValid} from '../dist/interior-layout.js';
import {amusementPositionValid} from '../dist/festival-layout.js';
export function reservedRidePose(b,reservation,now=Date.now()){
 if(!['lift','ferris'].includes(b.mode))return true;
 if(!reservation||(b.mode==='ferris'?reservation.kind!=='ferris':!['lift','upperlift'].includes(reservation.kind)))return false;
 const expected=sharedSeatPose(reservation,now);return !!expected&&Math.hypot(b.x-expected.x,b.y-expected.y,b.z-expected.z)<=3;
}
export function validPose(b,reservation,now=Date.now()){
 if(!b||![b.x,b.y,b.z,b.yaw].every(Number.isFinite))return false;
 if(!reservedRidePose(b,reservation,now))return false;
 const bench=benchPoseValid(reservation,b)||diningPoseValid(reservation,b);
 if(b.mode==='dining'&&!bench)return false;
 const rest=b.mode==='rest'&&Object.values(restSeats).some(p=>Math.hypot(b.x-p.x,b.z-p.z)<.15&&Math.abs(b.y-p.y)<.15);
 return interiorPositionValid(b.x,b.y,b.z)||canStandAt(b.x,b.z)&&b.y>=surfaceHeight(b.x,b.z)+.5&&b.y<=surfaceHeight(b.x,b.z)+3||rest||bench||amusementPositionValid(b.x,b.y,b.z,b.mode)||spaPositionValid(b.x,b.y,b.z,b.mode)||resortRidePosition(b.x,b.y,b.z,b.mode);
}
