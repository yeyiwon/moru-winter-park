import {terrainAt,buildings} from './world-layout.js';
export const obstacles=buildings;
export function canStandAt(x,z){return Number.isFinite(x+z)&&terrainAt(x,z)&&!obstacles.some(o=>o.r?Math.hypot(x-o.x,z-o.z)<o.r+.35:Math.abs(x-o.x)<o.w+.35&&Math.abs(z-o.z)<o.d+.35);}
export function moveVector(x,z,yaw){const length=Math.hypot(x,z),s=length>1?1/length:1;return{x:(x*Math.cos(yaw)+z*Math.sin(yaw))*s,z:(z*Math.cos(yaw)-x*Math.sin(yaw))*s};}
export function moveOnGround(position,velocity,dt){const time=Math.max(0,Math.min(dt,.08)),steps=Math.max(1,Math.ceil(Math.hypot(velocity.x,velocity.z)*time/.12));let{x,z}=position;for(let i=0;i<steps;i++){const dx=velocity.x*time/steps,dz=velocity.z*time/steps;if(canStandAt(x+dx,z))x+=dx;if(canStandAt(x,z+dz))z+=dz;}return{x,z};}
