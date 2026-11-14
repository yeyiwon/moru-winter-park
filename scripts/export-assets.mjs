// Export the actual app meshes for offline asset inspection. No browser/GPU emulation.
import fs from 'node:fs';import path from 'node:path';
const out=path.resolve('qa/asset-review');fs.mkdirSync(out,{recursive:true});
const gradient=()=>({addColorStop(){}});
globalThis.document={createElement:()=>({width:128,height:128,getContext:()=>({fillRect(){},createRadialGradient:gradient,createLinearGradient:gradient})})};
const T=await import('../dist/vendor/three.module.js'),{buildWorld}=await import('../dist/themepark-world.js'),{createCompanion}=await import('../dist/companion.js');
function exportScene(scene,name){scene.updateMatrixWorld(true);const geometries={},materials={},objects=[],lights=[];scene.traverseVisible(o=>{
 if(o.isLight){lights.push({type:o.type,color:o.color.toArray(),intensity:o.intensity,position:o.getWorldPosition(new T.Vector3()).toArray()});return;}
 if(!o.isMesh||!o.visible||o.material.opacity===0||(o.material.isShaderMaterial&&o.geometry.type!=='CircleGeometry')||Array.isArray(o.material))return;
 const g=o.geometry,m=o.material.isShaderMaterial?new T.MeshStandardMaterial({color:'#273951',roughness:.2,metalness:.4}):o.material;if(!geometries[g.uuid])geometries[g.uuid]={positions:Array.from(g.attributes.position.array),normals:g.attributes.normal?Array.from(g.attributes.normal.array):null,indices:g.index?Array.from(g.index.array):null};
 if(!materials[m.uuid])materials[m.uuid]={color:m.color?.toArray()||[.2,.3,.4],roughness:m.roughness??.8,metalness:m.metalness??0,sheen:m.sheen??0,clearcoat:m.clearcoat??0,emissive:m.emissive?.toArray()||(m.isMeshBasicMaterial?m.color.toArray():[0,0,0]),emissiveIntensity:m.emissiveIntensity??(m.isMeshBasicMaterial?1:0),opacity:m.transparent?m.opacity:1};
 if(o.isInstancedMesh){for(let i=0;i<o.count;i++){const matrix=new T.Matrix4();o.getMatrixAt(i,matrix);matrix.premultiply(o.matrixWorld);objects.push({geometry:g.uuid,material:m.uuid,matrix:matrix.toArray()});}}else objects.push({geometry:g.uuid,material:m.uuid,matrix:o.matrixWorld.toArray()});
 });fs.writeFileSync(path.join(out,name+'.json.tmp'),JSON.stringify({geometries,materials,objects,lights}));fs.renameSync(path.join(out,name+'.json.tmp'),path.join(out,name+'.json'));console.log(name,objects.length,'mesh instances',Object.keys(materials).length,'materials');}
const scene=new T.Scene(),world=buildWorld(scene);world.update(0,true);world.experiment({kind:'bridge',key:true,lantern:false});const c=createCompanion();c.group.position.set(2.6,.95,8);c.group.rotation.y=-.15;c.pose({still:true});scene.add(c.group);exportScene(scene,'world');
for(const [name,opts] of [['character-front',{still:true}],['character-walk',{walking:true,phase:1.3,time:2.1}],['character-land',{landing:.65,time:2.1}]]){const s=new T.Scene(),c=createCompanion();c.pose(opts);s.add(c.group);exportScene(s,name);}
