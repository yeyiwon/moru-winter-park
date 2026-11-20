import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import * as T from '../dist/vendor/three.module.js';
import {buildMuseumInterior} from '../dist/museum-world.js';
import {materials} from '../dist/architecture-kit.js';
import {disposeOwnedScene} from '../dist/scene-resources.js';
import {buildInteriors} from '../dist/interior-world.js';
import {observatoryLayout,canStartObservatoryQuiz} from '../dist/observatory-layout.js';
import {museumFixtures,interiorRooms,interiorInteractions,interiorCanStandAt} from '../dist/interior-layout.js';
import {findPath} from '../dist/navigation.js';

function museum(t){
 const root=new T.Group(),asset=buildMuseumInterior(root,materials());
 t.after(()=>{asset.dispose();asset.atmosphere.dispose();disposeOwnedScene(root);});
 return{root,asset};
}

test('central reflector and one quiz console have connected walkable approaches',t=>{
 const {root}=museum(t);root.updateMatrixWorld(true);
 const telescope=root.getObjectByName('observatory-reflector'),fixture=observatoryLayout.telescope,point=new T.Vector3(),inverse=new T.Matrix4().copy(telescope.matrixWorld).invert();
 telescope.traverse(o=>{if(!o.isMesh)return;const matrix=new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld),positions=o.geometry.attributes.position;for(let i=0;i<positions.count;i++){point.fromBufferAttribute(positions,i).applyMatrix4(matrix);assert.ok(Math.hypot(point.x,point.z)<=fixture.r+.001);}});
 const quiz=interiorInteractions.filter(p=>p.kind==='quiz-station');assert.equal(quiz.length,1);assert.equal(interiorInteractions.some(p=>p.kind==='gallery'),false);
 assert.equal(root.getObjectByName('observatory-quiz-console').userData.interactionId,quiz[0].id);
 for(const goal of [quiz[0],{x:590,z:-8},{x:610,z:8},interiorRooms.museum.exit]){assert.ok(interiorCanStandAt(goal.x,goal.z));const route=findPath(interiorRooms.museum.entry,goal);assert.ok(route.length);for(const point of route)assert.ok(interiorCanStandAt(point.x,point.z));}
 assert.equal(interiorCanStandAt(600,0),false);assert.equal(interiorCanStandAt(600,6.4),false);
 assert.ok(canStartObservatoryQuiz(quiz[0]));assert.equal(canStartObservatoryQuiz({x:600,z:11}),false);
});

test('batched observatory has finite bounded geometry, two lights and no transmission pass',t=>{
 const {root}=museum(t);let meshes=0,triangles=0,lights=0;
 root.traverse(o=>{if(o.geometry)for(const a of Object.values(o.geometry.attributes))for(const v of a.array)assert.ok(Number.isFinite(v),o.name);if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}if(o.isLight)lights++;for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){assert.equal(m.transmission||0,0);if(m.transparent)assert.equal(m.depthWrite,false);}});
 assert.ok(meshes<45,meshes+' meshes');assert.ok(triangles<100000,triangles+' triangles');assert.equal(lights,2);
 assert.ok(root.getObjectByName('reflector-primary-mirror')||root.getObjectByName('observatory-reflector'));
 assert.ok(root.getObjectByName('observatory-real-stars'));assert.equal(root.getObjectByName('museum-orbit-5'),undefined);assert.equal(root.getObjectByName('museum-science-crystal'),undefined);
});

test('inactive sky stops updates, quality keeps real bright stars and reduced motion hides meteors',t=>{
 const interiors=buildInteriors(new T.Scene(),{lazy:true});t.after(()=>interiors.dispose());interiors.setActive('museum');const room=interiors.rooms.museum;
 assert.equal(room.update(1),true);interiors.setActive(null);assert.equal(room.update(900),false);interiors.setActive('museum');assert.equal(room.update(NaN),false);
 interiors.setQuality('low');assert.equal(room.root.getObjectByName('observatory-real-stars').geometry.drawRange.count,1800);
 interiors.setQuality('high');assert.ok(room.root.getObjectByName('observatory-real-stars').geometry.drawRange.count>=5000);
 assert.equal(room.puzzle([0,1,2]),false);assert.equal(room.react('science'),false);
});

