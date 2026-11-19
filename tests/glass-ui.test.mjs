import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import * as T from '../dist/vendor/three.module.js';
import {createTreeOrnamentMeshes} from '../dist/tree-ornaments.js';
import {createGuestName,isNumberedGuest} from '../dist/guest-names.js';

function setup(t){
 const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://winter.test',runScripts:'outside-only',pretendToBeVisual:true});t.after(()=>dom.window.close());const w=dom.window;w.matchMedia=()=>({matches:true});w.HTMLDialogElement.prototype.show=function(){this.open=true;};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};w.joinSharedActivity=async()=>{};w.fetch=async()=>({ok:true,json:async()=>({wishes:[]})});
 const modules=new Map();async function load(file){const full=path.resolve(file);if(modules.has(full))return modules.get(full);const m=new vm.SourceTextModule(fs.readFileSync(full,'utf8'),{context:dom.getInternalVMContext(),identifier:full});modules.set(full,m);await m.link(s=>load(path.resolve(path.dirname(full),s)));return m;}
 return{w,d:w.document,run:async file=>{const m=await load(file);await m.evaluate();return m.namespace;}};
}
test('shared glass picker supports keyboard selection, outside close and dynamically added selects',async t=>{
 const {w,d,run}=setup(t);await run('dist/glass-controls.js');
 const native=d.querySelector('#weather-place'),trigger=native.nextElementSibling;let changes=0;native.addEventListener('change',()=>changes++);
 trigger.click();assert.equal(trigger.getAttribute('aria-expanded'),'true');assert.equal(d.querySelectorAll('.select-options [role=option]').length,native.options.length);
 trigger.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));trigger.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));assert.equal(native.value,'busan');assert.equal(changes,1);assert.match(trigger.textContent,/부산/);assert.equal(trigger.getAttribute('aria-expanded'),'false');
 trigger.click();d.body.dispatchEvent(new w.Event('pointerdown',{bubbles:true}));assert.equal(trigger.getAttribute('aria-expanded'),'false');
 native.value='tokyo';native.dispatchEvent(new w.Event('change',{bubbles:true}));assert.match(trigger.textContent,/도쿄/);native.value='seoul';native.dispatchEvent(new w.Event('lab:select-sync'));assert.match(trigger.textContent,/서울/);
 const extra=d.createElement('select');extra.innerHTML='<option>하나</option><option>둘</option>';d.body.append(extra);await new Promise(r=>setTimeout(r,0));assert.ok(extra.nextElementSibling.matches('.select-trigger'));
 trigger.click();trigger.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(trigger.getAttribute('aria-expanded'),'false');
});
test('wish composition retains selected shape, color and public sharing without dropdown ambiguity',async t=>{
 const {w,d,run}=setup(t);await run('dist/community-ui.js');let draft;w.submitTreeWish=async data=>{draft=data;return 'saved-wish';};w.openWishComposer();const form=d.querySelector('#wish-form');
 form.querySelector('[data-wish-kind=snowflake]').click();const color=form.querySelectorAll('[data-wish-color]')[2];color.click();assert.equal(color.getAttribute('aria-pressed'),'true');assert.equal(form.elements.kind.value,'snowflake');
 form.elements.message.value='  테스트 소원  ';form.dispatchEvent(new w.Event('submit',{cancelable:true}));await new Promise(r=>setTimeout(r,0));assert.equal(draft.message,'테스트 소원');assert.equal(draft.kind,'snowflake');assert.equal(draft.color,color.dataset.wishColor);assert.equal(draft.visibility,'public');assert.equal(d.querySelector('#wish-panel').open,false);
 w.openWishList();await new Promise(r=>setTimeout(r,0));assert.equal(d.querySelector('#wish-feed').open,true);assert.equal(d.body.classList.contains('studio-open'),false);assert.equal(d.querySelector('#wish-panel').open,false);
 const feed=d.querySelector('#wish-feed'),scroll=feed.querySelector('.panel-scroll');scroll.scrollTop=120;
 w.openWishComposer();assert.equal(feed.open,true);assert.equal(form.hidden,false);assert.equal(feed.hasAttribute('inert'),true);assert.equal(feed.getAttribute('aria-hidden'),'true');assert.equal(feed.dataset.panelSuspended,'true');
 d.querySelector('#wish-panel').close();await new Promise(r=>setTimeout(r,0));assert.equal(feed.open,true);assert.equal(feed.hasAttribute('inert'),false);assert.equal(feed.hasAttribute('aria-hidden'),false);assert.equal(feed.hasAttribute('data-panel-suspended'),false);assert.equal(scroll.scrollTop,120);
});
test('ornament instance colors are distinct before first render and tint their night emission',()=>{
 const root=new T.Group(),{meshes}=createTreeOrnamentMeshes(root),red=new T.Color('#d94371'),blue=new T.Color('#398cdd'),actual=new T.Color();
 const mesh=meshes.star;assert.ok(mesh.instanceColor);mesh.setColorAt(0,red);mesh.setColorAt(1,blue);mesh.getColorAt(0,actual);assert.ok(actual.distanceTo?actual.distanceTo(red)<1e-6:Math.abs(actual.r-red.r)<1e-6);mesh.getColorAt(1,actual);assert.ok(Math.abs(actual.b-blue.b)<1e-6);assert.notEqual(red.getHex(),blue.getHex());
 const shader={fragmentShader:T.ShaderLib.physical.fragmentShader};mesh.material.onBeforeCompile(shader);assert.match(shader.fragmentShader,/totalEmissiveRadiance \*= vColor.rgb/);assert.equal(mesh.material.emissive.getHexString(),'ffffff');assert.ok(mesh.material.iridescence<.2);
});
test('new automatic nicknames have no numeric guest suffix and manual names are left alone',()=>{
 for(let i=0;i<144;i++){let n=0;const name=createGuestName(()=>n++?i%12/12:Math.floor(i/12)/12);assert.ok(name.length<=16);assert.doesNotMatch(name,/손님|게스트|\d/);}
 assert.equal(isNumberedGuest('손님 1234'),true);assert.equal(isNumberedGuest('모루'),false);assert.equal(isNumberedGuest('예이원'),false);
});

