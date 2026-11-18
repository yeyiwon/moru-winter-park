import {ferrisDimensions,ferrisGroundPoint} from './ferris-layout.js';
// Props, collision and the walking network share the same authored layout.
export const carouselLayout={x:16,z:3.8,scale:1,r:7};
export const parkStalls=[{x:-32,z:15,yaw:0,kind:'popcorn'},{x:-24,z:15,yaw:0,kind:'candy'},{x:-16,z:15,yaw:0,kind:'waffle'}];
export const stallEntrance=kind=>{const stall=parkStalls.find(p=>p.kind===kind);return{x:stall.x+Math.sin(stall.yaw)*3.5,z:stall.z+Math.cos(stall.yaw)*3.5};};
export const parkBenches=[{x:-5,z:14,yaw:0},{x:13,z:19,yaw:0},{x:30,z:-5,yaw:-Math.PI/2},{x:-25,z:-8,yaw:.5}];
export const parkLamps=[...[-1,1].flatMap(side=>[28,9,2,-11.5].map(z=>({x:side*3.8,z}))),...[-1,1].map(side=>ferrisGroundPoint(side*5.4,11)),{x:-15,z:8},{x:30,z:18},{x:22,z:-12},{x:-27,z:29}];
export const sparklerKiosk={x:-24,z:-14,yaw:.8};
export const sparklerEntrance={x:sparklerKiosk.x+Math.sin(sparklerKiosk.yaw)*3.7,z:sparklerKiosk.z+Math.cos(sparklerKiosk.yaw)*3.7};
export const balloonCart={x:8,z:20,yaw:-.35};
export const parkFountain={x:-5,z:20};
export const parkObstacles=[
 {x:carouselLayout.x,z:carouselLayout.z,r:carouselLayout.r},{x:ferrisDimensions.center.x,z:ferrisDimensions.center.z,r:6},
 ...parkStalls.map(p=>({x:p.x,z:p.z,r:2.6})),...parkBenches.map(p=>({x:p.x,z:p.z,r:2.1})),
 ...parkLamps.map(p=>({x:p.x,z:p.z,r:.43})),{x:-24,z:-14,r:2.4},{...balloonCart,r:1.35},
 {...parkFountain,rx:2.1,rz:1.1}
];
const p=point=>[point.x,point.z];
export const ferrisForecourt=ferrisGroundPoint(0,15);
// A front-facing boarding branch meets the promenade before any support column.
// The market counters open onto the southern loop, with a separate central shortcut.
export const parkWalkways=[
 {width:5.5,points:[[0,26],[0,13],[0,-7]]},
 {width:5,points:[[0,26],[-10,25],[-27,25],[-38,22],[-43,15],p(ferrisForecourt)]},
 {width:4.6,points:[p(ferrisForecourt),p(ferrisDimensions.entrance)]},
 {width:5,points:[p(ferrisForecourt),[-30,8],[-22,3],[-12,-3],[0,-7]]},
 {width:4.4,points:[[-10,25],[-10,17],[-10,9],[-12,-3]]},
 {width:5,points:[[0,-7],[8,-6],[22,-6],[27,1],[26,14],[19,23],[0,26]]},
 {width:4.4,points:[[0,14],[16,14],[26,14]]},
 {width:3,points:[[16,14],[16,12.2]]},
 ...parkStalls.map(stall=>({width:3,points:[[stall.x,25],p(stallEntrance(stall.kind))]}))
];

// Aim between the rider and the horse, with a stable horizon rather than following saddle bob.
export function carouselCameraView(seat,mobile=false){
 const outward=Math.atan2(seat.x-carouselLayout.x,seat.z-carouselLayout.z);
 return{distance:mobile?11.2:9.1,yaw:outward-.3,pitch:.22,fov:mobile?55:48,lookHeight:2.85-seat.y-1.2};
}
