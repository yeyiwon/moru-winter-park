import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildWinterRetreat} from '../dist/winter-retreat.js';
import {postOffice} from '../dist/retreat-layout.js';
import {regions,regionBridges} from '../dist/region-layout.js';
import {islandAt} from '../dist/world-layout.js';

const scene=new T.Scene();buildWinterRetreat(scene);scene.updateMatrixWorld(true);
test('rink island, bridges, rental and ice are absent while the post office remains',()=>{
 for(const name of ['winter-outdoor-rink','skating-ice','winter-skate-rental','rink-cedar-bench'])assert.equal(scene.getObjectByName(name),undefined);
 assert.equal(regions.rink,undefined);assert.ok(!regionBridges.some(b=>b.from==='rink'||b.to==='rink'));assert.equal(islandAt(-69,62)?.id,'philosophy');
 const office=scene.getObjectByName('winter-wish-post-office');assert.deepEqual(office.position.toArray(),[postOffice.x,0,postOffice.z]);
});
test('remaining post-office geometry is finite and batched',()=>{
 let meshes=0,triangles=0;scene.traverse(o=>{if(!o.isMesh)return;meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;for(const attribute of Object.values(o.geometry.attributes))for(const value of attribute.array)assert.ok(Number.isFinite(value));});assert.ok(meshes<20);assert.ok(triangles<100000);
});
