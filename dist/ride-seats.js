import {benches,benchAccess,benchSeatPose} from './bench-layout.js';
import {diningEntrance,diningSeats,diningSeatPose} from './ryokan-service.js';
import {ferrisDimensions as ferris,ferrisSeatAnchor} from './ferris-layout.js';
import {resortRides} from './resort-layout.js';
import {sampleRide} from './winter-rides.js';
export const sharedRideKinds=['ferris','lift','upperlift','bench','dining'];
export function sharedSeatChoices(kind,benchId){
 if(kind==='dining')return diningSeats.map(p=>({...p,kind,cabin:0,placeId:'interior-dining',region:'ryokan',benchId:undefined,access:diningEntrance}));
 const b=kind==='bench'&&benches.find(b=>b.id===benchId);return b?[0,1].map(seat=>({kind,cabin:b.cabin,seat,benchId:b.id,placeId:b.id,region:b.region,...benchSeatPose(b.cabin,seat),seatY:b.seatY,access:benchAccess(b)})):[];
}
export function occupiedSeat(choice,reservations=[],selfId){return reservations.some(r=>r.kind===choice.kind&&r.cabin===choice.cabin&&r.seat===choice.seat&&r.id!==selfId);}
export function canReachSharedSeat(choice,visitor){return !!choice&&Number.isFinite(visitor.x+visitor.z)&&(Math.hypot(visitor.x-choice.access.x,visitor.z-choice.access.z)<=4.5||Math.hypot(visitor.x-choice.x,visitor.z-choice.z)<=3.2);}
const selectableSeats=[...sharedSeatChoices('dining'),...benches.flatMap(b=>sharedSeatChoices('bench',b.id))];
// A lightweight hit plane identifies the exact physical chair. Reach and room
// are checked again by the server; the renderer still checks wall occlusion.
export function pickSharedSeat(ray,visitor,region='outdoors'){
 if(!ray?.origin||!ray.direction||Math.abs(ray.direction.y)<1e-5)return null;
 let best=null;for(const seat of selectableSeats){
  if(seat.region!==region||!canReachSharedSeat(seat,visitor))continue;
  const distance=(seat.seatY+.08-ray.origin.y)/ray.direction.y;if(distance<=0)continue;
  const x=ray.origin.x+ray.direction.x*distance,z=ray.origin.z+ray.direction.z*distance;
  if(Math.hypot(x-seat.x,z-seat.z)>.72||best&&best.distance<=distance)continue;
  best={...seat,distance,hit:{x,y:seat.seatY+.08,z}};
 }return best;
}
export function ferrisCabinAtStation(now){const phase=(now/1000%ferris.rotationPeriod)/ferris.rotationPeriod*Math.PI*2,n=ferris.cabinCount;return ((Math.round((-Math.PI/2-phase)/(Math.PI*2)*n)%n)+n)%n;}
export function sharedSeatPose(reservation,now){
 if(!reservation||!sharedRideKinds.includes(reservation.kind))return null;
 if(reservation.kind==='bench')return benchSeatPose(reservation.cabin,reservation.seat);
 if(reservation.kind==='dining')return diningSeatPose(reservation);
 const side=reservation.seat===1?1:-1;
 if(reservation.kind==='ferris'){
  const {yaw,scale,center,radius,cabinCount,rotationPeriod,cabinDepthOffset,avatarOriginOffset}=ferris,anchor=ferrisSeatAnchor(reservation.seat),a=reservation.cabin*Math.PI*2/cabinCount+(now/1000%rotationPeriod)/rotationPeriod*Math.PI*2,x=Math.cos(a)*radius+anchor.x,z=cabinDepthOffset+anchor.z;
  const angle=yaw+anchor.yaw;
  return{x:center.x+(x*Math.cos(yaw)+z*Math.sin(yaw))*scale,y:center.y+(Math.sin(a)*radius+anchor.y)*scale+avatarOriginOffset,z:center.z+(-x*Math.sin(yaw)+z*Math.cos(yaw))*scale,yaw:Math.atan2(Math.sin(angle),Math.cos(angle)),mode:'ferris'};
 }
 const route=resortRides[reservation.kind],elapsed=Math.max(0,(now-reservation.startedAt)/1000),p=sampleRide(route,elapsed/route.duration),offset=side*.95;
 return{...p,x:p.x+Math.cos(p.yaw)*offset,z:p.z-Math.sin(p.yaw)*offset,mode:'lift',elapsed,finished:elapsed>=route.duration};
}
