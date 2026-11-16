// Props, collision and the walking network share the same authored layout.
export const carouselLayout={x:16,z:3.8,scale:1.25,r:5.1};
export const parkStalls=[{x:-24,z:14,yaw:.7,kind:'popcorn'},{x:-14,z:22,yaw:.4,kind:'candy'},{x:-7,z:24,yaw:0,kind:'waffle'}];
export const parkBenches=[{x:-7,z:14,yaw:0},{x:11,z:17,yaw:0},{x:26,z:-6,yaw:-Math.PI/2},{x:-7,z:-12,yaw:.5}];
export const parkLamps=[...[-1,1].flatMap(side=>[22,9,2,-7].map(z=>({x:side*3.8,z}))),{x:-12,z:12},{x:-27,z:3},{x:24,z:11},{x:22,z:-12}];
export const parkObstacles=[
 {x:carouselLayout.x,z:carouselLayout.z,r:carouselLayout.r},{x:-18,z:-5,r:6},
 ...parkStalls.map(p=>({x:p.x,z:p.z,r:2.6})),...parkBenches.map(p=>({x:p.x,z:p.z,r:1.5})),
 ...parkLamps.map(p=>({x:p.x,z:p.z,r:.43})),{x:-24,z:-14,r:2.4},{x:8,z:17,r:1.35},
 {x:27,z:9,rx:2.7,rz:1.35},{x:-14,z:10,rx:2.1,rz:1.1}
];
export const parkWalkways=[
 {width:5.5,points:[[0,30],[0,19],[0,6],[0,-10]]},
 {width:4.2,points:[[0,16],[-5,11],[-9,5],[-10,-4],[-7,-9],[0,-9]]},
 {width:3.4,points:[[0,17],[-5,20],[-9,18],[-15,16],[-18,12],[-23,7],[-24,2]]},
 {width:3.2,points:[[0,28],[-7,28.5],[-12,26.5]]},
 {width:3.6,points:[[0,12],[7,12],[15,12],[23,9],[24,2],[21,-4],[12,-6],[6,-5],[0,-5]]},
 {width:3.4,points:[[0,18],[8,21],[18,21],[24,17],[27,14]]},
 {width:3,points:[[-10,-5],[-11,-12],[-18,-17],[-22,-17]]}
];
