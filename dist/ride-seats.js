import {diningSeatPose} from './dining-seats.js';
import {benchSeatPose} from './bench-layout.js';
import {ferrisDimensions as ferris,ferrisSeatAnchor} from './ferris-layout.js';
import {resortRides} from './resort-layout.js';
import {sampleRide} from './winter-rides.js';
export const sharedRideKinds=['ferris','lift','upperlift','bench','dining'];
export function ferrisCabinAtStation(now){const phase=(now/1000%ferris.rotationPeriod)/ferris.rotationPeriod*Math.PI*2,n=ferris.cabinCount;return ((Math.round((-Math.PI/2-phase)/(Math.PI*2)*n)%n)+n)%n;}
export function sharedSeatPose(reservation,now){
 if(!reservation||!sharedRideKinds.includes(reservation.kind))return null;
 if(reservation.kind==='dining')return diningSeatPose(reservation.cabin,reservation.seat);
 if(reservation.kind==='bench')return benchSeatPose(reservation.cabin,reservation.seat);
 const side=reservation.seat===1?1:-1;
 if(reservation.kind==='ferris'){
  const {yaw,scale,center,radius,cabinCount,rotationPeriod,cabinDepthOffset,avatarOriginOffset}=ferris,anchor=ferrisSeatAnchor(reservation.seat),a=reservation.cabin*Math.PI*2/cabinCount+(now/1000%rotationPeriod)/rotationPeriod*Math.PI*2,x=Math.cos(a)*radius+anchor.x,z=cabinDepthOffset+anchor.z;
  const angle=yaw+anchor.yaw;
  return{x:center.x+(x*Math.cos(yaw)+z*Math.sin(yaw))*scale,y:center.y+(Math.sin(a)*radius+anchor.y)*scale+avatarOriginOffset,z:center.z+(-x*Math.sin(yaw)+z*Math.cos(yaw))*scale,yaw:Math.atan2(Math.sin(angle),Math.cos(angle)),mode:'ferris'};
 }
 const route=resortRides[reservation.kind],elapsed=Math.max(0,(now-reservation.startedAt)/1000),p=sampleRide(route,elapsed/route.duration),offset=side*.95;
 return{...p,x:p.x+Math.cos(p.yaw)*offset,z:p.z-Math.sin(p.yaw)*offset,mode:'lift',elapsed,finished:elapsed>=route.duration};
}

export function sharedRestPoseValid(reservation,position){if(!reservation||!['bench','dining'].includes(reservation.kind))return false;const p=sharedSeatPose(reservation,0);return !!p&&position.mode===p.mode&&Math.hypot(position.x-p.x,position.z-p.z)<.25&&Math.abs(position.y-p.y)<.25;}