test('one wish submission persists and displays its chosen decoration; failed saves keep the draft',async t=>{
 const {w,d,run}=setup(t),scene=new T.Scene();w.labSocialJoined=true;w.labPlayerState={x:66,y:1,z:38};let stored=[],posts=0,fail=false;
 w.fetch=async(url,options={})=>{if(options.method==='POST'){posts++;if(fail)return{ok:false,json:async()=>({error:'연결 실패'})};const body=JSON.parse(options.body),id='wish-'+posts;stored.push({...body,id,mine:1,createdAt:Date.now()});return{ok:true,json:async()=>({id})};}return{ok:true,json:async()=>({decorations:stored,wishes:[]})};};
 const {createSharedTree}=await run('dist/shared-tree.js');createSharedTree(scene);await run('dist/community-ui.js');w.openWishComposer();
 const form=d.querySelector('#wish-form');form.querySelector('[data-wish-kind=snowflake]').click();const color=form.querySelectorAll('[data-wish-color]')[3];color.click();form.elements.message.value='눈 오는 겨울';
 form.dispatchEvent(new w.Event('submit',{cancelable:true}));form.dispatchEvent(new w.Event('submit',{cancelable:true}));await new Promise(r=>setTimeout(r,30));
 assert.equal(posts,1);assert.equal(stored[0].visibility,'public');assert.equal(stored[0].color,color.dataset.wishColor);assert.equal(d.querySelector('#wish-panel').open,false);
 const instances=[];scene.traverse(o=>{if(o.isInstancedMesh&&o.count&&/^tree-(ornament|setting)-/.test(o.name))instances.push(o);});assert.equal(instances.length,2);for(const mesh of instances){assert.equal(mesh.count,1);assert.ok(Number.isFinite(mesh.boundingSphere.radius)&&mesh.boundingSphere.radius>0);}
 fail=true;w.openWishComposer();form.elements.message.value='저장 실패 후에도 남아야 하는 소원';form.dispatchEvent(new w.Event('submit',{cancelable:true}));await new Promise(r=>setTimeout(r,30));
 assert.equal(d.querySelector('#wish-panel').open,true);assert.equal(form.elements.message.value,'저장 실패 후에도 남아야 하는 소원');assert.match(form.querySelector('output[role=status]').textContent,/연결 실패/);assert.equal(stored.length,1);assert.equal(form.querySelector('[type=submit]').disabled,false);
});
