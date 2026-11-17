export const festivalLayout={x:-63,z:0,r:25};
export const festivalDestinations=[
 {id:'festival-photo',name:'겨울 포토존',x:-65,z:8,kind:'photo',view:{distance:13,pitch:.18,yaw:-1.4,lookHeight:-.3}},
 {id:'candyfloss',name:'솜사탕',x:-77,z:-13,kind:'snack'},
];
export const festivalLamps=[[-43,-8],[-44,18],[-60,24],[-76,17],[-82,3],[-79,-16],[-65,-19],[-50,-13]].map(([x,z])=>({x,z}));
export const festivalObstacles=[...festivalLamps.map(p=>({...p,r:.43})),
 ...[-71,-61].flatMap(x=>[-8,16].map(z=>({x,z,w:2.25,d:.55}))),{x:-77,z:-15,rx:1.75,rz:1.1},{x:-77.2,z:-8,r:.16},{x:-72.8,z:-8,r:.16},
];
export function amusementPositionValid(x,y,z,mode){
 if(!Number.isFinite(x+y+z))return false;
 if(mode==='carousel')return Math.hypot(x-16,z-3.8)<5&&y>2.4&&y<4.4;
 if(mode==='ferris')return x>-33&&x< -2&&z> -4.5&&z<.5&&y>1&&y<29;
 return false;
}
