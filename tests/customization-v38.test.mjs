import test from 'node:test';import assert from 'node:assert/strict';
import {createAppearanceDraft} from '../dist/appearance-draft.js';
import {normalizeWardrobe,toggleItem,validateAppearance,wardrobeSlots,furPalettes} from '../dist/wardrobe.js';
import {createCompanion} from '../dist/companion.js';
import {getEarGeometries} from '../dist/character-ears.js';
const base={fur:'#f4eee5',furTop:null,accessory:'none',fluff:100,roundness:50};
test('draft changes, cancellation, failed save and duplicate submission preserve committed appearance',async()=>{
 let committed={...base},resolve,reject,requests=0;const editor=createAppearanceDraft(base,{save:value=>{requests++;return new Promise((a,b)=>{resolve=()=>a(value);reject=b;});},commit:value=>committed=value});
 editor.edit({fur:'#17191e',accessory:'cat-ears,tail-cat'});assert.deepEqual(committed,base);editor.cancel();assert.deepEqual(editor.state().draft,base);
 editor.edit({accessory:'cat-ears,tail-cat'});const first=editor.save();assert.equal(editor.state().saving,true);assert.equal(await editor.save(),false);assert.equal(requests,1);editor.edit({fur:'#000000'});editor.cancel();reject(Error('offline'));assert.equal(await first,false);assert.deepEqual(committed,base);assert.equal(editor.state().dirty,true);assert.match(editor.state().error,/offline/);
 const retry=editor.save();resolve();assert.equal(await retry,true);assert.equal(committed.accessory,'cat-ears,tail-cat');assert.equal(editor.state().dirty,false);
});
test('one head slot and independent eyes, glasses and tails preserve combinations and server rejects unknown options before normalization',()=>{
 const outfit='cat-ears,silver-glasses,tail-cat,eyes-heart,ear-tone-cream';assert.equal(normalizeWardrobe(outfit),outfit);
 assert.equal(toggleItem(outfit,'crown'),outfit.replace('cat-ears,','')+',crown');assert.ok(furPalettes.flatMap(([,colors])=>colors).some(([color])=>color==='#17191e'));
 assert.throws(()=>validateAppearance({...base,accessory:'cat-ears,admin-mode'}));assert.throws(()=>validateAppearance({...base,roundness:101}));assert.throws(()=>validateAppearance({...base,fur:'red'}));assert.throws(()=>validateAppearance({...base,furTop:'red'}));assert.deepEqual(validateAppearance({...base,accessory:outfit}),{...base,accessory:outfit});
 for(const slot of Object.values(wardrobeSlots))assert.equal(normalizeWardrobe(slot.map(([id])=>id).join(',')).split(',').length,1);
});
test('new accessories retain a single model cache, symmetrical cat ears, separate colors and fixed narrow spacing',()=>{
 const a=createCompanion({detail:'remote'}),b=createCompanion({detail:'remote'}),ears=a.group.getObjectByName('plush-ear-headband'),geometry=getEarGeometries()['cat-ears'];
 a.customize({...base,fur:'#17191e',accessory:'cat-ears,ear-tone-lilac,silver-glasses,tail-cat'});b.customize({...base,accessory:'cat-ears'});
 assert.equal(ears.geometry,b.group.getObjectByName('plush-ear-headband').geometry);assert.equal(ears.material[0].color.getHexString(),'17191e');assert.equal(ears.material[1].color.getHexString(),'c1a3ce');assert.equal(b.group.getObjectByName('plush-ear-headband').material[0].color.getHexString(),'f4eee5');assert.equal(ears.scale.x,.9);
 const p=geometry.attributes.position;let left=0,right=0;for(let i=0;i<p.count;i++){if(p.getX(i)<0)left++;else if(p.getX(i)>0)right++;}assert.equal(left,right);assert.ok(Math.abs(geometry.boundingBox.min.x+geometry.boundingBox.max.x)<1e-6);
 for(const mode of ['','ski','lift']){a.pose({mode,walking:mode==='',phase:1,time:2});assert.equal(ears.visible,true);assert.equal(a.group.getObjectByName('plush-tail').visible,true);}
 let disposed=0;geometry.addEventListener('dispose',()=>disposed++);a.dispose();assert.equal(disposed,0);b.customize({...base,accessory:'cat-ears,eyes-star,goggles'});assert.ok(b.eyes.every(e=>!e.visible));b.dispose();assert.equal(disposed,0);
});

