import * as T from './vendor/three.module.js';
// Preserve each source's shared vertices. Expanding every indexed triangle into
// three vertices made decorative spheres and tubes several times more costly.
export function mergeMeshGeometry(items,{world=true}={}){
 let vertices=0,indices=0;for(const item of items){vertices+=item.geometry.attributes.position.count;indices+=item.geometry.index?.count||item.geometry.attributes.position.count;}
 const result=new T.BufferGeometry(),attributes={position:new Float32Array(vertices*3),normal:new Float32Array(vertices*3),uv:new Float32Array(vertices*2)},index=vertices>65535?new Uint32Array(indices):new Uint16Array(indices);
 let vertexOffset=0,indexOffset=0;
 for(const item of items){
  if(!world)item.updateMatrix();const geometry=item.geometry.clone().applyMatrix4(world?item.matrixWorld:item.matrix),count=geometry.attributes.position.count;
  for(const [name,array]of Object.entries(attributes))array.set(geometry.attributes[name].array,vertexOffset*(name==='uv'?2:3));
  const source=geometry.index?.array,length=source?.length||count;for(let i=0;i<length;i++)index[indexOffset+i]=vertexOffset+(source?source[i]:i);
  indexOffset+=length;vertexOffset+=count;geometry.dispose();
 }
 for(const [name,array]of Object.entries(attributes))result.setAttribute(name,new T.BufferAttribute(array,name==='uv'?2:3));
 result.setIndex(new T.BufferAttribute(index,1));result.computeBoundingBox();result.computeBoundingSphere();return result;
}