test('lazy museum disposal releases each owned geometry/material once and stops stale animation callbacks',()=>{
 const scene=new T.Scene(),interiors=buildInteriors(scene,{lazy:true});
 for(let cycle=0;cycle<2;cycle++){
  interiors.setActive('museum');const room=interiors.rooms.museum,resources=new Map();
  room.root.traverse(o=>{for(const resource of [o.geometry,...(o.material?(Array.isArray(o.material)?o.material:[o.material]):[])])if(resource&&!resources.has(resource)){resources.set(resource,0);resource.addEventListener('dispose',()=>resources.set(resource,resources.get(resource)+1));}});
  assert.equal(interiors.release('museum'),false);interiors.setActive(null);assert.equal(interiors.release('museum'),true);
  assert.equal(room.update(10),false);assert.equal(room.react('science'),false);assert.equal(room.puzzle([0,0,0]),false);
  assert.ok(resources.size>20);for(const count of resources.values())assert.equal(count,1);
  assert.equal(interiors.occluders.length,0);assert.equal(interiors.rooms.museum,undefined);
 }
 interiors.dispose();assert.equal(scene.children.length,0);
});

test('one proximity point opens quiz while all other floor remains quiet and journal stays private',async t=>{
 const directory=path.resolve('dist'),dom=new JSDOM(fs.readFileSync(path.join(directory,'index.html'),'utf8'),{url:'https://winter.test',runScripts:'outside-only',pretendToBeVisual:true});t.after(()=>dom.window.close());
 const w=dom.window,d=w.document,context=dom.getInternalVMContext(),modules=new Map();
 w.matchMedia=()=>({matches:true});w.AbortSignal=AbortSignal;w.labGuestId='museum-guest';
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 const trivia=JSON.parse(fs.readFileSync(path.join(directory,'content/daily-trivia.json'),'utf8'));
 w.fetch=async url=>({ok:true,json:async()=>url==='/content/daily-trivia.json'?trivia:url==='/api/quiz'?{overrides:[]}:{records:[],summary:{total:0,correct:0,saved:0}}});
 function source(file){if(!modules.has(file))modules.set(file,new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file}));return modules.get(file);}
 async function load(name){const module=source(path.join(directory,name));if(module.status==='unlinked')await module.link((specifier,ref)=>source(path.resolve(path.dirname(ref.identifier),specifier)));if(module.status!=='evaluated')await module.evaluate();return module.namespace;}
 const {createWinterExperience}=await load('winter-experience.js');await load('quick-quiz.js');await load('exhibit-cards.js');
 const experience=createWinterExperience({rides:{},destinations:[],rideChair:{visible:false}},{equip(){}},()=>{});
 const approach=interiorInteractions.find(p=>p.kind==='quiz-station');
 w.labPlayerState={x:590,z:0};experience.proximity(590,0);assert.equal(d.querySelector('#place-card').hidden,true);await w.openQuickQuiz();assert.equal(d.querySelector('#quick-quiz').open,false);
 experience.proximity(approach.x,approach.z);assert.equal(d.querySelector('#place-card').hidden,false);assert.equal(d.querySelector('#quick-quiz').open,false);
 const actions=[...d.querySelectorAll('#place-actions button')];assert.equal(actions.length,1);assert.ok(actions[0].textContent.includes('퀴즈 풀기'));w.labPlayerState={x:approach.x,z:approach.z};
 await actions[0].onclick();assert.equal(d.querySelector('#quick-quiz').open,true);assert.equal(d.querySelectorAll('#quick-quiz .quiz-options button').length,4);d.querySelector('#quick-quiz').close();
 experience.proximity(approach.x,approach.z+2.01);assert.equal(d.querySelector('#place-card').hidden,true);w.labPlayerState={x:590,z:0};

 w.openQuizJournal();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(d.querySelector('#quiz-journal').open,true);assert.ok(d.querySelector('#quiz-journal').textContent.includes('내'));assert.equal(d.querySelector('.journal-start').disabled,true);assert.equal(d.querySelector('.journal-status').textContent,'아직 기록이 없어요.');d.querySelector('#quiz-journal').close();
});
