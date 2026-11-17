// Shared footprints for the post office, rink and its accessible east gate.
export const postOffice={x:94,z:52,w:6,d:4,entry:{x:94,z:55}};
export const rinkBounds={x:-58,z:94,rx:14,rz:10,iceY:.115,fenceRx:14.55,fenceRz:10.55,gateHalfWidth:1.7};
export const rinkEntry={x:-43,z:94};
export const skateRental={x:-43,z:99,w:3.8,d:2.8,entry:{x:-43,z:101.3}};
export const rinkLamps=[[-69,84.8],[-58,81.7],[-47,84.8],[-69,103.2],[-58,106.3],[-47,105.3]].map(([x,z])=>({x,z,r:.3}));
export const retreatObstacles=[
 {x:postOffice.x,z:postOffice.z,w:postOffice.w/2,d:postOffice.d/2},
 {x:skateRental.x,z:skateRental.z,w:skateRental.w/2,d:skateRental.d/2},
 {x:97.8,z:53.15,r:.37},
 ...[-1,1].flatMap(side=>[{x:94+side*6*.41,z:54.5,r:.18},{x:-43+side*3.8*.41,z:100.9,r:.18}]),
 ...rinkLamps,
 {x:-58,z:108.3,w:2.3,d:.5},{x:-58,z:79.7,w:2.3,d:.5}
];
export function withinRink(x,z,margin=0){const r=rinkBounds;if(!Number.isFinite(x+z+margin)||margin>=Math.min(r.rx,r.rz))return false;return ((x-r.x)/(r.rx-margin))**2+((z-r.z)/(r.rz-margin))**2<=1;}
export function rinkFenceBlocked(x,z,bodyRadius=.35){const r=rinkBounds,dx=x-r.x,dz=z-r.z;if(dx>0&&Math.abs(dz)<r.gateHalfWidth-bodyRadius)return false;const level=Math.hypot(dx/r.fenceRx,dz/r.fenceRz);return Math.abs(level-1)*Math.min(r.fenceRx,r.fenceRz)<.12+bodyRadius;}
export function retreatCanStandAt(x,z,bodyRadius=.35){if(!Number.isFinite(x+z+bodyRadius))return false;if(rinkFenceBlocked(x,z,bodyRadius))return false;return !retreatObstacles.some(o=>o.r?Math.hypot(x-o.x,z-o.z)<o.r+bodyRadius:Math.abs(x-o.x)<o.w+bodyRadius&&Math.abs(z-o.z)<o.d+bodyRadius);}
