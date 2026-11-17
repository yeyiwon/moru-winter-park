import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {createTreeAtmosphere} from '../dist/tree-atmosphere.js';

test('tree illumination batches many trees without changing their silhouettes or footprints',()=>{
 const parent=new T.Group(),body=new T.Mesh(new T.ConeGeometry(2,8,12),new T.MeshStandardMaterial());parent.add(body);const before=Array.from(body.geometry.attributes.position.array),fx=createTreeAtmosphere(parent,{capacity:6000});
 fx.addTree({x:108,z:35,height:32,hero:true});for(let i=0;i<9;i++)fx.addTree({x:i*5,z:4,height:4});
 assert.equal(fx.root.children.length,2);assert.equal(fx.count,700+9*222);assert.deepEqual(Array.from(body.geometry.attributes.position.array),before);assert.equal(body.material.emissiveIntensity,1);
 fx.root.traverse(o=>{if(o.geometry)for(const a of Object.values(o.geometry.attributes))for(const value of a.array)assert.ok(Number.isFinite(value));});
 const lights=fx.root.getObjectByName('winter-tree-fairy-lights'),ribbons=fx.root.getObjectByName('winter-tree-flowing-light-ribbons');assert.equal(lights.geometry.drawRange.count,2698);assert.equal(ribbons.material.depthWrite,false);assert.equal(ribbons.material.transparent,true);
 assert.ok(ribbons.geometry.attributes.position.count>2000);fx.dispose();assert.deepEqual(parent.children,[body]);
});

test('tree light quality is bounded and reduced motion freezes the existing animation time',()=>{
 const fx=createTreeAtmosphere(new T.Group());fx.addTree({height:32,hero:true});fx.update(12);const light=fx.root.children[0],ribbons=fx.root.children[1];assert.equal(light.material.uniforms.time.value,12);fx.update(99,true);assert.equal(light.material.uniforms.time.value,12);assert.equal(ribbons.material.uniforms.time.value,12);
 for(const [tier,value]of [['low',.35],['medium',.65],['high',1]]){fx.setQuality(tier);assert.equal(light.material.uniforms.quality.value,value);assert.equal(ribbons.material.uniforms.quality.value,value);}fx.update(13);assert.equal(light.material.uniforms.time.value,13);fx.dispose();
});
