import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {materials,makeBuilder} from '../dist/architecture-kit.js';
import {addRyokanCraft,roundedRyokanSlab} from '../dist/ryokan-craft.js';
import {buildInteriors} from '../dist/interior-world.js';
import {interiorRooms,ryokanFixtures} from '../dist/interior-layout.js';
import {disposeOwnedScene} from '../dist/scene-resources.js';

test('rounded ryokan joinery keeps its finished dimensions and the usable tabletop height',()=>{
 const root=new T.Group(),m=materials();roundedRyokanSlab(makeBuilder(root),m.lightWood,7.98,.18,1.78,12,1.06,0,.15);root.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(root),size=bounds.getSize(new T.Vector3());
 assert.ok(Math.abs(size.x-7.98)<1e-5);assert.ok(Math.abs(size.z-1.78)<1e-5);assert.ok(Math.abs(bounds.max.y-1.15)<1e-5);
 const hits=new T.Raycaster(new T.Vector3(12,2,0),new T.Vector3(0,-1,0)).intersectObject(root,true);
 assert.ok(hits.some(hit=>Math.abs(hit.point.y-1.15)<1e-5));disposeOwnedScene(root);
});

test('new ryokan craft stays inside existing fixture footprints without adding lights',()=>{
 const root=new T.Group(),ceiling=new T.Group();root.add(ceiling);const detail=addRyokanCraft(root,materials(),{room:interiorRooms.ryokan,ceiling});root.updateMatrixWorld(true);
 const fixtures=detail.userData.fixtureIds.map(id=>ryokanFixtures.find(o=>o.id===id));let vertices=0,lights=0;
 const point=new T.Vector3();
 detail.traverse(object=>{
  if(object.isLight)lights++;
  if(!object.geometry)return;
  const positions=object.geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
   point.fromBufferAttribute(positions,i).applyMatrix4(object.matrixWorld);vertices++;
   assert.ok(Number.isFinite(point.x+point.y+point.z));
   assert.ok(fixtures.some(f=>Math.abs(point.x-f.x)<=f.rx+.0001&&Math.abs(point.z-f.z)<=f.rz+.0001),object.name+' extends into the walking route at '+point.toArray());
  }
 });
 assert.ok(vertices>0);assert.equal(lights,0);disposeOwnedScene(root);
});

test('raised ryokan roof and all four upper walls remain opaque above the stable camera envelope',()=>{
 const scene=new T.Scene(),asset=buildInteriors(scene,{lazy:true}),room=asset.ensure('ryokan'),layout=interiorRooms.ryokan;scene.updateMatrixWorld(true);
 const ceilingBounds=new T.Box3().setFromObject(room.ceiling);
 assert.ok(ceilingBounds.min.y>layout.ceiling-.45,'ceiling joinery stays outside the camera cap');
 assert.ok(ceilingBounds.max.y>=layout.ceiling,'the roof follows the authored room ceiling');
 const origin=new T.Vector3(layout.x,layout.ceiling-.55,layout.z);
 for(const direction of [new T.Vector3(1,0,0),new T.Vector3(-1,0,0),new T.Vector3(0,0,1),new T.Vector3(0,0,-1)]){
  const hits=new T.Raycaster(origin,direction,0,Math.max(layout.rx,layout.rz)+1).intersectObjects(room.walls,true);
  assert.ok(hits.some(hit=>!hit.object.material.transparent),'high camera cannot see through '+direction.toArray());
 }
 const above=new T.Raycaster(origin,new T.Vector3(0,1,0),0,2).intersectObject(room.ceiling,true);
 assert.ok(above.some(hit=>!hit.object.material.transparent));
 const serving=room.root.getObjectByName('chef-serving');assert.ok(serving);assert.equal(serving.visible,false,'empty seats do not start with a meal');
 asset.dispose();
});
