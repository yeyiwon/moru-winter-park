import {sharedRestPoseValid} from '../dist/ride-seats.js';
import {restSeats,spaPositionValid,resortRidePosition} from '../dist/resort-layout.js';
import {surfaceHeight} from '../dist/world-layout.js';
import {canStandAt} from '../dist/movement.js';
import {interiorPositionValid} from '../dist/interior-layout.js';
import {amusementPositionValid} from '../dist/festival-layout.js';
export function validPose(b,reservation){
 if(!b||![b.x,b.y,b.z,b.yaw].every(Number.isFinite))return false;
 const bench=sharedRestPoseValid(reservation,b);
 if(b.mode==='dining'&&!bench)return false;
 const rest=b.mode==='rest'&&Object.values(restSeats).some(p=>Math.hypot(b.x-p.x,b.z-p.z)<.15&&Math.abs(b.y-p.y)<.15);
 return interiorPositionValid(b.x,b.y,b.z)||canStandAt(b.x,b.z)&&b.y>=surfaceHeight(b.x,b.z)+.5&&b.y<=surfaceHeight(b.x,b.z)+3||rest||bench||amusementPositionValid(b.x,b.y,b.z,b.mode)||spaPositionValid(b.x,b.y,b.z,b.mode)||resortRidePosition(b.x,b.y,b.z,b.mode);
}
