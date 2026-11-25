import test from 'node:test';
import assert from 'node:assert/strict';
import {wardrobeItems,normalizeWardrobe,validateAppearance,wireAppearance,readAppearance} from '../dist/wardrobe.js';

// The API release that validates saved looks can be older than the web client. A garment it does
// not know yet must still save, persist and reach other visitors.
const v65Items=wardrobeItems.filter(id=>id!=='dino-hood');
test('a garment newer than the API travels in a form the older API accepts and reads back intact',()=>{
 for(const fluff of [50,88,100]){
  const look=validateAppearance({fur:'#f4efe6',furTop:null,accessory:normalizeWardrobe('bunny-ears,eyes-sparkle,dino-hood'),fluff,roundness:38}),wire=wireAppearance(look);
  assert.ok(wire.accessory.split(',').every(id=>v65Items.includes(id)),'only ids the v65 catalog knows');
  assert.ok(wire.fluff>=50&&wire.fluff<=100&&Number.isFinite(wire.fluff));
  const back=readAppearance(JSON.parse(JSON.stringify(wire)));
  assert.equal(back.accessory,look.accessory);assert.ok(Number.isInteger(back.fluff)&&Math.abs(back.fluff-fluff)<=1);
  assert.deepEqual(validateAppearance(back),back);
 }
});
test('looks without such a garment are sent and read unchanged',()=>{
 const look={fur:'#f4efe6',furTop:null,accessory:'eyes-sparkle,tail-cat',fluff:88,roundness:38};
 assert.equal(wireAppearance(look),look);assert.equal(readAppearance(look),look);assert.deepEqual(readAppearance({}),{});
});
