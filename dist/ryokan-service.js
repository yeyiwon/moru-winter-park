// One shared clock drives the chef, the plate and both local/remote guests.
// Seats are shared with the server; these are world coordinates, not UI offsets.
export const diningEntrance={x:412,z:3.7,region:'ryokan'};
export const diningSeats=[410,412,414].map((x,seat)=>Object.freeze({seat,room:'ryokan',x,y:1.57,z:2.1,yaw:Math.PI,seatY:.75,mode:'dining'}));
export const diningServiceSlot=9000;
export const diningTasteEnd=25000;
const clamp=x=>Math.max(0,Math.min(1,x));
export const smoothService=x=>{const v=clamp(x);return v*v*(3-2*v);};
export function diningSeatPose(reservation){
 if(reservation?.kind!=='dining'||reservation.cabin!==0||!Number.isInteger(reservation.seat))return null;
 const seat=diningSeats[reservation.seat];return seat?{...seat,diningStartedAt:reservation.startedAt}:null;
}
export function diningPoseValid(reservation,pose){
 const seat=diningSeatPose(reservation);
 return !!seat&&pose.mode==='dining'&&Number.isFinite(pose.x+pose.y+pose.z)&&Math.hypot(pose.x-seat.x,pose.z-seat.z)<.22&&Math.abs(pose.y-seat.y)<.2;
}
export function diningServiceState(startedAt,now){
 if(!Number.isFinite(startedAt)||!Number.isFinite(now))return {stage:'waiting',elapsed:0,holding:false,finished:false,progress:0};
 const elapsed=now-startedAt;
 const stage=elapsed<0?'waiting':elapsed<1000?'greeting':elapsed<4000?'preparing':elapsed<7000?'serving':elapsed<diningServiceSlot?'handoff':elapsed<diningTasteEnd?'tasting':'finished';
 return {stage,elapsed,holding:elapsed>=diningServiceSlot,finished:elapsed>=diningTasteEnd,progress:stage==='serving'?smoothService((elapsed-4000)/3000):stage==='handoff'?smoothService((elapsed-7000)/2000):0};
}
export function activeDiningService(reservations,now){
 return reservations.filter(r=>diningSeatPose(r)&&Number.isFinite(r.startedAt)&&r.startedAt<=now&&now<r.startedAt+diningServiceSlot).sort((a,b)=>a.startedAt-b.startedAt||a.seat-b.seat)[0]||null;
}
export const diningStageText={waiting:'앞 손님을 대접하고 있어요',greeting:'셰프가 인사를 건네요',preparing:'오늘의 한 접시를 준비하고 있어요',serving:'셰프가 음식을 가져와요',handoff:'맛있게 드세요',tasting:'천천히 즐겨보세요',finished:'따뜻한 여운을 즐겨보세요'};
