// One spatial contract is shared by the visible wheel, seats and server validation.
export const ferrisDimensions=Object.freeze({
 center:Object.freeze({x:-42,y:17,z:-6}),entrance:Object.freeze({x:-37,z:4}),scale:2.35,yaw:.35,
 radius:5.7,cabinCount:12,seatsPerCabin:2,rotationPeriod:240,
 cabinWidth:2.18,cabinDepth:2.18,cabinDepthOffset:1.5,floorHeight:-1.30,ceilingHeight:.12,
 seatSpacing:1.32,seatDepth:.66,avatarOriginOffset:.82,
});
export function ferrisSeatAnchor(index){return {x:0,y:ferrisDimensions.floorHeight,z:index===1?ferrisDimensions.seatDepth:-ferrisDimensions.seatDepth,yaw:index===1?Math.PI:0};}
