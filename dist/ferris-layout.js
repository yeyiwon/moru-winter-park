// One spatial contract is shared by the visible wheel, seats and server validation.
export const ferrisDimensions=Object.freeze({
 center:Object.freeze({x:-42,y:17,z:-6}),get entrance(){return ferrisGroundPoint(0,9.5);},scale:2.35,yaw:.35,
 radius:5.7,cabinCount:12,seatsPerCabin:2,rotationPeriod:240,
 cabinWidth:2.18,cabinDepth:2.18,cabinDepthOffset:1.5,floorHeight:-1.30,ceilingHeight:.12,
 seatSpacing:1.32,seatDepth:.66,avatarOriginOffset:.82,
});
export function ferrisGroundPoint(x,z){const {center,yaw}=ferrisDimensions;return{x:center.x+x*Math.cos(yaw)+z*Math.sin(yaw),z:center.z-x*Math.sin(yaw)+z*Math.cos(yaw)};}
export function ferrisSeatAnchor(index){return {x:0,y:ferrisDimensions.floorHeight,z:index===1?ferrisDimensions.seatDepth:-ferrisDimensions.seatDepth,yaw:index===1?Math.PI:0};}
