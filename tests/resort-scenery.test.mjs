import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildResortScenery} from '../dist/resort-scenery.js';
import {alpineHeight,summitFacilities} from '../dist/resort-blueprint.js';

const scene=new T.Scene(),scenery=buildResortScenery(scene);
test('summit hearth follows the shared facility placement and terrain height',()=>{
 const stop=summitFacilities.find(s=>s.id==='campfire');
 assert.deepEqual(scenery.campfire.position.toArray(),[stop.model.x,alpineHeight(stop.model.x,stop.model.z),stop.model.z]);
 assert.equal(scenery.campfire.userData.footprintRadius,1.65);assert.equal(scenery.root.parent,scene);
});
test('the old decorative mountains no longer intersect the playable slopes',()=>{assert.equal(scenery.root.getObjectByName('alpine-distant-ridgelines'),undefined);});
test('fire uses translucent animated tongues and freezes in reduced motion',()=>{
 const flames=scenery.campfire.getObjectByName('hearth-translucent-flame-tongues'),light=scenery.campfire.getObjectByName('hearth-local-warmth');
 assert.ok(flames.isInstancedMesh);assert.equal(flames.count,11);assert.equal(flames.material.transparent,true);assert.equal(flames.material.depthWrite,false);assert.equal(flames.geometry.attributes.aSeed.count,11);
 scenery.update(2,false);const previous=light.intensity;assert.equal(flames.material.uniforms.uTime.value,2);scenery.update(20,true);assert.equal(flames.material.uniforms.uTime.value,2);assert.equal(light.intensity,previous);scenery.update(3,false);assert.equal(flames.material.uniforms.uTime.value,3);
 assert.ok(light.distance<=13);assert.ok(light.intensity>=7&&light.intensity<=10);
});
test('asset geometry is finite and scenery stays within its draw-call budget',()=>{
 let meshes=0;scenery.root.traverse(o=>{if(o.isMesh)meshes++;if(o.geometry)for(const attr of Object.values(o.geometry.attributes))for(const value of attr.array)assert.ok(Number.isFinite(value));});assert.ok(meshes<=14);
});
