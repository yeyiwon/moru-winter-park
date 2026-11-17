import test from 'node:test';import assert from 'node:assert/strict';import * as T from '../dist/vendor/three.module.js';import {createPlazaSnowman} from '../dist/plaza-snowman.js';

test('the snowman actually removes the carrot, holds it and returns it to the face',()=>{
 const scene=new T.Scene(),snowman=createPlazaSnowman(scene),nose=snowman.root.getObjectByName('snowman-carrot-nose');snowman.update(0,false);const home=nose.position.clone();assert.equal(snowman.interact(0),true);assert.equal(snowman.interact(.1),false);
 snowman.update(1.5,false);assert.ok(nose.position.distanceTo(home)>.6);assert.equal(snowman.root.getObjectByName('snowman-surprised-mouth').visible,true);const hand=snowman.root.getObjectByName('carrot-hand');assert.ok(hand.position.distanceTo(nose.position)<.15,'the actual hand follows the removed nose');
 snowman.update(4.3,false);assert.equal(snowman.busy,false);assert.ok(nose.position.distanceTo(home)<.025);assert.equal(snowman.root.getObjectByName('snowman-smile').visible,true);assert.equal(snowman.interact(5),true);snowman.update(5.2,true);assert.equal(snowman.busy,false);assert.ok(nose.position.distanceTo(home)<.001);snowman.dispose();assert.equal(scene.children.length,0);
});

test('snowman articulation and detailed geometry stay finite and within the asset budget',()=>{
 const asset=createPlazaSnowman(new T.Scene(),{x:-6.5,y:.09,z:3});assert.deepEqual(asset.collision,{x:-6.5,z:3,r:1.02});let meshes=0,triangles=0;asset.root.traverse(o=>{if(!o.isMesh)return;meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;for(const attribute of Object.values(o.geometry.attributes))for(const n of attribute.array)assert.ok(Number.isFinite(n));});assert.ok(meshes<=28);assert.ok(triangles<40000);
 asset.interact(10);for(let i=0;i<100;i++){asset.update(10+i/20,false,{x:0,z:0});asset.root.updateMatrixWorld(true);asset.root.traverse(o=>{for(const n of o.matrixWorld.elements)assert.ok(Number.isFinite(n));});}asset.dispose();
});

test('snowman waves and makes a small hop without drifting, and reduced motion restores the feet',()=>{
 const asset=createPlazaSnowman(new T.Scene()),left=asset.root.getObjectByName('waving-hand');asset.update(0,false);const idle=left.position.y;asset.update(3,false);assert.ok(left.position.y>idle+.5);asset.update(10.2,false);assert.ok(asset.root.position.y>.18);assert.equal(asset.root.position.x,-6.5);assert.equal(asset.root.position.z,3);asset.update(10.2,true);assert.equal(asset.root.position.y,.09);assert.equal(asset.root.rotation.z,0);assert.deepEqual(asset.root.scale.toArray(),[1,1,1]);asset.dispose();
});
