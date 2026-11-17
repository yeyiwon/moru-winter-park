import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildWinterRetreat} from '../dist/winter-retreat.js';
import {postOffice,rinkBounds,rinkBenches,skateRental} from '../dist/retreat-layout.js';

const scene=new T.Scene(),retreat=buildWinterRetreat(scene);scene.updateMatrixWorld(true);
const physical=[];scene.traverse(o=>{if(o.isMesh&&!o.material.transparent&&!o.material.isShaderMaterial)physical.push(o);});

test('expanded ice surface and authored building locations share the movement layout',()=>{
 const ice=scene.getObjectByName('skating-ice');assert.equal(ice.scale.x,rinkBounds.rx);assert.equal(ice.scale.y,rinkBounds.rz);assert.equal(ice.material.transparent,true);assert.ok(ice.material.clearcoat>=.9);
 const office=scene.getObjectByName('winter-wish-post-office'),rental=scene.getObjectByName('winter-skate-rental');assert.deepEqual(office.position.toArray(),[postOffice.x,0,postOffice.z]);assert.deepEqual(rental.position.toArray(),[skateRental.x,0,skateRental.z]);
 const benches=[];scene.traverse(o=>{if(o.name==='rink-cedar-bench')benches.push(o);});assert.equal(benches.length,rinkBenches.length);for(const b of benches)assert.ok(rinkBenches.some(p=>p.x===b.position.x&&p.z===b.position.z));
});

test('east rink gate has real head and shoulder clearance through the actual asset',()=>{
 const r=rinkBounds;for(const y of [.55,1.4,2.2])for(const dz of [-1.45,0,1.45]){
  const ray=new T.Raycaster(new T.Vector3(r.x+r.rx-1,y,r.z+dz),new T.Vector3(1,0,0),0,r.fenceRx-r.rx+4);
  assert.equal(ray.intersectObjects(physical,false).length,0,`blocked gate at height ${y}, offset ${dz}`);
 }
});

test('rink geometry is finite, upward concourse is visible and the repeated details are batched',()=>{
 let meshes=0,triangles=0;scene.traverse(o=>{if(!o.isMesh)return;meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;for(const attribute of Object.values(o.geometry.attributes))for(const value of attribute.array)assert.ok(Number.isFinite(value));});
 assert.ok(meshes<28,`expected merged detail, got ${meshes} meshes`);assert.ok(triangles<180000,`geometry budget: ${triangles}`);
 const r=rinkBounds,ray=new T.Raycaster(new T.Vector3(r.x,2,r.z+r.fenceRz+1.1),new T.Vector3(0,-1,0),0,3),hit=ray.intersectObjects(physical,false)[0];assert.ok(hit,'concourse visible from above');assert.ok(hit.face.normal.y>.9,'top face points upward');
 retreat.update(14,false);assert.equal(scene.getObjectByName('ice-surface-detail').material.uniforms.time.value,14);retreat.update(20,true);assert.equal(scene.getObjectByName('ice-surface-detail').material.uniforms.time.value,0);
});
