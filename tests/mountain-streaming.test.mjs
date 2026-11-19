import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {createMountainTerrain} from '../dist/mountain-terrain.js';
import {buildConnectedTerrain} from '../dist/connected-terrain.js';
import {mountainBounds,mountainHalfWidth} from '../dist/mountain-layout.js';
import {mountainTrees,forestTileSize} from '../dist/mountain-forest.js';
import {alpineShift} from '../dist/resort-layout.js';

test('the long mountain rock rim follows its narrow base without polar-sampling gaps',()=>{
 const root=buildConnectedTerrain(new T.Scene()),cliff=root.getObjectByName('layered-cliff-alpine'),p=cliff.geometry.attributes.position;
 const steps=Math.ceil((mountainBounds.maxZ-mountainBounds.minZ)/10),n=steps*2;
 for(let i=0;i<n;i++){
  const z=p.getZ(i)-alpineShift;
  assert.ok(Math.abs(Math.abs(p.getX(i))-mountainHalfWidth(z))<.002);
  const next=(i+1)%n;assert.ok(Math.abs(p.getZ(next)-p.getZ(i))<=10.01,'dense samples at the narrow base too');
 }
 const materials=new Set();root.traverse(o=>{if(o.isMesh){o.geometry.dispose();materials.add(o.material);}});for(const m of materials)m.dispose();
});

test('streamed trees release per-instance GPU buffers when tiles leave or quality changes', async()=>{
 const parent=new T.Group(),terrain=createMountainTerrain(parent);
 async function settle(x,z){for(let i=0;i<30;i++){terrain.update(x,z);if(!terrain.stats().queued)break;await new Promise(r=>setTimeout(r,17));}}
 // Select two actual forest tiles; old hard-coded positions now lie outside the compact mountain.
 const sites=[];for(let z=Math.floor(mountainBounds.minZ/forestTileSize);z<=Math.floor(mountainBounds.maxZ/forestTileSize);z++)for(let x=Math.floor(mountainBounds.minX/forestTileSize);x<=Math.floor(mountainBounds.maxX/forestTileSize);x++)if(mountainTrees(x,z).length)sites.push([(x+.5)*forestTileSize,(z+.5)*forestTileSize]);
 const first=sites[0],last=sites.reduce((a,b)=>Math.hypot(b[0]-first[0],b[1]-first[1])>Math.hypot(a[0]-first[0],a[1]-first[1])?b:a);
 await settle(...first);
 const trees=[];terrain.root.traverse(o=>{if(o.isInstancedMesh)trees.push(o);});assert.ok(trees.length>0);
 const released=new Set();for(const tree of trees)tree.addEventListener('dispose',()=>released.add(tree));
 const shared=trees[0].geometry;let sharedDisposed=0;shared.addEventListener('dispose',()=>sharedDisposed++);
 await settle(...last);
 assert.equal(released.size,trees.length);assert.equal(sharedDisposed,0,'resident tiles still use this shared geometry');
 const current=[];terrain.root.traverse(o=>{if(o.isInstancedMesh)current.push(o);});let qualityReleased=0;for(const tree of current)tree.addEventListener('dispose',()=>qualityReleased++);
 terrain.setQuality('low');assert.equal(qualityReleased,current.length);assert.equal(terrain.stats().resident,0);
 await settle(...last);assert.ok(terrain.stats().resident<=12);
 terrain.dispose();assert.equal(parent.children.length,0);assert.equal(sharedDisposed,1);
});
