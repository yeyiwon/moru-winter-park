// One counter, three existing stools; no seat selection UI or cross-room allocation.
export const diningFacility=Object.freeze({id:'interior-dining',region:'ryokan',x:412,z:3.7});
export const diningSeats=[410,412,414].map((x,cabin)=>Object.freeze({cabin,seat:0,x,y:1.57,z:2.1,yaw:Math.PI,mode:'dining'}));
export function diningSeatPose(cabin,seat){return seat===0?diningSeats.find(p=>p.cabin===cabin)||null:null;}
