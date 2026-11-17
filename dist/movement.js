import {interiorAt,interiorCanStandAt,interiorCanMoveFrom} from './interior-layout.js';
import {retreatCanStandAt} from './retreat-layout.js';
import {festivalObstacles} from './festival-layout.js';
import {conservatoryCanStandAt,conservatoryCanMoveFrom} from './conservatory-layout.js';
import {parkObstacles} from './park-layout.js';
import {resortObstacles,alpineHeight} from './resort-layout.js';
import {terrainAt,bridges,bridgeHalfWidth} from './world-layout.js';
// Pure ground movement shared by keyboard, touch and click navigation.
export const obstacles = [
 {x:86,z:45.8,r:.75},{x:-47.3,z:-181.5,r:.75},...resortObstacles,...festivalObstacles,{x:0,z:53,r:11.2},{x:12,z:126,w:12,d:11},{x:108,z:35,r:9.4},
  ...parkObstacles,
  {x:-3.55,z:-14,w:2.1,d:1.6},{x:3.55,z:-14,w:2.1,d:1.6},
  {x:-5.4,z:-14,r:1.5},{x:5.4,z:-14,r:1.6},{x:-3.4,z:-16,r:1.35},{x:3.4,z:-16.5,r:1.5},
  {x:41.45,z:31.2,r:.5},{x:50.55,z:31.2,r:.5},{x:38.2,z:24.2,r:.65},{x:53.8,z:24.2,r:.65},
];
export const bodyRadius=.35;
export function canStandAt(x,z){
  if(!Number.isFinite(x+z)||!terrainAt(x,z))return false;
  if(interiorAt(x,z))return interiorCanStandAt(x,z,bodyRadius);
  if(bridges.some(([a,b])=>{const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),along=((x-a.x)*dx+(z-a.z)*dz)/len,side=Math.abs(((x-a.x)*dz-(z-a.z)*dx)/len);return along>a.r-1&&along<len-b.r+1&&Math.abs(side-bridgeHalfWidth)<bodyRadius+.1;}))return false;
  if(!retreatCanStandAt(x,z,bodyRadius)||!conservatoryCanStandAt(x,z,bodyRadius))return false;
  return !obstacles.some(o=>{if(o.door&&Math.abs(x-o.door.x)<o.door.w-bodyRadius)return false;if(o.rx)return ((x-o.x)/(o.rx+bodyRadius))**2+((z-o.z)/(o.rz+bodyRadius))**2<1;return o.r?Math.hypot(x-o.x,z-o.z)<o.r+bodyRadius:Math.abs(x-o.x)<o.w+bodyRadius&&Math.abs(z-o.z)<o.d+bodyRadius;});
}
export function moveVector(x,z,yaw){
  const length=Math.hypot(x,z),s=length>1?1/length:1;
  return {x:(x*Math.cos(yaw)+z*Math.sin(yaw))*s,z:(z*Math.cos(yaw)-x*Math.sin(yaw))*s};
}
export function canMoveBetween(from,to){return interiorAt(from.x,from.z)?interiorCanMoveFrom(from,to):!interiorAt(to.x,to.z)&&conservatoryCanMoveFrom(from,to);}
export function moveOnGround(position,velocity,dt){
  const time=Math.max(0,Math.min(dt,.08)),steps=Math.max(1,Math.ceil(Math.hypot(velocity.x,velocity.z)*time/.15));
  let {x,z}=position;const dx=velocity.x*time/steps,dz=velocity.z*time/steps;
  for(let i=0;i<steps;i++){if(canStandAt(x+dx,z)&&canMoveBetween({x,z},{x:x+dx,z}))x+=dx;if(canStandAt(x,z+dz)&&canMoveBetween({x,z},{x,z:z+dz}))z+=dz;}
  return {x,z};
}
