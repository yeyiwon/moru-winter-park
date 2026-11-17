import * as T from './vendor/three.module.js';
// Small contiguous triangle blocks retain model locality after static batching.
// Their bounds form a BVH: a sweep visits nearby blocks instead of building a
// per-triangle spatial hash or scanning every triangle on each camera turn.
const trees=new WeakMap(),blockSize=64,inv=new T.Matrix4(),ray=new T.Ray(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),hit=new T.Vector3(),world=new T.Vector3(),end=new T.Vector3();
function treeFor(geometry){
 const position=geometry.attributes.position,index=geometry.index,p=position.array,indices=index?.array;
 let tree=trees.get(geometry);if(tree&&tree.position===position&&tree.version===position.version&&tree.index===index&&tree.indexVersion===index?.version)return tree;
 const triangles=Math.floor((index?.count||position.count)/3),blocks=[];
 for(let start=0;start<triangles;start+=blockSize){
  const finish=Math.min(triangles,start+blockSize),bounds=[Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity];
  for(let v=start*3;v<finish*3;v++){const offset=(indices?indices[v]:v)*3;for(let axis=0;axis<3;axis++){const value=p[offset+axis];if(value<bounds[axis])bounds[axis]=value;if(value>bounds[axis+3])bounds[axis+3]=value;}}
  blocks.push({bounds,start,finish});
 }
 function branch(items){
  if(items.length===1)return items[0];
  const bounds=[Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity];for(const item of items)for(let axis=0;axis<3;axis++){if(item.bounds[axis]<bounds[axis])bounds[axis]=item.bounds[axis];if(item.bounds[axis+3]>bounds[axis+3])bounds[axis+3]=item.bounds[axis+3];}
  let axis=0;for(let i=1;i<3;i++)if(bounds[i+3]-bounds[i]>bounds[axis+3]-bounds[axis])axis=i;
  items.sort((x,y)=>(x.bounds[axis]+x.bounds[axis+3])-(y.bounds[axis]+y.bounds[axis+3]));const middle=items.length>>1;
  return{bounds,left:branch(items.slice(0,middle)),right:branch(items.slice(middle))};
 }
 tree={root:blocks.length?branch(blocks):null,position,version:position.version,index,indexVersion:index?.version};trees.set(geometry,tree);return tree;
}
function entry(bounds,origin,direction,far){
 let near=0;for(let axis=0;axis<3;axis++){const lo=bounds[axis]-.000001,hi=bounds[axis+3]+.000001,o=origin[axis],d=direction[axis];if(Math.abs(d)<1e-14){if(o<lo||o>hi)return Infinity;continue;}let first=(lo-o)/d,last=(hi-o)/d;if(first>last){const swap=first;first=last;last=swap;}near=Math.max(near,first);far=Math.min(far,last);if(near>far)return Infinity;}return near;
}
export function nearestCameraSurface(object,raycaster){
 const geometry=object.geometry,material=object.material,position=geometry.attributes.position,index=geometry.index,count=(index?.count||position.count)/3;
 if(count<256||object.isInstancedMesh||Array.isArray(material)||object.isSkinnedMesh||geometry.morphAttributes.position?.length||position.isInterleavedBufferAttribute)return raycaster.intersectObject(object,false)[0]||null;
 inv.copy(object.matrixWorld).invert();ray.copy(raycaster.ray).applyMatrix4(inv);
 if(!geometry.boundingBox)geometry.computeBoundingBox();if(!ray.intersectsBox(geometry.boundingBox))return null;
 end.copy(raycaster.ray.origin).add(raycaster.ray.direction).applyMatrix4(inv);const scale=end.distanceTo(ray.origin);let far=raycaster.far*scale;
 const root=treeFor(geometry).root;if(!root)return null;
 const origin=ray.origin.toArray(),direction=ray.direction.toArray(),stack=[root],p=position.array,indices=index?.array;
 const begin=geometry.drawRange.start,finish=Math.min(index?.count||position.count,begin+geometry.drawRange.count);let closest=null;
 while(stack.length){const node=stack.pop();if(entry(node.bounds,origin,direction,far)===Infinity)continue;
  if(node.left){const left=entry(node.left.bounds,origin,direction,far),right=entry(node.right.bounds,origin,direction,far);if(left<right){if(right!==Infinity)stack.push(node.right);if(left!==Infinity)stack.push(node.left);}else{if(left!==Infinity)stack.push(node.left);if(right!==Infinity)stack.push(node.right);}continue;}
  for(let triangle=node.start;triangle<node.finish;triangle++){
   const first=triangle*3;if(first<begin||first+2>=finish)continue;
   a.fromArray(p,(indices?indices[first]:first)*3);b.fromArray(p,(indices?indices[first+1]:first+1)*3);c.fromArray(p,(indices?indices[first+2]:first+2)*3);
   const point=material.side===T.BackSide?ray.intersectTriangle(c,b,a,true,hit):ray.intersectTriangle(a,b,c,material.side!==T.DoubleSide,hit);if(!point)continue;
   world.copy(point).applyMatrix4(object.matrixWorld);const distance=world.distanceTo(raycaster.ray.origin);
   if(distance>=raycaster.near&&distance<=raycaster.far&&(!closest||distance<closest.distance)){closest={object,distance,point:world.clone()};far=distance*scale;}
  }
 }
 return closest;
}
