import * as T from './vendor/three.module.js';
const batchCenter=new T.Vector3();
// A material shared across an entire mountain produces one enormous bounding
// sphere. Spatial batches let Three's frustum and shadow culling reject it in parts.
export function spatialBatchKey(mesh,size=128){
 if(!mesh.geometry.boundingSphere)mesh.geometry.computeBoundingSphere();
 batchCenter.copy(mesh.geometry.boundingSphere.center).applyMatrix4(mesh.matrixWorld);
 return Math.floor(batchCenter.x/size)+':'+Math.floor(batchCenter.z/size);
}
// Preserve each source's shared vertices. Expanding every indexed triangle into
// three vertices made decorative spheres and tubes several times more costly.
export function mergeMeshGeometry(items,{world=true,relativeTo=null}={}){
 let vertices=0,indices=0;for(const item of items){vertices+=item.geometry.attributes.position.count;indices+=item.geometry.index?.count||item.geometry.attributes.position.count;}
 const result=new T.BufferGeometry(),attributes={position:new Float32Array(vertices*3),normal:new Float32Array(vertices*3),uv:new Float32Array(vertices*2)},index=vertices>65535?new Uint32Array(indices):new Uint16Array(indices);
 let vertexOffset=0,indexOffset=0;
 for(const item of items){
  if(!world)item.updateMatrix();const matrix=relativeTo?new T.Matrix4().multiplyMatrices(relativeTo,item.matrixWorld):world?item.matrixWorld:item.matrix,geometry=item.geometry.clone().applyMatrix4(matrix),count=geometry.attributes.position.count;
  if(!geometry.attributes.normal)geometry.computeVertexNormals();
  for(const [name,array]of Object.entries(attributes))if(geometry.attributes[name])array.set(geometry.attributes[name].array,vertexOffset*(name==='uv'?2:3));
  const source=geometry.index?.array,length=source?.length||count;for(let i=0;i<length;i++)index[indexOffset+i]=vertexOffset+(source?source[i]:i);
  indexOffset+=length;vertexOffset+=count;geometry.dispose();
 }
 for(const [name,array]of Object.entries(attributes))result.setAttribute(name,new T.BufferAttribute(array,name==='uv'?2:3));
 result.setIndex(new T.BufferAttribute(index,1));result.computeBoundingBox();result.computeBoundingSphere();return result;
}

// Authored landmark parts already have their transforms baked in. Retain their
// indices and per-part paint; merging must not smooth normals or erase UV seams.
export function mergePaintedGeometry(parts,{paint=true}={}){
 const vertices=parts.reduce((n,p)=>n+p.geometry.attributes.position.count,0),indices=parts.reduce((n,p)=>n+(p.geometry.index?.count||p.geometry.attributes.position.count),0);
 const geometry=new T.BufferGeometry(),arrays={position:new Float32Array(vertices*3),normal:new Float32Array(vertices*3),uv:new Float32Array(vertices*2)},colors=paint?new Float32Array(vertices*3):null,index=vertices>65535?new Uint32Array(indices):new Uint16Array(indices);
 let vertex=0,element=0;
 for(const {geometry:g,color}of parts){const count=g.attributes.position.count;for(const [key,target]of Object.entries(arrays))target.set(g.attributes[key].array,vertex*(key==='uv'?2:3));if(colors)for(let i=vertex;i<vertex+count;i++){colors[i*3]=color.r;colors[i*3+1]=color.g;colors[i*3+2]=color.b;}const source=g.index?.array,n=source?.length||count;for(let i=0;i<n;i++)index[element+i]=vertex+(source?source[i]:i);vertex+=count;element+=n;}
 for(const [key,array]of Object.entries(arrays))geometry.setAttribute(key,new T.BufferAttribute(array,key==='uv'?2:3));if(colors)geometry.setAttribute('color',new T.BufferAttribute(colors,3));geometry.setIndex(new T.BufferAttribute(index,1));geometry.computeBoundingSphere();geometry.computeBoundingBox();return geometry;
}
