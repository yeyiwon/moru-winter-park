import {aquariumLayout} from './ryokan-aquarium-layout.js';
import {observatoryLayout} from './observatory-layout.js';
import {diningSeats} from './ryokan-service.js';
// Room-local architecture and collision share these dimensions. World positions are
// separate from the outdoor map, so an interior can be spacious without moving its door.
const floor=.09;
export const interiorRooms={
 museum:{id:'museum',name:'별빛 만물관',x:600,z:0,rx:24,rz:22,floor,ceiling:28,shape:'rectangle',entry:{x:590,z:0},exit:{x:577,z:0},arrivalYaw:Math.PI/2,ambient:'#b7d8e9'},
 ryokan:{id:'ryokan',name:'료칸',x:400,z:0,rx:21,rz:17,floor,ceiling:11.5,shape:'rectangle',entry:{x:400,z:5.3},exit:{x:400,z:15.2},arrivalYaw:Math.PI,ambient:'#e9c79e'},
};
export const ryokanFixtures=[
 {id:'aquarium',x:aquariumLayout.x,z:aquariumLayout.z,rx:aquariumLayout.width/2+.45,rz:aquariumLayout.depth/2+.12},
 {id:'reception',x:13,z:10,rx:4,rz:1.1},
 {id:'tea-table',x:-13,z:7,rx:2.25,rz:1.1},
 {id:'tea-bench-back',x:-13,z:10,rx:3.5,rz:.65},
 {id:'tea-bench-side',x:-17.2,z:7,rx:.65,rz:2.6},
 {id:'tatami-table',x:12,z:-9,rx:2.6,rz:1.1},
 {id:'tatami-cabinet',x:17.8,z:-13.5,rx:2.1,rz:.75},
 {id:'sauna-bench-back',x:-13,z:-13.7,rx:5,rz:1},
 {id:'sauna-bench-side',x:-18,z:-8.5,rx:1,rz:4.2},
 {id:'sauna-stove',x:-8.6,z:-11,rx:1.05,rz:1.05},
 {id:'footbath',x:0,z:-11,rx:4.6,rz:2.35},
 {id:'omakase-counter',x:12,z:0,rx:4,rz:.9},
 {id:'chef-preparation',x:12,z:-2.3,rx:4,rz:1.4},
 ...[10,12,14].map(x=>({id:'dining-seat-'+x,x,z:2.1,r:.55})),
 {id:'locker',x:17.7,z:4.8,rx:2,rz:.7},
 ...[[-18.5,13],[-18.5,-1.5],[18.5,14],[18,0],[5,-14.7]].map(([x,z],i)=>({id:'planter-'+i,x,z,r:.65})),
 // Wide doors in the sauna's south wall and east screen connect it to the hall.
 {id:'sauna-wall-south-left',x:-18,z:-1.4,rx:2.8,rz:.14},
 {id:'sauna-wall-south-right',x:-6.8,z:-1.4,rx:2.5,rz:.14},
 {id:'sauna-wall-east-rear',x:-4.5,z:-11.8,rx:.14,rz:4.6},
 {id:'sauna-wall-east-front',x:-4.5,z:-2.5,rx:.14,rz:1.2},
 {id:'tatami-screen',x:6,z:-1.4,rx:.14,rz:3.8}
];
export const interiorInteractions=[
 {id:'exit-museum',name:'밖으로',room:'museum',kind:'exit',x:577,z:0},
 {id:'observatory-quiz',name:'퀴즈 풀기',room:'museum',kind:'quiz-station',x:600+observatoryLayout.quiz.x,z:observatoryLayout.quiz.z,r:observatoryLayout.quiz.r},
 {id:'exit-ryokan',name:'밖으로',room:'ryokan',kind:'exit',x:400,z:15.2},
 {id:'interior-tea',name:'차',room:'ryokan',kind:'tea',x:387,z:8.7},
 {id:'interior-sauna',name:'찜질',room:'ryokan',kind:'sauna',x:387,z:-11.7},
 {id:'interior-rest',name:'다다미',room:'ryokan',kind:'rest',x:410,z:-5},
 {id:'interior-dining',name:'오마카세',room:'ryokan',kind:'dining',x:412,z:3.7},
];
// Interaction markers occupy free floor; activity poses deliberately sit on furniture.
// The companion's seated origin is .82 m above the cushion/bench/rim surface.
export const interiorActivityPoses={
 'interior-tea':{room:'ryokan',x:387,y:1.4975,z:10,yaw:Math.PI,seatY:.6775},
 'interior-sauna':{room:'ryokan',x:386.06,y:1.56,z:-13.7,yaw:0,seatY:.74},
 'interior-rest':{room:'ryokan',x:409,y:1.13,z:-6,yaw:Math.PI,seatY:.31},
 'interior-dining':{room:'ryokan',x:412,y:1.57,z:2.1,yaw:Math.PI,seatY:.75},
};
export function interiorActivityPoseValid(x,y,z){return Number.isFinite(x+y+z)&&[...Object.values(interiorActivityPoses),...diningSeats].some(p=>Math.hypot(x-p.x,z-p.z)<.22&&Math.abs(y-p.y)<.2);}
export function interiorAt(x,z){if(!Number.isFinite(x+z))return null;return Object.values(interiorRooms).find(r=>Math.abs(x-r.x)<=r.rx+.6&&Math.abs(z-r.z)<=r.rz+.6)||null;}
export const museumFixtures=[observatoryLayout.telescope,observatoryLayout.console,observatoryLayout.guide,...observatoryLayout.piers];
export function interiorSurfaceHeight(x,z){return interiorAt(x,z)?floor:null;}
export function interiorCanStandAt(x,z,radius=.35){const room=interiorAt(x,z);if(!room||!Number.isFinite(radius)||radius<0)return false;const dx=x-room.x,dz=z-room.z;if(room.shape==='ellipse'){if((dx/(room.rx-radius-.25))**2+(dz/(room.rz-radius-.25))**2>1)return false;}else if(Math.abs(dx)>room.rx-radius-.25||Math.abs(dz)>room.rz-radius-.25)return false;const obstacles=room.id==='museum'?museumFixtures:ryokanFixtures;return !obstacles.some(o=>o.r?Math.hypot(dx-o.x,dz-o.z)<o.r+radius:Math.abs(dx-o.x)<o.rx+radius&&Math.abs(dz-o.z)<o.rz+radius);}
export function interiorCanMoveFrom(from,to){const a=interiorAt(from.x,from.z),b=interiorAt(to.x,to.z);if(!a||!b||a.id!==b.id)return false;return interiorCanStandAt(to.x,to.z)&&Math.abs(interiorSurfaceHeight(from.x,from.z)-interiorSurfaceHeight(to.x,to.z))<=.22;}
export function interiorPositionValid(x,y,z){if(!Number.isFinite(x+y+z))return false;if(interiorActivityPoseValid(x,y,z))return true;if(!interiorCanStandAt(x,z,.1))return false;const ground=interiorSurfaceHeight(x,z);return y>=ground-.15&&y<=ground+3.9;}
