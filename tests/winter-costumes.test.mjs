import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';import {createYukata,createSnowfolk} from '../dist/winter-costumes.js';

test('the curved yukata fits the companion and leaves both eyes and mouth unobstructed',()=>{
 const robe=createYukata();robe.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(robe);assert.ok(bounds.min.y>=-.79&&bounds.max.x<1.05);assert.ok(bounds.max.y<.08);
 for(const [x,y]of [[-.205,.075],[.205,.075],[0,-.065]]){const ray=new T.Raycaster(new T.Vector3(x,y,2),new T.Vector3(0,0,-1),0,1.45);assert.equal(ray.intersectObject(robe,true).length,0,'face remains visible');}
 const ray=new T.Raycaster(new T.Vector3(0,-.32,2),new T.Vector3(0,0,-1),0,2);const hit=ray.intersectObject(robe,true)[0];assert.ok(hit&&hit.point.z>.61,'robe sits outside the plush body');
});

test('the snowfolk vendor has finite geometry and independent idle animation',()=>{
 const one=createSnowfolk(),two=createSnowfolk();one.update(4);two.update(0);assert.notEqual(one.children[1].rotation.y,two.children[1].rotation.y);one.update(NaN);assert.ok(Number.isFinite(one.children[1].rotation.y));
 one.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(one);assert.ok(bounds.max.y>2.5&&bounds.max.y<2.65);assert.ok(bounds.min.y>=-.011);assert.equal(one.userData.role,'vendor');
 for(const asset of [one,createYukata()]){let count=0,triangles=0;asset.traverse(o=>{if(!o.isMesh)return;count++;triangles+=o.geometry.attributes.position.count/3;for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));assert.notEqual(o.geometry.type,'BoxGeometry');});assert.ok(count<=16);assert.ok(triangles<25000);}
});
