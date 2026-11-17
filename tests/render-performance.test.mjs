import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {createLocalLights} from '../dist/local-lights.js';
import {createRenderBudget,projectedCharacterHeight} from '../dist/render-budget.js';
import {mergeMeshGeometry} from '../dist/mesh-batch.js';
import {createCompanion} from '../dist/companion.js';
test('indexed batching preserves every transformed triangle and UV without vertex expansion',()=>{
 const scene=new T.Scene(),parent=new T.Group();parent.position.set(7,3,-8);parent.rotation.y=.4;scene.add(parent);const items=[];
 for(let i=0;i<3;i++){const mesh=new T.Mesh(new T.SphereGeometry(1,24,16),new T.MeshStandardMaterial());mesh.position.set(i*4,i,-i);mesh.scale.set(1,.8,1.3);parent.add(mesh);items.push(mesh);}scene.updateMatrixWorld(true);
 const merged=mergeMeshGeometry(items),p=new T.Vector3(),q=new T.Vector3();let offset=0;
 assert.equal(merged.attributes.position.count,items.reduce((sum,m)=>sum+m.geometry.attributes.position.count,0));assert.ok(merged.attributes.position.count<merged.index.count/4);
 for(const mesh of items){for(let i=0;i<mesh.geometry.index.count;i++){const local=mesh.geometry.index.getX(i),target=merged.index.getX(offset+i);p.fromBufferAttribute(mesh.geometry.attributes.position,local).applyMatrix4(mesh.matrixWorld);q.fromBufferAttribute(merged.attributes.position,target);assert.ok(p.distanceTo(q)<.000002);assert.equal(merged.attributes.uv.getX(target),mesh.geometry.attributes.uv.getX(local));}offset+=mesh.geometry.index.count;}
 const local=mergeMeshGeometry(items,{world:false});p.fromBufferAttribute(items[0].geometry.attributes.position,0).applyMatrix4(items[0].matrix);q.fromBufferAttribute(local.attributes.position,0);assert.ok(p.distanceTo(q)<.000001);
});
test('local lighting keeps fixtures intact, excludes hidden rooms, and uses a stable shader light count',()=>{
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(60,1,.1,100);camera.position.set(0,3,15);camera.lookAt(0,2,0);camera.updateMatrixWorld();const sources=[];
 for(let i=0;i<24;i++){const light=new T.PointLight('#ffe0a1',20,12);light.position.set(i<6?i-3:100+i,3,0);scene.add(light);sources.push(light);}
 const hiddenRoom=new T.Group();hiddenRoom.visible=false;const hidden=new T.PointLight('#ff0000',1000,30);hiddenRoom.add(hidden);scene.add(hiddenRoom);scene.updateMatrixWorld(true);
 const pool=createLocalLights(scene,{limit:4});pool.update(1,camera,new T.Vector3());assert.equal(pool.sourceCount,25);assert.equal(pool.activeCount,4);assert.ok(sources.every(light=>light.visible));assert.ok(sources.every(light=>!light.layers.isEnabled(0)));
 const active=[];scene.traverseVisible(o=>{if(o.isPointLight&&o.layers.test(camera.layers))active.push(o);});assert.equal(active.length,4);assert.ok(active.every(light=>light.color.getHexString()==='ffe0a1'&&Math.abs(light.position.x)<5));
 sources.forEach(light=>light.visible=false);pool.update(1,camera,new T.Vector3());assert.equal(pool.activeCount,0);assert.equal(active.length,4);pool.dispose();assert.ok(sources.every(light=>light.layers.isEnabled(0)));
});
test('automatic resolution responds to sustained slow frames, ignores pauses, and respects manual quality',()=>{
 const budget=createRenderBudget({pixelRatio:2});let now=100;for(let i=0;i<250;i++){now+=33;budget.sample(33,now);}assert.ok(budget.settings.pixelRatio<1.5);assert.notEqual(budget.settings.quality,'low');const reduced=budget.settings.pixelRatio;
 for(let i=0;i<500;i++){now+=1000;budget.sample(1000,now);}assert.equal(budget.settings.pixelRatio,reduced);
 budget.setMode('high');for(let i=0;i<500;i++){now+=50;budget.sample(50,now);}assert.equal(budget.settings.pixelRatio,1.5);assert.equal(budget.settings.quality,'high');
 budget.viewport(3,true);budget.setMode('auto');assert.equal(budget.settings.pixelRatio,1);assert.equal(budget.settings.quality,'medium');
});
test('distance detail keeps the exact character and restores all fur in close-ups',()=>{
 const pet=createCompanion(),fur=pet.group.getObjectByName('plush-fur'),body=pet.group.getObjectByName('plush-body'),full=fur.count,matrix=fur.instanceMatrix.array.slice(),bodyPosition=body.geometry.attributes.position.array.slice();
 pet.customize({accessory:'bunny-ears,eyes-heart',fur:'#e6c4de'});const camera=new T.PerspectiveCamera(50,1,.1,1000);camera.position.set(0,3,28);pet.setViewDetail(projectedCharacterHeight(camera,pet.group.position,900));assert.ok(fur.count<full/4);assert.ok(fur.count>1000);
 pet.pose({walking:true,phase:1.2});pet.setViewDetail(260);assert.equal(fur.count,full);assert.deepEqual(fur.instanceMatrix.array,matrix);assert.deepEqual(body.geometry.attributes.position.array,bodyPosition);assert.equal(pet.group.getObjectByName('plush-ear-headband').visible,true);
});
