export const festivalLayout={x:-63,z:0,r:25,teacups:{x:-63,z:-10,r:5},bumper:{x:-72,z:7,w:7,d:5},train:{x:-54,z:6,rx:7.4,rz:4.8}};
export const festivalDestinations=[
 {id:'teacups',name:'회전 컵',x:-63,z:-3.9,kind:'ride'},
 {id:'bumper',name:'범퍼카',x:-72,z:10.8,kind:'ride'},
 {id:'train',name:'겨울 기차',x:-54,z:12.4,kind:'ride'},
 {id:'festival-photo',name:'겨울 포토존',x:-75,z:-6.1,kind:'photo'},
 {id:'candyfloss',name:'솜사탕',x:-77,z:-13,kind:'snack'},
];
export const festivalLamps=[[-43,-8],[-46,16],[-60,18],[-76,17],[-82,3],[-79,-16],[-65,-19],[-50,-13]].map(([x,z])=>({x,z}));
export const festivalObstacles=[...festivalLamps.map(p=>({...p,r:.43})),
 {x:-63,z:-10,r:5},{x:-72,z:7,rx:3.8,rz:2.8},{x:-54,z:6,rx:8.2,rz:5.5},
 {x:-77,z:-15,rx:1.75,rz:1.1},{x:-77.2,z:-8,r:.16},{x:-72.8,z:-8,r:.16},
 ...[-55.6,-52.4].flatMap(x=>[12.7,13.9].map(z=>({x,z,r:.15}))),{x:-54,z:13.5,rx:1.3,rz:.35},
];
export function amusementPositionValid(x,y,z,mode){
 if(!Number.isFinite(x+y+z))return false;
 if(mode==='carousel')return Math.hypot(x-16,z-3.8)<5&&y>2.4&&y<4.4;
 if(mode==='ferris')return Math.abs(x+18)<11.5&&Math.abs(z+5)<2.2&&y>1.5&&y<25.6;
 if(mode==='teacups')return Math.hypot(x+63,z+10)<5&&y>1&&y<3;
 if(mode==='bumper')return Math.abs(x+72)<4&&Math.abs(z-7)<3&&y>1&&y<2.8;
 if(mode==='train')return ((x+54)/9)**2+((z-6)/6)**2<1.3&&y>1&&y<3;
 return false;
}
