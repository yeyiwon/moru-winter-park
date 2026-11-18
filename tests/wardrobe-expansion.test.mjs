import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {createCompanion} from '../dist/companion.js';
import {createStyleAccessories} from '../dist/character-accessories.js';
import {normalizeWardrobe,toggleItem,selectedItems} from '../dist/wardrobe.js';

test('new eyewear and crown replace their own slots while the scarf and expression persist',()=>{
 let outfit='santa,sunglasses,eyes-happy,tail-cat';
 outfit=toggleItem(outfit,'oval-sunglasses');assert.equal(outfit,'santa,eyes-happy,tail-cat,oval-sunglasses');
 outfit=toggleItem(outfit,'cat-eye-sunglasses');assert.equal(outfit,'santa,eyes-happy,tail-cat,cat-eye-sunglasses');
 outfit=toggleItem(outfit,'crown');assert.deepEqual(selectedItems(outfit),['eyes-happy','tail-cat','cat-eye-sunglasses','crown']);
 assert.equal(normalizeWardrobe(outfit+',helmet,goggles'),'eyes-happy,tail-cat,helmet,goggles');
 assert.equal(toggleItem(outfit,'tail-cat'),'eyes-happy,cat-eye-sunglasses,crown');
 assert.equal(normalizeWardrobe('unknown,scarf,crown,crown,oval-sunglasses'),'crown,oval-sunglasses');
});

test('all sunglass lenses cover the existing eyes and the frames fit in front of the face',()=>{
 const styles=createStyleAccessories({detail:'remote'}),pet=createCompanion({detail:'remote'});
 for(const key of ['glasses','ovalGlasses','catEyeGlasses']){
  const mesh=styles[key];mesh.updateMatrixWorld(true);
  for(const eye of pet.eyes){
   const ray=new T.Raycaster(new T.Vector3(eye.position.x,eye.position.y,2),new T.Vector3(0,0,-1));
   const lens=ray.intersectObject(mesh).find(hit=>hit.face.materialIndex===1);
   assert.ok(lens,key+' lens covers the eye anchor');assert.ok(lens.point.z>.72&&lens.point.z<.81);
  }
  const positions=mesh.geometry.attributes.position,frame=mesh.geometry.groups.find(g=>g.materialIndex===0);let frontWidth=0;
  for(let i=frame.start;i<frame.start+frame.count;i++)if(positions.getZ(i)>.73)frontWidth=Math.max(frontWidth,Math.abs(positions.getX(i)));
  assert.ok(frontWidth<.51,'front rims stay inside the head silhouette');
 }
 assert.notDeepEqual(styles.glasses.geometry.attributes.position.array,styles.ovalGlasses.geometry.attributes.position.array);
 assert.notDeepEqual(styles.ovalGlasses.geometry.attributes.position.array,styles.catEyeGlasses.geometry.attributes.position.array);
});

test('new wearables remain attached in movement, clear for bathing, and restore afterward',()=>{
 const pet=createCompanion({detail:'remote'}),names=['sunglasses','oval-sunglasses','cat-eye-sunglasses','silver-glasses'];
 for(const item of ['oval-sunglasses','cat-eye-sunglasses']){
  pet.customize({accessory:item+',crown,tail-cat',fur:'#e6c4de'});
  const selected=pet.group.getObjectByName(item),crown=pet.group.getObjectByName('jewel-crown'),scarf=pet.group.getObjectByName('plush-tail'),anchor=selected.position.clone();
  assert.ok(Math.abs(pet.nameHeight-crown.geometry.boundingBox.max.y-.1)<1e-6);
  for(const state of [{walking:true,phase:1.2},{mode:'ski',speed:16,lean:.6},{still:true}]){
   pet.pose(state);assert.ok(selected.visible&&crown.visible&&scarf.visible);assert.ok(selected.position.equals(anchor));
   assert.equal(names.filter(name=>pet.group.getObjectByName(name).visible).length,1);
  }
  pet.pose({mode:'bath'});assert.ok(!selected.visible&&!crown.visible&&!scarf.visible);
  pet.pose();assert.ok(selected.visible&&crown.visible&&scarf.visible);
 }
 pet.customize({accessory:'none'});for(const name of [...names,'jewel-crown','plush-tail'])assert.equal(pet.group.getObjectByName(name).visible,false);
});
