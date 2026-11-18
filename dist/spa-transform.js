import {regions,regionPoint,regionLocalPoint} from './region-layout.js';
// Authored resort assets retain their original joinery coordinates. Every consumer
// uses this same rigid transform, including server validation and water reactions.
export const spaOriginZ=119;
export const spaYaw=regions.spa.yaw||0;
export function spaToWorld(p){return{...p,...regionPoint('spa',p.x,p.z-spaOriginZ),...(p.yaw!==undefined?{yaw:p.yaw+spaYaw}:{})};}
export function spaToLocal(p){const local=regionLocalPoint('spa',p.x,p.z);return{...p,x:local.x,z:local.z+spaOriginZ,...(p.yaw!==undefined?{yaw:p.yaw-spaYaw}:{})};}
