import {resortRides} from './resort-layout.js';
import {sampleRide} from './winter-rides.js';
export const sharedRideKinds=['ferris','lift','upperlift'];
export function ferrisCabinAtStation(now){const phase=(now/1000%240)/240*Math.PI*2;return ((Math.round((-Math.PI/2-phase)/(Math.PI*2)*12)%12)+12)%12;}
export function sharedSeatPose(reservation,now){
 if(!reservation||!sharedRideKinds.includes(reservation.kind))return null;
 const side=reservation.seat===1?1:-1;
 if(reservation.kind==='ferris'){
  const yaw=.12,scale=2.35,a=reservation.cabin*Math.PI*2/12+(now/1000%240)/240*Math.PI*2,x=Math.cos(a)*5.7+side*.5,z=1.27;
  return{x:-18+(x*Math.cos(yaw)+z*Math.sin(yaw))*scale,y:17+(Math.sin(a)*5.7-1.3)*scale+.82,z:-5+(-x*Math.sin(yaw)+z*Math.cos(yaw))*scale,yaw,mode:'ferris'};
 }
 const route=resortRides[reservation.kind],elapsed=Math.max(0,(now-reservation.startedAt)/1000),p=sampleRide(route,elapsed/route.duration),offset=side*.95;
 return{...p,x:p.x+Math.cos(p.yaw)*offset,z:p.z-Math.sin(p.yaw)*offset,mode:'lift',elapsed,finished:elapsed>=route.duration};
}
