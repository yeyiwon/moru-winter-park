import {treeLayout,treeShift} from './tree-layout.js';
import {spaShift} from './resort-layout.js';
// Shared footprints for the post office, rink and its accessible east gate.
// Left of the eastbound bridge: a side court leaves the direct tree approach open.
export const postOffice={x:35,z:10,w:6,d:4,yaw:0,entry:{x:35,z:13.5}};
export const postOfficeHost={x:39,z:13.5,r:.75};
export function boothPoint(p,x,z){const yaw=p.yaw||0;return{x:p.x+x*Math.cos(yaw)+z*Math.sin(yaw),z:p.z-x*Math.sin(yaw)+z*Math.cos(yaw)};}
export const rinkBounds={x:-58,z:94+spaShift,rx:22,rz:15,iceY:.115,fenceRx:22.7,fenceRz:15.7,gateHalfWidth:2.4};
export const rinkEntry={x:-34,z:94+spaShift};
// Rental and ice gate share an open concourse; neither sits on the connecting promenade.
export const skateRental={x:-29,z:87+spaShift,w:3.8,d:2.8,entry:{x:-29,z:90.3+spaShift}};
export const rinkLamps=[[-76,76],[-58,76],[-40,76],[-76,112],[-58,112],[-40,112]].map(([x,z])=>({x,z:z+spaShift,r:.3}));
export const rinkBenches=[[-70,74,0],[-46,74,0],[-70,114,Math.PI],[-46,114,Math.PI]].map(([x,z,yaw])=>({x,z:z+spaShift,yaw}));
const gateX=rinkBounds.x+Math.sqrt(1-(rinkBounds.gateHalfWidth/rinkBounds.fenceRz)**2)*rinkBounds.fenceRx;
export const retreatObstacles=[
 ...[postOffice,skateRental].map(p=>({x:p.x,z:p.z,w:p.yaw?p.d/2:p.w/2,d:p.yaw?p.w/2:p.d/2})),
 {...boothPoint(postOffice,postOffice.w/2+.8,1.15),r:.37},
 ...[postOffice,skateRental].flatMap(p=>[-1,1].map(side=>({...boothPoint(p,side*p.w*.41,p.d/2+.5),r:.18}))),
 ...[-1,1].map(side=>({x:gateX,z:rinkBounds.z+side*rinkBounds.gateHalfWidth,r:.23})),
 ...rinkLamps,...rinkBenches.map(p=>({...p,w:2.3,d:.55}))
];
export function withinRink(x,z,margin=0){const r=rinkBounds;if(!Number.isFinite(x+z+margin)||margin>=Math.min(r.rx,r.rz))return false;return ((x-r.x)/(r.rx-margin))**2+((z-r.z)/(r.rz-margin))**2<=1;}
export function rinkFenceBlocked(x,z,bodyRadius=.35){const r=rinkBounds,dx=x-r.x,dz=z-r.z;if(dx>0&&Math.abs(dz)<r.gateHalfWidth-bodyRadius)return false;const level=Math.hypot(dx/r.fenceRx,dz/r.fenceRz);return Math.abs(level-1)*Math.min(r.fenceRx,r.fenceRz)<.12+bodyRadius;}
export function retreatCanStandAt(x,z,bodyRadius=.35){if(!Number.isFinite(x+z+bodyRadius))return false;if(rinkFenceBlocked(x,z,bodyRadius))return false;return !retreatObstacles.some(o=>o.r?Math.hypot(x-o.x,z-o.z)<o.r+bodyRadius:Math.abs(x-o.x)<o.w+bodyRadius&&Math.abs(z-o.z)<o.d+bodyRadius);}