import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createLocalDatabase} from '../scripts/local-database.mjs';import {handleAPI} from '../server/api.js';
test('authenticated appearance save persists only the caller and restores through the existing guest session',async t=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'winter-wardrobe-')),db=createLocalDatabase(path.join(folder,'test.sqlite'));t.after(()=>{db.close();fs.rmSync(folder,{recursive:true,force:true});});
 await db.query({schema:fs.readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort().map(n=>fs.readFileSync('drizzle/'+n,'utf8')).join('\n')});
 const DB={prepare(sql){return{bind(...args){return{run:()=>db.query({sql,args}),all:()=>db.query({sql,args}),first:async()=>(await db.query({sql,args})).results[0]||null};}};}};
 const call=(route,body,cookie='',origin='https://winter.test')=>handleAPI(new Request('https://winter.test/api/'+route,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json',cookie},body:body===undefined?undefined:JSON.stringify(body)}),{DB});
 assert.equal((await call('appearance',base)).status,401);
 const joined=await call('join',{name:'꾸미기',room:'winter-plaza'}),cookie=joined.headers.get('Set-Cookie').split(';')[0],other=await call('join',{name:'다른 친구',room:'winter-plaza'}),otherCookie=other.headers.get('Set-Cookie').split(';')[0];
 const look={...base,fur:'#17191e',furTop:'#eeb7cb',accessory:'cat-ears,tail-cat,googly-glasses,eyes-star'};
 assert.equal((await call('appearance',look,cookie,'https://evil.test')).status,403);
 assert.equal((await call('appearance',{...look,accessory:'cat-ears,unknown'},cookie)).status,400);
 const result=await call('appearance',look,cookie);assert.equal(result.status,200);assert.deepEqual(await result.json(),look);
 const self=await (await call('access',undefined,cookie)).json(),peer=await (await call('access',undefined,otherCookie)).json();assert.equal(self.session.accessory,look.accessory);assert.equal(self.session.color,look.fur);assert.equal(self.session.colorTop,look.furTop);assert.equal(peer.session.accessory,'none');assert.equal(peer.session.colorTop,null);await call('appearance',{...look,furTop:null},cookie);assert.equal((await(await call('access',undefined,cookie)).json()).session.colorTop,null);
});

import * as THREE from '../dist/vendor/three.module.js';
import {createGooglyGlasses} from '../dist/googly-glasses.js';
test('googly pupils stay inside the black frames through turns and freeze with reduced motion',()=>{
 const parent=new THREE.Group(),glasses=createGooglyGlasses(parent),pupils=glasses.root.children[2],matrix=new THREE.Matrix4(),point=new THREE.Vector3();glasses.root.visible=true;
 assert.equal(glasses.root.children[0].material.color.getHexString(),'171b23');
 for(let frame=0;frame<180;frame++){
  glasses.update({time:frame/60,yaw:frame%2?3.1:-3.1,walking:true,phase:frame*.3});
  for(let eye=0;eye<2;eye++){pupils.getMatrixAt(eye,matrix);point.setFromMatrixPosition(matrix);assert.ok(Math.hypot(point.x-(eye?1:-1)*.225,point.y-.075)<.063);}
 }
 glasses.update({time:4,walking:true,phase:10,still:true});const fixed=[...pupils.instanceMatrix.array];glasses.update({time:5,walking:true,phase:20,yaw:2,still:true});assert.deepEqual([...pupils.instanceMatrix.array],fixed);
});

test('short cat tail stays low, plush, non-emissive and attached while walking and turning',()=>{
 const a=createCompanion({detail:'remote'});a.customize({...base,fur:'#42342a',accessory:'tail-cat'});
 const root=a.group.getObjectByName('plush-tail'),body=root.getObjectByName('tail-cat-body'),round=root.getObjectByName('tail-round-body');body.geometry.computeBoundingBox();const b=body.geometry.boundingBox;
 assert.ok(b.max.y<.4&&b.max.z<.16&&b.min.z>-.65);assert.ok(b.max.x<.8);assert.equal(body.material.color.getHexString(),'42342a');assert.equal(body.material.emissiveIntensity,0);assert.equal(round.geometry.parameters.radius,.17);
 const attached=root.position.clone();let min=Infinity,max=-Infinity;
 for(let i=0;i<240;i++){a.group.rotation.y=i<120?3.12:-3.12;a.pose({time:i/60,phase:i*.2,walking:true,speed:i<120?4:8});assert.deepEqual(root.position,attached);assert.ok(Math.abs(root.rotation.y)<.21);min=Math.min(min,root.rotation.y);max=Math.max(max,root.rotation.y);}
 assert.ok(max-min>.01);a.pose({time:5,walking:true,still:true});assert.equal(root.rotation.y,0);a.customize({...base,accessory:'tail-round'});assert.equal(root.getObjectByName('tail-cat').visible,false);assert.equal(root.getObjectByName('tail-round').visible,true);a.dispose();
});
