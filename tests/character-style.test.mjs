import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {createCompanion} from '../dist/companion.js';
import {normalizeWardrobe,toggleItem,selectedItems} from '../dist/wardrobe.js';

test('head and expression slots coexist, replace peers, and preserve helmet auto-equipping',()=>{
  const look=toggleItem(toggleItem('bunny-ears,eyes-flat,ribbon','eyes-goofy'),'bear-ears');
  assert.deepEqual(selectedItems(look),['eyes-goofy','bear-ears']);
  const equipped=normalizeWardrobe(`${look},helmet,goggles,board`);
  assert.ok(equipped.includes('helmet'));assert.ok(!equipped.includes('bear-ears'));assert.ok(equipped.includes('eyes-goofy'));
  assert.equal(normalizeWardrobe('santa,helmet,sunglasses,goggles,ski,board'),'helmet,goggles,board');
  assert.equal(toggleItem('eyes-flat','eyes-flat'),'none');assert.equal(toggleItem('cat-ears,eyes-round','none'),'none');
});

test('plush ear concepts share one bounded mesh, match body fur color, and clear spa headwear',()=>{
  const pet=createCompanion({detail:'remote'}),headband=pet.group.getObjectByName('plush-ear-headband'),geometries=new Set();let meshes=0;
  pet.group.traverse(object=>{if(object.isMesh)meshes++;});assert.ok(meshes<=90);
  for(const accessory of ['bunny-ears','cat-ears','bear-ears']){
    pet.customize({accessory,fur:'#e6c4de'});pet.pose({still:true});assert.equal(headband.visible,true);assert.equal(headband.userData.kind,accessory);geometries.add(headband.geometry);
    assert.equal(headband.material[0].color.getHexString(),'e6c4de');
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
  pet.customize({accessory:'eyes-goofy'});pet.pose({still:true});assert.equal(pet.eyes[0].material.color.getHexString(),'fff8ed');assert.equal(pet.eyes[0].children[0].position.y,pet.eyes[1].children[0].position.y);
  pet.customize({accessory:'eyes-wink'});assert.equal(normalizeWardrobe('eyes-wink'),'none');assert.ok(pet.eyes.every(eye=>eye.geometry.type==='SphereGeometry'));
  pet.customize({accessory:'eyes-happy,sunglasses'});pet.pose({mode:'ski',lean:1});assert.ok(pet.eyes.every(eye=>eye.geometry.type==='TubeGeometry'));assert.equal(pet.group.rotation.z,.2);assert.equal(pet.group.getObjectByName('sunglasses').visible,true);
  pet.customize({accessory:'none'});pet.pose({still:true});assert.equal(pet.eyes[0].geometry.type,'SphereGeometry');assert.equal(pet.eyes[0].scale.y,.111);assert.equal(pet.eyes[0].children[0].visible,true);
});

test('body and fur keep one local silhouette under motion, customization and night lighting',()=>{
 for(const detail of ['full','remote']){
  const pet=createCompanion({detail}),body=pet.group.getObjectByName('plush-body'),fur=pet.group.getObjectByName('plush-fur');
  assert.equal(fur.parent,body.parent);assert.equal(fur.material.isMeshBasicMaterial,undefined);assert.equal(body.material.emissiveIntensity,fur.material.emissiveIntensity);
  const original=Array.from(body.geometry.attributes.position.array),instances=Array.from(fur.instanceMatrix.array);
  pet.customize({fur:'#cfbde7'});assert.equal(body.material.color.getHexString(),fur.material.color.getHexString());assert.equal(body.material.emissive.getHexString(),fur.material.emissive.getHexString());
  for(const phase of [0,.8,2,4,8])for(const mode of ['','ski','lift']){
   pet.group.position.set(28,.86+Math.max(0,Math.sin(phase)),-48);pet.group.rotation.y=phase;pet.pose({mode,walking:mode==='',phase,time:phase,speed:8,lean:.6});pet.group.updateMatrixWorld(true);
   assert.deepEqual(body.matrixWorld.elements,fur.matrixWorld.elements);assert.ok(fur.matrixWorld.elements.every(Number.isFinite));
  }
  assert.deepEqual(Array.from(body.geometry.attributes.position.array),original);assert.deepEqual(Array.from(fur.instanceMatrix.array),instances);
 }
});

test('landing squash never inverts the body even when an upstream clock delivers invalid values',()=>{const p=createCompanion({detail:'remote'}),shape=p.group.getObjectByName('plush-body').parent;for(const landing of [-20,12,NaN,Infinity]){p.pose({landing});assert.ok(shape.scale.y>.7&&shape.scale.y<1.2);assert.ok(shape.scale.toArray().every(Number.isFinite));}});

test('opaque eyewear covers clay eyes and restores the chosen expression after removal',()=>{
 const pet=createCompanion({detail:'remote'});
 for(const expression of ['eyes-heart','eyes-star','eyes-goofy']){
  pet.customize({accessory:expression});const geometry=pet.eyes[0].geometry;
  for(const eyewear of ['goggles','sunglasses','oval-sunglasses','cat-eye-sunglasses']){
   pet.customize({accessory:expression+','+eyewear});assert.ok(pet.eyes.every(e=>!e.visible));
   for(const mode of ['','ski','lift']){pet.pose({mode,time:2,walking:true});assert.ok(pet.eyes.every(e=>!e.visible));}
   pet.pose({mode:'bath',still:true});assert.ok(pet.eyes.every(e=>e.visible));
   pet.pose({mode:'ski'});assert.ok(pet.eyes.every(e=>!e.visible));
   pet.customize({accessory:expression});pet.pose({still:true});assert.ok(pet.eyes.every(e=>e.visible));assert.equal(pet.eyes[0].geometry,geometry);
  }
  pet.customize({accessory:expression+',silver-glasses'});pet.pose({still:true});assert.ok(pet.eyes.every(e=>e.visible),'clear glasses preserve the eyes');
 }
 pet.dispose();
});

test('departing characters release previously selected eye, ear and held-item GPU resources exactly once',()=>{
 const pet=createCompanion({detail:'remote'}),resources=new Map();
 const capture=()=>pet.group.traverse(o=>{for(const resource of [o.geometry,...(o.material?(Array.isArray(o.material)?o.material:[o.material]):[])]){if(!resource||resource.userData.shared||resources.has(resource))continue;resources.set(resource,0);resource.addEventListener('dispose',()=>resources.set(resource,resources.get(resource)+1));}});
 for(const accessory of ['eyes-heart,bunny-ears','eyes-flat,cat-ears','eyes-star,bear-ears','eyes-happy','eyes-sleepy','eyes-goofy','none']){pet.customize({accessory});capture();}
 for(const heldItem of ['odeng','marshmallow','balloon','icecream']){pet.pose({heldItem});capture();}
 pet.customize({accessory:'none'});pet.pose({heldItem:''});pet.dispose();pet.dispose();assert.ok(resources.size>40);for(const count of resources.values())assert.equal(count,1);
});


test('reduced decorative motion preserves essential walking feet without body sway',()=>{
 const pet=createCompanion({detail:'remote'});pet.pose({walking:true,phase:0,time:1,still:true});const before=pet.feet.map(f=>f.position.toArray());
 pet.pose({walking:true,phase:Math.PI/2,time:1.2,still:true});assert.notDeepEqual(pet.feet.map(f=>f.position.toArray()),before);assert.equal(pet.group.rotation.z,0);
 pet.pose({walking:false,phase:3,time:2,still:true});for(const f of pet.feet)assert.equal(f.position.z,.14);pet.dispose();
});
