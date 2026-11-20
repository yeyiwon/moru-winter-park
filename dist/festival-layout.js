import {ferrisDimensions as wheel,ferrisGroundPoint} from './ferris-layout.js';
export const festivalLayout={x:-45,z:4,r:15};
export const candyStall={x:-50,z:11};
export const festivalDestinations=[
 {id:'festival-photo',name:'겨울 포토존',x:-49,z:3,kind:'photo',view:{distance:13,pitch:.18,yaw:-1.4,lookHeight:-.3}},
 {id:'candyfloss',name:'솜사탕 부스',x:candyStall.x,z:candyStall.z+3,kind:'snack',approach:[[ferrisGroundPoint(0,15).x,ferrisGroundPoint(0,15).z],[-43,11],[-46,14]]},
];
export const festivalLamps=[[-54,1],[-35,-23]].map(([x,z])=>({x,z}));
// Rest stops remain inside the compact park, clear of both boarding approaches.
export const festivalBenches=[{x:-53,z:-5},{x:-46,z:21}];
export const festivalObstacles=[...festivalLamps.map(p=>({...p,r:.43})),
 ...festivalBenches.map(p=>({...p,w:2.05,d:.7})),{...candyStall,rx:1.75,rz:1.1},
];
export function amusementPositionValid(x,y,z,mode){
 if(!Number.isFinite(x+y+z))return false;
 if(mode==='carousel')return Math.hypot(x-16,z-3.8)<5&&y>2.4&&y<4.4;
 if(mode==='ferris'){const dx=x-wheel.center.x,dz=z-wheel.center.z,lx=(dx*Math.cos(wheel.yaw)-dz*Math.sin(wheel.yaw))/wheel.scale,lz=(dx*Math.sin(wheel.yaw)+dz*Math.cos(wheel.yaw))/wheel.scale,ly=(y-wheel.avatarOriginOffset-wheel.center.y)/wheel.scale-wheel.floorHeight;return Math.abs(Math.hypot(lx,ly)-wheel.radius)<.5&&Math.abs(lz-wheel.cabinDepthOffset)<wheel.seatDepth+.2;}
 return false;
}
