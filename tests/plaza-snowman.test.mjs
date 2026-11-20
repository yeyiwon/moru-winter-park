import test from 'node:test';import assert from 'node:assert/strict';import * as T from '../dist/vendor/three.module.js';
import {createPlazaSnowman} from '../dist/plaza-snowman.js';import {createFluffyGuide} from '../dist/fluffy-guide.js';import {parkGuideLayout} from '../dist/park-guide-layout.js';import {canStandAt} from '../dist/movement.js';
import {interiorInteractions} from '../dist/interior-layout.js';import {createParkGuides} from '../dist/park-guides.js';import {JSDOM} from 'jsdom';

test('exclusive fluffy NPC costumes share real walking bounds without greeting interactions',()=>{
 const scene=new T.Scene(),plaza=createPlazaSnowman(scene),scientist=createFluffyGuide(scene,{role:'scientist'}),tree=createFluffyGuide(scene,{role:'tree'});
 assert.deepEqual(plaza.collision,{x:parkGuideLayout.plaza.x,z:parkGuideLayout.plaza.z,r:parkGuideLayout.plaza.r});assert.equal(plaza.interact,undefined);
 assert.ok(scientist.root.getObjectByName('scientist-lab-coat'));assert.ok(scientist.root.getObjectByName('scientist-flask'));assert.ok(tree.root.getObjectByName('tree-keeper-crown'));assert.ok(tree.root.getObjectByName('held-tree-ornament'));
 assert.ok(!interiorInteractions.some(p=>p.kind==='guide'));for(const p of Object.values(parkGuideLayout))assert.equal(canStandAt(p.x,p.z),false);
 for(const npc of [plaza,scientist,tree]){npc.update(10,false,{x:2,z:4});npc.update(10.2,true,{x:2,z:4});npc.root.updateMatrixWorld(true);npc.root.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));for(const a of Object.values(o.geometry?.attributes||{}))assert.ok(a.array.every(Number.isFinite));});npc.dispose();npc.dispose();}assert.equal(scene.children.length,0);
});

test('nearby guide hints show once, expire, rearm on departure and never open a greeting button',()=>{
 const dom=new JSDOM('<body></body>'),scene=new T.Scene(),g=createParkGuides(scene,{document:dom.window.document}),p=parkGuideLayout.tree,hint=dom.window.document.querySelector('#park-guide-hint');
 g.update(0,true,{x:0,z:24});assert.equal(hint.hidden,true);g.update(1,true,{x:p.x,z:p.z+3});assert.equal(hint.hidden,false);assert.match(hint.textContent,/소원/);assert.equal(dom.window.document.querySelector('button'),null);
 g.update(8,true,{x:p.x,z:p.z+3});assert.equal(hint.hidden,true);g.update(9,true,{x:p.x,z:p.z+3});assert.equal(hint.hidden,true);
 g.update(10,true,{x:0,z:24});g.update(11,true,{x:p.x,z:p.z+3});assert.equal(hint.hidden,false);g.update(12,true,{x:p.x,z:p.z+3},{interior:true});assert.equal(hint.hidden,true);assert.ok(Object.values(g.guides).every(n=>!n.root.visible));g.dispose();assert.equal(scene.children.length,0);assert.equal(dom.window.document.querySelector('#park-guide-hint'),null);dom.window.close();
});
