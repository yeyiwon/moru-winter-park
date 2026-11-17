import fs from 'node:fs';
import path from 'node:path';
import * as T from '../dist/vendor/three.module.js';
import {buildCarousel} from '../dist/carousel-model.js';
const out=path.resolve('qa/asset-review');fs.mkdirSync(out,{recursive:true});
const c=buildCarousel({sculpted:!process.argv.includes('--source')});c.update(0,true);c.root.updateMatrixWorld(true);
const geometries={},materials={},objects=[],nodes=[];
c.root.traverse(o=>{if(!o.isMesh&&!o.isLight)nodes.push({id:o.uuid,name:o.name,parent:o.parent?.uuid||null,matrix:o.matrix.toArray()});});
c.root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry,m=o.material;
 if(!geometries[g.uuid])geometries[g.uuid]={positions:Array.from(g.attributes.position.array),normals:Array.from(g.attributes.normal.array),uv:Array.from(g.attributes.uv.array),colors:g.attributes.color?Array.from(g.attributes.color.array):null,indices:g.index?Array.from(g.index.array):null};
 if(!materials[m.uuid])materials[m.uuid]={name:m.name||m.color.getHexString(),color:m.color.toArray(),roughness:m.roughness??.8,metalness:m.metalness??0,emission:m.isMeshBasicMaterial?m.color.toArray():[0,0,0],vertexColors:m.vertexColors||false};
 if(o.isInstancedMesh)for(let i=0;i<o.count;i++){const matrix=new T.Matrix4();o.getMatrixAt(i,matrix);matrix.premultiply(o.matrix);objects.push({name:o.name+'-'+i,parent:o.parent?.uuid||null,geometry:g.uuid,material:m.uuid,matrix:matrix.toArray()});}
 else objects.push({name:o.name,parent:o.parent?.uuid||null,geometry:g.uuid,material:m.uuid,matrix:o.matrix.toArray()});
});
const sockets=c.seats.map(s=>({name:s.name,matrix:s.matrixWorld.toArray()}));
fs.writeFileSync(path.join(out,'carousel-v3.json'),JSON.stringify({geometries,materials,objects,sockets,nodes}));
console.log({exported:'qa/asset-review/carousel-v3.json',objects:objects.length,geometry: Object.keys(geometries).length});
