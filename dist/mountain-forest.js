import {mountainZ,mountainTerraces,ridgeLiftLayout,alpineHeight,mountainDistance,skiRuns,skiRunCenter,skiRunHalfWidth,summit,middleSummit,peakSummit,gondolaPoints,liftLayout,upperLiftLayout} from './mountain-layout.js';
export const forestTileSize=128;
const cache=new Map();
function nearCable(x,z,line){const t=((x-line.x)*line.dx+(z-line.z)*line.dz)/(line.dx**2+line.dz**2);return t>=0&&t<=1&&Math.hypot(x-line.x-t*line.dx,z-line.z-t*line.dz)<12;}
export function mountainTrees(tx,tz){
 const key=tx+':'+tz;if(cache.has(key))return cache.get(key);let seed=((tx+100)*73856093^(tz+100)*19349663)>>>0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},trees=[];
 for(let i=0;i<35;i++){const x=(tx+random())*forestTileSize,z=(tz+random())*forestTileSize,h=6+random()*8;
  if(z> -390||z<mountainZ(-4200)||mountainDistance(x,z)>-25)continue;
  // Forest clusters thin toward the exposed summit; pistes, transfer aprons and cable towers stay clear.
  if(random()>(z<mountainZ(-3200)?.28:.8)*(.55+.45*Math.sin(x*.007+z*.004)**2))continue;
  if(skiRuns.some(r=>z>=r.startZ-25&&z<=r.finish+30&&Math.abs(x-skiRunCenter(z,r.id))<skiRunHalfWidth(z,r.id)+h*.5+8))continue;
  if(mountainTerraces.some(p=>Math.hypot((x-p.x)/(p.rx+12),(z-p.z)/(p.rz+12))<1.2))continue;
  if([liftLayout,upperLiftLayout,ridgeLiftLayout].some(l=>nearCable(x,z,l))||gondolaPoints.some(p=>Math.hypot(p[0]-x,p[2]-z)<24))continue;
  const y=alpineHeight(x,z),grade=Math.hypot(alpineHeight(x+2,z)-alpineHeight(x-2,z),alpineHeight(x,z+2)-alpineHeight(x,z-2))/4;if(grade>1.1)continue;
  trees.push({x,z,y,h,r:h*.03,turn:random()*Math.PI*2});
 }
 if(cache.size>=96)cache.delete(cache.keys().next().value);cache.set(key,trees);return trees;
}
export function mountainTrunkBlocks(x,z,radius){const tx=Math.floor(x/forestTileSize),tz=Math.floor(z/forestTileSize);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const t of mountainTrees(tx+dx,tz+dz))if((x-t.x)**2+(z-t.z)**2<(t.r+radius)**2)return true;return false;}
