import {createMountainLights} from './mountain-lights.js';
import {tileGeometry} from './mountain-tile.js';
import {finishSteps} from './startup-work.js';
import {mountainTrees} from './mountain-forest.js';
import * as T from './vendor/three.module.js';
import {alpineHeight,mountainAprons,mountainBounds,mountainDistance,skiRuns,skiRunAt,skiRunCenter,skiRunHalfWidth} from './mountain-layout.js';

const TILE=128;
// One coarse mountain stays visible. Only nearby tiles replace its corresponding cells.
export function createMountainTerrain(parent){return finishSteps(createMountainTerrainSteps(parent));}
export function* createMountainTerrainSteps(parent){
 const root=new T.Group();root.name='streamed-alpine-heightfield';parent.add(root);
 const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.96});
 const live=new Map(),queue=[];let quality='medium',lastKey='',lastTick=-1;
 const forestGeo=new T.ConeGeometry(.36,1,7,1),forestMat=new T.MeshStandardMaterial({color:'#568080',roughness:1}),capMat=new T.MeshStandardMaterial({color:'#dce9f0',roughness:1}),dummy=new T.Object3D();


 // Coarse tiles merge into one draw; its index list excludes resident detail tiles.
 const litTrees=[],positions=[],colors=[],normals=[],ranges=[],forestPositions=[],forestColors=[],forestIndices=[];const farFir=new T.ConeGeometry(.36,1,5,1);const farPine=new T.Color('#638381'),farSnow=new T.Color('#dce9f0');
 for(let z=Math.floor(mountainBounds.minZ/TILE);z<=Math.floor(mountainBounds.maxZ/TILE);z++)for(let x=Math.floor(mountainBounds.minX/TILE);x<=Math.floor(mountainBounds.maxX/TILE);x++){
  if(mountainDistance((x+.5)*TILE,(z+.5)*TILE)>TILE)continue;
  const nearStation=mountainAprons.some(a=>Math.abs((x+.5)*TILE-a.x)<a.rx+TILE&&Math.abs((z+.5)*TILE-a.z)<a.rz+TILE);
  const nearPiste=skiRuns.some(r=>{const z0=Math.max(z*TILE,r.startZ),z1=Math.min((z+1)*TILE,r.finish);return z0<=z1&&[z0,(z0+z1)/2,z1].some(at=>Math.abs((x+.5)*TILE-skiRunCenter(at,r.id))<TILE*.5+skiRunHalfWidth(at,r.id)+12);});
  const key=x+':'+z,g=tileGeometry(x,z,nearStation||nearPiste?24:12),offset=positions.length/3;positions.push(...g.attributes.position.array);colors.push(...g.attributes.color.array);normals.push(...g.attributes.normal.array);const treeStart=forestIndices.length;for(const tree of mountainTrees(x,z)){const run=skiRunAt(tree.x,tree.z),side=Math.abs(tree.x-skiRunCenter(tree.z,run.id));if(litTrees.length<220&&side<skiRunHalfWidth(tree.z,run.id)+90&&Math.abs(Math.floor(tree.x+tree.z))%3===0)litTrees.push(tree);for(let tier=0;tier<2;tier++){const h=tree.h*(.8-tier*.19),base=forestPositions.length/3;for(let v=0;v<farFir.attributes.position.count;v++){const a=farFir.attributes.position;forestPositions.push(tree.x+a.getX(v)*h,tree.y+tree.h*(.35+tier*.21)+a.getY(v)*h,tree.z+a.getZ(v)*h);const c=a.getY(v)>-.32?farSnow:farPine;forestColors.push(c.r,c.g,c.b);}for(const v of farFir.index.array)forestIndices.push(base+v);}}ranges.push({key,x,z,treeStart,treeEnd:forestIndices.length,indices:Array.from(g.index.array,v=>v+offset)});g.dispose();if(ranges.length%8===0)yield;
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
 const far=new T.Mesh(geo,material);far.name='alpine-far-ridges';far.userData.skiTerrain=true;far.castShadow=false;far.receiveShadow=true;root.add(far);
 const forestGeometry=new T.BufferGeometry();forestGeometry.setAttribute('position',new T.Float32BufferAttribute(forestPositions,3));forestGeometry.setAttribute('color',new T.Float32BufferAttribute(forestColors,3));forestGeometry.setIndex(forestIndices);forestGeometry.computeVertexNormals();const distantForest=new T.Mesh(forestGeometry,material);distantForest.name='alpine-distant-forest';root.add(distantForest);farFir.dispose();
 const allIndices=[];for(const t of ranges){t.indexStart=allIndices.length;allIndices.push(...t.indices);t.indexEnd=allIndices.length;t.masked=false;}geo.setIndex(allIndices);
 function refresh(){let terrainChanged=false,forestChanged=false;for(const t of ranges){const masked=live.has(t.key);if(masked===t.masked)continue;t.masked=masked;if(masked){geo.index.array.fill(0,t.indexStart,t.indexEnd);forestGeometry.index.array.fill(0,t.treeStart,t.treeEnd);}else{geo.index.array.set(t.indices,t.indexStart);forestGeometry.index.array.set(forestIndices.slice(t.treeStart,t.treeEnd),t.treeStart);}terrainChanged=true;forestChanged=true;}if(terrainChanged)geo.index.needsUpdate=true;if(forestChanged)forestGeometry.index.needsUpdate=true;}
 const fairyLights=createMountainLights(root,litTrees);
 const byKey=new Map(ranges.map(t=>[t.key,t]));let wanted=new Set(),worker=null,pending=null,generation=0,disposed=false;
 if(typeof Worker!=='undefined'){try{worker=new Worker(new URL('./mountain-worker.js',import.meta.url),{type:'module'});worker.onmessage=event=>{const task=pending;pending=null;if(disposed||!task||task.generation!==generation||!wanted.has(task.tile.key))return;const data=event.data,g=new T.BufferGeometry();for(const name of ['position','normal','color'])g.setAttribute(name,new T.BufferAttribute(data[name],3));g.setIndex(new T.BufferAttribute(data.index,1));install(task.tile,g);};worker.onerror=()=>{worker.terminate();worker=null;if(pending&&wanted.has(pending.tile.key))queue.unshift(pending.tile);pending=null;};}catch{worker=null;}}
 function install(tile,geometry){if(live.has(tile.key)){geometry.dispose();return;}const m=new T.Mesh(geometry,material);m.name='alpine-detail-'+tile.key;m.userData.skiTerrain=true;m.receiveShadow=true;root.add(m);const trees=mountainTrees(tile.x,tile.z);for(const [mat,top]of [[forestMat,false],[capMat,true]]){if(!trees.length)continue;const forest=new T.InstancedMesh(forestGeo,mat,trees.length*3);forest.name='streamed-snow-firs';let i=0;for(const tree of trees)for(let tier=0;tier<3;tier++){const height=tree.h*(.8-tier*.19);dummy.position.set(tree.x,tree.y+tree.h*(.35+tier*.21)+(top?.07:0),tree.z);dummy.rotation.y=tree.turn;dummy.scale.set(height*(top?.92:1),height*(top?.9:1),height*(top?.92:1));dummy.updateMatrix();forest.setMatrixAt(i++,dummy.matrix);}forest.computeBoundingSphere();forest.castShadow=true;m.add(forest);}live.set(tile.key,m);refresh();}

 // Instance buffers belong to each streamed tile; its geometry/material stay shared.
 function releaseTile(mesh){for(const child of mesh.children)if(child.isInstancedMesh)child.dispose();mesh.removeFromParent();mesh.geometry.dispose();}
 function update(x,z,yaw=0){
  const cx=Math.floor(x/TILE),cz=Math.floor(z/TILE),key=cx+':'+cz+':'+quality;
  if(key!==lastKey){lastKey=key;const radius=quality==='low'?1:2;wanted=new Set();queue.length=0;
   for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){const k=(cx+dx)+':'+(cz+dz);if(byKey.has(k))wanted.add(k);}
   // One additional row ahead is prepared before a fast skier reaches the boundary.
   const fx=Math.round(Math.sin(yaw)),fz=Math.round(Math.cos(yaw));for(let side=-1;side<=1;side++){const k=(cx+fx*(radius+1)+side*fz)+':'+(cz+fz*(radius+1)-side*fx);if(byKey.has(k))wanted.add(k);}
   for(const [k,m]of live)if(!wanted.has(k)){releaseTile(m);live.delete(k);}
   for(const k of wanted)if(!live.has(k)&&!(pending?.tile.key===k&&pending.generation===generation))queue.push(byKey.get(k));queue.sort((a,b)=>Math.hypot(a.x-cx,a.z-cz)-Math.hypot(b.x-cx,b.z-cz));refresh();
  }
  const now=performance.now();if(pending||!queue.length||now-lastTick<16)return;lastTick=now;const tile=queue.shift(),segments=quality==='low'?24:40;
  if(worker){pending={tile,generation};worker.postMessage({x:tile.x,z:tile.z,segments});}else install(tile,tileGeometry(tile.x,tile.z,segments));
 }
 return{root,update,updateLights:(t,still)=>fairyLights.update(t,still),setQuality(value){fairyLights.setQuality(value);if(value!==quality){quality=value;generation++;lastKey='';for(const m of live.values())releaseTile(m);live.clear();refresh();}},stats:()=>({resident:live.size,queued:queue.length+(pending?1:0),coarseTiles:ranges.length,illuminatedTrees:litTrees.length,worker:!!worker}),dispose(){fairyLights.dispose();disposed=true;worker?.terminate();for(const m of live.values())releaseTile(m);geo.dispose();forestGeometry.dispose();material.dispose();forestGeo.dispose();forestMat.dispose();capMat.dispose();root.removeFromParent();}};
}
