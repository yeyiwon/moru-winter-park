import * as T from './vendor/three.module.js';
import {mountainGroundHeight as alpineHeight,mountainDistance,skiRunAt,skiRunCenter,skiRunHalfWidth} from './mountain-layout.js';
const TILE=128,snow=new T.Color('#e1edf3'),piste=new T.Color('#f0f5f8'),rock=new T.Color('#8293a5');
export function tileGeometry(tx,tz,segments){
  const positions=[],colors=[],normals=[],indices=[],n=segments+1,step=TILE/segments;
  for(let j=0;j<=segments;j++)for(let i=0;i<=segments;i++){
   const x=tx*TILE+i*step,z=tz*TILE+j*step,y=alpineHeight(x,z);positions.push(x,y,z);const normal=new T.Vector3(alpineHeight(x-1,z)-alpineHeight(x+1,z),2,alpineHeight(x,z-1)-alpineHeight(x,z+1)).normalize();normals.push(normal.x,normal.y,normal.z);
   const run=skiRunAt(x,z),on=z>=run.startZ&&z<=run.finish&&Math.abs(x-skiRunCenter(z,run.id))<skiRunHalfWidth(z,run.id);
   const grade=Math.hypot(alpineHeight(x+2,z)-alpineHeight(x-2,z),alpineHeight(x,z+2)-alpineHeight(x,z-2))/4;
   const c=snow.clone().lerp(on?piste:rock,on?.78:Math.min(.55,Math.max(0,grade-.65)*.3));colors.push(c.r,c.g,c.b);
   if(i<segments&&j<segments){const cx=x+step/2,cz=z+step/2;if(mountainDistance(cx,cz)>step*.8)continue;const a=j*n+i;indices.push(a,a+n,a+1,a+1,a+n,a+n+1);}
  }
  // Clip boundary triangles to the same implicit outline used by collisions.
  // Keeping an entire edge cell left a rectangular snow shelf beyond the island.
  const clipped=[];for(let i=0;i<indices.length;i+=3){let polygon=indices.slice(i,i+3);const result=[];
   for(let k=0;k<3;k++){const a=polygon[k],b=polygon[(k+1)%3],da=mountainDistance(positions[a*3],positions[a*3+2]),db=mountainDistance(positions[b*3],positions[b*3+2]);if(da<=0)result.push(a);if((da<0)!==(db<0)){const t=da/(da-db),x=positions[a*3]+(positions[b*3]-positions[a*3])*t,z=positions[a*3+2]+(positions[b*3+2]-positions[a*3+2])*t,v=positions.length/3;positions.push(x,alpineHeight(x,z),z);for(let c=0;c<3;c++){colors.push(colors[a*3+c]+(colors[b*3+c]-colors[a*3+c])*t);normals.push(normals[a*3+c]+(normals[b*3+c]-normals[a*3+c])*t);}result.push(v);}}
   for(let j=1;j<result.length-1;j++)clipped.push(result[0],result[j],result[j+1]);}
  indices.length=0;indices.push(...clipped);
  // Skirts hide differences between adjacent LODs without changing the shared collision surface.
  const edges=[Array.from({length:n},(_,i)=>i),Array.from({length:n},(_,i)=>i*n+segments),Array.from({length:n},(_,i)=>segments*n+segments-i),Array.from({length:n},(_,i)=>(segments-i)*n)];
  for(const edge of edges)for(let i=0;i<edge.length-1;i++){const a=edge[i],b=edge[i+1];if(mountainDistance(positions[a*3],positions[a*3+2])>0||mountainDistance(positions[b*3],positions[b*3+2])>0)continue;const base=positions.length/3;for(const v of [a,b]){positions.push(positions[v*3],positions[v*3+1]-10,positions[v*3+2]);colors.push(...colors.slice(v*3,v*3+3));normals.push(...normals.slice(v*3,v*3+3));}indices.push(a,b,base,b,base+1,base);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.setIndex(indices);return geo;
 }
