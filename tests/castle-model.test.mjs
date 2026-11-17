import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildCastle} from '../dist/castle-model.js';
import {castleLayout,castleObstacles,castleTowers} from '../dist/castle-layout.js';

const castle=buildCastle();castle.root.updateMatrixWorld(true);
const solid=[],all=[];castle.root.traverse(o=>{if(o.isMesh||o.isPoints)all.push(o);if(o.isMesh&&!o.material.transparent)solid.push(o);});
test('the new castle is a detailed main landmark within its geometry and material budget',()=>{
 let triangles=0,meshes=0;const materials=new Set();
 for(const o of all){materials.add(o.material);if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}for(const attribute of Object.values(o.geometry.attributes))for(const n of attribute.array)assert.ok(Number.isFinite(n));}
 assert.ok(meshes<=9);assert.ok(triangles<270000);assert.ok(materials.size<8);
 const box=new T.Box3().setFromObject(castle.root),size=box.getSize(new T.Vector3());
 assert.ok(size.y>43&&size.y<46);assert.ok(size.x>33&&size.x<37);assert.deepEqual(castle.root.scale.toArray(),[1,1,1]);
 assert.ok(castleTowers.length>=9);assert.equal(castle.root.position.z,castleLayout.z);
});
test('the entire broad arcade is clear from the front plaza through the north bridge',()=>{
 const ray=new T.Raycaster();
 for(let x=-4.2;x<=4.21;x+=.35)for(const y of [.4,1,1.8,2.8,4.5,6.8,7.15]){
  ray.set(new T.Vector3(x,y,0),new T.Vector3(0,0,-1));ray.near=0;ray.far=40;
  assert.equal(ray.intersectObjects(solid,false).length,0,`${x},${y}`);
 }
 for(let z=-30;z<=-5;z+=.5)for(const x of [-4.2,0,4.2])assert.ok(!castleObstacles.some(o=>o.r?Math.hypot(x-o.x,z-o.z)<o.r:Math.abs(x-o.x)<o.w&&Math.abs(z-o.z)<o.d));
});
test('castle fixtures remain inside the promenade-side footprint with no low facade over the passage',()=>{
 const ray=new T.Raycaster(),down=new T.Vector3(0,-1,0);
 for(const o of castleObstacles){assert.ok(Math.abs(o.x)>(o.w||o.r)+4.2);assert.ok(o.z-(o.d||o.r)>-25);ray.set(new T.Vector3(o.x,55,o.z),down);ray.far=60;assert.ok(ray.intersectObjects(solid,false).length>0);}
});
test('castle animation never modifies the architectural vertices and stops its clocks when requested',()=>{
 const before=solid.map(o=>Array.from(o.geometry.attributes.position.array));castle.update(8,false,{quality:'high',player:{x:0,z:-10}});const time=castle.atmosphere.time;
 castle.update(90,true,{quality:'medium'});assert.equal(castle.atmosphere.time,time);assert.equal(solid.find(o=>o.material.uniforms?.time)?.material.uniforms.time.value,8);
 solid.forEach((o,i)=>assert.deepEqual(Array.from(o.geometry.attributes.position.array),before[i]));
 castle.update(NaN);assert.equal(castle.atmosphere.time,time);castle.update(9);assert.equal(castle.atmosphere.time,9);
});
test('mobile quality reduces light effects without removing the architectural silhouette',()=>{
 const countRibbons=()=>all.filter(o=>o.name.startsWith('palace-flowing-ribbon')&&o.visible).reduce((n,o)=>n+o.userData.strandCount,0);
 castle.setQuality('high');const high=castle.atmosphere.particleCount,highRibbons=countRibbons();
 castle.setQuality('medium');const medium=castle.atmosphere.particleCount,mediumRibbons=countRibbons();
 castle.setQuality('low');assert.ok(high>medium&&medium>castle.atmosphere.particleCount);assert.deepEqual([highRibbons,mediumRibbons,countRibbons()],[21,13,7]);
 assert.ok(solid.every(o=>o.visible));assert.ok(all.filter(o=>o.material.transparent).every(o=>o.userData.cameraIgnore&&o.material.depthWrite===false));
 const lights=[];castle.root.traverse(o=>{if(o.isPointLight)lights.push(o);});assert.ok(lights.every(o=>!o.visible));
});
test('approach lighting responds near the entrance and hidden effects do not advance',()=>{
 castle.setQuality('high');const lights=[];castle.root.traverse(o=>{if(o.isPointLight)lights.push(o);});
 for(let i=0;i<60;i++)castle.update(10+i*.016,false,{player:{x:0,z:-12}});assert.ok(lights.every(o=>o.intensity>16));
 for(let i=0;i<90;i++)castle.update(12+i*.016,false,{player:{x:100,z:100}});assert.ok(lights.every(o=>o.intensity<12.1));
 const time=castle.atmosphere.time;castle.root.visible=false;castle.update(30);assert.equal(castle.atmosphere.time,time);castle.root.visible=true;
});
