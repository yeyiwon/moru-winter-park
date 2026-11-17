import {ferrisDimensions} from './ferris-layout.js';
import {regions} from './region-layout.js';
// Props, collision and the walking network share the same authored layout.
export const carouselLayout={x:16,z:3.8,scale:1,r:7};
export const parkStalls=[{x:-32,z:15,yaw:0,kind:'popcorn'},{x:-24,z:15,yaw:0,kind:'candy'},{x:-16,z:15,yaw:0,kind:'waffle'}];
export const stallEntrance=kind=>{const stall=parkStalls.find(p=>p.kind===kind);return{x:stall.x,z:stall.z+3.5};};
export const parkBenches=[{x:-7,z:14,yaw:0},{x:11,z:17,yaw:0},{x:26,z:-6,yaw:-Math.PI/2},{x:-22,z:-9,yaw:.5}];
export const parkLamps=[...[-1,1].flatMap(side=>[28,9,2,-7].map(z=>({x:side*3.8,z}))),{x:-12,z:12},{x:-27,z:3},{x:24,z:11},{x:22,z:-12}];
export const parkObstacles=[
 {x:carouselLayout.x,z:carouselLayout.z,r:carouselLayout.r},{x:ferrisDimensions.center.x,z:ferrisDimensions.center.z,r:6},
 ...parkStalls.map(p=>({x:p.x,z:p.z,r:2.6})),...parkBenches.map(p=>({x:p.x,z:p.z,r:1.5})),
 ...parkLamps.map(p=>({x:p.x,z:p.z,r:.43})),{x:-24,z:-14,r:2.4},{x:8,z:17,r:1.35},
 {x:-8,z:18,rx:2.1,rz:1.1}
];
export const parkWalkways=[
 {width:5.5,points:[[0,30],[0,19],[0,6],[0,-10]]},
 {width:4.2,points:[[0,16],[-5,11],[-9,5],[-10,-4],[-7,-9],[0,-9]]},
 {width:5,points:[[0,24],[-9,22],[-22,21],[-34,21],[-42,18],[-45,14]]},
 {width:4.4,points:[[-34,21],[-36,14],[-37,4]]},
 {width:3.6,points:[[0,12],[7,12],[15,12],[23,9],[24,2],[21,-4],[12,-6],[6,-5],[0,-5]]},
 {width:3.4,points:[[0,18],[8,21],[18,21],[24,21]]},
 {width:3,points:[[-10,-5],[-16,-7],[-19,-11],[-19,-19],[-22,-20]]}
];

// Aim between the rider and the horse, with a stable horizon rather than following saddle bob.
export function carouselCameraView(seat,mobile=false){
 const outward=Math.atan2(seat.x-carouselLayout.x,seat.z-carouselLayout.z);
 return{distance:mobile?11.2:9.1,yaw:outward-.3,pitch:.22,fov:mobile?55:48,lookHeight:2.85-seat.y-1.2};
}
