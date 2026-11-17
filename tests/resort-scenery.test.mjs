import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildResortScenery,panoramaBounds} from '../dist/resort-scenery.js';
import {alpine,alpineHeight,summitFacilities} from '../dist/resort-blueprint.js';

const scene=new T.Scene(),scenery=buildResortScenery(scene);
test('summit hearth follows the shared facility placement and terrain height',()=>{
 const stop=summitFacilities.find(s=>s.id==='campfire');
 assert.deepEqual(scenery.campfire.position.toArray(),[stop.model.x,alpineHeight(stop.model.x,stop.model.z),stop.model.z]);
 assert.equal(scenery.campfire.userData.footprintRadius,1.65);assert.equal(scenery.root.parent,scene);
});
test('background ridge geometry remains outside the playable mountain and meets ground at its boundary',()=>{
 const ridges=[];scenery.root.traverse(o=>{if(o.name.startsWith('snow-ridgeline-'))ridges.push(o);});assert.equal(ridges.length,3);
 for(const ridge of ridges){const p=ridge.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);assert.ok(Math.hypot(x-alpine.x,z-alpine.z)>alpine.r+10);assert.ok(z<=panoramaBounds.nearestZ);assert.ok(y>=0&&Number.isFinite(y));}for(let i=0;i<73;i++){assert.ok(Math.abs(p.getY(i))<.001);assert.ok(Math.abs(p.getY(p.count-1-i))<.001);}}
});
test('fire uses translucent animated tongues and freezes in reduced motion',()=>{
 const flames=scenery.campfire.getObjectByName('hearth-translucent-flame-tongues'),light=scenery.campfire.getObjectByName('hearth-local-warmth');
 assert.ok(flames.isInstancedMesh);assert.equal(flames.count,11);assert.equal(flames.material.transparent,true);assert.equal(flames.material.depthWrite,false);assert.equal(flames.geometry.attributes.aSeed.count,11);
 scenery.update(2,false);const previous=light.intensity;assert.equal(flames.material.uniforms.uTime.value,2);scenery.update(20,true);assert.equal(flames.material.uniforms.uTime.value,2);assert.equal(light.intensity,previous);scenery.update(3,false);assert.equal(flames.material.uniforms.uTime.value,3);
 assert.ok(light.distance<=13);assert.ok(light.intensity>=7&&light.intensity<=10);
});
test('distant tree roots touch the rendered terrain instead of floating above it',()=>{
 const trees=scenery.root.getObjectByName('distant-snow-forest'),terrain=scenery.root.getObjectByName('snow-ridgeline-0'),matrix=new T.Matrix4(),position=new T.Vector3(),ray=new T.Raycaster();scenery.root.updateMatrixWorld(true);
 for(let i=0;i<trees.count;i+=13){trees.getMatrixAt(i,matrix);position.setFromMatrixPosition(matrix);ray.set(position.clone().add(new T.Vector3(0,30,0)),new T.Vector3(0,-1,0));const hit=ray.intersectObject(terrain,false)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-position.y-.12)<.001,`tree ${i} floats above the rendered slope`);}
});
test('asset geometry is finite and scenery stays within its draw-call budget',()=>{
 let meshes=0;scenery.root.traverse(o=>{if(o.isMesh)meshes++;if(o.geometry)for(const attr of Object.values(o.geometry.attributes))for(const value of attr.array)assert.ok(Number.isFinite(value));});assert.ok(meshes<=14);
});
