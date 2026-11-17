export const festivalLayout={x:-63,z:0,r:25,teacups:{x:-63,z:-10,r:5},bumper:{x:-57,z:13,w:20,d:14}};
export const festivalDestinations=[
 {id:'teacups',name:'회전 컵',x:-63,z:-3.9,kind:'ride'},
 {id:'bumper',name:'범퍼카',x:-57,z:21.3,kind:'ride'},
 {id:'festival-photo',name:'겨울 포토존',x:-75,z:-6.1,kind:'photo'},
 {id:'candyfloss',name:'솜사탕',x:-77,z:-13,kind:'snack'},
];
export const festivalLamps=[[-43,-8],[-44,18],[-60,24],[-76,17],[-82,3],[-79,-16],[-65,-19],[-50,-13]].map(([x,z])=>({x,z}));
export const festivalObstacles=[...festivalLamps.map(p=>({...p,r:.43})),
 {x:-63,z:-10,r:5},{x:-57,z:13,w:10.2,d:7.2},
 {x:-77,z:-15,rx:1.75,rz:1.1},{x:-77.2,z:-8,r:.16},{x:-72.8,z:-8,r:.16},
];
export function amusementPositionValid(x,y,z,mode){
 if(!Number.isFinite(x+y+z))return false;
 if(mode==='carousel')return Math.hypot(x-16,z-3.8)<5&&y>2.4&&y<4.4;
 if(mode==='ferris')return Math.abs(x+18)<11.5&&Math.abs(z+5)<2.2&&y>1.5&&y<25.6;
 if(mode==='teacups')return Math.hypot(x+63,z+10)<5&&y>1&&y<3;
 if(mode==='bumper')return Math.abs(x+57)<9.3&&Math.abs(z-13)<6.3&&y>1&&y<2.8;
 return false;
}
