import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {createCompanion} from '../dist/companion.js';
import {createStyleAccessories} from '../dist/character-accessories.js';
import {normalizeWardrobe,toggleItem} from '../dist/wardrobe.js';

test('fashion accessories share finite geometry with a bounded draw-group budget',()=>{
 const a=createStyleAccessories({detail:'remote'}),b=createStyleAccessories({detail:'remote'});
 for(const key of Object.keys(a)){
  const mesh=a[key];assert.equal(mesh.geometry,b[key].geometry,'preview and visitors reuse the same shapes');
  assert.ok(mesh.geometry.groups.length<=4);assert.ok(mesh.geometry.attributes.position.count<25000,key);
  for(const attribute of Object.values(mesh.geometry.attributes))for(const value of attribute.array)assert.ok(Number.isFinite(value),key);
  const normals=mesh.geometry.attributes.normal;let valid=0;for(let i=0;i<normals.count;i++)if(Math.hypot(normals.getX(i),normals.getY(i),normals.getZ(i))>.5)valid++;
  assert.ok(valid/normals.count>.98,key+' has usable lighting normals');
 }
 const pet=createCompanion({detail:'remote'});let meshes=0;pet.group.traverse(o=>{if(o.isMesh)meshes++;});assert.ok(meshes<80);
});

test('new headwear and eyewear replace their own slots and stay attached during activities',()=>{
 assert.equal(normalizeWardrobe('eyes-wink'),'none');
 assert.equal(toggleItem('santa,sunglasses,eyes-heart,scarf','silver-glasses'),'santa,eyes-heart,silver-glasses');
 assert.equal(toggleItem('santa,eyes-heart,scarf','crown'),'eyes-heart,crown');
 const pet=createCompanion({detail:'remote'});pet.customize({accessory:'silver-glasses,crown,soft-scarf'});
 const items=['silver-glasses','jewel-crown'].map(name=>pet.group.getObjectByName(name));
 assert.ok(items.every(m=>m.visible));assert.ok(pet.nameHeight>1.1);
 const anchors=items.map(m=>m.position.clone());for(const state of [{walking:true,phase:1.4},{mode:'ski',speed:20,lean:.7},{gesture:'drink',heldItem:'coffee',time:2}]){
  pet.pose(state);items.forEach((m,i)=>{assert.ok(m.position.equals(anchors[i]));assert.equal(m.visible,true);});
 }
 pet.pose({mode:'bath'});assert.equal(items[0].visible,false);assert.equal(items[1].visible,false);assert.equal(pet.group.getObjectByName('winter-scarf').visible,false);
 pet.pose();assert.ok(items.every(m=>m.visible));
});

test('collar sits below the face, broad cloth tails and hardware have real thickness',()=>{
 const {scarf,glasses,silverGlasses,crown,ribbon}=createStyleAccessories();
 const collar=scarf.geometry.boundingBox;assert.ok(collar.max.y>-.08);assert.ok(collar.max.y<.03);assert.ok(collar.min.y>-.85);assert.ok(collar.max.z>.7);
 assert.ok(glasses.geometry.boundingBox.min.z<0,'temples extend behind the head');
 assert.ok(silverGlasses.geometry.boundingBox.min.z<0,'silver glasses have side arms');
 assert.ok(crown.geometry.boundingBox.max.y<1.05);assert.ok(crown.geometry.boundingBox.min.y>.7);
 const ribbonSize=ribbon.geometry.boundingBox.getSize(new THREE.Vector3());assert.ok(ribbonSize.z>.12,'bow loops are open and dimensional');
});

test('heart, star and dazed eyes have balanced anchors and readable symmetrical pupils',()=>{
 const pet=createCompanion({detail:'remote'});
 for(const accessory of ['eyes-heart','eyes-star','eyes-goofy']){
  pet.customize({accessory});pet.pose({still:true});const [left,right]=pet.eyes;
  assert.equal(left.position.y,right.position.y);assert.equal(left.position.z,right.position.z);assert.ok(Math.abs(left.position.x+right.position.x)<1e-9);
  assert.deepEqual(left.scale.toArray(),right.scale.toArray());if(accessory==='eyes-goofy'){assert.ok(Math.abs(left.children[0].position.x+right.children[0].position.x)<1e-9);assert.equal(left.children[0].position.y,right.children[0].position.y);assert.equal(left.children[0].position.z,right.children[0].position.z);}else assert.deepEqual(left.children[0].position.toArray(),right.children[0].position.toArray());
  if(accessory!=='eyes-goofy'){left.geometry.computeBoundingBox();const box=left.geometry.boundingBox;assert.ok(box.getCenter(new THREE.Vector3()).length()<1e-6);assert.ok(box.getSize(new THREE.Vector3()).x>.25);assert.ok(box.getSize(new THREE.Vector3()).x<Math.abs(right.position.x-left.position.x)-.12);assert.ok(box.getSize(new THREE.Vector3()).z>.05);assert.ok(box.min.z+left.position.z>.69);}
 }
});
