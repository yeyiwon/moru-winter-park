import {regions} from './region-layout.js';

// Basin, clear entrance and descending tread line share the same local coordinates.
export const onsenBasins=[
 {id:'bath',x:-10,z:124,rx:7.4,rz:6.4,access:{x:-10,z:116.1,y:.95},entry:{x:-10,z:119.4,y:.28},width:2.6},
 {id:'smallbath',x:-19,z:132,rx:3.7,rz:3,access:{x:-24,z:132,y:.95},entry:{x:-20.8,z:132,y:.28},width:2.2}
];
const shift=p=>({...p,x:p.x+regions.spa.center.x,z:p.z+regions.spa.center.z-119});
export const onsenEntrances=Object.fromEntries(onsenBasins.map(b=>[b.id,{...b,access:shift(b.access),entry:shift(b.entry)}]));
export function canUseOnsen(id,p){const b=onsenEntrances[id];return !!b&&!!p&&Number.isFinite(p.x+p.z)&&Math.hypot(p.x-b.access.x,p.z-b.access.z)<=2.9;}
export function onsenEntryHeight(b,p){const dx=b.entry.x-b.access.x,dz=b.entry.z-b.access.z,t=Math.max(0,Math.min(1,((p.x-b.access.x)*dx+(p.z-b.access.z)*dz)/(dx*dx+dz*dz)));return b.access.y+(b.entry.y-b.access.y)*t;}
export function onsenTransitionValid(x,y,z,mode){
 if(mode!=='bath')return false;
 return Object.values(onsenEntrances).some(b=>{const dx=b.entry.x-b.access.x,dz=b.entry.z-b.access.z,l=Math.hypot(dx,dz),along=((x-b.access.x)*dx+(z-b.access.z)*dz)/l,side=Math.abs((x-b.access.x)*dz-(z-b.access.z)*dx)/l;
  return along>=-.12&&along<=l+.12&&side<b.width/2-.35&&Math.abs(y-onsenEntryHeight(b,{x,z}))<.13;
 });
}
