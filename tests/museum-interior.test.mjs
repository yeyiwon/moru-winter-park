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
import {museumGalleries} from '../dist/district-layout.js';
import {museumFixtures,interiorRooms,interiorInteractions,interiorCanStandAt} from '../dist/interior-layout.js';
import {findPath} from '../dist/navigation.js';

function museum(t){
 const root=new T.Group(),asset=buildMuseumInterior(root,materials());
 t.after(()=>{asset.dispose();asset.atmosphere.dispose();disposeOwnedScene(root);});
 return{root,asset};
}

test('museum furniture stays within the original colliders and every exhibit retains a walkable approach',t=>{
 const {root}=museum(t);root.updateMatrixWorld(true);
 const furniture=root.children.filter(o=>o.userData.fixtureRadius),point=new T.Vector3();
 assert.equal(furniture.length,museumGalleries.length+1);
 assert.equal(interiorRooms.museum.ceiling,28);
 for(const group of furniture){
  const fixture=museumFixtures.find(f=>f.r&&f.x===group.position.x&&f.z===group.position.z);assert.ok(fixture,group.name);
  const inverse=new T.Matrix4().copy(group.matrixWorld).invert();
  group.traverse(o=>{if(!o.isMesh)return;const transform=new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld),positions=o.geometry.attributes.position;
   for(let i=0;i<positions.count;i++){point.fromBufferAttribute(positions,i).applyMatrix4(transform);assert.ok(Math.hypot(point.x,point.z)<=fixture.r+.001,group.name+' extends beyond its collider');}
  });
 }
 for(const spec of museumGalleries){
  const exhibit=root.getObjectByName('museum-gallery-'+spec.id),approach=interiorInteractions.find(p=>p.id===exhibit.userData.interactionId);
  assert.equal(approach.gallery,spec.id);assert.equal(exhibit.userData.exhibitId,spec.id);
  assert.ok(interiorCanStandAt(approach.x,approach.z));
  const route=findPath(interiorRooms.museum.entry,approach);assert.ok(route.length,spec.id);
  for(const p of route)assert.ok(interiorCanStandAt(p.x,p.z),spec.id);
 }
});

test('museum detail has bounded finite renderables and adds no realtime lights or transmission pass',t=>{
 const {root}=museum(t);let meshes=0,renderables=0,triangles=0,lights=0,transparent=0;
 root.traverse(o=>{
  if(o.geometry){renderables++;for(const a of Object.values(o.geometry.attributes))for(const v of a.array)assert.ok(Number.isFinite(v),o.name);}
  if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}
  if(o.isLight)lights++;
  for(const material of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){
   assert.equal(material.transmission||0,0,o.name+' adds a transmission pass');if(material.transparent){transparent++;assert.equal(material.depthWrite,false,o.name);}
  }
 });
 assert.ok(meshes<=90,meshes+' meshes');assert.ok(renderables<=94,renderables+' renderables');assert.ok(triangles<155000,triangles+' triangles');assert.ok(transparent<=14);assert.equal(lights,2);
 assert.ok(root.getObjectByName('museum-large-constellations'));assert.ok(root.getObjectByName('museum-science-crystal'));
});

test('reduced motion and inactive rooms keep authored poses, while quality keeps all four usable galleries',t=>{
 const interiors=buildInteriors(new T.Scene(),{lazy:true});t.after(()=>interiors.dispose());interiors.setActive('museum');const room=interiors.rooms.museum;
 const orbit=room.root.getObjectByName('museum-orbit-5'),object=room.root.getObjectByName('museum-learning-object-nature');
 interiors.update(1);interiors.update(1.1);const pose=[orbit.rotation.y,object.rotation.y];
 interiors.update(5,true);assert.deepEqual([orbit.rotation.y,object.rotation.y],pose);
 interiors.setActive(null);assert.equal(room.update(900),false);assert.deepEqual([orbit.rotation.y,object.rotation.y],pose);
 interiors.setActive('museum');interiors.update(900.1);assert.ok(orbit.rotation.y-pose[0]<.007,'returning to a room cannot jump the orbit to global time');
 const before=orbit.rotation.y;assert.equal(room.update(NaN),false);assert.equal(orbit.rotation.y,before);
 interiors.setQuality('low');assert.equal(room.root.getObjectByName('planetarium-stars').geometry.drawRange.count,100);
 for(const spec of museumGalleries)assert.equal(room.root.getObjectByName('museum-gallery-'+spec.id).visible,true);
 interiors.setQuality('high');assert.equal(room.root.getObjectByName('planetarium-stars').geometry.drawRange.count,320);
 assert.equal(room.puzzle([0,1,2]),true);for(let i=0;i<3;i++)assert.equal(room.root.getObjectByName('puzzle-ring-'+i).rotation.z,i*Math.PI/2);
 assert.equal(room.puzzle([NaN,0,1]),false);assert.equal(room.react('missing'),false);assert.equal(room.react('science'),true);
});

test('lazy museum disposal releases each owned geometry/material once and stops stale animation callbacks',()=>{
 const scene=new T.Scene(),interiors=buildInteriors(scene,{lazy:true});
 for(let cycle=0;cycle<2;cycle++){
  interiors.setActive('museum');const room=interiors.rooms.museum,resources=new Map();
  room.root.traverse(o=>{for(const resource of [o.geometry,...(o.material?(Array.isArray(o.material)?o.material:[o.material]):[])])if(resource&&!resources.has(resource)){resources.set(resource,0);resource.addEventListener('dispose',()=>resources.set(resource,resources.get(resource)+1));}});
  assert.equal(interiors.release('museum'),false);interiors.setActive(null);assert.equal(interiors.release('museum'),true);
  assert.equal(room.update(10),false);assert.equal(room.react('science'),false);assert.equal(room.puzzle([0,0,0]),false);
  assert.ok(resources.size>50);for(const count of resources.values())assert.equal(count,1);
  assert.equal(interiors.occluders.length,0);assert.equal(interiors.rooms.museum,undefined);
 }
 interiors.dispose();assert.equal(scene.children.length,0);
});

test('real gallery proximity opens its exhibit, central quiz, and private knowledge journal',async t=>{
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
 for(const spec of museumGalleries){
  const approach=interiorInteractions.find(p=>p.gallery===spec.id);experience.proximity(approach.x,approach.z);
  assert.equal(d.querySelector('#place-card').hidden,false);const actions=[...d.querySelectorAll('#place-actions button')];assert.ok(actions.length>=2);
  await actions[0].onclick();assert.equal(d.querySelector('#exhibit-panel').open,true);assert.equal(d.querySelector('#exhibit-panel h2').textContent,spec.name);
  await actions[1].onclick();assert.equal(d.querySelector('#exhibit-panel').open,false);assert.equal(d.querySelector('#quick-quiz').open,true);assert.ok(d.querySelector('#quick-question').textContent.trim());
  assert.equal(d.querySelectorAll('#quick-quiz .quiz-options button').length,4);d.querySelector('#quick-quiz').close();
 }
 w.openQuizJournal();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(d.querySelector('#quiz-journal').open,true);assert.ok(d.querySelector('#quiz-journal').textContent.includes('내'));assert.equal(d.querySelector('.journal-status').textContent,'아직 기록이 없어요.');d.querySelector('#quiz-journal').close();
});
