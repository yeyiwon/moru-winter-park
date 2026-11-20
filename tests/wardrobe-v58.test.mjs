import test from 'node:test';
import assert from 'node:assert/strict';
import {createCompanion} from '../dist/companion.js';
import {wardrobeSlots,toggleItem,validateAppearance,randomAppearance,selectedItems} from '../dist/wardrobe.js';
const base={fur:'#f4eee5',furTop:null,fluff:100,roundness:50};
test('first-entry random looks vary without starting in ski gear or combining hats and headsets',()=>{
 let seed=58;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296),colors=new Set(),heads=new Set();
 for(let i=0;i<100;i++){
  const look=randomAppearance(random),items=selectedItems(look.accessory);assert.deepEqual(validateAppearance(look),look);colors.add(look.fur);
  const head=items.filter(id=>wardrobeSlots.head.some(([key])=>key===id)||['headphones','cat-headphones'].includes(id));head.forEach(id=>heads.add(id));assert.ok(head.length<=1);assert.ok(!items.some(id=>['ski','board','helmet'].includes(id)));
 }
 assert.ok(colors.size>=15);assert.ok(heads.size>=12);
});
test('headsets and hats are exclusive while earbuds and the glowing nose combine; retired choices normalize safely',()=>{
 let accessory='tree-star,glow-nose,eyes-heart';
 accessory=toggleItem(accessory,'cat-headphones');assert.equal(accessory,'glow-nose,eyes-heart,cat-headphones');
 accessory=toggleItem(accessory,'witch-hat');assert.equal(accessory,'glow-nose,eyes-heart,witch-hat');
 accessory=toggleItem(accessory,'earbuds');assert.equal(accessory,'glow-nose,eyes-heart,witch-hat,earbuds');
 assert.equal(validateAppearance({...base,accessory}).accessory,accessory);
 assert.equal(validateAppearance({...base,accessory:'bangs-side,mushroom-cap,headphones,tree-star'}).accessory,'tree-star');
});
test('every new wearable renders finite shared geometry and changing choices does not allocate new meshes',()=>{
 const a=createCompanion({detail:'remote'}),b=createCompanion({detail:'remote'}),count=root=>{let n=0;root.traverse(()=>n++);return n;},initial=count(a.group);
 const ids=[...wardrobeSlots.head.slice(9),...wardrobeSlots.nose,...wardrobeSlots.audio].map(([id])=>id);
 for(const id of ids){a.customize({...base,accessory:id});b.customize({...base,accessory:id});const part=a.group.getObjectByName(id),peer=b.group.getObjectByName(id);assert.ok(part?.visible,id);assert.equal(part.geometry,peer.geometry,id);assert.ok(part.geometry.attributes.position.array.every(Number.isFinite),id);assert.ok(part.geometry.attributes.position.count<40000,id);assert.equal(count(a.group),initial);}
 a.dispose();b.customize({...base,accessory:'headphones,glow-nose'});assert.equal(b.group.getObjectByName('headphones').visible,true);assert.equal(b.group.getObjectByName('glow-nose').visible,true);b.dispose();
});

// The shared LED must transition smoothly without allocating per-avatar materials.
test('nose LED cycles through distinct colors and reduced motion returns to a steady red',async()=>{
 const {createStyleAccessories,updateNoseLight}=await import('../dist/character-accessories.js'),a=createStyleAccessories(),b=createStyleAccessories(),led=a['glow-nose'].material[15];
 assert.equal(led,b['glow-nose'].material[15]);const colors=new Set();for(let t=0;t<24;t+=4){updateNoseLight(t);colors.add(led.color.getHexString());assert.ok(led.color.equals(led.emissive));}
 assert.equal(colors.size,6);updateNoseLight(0);const initial=led.color.clone();updateNoseLight(24);assert.ok(led.color.equals(initial));updateNoseLight(13,true);assert.ok(led.color.equals(initial));
 updateNoseLight(3.999);const before=led.color.clone();updateNoseLight(4.001);assert.ok(Math.abs(before.r-led.color.r)+Math.abs(before.g-led.color.g)+Math.abs(before.b-led.color.b)<.001);
});
