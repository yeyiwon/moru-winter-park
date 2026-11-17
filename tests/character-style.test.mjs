import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {createCompanion} from '../dist/companion.js';
import {normalizeWardrobe,toggleItem,selectedItems} from '../dist/wardrobe.js';

test('head and expression slots coexist, replace peers, and preserve helmet auto-equipping',()=>{
  const look=toggleItem(toggleItem('bunny-ears,eyes-flat,ribbon','eyes-goofy'),'bear-ears');
  assert.deepEqual(selectedItems(look),['ribbon','eyes-goofy','bear-ears']);
  const equipped=normalizeWardrobe(`${look},helmet,goggles,board`);
  assert.ok(equipped.includes('helmet'));assert.ok(!equipped.includes('bear-ears'));assert.ok(equipped.includes('eyes-goofy'));
  assert.equal(normalizeWardrobe('santa,helmet,sunglasses,goggles,ski,board'),'helmet,goggles,board');
  assert.equal(toggleItem('eyes-flat','eyes-flat'),'none');assert.equal(toggleItem('cat-ears,eyes-round','none'),'none');
});

test('plush ear concepts share one bounded mesh, keep independent black color, and clear spa headwear',()=>{
  const pet=createCompanion({detail:'remote'}),headband=pet.group.getObjectByName('plush-ear-headband'),geometries=new Set();let meshes=0;
  pet.group.traverse(object=>{if(object.isMesh)meshes++;});assert.ok(meshes<60);
  for(const accessory of ['bunny-ears','cat-ears','bear-ears']){
    pet.customize({accessory,fur:'#e6c4de'});pet.pose({still:true});assert.equal(headband.visible,true);assert.equal(headband.userData.kind,accessory);geometries.add(headband.geometry);
    assert.equal(headband.material[0].color.getHexString(),'17181e');
    for(const attribute of Object.values(headband.geometry.attributes))for(const value of attribute.array)assert.ok(Number.isFinite(value));
    const box=new T.Box3().setFromObject(pet.group);assert.ok(box.getSize(new T.Vector3()).y<3.2);
  }
  assert.equal(geometries.size,3);pet.pose({mode:'bath'});assert.equal(headband.visible,false);pet.pose();assert.equal(headband.visible,true);
  pet.customize({accessory:'bear-ears,helmet'});assert.equal(headband.visible,false);assert.equal(pet.group.getObjectByName('ski-helmet').visible,true);
});

test('expressions use rounded geometry and remain distinct while blinking and skiing',()=>{
  const pet=createCompanion({detail:'remote'});
  pet.customize({accessory:'eyes-flat'});pet.pose({time:5.6});assert.equal(pet.eyes[0].geometry.type,'CapsuleGeometry');assert.equal(pet.eyes[0].children[0].visible,false);assert.equal(pet.eyes[0].scale.y,1);
  pet.customize({accessory:'eyes-round'});pet.pose({still:true});assert.equal(pet.eyes[0].scale.x,pet.eyes[0].scale.y);
  pet.customize({accessory:'eyes-goofy'});pet.pose({still:true});assert.equal(pet.eyes[0].material.color.getHexString(),'fffaf3');assert.equal(pet.eyes[0].children[0].position.y,pet.eyes[1].children[0].position.y);
  pet.customize({accessory:'eyes-wink'});assert.equal(normalizeWardrobe('eyes-wink'),'none');assert.ok(pet.eyes.every(eye=>eye.geometry.type==='SphereGeometry'));
  pet.customize({accessory:'eyes-sleepy,sunglasses'});pet.pose({mode:'ski',lean:1});assert.ok(pet.eyes.every(eye=>eye.geometry.type==='TubeGeometry'));assert.equal(pet.group.rotation.z,.2);assert.equal(pet.group.getObjectByName('sunglasses').visible,true);
  pet.customize({accessory:'none'});pet.pose({still:true});assert.equal(pet.eyes[0].geometry.type,'SphereGeometry');assert.equal(pet.eyes[0].scale.y,.094);assert.equal(pet.eyes[0].children[0].visible,true);
});
