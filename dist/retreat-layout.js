import {regions} from './region-layout.js';
// Shared footprints for the wish post office and its accessible counter.
// Face the central promenade from a side court, clear of both bridge landings.
const officeOrigin=regions.tree.landmarks.postOffice;
export const postOffice={...officeOrigin,w:6,d:4,yaw:Math.PI/2};
postOffice.entry=boothPoint(postOffice,0,4.8);
// Welcome from the side court, facing the bridge approach rather than the tree.
const hostPoint=boothPoint(postOffice,4.6,3);
export const postOfficeHost={...hostPoint,r:.75,yaw:Math.atan2(regions.tree.anchors.park.x-hostPoint.x,regions.tree.anchors.park.z-hostPoint.z)};
export function boothPoint(p,x,z){const yaw=p.yaw||0;return{x:p.x+x*Math.cos(yaw)+z*Math.sin(yaw),z:p.z-x*Math.sin(yaw)+z*Math.cos(yaw)};}
export const retreatObstacles=[
 {x:postOffice.x,z:postOffice.z,w:postOffice.d/2,d:postOffice.w/2},
 {...boothPoint(postOffice,postOffice.w/2+.8,1.15),r:.37},
 ...[-1,1].map(side=>({...boothPoint(postOffice,side*postOffice.w*.41,postOffice.d/2+.5),r:.18}))
];
export function retreatCanStandAt(x,z,bodyRadius=.35){if(!Number.isFinite(x+z+bodyRadius))return false;return !retreatObstacles.some(o=>o.r?Math.hypot(x-o.x,z-o.z)<o.r+bodyRadius:Math.abs(x-o.x)<o.w+bodyRadius&&Math.abs(z-o.z)<o.d+bodyRadius);}
