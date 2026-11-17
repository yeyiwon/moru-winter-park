// One architectural footprint keeps the stonework, promenade and collision in agreement.
export const castleLayout=Object.freeze({
 x:0,z:-14,width:34.6,height:45.5,
 passage:Object.freeze({x:0,z:-18,halfWidth:4.25,height:7.2,frontZ:-8,backZ:-27}),
 plaza:Object.freeze({x:0,z:-3,rx:19,rz:12}),
});
export const castleTowers=Object.freeze([
 {x:0,z:-5,r:2.55,base:22,height:14,roof:7.9,central:true},
 {x:-7.2,z:-6.5,r:1.65,base:0,height:25,roof:6.3},
 {x:7.2,z:-6.5,r:1.65,base:0,height:25,roof:6.3},
 {x:-14,z:-2.5,r:2.15,base:0,height:16.5,roof:6.6},
 {x:14,z:-2.5,r:2.15,base:0,height:16.5,roof:6.6},
 {x:-10.2,z:-8,r:1.15,base:12.6,height:6.8,roof:4.8},
 {x:10.2,z:-8,r:1.15,base:12.6,height:6.8,roof:4.8},
 {x:-3.2,z:-4,r:.88,base:22.8,height:6.1,roof:4.2},
 {x:3.2,z:-4,r:.88,base:22.8,height:6.1,roof:4.2},
]);
// w/d are half extents, matching the world's movement obstacles.
export const castleObstacles=[-1,1].flatMap(side=>[
 {x:side*8.05,z:-18.2,w:3.55,d:5.6},
 {x:side*14,z:-16.5,r:2.38},
 {x:side*7.2,z:-20.5,r:1.85},
]);

export const castleView=Object.freeze({distance:42,yaw:.33,pitch:.04,lookHeight:10,fov:56});
