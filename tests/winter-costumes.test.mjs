import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';import {createYukata,createSnowfolk} from '../dist/winter-costumes.js';
import {createCompanion} from '../dist/companion.js';

test('the curved yukata fits the companion and leaves both eyes and mouth unobstructed',()=>{
 const robe=createYukata();robe.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(robe);assert.ok(bounds.min.y>=-.79&&bounds.max.x<1.05);assert.ok(bounds.max.y<.08);
 for(const [x,y]of [[-.205,.075],[.205,.075],[0,-.065]]){const ray=new T.Raycaster(new T.Vector3(x,y,2),new T.Vector3(0,0,-1),0,1.45);assert.equal(ray.intersectObject(robe,true).length,0,'face remains visible');}
 const ray=new T.Raycaster(new T.Vector3(0,-.32,2),new T.Vector3(0,0,-1),0,2);const hit=ray.intersectObject(robe,true)[0];assert.ok(hit&&hit.point.z>.61,'robe sits outside the plush body');
});

test('the snowfolk vendor has finite geometry and independent idle animation',()=>{
 const one=createSnowfolk(),two=createSnowfolk();one.update(4);two.update(0);assert.notEqual(one.children[1].rotation.y,two.children[1].rotation.y);one.update(NaN);assert.ok(Number.isFinite(one.children[1].rotation.y));
 one.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(one);assert.ok(bounds.max.y>2.5&&bounds.max.y<2.65);assert.ok(bounds.min.y>=-.011);assert.equal(one.userData.role,'vendor');
 for(const asset of [one,createYukata()]){let count=0,triangles=0;asset.traverse(o=>{if(!o.isMesh)return;count++;triangles+=o.geometry.attributes.position.count/3;for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));assert.notEqual(o.geometry.type,'BoxGeometry');});assert.ok(count<=16);assert.ok(triangles<25000);}
});

test('yukata sleeves share each procedural arm pivot through movement and activity poses',()=>{
 const matrix=new T.Matrix4(),shoulder=new T.Vector3(),hand=new T.Vector3(),cuff=new T.Vector3(),pivot=new T.Vector3(),axis=new T.Vector3();
 for(const detail of ['full','remote']){
  const pet=createCompanion({detail}),arms=pet.group.getObjectByName('plush-arms'),robe=pet.group.getObjectByName('resort-yukata');
  pet.customize({accessory:'santa,oval-sunglasses',roundness:90});pet.group.position.set(27,4,-80);pet.group.rotation.y=.82;
  for(const pose of [{still:true},{walking:true,phase:.8},{walking:true,phase:3.2,speed:8},{landing:1},{mode:'ferris'},{mode:'tea',time:9},{mode:'bath',speed:1.5,time:2},{gesture:'wave',time:3},{gesture:'joy',time:1},{heldItem:'coffee',gesture:'drink',time:2},{heldItem:'marshmallow',gesture:'roast',time:5}]){
   pet.pose({...pose,room:'ryokan'});pet.group.updateMatrixWorld(true);assert.equal(robe.visible,true);
   for(let i=0;i<2;i++){
    arms.getMatrixAt(i,matrix);matrix.premultiply(arms.matrixWorld);shoulder.set(0,-.215,0).applyMatrix4(matrix);hand.set(0,.215,0).applyMatrix4(matrix);
    const sleeve=robe.getObjectByName('yukata-sleeve-'+i);sleeve.getWorldPosition(pivot);cuff.set(0,1,0).applyMatrix4(sleeve.matrixWorld);
    assert.ok(pivot.distanceTo(shoulder)<1e-6,JSON.stringify(pose));
    axis.copy(hand).sub(shoulder).normalize();assert.ok(axis.dot(cuff.clone().sub(pivot).normalize())>.99999,'cuff follows the same arm axis');
    assert.ok(cuff.distanceTo(hand)>.07&&cuff.distanceTo(hand)<.11,'hand is exposed beyond the cuff');
   }
  }
  pet.pose({room:''});assert.equal(robe.visible,false);assert.equal(pet.group.getObjectByName('santa-hat').visible,true);assert.equal(pet.group.getObjectByName('oval-sunglasses').visible,true);
 }
});
