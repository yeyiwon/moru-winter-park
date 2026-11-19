import {alpineShift,mountainRest,alpineHeight} from './resort-layout.js';
import {parkBenches} from './park-layout.js';
import {festivalBenches} from './festival-layout.js';
import {treeLayout} from './tree-layout.js';
// Models, interaction access, seat reservations and remote avatars share these sockets.
// Bays sit outside the promenade's 2.2 m clear corridor and the post-office forecourt.
const allTreeBenches=[[19,0],[19,0],[21.5,.05],[21.5,0],[19,0],[24,.05],[21,.05],[19.5,.05]].map(([r,offset],i)=>{const a=i*Math.PI/4+.2+offset;return{id:'tree-bench-'+i,x:treeLayout.x+Math.cos(a)*r,z:treeLayout.z+Math.sin(a)*r,yaw:-a-Math.PI/2};});
export const treeBenches=allTreeBenches.filter(b=>b.id!=='tree-bench-5');
export const benches=[
 ...parkBenches.map((p,i)=>({...p,id:'park-bench-'+i,region:'outdoors',seatY:.64})),
 ...festivalBenches.map((p,i)=>({...p,yaw:Math.PI,id:'festival-bench-'+i,region:'outdoors',seatY:.64})),
 ...allTreeBenches.map((p,i)=>({...p,region:'outdoors',seatY:.64})),
 {id:'ryokan-tea-bench',region:'ryokan',x:387,z:10,yaw:Math.PI,seatY:.6775,mode:'tea',access:{x:392,z:9}},
 {id:'ryokan-sauna-bench',region:'ryokan',x:387,z:-13.7,yaw:0,seatY:.74,mode:'sauna'},
 {id:'ryokan-tatami',region:'ryokan',x:412,z:-6,yaw:Math.PI,seatY:.31,offset:3,access:{x:409,z:-4.6}},
 {id:'museum-bench-west',region:'museum',x:582,z:16,yaw:Math.PI,seatY:.64},
 {id:'museum-bench-east',region:'museum',x:618,z:16,yaw:Math.PI,seatY:.64},
 {id:'ryokan-tea-side',region:'ryokan',x:382.8,z:7,yaw:Math.PI/2,seatY:.6775,mode:'tea',access:{x:384.5,z:4.2}},
 {id:'ryokan-sauna-side',region:'ryokan',x:382,z:-8.5,yaw:Math.PI/2,seatY:.74,mode:'sauna'}
,
 {id:'alpine-hearth-west',region:'outdoors',x:-42.8,z:-154+alpineShift,yaw:Math.PI/2,seatY:.64,access:{x:-44,z:-151.5+alpineShift}},
 {id:'alpine-hearth-east',region:'outdoors',x:-35.2,z:-154+alpineShift,yaw:-Math.PI/2,seatY:.64,access:{x:-34,z:-151.5+alpineShift}},
 ...mountainRest.map(p=>({...p,region:'outdoors',seatY:alpineHeight(p.x,p.z)+.55}))
].map((b,cabin)=>({...b,cabin,mode:b.mode||'rest'})).filter(b=>b.id!=='tree-bench-5');
// Reservation indices remain stable when the post-office bench is removed.
export function benchSeatPose(cabin,seat=0){const b=benches.find(b=>b.cabin===cabin);if(!b||![0,1].includes(seat))return null;const offset=(seat===1?1:-1)*(b.offset??.94);return{x:b.x+Math.cos(b.yaw)*offset,y:b.seatY+.82,z:b.z-Math.sin(b.yaw)*offset,yaw:b.yaw,mode:b.mode};}
export function benchAccess(b){return b.access?{...b.access}:{x:b.x+Math.sin(b.yaw)*3,z:b.z+Math.cos(b.yaw)*3};}
export const benchInteractions=benches.map(b=>({id:b.id,name:b.mode==='tea'?'차 마시기':b.mode==='sauna'?'찜질':b.id==='ryokan-tatami'?'다다미':'벤치',kind:'bench',room:b.region==='outdoors'?null:b.region,cabin:b.cabin,...benchAccess(b),r:2.5}));
export function benchPoseValid(reservation,position){if(reservation?.kind!=='bench')return false;const pose=benchSeatPose(reservation.cabin,reservation.seat);return !!pose&&position.mode===pose.mode&&Math.hypot(position.x-pose.x,position.z-pose.z)<.25&&Math.abs(position.y-pose.y)<.25;}
