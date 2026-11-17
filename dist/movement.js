import {retreatCanStandAt} from './retreat-layout.js';
import {festivalObstacles} from './festival-layout.js';
import {conservatoryCanStandAt,conservatoryCanMoveFrom} from './conservatory-layout.js';
import {parkObstacles} from './park-layout.js';
import {resortObstacles,alpineHeight} from './resort-layout.js';
import {terrainAt} from './world-layout.js';
// Pure ground movement shared by keyboard, touch and click navigation.
export const obstacles = [
 ...resortObstacles,...festivalObstacles,{x:108,z:35,r:9.4},{x:-47.3,z:25,r:1.5},{x:-48,z:36.2,w:3.6,d:.2},{x:46,z:-20,r:.8},
  ...parkObstacles,
  {x:-3.55,z:-14,w:2.1,d:1.6},{x:3.55,z:-14,w:2.1,d:1.6},
  {x:-5.4,z:-14,r:1.5},{x:5.4,z:-14,r:1.6},{x:-3.4,z:-16,r:1.35},{x:3.4,z:-16.5,r:1.5},
  {x:47,z:-30,r:.6},...[-50.5,-41.5].flatMap(x=>[22,27.5].map(z=>({x,z,r:.3}))),{x:-46,z:22,w:4.6,d:.2},{x:-44,z:23.5,w:.9,d:.2},...[[ -49.3,30.8],[-45.4,31.6],[-41.3,30.3]].map(([x,z])=>({x,z,w:1.3,d:.5})),
  ...Array.from({length:9},(_,j)=>({x:47+Math.cos(j/8*Math.PI)*4.5,z:-30-Math.sin(j/8*Math.PI)*3.3,r:.53})),
  {x:41.45,z:31.2,r:.5},{x:50.55,z:31.2,r:.5},{x:38.2,z:24.2,r:.65},{x:53.8,z:24.2,r:.65},
];
export const bodyRadius=.35;
export function canStandAt(x,z){
  if(!Number.isFinite(x+z)||!terrainAt(x,z))return false;
  if(!retreatCanStandAt(x,z,bodyRadius)||!conservatoryCanStandAt(x,z,bodyRadius))return false;
  return !obstacles.some(o=>{if(o.door&&Math.abs(x-o.door.x)<o.door.w-bodyRadius)return false;if(o.rx)return ((x-o.x)/(o.rx+bodyRadius))**2+((z-o.z)/(o.rz+bodyRadius))**2<1;return o.r?Math.hypot(x-o.x,z-o.z)<o.r+bodyRadius:Math.abs(x-o.x)<o.w+bodyRadius&&Math.abs(z-o.z)<o.d+bodyRadius;});
}
export function moveVector(x,z,yaw){
  const length=Math.hypot(x,z),s=length>1?1/length:1;
  return {x:(x*Math.cos(yaw)+z*Math.sin(yaw))*s,z:(z*Math.cos(yaw)-x*Math.sin(yaw))*s};
}
export function moveOnGround(position,velocity,dt){
  const time=Math.max(0,Math.min(dt,.08)),steps=Math.max(1,Math.ceil(Math.hypot(velocity.x,velocity.z)*time/.15));
  let {x,z}=position;const dx=velocity.x*time/steps,dz=velocity.z*time/steps;
  for(let i=0;i<steps;i++){if(canStandAt(x+dx,z)&&conservatoryCanMoveFrom({x,z},{x:x+dx,z}))x+=dx;if(canStandAt(x,z+dz)&&conservatoryCanMoveFrom({x,z},{x,z:z+dz}))z+=dz;}
  return {x,z};
}
