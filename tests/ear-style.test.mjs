import test from 'node:test';
import assert from 'node:assert/strict';
import {createCompanion} from '../dist/companion.js';

test('black padded ears retain their color and contain a recessed front cup for every silhouette',()=>{
  const pet=createCompanion({detail:'remote'}),ears=pet.group.getObjectByName('plush-ear-headband'),shapes=new Set();
  for(const accessory of ['bunny-ears','cat-ears','bear-ears'])for(const fur of ['#ffffff','#e6c4de','#80bde3']){
    pet.customize({accessory,fur});assert.equal(ears.visible,true);assert.equal(ears.material[0].color.getHexString(),'17181e');assert.equal(ears.material[1].color.getHexString(),'35363e');
    const geometry=ears.geometry;shapes.add(geometry);assert.equal(geometry.groups.length,2);assert.ok(geometry.attributes.position.count<24000);
    for(const attribute of Object.values(geometry.attributes))for(const value of attribute.array)assert.ok(Number.isFinite(value));
    const cup=geometry.groups.find(group=>group.materialIndex===1),normals=geometry.attributes.normal,positions=geometry.attributes.position;let facing=0,innerFront=-Infinity,outerFront=-Infinity;
    for(let i=0;i<geometry.attributes.position.count;i++){if(i>=cup.start&&i<cup.start+cup.count){facing+=normals.getZ(i);innerFront=Math.max(innerFront,positions.getZ(i));}else outerFront=Math.max(outerFront,positions.getZ(i));}
    assert.ok(facing/cup.count>.3,'charcoal inset faces the camera');assert.ok(outerFront>innerFront+.005,'rolled black rim projects beyond the inset');
  }
  assert.equal(shapes.size,3);let meshes=0;pet.group.traverse(object=>{if(object.isMesh)meshes++;});assert.ok(meshes<60);
});

test('cached name height follows selected headwear and body proportions',()=>{
  const pet=createCompanion({detail:'remote'});pet.customize({accessory:'none'});assert.equal(pet.nameHeight,.9);
  const heights={};for(const accessory of ['bunny-ears','cat-ears','bear-ears']){pet.customize({accessory});heights[accessory]=pet.nameHeight;const top=pet.group.getObjectByName('plush-ear-headband').geometry.boundingBox.max.y;assert.ok(Math.abs(pet.nameHeight-top-.1)<.00001);}
  assert.ok(heights['bunny-ears']>heights['cat-ears']);assert.ok(heights['cat-ears']>.9);assert.ok(heights['bear-ears']>.9);
  pet.customize({accessory:'bunny-ears',roundness:100});assert.ok(pet.nameHeight<heights['bunny-ears']);pet.pose({mode:'bath'});assert.equal(pet.nameHeight,1.08);pet.pose();assert.ok(pet.nameHeight>1.5);
});
