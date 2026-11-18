import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildSpaResort} from '../dist/spa-resort.js';
import {interiorDoors} from '../dist/district-layout.js';
import {createOnsenWater} from '../dist/onsen-water.js';
import {snowPine} from '../dist/ryokan-garden.js';
import {makeBuilder,materials} from '../dist/architecture-kit.js';
import {createFishSchool,fishBodyGeometry} from '../dist/ryokan-aquarium.js';

test('ryokan portal hit target covers the actual doorway, not the whole building',()=>{
 const scene=new T.Scene(),asset=buildSpaResort({scene,M:(color,roughness,metalness)=>new T.MeshStandardMaterial({color,roughness,metalness})});
 scene.updateMatrixWorld(true);const target=asset.interactive.find(o=>o.userData.action==='sauna'),bounds=new T.Box3().setFromObject(target),door=interiorDoors.ryokan;
 assert.ok(bounds.containsPoint(new T.Vector3(door.x,1,door.z)));
 assert.ok(bounds.max.x-bounds.min.x<5);assert.ok(bounds.max.z-bounds.min.z<2);
 assert.equal(target.material.visible,false);assert.equal(target.material.depthWrite,false);
});
test('snow crowns face upward and their geometry stays finite',()=>{
 const root=new T.Group(),m=materials();snowPine(makeBuilder(root),{wood:m.cedar,green:m.green,sage:m.sage,snow:m.snow},0,0,7,.8);
 let normals=0,y=0;root.traverse(o=>{if(o.material!==m.snow)return;for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));const n=o.geometry.attributes.normal;for(let i=0;i<n.count;i++){normals++;y+=n.getY(i);}});
 assert.ok(y/normals>.25,'snow must not disappear due to inverted faces');
});
test('onsen motion freezes without losing its last frame or changing local light positions',()=>{
 const water=createOnsenWater({lights:[[1,3,2]]});water.update(12);assert.equal(water.material.uniforms.time.value,12);water.update(20,true);assert.equal(water.material.uniforms.time.value,12);water.update(NaN);assert.equal(water.material.uniforms.time.value,12);
 assert.deepEqual(water.material.uniforms.lights.value[0].toArray(),[1,3,2]);assert.equal(water.material.depthWrite,false);water.material.dispose();
});
test('fish silhouettes taper at both ends and keep per-vertex shading at both LODs',()=>{
 for(const [s,r]of [[16,20],[8,10]]){const g=fishBodyGeometry(s,r),p=g.attributes.position;for(const v of p.array)assert.ok(Number.isFinite(v));const width=i=>Math.max(...Array.from({length:s+1},(_,j)=>Math.abs(p.getY(i*(s+1)+j))));assert.ok(width(0)<width(r/2)*.2);assert.ok(width(r)<width(r/2)*.2);assert.equal(g.attributes.color.count,p.count);g.dispose();}
});

test('fish body and tail stay inside the viewing tank even when turning toward the glass',()=>{
 const school=createFishSchool();for(let i=0;i<600;i++){school.step(.08);for(const f of school.fish){assert.ok(Math.abs(f.x)+f.size*1.6<=6.65001);assert.ok(Math.abs(f.z)+f.size*1.6<=1.35001);assert.ok(Math.abs(f.y)+f.size*.62<=1.65001);}}
});
