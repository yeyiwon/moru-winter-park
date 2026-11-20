import * as T from './vendor/three.module.js';
import {mountainGroundHeight as alpineHeight,mountainDistance,skiRunAt,skiRunCenter,skiRunHalfWidth} from './mountain-layout.js';
const TILE=128,snow=new T.Color('#e1edf3'),piste=new T.Color('#f0f5f8'),rock=new T.Color('#8293a5');
// Every LOD includes the same edge vertices. 480 is divisible by all used
// grids (6/12/24/32/40); their union avoids both cracks and interior T junctions.
export const mountainEdgeFractions=Array.from({length:481},(_,i)=>i).filter(i=>i%12===0||i%15===0||i%20===0).map(i=>i/480);
export function tileGeometry(tx,tz,segments){
  const positions=[],colors=[],normals=[],indices=[],n=segments+1,step=TILE/segments;
  for(let j=0;j<=segments;j++)for(let i=0;i<=segments;i++){
   const x=tx*TILE+i*step,z=tz*TILE+j*step,y=alpineHeight(x,z);positions.push(x,y,z);const normal=new T.Vector3(alpineHeight(x-1,z)-alpineHeight(x+1,z),2,alpineHeight(x,z-1)-alpineHeight(x,z+1)).normalize();normals.push(normal.x,normal.y,normal.z);
   const run=skiRunAt(x,z),on=z>=run.startZ&&z<=run.finish&&Math.abs(x-skiRunCenter(z,run.id))<skiRunHalfWidth(z,run.id);
   const grade=Math.hypot(alpineHeight(x+2,z)-alpineHeight(x-2,z),alpineHeight(x,z+2)-alpineHeight(x,z-2))/4;
   const c=snow.clone().lerp(on?piste:rock,on?.78:Math.min(.55,Math.max(0,grade-.65)*.3));colors.push(c.r,c.g,c.b);
   if(i<segments&&j<segments){const cx=x+step/2,cz=z+step/2;if(mountainDistance(cx,cz)>step*.8)continue;const a=j*n+i;indices.push(a,a+n,a+1,a+1,a+n,a+n+1);}
  }
  const refined=[],edgeVertices=new Map();
  function point(x,z){
   const key=x+':'+z;if(edgeVertices.has(key))return edgeVertices.get(key);
   const id=positions.length/3,y=alpineHeight(x,z),nx=alpineHeight(x-1,z)-alpineHeight(x+1,z),nz=alpineHeight(x,z-1)-alpineHeight(x,z+1),length=Math.hypot(nx,2,nz);
   positions.push(x,y,z);normals.push(nx/length,2/length,nz/length);
   const run=skiRunAt(x,z),on=z>=run.startZ&&z<=run.finish&&Math.abs(x-skiRunCenter(z,run.id))<skiRunHalfWidth(z,run.id),grade=Math.hypot(nx,nz)/2,c=snow.clone().lerp(on?piste:rock,on?.78:Math.min(.55,Math.max(0,grade-.65)*.3));colors.push(c.r,c.g,c.b);edgeVertices.set(key,id);return id;
  }
  for(let i=0;i<indices.length;i+=3){const triangle=indices.slice(i,i+3),polygon=[];
   for(let k=0;k<3;k++){
    const a=triangle[k],b=triangle[(k+1)%3],ax=positions[a*3],az=positions[a*3+2],bx=positions[b*3],bz=positions[b*3+2];polygon.push(a);
    const vertical=ax===bx&&(ax===tx*TILE||ax===(tx+1)*TILE),horizontal=az===bz&&(az===tz*TILE||az===(tz+1)*TILE);
    if(!vertical&&!horizontal)continue;
    const from=vertical?az:ax,to=vertical?bz:bx,origin=(vertical?tz:tx)*TILE;
    const values=mountainEdgeFractions.map(t=>origin+t*TILE).filter(v=>v>Math.min(from,to)+1e-7&&v<Math.max(from,to)-1e-7);if(to<from)values.reverse();
    for(const v of values)polygon.push(point(vertical?ax:v,vertical?v:az));
   }
   if(polygon.length===3){refined.push(...triangle);continue;}
   const cx=triangle.reduce((n,v)=>n+positions[v*3],0)/3,cz=triangle.reduce((n,v)=>n+positions[v*3+2],0)/3,center=point(cx,cz);
   for(let k=0;k<polygon.length;k++)refined.push(center,polygon[k],polygon[(k+1)%polygon.length]);
  }
  indices.length=0;indices.push(...refined);
  // Clip boundary triangles to the same implicit outline used by collisions.
  // Keeping an entire edge cell left a rectangular snow shelf beyond the island.
  const clipped=[];for(let i=0;i<indices.length;i+=3){let polygon=indices.slice(i,i+3);const result=[];
   for(let k=0;k<3;k++){const a=polygon[k],b=polygon[(k+1)%3],da=mountainDistance(positions[a*3],positions[a*3+2]),db=mountainDistance(positions[b*3],positions[b*3+2]);if(da<=0)result.push(a);if((da<0)!==(db<0)){const t=da/(da-db),x=positions[a*3]+(positions[b*3]-positions[a*3])*t,z=positions[a*3+2]+(positions[b*3+2]-positions[a*3+2])*t,v=positions.length/3;positions.push(x,alpineHeight(x,z),z);for(let c=0;c<3;c++){colors.push(colors[a*3+c]+(colors[b*3+c]-colors[a*3+c])*t);normals.push(normals[a*3+c]+(normals[b*3+c]-normals[a*3+c])*t);}result.push(v);}}
   for(let j=1;j<result.length-1;j++)clipped.push(result[0],result[j],result[j+1]);}
  indices.length=0;indices.push(...clipped);
  // Shared edge samples meet exactly; vertical skirts would add false walls.
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.setIndex(indices);return geo;
 }
