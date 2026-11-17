import * as T from './vendor/three.module.js';
// Static batching leaves hundreds of thousands of triangles in a single mesh.
// A local-space grid keeps camera sweeps precise without scanning the whole island.
const grids=new WeakMap(),cell=8,inv=new T.Matrix4(),ray=new T.Ray(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),hit=new T.Vector3(),world=new T.Vector3(),end=new T.Vector3();
const key=(x,y,z)=>x+','+y+','+z;
function gridFor(geometry){
 let grid=grids.get(geometry);if(grid)return grid;
 const positions=geometry.attributes.position,index=geometry.index,count=(index?.count||positions.count)/3,buckets=new Map(),large=[];
 for(let triangle=0;triangle<count;triangle++){
  const first=triangle*3;a.fromBufferAttribute(positions,index?index.getX(first):first);b.fromBufferAttribute(positions,index?index.getX(first+1):first+1);c.fromBufferAttribute(positions,index?index.getX(first+2):first+2);
  const low=[Math.floor(Math.min(a.x,b.x,c.x)/cell),Math.floor(Math.min(a.y,b.y,c.y)/cell),Math.floor(Math.min(a.z,b.z,c.z)/cell)],high=[Math.floor(Math.max(a.x,b.x,c.x)/cell),Math.floor(Math.max(a.y,b.y,c.y)/cell),Math.floor(Math.max(a.z,b.z,c.z)/cell)];
  if((high[0]-low[0]+1)*(high[1]-low[1]+1)*(high[2]-low[2]+1)>64){large.push(triangle);continue;}
  for(let x=low[0];x<=high[0];x++)for(let y=low[1];y<=high[1];y++)for(let z=low[2];z<=high[2];z++){const id=key(x,y,z);let list=buckets.get(id);if(!list)buckets.set(id,list=[]);list.push(triangle);}
 }
 grid={buckets,large};grids.set(geometry,grid);return grid;
}
export function nearestCameraSurface(object,raycaster){
 const geometry=object.geometry,material=object.material,count=(geometry.index?.count||geometry.attributes.position.count)/3;
 if(count<12000||object.isInstancedMesh||Array.isArray(material)||object.isSkinnedMesh||geometry.morphAttributes.position?.length)return raycaster.intersectObject(object,false)[0]||null;
 inv.copy(object.matrixWorld).invert();ray.copy(raycaster.ray).applyMatrix4(inv);if(!geometry.boundingBox)geometry.computeBoundingBox();if(!ray.intersectsBox(geometry.boundingBox))return null;
 end.copy(raycaster.ray.origin).addScaledVector(raycaster.ray.direction,raycaster.far).applyMatrix4(inv);const far=end.distanceTo(ray.origin);if(!Number.isFinite(far))return raycaster.intersectObject(object,false)[0]||null;
 const grid=gridFor(geometry),ids=new Set(grid.large),origin=ray.origin.toArray(),direction=ray.direction.toArray(),cursor=origin.map(v=>Math.floor(v/cell)),step=direction.map(Math.sign),delta=direction.map(v=>v?Math.abs(cell/v):Infinity),next=direction.map((v,i)=>v?((cursor[i]+(v>0?1:0))*cell-origin[i])/v:Infinity);
 let travelled=0;
 while(travelled<=far){for(const id of grid.buckets.get(key(...cursor))||[])ids.add(id);const axis=next[0]<next[1]?(next[0]<next[2]?0:2):(next[1]<next[2]?1:2);travelled=next[axis];cursor[axis]+=step[axis];next[axis]+=delta[axis];}
 const positions=geometry.attributes.position,index=geometry.index;let closest=null;
 for(const triangle of ids){const first=triangle*3;a.fromBufferAttribute(positions,index?index.getX(first):first);b.fromBufferAttribute(positions,index?index.getX(first+1):first+1);c.fromBufferAttribute(positions,index?index.getX(first+2):first+2);const point=material.side===T.BackSide?ray.intersectTriangle(c,b,a,true,hit):ray.intersectTriangle(a,b,c,material.side!==T.DoubleSide,hit);if(!point)continue;world.copy(point).applyMatrix4(object.matrixWorld);const distance=world.distanceTo(raycaster.ray.origin);if(distance>=raycaster.near&&distance<=raycaster.far&&(!closest||distance<closest.distance))closest={object,distance,point:world.clone()};}
 return closest;
}
