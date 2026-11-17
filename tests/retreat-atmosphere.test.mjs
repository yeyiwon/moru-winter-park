import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {createRetreatAtmosphere} from '../dist/retreat-atmosphere.js';
import {buildInteriors} from '../dist/interior-world.js';
import {buildSpaResort} from '../dist/spa-resort.js';

const setup=()=>{const scene=new T.Scene(),parent=new T.Group();parent.position.x=400;scene.add(parent);const effect=createRetreatAtmosphere(parent,{name:'test',waters:[{x:0,y:.25,z:3,rx:3,rz:2,lights:[[1,3,0]]}],vapour:[{x:-12,y:.25,z:0,count:20},{x:12,y:1,z:0,count:8}],fireflies:[{x:0,y:1,z:-5,rx:2,rz:2,count:20}],ribbons:[{x:0,y:15,z:0,width:22,height:3},{x:0,y:19,z:0,width:18,height:3}],lamps:[{x:0,y:.1,z:0,rx:2,rz:2}]});return{scene,parent,effect};};

test('retreat clocks freeze in reduced motion and ignore hidden rooms or invalid time',()=>{
 const {parent,effect}=setup();assert.equal(effect.update(8),true);assert.equal(effect.time,8);
 effect.update(20,true);assert.equal(effect.time,8);effect.update(NaN);assert.equal(effect.time,8);
 parent.visible=false;assert.equal(effect.update(30),false);assert.equal(effect.time,8);
 parent.visible=true;effect.update(31);assert.equal(effect.time,31);effect.dispose();
});

test('quality reduces particles while retaining every authored vapour source',()=>{
 const {effect}=setup(),cloud=effect.root.getObjectByName('test-water-vapour');
 effect.setQuality('low');assert.ok(cloud.geometry.drawRange.count<cloud.geometry.attributes.position.count);
 const positions=cloud.geometry.attributes.position;let left=0,right=0;for(let i=0;i<cloud.geometry.drawRange.count;i++){if(positions.getX(i)<0)left++;else right++;}assert.ok(left&&right);
 assert.equal(effect.root.getObjectByName('test-aurora-ribbon-1').visible,false);
 effect.setQuality('high');assert.equal(cloud.geometry.drawRange.count,positions.count);assert.equal(effect.root.getObjectByName('test-aurora-ribbon-1').visible,true);
 effect.setQuality('unknown');assert.equal(effect.quality,'medium');effect.dispose();
});

test('local effect geometry stays finite, transparent and disposable',()=>{
 const {effect,parent}=setup();let drawObjects=0,disposed=0;
 effect.root.traverse(o=>{if(!o.geometry)return;drawObjects++;assert.equal(o.material.depthWrite,false);assert.equal(o.material.transparent,true);assert.equal(o.castShadow,false);o.geometry.addEventListener('dispose',()=>disposed++);for(const a of Object.values(o.geometry.attributes))for(const v of a.array)assert.ok(Number.isFinite(v),o.name);});
 assert.ok(drawObjects<=7);effect.dispose();effect.dispose();assert.equal(disposed,drawObjects);assert.equal(parent.children.length,0);assert.equal(effect.update(99),false);
});

test('interiors only animate the active room and share the quality setting',()=>{
 const interiors=buildInteriors(new T.Scene(),{lazy:true});interiors.setQuality('low');interiors.setActive('ryokan');interiors.update(7);
 assert.equal(interiors.rooms.ryokan.atmosphere.time,7);assert.equal(interiors.rooms.conservatory,undefined);
 interiors.setActive(null);interiors.update(9);assert.equal(interiors.rooms.ryokan.atmosphere.time,7);
 for(const room of Object.values(interiors.rooms))assert.equal(room.atmosphere.quality,'low');
});

test('outdoor bath atmosphere stays inside existing basin footprints and uses a bounded draw set',()=>{
 const scene=new T.Scene(),asset=buildSpaResort({scene,M:(color,roughness,metalness)=>new T.MeshStandardMaterial({color,roughness,metalness})});let draws=0,water=0;
 asset.atmosphere.root.traverse(o=>{if(o.geometry)draws++;if(o.userData.waterFootprint){water++;assert.ok(o.userData.waterFootprint.rx<=7.4);assert.ok(o.userData.waterFootprint.rz<=6.4);}});
 assert.equal(water,3);assert.ok(draws<=6);asset.update(5,false,'low');assert.equal(asset.atmosphere.quality,'low');assert.equal(asset.atmosphere.time,5);asset.update(20,true);assert.equal(asset.atmosphere.time,5);
});
