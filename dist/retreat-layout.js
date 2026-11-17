// Shared footprints for the post office, rink and its accessible east gate.
export const postOffice={x:90,z:43,w:6,d:4,entry:{x:90,z:46}};
export const rinkBounds={x:-58,z:94,rx:22,rz:15,iceY:.115,fenceRx:22.7,fenceRz:15.7,gateHalfWidth:2.4};
export const rinkEntry={x:-34,z:94};
export const skateRental={x:-32,z:102,w:3.8,d:2.8,entry:{x:-32,z:105.3}};
export const rinkLamps=[[-76,76],[-58,76],[-40,76],[-76,112],[-58,112],[-40,112]].map(([x,z])=>({x,z,r:.3}));
export const rinkBenches=[[-70,74,0],[-46,74,0],[-70,114,Math.PI],[-46,114,Math.PI]].map(([x,z,yaw])=>({x,z,yaw}));
const gateX=rinkBounds.x+Math.sqrt(1-(rinkBounds.gateHalfWidth/rinkBounds.fenceRz)**2)*rinkBounds.fenceRx;
export const retreatObstacles=[
 ...[postOffice,skateRental].map(p=>({x:p.x,z:p.z,w:p.w/2,d:p.d/2})),
 {x:postOffice.x+postOffice.w/2+.8,z:postOffice.z+1.15,r:.37},
 ...[postOffice,skateRental].flatMap(p=>[-1,1].map(side=>({x:p.x+side*p.w*.41,z:p.z+p.d/2+.5,r:.18}))),
 ...[-1,1].map(side=>({x:gateX,z:rinkBounds.z+side*rinkBounds.gateHalfWidth,r:.23})),
 ...rinkLamps,...rinkBenches.map(p=>({...p,w:2.3,d:.55}))
];
export function withinRink(x,z,margin=0){const r=rinkBounds;if(!Number.isFinite(x+z+margin)||margin>=Math.min(r.rx,r.rz))return false;return ((x-r.x)/(r.rx-margin))**2+((z-r.z)/(r.rz-margin))**2<=1;}
export function rinkFenceBlocked(x,z,bodyRadius=.35){const r=rinkBounds,dx=x-r.x,dz=z-r.z;if(dx>0&&Math.abs(dz)<r.gateHalfWidth-bodyRadius)return false;const level=Math.hypot(dx/r.fenceRx,dz/r.fenceRz);return Math.abs(level-1)*Math.min(r.fenceRx,r.fenceRz)<.12+bodyRadius;}
export function retreatCanStandAt(x,z,bodyRadius=.35){if(!Number.isFinite(x+z+bodyRadius))return false;if(rinkFenceBlocked(x,z,bodyRadius))return false;return !retreatObstacles.some(o=>o.r?Math.hypot(x-o.x,z-o.z)<o.r+bodyRadius:Math.abs(x-o.x)<o.w+bodyRadius&&Math.abs(z-o.z)<o.d+bodyRadius);}
