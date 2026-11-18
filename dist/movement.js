import {districtObstacles} from './district-layout.js';
import {treeBenches} from './bench-layout.js';
import {treeLayout,treeShift} from './tree-layout.js';
import {createStaticColliderIndex,colliderContains} from './collision-grid.js';
import {postOfficeHost} from './retreat-layout.js';
import {alpineShift,liftLayout} from './resort-layout.js';
import {alpineTrunkBlocks} from './alpine-forest-layout.js';
import {castleObstacles} from './castle-layout.js';
import {interiorAt,interiorCanStandAt,interiorCanMoveFrom} from './interior-layout.js';
import {retreatCanStandAt} from './retreat-layout.js';
import {festivalObstacles} from './festival-layout.js';
import {parkObstacles} from './park-layout.js';
import {spaToWorld} from './spa-transform.js';
import {resortObstacles,alpineHeight} from './resort-layout.js';
import {terrainAt,bridges,bridgeHalfWidth,promenadeTrees} from './world-layout.js';
// Pure ground movement shared by keyboard, touch and click navigation.
export const obstacles = [
 ...districtObstacles,...promenadeTrees,postOfficeHost,{x:liftLayout.x-11.3,z:-181.5+alpineShift,r:.75},...resortObstacles,...festivalObstacles,spaToWorld({x:12,z:126,w:12,d:11,yaw:0}),{x:treeLayout.x,z:treeLayout.z,r:9.4},
  ...parkObstacles,...treeBenches.map(p=>({...p,r:2.1})),{x:-6.5,z:3,r:1.02},
  ...castleObstacles,

];
export const bodyRadius=.35;
const obstacleIndex=createStaticColliderIndex(obstacles,{padding:bodyRadius});
export function canStandAt(x,z){
  if(!Number.isFinite(x+z)||!terrainAt(x,z))return false;
  if(interiorAt(x,z))return interiorCanStandAt(x,z,bodyRadius);
  if(bridges.some(([a,b])=>{const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),along=((x-a.x)*dx+(z-a.z)*dz)/len,side=Math.abs(((x-a.x)*dz-(z-a.z)*dx)/len);return along>a.r-1&&along<len-b.r+1&&Math.abs(side-bridgeHalfWidth)<bodyRadius+.1;}))return false;
  if(!retreatCanStandAt(x,z,bodyRadius))return false;
  if(alpineTrunkBlocks(x,z,bodyRadius))return false;
  return !obstacleIndex.query(x,z).some(o=>colliderContains(o,x,z,bodyRadius));
}
export function moveVector(x,z,yaw){
  const length=Math.hypot(x,z),s=length>1?1/length:1;
  return {x:(x*Math.cos(yaw)+z*Math.sin(yaw))*s,z:(z*Math.cos(yaw)-x*Math.sin(yaw))*s};
}
export function canMoveBetween(from,to){return interiorAt(from.x,from.z)?interiorCanMoveFrom(from,to):!interiorAt(to.x,to.z);}
export function moveOnGround(position,velocity,dt){
  const time=Math.max(0,Math.min(dt,.08)),steps=Math.max(1,Math.ceil(Math.hypot(velocity.x,velocity.z)*time/.15));
  let {x,z}=position;const dx=velocity.x*time/steps,dz=velocity.z*time/steps;
  for(let i=0;i<steps;i++){if(canStandAt(x+dx,z)&&canMoveBetween({x,z},{x:x+dx,z}))x+=dx;if(canStandAt(x,z+dz)&&canMoveBetween({x,z},{x,z:z+dz}))z+=dz;}
  return {x,z};
}
