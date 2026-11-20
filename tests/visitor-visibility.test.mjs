import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import * as T from '../dist/vendor/three.module.js';
import {createVisitors} from '../dist/visitors.js';
test('remote players keep their state while off-screen and reappear without changing their model',t=>{
 const dom=new JSDOM('<div id="visitor-labels"></div><div id="self-label" hidden></div>'),previous={window:globalThis.window,document:globalThis.document,innerHeight:globalThis.innerHeight,innerWidth:globalThis.innerWidth};
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,innerHeight:900,innerWidth:900});t.after(()=>{Object.assign(globalThis,previous);dom.window.close();});
 window.labPlayerState={x:0,y:.95,z:30};const scene=new T.Scene(),visitors=createVisitors(scene),camera=new T.PerspectiveCamera(50,1,.1,100);camera.position.set(0,4,45);camera.lookAt(0,1,30);camera.updateMatrixWorld();
 const state={id:'peer',name:'친구',x:0,y:.95,z:30,yaw:0,color:'#f4eee5',accessory:'bunny-ears',mode:'',gesture:''};
 const sync=()=>window.dispatchEvent(new window.CustomEvent('lab:visitors',{detail:[state]}));sync();visitors.update(1/60,1,camera);
 const body=scene.getObjectByName('plush-body'),fur=scene.getObjectByName('plush-fur'),geometry=body.geometry,label=document.querySelector('.visitor-label');assert.equal(visitors.effectStates().length,1);assert.ok(fur.count<1800);assert.equal(label.hidden,false);
 state.x=800;state.z=800;sync();visitors.update(1/60,2,camera);assert.equal(visitors.effectStates().length,0);assert.equal(label.hidden,true);assert.equal(body.geometry,geometry);
 state.x=1;state.z=30;sync();visitors.update(1/60,3,camera);assert.equal(visitors.effectStates().length,1);assert.equal(body.geometry,geometry);assert.equal(label.hidden,false);assert.equal(scene.getObjectByName('plush-ear-headband').visible,true);
 const sentAt=Date.now();window.dispatchEvent(new window.CustomEvent('lab:chat',{detail:{id:'peer',name:'친구',message:'즉시 말풍선',at:sentAt}}));const bubble=label.querySelector('.speech-bubble');assert.equal(bubble.textContent,'즉시 말풍선');assert.equal(bubble.hidden,false);
 state.chat='이전 메시지';state.chatAt=sentAt-1000;sync();assert.equal(bubble.textContent,'즉시 말풍선','late older pose cannot replace pushed chat');
 state.chat='';state.chatAt=0;sync();assert.equal(bubble.hidden,true,'explicit moderation clear remains supported');
 window.dispatchEvent(new window.CustomEvent('lab:visitors',{detail:[]}));assert.equal(visitors.effectStates().length,0);assert.equal(document.querySelector('.visitor-label'),null);
});
