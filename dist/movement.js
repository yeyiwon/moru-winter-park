import {resortObstacles,alpineHeight} from './resort-layout.js';
import {terrainAt} from './world-layout.js';
// Pure ground movement shared by keyboard, touch and click navigation.
export const obstacles = [
 ...resortObstacles,{x:108,z:35,r:9.4},{x:-47.3,z:25,r:1.5},{x:-48,z:36.2,w:3.6,d:.2},{x:46,z:-20,r:.8},
  {x:7.1,z:-3.2,r:3.9}, {x:-18,z:-5,r:6},
  {x:-3.55,z:-14,w:2.1,d:1.6},{x:3.55,z:-14,w:2.1,d:1.6},
  {x:-5.4,z:-14,r:1.5},{x:5.4,z:-14,r:1.6},{x:-3.4,z:-16,r:1.35},{x:3.4,z:-16.5,r:1.5},
  {x:8,z:-10,w:1.9,d:1.6}, {x:11.2,z:-10.7,w:1.9,d:1.6}, {x:14.4,z:-11.4,w:1.9,d:1.6},
  {x:0,z:-56,r:4.8},{x:-8,z:-51,r:1.1},{x:47,z:-30,r:.6},{x:0,z:53,r:3.3},...[-50.5,-41.5].flatMap(x=>[22,27.5].map(z=>({x,z,r:.3}))),{x:-46,z:22,w:4.6,d:.2},{x:-44,z:23.5,w:.9,d:.2},...[[ -49.3,30.8],[-45.4,31.6],[-41.3,30.3]].map(([x,z])=>({x,z,w:1.3,d:.5})),
  ...Array.from({length:9},(_,j)=>({x:47+Math.cos(j/8*Math.PI)*4.5,z:-30-Math.sin(j/8*Math.PI)*3.3,r:.53})),
  {x:41,z:22,r:.6},{x:51,z:21,r:.6},{x:54,z:30,r:.6},{x:39,z:31,r:.6},
  {x:-6,z:10,r:.8},{x:8,z:9,r:.8},{x:13,z:-7,r:.8},{x:-15,z:-10,r:.8}
];
export function canStandAt(x,z){
  if(!Number.isFinite(x+z)||!terrainAt(x,z))return false;
  if(((x+10)/7.85)**2+((z+3)/12.25)**2<1)return false;
  const gardenRadius=Math.hypot(x,z-53);
  if(gardenRadius>4&&gardenRadius<5.35&&!(Math.abs(x)<1.5&&Math.abs(z-53)>3.6))return false;
  return !obstacles.some(o=>{if(o.door&&Math.abs(x-o.door.x)<o.door.w)return false;if(o.rx)return ((x-o.x)/o.rx)**2+((z-o.z)/o.rz)**2<1;return o.r?Math.hypot(x-o.x,z-o.z)<o.r:Math.abs(x-o.x)<o.w&&Math.abs(z-o.z)<o.d;});
}
export function moveVector(x,z,yaw){
  const length=Math.hypot(x,z),s=length>1?1/length:1;
  return {x:(x*Math.cos(yaw)+z*Math.sin(yaw))*s,z:(z*Math.cos(yaw)-x*Math.sin(yaw))*s};
}
export function moveOnGround(position,velocity,dt){
  const time=Math.max(0,Math.min(dt,.08)),steps=Math.max(1,Math.ceil(Math.hypot(velocity.x,velocity.z)*time/.15));
  let {x,z}=position;const dx=velocity.x*time/steps,dz=velocity.z*time/steps;
  for(let i=0;i<steps;i++){if(canStandAt(x+dx,z))x+=dx;if(canStandAt(x,z+dz))z+=dz;}
  return {x,z};
}
